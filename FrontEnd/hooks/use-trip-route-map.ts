// Shared static route-map state for the in-trip views (driver boarding screen
// and passenger trip bubble). Fetches the route polyline while the trip is
// active and builds the themed static-map URL from it.

import { useEffect, useState } from 'react';

import { buildStaticMapUrl, fetchRoutePolyline } from '@/utils/static-map';

export function useTripRouteMap({ active, originLat, originLng, destLat, destLng, isDark }: {
  active: boolean;
  originLat: string | number;
  originLng: string | number;
  destLat: string | number;
  destLng: string | number;
  isDark: boolean;
}) {
  const [mapUrl, setMapUrl]     = useState<string | null>(null);
  const [mapError, setMapError] = useState(false);
  const [polyline, setPolyline] = useState<string | null>(null);

  useEffect(() => {
    if (!active) { setPolyline(null); return; }
    fetchRoutePolyline(Number(originLat), Number(originLng), Number(destLat), Number(destLng)).then(setPolyline);
  }, [active, originLat, originLng, destLat, destLng]);

  useEffect(() => {
    if (!active) { setMapUrl(null); return; }
    setMapError(false);
    setMapUrl(buildStaticMapUrl(Number(originLat), Number(originLng), Number(destLat), Number(destLng), polyline, isDark));
  }, [active, polyline, isDark, originLat, originLng, destLat, destLng]);

  return { mapUrl, mapError, onMapError: () => setMapError(true) };
}
