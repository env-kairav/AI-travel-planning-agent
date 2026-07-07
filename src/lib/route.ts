/**
 * Real road routing via OSRM's public demo server (router.project-osrm.org) —
 * free, no API key, CORS-permissive (verified: access-control-allow-origin: *).
 * Not meant for heavy production traffic per OSRM's own usage policy, but fits
 * this project's established pattern of free/keyless external services
 * (Nominatim, Open-Meteo, Wikipedia all work the same way).
 */

export type RouteLeg = {
  distanceKm: number;
  durationMin: number;
};

export type RouteResult = {
  /** [lat, lng] pairs — already converted from OSRM's [lon, lat] order for Leaflet. */
  geometry: [number, number][];
  legs: RouteLeg[];
  /** false if this came from the haversine fallback rather than real OSRM routing. */
  isRealRoute: boolean;
};

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Straight-line fallback when OSRM is unavailable — assumed city-driving speed. */
const FALLBACK_SPEED_KMH = 25;

function fallbackRoute(points: { lat: number; lng: number }[]): RouteResult {
  const legs: RouteLeg[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const distanceKm = haversineKm(points[i].lat, points[i].lng, points[i + 1].lat, points[i + 1].lng);
    legs.push({ distanceKm, durationMin: (distanceKm / FALLBACK_SPEED_KMH) * 60 });
  }
  return {
    geometry: points.map((p) => [p.lat, p.lng]),
    legs,
    isRealRoute: false,
  };
}

export async function fetchRoute(points: { lat: number; lng: number }[]): Promise<RouteResult> {
  if (points.length < 2) return { geometry: points.map((p) => [p.lat, p.lng]), legs: [], isRealRoute: false };

  try {
    const coords = points.map((p) => `${p.lng},${p.lat}`).join(";");
    const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`OSRM ${res.status}`);
    const data = await res.json();
    if (data.code !== "Ok" || !data.routes?.[0]) throw new Error("No route found");

    const route = data.routes[0];
    const geometry: [number, number][] = route.geometry.coordinates.map(([lon, lat]: [number, number]) => [lat, lon]);
    const legs: RouteLeg[] = route.legs.map((leg: { distance: number; duration: number }) => ({
      distanceKm: leg.distance / 1000,
      durationMin: leg.duration / 60,
    }));
    return { geometry, legs, isRealRoute: true };
  } catch {
    return fallbackRoute(points);
  }
}
