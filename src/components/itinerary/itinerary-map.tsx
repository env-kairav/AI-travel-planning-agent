"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import maplibregl from "maplibre-gl";
import { Loader2, Box } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { DayRouteLayer } from "@/components/itinerary/day-route";
import { dayTheme } from "@/lib/day-theme";
import type { ItineraryDay } from "@/lib/types";
import { cn } from "@/lib/utils";

type MapPoint = {
  id: string;
  day: number;
  name: string;
  time: string;
  desc: string;
  lat: number;
  lng: number;
};

/**
 * Map markers are built from itinerary_plan.days[].activities[] (real per-activity
 * coordinates, confirmed present in real captured responses) rather than the
 * top-level `locations[]` field, which is often sparse (just the hotel) — matches
 * what the backend's own render_html.py already does internally.
 */
function buildPoints(days: ItineraryDay[]): MapPoint[] {
  const points: MapPoint[] = [];
  let order = 0;
  for (const day of days) {
    for (const act of day.activities) {
      if (!act.lat || !act.lng) continue;
      points.push({
        id: `loc-${order}`,
        day: day.number,
        name: act.title,
        time: act.time,
        desc: act.description.replace(/<[^>]+>/g, "").slice(0, 100),
        lat: act.lat,
        lng: act.lng,
      });
      order++;
    }
  }
  return points;
}

function markerElement(dayNumber: number, label: number): HTMLDivElement {
  const t = dayTheme(dayNumber);
  const el = document.createElement("div");
  el.style.cssText = `width:30px;height:30px;border-radius:50%;background:${t.hex};display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;border:2px solid rgba(255,255,255,.3);box-shadow:0 4px 15px rgba(0,0,0,.5);cursor:pointer`;
  el.textContent = String(label);
  return el;
}

const DEFAULT_PITCH = 55;
const DEFAULT_BEARING = -17;

