"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import type { HeroSectionData, Packing, QuickRef, Tip } from "@/lib/types";
import type { ItineraryPlanRequest } from "@/lib/api-client";
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
import { Tier, TierSwitcher } from "@/components/itinerary/tier-switcher";
import { useItineraryGeneration } from "./use-itinerary-generation";

export function ItineraryContent() {
  const params = useSearchParams();

  const destination = params.get("destination") ?? "";
  const days = Number(params.get("days") ?? 3);
  const budget = Number(params.get("budget") ?? 30000);
  const travelers = Number(params.get("travelers") ?? 2);
  const travelerType = params.get("traveler_type") ?? "leisure";
  const travelStartDate = params.get("travel_start_date");
  const originCity = params.get("origin_city") ?? "Your City";

  const basePlanParams: ItineraryPlanRequest = {
    destination,
    days,
    budget,
    travelers,
    traveler_type: travelerType,
    travel_start_date: travelStartDate,
    origin_city: originCity !== "Your City" ? originCity : undefined,
  };
  // Alternate tiers: real second generations with adjusted budget (and, for
  // luxury, a nudged traveler_type so hotel/activity picks actually differ, not
  // just the number attached to the same plan). Not started automatically —
  // each only fires once the user actually switches to it (see `active` below).
  const tierParams: Record<Tier, ItineraryPlanRequest> = {
    primary: basePlanParams,
    budget: { ...basePlanParams, budget: Math.max(5000, Math.round(budget * 0.6)) },
    luxury: { ...basePlanParams, budget: Math.round(budget * 1.6), traveler_type: "luxury" },
  };

  const [tier, setTier] = useState<Tier>("primary");
  const [visitedTiers, setVisitedTiers] = useState<Set<Tier>>(new Set<Tier>(["primary"]));

  // Called unconditionally (rules of hooks) — `active` gates the network calls,
  // not the hook call itself, so switching tiers never remounts this component.
  const primaryGen = useItineraryGeneration(tierParams.primary, tier === "primary");
  const budgetGen = useItineraryGeneration(tierParams.budget, tier === "budget");
  const luxuryGen = useItineraryGeneration(tierParams.luxury, tier === "luxury");
  const gens = { primary: primaryGen, budget: budgetGen, luxury: luxuryGen };
  const gen = gens[tier];

  const loadingTiers = new Set(
    [...visitedTiers].filter((t) => t !== tier && !gens[t].isComplete && !gens[t].isError),
  );

  function handleTierChange(next: Tier) {
    setTier(next);
    setVisitedTiers((prev) => new Set(prev).add(next));
  }

  if (!destination) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center text-muted-foreground">
        No destination specified — start from the <Link href="/" className="text-primary underline">home page</Link>.
      </div>
    );
  }

  if (gen.isLoading) return <ItineraryLoadingState destination={destination} phase={gen.phase} />;

  if (gen.isError) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center">
        <SectionHeading eyebrow="Couldn't build this trip" title="Something went wrong" />
        <p className="text-muted-foreground mt-6">{gen.errorMessage}</p>
        <Link href="/" className="inline-block mt-6 text-primary underline">
          Try again from the home page
        </Link>
      </div>
    );
  }

  const plan = gen.plan;
  if (!plan) return null;
  const content = plan.itinerary_plan;

  // Editing (and saving) only make sense once generation has actually
  // finished — mid-stream, a day you'd edit might still get overwritten by
  // the next poll, and "Save" would persist a trip that's still missing days.
  return (
    <div>
      <ItineraryHero
        plan={plan}
        originCity={originCity}
        onUpdate={gen.isComplete ? (data: HeroSectionData) => gen.patchContent(data) : undefined}
      />

      {primaryGen.isComplete && (
        <div className="max-w-4xl mx-auto px-6 -mt-4 mb-4">
          <TierSwitcher active={tier} onChange={handleTierChange} loadingTiers={loadingTiers} />
        </div>
      )}

      <section id="map-section" className="max-w-6xl mx-auto px-6 py-20 avoid-print-break">
        <SectionHeading eyebrow="Interactive map" title="All Locations at a Glance" />
        <div className="mt-10">
          <ItineraryMap
            days={content.days}
            centerLat={plan.destination_lat}
            centerLng={plan.destination_lon}
            isGenerating={gen.isGenerating}
          />
        </div>
      </section>

      <DayTimeline
        days={content.days}
        plan={plan}
        onDayUpdate={gen.isComplete ? gen.updateDay : undefined}
        onActivityMove={gen.isComplete ? gen.moveActivity : undefined}
        totalDays={plan.days}
        isGenerating={gen.isGenerating}
      />
      <BudgetSection
        cost={plan.cost_summary}
        hotelName={plan.hotel}
        days={plan.days}
        accommodationOptions={gen.isComplete ? plan.accommodation_options : undefined}
        onSwapAccommodation={gen.isComplete ? gen.swapAccommodation : undefined}
      />
      <TipsSection
        tips={content.tips}
        destination={plan.destination}
        plan={plan}
        onUpdate={gen.isComplete ? (data: { tips: Tip[] }) => gen.patchContent({ tips: data.tips }) : undefined}
      />
      <PackingSection
        packing={content.packing}
        savedId={gen.savedItinerary?.id}
        plan={plan}
        onUpdate={gen.isComplete ? (data: Packing) => gen.patchContent({ packing: data }) : undefined}
      />
      <SourcesSection sources={plan.sources} />
      <QuickRefSection
        qr={content.quick_ref}
        plan={plan}
        onUpdate={gen.isComplete ? (data: QuickRef) => gen.patchContent({ quick_ref: data }) : undefined}
      />

      {gen.isComplete && (
        <ItineraryActionBar plan={plan} originCity={originCity} onSaved={(id, shareToken) => gen.setSavedItinerary({ id, shareToken })} />
      )}
    </div>
  );
}
