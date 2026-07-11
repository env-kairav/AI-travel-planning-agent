"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { DayRoute } from "@/components/itinerary/day-route";
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

function divIcon(dayNumber: number, label: number) {
  const t = dayTheme(dayNumber);
  return L.divIcon({
    className: "",
    html: `<div style="width:30px;height:30px;border-radius:50%;background:${t.hex};display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;border:2px solid rgba(255,255,255,.3);box-shadow:0 4px 15px rgba(0,0,0,.5)">${label}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  });
}

function FitBounds({ points }: { points: MapPoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [map, points]);
  return null;
}

/**
 * The @page layout printing uses (narrower content width, no scrollbars) is a
 * different size than the screen container Leaflet last measured, so its
 * cached tile/pane positions go stale and the map prints blank, cropped, or
 * offset unless it's told to re-measure. `beforeprint` fires synchronously
 * before the browser rasterizes the page, giving Leaflet one frame to
 * recompute against the print layout.
 */
function PrintReflow({ points }: { points: MapPoint[] }) {
  const map = useMap();
  useEffect(() => {
    function handleBeforePrint() {
      map.invalidateSize({ animate: false });
      if (points.length > 0) {
        const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]));
        map.fitBounds(bounds, { padding: [40, 40], animate: false });
      }
    }
    window.addEventListener("beforeprint", handleBeforePrint);
    return () => window.removeEventListener("beforeprint", handleBeforePrint);
  }, [map, points]);
  return null;
}

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
      </div>

      <div className="rounded-2xl overflow-hidden border border-border h-[550px] print:h-[380px] avoid-print-break">
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
          <MapContainer center={[centerLat, centerLng]} zoom={11} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; <a href=&quot;https://www.openstreetmap.org/copyright&quot;>OpenStreetMap</a> contributors"
              maxZoom={19}
            />
            <FitBounds points={visiblePoints.length ? visiblePoints : points} />
            <PrintReflow points={visiblePoints.length ? visiblePoints : points} />
            {dayNumbers
              .filter((n) => visibleDays.has(n))
              .map((n) => {
                const dayPoints = points.filter((p) => p.day === n);
                return <DayRoute key={n} dayNumber={n} points={dayPoints} />;
              })}
            {visiblePoints.map((p, i) => (
              <Marker key={p.id} position={[p.lat, p.lng]} icon={divIcon(p.day, i + 1)}>
                <Popup>
                  <div className="text-sm">
                    <p className="font-semibold mb-1">{p.name}</p>
                    <p className="text-xs text-neutral-500 mb-1">{p.time}</p>
                    <p className="text-xs">{p.desc}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>
      <p className="text-xs text-muted-foreground text-center mt-3">
        Solid lines are real driving routes; dashed lines are straight-line estimates for stops that couldn&apos;t be routed.
      </p>
    </div>
  );
}