export function ItineraryMap({
  days,
  centerLat,
  centerLng,
  isGenerating,
}: {
  days: ItineraryDay[];
  centerLat: number;
  centerLng: number;
  isGenerating?: boolean;
}) {
  const points = useMemo(() => buildPoints(days), [days]);
  const dayNumbers = useMemo(() => days.map((d) => d.number), [days]);
  const [visibleDays, setVisibleDays] = useState<Set<number>>(new Set(dayNumbers));

  // While an itinerary is still streaming in, `days` grows over time — without
  // this, a day number that didn't exist yet when `visibleDays` was first
  // initialized would never be considered "visible" and its markers would be
  // silently filtered out once it finally arrived. Adjusted during render
  // (React's recommended pattern for "derive state from a changing prop")
  // rather than an effect, since this is pure derived state, not a sync with
  // any external system.
  const [prevDayNumbers, setPrevDayNumbers] = useState(dayNumbers);
  if (dayNumbers.length !== prevDayNumbers.length) {
    setPrevDayNumbers(dayNumbers);
    const next = new Set(visibleDays);
    for (const n of dayNumbers) next.add(n);
    setVisibleDays(next);
  }

  function toggleDay(n: number) {
    setVisibleDays((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  }

  const visiblePoints = points.filter((p) => visibleDays.has(p.day));
  const allVisible = visibleDays.size === dayNumbers.length;

  // ── MapLibre instance lifecycle ───────────────────────────────────────────
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [map, setMap] = useState<maplibregl.Map | null>(null);
  const [is3D, setIs3D] = useState(true);

  useEffect(() => {
    if (!containerRef.current || points.length === 0) return;

    // OpenFreeMap — free, no API key or account, no rate limits for reasonable
    // use (https://openfreemap.org). "Liberty" is its general-purpose vector
    // style — confirmed live it already ships a "building-3d" fill-extrusion
    // layer (minzoom 14) using real building footprint heights, which is what
    // makes tilting the camera actually show something three-dimensional
    // rather than just a flat map viewed at an angle. No custom layer needed.
    const instance = new maplibregl.Map({
      container: containerRef.current,
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: [centerLng, centerLat],
      zoom: 11,
      pitch: DEFAULT_PITCH,
      bearing: DEFAULT_BEARING,
      attributionControl: { compact: true },
    });

    instance.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
    instance.on("load", () => setMap(instance));

    mapRef.current = instance;
    return () => {
      instance.remove();
      mapRef.current = null;
      setMap(null);
    };
    // Map is created once per mount (points.length transitioning from 0 to
    // >0, i.e. once real coordinates exist) — center/day content updates flow
    // through separate effects below rather than recreating the whole map.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points.length > 0]);

  // Fit bounds whenever the visible point set changes.
  useEffect(() => {
    if (!map) return;
    const targetPoints = visiblePoints.length ? visiblePoints : points;
    if (targetPoints.length === 0) return;
    if (targetPoints.length === 1) {
      map.jumpTo({ center: [targetPoints[0].lng, targetPoints[0].lat] });
      return;
    }
    const bounds = targetPoints.reduce(
      (b, p) => b.extend([p.lng, p.lat]),
      new maplibregl.LngLatBounds([targetPoints[0].lng, targetPoints[0].lat], [targetPoints[0].lng, targetPoints[0].lat]),
    );
    map.fitBounds(bounds, { padding: 60, duration: 600 });
  }, [map, visiblePoints, points]);

  // Numbered day markers with click-to-popup.
  useEffect(() => {
    if (!map) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = visiblePoints.map((p, i) => {
      // Colors come from the .maplibregl-popup-content override in globals.css,
      // not inline here — confirmed live that relying on the library's own
      // default popup text color (unset/inherited) made this washed out and
      // barely legible against its default white background.
      const popup = new maplibregl.Popup({ offset: 20, closeButton: true, maxWidth: "240px" }).setHTML(
        `<div style="font-family:inherit"><p style="font-weight:600;margin-bottom:4px">${escapeHtml(p.name)}</p><p style="font-size:11px;color:#f97316;margin-bottom:4px">${escapeHtml(p.time)}</p><p style="font-size:12px;color:#c9c9c9">${escapeHtml(p.desc)}</p></div>`,
      );
      return new maplibregl.Marker({ element: markerElement(p.day, i + 1) })
        .setLngLat([p.lng, p.lat])
        .setPopup(popup)
        .addTo(map);
    });
    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
    };
  }, [map, visiblePoints]);

  // Print reflow — MapLibre's canvas needs an explicit resize + refit when the
  // print stylesheet swaps in a narrower layout, same issue Leaflet had here.
  useEffect(() => {
    if (!map) return;
    function handleBeforePrint() {
      map!.resize();
      const targetPoints = visiblePoints.length ? visiblePoints : points;
      if (targetPoints.length > 1) {
        const bounds = targetPoints.reduce(
          (b, p) => b.extend([p.lng, p.lat]),
          new maplibregl.LngLatBounds([targetPoints[0].lng, targetPoints[0].lat], [targetPoints[0].lng, targetPoints[0].lat]),
        );
        map!.fitBounds(bounds, { padding: 60, duration: 0 });
      }
    }
    window.addEventListener("beforeprint", handleBeforePrint);
    return () => window.removeEventListener("beforeprint", handleBeforePrint);
  }, [map, visiblePoints, points]);

  function toggle3D() {
    if (!map) return;
    const next = !is3D;
    setIs3D(next);
    map.easeTo({ pitch: next ? DEFAULT_PITCH : 0, bearing: next ? DEFAULT_BEARING : 0, duration: 500 });
  }

  return (
    <div>
      <div className="flex flex-wrap justify-center gap-2 mb-5 print:hidden">
        <button
          onClick={() => setVisibleDays(new Set(dayNumbers))}
          className={cn(
            "text-xs font-medium px-3.5 py-2 rounded-full border transition-colors",
            allVisible ? "border-primary/50 bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:text-foreground",
          )}
        >
          All days
        </button>
        {dayNumbers.map((n) => {
          const t = dayTheme(n);
          const active = visibleDays.has(n);
          return (
            <button
              key={n}
              onClick={() => toggleDay(n)}
              className={cn(
                "flex items-center gap-2 text-xs font-medium px-3.5 py-2 rounded-full border transition-colors",
                active ? "text-foreground" : "border-border text-muted-foreground opacity-50 hover:opacity-100",
              )}
              style={active ? { borderColor: `${t.hex}80`, background: `${t.hex}1a` } : undefined}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: t.hex }} />
              Day {n}
            </button>
          );
        })}
        <button
          onClick={toggle3D}
          disabled={!map}
          className={cn(
            "flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-full border transition-colors disabled:opacity-40",
            is3D ? "border-primary/50 bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:text-foreground",
          )}
          title="Toggle 3D tilt"
        >
          <Box className="w-3.5 h-3.5" />
          3D
        </button>
      </div>

      <div className="rounded-2xl overflow-hidden border border-border h-[550px] print:h-[380px] avoid-print-break relative">
        {points.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm bg-card gap-2">
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Locations will appear here as your itinerary is generated…
              </>
            ) : (
              "No mappable locations for this itinerary."
            )}
          </div>
        ) : (
          <div ref={containerRef} className="w-full h-full" />
        )}
        {points.length > 0 &&
          days.map((day) => (
            <DayRouteLayer
              key={day.number}
              map={map}
              dayNumber={day.number}
              points={points.filter((p) => p.day === day.number)}
              visible={visibleDays.has(day.number)}
            />
          ))}
      </div>
      <p className="text-xs text-muted-foreground text-center mt-3">
        Solid lines are real driving routes; dashed lines are straight-line estimates for stops that couldn&apos;t be routed. Drag with two fingers (or right-click drag) to tilt and rotate.
      </p>
    </div>
  );
}

function escapeHtml(s: string): string {
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}
