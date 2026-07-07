"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { HeroSectionData, ItineraryDay, ItineraryPlan, ItineraryPlanResponse, Packing, QuickRef, Tip } from "@/lib/types";
import { ApiError, getItineraryGenerationStatus, startItineraryGeneration } from "@/lib/api-client";
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

  // sessionStorage is only readable client-side, so the very first client render
  // (hydration) must produce the same output as the server render — which never
  // has a cache — or React throws a hydration mismatch and remounts the whole
  // tree. Start at `undefined` on both server and client, and only read the real
  // cache from an effect (post-hydration). `mounted` also gates the generation
  // queries below so they don't fire a real generation request in the single tick
  // before the cache read resolves.
  const [mounted, setMounted] = useState(false);
  const [cachedResult, setCachedResult] = useState<ItineraryPlanResponse | undefined>(undefined);

  useEffect(() => {
    // sessionStorage is a real external system unavailable during SSR/the
    // hydration render — there's no render-time-adjustment equivalent here
    // (unlike the storageKey comparison below), an effect is the correct tool.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    try {
      const cached = sessionStorage.getItem(storageKey);
      setCachedResult(cached ? (JSON.parse(cached) as ItineraryPlanResponse) : undefined);
    } catch {
      setCachedResult(undefined);
    }
  }, [storageKey]);

  // Async job pattern: start generation (returns immediately), then poll for
  // completion. Exists because generation can take 30-60s+ — a single blocking
  // request risks exceeding serverless function duration limits. Skipped
  // entirely when a cached result already exists for these exact params.
  const { data: startData, error: startError } = useQuery({
    queryKey: [...queryKey, "start"],
    queryFn: () =>
      startItineraryGeneration({
        destination,
        days,
        budget,
        travelers,
        traveler_type: travelerType,
        travel_start_date: travelStartDate,
        origin_city: originCity !== "Your City" ? originCity : undefined,
      }),
    enabled: mounted && Boolean(destination) && !cachedResult,
    staleTime: Infinity,
    retry: 0,
  });

  const jobId = startData?.job_id;

  // Safety net: if the job row never reaches "complete"/"error" (e.g. the
  // background task's own DB write silently fails — exactly the kind of gap
  // an RLS/permissions issue can cause), polling would otherwise continue
  // forever with the loading skeleton stuck on screen and zero feedback to
  // the user that anything is wrong. Give it generous headroom over the
  // usual ~1.5-2min generation time, then surface an explicit error instead.
  const [timedOut, setTimedOut] = useState(false);
  // Reset adjusted during render when jobId changes (a genuinely new job to
  // wait on) rather than as a synchronous setState at the top of the effect
  // below — the effect itself legitimately needs to stay (a timer is exactly
  // the "subscribe to an external system, setState from its callback" case
  // the set-state-in-effect rule allows for).
  const [prevJobId, setPrevJobId] = useState(jobId);
  if (jobId !== prevJobId) {
    setPrevJobId(jobId);
    setTimedOut(false);
  }
  useEffect(() => {
    if (!jobId || cachedResult) return;
    const timer = setTimeout(() => setTimedOut(true), 4 * 60 * 1000);
    return () => clearTimeout(timer);
  }, [jobId, cachedResult]);

  const { data: statusData, error: statusError } = useQuery({
    queryKey: ["itinerary-job-status", jobId],
    queryFn: () => getItineraryGenerationStatus(jobId as string),
    enabled: Boolean(jobId) && !cachedResult && !timedOut,
    // Snappier than a typical poll — the backend now writes partial progress
    // (structure first, then each day-chunk) as it goes, so polling faster
    // makes the itinerary visibly stream in rather than jump once at the end.
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "complete" || status === "error" ? false : 1500;
    },
    retry: 0,
  });

  // Once the backend has written *any* progress — even mid-generation — render
  // it. `result` is non-null starting from "in_progress", not just "complete".
  const data = cachedResult ?? (statusData?.result ?? undefined);
  const jobFailed = statusData?.status === "error";
  const isError = !cachedResult && (jobFailed || Boolean(startError) || Boolean(statusError) || timedOut);
  const isComplete = Boolean(cachedResult) || statusData?.status === "complete";
  const isGenerating = !cachedResult && !isComplete && !isError && Boolean(data);
  // Full-page loader only for the brief window before the *first* progress
  // write lands (trip structure isn't ready yet, nothing meaningful to show).
  const isLoading = !mounted || (!cachedResult && !isError && !data);

  const [savedItinerary, setSavedItinerary] = useState<{ id: string; shareToken: string } | null>(null);

  // Section edits apply here rather than mutating the query cache directly. Reset
  // whenever a genuinely new itinerary is fetched (storageKey changes) — adjusted
  // during render (React's recommended pattern for "reset state when a prop
  // changes"), not in an effect, to avoid an extra cascading render pass.
  const [planOverride, setPlanOverride] = useState<ItineraryPlan | null>(null);
  const [prevStorageKey, setPrevStorageKey] = useState(storageKey);
  if (storageKey !== prevStorageKey) {
    setPrevStorageKey(storageKey);
    setPlanOverride(null);
  }

  const plan = planOverride ?? data?.plan;

  // Persists both the initial fetch AND any section edits made afterward — a
  // same-session reload should show what the user was actually looking at, not
  // silently revert their edits back to the original generation. Gated on
  // isComplete — otherwise every progress tick during generation would cache
  // a partial itinerary, and a reload mid-generation would get stuck showing
  // an itinerary that will never finish (polling only resumes from scratch).
  useEffect(() => {
    if (!isComplete || !data || !plan) return;
    try {
      sessionStorage.setItem(storageKey, JSON.stringify({ ...data, plan }));
    } catch {
      // storage full/blocked — reload will just regenerate, not fatal
    }
  }, [isComplete, data, plan, storageKey]);

  if (!destination) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center text-muted-foreground">
        No destination specified — start from the <Link href="/" className="text-primary underline">home page</Link>.
      </div>
    );
  }

  if (isLoading) return <ItineraryLoadingState destination={destination} />;

  if (isError) {
    const message = timedOut
      ? "This is taking much longer than expected, which usually means something went wrong on our end rather than the trip just being complex. Please try again."
      : (statusData?.error ??
        (startError instanceof ApiError ? startError.message : undefined) ??
        (statusError instanceof ApiError ? statusError.message : undefined) ??
        "Something went wrong generating this itinerary.");
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

  if (!plan) return null;
  const content = plan.itinerary_plan;

  function patchContent(patch: Partial<ItineraryPlan["itinerary_plan"]>) {
    setPlanOverride({
      ...(plan as ItineraryPlan),
      itinerary_plan: { ...(plan as ItineraryPlan).itinerary_plan, ...patch },
    });
  }

  function updateDay(dayIndex: number, newDay: ItineraryDay) {
    const days = [...content.days];
    days[dayIndex] = newDay;
    patchContent({ days });
  }

  // Editing (and saving) only make sense once generation has actually
  // finished — mid-stream, a day you'd edit might still get overwritten by
  // the next poll, and "Save" would persist a trip that's still missing days.
  return (
    <div>
      <ItineraryHero
        plan={plan}
        originCity={originCity}
        onUpdate={isComplete ? (data: HeroSectionData) => patchContent(data) : undefined}
      />

      <section id="map-section" className="max-w-6xl mx-auto px-6 py-20 avoid-print-break">
        <SectionHeading eyebrow="Interactive map" title="All Locations at a Glance" />
        <div className="mt-10">
          <ItineraryMap
            days={content.days}
            centerLat={plan.destination_lat}
            centerLng={plan.destination_lon}
            isGenerating={isGenerating}
          />
        </div>
      </section>

      <DayTimeline
        days={content.days}
        plan={plan}
        onDayUpdate={isComplete ? updateDay : undefined}
        totalDays={plan.days}
        isGenerating={isGenerating}
      />
      <BudgetSection cost={plan.cost_summary} hotelName={plan.hotel} days={plan.days} />
      <TipsSection
        tips={content.tips}
        destination={plan.destination}
        plan={plan}
        onUpdate={isComplete ? (data: { tips: Tip[] }) => patchContent({ tips: data.tips }) : undefined}
      />
      <PackingSection
        packing={content.packing}
        savedId={savedItinerary?.id}
        plan={plan}
        onUpdate={isComplete ? (data: Packing) => patchContent({ packing: data }) : undefined}
      />
      <SourcesSection sources={plan.sources} />
      <QuickRefSection
        qr={content.quick_ref}
        plan={plan}
        onUpdate={isComplete ? (data: QuickRef) => patchContent({ quick_ref: data }) : undefined}
      />

      {isComplete && (
        <ItineraryActionBar plan={plan} onSaved={(id, shareToken) => setSavedItinerary({ id, shareToken })} />
      )}
    </div>
  );
}
