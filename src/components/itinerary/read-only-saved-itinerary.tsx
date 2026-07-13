import { SectionHeading } from "@/components/itinerary/day-timeline";
import { DayTimeline } from "@/components/itinerary/day-timeline";
import { ItineraryHero } from "@/components/itinerary/hero";
import { PackingSection } from "@/components/itinerary/packing-section";
import { QuickRefSection } from "@/components/itinerary/quick-ref-section";
import { SourcesSection } from "@/components/itinerary/sources-section";
import { TipsSection } from "@/components/itinerary/tips-section";
import { ItineraryMap } from "@/components/itinerary/itinerary-map-client";
import { BudgetSection } from "@/components/itinerary/budget-section";
import type { SavedItinerary } from "@/lib/types";

/**
 * A saved trip, rendered fully read-only — no onUpdate/onDayUpdate/
 * onActivityMove/onSwapAccommodation props passed to anything below, which is
 * what makes "past trips can't be edited" true by construction rather than by
 * a mode flag that has to be checked everywhere. Shared by /share/[token]
 * (public link) and /trips/[id] (the guest's own trip, public or private —
 * extracted from what was originally only the share page's JSX, since the two
 * views need to look and behave identically).
 */
export function ReadOnlySavedItinerary({ saved }: { saved: SavedItinerary }) {
  const plan = saved.plan_json;
  if (!plan) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center">
        <SectionHeading eyebrow="Saved itinerary" title="No details available" />
        <p className="text-muted-foreground mt-6">
          This itinerary was saved without structured plan data — nothing to render here.
        </p>
      </div>
    );
  }

  const content = plan.itinerary_plan;

  return (
    <div>
      <ItineraryHero plan={plan} originCity={plan.origin_city ?? "Your City"} />
      <section className="max-w-6xl mx-auto px-6 py-20 print:hidden">
        <SectionHeading eyebrow="Interactive map" title="All Locations at a Glance" />
        <div className="mt-10">
          <ItineraryMap days={content.days} centerLat={plan.destination_lat} centerLng={plan.destination_lon} />
        </div>
      </section>
      <DayTimeline days={content.days} />
      <BudgetSection cost={plan.cost_summary} hotelName={plan.hotel} days={plan.days} modeOfTransport={plan.mode_of_transport} />
      <TipsSection tips={content.tips} destination={plan.destination} />
      <PackingSection packing={content.packing} savedId={saved.id} initialState={saved.packing_state} />
      <SourcesSection sources={plan.sources} />
      <QuickRefSection qr={content.quick_ref} travelEssentials={plan.travel_essentials} />
    </div>
  );
}
