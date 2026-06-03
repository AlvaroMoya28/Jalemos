// Offer (Ofrecer) tab — driver's screen for publishing a new trip.
// Lets the driver set origin, destination, date, time, available seats, price per seat,
// and select which registered vehicle to use. Shares the same hero-banner + rounded
// bottom surface visual pattern as the other tab screens.
// Only visible in the tab bar when the user is in driver mode (see UserModeContext).
// Tab icon and title are set via navigation.setOptions on mount.

import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import { useLoading } from '@/contexts/loading';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '@/contexts/auth';
import { get, post, ApiError, tripLifecycleApi } from '@/services/api';
import Animated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';

import GlassCard from '@/components/glass-card';
import NotificationsModal from '@/components/NotificationsModal';
import PlaceSearchInput, { PlacePrediction } from '@/components/place-search-input';
import BoardingScreen from '@/components/boarding-screen';
import { Brand } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useActiveTrip } from '@/contexts/active-trip';
import { upcomingStyles, ampmContainerStyle, noVehiclesWarning, makeStyles } from '../../styles/tabs/offer.styles';

const GOOGLE_PLACES_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY ?? '';

interface VehicleOption {
  id: string;
  name: string;
  plate: string;
  color: string;
}

interface PlaceCoords {
  lat: number;
  lng: number;
}

