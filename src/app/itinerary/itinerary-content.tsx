"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import type { ItineraryPlanResponse } from "@/lib/types";
import { getItineraryPlan } from "@/lib/api-client";
import { ApiError } from "@/lib/api-client";
import { BudgetSection } from "@/components/itinerary/budget-section";
import { DayTimeline, SectionHeading } from "@/components/itinerary/day-timeline";
import { ItineraryHero } from "@/components/itinerary/hero";
import { ItineraryLoadingState } from "@/components/itinerary/loading-state";
import { PackingSection } from "@/components/itinerary/packing-section";
import { QuickRefSection } from "@/components/itinerary/quick-ref-section";
import { SourcesSection } from "@/components/itinerary/sources-section";
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

  const queryKey = ["itinerary-plan", destination, days, budget, travelers, travelerType, travelStartDate];
  // Reloading this page used to re-run the full ~30-60s LLM generation every
  // time (confirmed live: 47s), and since generation isn't deterministic could
  // even hand back a different itinerary than what the user was just looking
  // at. Cache the fetched result in sessionStorage keyed by the exact trip
  // params, so a reload of the *same* itinerary restores instantly instead of
  // regenerating. A genuinely new set of params (different trip) still fetches
  // fresh, since the storage key changes.
  const storageKey = `itinerary-plan:${JSON.stringify(queryKey)}`;

  const { data, isLoading, isError, error } = useQuery({
    queryKey,
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
    staleTime: Infinity,
    initialData: () => {
      if (typeof window === "undefined") return undefined;
      try {
        const cached = sessionStorage.getItem(storageKey);
        return cached ? (JSON.parse(cached) as ItineraryPlanResponse) : undefined;
      } catch {
        return undefined;
      }
    },
  });

  useEffect(() => {
    if (!data) return;
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(data));
    } catch {
      // storage full/blocked — reload will just regenerate, not fatal
    }
  }, [data, storageKey]);

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

      <section id="map-section" className="max-w-6xl mx-auto px-6 py-20 print:hidden">
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

      <ItineraryActionBar plan={plan} />
    </div>
  );
}
