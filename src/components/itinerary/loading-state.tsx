import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const PHASE_COPY: Record<string, string> = {
  researching: "Researching {destination} — hotels, restaurants, weather…",
  planning: "Putting together your {destination} itinerary…",
};

/**
 * Itinerary generation is not fast — chunked LLM calls on the backend took
 * ~34s for a 2-day trip during development, longer for 7+ day trips. A
 * skeleton (not just a spinner) sets the right expectation.
 *
 * `phase`, when present, is a real backend-reported status ("researching" then
 * "planning") — not a simulated/timed rotation. Falls back to the generic line
 * when absent (older backend without the phase column, or the brief instant
 * before the first status poll resolves).
 */
export function ItineraryLoadingState({ destination, phase }: { destination: string; phase?: string | null }) {
  const copy = (phase && PHASE_COPY[phase])?.replace("{destination}", destination)
    ?? `Building your ${destination} itinerary — this can take up to a minute for longer trips…`;
  return (
    <div className="max-w-4xl mx-auto px-6 py-24 text-center">
      <div className="inline-flex items-center gap-2 text-accent-foreground mb-8">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm font-medium">{copy}</span>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-12 w-2/3 mx-auto" />
        <Skeleton className="h-4 w-1/2 mx-auto" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
