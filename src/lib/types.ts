/**
 * Types for the AI-travel-planning-agent-be API — grounded in real responses
 * captured against the running backend during development (not guessed from
 * source alone). Fields marked nullable reflect real ingested-data gaps
 * (e.g. hotels frequently missing price_per_night/address/coordinates).
 */

// ─── Chat ────────────────────────────────────────────────────────────────

export type ChatMessage = {
  role: "user" | "assistant" | "tool" | "system";
  content: string | null;
};

export type ClarificationField = {
  id: string;
  label: string;
  type: "text" | "number" | "date" | "select";
  placeholder?: string | null;
  min?: number | null;
  max?: number | null;
  options?: string[] | null;
};

export type ClarificationPrompt = {
  message: string;
  fields: ClarificationField[];
};

export type ChatContentType = "html" | "clarification" | "snippet" | "itinerary_redirect";

export type ChatResponse = {
  reply: string;
  messages: ChatMessage[];
  content_type: ChatContentType;
  clarification: ClarificationPrompt | null;
};

/** Parsed out of `reply` when content_type === "itinerary_redirect". */
export type ItineraryRedirectParams = {
  destination: string;
  days: number;
  budget: number;
  travelers: number;
  traveler_type: string;
  travel_start_date: string | null;
  /** Frequently null even when the user names an origin city — the LLM often
   *  skips search_flights entirely. Default to "Your City" in the UI. */
  origin_city: string | null;
};

// ─── Itinerary plan ─────────────────────────────────────────────────────

export type CostBreakdown = {
  flights: number;
  hotel: number;
  food: number;
  activities: number;
  local_transport: number;
};

export type CostSummary = {
  destination: string;
  travelers: number;
  days: number;
  breakdown: CostBreakdown;
  total_inr: number;
  per_person_inr: number;
};

export type Tip = {
  icon: string; // often not a real lucide-react name (e.g. "lucide-beach") — resolve defensively
  color: string;
  title: string;
  text: string;
};

export type Packing = {
  essentials: string[];
  weather_category: string;
  weather_icon: string;
  weather_items: string[];
  clothing: string[];
  health: string[];
};

export type QuickRef = {
  emergency: string;
  tourism_line: string;
  local_cab: string;
  weather: string;
  base_area: string;
  languages: string;
};

export type Activity = {
  time: string;
  type: string; // "Food" | "Sightseeing" | "Adventure" | "Leisure" | "Shopping" | "Travel" | "Departure" (not strictly enforced by backend)
  title: string;
  /** May contain <strong> tags — render with the shared sanitized-HTML renderer. */
  description: string;
  chips: string[];
  lat: number;
  lng: number;
  image_seed: string;
};

export type ItineraryDay = {
  number: number;
  date: string;
  weekday: string;
  title: string;
  subtitle: string;
  activities: Activity[];
};

/** Shape returned by the "hero" section edit — a subset of ItineraryPlanContent. */
export type HeroSectionData = {
  tagline: string;
  hero_image_seed: string;
  weather_label: string;
  weather_icon: string;
  hotel_area: string;
};

export type ItineraryPlanContent = {
  tagline: string;
  hero_image_seed: string;
  weather_label: string;
  weather_icon: string;
  hotel_area: string;
  tips: Tip[];
  packing: Packing;
  quick_ref: QuickRef;
  days: ItineraryDay[];
};

/** Sparse — often just the hotel. Build the map from days[].activities instead. */
export type MapLocation = {
  name: string;
  type: string;
  lat: number;
  lon: number;
  image_url: string;
  entry_fee?: number;
  duration_hours?: number;
};

/** Only present for destinations with no curated DB data (live Tavily web search
 * fallback) — empty for destinations with real hotel/restaurant/attraction data. */
export type WebSource = {
  title: string;
  url: string;
  snippet: string;
};

