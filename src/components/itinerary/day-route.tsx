"use client";

import { useQuery } from "@tanstack/react-query";
import maplibregl from "maplibre-gl";
import { useEffect } from "react";
import { fetchRoute } from "@/lib/route";
import { dayTheme } from "@/lib/day-theme";

type Point = { lat: number; lng: number };

/**
 * Imperatively manages one day's GeoJSON line source/layer plus midpoint
 * distance-label symbols on a shared MapLibre map instance — MapLibre isn't a
 * declarative React child-component API like react-leaflet was, so this owns
 * its own source/layer lifecycle in an effect instead of rendering JSX.
 * Always mounted for every day the itinerary has (not just visible ones) so
 * the OSRM fetch/route hook call count stays stable across renders as the
 * user toggles day visibility — `visible` just gates whether the layer is
 * actually added to the map, not whether this component exists.
 *
 * Labels are a MapLibre symbol layer (text-field), not DOM markers — this
 * matters: confirmed live, DOM markers have no collision handling at all, so
 * on a trip with several days visible at once (or legs whose midpoints land
 * close together, common on a multi-island trip zoomed out), the distance/
 * time labels physically overlapped into illegible stacked text. Symbol
 * layers get MapLibre's built-in collision engine for free — text-allow-
 * overlap: false hides whichever label loses out instead of stacking it.
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
  const lineSourceId = `route-${dayNumber}`;
  const lineLayerId = `route-line-${dayNumber}`;
  const labelSourceId = `route-labels-${dayNumber}`;
  const labelLayerId = `route-label-${dayNumber}`;

  const { data: route } = useQuery({
    queryKey: ["osrm-route", dayNumber, points.map((p) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`).join(";")],
    queryFn: () => fetchRoute(points),
    enabled: points.length >= 2 && Boolean(map),
    staleTime: Infinity,
    retry: 0,
  });

  useEffect(() => {
    if (!map) return;

    // Best-effort: if the map itself has already been torn down (.remove()
    // called, e.g. this whole page unmounting while this cleanup was still
    // pending) MapLibre's own methods throw reading internal state that
    // .remove() already cleared out — confirmed live as a real crash
    // ("Cannot read properties of undefined (reading 'getLayer')") when
    // navigating away from the itinerary page. There's nothing meaningful to
    // clean up on a map that no longer exists, so swallow it.
    function cleanup() {
      try {
        if (map!.getLayer(labelLayerId)) map!.removeLayer(labelLayerId);
        if (map!.getSource(labelSourceId)) map!.removeSource(labelSourceId);
        if (map!.getLayer(lineLayerId)) map!.removeLayer(lineLayerId);
        if (map!.getSource(lineSourceId)) map!.removeSource(lineSourceId);
      } catch {
        // Map already removed — nothing left to clean up.
      }
    }

    if (!visible || !route || route.legs.length === 0) {
      cleanup();
      return;
    }
    // Narrowed for the nested addLayers() closure below — TS can't carry the
    // above null-check narrowing into a function called asynchronously via
    // map.once(), even though it's captured by the same closure.
    const safeRoute = route;

    const t = dayTheme(dayNumber);
    const lineGeojson: GeoJSON.Feature<GeoJSON.LineString> = {
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

    // Distance/duration labels at each leg's midpoint — consecutive activities
    // sometimes share coordinates (e.g. hotel check-in followed by another
    // activity also at the hotel), a "0.0 km · 0 min" label there is just
    // noise, not useful info.
    const labelFeatures: (GeoJSON.Feature<GeoJSON.Point> | null)[] = safeRoute.legs.map((leg, i) => {
      if (leg.distanceKm < 0.05) return null;
      const from = points[i];
      const to = points[i + 1];
      const label = `${leg.distanceKm.toFixed(1)} km · ${Math.round(leg.durationMin)} min${safeRoute.isRealRoute ? "" : " (est.)"}`;
      const feature: GeoJSON.Feature<GeoJSON.Point> = {
        type: "Feature",
        properties: { label },
        geometry: { type: "Point", coordinates: [(from.lng + to.lng) / 2, (from.lat + to.lat) / 2] },
      };
      return feature;
    });
    const labelGeojson: GeoJSON.FeatureCollection<GeoJSON.Point> = {
      type: "FeatureCollection",
      features: labelFeatures.filter((f): f is GeoJSON.Feature<GeoJSON.Point> => f !== null),
    };

    function addLayers() {
      try {
        if (map!.getSource(lineSourceId)) {
          (map!.getSource(lineSourceId) as maplibregl.GeoJSONSource).setData(lineGeojson);
        } else {
          map!.addSource(lineSourceId, { type: "geojson", data: lineGeojson });
          map!.addLayer({
            id: lineLayerId,
            type: "line",
            source: lineSourceId,
            layout: { "line-join": "round", "line-cap": "round" },
            paint: {
              "line-color": t.hex,
              "line-width": 3,
              "line-opacity": safeRoute.isRealRoute ? 0.7 : 0.5,
              ...(safeRoute.isRealRoute ? {} : { "line-dasharray": [2, 2] }),
            },
          });
        }

        if (map!.getSource(labelSourceId)) {
          (map!.getSource(labelSourceId) as maplibregl.GeoJSONSource).setData(labelGeojson);
        } else {
          map!.addSource(labelSourceId, { type: "geojson", data: labelGeojson });
          map!.addLayer({
            id: labelLayerId,
            type: "symbol",
            source: labelSourceId,
            layout: {
              "text-field": ["get", "label"],
              "text-size": 10,
              "text-allow-overlap": false,
              "text-ignore-placement": false,
            },
            paint: {
              "text-color": "#ffffff",
              "text-halo-color": "rgba(0,0,0,0.8)",
              "text-halo-width": 3,
            },
          });
        }
      } catch {
        // Map was removed between scheduling this callback and it firing.
      }
    }

    if (map.isStyleLoaded()) addLayers();
    else map.once("styledata", addLayers);

    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, route, dayNumber, visible]);

  return null;
}
