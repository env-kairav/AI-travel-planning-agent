"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { AccommodationOption, ItineraryDay, ItineraryPlan, ItineraryPlanResponse } from "@/lib/types";
import { ApiError, getItineraryGenerationStatus, startItineraryGeneration, type ItineraryPlanRequest } from "@/lib/api-client";
import { recomputeCostForHotel } from "@/components/itinerary/accommodation-picker";

/**
 * Owns one itinerary's full lifecycle: async job start + poll, sessionStorage
 * caching, and section-edit state (day reorder, hero/tips/packing/quick_ref
 * edits, accommodation swap). Originally inline in ItineraryContent; extracted
 * so the alternate-tier switcher can hold 3 independent instances (primary/
 * budget/luxury) — each tier needs its own edit state, not just its own fetch,
 * since editing the Budget version must never bleed into the Luxury one.
 *
 * `active` gates the network calls only (start/poll) — the cheap sessionStorage
 * cache check always runs, so switching to a tier you've already generated once
 * this session renders instantly instead of re-fetching.
 */
export function useItineraryGeneration(params: ItineraryPlanRequest, active: boolean) {
  const queryKey = [
    "itinerary-plan",
    params.destination,
    params.days,
    params.budget,
    params.travelers,
    params.traveler_type,
    params.travel_start_date,
  ];
  const storageKey = `itinerary-plan:${JSON.stringify(queryKey)}`;

  const [mounted, setMounted] = useState(false);
  const [cachedResult, setCachedResult] = useState<ItineraryPlanResponse | undefined>(undefined);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    try {
      const cached = sessionStorage.getItem(storageKey);
      setCachedResult(cached ? (JSON.parse(cached) as ItineraryPlanResponse) : undefined);
    } catch {
      setCachedResult(undefined);
    }
  }, [storageKey]);

  const { data: startData, error: startError } = useQuery({
    queryKey: [...queryKey, "start"],
    queryFn: () => startItineraryGeneration(params),
    enabled: active && mounted && Boolean(params.destination) && !cachedResult,
    staleTime: Infinity,
    retry: 0,
  });

  const jobId = startData?.job_id;

  const [timedOut, setTimedOut] = useState(false);
  const [prevJobId, setPrevJobId] = useState(jobId);
  if (jobId !== prevJobId) {
    setPrevJobId(jobId);
    setTimedOut(false);
  }

  const { data: statusData, error: statusError } = useQuery({
    queryKey: ["itinerary-job-status", jobId],
    queryFn: () => getItineraryGenerationStatus(jobId as string),
    enabled: active && Boolean(jobId) && !cachedResult && !timedOut,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "complete" || status === "error" ? false : 1500;
    },
    retry: 0,
  });

  // Safety-net timeout for a job that never reaches a terminal state — NOT a
  // simple "4 minutes since the job started" timer. That was the actual bug
  // (confirmed live): the timer's cleanup only depended on jobId/cachedResult,
  // neither of which changes when a job finishes mid-session (cachedResult
  // only gets populated from sessionStorage on mount, not when a job
  // completes) — so it kept counting down and fired even on an itinerary that
  // had already finished loading successfully minutes earlier, just because
  // the tab was left open. Now explicitly cancelled once status reaches a
  // terminal state.
  const jobStatus = statusData?.status;
  useEffect(() => {
    if (!jobId || cachedResult || jobStatus === "complete" || jobStatus === "error") return;
    const timer = setTimeout(() => setTimedOut(true), 4 * 60 * 1000);
    return () => clearTimeout(timer);
  }, [jobId, cachedResult, jobStatus]);

  const data = cachedResult ?? (statusData?.result ?? undefined);
  const jobFailed = statusData?.status === "error";
  const isError = !cachedResult && (jobFailed || Boolean(startError) || Boolean(statusError) || timedOut);
  const isComplete = Boolean(cachedResult) || statusData?.status === "complete";
  const isGenerating = !cachedResult && !isComplete && !isError && Boolean(data);
  const isLoading = !mounted || (!cachedResult && !isError && !data);

  const [savedItinerary, setSavedItinerary] = useState<{ id: string; shareToken: string } | null>(null);

  const [planOverride, setPlanOverride] = useState<ItineraryPlan | null>(null);
  const [prevStorageKey, setPrevStorageKey] = useState(storageKey);
  if (storageKey !== prevStorageKey) {
    setPrevStorageKey(storageKey);
    setPlanOverride(null);
    setSavedItinerary(null);
  }

  const plan = planOverride ?? data?.plan;

  useEffect(() => {
    if (!isComplete || !data || !plan) return;
    try {
      sessionStorage.setItem(storageKey, JSON.stringify({ ...data, plan }));
    } catch {
      // storage full/blocked — reload will just regenerate, not fatal
    }
  }, [isComplete, data, plan, storageKey]);

  function patchContent(patch: Partial<ItineraryPlan["itinerary_plan"]>) {
    if (!plan) return;
    setPlanOverride({ ...plan, itinerary_plan: { ...plan.itinerary_plan, ...patch } });
  }

  function patchPlan(patch: Partial<ItineraryPlan>) {
    if (!plan) return;
    setPlanOverride({ ...plan, ...patch });
  }

  function swapAccommodation(option: AccommodationOption) {
    if (!plan) return;
    // Real hotel rows frequently have no price_per_night (a known pre-existing
    // data gap — see the Hotel type comment in lib/types.ts). Mirror the
    // backend's own fallback (estimate_trip_cost: `price_per_night or 5000`)
    // rather than silently refusing the swap for hotels priced this way.
    const pricePerNight = option.price_per_night ?? 5000;
    patchPlan({
      hotel: option.name,
      hotel_image_url: option.image_url,
      hotel_price_per_night: pricePerNight,
      cost_summary: recomputeCostForHotel(plan.cost_summary, pricePerNight, plan.days),
    });
  }

  function updateDay(dayIndex: number, newDay: ItineraryDay) {
    if (!plan) return;
    const days = [...plan.itinerary_plan.days];
    days[dayIndex] = newDay;
    patchContent({ days });
  }

  function moveActivity(
    from: { dayIndex: number; actIndex: number },
    to: { dayIndex: number; actIndex: number },
  ) {
    if (!plan) return;
    if (from.dayIndex === to.dayIndex && from.actIndex === to.actIndex) return;
    const days = plan.itinerary_plan.days.map((d) => ({ ...d, activities: [...d.activities] }));
    const [moved] = days[from.dayIndex].activities.splice(from.actIndex, 1);
    // Removing the source item shifts every later index in the *same* day down
    // by one — correct the insertion point so it lands where the pointer was,
    // not one slot further.
    const insertAt = from.dayIndex === to.dayIndex && from.actIndex < to.actIndex ? to.actIndex - 1 : to.actIndex;
    days[to.dayIndex].activities.splice(insertAt, 0, moved);
    patchContent({ days });
    if (from.dayIndex !== to.dayIndex) {
      toast("Moved to a different day — its time may no longer fit; use the edit button to adjust it.");
    }
  }

  const errorMessage = timedOut
    ? "This is taking much longer than expected, which usually means something went wrong on our end rather than the trip just being complex. Please try again."
    : (statusData?.error ??
      (startError instanceof ApiError ? startError.message : undefined) ??
      (statusError instanceof ApiError ? statusError.message : undefined) ??
      "Something went wrong generating this itinerary.");

  return {
    plan,
    phase: statusData?.phase,
    isLoading,
    isError,
    isComplete,
    isGenerating,
    errorMessage,
    savedItinerary,
    setSavedItinerary,
    patchContent,
    patchPlan,
    swapAccommodation,
    updateDay,
    moveActivity,
  };
}