/**
 * A mechanical (not LLM-judged) signal for how grounded this itinerary is —
 * "verified" when real local hotel/restaurant/attraction data existed,
 * "web_researched" when the no-local-data fallback found something via
 * Wikipedia/web search, "estimated" when it's pure LLM knowledge. `anomalies`
 * are plain data-shape checks (day count mismatch, identical coordinates
 * across activities) computed backend-side, not opinions.
 *
 * Optional/absent-safe everywhere it's read: itineraries cached in
 * sessionStorage from before this field existed won't have it.
 */
export type GroundingReport = {
  level: "verified" | "web_researched" | "estimated";
  local_data_counts: { hotels: number; restaurants: number; attractions: number };
  anomalies: string[];
};

export type ItineraryPlan = {
  destination: string;
  destination_lat: number;
  destination_lon: number;
  days: number;
  budget: number;
  travelers: number;
  traveler_type: string;
  travel_start_date: string | null;
  hotel: string | null;
  hotel_image_url: string;
  cost_summary: CostSummary;
  itinerary_plan: ItineraryPlanContent;
  locations: MapLocation[];
  sources: WebSource[];
  grounding?: GroundingReport;
  format: "structured_plan";
};

export type FlightLeg = {
  flight_number: string;
  airline: string;
  status: string;
  departure: { airport: string | null; iata: string | null; terminal: string | null; scheduled: string | null; estimated: string | null };
  arrival: { airport: string | null; iata: string | null; terminal: string | null; scheduled: string | null; estimated: string | null };
};

export type FlightEstimate = {
  note: string;
  departure_iata: string;
  arrival_iata: string;
  estimated_fare_inr: number;
  source: "internal_estimate";
};

export type ItineraryPlanResponse = {
  plan: ItineraryPlan;
  flight: (FlightLeg | FlightEstimate)[] | null;
};

// ─── Destinations / hotels / restaurants / attractions ──────────────────

export type Destination = {
  id: string;
  name: string;
  country: string;
  country_code: string;
  continent: string;
  tagline: string;
  description?: string;
  image_url: string;
  tags: string[];
  avg_budget_per_day_inr: number;
  visa_free_for_indians: boolean;
  best_months: string[];
};

export type Hotel = {
  name: string;
  rating: number | null;
  price_per_night: number | null;
  address: string;
  amenities: string[];
  description: string;
  image_url: string;
  tags: string[];
  check_in: string;
  check_out: string;
  latitude: number | null;
  longitude: number | null;
};

export type Restaurant = {
  name: string;
  cuisine: string;
  avg_cost_per_person: number | null;
  rating: number | null;
  address: string;
  specialty: string;
  image_url: string;
  hours: string;
  price_range: string;
  tags: string[];
};

export type Attraction = {
  name: string;
  type: string;
  entry_fee: number;
  duration_hours: number;
  description: string;
  image_url: string;
  best_time: string;
  tips: string;
  tags: string[];
  latitude: number | null;
  longitude: number | null;
};

// ─── Weather / visa ───────────────────────────────────────────────────────

export type WeatherForecastDay = {
  date: string;
  max_temp: number;
  min_temp: number;
  weather_code: number;
};

export type WeatherResponse = {
  destination: string;
  current: { temperature_2m: number; weather_code: number };
  forecast: WeatherForecastDay[];
  error?: string;
};

export type VisaResponse = {
  from: string;
  to: string;
  required: boolean;
  type: string;
  days: number | null;
  processing_days: number | null;
  note?: string;
};

// ─── Save / share ─────────────────────────────────────────────────────────

/** Packing checklist state — category name -> {item index -> checked}. */
export type PackingChecklistState = Record<string, Record<number, boolean>>;

export type SavedItinerary = {
  id: string;
  share_token: string;
  title: string;
  destination?: string;
  days?: number;
  budget?: number;
  travelers?: number;
  traveler_type?: string;
  cover_image_url?: string;
  plan_json?: ItineraryPlan;
  html_content?: string;
  packing_state?: PackingChecklistState;
  is_public: boolean;
  view_count?: number;
  created_at?: string;
  error?: string;
};
