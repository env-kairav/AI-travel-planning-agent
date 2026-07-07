"use client";

import dynamic from "next/dynamic";

export const ItineraryMap = dynamic(() => import("./itinerary-map").then((m) => m.ItineraryMap), {
  ssr: false,
  loading: () => <div className="h-[550px] rounded-2xl bg-card border border-border animate-pulse" />,
});
