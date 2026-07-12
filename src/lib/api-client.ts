/**
 * Single source of truth for talking to the backend — mirrors tools.py's role
 * on the backend side. Every endpoint the app uses goes through here.
 */
import type {
  Attraction,
  ChatMessage,
  ChatResponse,
  ClarificationPrompt,
  CostSummary,
  Destination,
  Hotel,
  ItineraryPlanResponse,
  PackingChecklistState,
  Restaurant,
  SavedItinerary,
  VisaResponse,
  WeatherResponse,
} from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * FastAPI's error body is `{detail: ...}`, but `detail` isn't always a
 * string: HTTPException(detail="...") gives a string, but a 422 from Pydantic
 * field validation (e.g. days > 30) gives an array of
 * {loc, msg, type} objects instead. String(thatArray) silently produced
 * "[object Object]" — confirmed live once the backend actually started
 * rejecting out-of-range requests instead of accepting anything.
 */
function extractErrorDetail(body: unknown): string | undefined {
  if (!body || typeof body !== "object" || !("detail" in body)) return undefined;
  const detail = (body as { detail: unknown }).detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((e) => {
        if (e && typeof e === "object" && "msg" in e) {
          const loc = Array.isArray((e as { loc?: unknown[] }).loc)
            ? (e as { loc: unknown[] }).loc.filter((p) => p !== "body").join(".")
            : undefined;
          return loc ? `${loc}: ${(e as { msg: unknown }).msg}` : String((e as { msg: unknown }).msg);
        }
        return typeof e === "string" ? e : JSON.stringify(e);
      })
      .join("; ");
  }
  return typeof detail === "object" ? JSON.stringify(detail) : String(detail);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (API_KEY) headers["X-API-Key"] = API_KEY;

  const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });

  if (!res.ok) {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = await res.text().catch(() => undefined);
    }
    const detail = extractErrorDetail(body) ?? res.statusText;
    throw new ApiError(detail, res.status, body);
  }

  return res.json() as Promise<T>;
}

function post<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: "POST", body: JSON.stringify(body) });
}

// ─── Chat ────────────────────────────────────────────────────────────────

export function sendChatMessage(messages: ChatMessage[]): Promise<ChatResponse> {
  return post<ChatResponse>("/chat", { messages });
}

// ─── Itinerary ───────────────────────────────────────────────────────────

export type ItineraryPlanRequest = {
  destination: string;
  days: number;
  budget: number;
  travelers?: number;
  traveler_type?: string;
  preferences?: string[];
  travel_start_date?: string | null;
  origin_city?: string | null;
  past_history?: string[];
  mode_of_transport?: string | null;
  /** How many of `travelers` are children — doesn't change the headcount
   *  math, purely a signal for family-friendly activity selection/pacing. */
  children?: number;
  /** Coarse "who's this for" — personal/honeymoon/romantic_getaway/solo/corporate. */
  trip_purpose?: string | null;
};

export function getItineraryPlan(req: ItineraryPlanRequest): Promise<ItineraryPlanResponse> {
  return post<ItineraryPlanResponse>("/api/itinerary/plan", req);
}

// Async job pattern — kicks off generation and returns immediately, poll for the
// result. Exists because generation takes 30-60s+ (chunked LLM calls), which
// risks exceeding serverless function duration limits if done as one blocking
// call. Needs schema_v3.sql applied on the backend (generation_jobs table).
// "in_progress" carries a partial `result` (structure ready, `days` still
// filling in chunk by chunk) — the backend writes these as it goes so the
// frontend can render the itinerary as it's generated instead of showing a
// blank loader for the full ~1.5-2min.
export type GenerationJobStatus = {
  id: string;
  status: "pending" | "in_progress" | "complete" | "error";
  result: ItineraryPlanResponse | null;
  error: string | null;
  /** Real backend-reported status during the window before `result` has anything
   *  to show yet: "researching" (fetching hotels/restaurants/weather/wikipedia) then
   *  "planning" (the trip-structure LLM call). Absent once `result` is populated —
   *  from there the existing day-by-day progress in `result.plan` is the real
   *  signal. Also absent on backends where the `phase` column hasn't been added yet
   *  (schema_v3.sql) — always treat as optional. */
  phase?: "researching" | "planning" | null;
};

export function startItineraryGeneration(req: ItineraryPlanRequest): Promise<{ job_id: string; status: string }> {
  return post("/api/itinerary/plan/start", req);
}

export function getItineraryGenerationStatus(jobId: string): Promise<GenerationJobStatus> {
  return request<GenerationJobStatus>(`/api/itinerary/plan/status/${jobId}`);
}

export type SectionRegenerateRequest = {
  section: "days" | "tips" | "packing" | "hero" | "quick_ref";
  section_index?: number;
  destination: string;
  days: number;
  budget: number;
  travelers?: number;
  traveler_type?: string;
  travel_start_date?: string | null;
  user_instructions?: string;
  current_plan?: unknown;
  /** False on resubmission after already answering one clarifying question —
   * forces the backend to give a direct answer instead of asking again. */
  allow_clarification?: boolean;
};

export type SectionRegenerateResponse<T> = {
  section: string;
  section_index: number | null;
  data?: T;
  clarification?: ClarificationPrompt;
};

