// Publish-trip form state + submission for the Offer tab. Holds route/date/seat
// /price/vehicle fields, loads the driver's vehicles, validates and publishes.
// validateOfferForm is a pure, exported function so the rules are unit-testable.

import * as Location from 'expo-location';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { useAuth } from '@/contexts/auth';
import { useLoading } from '@/contexts/loading';
import { Brand } from '@/constants/theme';
import { ApiError, get, post } from '@/services/api';
import { PlacePrediction } from '@/components/shared/place-search-input';

const GOOGLE_PLACES_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY ?? '';

export interface PlaceCoords { lat: number; lng: number; }

export interface VehicleOption {
  id: string;
  name: string;
  plate: string;
  color: string;
}

export interface OfferAlert {
  icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap;
  iconColor: string;
  title: string;
  body: string;
}

export interface OfferFormValues {
  from: string;
  to: string;
  selectedDate: Date | null;
  vehicleId: string | null;
  userId?: string;
  fromCoords: PlaceCoords | null;
  toCoords: PlaceCoords | null;
}

export interface OfferValidationError { title: string; body: string; }

/** Pure validation for the publish form. Returns the first blocking error, or
 *  null when the form may be submitted. `now` is injectable for testing. */
export function validateOfferForm(v: OfferFormValues, now: number = Date.now()): OfferValidationError | null {
  if (!v.from || !v.to || !v.selectedDate)
    return { title: 'Campos incompletos', body: 'Completa origen, destino, fecha y hora.' };
  // Departure must be at least 5 minutes ahead: the boarding window opens 5 min
  // before departure, so a trip set for "now" can never be started.
  if (v.selectedDate.getTime() < now + 5 * 60_000)
    return { title: 'Hora muy próxima', body: 'La salida debe ser al menos 5 minutos en el futuro para poder iniciar el viaje.' };
  if (!v.vehicleId)
    return { title: 'Sin vehículo', body: 'Selecciona un vehículo para ofrecer el viaje.' };
  if (!v.userId)
    return { title: 'Sesión expirada', body: 'Vuelve a iniciar sesión.' };
  if (!v.fromCoords)
    return { title: 'Origen sin coordenadas', body: 'Selecciona el origen desde las sugerencias para obtener su ubicación.' };
  if (!v.toCoords)
    return { title: 'Destino sin coordenadas', body: 'Selecciona el destino desde las sugerencias para obtener su ubicación.' };
  return null;
}

async function googlePlaceCoords(placeId: string): Promise<PlaceCoords | null> {
  if (!GOOGLE_PLACES_KEY || Platform.OS === 'web') return null;

  try {
    const params = new URLSearchParams({ place_id: placeId, fields: 'geometry', key: GOOGLE_PLACES_KEY });
    const res = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?${params}`);
    const json = await res.json();
    const loc = json.result?.geometry?.location;
    if (loc) return { lat: loc.lat as number, lng: loc.lng as number };
  } catch { /* fall through to geocoding */ }

  try {
    const params = new URLSearchParams({ place_id: placeId, key: GOOGLE_PLACES_KEY });
    const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params}`);
    const json = await res.json();
    const loc = json.results?.[0]?.geometry?.location;
    if (loc) return { lat: loc.lat as number, lng: loc.lng as number };
  } catch { /* fall through to device geocoder */ }

  return null;
}

// Resolve a selected place to coordinates. Autocomplete predictions don't carry
// geometry, so we try, in order: Google Place Details, Google Geocoding, and
// finally the device's native geocoder (key-free) using the address text — so a
// disabled/denied Google key can't leave a trip without coordinates.
async function resolveCoords(placeId: string | null, text: string): Promise<PlaceCoords | null> {
  if (placeId) {
    const viaGoogle = await googlePlaceCoords(placeId);
    if (viaGoogle) return viaGoogle;
  }
  const address = text.trim();
  if (address.length > 0 && Platform.OS !== 'web') {
    try {
      const [hit] = await Location.geocodeAsync(address);
      if (hit) return { lat: hit.latitude, lng: hit.longitude };
    } catch { /* give up */ }
  }
  return null;
}

