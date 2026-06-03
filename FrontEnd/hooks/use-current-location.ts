import * as Location from 'expo-location';
import { useCallback, useRef, useState } from 'react';

export type LocationState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'granted'; address: string; coords: { lat: number; lng: number } }
  | { status: 'denied' }
  | { status: 'error'; message: string };

export function useCurrentLocation() {
  const [state, setState] = useState<LocationState>({ status: 'idle' });
  const inFlightRef = useRef(false);

  const fetch = useCallback(async (): Promise<{ address: string; coords: { lat: number; lng: number } } | null> => {
    if (inFlightRef.current) return null;
    inFlightRef.current = true;
    setState({ status: 'loading' });

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setState({ status: 'denied' });
        return null;
      }

      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = pos.coords;

      const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
      const parts = [
        place?.street && place?.streetNumber
          ? `${place.street} ${place.streetNumber}`
          : place?.street ?? null,
        place?.district ?? place?.subregion ?? null,
        place?.city ?? place?.region ?? null,
      ].filter(Boolean);

      const address = parts.length > 0 ? parts.join(', ') : `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
      const coords = { lat: latitude, lng: longitude };

      setState({ status: 'granted', address, coords });
      return { address, coords };
    } catch {
      setState({ status: 'error', message: 'No se pudo obtener la ubicación' });
      return null;
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  const reset = useCallback(() => setState({ status: 'idle' }), []);

  return { state, fetch, reset };
}