export function regenerateSection<T>(req: SectionRegenerateRequest): Promise<SectionRegenerateResponse<T>> {
  return post(`/api/itinerary/section`, req);
}

export async function downloadItineraryCalendar(plan: unknown): Promise<Blob> {
  const res = await fetch(`${API_BASE_URL}/api/itinerary/calendar`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(API_KEY ? { "X-API-Key": API_KEY } : {}),
    },
    body: JSON.stringify({ plan }),
  });
  if (!res.ok) throw new ApiError("Failed to generate calendar", res.status);
  return res.blob();
}

// ─── Destinations / hotels / restaurants / attractions ──────────────────

export type DestinationsPage = { data: Destination[]; total: number; has_more: boolean };

export function getDestinations(params?: {
  search?: string;
  category?: string;
  purpose?: string;
  limit?: number;
  offset?: number;
}): Promise<DestinationsPage> {
  const qs = new URLSearchParams();
  if (params?.search) qs.set("search", params.search);
  if (params?.category) qs.set("category", params.category);
  if (params?.purpose) qs.set("purpose", params.purpose);
  if (params?.limit != null) qs.set("limit", String(params.limit));
  if (params?.offset != null) qs.set("offset", String(params.offset));
  const query = qs.toString();
  return request<DestinationsPage>(`/api/destinations${query ? `?${query}` : ""}`);
}

export function getDestinationsMeta(): Promise<{ categories: string[]; purposes: string[] }> {
  return request("/api/destinations/meta");
}

export function getDestination(id: string): Promise<Destination> {
  return request<Destination>(`/api/destinations/${id}`);
}

export function getHotels(destination: string, budget_per_night?: number, star_rating?: number): Promise<Hotel[]> {
  return post<Hotel[]>("/api/hotels", { destination, budget_per_night, star_rating });
}

export function getRestaurants(destination: string, cuisine?: string, budget_per_person?: number): Promise<Restaurant[]> {
  return post<Restaurant[]>("/api/restaurants", { destination, cuisine, budget_per_person });
}

export function getAttractions(destination: string, type?: string): Promise<Attraction[]> {
  return post<Attraction[]>("/api/attractions", { destination, type });
}

// ─── Weather / cost / visa ─────────────────────────────────────────────────

export function getWeather(destination: string): Promise<WeatherResponse> {
  return post<WeatherResponse>("/api/weather", { destination });
}

export function getCost(
  destination: string,
  days: number,
  travelers: number,
  hotel_budget_per_night = 3000,
  food_budget_per_day = 1500,
): Promise<CostSummary> {
  return post<CostSummary>("/api/cost", { destination, days, travelers, hotel_budget_per_night, food_budget_per_day });
}

export function getVisa(from_country: string, to_country: string): Promise<VisaResponse> {
  return post<VisaResponse>("/api/visa", { from_country, to_country });
}

// ─── Photos ───────────────────────────────────────────────────────────────

export async function getPhotoUrl(query: string, w = 800, h = 500): Promise<string> {
  try {
    const data = await request<{ url: string }>(`/api/photos?q=${encodeURIComponent(query)}&w=${w}&h=${h}`);
    return data.url;
  } catch {
    return `https://picsum.photos/seed/${encodeURIComponent(query.toLowerCase().replace(/\s+/g, "-"))}/${w}/${h}`;
  }
}

// ─── Save / share ─────────────────────────────────────────────────────────

export type SaveItineraryRequest = {
  title: string;
  destination?: string;
  days?: number;
  budget?: number;
  travelers?: number;
  traveler_type?: string;
  trip_purpose?: string | null;
  cover_image_url?: string;
  plan_json?: unknown;
  is_public?: boolean;
};

export function saveItinerary(req: SaveItineraryRequest): Promise<SavedItinerary> {
  return post<SavedItinerary>("/api/itineraries", req);
}

export function setItineraryVisibility(id: string, is_public: boolean): Promise<{ id: string; is_public: boolean }> {
  return request(`/api/itineraries/${id}/visibility`, {
    method: "PATCH",
    body: JSON.stringify({ is_public }),
  });
}

export function setPackingState(id: string, packing_state: PackingChecklistState): Promise<{ id: string; packing_state: PackingChecklistState }> {
  return request(`/api/itineraries/${id}/packing`, {
    method: "PATCH",
    body: JSON.stringify({ packing_state }),
  });
}

export function getSharedItinerary(token: string): Promise<SavedItinerary> {
  return request<SavedItinerary>(`/api/share/${token}`);
}

export function getPublicItineraries(limit = 20, offset = 0, destination?: string) {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (destination) params.set("destination", destination);
  return request<{ offset: number; limit: number; data: SavedItinerary[] }>(`/api/itineraries/public?${params}`);
}

/** This app has no login/auth system — every save belongs to the same fixed
 * "Guest" identity server-side, so this returns all of the guest's saved
 * trips (public and private alike), not just the current visitor's. */
export function getMyItineraries(limit = 50, offset = 0) {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  return request<{ offset: number; limit: number; data: SavedItinerary[] }>(`/api/itineraries?${params}`);
}

export function getItinerary(id: string): Promise<SavedItinerary> {
  return request<SavedItinerary>(`/api/itineraries/${id}`);
}
