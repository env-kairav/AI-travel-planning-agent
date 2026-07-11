"use client";

import { useQuery } from "@tanstack/react-query";
import maplibregl from "maplibre-gl";
import { useEffect, useRef } from "react";
import { fetchRoute } from "@/lib/route";
import { dayTheme } from "@/lib/day-theme";

type Point = { lat: number; lng: number };

/**
 * Imperatively manages one day's GeoJSON line source/layer plus midpoint
 * distance labels on a shared MapLibre map instance — MapLibre isn't a
 * declarative React child-component API like react-leaflet was, so this owns
 * its own source/layer/marker lifecycle in an effect instead of rendering
 * JSX. Always mounted for every day the itinerary has (not just visible
 * ones) so the OSRM fetch/route hook call count stays stable across renders
 * as the user toggles day visibility — `visible` just gates whether the
 * layer is actually added to the map, not whether this component exists.
 *
 * One request per day (not per-leg) via OSRM multi-waypoint routing, cached
 * by TanStack Query so toggling visibility doesn't re-fetch. Falls back to a
 * straight dashed line + estimated time (clearly distinguished visually) if
 * OSRM is unavailable — this is a public demo server, not guaranteed uptime.
 */
export function DayRouteLayer({
  map,
  dayNumber,
  points,
  visible,
}: {
  map: maplibregl.Map | null;
  dayNumber: number;
  points: Point[];
  visible: boolean;
}) {
  const sourceId = `route-${dayNumber}`;
  const layerId = `route-line-${dayNumber}`;
  const labelMarkersRef = useRef<maplibregl.Marker[]>([]);

  const { data: route } = useQuery({
    queryKey: ["osrm-route", dayNumber, points.map((p) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`).join(";")],
    queryFn: () => fetchRoute(points),
    enabled: points.length >= 2 && Boolean(map),
    staleTime: Infinity,
    retry: 0,
  });

  useEffect(() => {
    if (!map) return;

    function cleanup() {
      labelMarkersRef.current.forEach((m) => m.remove());
      labelMarkersRef.current = [];
      if (map!.getLayer(layerId)) map!.removeLayer(layerId);
      if (map!.getSource(sourceId)) map!.removeSource(sourceId);
    }

    if (!visible || !route || route.legs.length === 0) {
      cleanup();
      return;
    }
    // Narrowed for the nested addLayer() closure below — TS can't carry the
    // above null-check narrowing into a function called asynchronously via
    // map.once(), even though it's captured by the same closure.
    const safeRoute = route;

    const t = dayTheme(dayNumber);
    const geojson: GeoJSON.Feature<GeoJSON.LineString> = {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        // GeoJSON/MapLibre coordinate order is [lng, lat] — route.geometry is
        // [lat, lng] (kept that way for backward compat with call sites from
        // when this was Leaflet-based).
        coordinates: safeRoute.geometry.map(([lat, lng]) => [lng, lat]),
      },
    };

    function addLayer() {
      if (map!.getSource(sourceId)) {
        (map!.getSource(sourceId) as maplibregl.GeoJSONSource).setData(geojson);
      } else {
        map!.addSource(sourceId, { type: "geojson", data: geojson });
        map!.addLayer({
          id: layerId,
          type: "line",
          source: sourceId,
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": t.hex,
            "line-width": 3,
            "line-opacity": safeRoute.isRealRoute ? 0.7 : 0.5,
            ...(safeRoute.isRealRoute ? {} : { "line-dasharray": [2, 2] }),
          },
        });
      }
    }

    if (map.isStyleLoaded()) addLayer();
    else map.once("styledata", addLayer);

    // Distance/duration labels at each leg's midpoint — consecutive activities
    // sometimes share coordinates (e.g. hotel check-in followed by another
    // activity also at the hotel), a "0.0 km · 0 min" label there is just
    // noise, not useful info.
    labelMarkersRef.current.forEach((m) => m.remove());
    labelMarkersRef.current = route.legs
      .map((leg, i) => {
        if (leg.distanceKm < 0.05) return null;
        const from = points[i];
        const to = points[i + 1];
        const el = document.createElement("div");
        el.className = "px-2 py-0.5 rounded-full bg-black/80 border border-white/10 text-white text-[10px] whitespace-nowrap";
        el.textContent = `${leg.distanceKm.toFixed(1)} km · ${Math.round(leg.durationMin)} min${route.isRealRoute ? "" : " (est.)"}`;
        return new maplibregl.Marker({ element: el, anchor: "center" }).setLngLat([(from.lng + to.lng) / 2, (from.lat + to.lat) / 2]).addTo(map!);
      })
      .filter((m): m is maplibregl.Marker => m !== null);

    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, route, dayNumber, visible]);

  return null;
}
