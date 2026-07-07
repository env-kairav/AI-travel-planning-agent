import { notFound } from "next/navigation";
import { ApiError, getSharedItinerary } from "@/lib/api-client";
import { BudgetSection } from "@/components/itinerary/budget-section";
import { DayTimeline, SectionHeading } from "@/components/itinerary/day-timeline";
import { ItineraryHero } from "@/components/itinerary/hero";
import { PackingSection } from "@/components/itinerary/packing-section";
import { QuickRefSection } from "@/components/itinerary/quick-ref-section";
import { SourcesSection } from "@/components/itinerary/sources-section";
import { TipsSection } from "@/components/itinerary/tips-section";
import { ItineraryMap } from "@/components/itinerary/itinerary-map-client";

export default async function SharedItineraryPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  let saved;
  try {
    saved = await getSharedItinerary(token);
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 403 || err.status === 503)) {
      notFound();
    }
    throw err;
  }

  const plan = saved.plan_json;
  if (!plan) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center">
        <SectionHeading eyebrow="Shared itinerary" title="No details available" />
        <p className="text-muted-foreground mt-6">
          This itinerary was saved without structured plan data — nothing to render here.
        </p>
      </div>
    );
  }

  const content = plan.itinerary_plan;

  return (
    <div>
      <ItineraryHero plan={plan} originCity="Your City" />
      <section className="max-w-6xl mx-auto px-6 py-20 print:hidden">
        <SectionHeading eyebrow="Interactive map" title="All Locations at a Glance" />
        <div className="mt-10">
          <ItineraryMap days={content.days} centerLat={plan.destination_lat} centerLng={plan.destination_lon} />
        </div>
      </section>
      <DayTimeline days={content.days} />
      <BudgetSection cost={plan.cost_summary} hotelName={plan.hotel} days={plan.days} />
      <TipsSection tips={content.tips} destination={plan.destination} />
      <PackingSection packing={content.packing} destination={plan.destination} />
      <SourcesSection sources={plan.sources} />
      <QuickRefSection qr={content.quick_ref} />
    </div>
  );
}
