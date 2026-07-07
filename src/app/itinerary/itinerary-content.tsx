"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getItineraryPlan } from "@/lib/api-client";
import { ApiError } from "@/lib/api-client";
import { BudgetSection } from "@/components/itinerary/budget-section";
import { DayTimeline, SectionHeading } from "@/components/itinerary/day-timeline";
import { ItineraryHero } from "@/components/itinerary/hero";
import { ItineraryLoadingState } from "@/components/itinerary/loading-state";
import { PackingSection } from "@/components/itinerary/packing-section";
import { QuickRefSection } from "@/components/itinerary/quick-ref-section";
import { TipsSection } from "@/components/itinerary/tips-section";
import { ItineraryActionBar } from "@/components/itinerary/action-bar";
import { ItineraryMap } from "@/components/itinerary/itinerary-map-client";

export function ItineraryContent() {
  const params = useSearchParams();

  const destination = params.get("destination") ?? "";
  const days = Number(params.get("days") ?? 3);
  const budget = Number(params.get("budget") ?? 30000);
  const travelers = Number(params.get("travelers") ?? 2);
  const travelerType = params.get("traveler_type") ?? "leisure";
  const travelStartDate = params.get("travel_start_date");
  const originCity = params.get("origin_city") ?? "Your City";

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["itinerary-plan", destination, days, budget, travelers, travelerType, travelStartDate],
    queryFn: () =>
      getItineraryPlan({
        destination,
        days,
        budget,
        travelers,
        traveler_type: travelerType,
        travel_start_date: travelStartDate,
        origin_city: originCity !== "Your City" ? originCity : undefined,
      }),
    enabled: Boolean(destination),
    retry: 1,
  });

  if (!destination) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center text-muted-foreground">
        No destination specified — start from the <Link href="/" className="text-primary underline">home page</Link>.
      </div>
    );
  }

  if (isLoading) return <ItineraryLoadingState destination={destination} />;

  if (isError) {
    const message = error instanceof ApiError ? error.message : "Something went wrong generating this itinerary.";
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center">
        <SectionHeading eyebrow="Couldn't build this trip" title="Something went wrong" />
        <p className="text-muted-foreground mt-6">{message}</p>
        <Link href="/" className="inline-block mt-6 text-primary underline">
          Try again from the home page
        </Link>
      </div>
    );
  }

  if (!data) return null;
  const { plan } = data;
  const content = plan.itinerary_plan;

  return (
    <div>
      <ItineraryHero plan={plan} originCity={originCity} />

      <section id="map-section" className="max-w-6xl mx-auto px-6 py-20">
        <SectionHeading eyebrow="Interactive map" title="All Locations at a Glance" />
        <div className="mt-10">
          <ItineraryMap days={content.days} centerLat={plan.destination_lat} centerLng={plan.destination_lon} />
        </div>
      </section>

      <DayTimeline days={content.days} />
      <BudgetSection cost={plan.cost_summary} hotelName={plan.hotel} days={plan.days} />
      <TipsSection tips={content.tips} destination={plan.destination} />
      <PackingSection packing={content.packing} destination={plan.destination} />
      <QuickRefSection qr={content.quick_ref} />

      <ItineraryActionBar plan={plan} />
    </div>
  );
}