async function fetchPlaceCoords(placeId: string): Promise<PlaceCoords | null> {
  if (!GOOGLE_PLACES_KEY || Platform.OS === 'web') return null;
  try {
    const params = new URLSearchParams({
      place_id: placeId,
      fields: 'geometry',
      key: GOOGLE_PLACES_KEY,
    });
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?${params}`
    );
    const json = await res.json();
    const loc = json.result?.geometry?.location;
    if (!loc) {
      console.warn('[fetchPlaceCoords] no location in response', json.status);
      return null;
    }
    console.log(`[fetchPlaceCoords] ${placeId} → lat=${loc.lat} lng=${loc.lng}`);
    return { lat: loc.lat as number, lng: loc.lng as number };
  } catch (e) {
    console.warn('[fetchPlaceCoords] error', e);
    return null;
  }
}

const PICKER_ITEM_HEIGHT = 36;
const hours = Array.from({ length: 12 }, (_, i) => i + 1);
const minutes = Array.from({ length: 60 }, (_, idx) => idx);

function monthLabel(date: Date) {
  return date.toLocaleDateString('es-CR', { month: 'long', year: 'numeric' });
}

function dateLabel(date: Date) {
  return date.toLocaleDateString('es-CR', { weekday: 'short', day: 'numeric', month: 'short' });
}

function timeLabel(hour: number, minute: number) {
  const period = hour < 12 ? 'AM' : 'PM';
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}:${String(minute).padStart(2, '0')} ${period}`;
}

function buildCalendarDays(cursor: Date) {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0).getDate();
  const startIndex = (first.getDay() + 6) % 7;
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startIndex; i++) cells.push(null);
  for (let day = 1; day <= lastDay; day++) cells.push(new Date(year, month, day));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function isSameDay(a: Date | null, b: Date | null) {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
export default function OfferScreen() {
  const { isDark, colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation();
  const { showLoader, hideLoader } = useLoading();
  const { user, token } = useAuth();
  const { driverTrip, refresh: refreshActiveTrip } = useActiveTrip();

  // ── All hooks must come before any conditional return ───────────────────
  useEffect(() => {
    navigation.setOptions({ title: 'Ofrecer', icon: { sf: 'car' } });
  }, [navigation]);

  // Upcoming scheduled trips for the driver (to show "Iniciar abordaje")
  const [upcomingTrip, setUpcomingTrip] = useState<{
    id: string; origin: string; destination: string; departureAt: string;
  } | null>(null);
  const [startBoardingLoading, setStartBoardingLoading] = useState(false);
  const [minsUntilBoarding, setMinsUntilBoarding] = useState<number | null>(null);

  useEffect(() => {
    if (!token || !user?.id || driverTrip) return;
    const check = async () => {
      try {
        const trips = await get<any[]>('/api/trips', token);
        const mine = trips
          .filter((t: any) => t.driverId === user.id && (t.state === 'Scheduled' || t.state === 'scheduled'))
          .sort((a: any, b: any) => new Date(a.departureAt).getTime() - new Date(b.departureAt).getTime());
        if (mine.length > 0) {
          const next = mine[0];
          setUpcomingTrip({ id: next.id, origin: next.origin, destination: next.destination, departureAt: next.departureAt });
          const msUntil = new Date(next.departureAt).getTime() - Date.now() - 5 * 60_000;
          setMinsUntilBoarding(msUntil > 0 ? Math.ceil(msUntil / 60_000) : 0);
        } else {
          setUpcomingTrip(null);
        }
      } catch { setUpcomingTrip(null); }
    };
    check();
    const id = setInterval(check, 10_000);
    return () => clearInterval(id);
  }, [token, user?.id, driverTrip]);

  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    setVehiclesLoading(true);
    get<{ vehicleId: string; model: string; numPlate: string; color: string }[]>(
      `/api/vehicles/user/${user.id}`,
      token ?? undefined,
    )
      .then((data) =>
        setVehicles(
          data.map((v) => ({ id: v.vehicleId, name: v.model, plate: v.numPlate, color: v.color })),
        ),
      )
      .catch(() => setVehicles([]))
      .finally(() => setVehiclesLoading(false));
  }, [user?.id, token]);

  const [notifOpen, setNotifOpen] = useState(false);
  const [from, setFrom] = useState('');
  const [fromCoords, setFromCoords] = useState<PlaceCoords | null>(null);
  const [to, setTo] = useState('');
  const [toCoords, setToCoords] = useState<PlaceCoords | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [seats, setSeats] = useState(2);
  const [price, setPrice] = useState(1500);
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);

  useEffect(() => {
    if (vehicleId === null && vehicles.length > 0) setVehicleId(vehicles[0].id);
  }, [vehicles, vehicleId]);

  const [calendarOpen, setCalendarOpen] = useState(false);
  const [cursorDate, setCursorDate] = useState(() => new Date());
  const [draftDate, setDraftDate] = useState<Date | null>(null);
  const [draftHour, setDraftHour] = useState(7);
  const [draftMinute, setDraftMinute] = useState(0);
  const [draftPeriod, setDraftPeriod] = useState<'AM' | 'PM'>('AM');
  const hourScrollRef = useRef<ScrollView>(null);
  const minuteScrollRef = useRef<ScrollView>(null);

  // These useMemo calls must be BEFORE the conditional return
  const selectedVehicle = useMemo(() => vehicles.find((v) => v.id === vehicleId) ?? null, [vehicles, vehicleId]);
  const estimated       = useMemo(() => seats * price, [price, seats]);
  const remaining       = useMemo(() => Math.max(0, 100 - notes.length), [notes]);
  const calendarDays    = useMemo(() => buildCalendarDays(cursorDate), [cursorDate]);
  const hasOrigin       = from.trim().length > 0;
  const hasDestination  = to.trim().length > 0;
  const visibleBlocks   = 1 + (hasOrigin ? 1 : 0) + (hasDestination ? 1 : 0);
  const heroHeight      = 280 + visibleBlocks * 62;

  // ── Handler: Iniciar abordaje ────────────────────────────────────────────
  const handleStartBoarding = async () => {
    if (!upcomingTrip || !token) return;
    setStartBoardingLoading(true);
    try {
      await tripLifecycleApi.startBoarding(upcomingTrip.id, token);
      setUpcomingTrip(null);       // Hide the card immediately
      await refreshActiveTrip();   // Fetch driver's active boarding trip → triggers BoardingScreen
    } catch (e: any) {
      Alert.alert('No se puede iniciar', e.message ?? 'Inténtalo de nuevo.');
    } finally {
      setStartBoardingLoading(false);
    }
  };

  // ── Conditional renders after all hooks ────────────────────────────────
  if (driverTrip) {
    return (
      <BoardingScreen
        trip={driverTrip}
        onTripEnded={() => { refreshActiveTrip(); }}
      />
    );
  }

  const openDateModal = () => {
    const source = selectedDate ?? new Date();
    const rawHour = source.getHours();
    const h12 = rawHour % 12 === 0 ? 12 : rawHour % 12;
    const period: 'AM' | 'PM' = rawHour < 12 ? 'AM' : 'PM';
    setCursorDate(new Date(source.getFullYear(), source.getMonth(), 1));
    setDraftDate(new Date(source.getFullYear(), source.getMonth(), source.getDate()));
    setDraftHour(h12);
    setDraftMinute(source.getMinutes());
    setDraftPeriod(period);
    setCalendarOpen(true);
    setTimeout(() => {
      hourScrollRef.current?.scrollTo({ y: (h12 - 1) * PICKER_ITEM_HEIGHT, animated: false });
      minuteScrollRef.current?.scrollTo({ y: source.getMinutes() * PICKER_ITEM_HEIGHT, animated: false });
    }, 0);
  };

  const onHourScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.max(0, Math.min(11, Math.round(e.nativeEvent.contentOffset.y / PICKER_ITEM_HEIGHT)));
    setDraftHour(idx + 1);
    hourScrollRef.current?.scrollTo({ y: idx * PICKER_ITEM_HEIGHT, animated: true });
  };

  const onMinuteScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.max(0, Math.min(59, Math.round(e.nativeEvent.contentOffset.y / PICKER_ITEM_HEIGHT)));
    setDraftMinute(idx);
    minuteScrollRef.current?.scrollTo({ y: idx * PICKER_ITEM_HEIGHT, animated: true });
  };

  const applyDateTime = () => {
    const base = draftDate ?? new Date();
    const merged = new Date(base);
    const hour24 = draftPeriod === 'AM'
      ? (draftHour === 12 ? 0 : draftHour)
      : (draftHour === 12 ? 12 : draftHour + 12);
    merged.setHours(hour24, draftMinute, 0, 0);
    setSelectedDate(merged);
    setCalendarOpen(false);
  };

  const publish = async () => {
    if (!from || !to || !selectedDate) {
      Alert.alert('Campos incompletos', 'Completa origen, destino, fecha y hora.');
      return;
    }
    if (!vehicleId) {
      Alert.alert('Sin vehículo', 'Selecciona un vehículo para ofrecer el viaje.');
      return;
    }
    if (!user?.id) {
      Alert.alert('Sesión expirada', 'Vuelve a iniciar sesión.');
      return;
    }
    if (!fromCoords) {
      Alert.alert('Origen sin coordenadas', 'Selecciona el origen desde las sugerencias para obtener su ubicación.');
      return;
    }
    if (!toCoords) {
      Alert.alert('Destino sin coordenadas', 'Selecciona el destino desde las sugerencias para obtener su ubicación.');
      return;
    }
    const payload = {
      driverId: user.id,
      vehicleId,
      rate: price,
      origin: from,
      destination: to,
      originLatitude: fromCoords.lat,
      originLongitude: fromCoords.lng,
      destinationLatitude: toCoords.lat,
      destinationLongitude: toCoords.lng,
      departureAt: selectedDate.toISOString(),
      totalSeats: seats,
      availableSeats: seats,
      notes,
      state: 0,
    };
    console.log('[publish] payload:', JSON.stringify(payload, null, 2));
    showLoader('Publicando viaje...');
    try {
      await post('/api/trips', payload, token ?? undefined);
      hideLoader();
      Alert.alert('¡Viaje publicado!', 'Tu viaje ya está disponible para los pasajeros.');
      setFrom(''); setFromCoords(null);
      setTo(''); setToCoords(null);
      setSelectedDate(null);
      setSeats(2); setPrice(1500); setNotes('');
    } catch (err) {
      hideLoader();
      console.error('[publish] error:', err);
      const msg = err instanceof ApiError
        ? `[${(err as ApiError).status}] ${err.message}`
        : 'No se pudo publicar el viaje.';
      Alert.alert('Error al publicar', msg);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic" style={{ backgroundColor: colors.bottomSurface }}>

        {/* ── Upcoming trip card: Iniciar abordaje ── */}
        {upcomingTrip && (
          <View style={upcomingStyles.wrapper}>
            <View style={[upcomingStyles.card, { backgroundColor: colors.inputBg, borderColor: Brand.colors.green.normal + '55' }]}>
              <View style={upcomingStyles.headerRow}>
                <View style={[upcomingStyles.dot, { backgroundColor: minsUntilBoarding === 0 ? Brand.colors.green.normal : '#f4a522' }]} />
                <Text style={[upcomingStyles.label, { color: minsUntilBoarding === 0 ? Brand.colors.green.normal : '#f4a522' }]}>
                  {minsUntilBoarding === 0 ? '¡Listo para abordar!' : `Abordaje en ${minsUntilBoarding} min`}
                </Text>
              </View>
              <Text style={[upcomingStyles.route, { color: colors.textPrimary }]} numberOfLines={1}>
                {upcomingTrip.origin} → {upcomingTrip.destination}
              </Text>
              <Text style={[upcomingStyles.time, { color: colors.textSecondary }]}>
                {new Date(upcomingTrip.departureAt).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })}
              </Text>
              <Pressable
                style={[
                  upcomingStyles.btn,
                  { backgroundColor: minsUntilBoarding === 0 ? Brand.colors.green.normal : colors.border },
                  startBoardingLoading && { opacity: 0.6 },
                ]}
                onPress={handleStartBoarding}
                disabled={startBoardingLoading}
              >
                {startBoardingLoading ? (
                  <Text style={[upcomingStyles.btnText, { color: '#fff' }]}>Iniciando…</Text>
                ) : (
                  <>
                    <Ionicons name="car-sport" size={16} color={minsUntilBoarding === 0 ? '#fff' : colors.textMuted} />
                    <Text style={[upcomingStyles.btnText, { color: minsUntilBoarding === 0 ? '#fff' : colors.textMuted }]}>
                      {minsUntilBoarding === 0 ? 'Iniciar abordaje' : 'Iniciar abordaje (aún no disponible)'}
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        )}

        <View style={[styles.heroWrap, { height: heroHeight }]}>
          <Image
            source={isDark ? require('../../assets/images/hero-banner-dark.jpg') : require('../../assets/images/hero-banner.jpg')}
            style={[styles.heroImage, { height: heroHeight }]}
          />
          <View style={styles.heroOverlay} />

          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.heroMini}>Pura Vida</Text>
              <Text style={styles.heroTitle}>Ofrece tu viaje</Text>
            </View>
            <Pressable onPress={() => setNotifOpen(true)} style={styles.bellBtn}>
              <Ionicons name="notifications-outline" size={20} color="#ecfff9" />
              <View style={styles.bellDot} />
            </Pressable>
          </View>

          <View style={styles.offerCardArea}>
            <GlassCard style={styles.offerCard} intensity={46}>
              <View style={styles.verticalField}>
                <Text style={styles.fieldLabel}>Origen</Text>
                <PlaceSearchInput
                  value={from}
                  onChangeText={(t) => { setFrom(t); setFromCoords(null); }}
                  onSelect={(pred: PlacePrediction) => {
                    setFrom(pred.description);
                    if (pred.coords) {
                      setFromCoords(pred.coords);
                    } else {
                      fetchPlaceCoords(pred.placeId).then(setFromCoords);
                    }
                  }}
                  leadingIcon={<Ionicons name="radio-button-on" size={12} color={Brand.colors.green.dark} />}
                  fieldStyle={styles.searchField}
                  placeholder="¿De dónde sales?"
                  placeholderTextColor={colors.textPlaceholder}
                />
              </View>

              {hasOrigin ? (
                <Animated.View
                  entering={FadeInDown.duration(220)}
                  exiting={FadeOut.duration(140)}
                  layout={LinearTransition.duration(220)}
                  style={styles.verticalField}
                >
                  <Text style={styles.fieldLabel}>Destino</Text>
                  <PlaceSearchInput
                    value={to}
                    onChangeText={(t) => { setTo(t); setToCoords(null); }}
                    onSelect={(pred: PlacePrediction) => {
                      setTo(pred.description);
                      if (pred.coords) {
                        setToCoords(pred.coords);
                      } else {
                        fetchPlaceCoords(pred.placeId).then(setToCoords);
                      }
                    }}
                    leadingIcon={<Ionicons name="location-outline" size={13} color={Brand.colors.green.normal} />}
                    fieldStyle={styles.searchField}
                    placeholder="¿A dónde vas?"
                    placeholderTextColor={colors.textPlaceholder}
                  />
                </Animated.View>
              ) : null}

              {hasDestination ? (
                <Animated.View
                  entering={FadeInDown.duration(220)}
                  exiting={FadeOut.duration(140)}
                  layout={LinearTransition.duration(220)}
                  style={styles.verticalField}
                >
                  <Text style={styles.fieldLabel}>Fecha y hora</Text>
                  <Pressable style={styles.searchField} onPress={openDateModal}>
                    <Ionicons name="calendar-outline" size={12} color={Brand.colors.green.dark} />
                    <Text style={[styles.searchInput, !selectedDate && styles.placeholderText]}>
                      {selectedDate
                        ? `${dateLabel(selectedDate)} · ${timeLabel(selectedDate.getHours(), selectedDate.getMinutes())}`
                        : 'Seleccionar fecha y hora'}
                    </Text>
                    <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
                  </Pressable>
                </Animated.View>
              ) : null}
            </GlassCard>
          </View>
        </View>

        <View style={styles.bottomSurface}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Detalles del viaje</Text>

            <View style={styles.countersRow}>
              <View style={[styles.counterBox, styles.flex1]}>
                <View style={styles.counterHead}>
                  <Ionicons name="people-outline" size={14} color={Brand.colors.green.normal} />
                  <Text style={styles.counterLabel}>Asientos</Text>
                </View>
                <View style={styles.counterRow}>
                  <Pressable style={styles.counterBtn} onPress={() => setSeats((p) => Math.max(1, p - 1))}>
                    <Text style={styles.counterBtnText}>-</Text>
                  </Pressable>
                  <Text style={styles.counterValue}>{seats}</Text>
                  <Pressable style={styles.counterBtn} onPress={() => setSeats((p) => Math.min(6, p + 1))}>
                    <Text style={styles.counterBtnText}>+</Text>
                  </Pressable>
                </View>
              </View>

              <View style={[styles.counterBox, styles.flex1]}>
                <View style={styles.counterHead}>
                  <Ionicons name="cash-outline" size={14} color={Brand.colors.green.normal} />
                  <Text style={styles.counterLabel}>Precio (CRC)</Text>
                </View>
                <TextInput
                  value={String(price)}
                  onChangeText={(t) => setPrice(Number(t.replace(/[^0-9]/g, '')) || 0)}
                  keyboardType="numeric"
                  style={styles.priceInput}
                />
              </View>
            </View>

            {!vehiclesLoading && vehicles.length === 0 && (
              <View style={noVehiclesWarning.container}>
                <Ionicons name="warning-outline" size={18} color={Brand.colors.alerts.error} />
                <View style={noVehiclesWarning.textWrap}>
                  <Text style={noVehiclesWarning.title}>
                    Sin vehículos registrados
                  </Text>
                  <Text style={noVehiclesWarning.subtitle}>
                    Registrá un vehículo desde tu perfil para poder ofrecer viajes.
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.vehicleSection}>
              <Text style={styles.sectionLabel}>Vehículo</Text>
              <Pressable
                style={[styles.vehiclePicker, vehicles.length === 0 && !vehiclesLoading && { opacity: 0.45 }]}
                onPress={() => vehicles.length > 0 && setVehicleModalOpen(true)}
                disabled={vehicles.length === 0 && !vehiclesLoading}>
                <View>
                  {vehiclesLoading ? (
                    <Text style={styles.vehicleName}>Cargando vehículos…</Text>
                  ) : selectedVehicle ? (
                    <>
                      <Text style={styles.vehicleName}>{selectedVehicle.name}</Text>
                      <Text style={styles.vehicleMeta}>{selectedVehicle.plate} · {selectedVehicle.color}</Text>
                    </>
                  ) : (
                    <Text style={[styles.vehicleName, { color: colors.textMuted }]}>Sin vehículos disponibles</Text>
                  )}
                </View>
                <Ionicons name="chevron-down" size={18} color={Brand.colors.green.dark} />
              </Pressable>
            </View>

            <View style={styles.notesWrap}>
              <Ionicons name="chatbubble-ellipses-outline" size={16} color={Brand.colors.green.normal} style={styles.notesIcon} />
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Notas para los pasajeros (opcional)"
                placeholderTextColor={colors.textPlaceholder}
                style={styles.notesInput}
                multiline
                numberOfLines={3}
                maxLength={100}
                textAlignVertical="top"
              />
            </View>
            <Text style={styles.charCount}>{remaining} caracteres restantes</Text>
          </View>

          <GlassCard style={styles.summary} intensity={34}>
            <View>
              <Text style={styles.summaryLabel}>Ganancia estimada</Text>
              <Text style={styles.summaryValue}>₡{estimated.toLocaleString()}</Text>
            </View>
            <View>
              <Text style={styles.summaryMath}>{seats} x ₡{price.toLocaleString()}</Text>
              <Text style={styles.summaryVehicle}>{selectedVehicle?.name ?? '—'}</Text>
            </View>
          </GlassCard>

          <Pressable
            style={[styles.cta, vehicles.length === 0 && { opacity: 0.45 }]}
            onPress={publish}
            disabled={vehicles.length === 0}>
            <Text style={styles.ctaText}>Publicar viaje</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Calendar modal */}
      <Modal visible={calendarOpen} transparent animationType="fade" onRequestClose={() => setCalendarOpen(false)}>
        <View style={styles.calendarBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setCalendarOpen(false)} />
          <GlassCard style={styles.calendarCard} intensity={44}>
            <View style={styles.calendarHeader}>
              <Pressable onPress={() => setCursorDate((p) => new Date(p.getFullYear(), p.getMonth() - 1, 1))}>
                <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
              </Pressable>
              <Text style={styles.calendarTitle}>{monthLabel(cursorDate)}</Text>
              <Pressable onPress={() => setCursorDate((p) => new Date(p.getFullYear(), p.getMonth() + 1, 1))}>
                <Ionicons name="chevron-forward" size={20} color={colors.textPrimary} />
              </Pressable>
            </View>

            <View style={styles.weekHeader}>
              {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day) => (
                <Text key={day} style={styles.weekDay}>{day}</Text>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {calendarDays.map((day, idx) => {
                const active = isSameDay(day, draftDate);
                return (
                  <Pressable
                    key={`day-${idx}`}
                    style={[styles.dayCell, active && styles.dayCellActive, !day && styles.dayCellEmpty]}
                    disabled={!day}
                    onPress={() => day && setDraftDate(day)}
                  >
                    <Text style={[styles.dayText, active && styles.dayTextActive]}>{day ? day.getDate() : ''}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.timeRow}>
              <View style={styles.timeColumn}>
                <Text style={styles.timeLabel}>Hora</Text>
                <View style={styles.wheelWrap}>
                  <ScrollView
                    ref={hourScrollRef}
                    style={styles.wheelScroll}
                    contentContainerStyle={styles.wheelContent}
                    showsVerticalScrollIndicator={false}
                    snapToInterval={PICKER_ITEM_HEIGHT}
                    decelerationRate="fast"
                    onMomentumScrollEnd={onHourScrollEnd}
                  >
                    {hours.map((hour) => (
                      <View key={hour} style={styles.wheelItem}>
                        <Text style={[styles.wheelItemText, draftHour === hour && styles.wheelItemTextActive]}>
                          {String(hour).padStart(2, '0')}
                        </Text>
                      </View>
                    ))}
                  </ScrollView>
                  <View pointerEvents="none" style={styles.wheelHighlight} />
                </View>
              </View>

              <View style={styles.timeColumn}>
                <Text style={styles.timeLabel}>Minutos</Text>
                <View style={styles.wheelWrap}>
                  <ScrollView
                    ref={minuteScrollRef}
                    style={styles.wheelScroll}
                    contentContainerStyle={styles.wheelContent}
                    showsVerticalScrollIndicator={false}
                    snapToInterval={PICKER_ITEM_HEIGHT}
                    decelerationRate="fast"
                    onMomentumScrollEnd={onMinuteScrollEnd}
                  >
                    {minutes.map((minute) => (
                      <View key={minute} style={styles.wheelItem}>
                        <Text style={[styles.wheelItemText, draftMinute === minute && styles.wheelItemTextActive]}>
                          {String(minute).padStart(2, '0')}
                        </Text>
                      </View>
                    ))}
                  </ScrollView>
                  <View pointerEvents="none" style={styles.wheelHighlight} />
                </View>
              </View>

              <View style={styles.ampmColumn}>
                <Text style={styles.timeLabel}>{' '}</Text>
                <View style={ampmContainerStyle.wrap}>
                  <Pressable
                    style={[styles.ampmBtn, draftPeriod === 'AM' && styles.ampmBtnActive]}
                    onPress={() => setDraftPeriod('AM')}
                  >
                    <Text style={[styles.ampmText, draftPeriod === 'AM' && styles.ampmTextActive]}>AM</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.ampmBtn, draftPeriod === 'PM' && styles.ampmBtnActive]}
                    onPress={() => setDraftPeriod('PM')}
                  >
                    <Text style={[styles.ampmText, draftPeriod === 'PM' && styles.ampmTextActive]}>PM</Text>
                  </Pressable>
                </View>
              </View>
            </View>

            <View style={styles.calendarActions}>
              <Pressable style={styles.cancelBtn} onPress={() => setCalendarOpen(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </Pressable>
              <Pressable style={styles.applyBtn} onPress={applyDateTime}>
                <Text style={styles.applyBtnText}>Aplicar</Text>
              </Pressable>
            </View>
          </GlassCard>
        </View>
      </Modal>

      {/* Vehicle picker modal */}
      <Modal visible={vehicleModalOpen} transparent animationType="fade" onRequestClose={() => setVehicleModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setVehicleModalOpen(false)} />
          <GlassCard style={styles.modalCard} intensity={40}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Elegir vehículo</Text>
              <Pressable onPress={() => setVehicleModalOpen(false)}>
                <Ionicons name="close" size={20} color={colors.textPrimary} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.modalList} showsVerticalScrollIndicator={false}>
              {vehicles.map((vehicle) => {
                const active = vehicle.id === vehicleId;
                return (
                  <Pressable
                    key={vehicle.id}
                    style={[styles.vehicleCard, active && styles.vehicleCardActive]}
                    onPress={() => { setVehicleId(vehicle.id); setVehicleModalOpen(false); }}
                  >
                    <View style={styles.vehicleTopRow}>
                      <View>
                        <Text style={styles.vehicleName}>{vehicle.name}</Text>
                        <Text style={styles.vehicleMeta}>{vehicle.plate} · {vehicle.color}</Text>
                      </View>
                      {active ? <Ionicons name="checkmark-circle" size={18} color={Brand.colors.green.normal} /> : null}
                    </View>
                    <Text style={styles.vehicleTag}>Disponible</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </GlassCard>
        </View>
      </Modal>

      <NotificationsModal visible={notifOpen} onClose={() => setNotifOpen(false)} />
    </View>
  );
}