export function useOfferForm() {
  const { user, token } = useAuth();
  const { showLoader, hideLoader } = useLoading();

  const [from, setFrom]             = useState('');
  const [fromCoords, setFromCoords] = useState<PlaceCoords | null>(null);
  const [to, setTo]                 = useState('');
  const [toCoords, setToCoords]     = useState<PlaceCoords | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [seats, setSeats]           = useState(2);
  const [price, setPrice]           = useState(1500);
  const [vehicleId, setVehicleId]   = useState<string | null>(null);
  const [notes, setNotes]           = useState('');
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  // place_id of the last selected origin/destination, so coords can be re-resolved
  // at publish time if the async resolution hasn't landed yet (or failed).
  const fromPlaceIdRef = useRef<string | null>(null);
  const toPlaceIdRef   = useRef<string | null>(null);
  // Resolved coords mirrored in refs so publish reads the latest value regardless
  // of React state/render timing (and without re-calling the throttled geocoder).
  const fromCoordsRef  = useRef<PlaceCoords | null>(null);
  const toCoordsRef    = useRef<PlaceCoords | null>(null);
  // The exact text we last resolved coords for. Used to ignore the TextInput
  // "echo" onChangeText (same value, fired on re-render) so a resolved origin/
  // destination isn't silently invalidated.
  const fromResolvedTextRef = useRef('');
  const toResolvedTextRef   = useRef('');
  const applyFromCoords = (c: PlaceCoords | null) => { fromCoordsRef.current = c; setFromCoords(c); };
  const applyToCoords   = (c: PlaceCoords | null) => { toCoordsRef.current = c;   setToCoords(c); };

  const [vehicles, setVehicles]               = useState<VehicleOption[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [offerAlert, setOfferAlert]           = useState<OfferAlert | null>(null);

  const showError   = (title: string, body: string) =>
    setOfferAlert({ icon: 'alert-circle',     iconColor: '#e53e3e',                  title, body });
  const showSuccess = (title: string, body: string) =>
    setOfferAlert({ icon: 'checkmark-circle', iconColor: Brand.colors.green.normal,  title, body });

  // Load the driver's vehicles
  useEffect(() => {
    if (!user?.id) return;
    setVehiclesLoading(true);
    get<{ vehicleId: string; model: string; numPlate: string; color: string }[]>(
      `/api/vehicles/user/${user.id}`,
      token ?? undefined,
    )
      .then((data) => setVehicles(data.map((v) => ({ id: v.vehicleId, name: v.model, plate: v.numPlate, color: v.color }))))
      .catch(() => setVehicles([]))
      .finally(() => setVehiclesLoading(false));
  }, [user?.id, token]);

  // Default to the first vehicle once loaded
  useEffect(() => {
    if (vehicleId === null && vehicles.length > 0) setVehicleId(vehicles[0].id);
  }, [vehicles, vehicleId]);

  const selectedVehicle = useMemo(() => vehicles.find((v) => v.id === vehicleId) ?? null, [vehicles, vehicleId]);
  const estimated       = useMemo(() => seats * price, [price, seats]);
  const remaining       = useMemo(() => Math.max(0, 100 - notes.length), [notes]);

  // Free-text edits invalidate the previously resolved coordinates/place_id.
  // Ignore the no-op "echo" where the field reports its already-resolved value.
  const onChangeFrom = (text: string) => {
    if (text === fromResolvedTextRef.current) return;
    setFrom(text); applyFromCoords(null); fromPlaceIdRef.current = null;
  };
  const onChangeTo = (text: string) => {
    if (text === toResolvedTextRef.current) return;
    setTo(text); applyToCoords(null); toPlaceIdRef.current = null;
  };

  const onSelectFrom = (pred: PlacePrediction) => {
    setFrom(pred.description);
    fromResolvedTextRef.current = pred.description;
    fromPlaceIdRef.current = pred.placeId;
    if (pred.coords) { applyFromCoords(pred.coords); console.log('[offer] origen coords (pred):', pred.coords); }
    else {
      applyFromCoords(null);
      resolveCoords(pred.placeId, pred.description).then((c) => {
        console.log('[offer] origen coords:', c, 'placeId:', pred.placeId, 'desc:', pred.description);
        if (c) applyFromCoords(c);
      });
    }
  };
  const onSelectTo = (pred: PlacePrediction) => {
    setTo(pred.description);
    toResolvedTextRef.current = pred.description;
    toPlaceIdRef.current = pred.placeId;
    if (pred.coords) { applyToCoords(pred.coords); console.log('[offer] destino coords (pred):', pred.coords); }
    else {
      applyToCoords(null);
      resolveCoords(pred.placeId, pred.description).then((c) => {
        console.log('[offer] destino coords:', c, 'placeId:', pred.placeId, 'desc:', pred.description);
        if (c) applyToCoords(c);
      });
    }
  };

  const publish = async () => {
    // Coordinates resolve asynchronously after picking a suggestion. If the user
    // publishes before that lands (or it failed), resolve from the stored place_id
    // now so a valid selection never reports "sin coordenadas".
    console.log('[offer] publish raw → from:', JSON.stringify(from), 'to:', JSON.stringify(to),
      'fromCoords(state):', fromCoords, 'fromCoords(ref):', fromCoordsRef.current,
      'toCoords(ref):', toCoordsRef.current, 'fromPlaceId:', fromPlaceIdRef.current, 'toPlaceId:', toPlaceIdRef.current);

    // Refs hold the latest resolved coords regardless of render timing.
    let resolvedFrom = fromCoordsRef.current ?? fromCoords;
    let resolvedTo   = toCoordsRef.current ?? toCoords;
    if (!resolvedFrom) {
      resolvedFrom = await resolveCoords(fromPlaceIdRef.current, from);
      if (resolvedFrom) applyFromCoords(resolvedFrom);
    }
    if (!resolvedTo) {
      resolvedTo = await resolveCoords(toPlaceIdRef.current, to);
      if (resolvedTo) applyToCoords(resolvedTo);
    }
    console.log('[offer] publish coords → origen:', resolvedFrom, 'destino:', resolvedTo);

    const error = validateOfferForm({ from, to, selectedDate, vehicleId, userId: user?.id, fromCoords: resolvedFrom, toCoords: resolvedTo });
    if (error) { showError(error.title, error.body); return; }

    const payload = {
      driverId: user!.id,
      vehicleId,
      rate: price,
      origin: from,
      destination: to,
      originLatitude: resolvedFrom!.lat,
      originLongitude: resolvedFrom!.lng,
      destinationLatitude: resolvedTo!.lat,
      destinationLongitude: resolvedTo!.lng,
      departureAt: selectedDate!.toISOString(),
      totalSeats: seats,
      availableSeats: seats,
      notes,
      state: 0,
    };
    showLoader('Publicando viaje...');
    try {
      await post('/api/trips', payload, token ?? undefined);
      hideLoader();
      showSuccess('¡Viaje publicado!', 'Tu viaje ya está disponible para los pasajeros.');
      setFrom(''); applyFromCoords(null); fromPlaceIdRef.current = null; fromResolvedTextRef.current = '';
      setTo(''); applyToCoords(null); toPlaceIdRef.current = null; toResolvedTextRef.current = '';
      setSelectedDate(null);
      setSeats(2); setPrice(1500); setNotes('');
    } catch (err) {
      hideLoader();
      const msg = err instanceof ApiError ? `[${(err as ApiError).status}] ${err.message}` : 'No se pudo publicar el viaje.';
      showError('Error al publicar', msg);
    }
  };

  return {
    from, setFrom, fromCoords, setFromCoords, onChangeFrom, onSelectFrom,
    to, setTo, toCoords, setToCoords, onChangeTo, onSelectTo,
    selectedDate, setSelectedDate,
    seats, setSeats, price, setPrice,
    vehicleId, setVehicleId, vehicles, vehiclesLoading, selectedVehicle,
    vehicleModalOpen, setVehicleModalOpen,
    notes, setNotes, remaining, estimated,
    offerAlert, dismissAlert: () => setOfferAlert(null), showError,
    publish,
  };
}
