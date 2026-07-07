/**
 * Single source of truth for talking to the backend — mirrors tools.py's role
 * on the backend side. Every endpoint the app uses goes through here.
 */
import type {
  Attraction,
  ChatMessage,
  ChatResponse,
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
    const detail =
      body && typeof body === "object" && "detail" in body
        ? String((body as { detail: unknown }).detail)
        : res.statusText;
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
};

export function getItineraryPlan(req: ItineraryPlanRequest): Promise<ItineraryPlanResponse> {
  return post<ItineraryPlanResponse>("/api/itinerary/plan", req);
}

// Async job pattern — kicks off generation and returns immediately, poll for the
// result. Exists because generation takes 30-60s+ (chunked LLM calls), which
// risks exceeding serverless function duration limits if done as one blocking
// call. Needs schema_v3.sql applied on the backend (generation_jobs table).
export type GenerationJobStatus = {
  id: string;
  status: "pending" | "complete" | "error";
  result: ItineraryPlanResponse | null;
  error: string | null;
};

export function startItineraryGeneration(req: ItineraryPlanRequest): Promise<{ job_id: string; status: string }> {
  return post("/api/itinerary/plan/start", req);
}

export function getItineraryGenerationStatus(jobId: string): Promise<GenerationJobStatus> {
  return request<GenerationJobStatus>(`/api/itinerary/plan/status/${jobId}`);
}

export type SectionRegenerateRequest = {
  section: "days" | "tips" | "packing";
  section_index?: number;
  destination: string;
  days: number;
  budget: number;
  travelers?: number;
  traveler_type?: string;
  travel_start_date?: string | null;
  user_instructions?: string;
  current_plan?: unknown;
};

export function regenerateSection<T>(req: SectionRegenerateRequest): Promise<{ section: string; section_index: number | null; data: T }> {
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

export function getDestinations(): Promise<Destination[]> {
  return request<Destination[]>("/api/destinations");
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
