"use client";

import { useQuery } from "@tanstack/react-query";
import { Polyline, Tooltip } from "react-leaflet";
import { fetchRoute } from "@/lib/route";
import { dayTheme } from "@/lib/day-theme";

type Point = { lat: number; lng: number };

/**
 * One request per day (not per-leg) via OSRM multi-waypoint routing, cached by
 * TanStack Query so toggling a day's visibility doesn't re-fetch. Falls back to
 * a straight dashed line + estimated time (clearly distinguished visually) if
 * OSRM is unavailable — this is a public demo server, not guaranteed uptime.
 */
export function DayRoute({ dayNumber, points }: { dayNumber: number; points: Point[] }) {
  const t = dayTheme(dayNumber);

  const { data: route } = useQuery({
    queryKey: ["osrm-route", dayNumber, points.map((p) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`).join(";")],
    queryFn: () => fetchRoute(points),
    enabled: points.length >= 2,
    staleTime: Infinity,
    retry: 0,
  });

  if (!route || route.legs.length === 0) return null;

  return (
    <>
      <Polyline
        positions={route.geometry}
        pathOptions={{
          color: t.hex,
          weight: 3,
          opacity: route.isRealRoute ? 0.7 : 0.5,
          dashArray: route.isRealRoute ? undefined : "6,8",
        }}
      />
      {route.legs.map((leg, i) => {
        // Consecutive activities sometimes share coordinates (e.g. hotel check-in
        // followed by another activity also at the hotel) — a "0.0 km · 0 min"
        // label there is just noise, not useful info.
        if (leg.distanceKm < 0.05) return null;
        const from = points[i];
        const to = points[i + 1];
        const midpoint: [number, number] = [(from.lat + to.lat) / 2, (from.lng + to.lng) / 2];
        const label = `${leg.distanceKm.toFixed(1)} km · ${Math.round(leg.durationMin)} min${route.isRealRoute ? "" : " (est.)"}`;
        return (
          <Polyline key={i} positions={[midpoint, midpoint]} pathOptions={{ opacity: 0 }}>
            <Tooltip permanent direction="center" className="!bg-black/80 !border-white/10 !text-white !text-[10px] !px-2 !py-0.5 !rounded-full">
              {label}
            </Tooltip>
          </Polyline>
        );
      })}
    </>
  );
}
