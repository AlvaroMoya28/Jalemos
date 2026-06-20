// Google Static Maps / Directions helpers for the ride-detail route preview.
// Pure functions extracted from the screen (E0-3) so the screen stays focused on UI/state.

const GOOGLE_MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY ?? '';

// Map style rules — each becomes a &style= parameter in the Static Maps URL.
const DARK_MAP_STYLES = [
  'feature:all|element:geometry|color:0x060e0d',
  'feature:all|element:labels.text.fill|color:0x4a7a74',
  'feature:all|element:labels.text.stroke|color:0x060e0d',
  'feature:road|element:geometry|color:0x0f1f1d',
  'feature:road.highway|element:geometry|color:0x162624',
  'feature:road.highway|element:geometry.stroke|color:0x1a9e8f',
  'feature:water|element:geometry|color:0x040a09',
  'feature:landscape.natural|element:geometry|color:0x060c0b',
  'feature:landscape.man_made|element:geometry|color:0x0a1916',
  'feature:poi|element:geometry|color:0x060e0d',
  'feature:poi.park|element:geometry|color:0x07110a',
  'feature:transit|element:geometry|color:0x0d1b19',
  'feature:administrative|element:labels.text.fill|color:0x2e5550',
];

const LIGHT_MAP_STYLES = [
  'feature:water|element:geometry|color:0xbae2dd',
  'feature:landscape.natural|element:geometry|color:0xf0f7f5',
  'feature:poi.park|element:geometry|color:0xdceee9',
  'feature:road|element:geometry|color:0xffffff',
  'feature:road.highway|element:geometry|color:0xe8f4f1',
  'feature:road.highway|element:geometry.stroke|color:0x1a9e8f',
  'feature:administrative|element:labels.text.fill|color:0x595959',
];

/**
 * Fetches the road-route polyline from the Directions API. Returns null on web
 * (CORS-blocked), when no key is set, or on any API error — callers fall back to a
 * straight line between the points.
 */
export async function fetchRoutePolyline(
  fromLat: number, fromLng: number, toLat: number, toLng: number,
): Promise<string | null> {
  if (!GOOGLE_MAPS_KEY || typeof document !== 'undefined') return null;
  try {
    const params = new URLSearchParams({
      origin: `${fromLat},${fromLng}`,
      destination: `${toLat},${toLng}`,
      key: GOOGLE_MAPS_KEY,
    });
    const res = await fetch(`https://maps.googleapis.com/maps/api/directions/json?${params}`);
    const json = await res.json();
    if (json.status !== 'OK' || !json.routes?.[0]) return null;
    return json.routes[0].overview_polyline.points as string;
  } catch (e) {
    console.warn('[Directions] fetch error', e);
    return null;
  }
}

/** Builds the themed Static Maps URL with A/B markers and the route path. */
export function buildMapUrl(
  fromLat: number, fromLng: number, toLat: number, toLng: number,
  encodedPolyline: string | null, isDark: boolean,
): string | null {
  if (!GOOGLE_MAPS_KEY) return null;
  let url =
    `https://maps.googleapis.com/maps/api/staticmap?size=800x440&scale=2&maptype=roadmap` +
    `&markers=color:0x1a9e8f|size:mid|label:A|${fromLat},${fromLng}` +
    `&markers=color:0xE53935|size:mid|label:B|${toLat},${toLng}`;
  url += encodedPolyline
    ? `&path=color:0x1a9e8fff|weight:4|enc:${encodedPolyline}`
    : `&path=color:0x1a9e8fff|weight:4|${fromLat},${fromLng}|${toLat},${toLng}`;
  for (const style of isDark ? DARK_MAP_STYLES : LIGHT_MAP_STYLES) {
    url += `&style=${encodeURIComponent(style)}`;
  }
  return url + `&key=${GOOGLE_MAPS_KEY}`;
}
