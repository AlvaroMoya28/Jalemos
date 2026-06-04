// Shared helpers for building Google Static Maps previews of a trip route.
// Used by boarding-screen (driver) and active-trip-bubble (passenger) so both
// show an identical map. The Directions polyline is optional — without it the
// map draws a straight line between the two points.

import { Platform } from 'react-native';

const GOOGLE_MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY ?? '';

export async function fetchRoutePolyline(
  fLat: number, fLng: number, tLat: number, tLng: number,
): Promise<string | null> {
  if (!GOOGLE_MAPS_KEY || Platform.OS === 'web') return null;
  try {
    const params = new URLSearchParams({
      origin: `${fLat},${fLng}`,
      destination: `${tLat},${tLng}`,
      key: GOOGLE_MAPS_KEY,
    });
    const res  = await fetch(`https://maps.googleapis.com/maps/api/directions/json?${params}`);
    const json = await res.json();
    if (json.status !== 'OK' || !json.routes?.[0]) return null;
    return json.routes[0].overview_polyline.points as string;
  } catch {
    return null;
  }
}

const DARK_STYLES = [
  'feature:all|element:geometry|color:0x060e0d',
  'feature:all|element:labels.text.fill|color:0x4a7a74',
  'feature:road|element:geometry|color:0x0f1f1d',
  'feature:road.highway|element:geometry.stroke|color:0x1a9e8f',
  'feature:water|element:geometry|color:0x040a09',
];
const LIGHT_STYLES = [
  'feature:water|element:geometry|color:0xbae2dd',
  'feature:road|element:geometry|color:0xffffff',
  'feature:road.highway|element:geometry.stroke|color:0x1a9e8f',
];

export function buildStaticMapUrl(
  fLat: number, fLng: number, tLat: number, tLng: number,
  polyline: string | null, isDark: boolean,
): string | null {
  if (!GOOGLE_MAPS_KEY) return null;
  let url = `https://maps.googleapis.com/maps/api/staticmap?size=800x440&scale=2&maptype=roadmap`
    + `&markers=color:0x1a9e8f|size:mid|label:A|${fLat},${fLng}`
    + `&markers=color:0xE53935|size:mid|label:B|${tLat},${tLng}`;
  url += polyline
    ? `&path=color:0x1a9e8fff|weight:4|enc:${polyline}`
    : `&path=color:0x1a9e8fff|weight:4|${fLat},${fLng}|${tLat},${tLng}`;
  for (const s of isDark ? DARK_STYLES : LIGHT_STYLES) url += `&style=${encodeURIComponent(s)}`;
  return url + `&key=${GOOGLE_MAPS_KEY}`;
}
