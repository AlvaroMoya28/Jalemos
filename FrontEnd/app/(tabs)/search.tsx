import { Ionicons } from '@expo/vector-icons';
import { useMemo, useRef, useState } from 'react';
import {
  Image,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import GlassCard from '@/components/glass-card';
import NotificationsModal from '@/components/NotificationsModal';
import RideCard, { Ride } from '@/components/RideCard';
import { Brand, Fonts, withElevation } from '@/constants/theme';
import Animated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';

// Static mock rides — replace with a real API call to GET /api/rides when the backend is ready
const rides: Ride[] = [
  {
    from: 'San Jose',
    to: 'Heredia',
    date: 'Hoy',
    time: '5:30 PM',
    price: 1500,
    seats: 3,
    driver: 'Carlos M.',
    rating: 4.8,
    avatar: 'CM',
  },
  {
    from: 'Cartago',
    to: 'San Jose',
    date: 'Mañana',
    time: '7:00 AM',
    price: 2000,
    seats: 2,
    driver: 'Maria R.',
    rating: 4.9,
    avatar: 'MR',
  },
  {
    from: 'Alajuela',
    to: 'Escazu',
    date: 'Mañana',
    time: '8:15 AM',
    price: 1800,
    seats: 4,
    driver: 'Jose L.',
    rating: 4.7,
    avatar: 'JL',
  },
  {
    from: 'Liberia',
    to: 'Tamarindo',
    date: 'Vie 18',
    time: '10:00 AM',
    price: 3500,
    seats: 1,
    driver: 'Ana P.',
    rating: 5,
    avatar: 'AP',
  },
];

// Shortcut routes shown as chips below the search card for quick selection
const quickRoutes = [
  { from: 'San Jose', to: 'Heredia' },
  { from: 'Cartago', to: 'San Jose' },
  { from: 'Alajuela', to: 'SJO' },
];

// Scroll-wheel picker constants — each row is 36 px tall and 5 rows are visible at once
const PICKER_ITEM_HEIGHT = 36;
const PICKER_VISIBLE_ROWS = 5;
const PICKER_HEIGHT = PICKER_ITEM_HEIGHT * PICKER_VISIBLE_ROWS;
// Pre-built arrays for the hour and minute scroll wheels
const hours = Array.from({ length: 24 }, (_, idx) => idx);
const minutes = Array.from({ length: 60 }, (_, idx) => idx);

/** Returns a localised month + year string, e.g. "mayo 2026". */
function monthLabel(date: Date) {
  return date.toLocaleDateString('es-CR', { month: 'long', year: 'numeric' });
}

/** Returns a short date string used on the date-picker button, e.g. "lun. 12 may.". */
function dateLabel(date: Date) {
  return date.toLocaleDateString('es-CR', { weekday: 'short', day: 'numeric', month: 'short' });
}

/** Formats hour and minute as a zero-padded HH:MM string. */
function timeLabel(hour: number, minute: number) {
  const h = String(hour).padStart(2, '0');
  const m = String(minute).padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Builds the flat array of Date | null cells for the calendar grid.
 * Leading nulls pad the first week so days align with Mon–Sun headers.
 * Trailing nulls fill the last row to complete the 7-column grid.
 */
function buildCalendarDays(cursor: Date) {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0).getDate();
  // Convert Sunday-first (0) to Monday-first (0) index: (0+6)%7 = 6 → Sunday last
  const startIndex = (first.getDay() + 6) % 7;
  const cells: (Date | null)[] = [];

  for (let i = 0; i < startIndex; i += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= lastDay; day += 1) {
    cells.push(new Date(year, month, day));
  }

  // Fill remainder of the last week row with null placeholders
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

/** Returns true when both dates represent the same calendar day. */
function isSameDay(a: Date | null, b: Date | null) {
  if (!a || !b) {
    return false;
  }
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Search screen — the app's main ride-discovery view.
 * The search card progressively reveals fields as the user fills them in:
 * Origin → Destination → Date/Time → Seats → Search button.
 * Results are filtered client-side until a real API is connected.
 */
export default function SearchScreen() {
  // Search form state
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [seats, setSeats] = useState(1);
  const [notifOpen, setNotifOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Calendar / time-picker modal state (draft values are committed only on "Apply")
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [cursorDate, setCursorDate] = useState(() => new Date());
  const [draftDate, setDraftDate] = useState<Date | null>(null);
  const [draftHour, setDraftHour] = useState(7);
  const [draftMinute, setDraftMinute] = useState(0);
  // Refs to the scroll-wheel ScrollViews so we can programmatically snap them
  const hourScrollRef = useRef<ScrollView>(null);
  const minuteScrollRef = useRef<ScrollView>(null);

  // Flag flipped when the user presses "Search" — hides default results until then
  const [hasSearched, setHasSearched] = useState(false);

  // Progressive disclosure flags — each new field unlocks after the previous one is filled
  const hasOrigin = from.trim().length > 0;
  const hasDestination = to.trim().length > 0;
  const hasDate = selectedDate !== null;
  const hasAnyInput = hasOrigin || hasDestination || hasDate || seats !== 1;

  // Hero image height grows as more form fields become visible to avoid content overlap
  const visibleBlocks = 1 + (hasOrigin ? 1 : 0) + (hasDestination ? 1 : 0) + (hasDate ? 2 : 0);
  const heroHeight = 280 + visibleBlocks * 62;

  // Recompute calendar grid only when the viewed month changes
  const calendarDays = useMemo(() => buildCalendarDays(cursorDate), [cursorDate]);

  // Filter rides by origin/destination text — case-insensitive substring match
  const filteredRides = useMemo(() => {
    if (!hasSearched) return rides;
    return rides.filter((ride) => {
      const matchFrom = !from.trim() || ride.from.toLowerCase().includes(from.trim().toLowerCase());
      const matchTo = !to.trim() || ride.to.toLowerCase().includes(to.trim().toLowerCase());
      return matchFrom && matchTo;
    });
  }, [hasSearched, from, to]);

  /** Opens the date/time picker modal, pre-populating it with the currently selected date. */
  const openDateModal = () => {
    const source = selectedDate ?? new Date();
    setCursorDate(new Date(source.getFullYear(), source.getMonth(), 1));
    setDraftDate(new Date(source.getFullYear(), source.getMonth(), source.getDate()));
    setDraftHour(source.getHours());
    setDraftMinute(source.getMinutes());
    setCalendarOpen(true);

    // Defer scroll to next frame so the ScrollView layout is ready before scrollTo fires
    setTimeout(() => {
      hourScrollRef.current?.scrollTo({ y: source.getHours() * PICKER_ITEM_HEIGHT, animated: false });
      minuteScrollRef.current?.scrollTo({ y: source.getMinutes() * PICKER_ITEM_HEIGHT, animated: false });
    }, 0);
  };

  /** Snaps the hour wheel to the nearest valid index after a momentum scroll ends. */
  const onHourScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.max(0, Math.min(23, Math.round(event.nativeEvent.contentOffset.y / PICKER_ITEM_HEIGHT)));
    setDraftHour(idx);
    hourScrollRef.current?.scrollTo({ y: idx * PICKER_ITEM_HEIGHT, animated: true });
  };

  /** Snaps the minute wheel to the nearest valid index after a momentum scroll ends. */
  const onMinuteScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.max(0, Math.min(59, Math.round(event.nativeEvent.contentOffset.y / PICKER_ITEM_HEIGHT)));
    setDraftMinute(idx);
    minuteScrollRef.current?.scrollTo({ y: idx * PICKER_ITEM_HEIGHT, animated: true });
  };

  /** Merges the draft date and time into a single Date and commits it as selectedDate. */
  const applyDateTime = () => {
    const base = draftDate ?? new Date();
    const merged = new Date(base);
    merged.setHours(draftHour, draftMinute, 0, 0);
    setSelectedDate(merged);
    setCalendarOpen(false);
  };

  /** Resets all search fields back to their initial state. */
  const clearSearch = () => {
    setFrom('');
    setTo('');
    setSelectedDate(null);
    setSeats(1);
    setCalendarOpen(false);
    setHasSearched(false);
  };

  /** Applies a quick-route chip selection and immediately triggers a search. */
  const applyQuickRoute = (routeFrom: string, routeTo: string) => {
    setFrom(routeFrom);
    setTo(routeTo);
    setHasSearched(true);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.heroWrap, { height: heroHeight }]}> 
          <Image source={require('../../assets/images/hero-banner.jpg')} style={[styles.heroImage, { height: heroHeight }]} />
          <View style={styles.heroOverlay} />

          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.heroMini}>Pura Vida</Text>
              <Text style={styles.heroTitle}>¿A dónde jalamos?</Text>
            </View>
            <Pressable onPress={() => setNotifOpen(true)} style={styles.bellBtn}>
              <Ionicons name="notifications-outline" size={20} color="#ecfff9" />
              <View style={styles.bellDot} />
            </Pressable>
          </View>

          <GlassCard style={styles.searchCard} intensity={46}>
            <View style={styles.verticalField}>
              <Text style={styles.fieldLabel}>Origen</Text>
              <View style={styles.searchField}>
                <Ionicons name="radio-button-on" size={12} color="#0e8d75" />
                <TextInput
                  value={from}
                  onChangeText={setFrom}
                  placeholder="De"
                  placeholderTextColor="#758783"
                  style={styles.searchInput}
                />
              </View>
            </View>

            {hasOrigin ? (
              <Animated.View
                entering={FadeInDown.duration(220)}
                exiting={FadeOut.duration(140)}
                layout={LinearTransition.duration(220)}
                style={styles.verticalField}
              >
                <Text style={styles.fieldLabel}>Destino</Text>
                <View style={styles.searchField}>
                  <Ionicons name="location-outline" size={13} color="#15a88a" />
                  <TextInput
                    value={to}
                    onChangeText={setTo}
                    placeholder="A"
                    placeholderTextColor="#758783"
                    style={styles.searchInput}
                  />
                </View>
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
                  <Ionicons name="calendar-outline" size={12} color="#0e8d75" />
                  <Text style={[styles.searchInput, !selectedDate && styles.placeholderText]}>
                    {selectedDate ? `${dateLabel(selectedDate)} · ${timeLabel(selectedDate.getHours(), selectedDate.getMinutes())}` : 'Seleccionar fecha y hora'}
                  </Text>
                  <Ionicons name="chevron-down" size={14} color="#6d7f7b" />
                </Pressable>
              </Animated.View>
            ) : null}

            {hasDate ? (
              <Animated.View
                entering={FadeInDown.duration(220)}
                exiting={FadeOut.duration(140)}
                layout={LinearTransition.duration(220)}
                style={styles.verticalField}
              >
                <Text style={styles.fieldLabel}>Plazas</Text>
                <View style={styles.seatCompact}>
                  <Pressable style={styles.seatAction} onPress={() => setSeats((prev) => Math.max(1, prev - 1))}>
                    <Ionicons name="remove" size={15} color={Brand.colors.black.b1} />
                  </Pressable>
                  <Text style={styles.seatNumber}>{seats}</Text>
                  <Pressable style={styles.seatAction} onPress={() => setSeats((prev) => Math.min(6, prev + 1))}>
                    <Ionicons name="add" size={15} color={Brand.colors.black.b1} />
                  </Pressable>
                </View>
              </Animated.View>
            ) : null}

            {hasDate ? (
              <Animated.View
                entering={FadeInDown.duration(220)}
                exiting={FadeOut.duration(140)}
                layout={LinearTransition.duration(220)}
                style={styles.actionRow}
              >
                {hasAnyInput ? (
                  <Pressable style={styles.clearBtn} onPress={clearSearch}>
                    <Text style={styles.clearBtnText}>Limpiar</Text>
                  </Pressable>
                ) : null}
                <Pressable style={styles.searchBtn} onPress={() => setHasSearched(true)}>
                  <Text style={styles.searchBtnText}>Buscar</Text>
                </Pressable>
              </Animated.View>
            ) : null}
          </GlassCard>
        </View>

        <View style={styles.bottomSurface}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.quickFilters}
            contentContainerStyle={styles.quickFiltersContent}
          >
            <Pressable style={styles.filterBtn}>
              <Ionicons name="locate-outline" size={14} color="#0e8d75" />
              <Text style={styles.filterText}>Cerca de mí</Text>
            </Pressable>
            <Pressable style={styles.filterBtn}>
              <Ionicons name="calendar-outline" size={14} color="#0e8d75" />
              <Text style={styles.filterText}>Hoy</Text>
            </Pressable>
            <Pressable style={styles.filterBtn}>
              <Text style={styles.filterText}>Más baratos</Text>
            </Pressable>
          </ScrollView>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rutas populares</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.routesRow}>
              {quickRoutes.map((route) => (
                <Pressable key={`${route.from}-${route.to}`} style={styles.routeChip} onPress={() => applyQuickRoute(route.from, route.to)}>
                  <Text style={styles.routeChipText}>
                    {route.from} - {route.to}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {hasSearched ? `${filteredRides.length} resultado${filteredRides.length !== 1 ? 's' : ''}` : 'Viajes disponibles'}
              </Text>
              {hasSearched ? (
                <Pressable onPress={clearSearch}>
                  <Text style={styles.sectionLink}>Ver todos</Text>
                </Pressable>
              ) : null}
            </View>

            {filteredRides.length > 0 ? (
              <View style={styles.rideList}>
                {filteredRides.map((ride, idx) => (
                  <RideCard key={`${ride.driver}-${idx}`} ride={ride} />
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No hay viajes para esa ruta</Text>
                <Pressable onPress={clearSearch}>
                  <Text style={styles.sectionLink}>Ver todos los viajes</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <Modal visible={calendarOpen} transparent animationType="fade" onRequestClose={() => setCalendarOpen(false)}>
        <View style={styles.calendarBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setCalendarOpen(false)} />
          <GlassCard style={styles.calendarCard} intensity={44}>
            <View style={styles.calendarHeader}>
              <Pressable onPress={() => setCursorDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}>
                <Ionicons name="chevron-back" size={20} color={Brand.colors.black.b10} />
              </Pressable>
              <Text style={styles.calendarTitle}>{monthLabel(cursorDate)}</Text>
              <Pressable onPress={() => setCursorDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}>
                <Ionicons name="chevron-forward" size={20} color={Brand.colors.black.b10} />
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

      <NotificationsModal visible={notifOpen} onClose={() => setNotifOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.colors.black.b3,
  },
  content: {
    paddingBottom: 26,
  },
  heroWrap: {
    position: 'relative',
  },
  heroImage: {
    width: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 63, 57, 0.38)',
  },
  heroHeader: {
    position: 'absolute',
    top: 58,
    left: Brand.grid.margin,
    right: Brand.grid.margin,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroMini: {
    color: Brand.colors.green.light,
    fontSize: 13,
    fontFamily: Fonts.heading,
  },
  heroTitle: {
    color: Brand.colors.black.b1,
    fontSize: 32,
    fontFamily: Fonts.headingHeavy,
  },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  bellDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#ffb13e',
  },
  searchCard: {
    position: 'absolute',
    left: Brand.grid.margin,
    right: Brand.grid.margin,
    top: 194,
    borderRadius: Brand.radius[16],
    padding: Brand.spacing[12],
    gap: 8,
    ...withElevation(400),
  },
  verticalField: {
    gap: 5,
  },
  fieldLabel: {
    color: Brand.colors.black.b8,
    fontSize: 11,
    fontFamily: Fonts.headingBold,
    marginLeft: 2,
  },
  searchField: {
    borderRadius: Brand.radius[12],
    borderWidth: 1,
    borderColor: Brand.colors.green.light,
    backgroundColor: Brand.colors.black.b1,
    paddingHorizontal: 10,
    paddingVertical: 9,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: Brand.colors.black.b10,
    fontFamily: Fonts.heading,
  },
  placeholderText: {
    color: '#758783',
  },
  seatCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Brand.radius[12],
    borderWidth: 1,
    borderColor: Brand.colors.green.light,
    backgroundColor: 'rgba(255, 255, 255, 0.68)',
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  seatAction: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Brand.colors.green.normal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seatNumber: {
    minWidth: 24,
    textAlign: 'center',
    fontSize: 16,
    color: Brand.colors.black.b10,
    fontFamily: Fonts.headingBold,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  clearBtn: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Brand.colors.green.normal,
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  clearBtnText: {
    color: Brand.colors.green.dark,
    fontFamily: Fonts.headingBold,
    fontSize: 12,
  },
  searchBtn: {
    borderRadius: 999,
    backgroundColor: Brand.colors.green.normal,
    paddingHorizontal: 11,
    paddingVertical: 12,
    alignItems: 'center',
    flex: 1,
  },
  searchBtnText: {
    color: Brand.colors.black.b1,
    fontSize: 12,
    fontFamily: Fonts.headingBold,
  },
  bottomSurface: {
    backgroundColor: Brand.colors.black.b1,
    borderTopLeftRadius: Brand.radius[24],
    borderTopRightRadius: Brand.radius[24],
    marginTop: -4,
    paddingTop: 18,
    paddingBottom: 10,
  },
  quickFilters: {
    marginTop: 0,
  },
  quickFiltersContent: {
    paddingHorizontal: Brand.grid.margin,
    gap: 8,
  },
  filterBtn: {
    borderRadius: Brand.radius[12],
    borderWidth: 1,
    borderColor: Brand.colors.green.light,
    backgroundColor: Brand.colors.black.b2,
    paddingVertical: 8,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  filterText: {
    color: Brand.colors.black.b10,
    fontSize: 12,
    fontFamily: Fonts.heading,
  },
  section: {
    marginTop: 14,
    paddingHorizontal: Brand.grid.margin,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    color: Brand.colors.black.b10,
    fontFamily: Fonts.headingBold,
    fontSize: 15,
  },
  sectionLink: {
    color: Brand.colors.green.normal,
    fontFamily: Fonts.heading,
    fontSize: 12,
  },
  routesRow: {
    gap: 8,
  },
  routeChip: {
    borderRadius: 999,
    backgroundColor: Brand.colors.green.normal,
    paddingVertical: 9,
    paddingHorizontal: 13,
  },
  routeChipText: {
    color: Brand.colors.black.b1,
    fontSize: 12,
    fontFamily: Fonts.heading,
  },
  rideList: {
    gap: 9,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 28,
    gap: 10,
  },
  emptyText: {
    color: Brand.colors.black.b7,
    fontFamily: Fonts.heading,
    fontSize: 14,
  },
  calendarBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(8, 24, 22, 0.62)',
    justifyContent: 'center',
    paddingHorizontal: Brand.grid.margin,
  },
  calendarCard: {
    borderRadius: Brand.radius[16],
    padding: 14,
    gap: 12,
    backgroundColor: 'rgba(245, 253, 250, 0.95)',
    borderColor: 'rgba(186, 226, 221, 0.95)',
    borderWidth: 1,
    ...withElevation(400),
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calendarTitle: {
    color: Brand.colors.black.b10,
    fontFamily: Fonts.headingBold,
    fontSize: 16,
    textTransform: 'capitalize',
  },
  weekHeader: {
    flexDirection: 'row',
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    color: Brand.colors.black.b7,
    fontSize: 11,
    fontFamily: Fonts.heading,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 6,
  },
  dayCell: {
    width: '14.2857%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 10,
  },
  dayCellEmpty: {
    opacity: 0,
  },
  dayCellActive: {
    backgroundColor: Brand.colors.green.normal,
  },
  dayText: {
    color: Brand.colors.black.b10,
    fontSize: 12,
    fontFamily: Fonts.heading,
  },
  dayTextActive: {
    color: Brand.colors.black.b1,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  timeColumn: {
    flex: 1,
    gap: 6,
  },
  timeLabel: {
    color: Brand.colors.black.b8,
    fontSize: 11,
    fontFamily: Fonts.headingBold,
    textTransform: 'uppercase',
  },
  wheelWrap: {
    height: PICKER_HEIGHT,
    borderRadius: Brand.radius[12],
    borderWidth: 1,
    borderColor: Brand.colors.green.light,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    overflow: 'hidden',
  },
  wheelScroll: {
    flex: 1,
  },
  wheelContent: {
    paddingVertical: PICKER_ITEM_HEIGHT * 2,
  },
  wheelItem: {
    height: PICKER_ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelItemText: {
    color: Brand.colors.black.b8,
    fontFamily: Fonts.heading,
    fontSize: 16,
  },
  wheelItemTextActive: {
    color: Brand.colors.green.dark,
    fontFamily: Fonts.headingBold,
  },
  wheelHighlight: {
    position: 'absolute',
    left: 6,
    right: 6,
    top: PICKER_ITEM_HEIGHT * 2,
    height: PICKER_ITEM_HEIGHT,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Brand.colors.green.light,
    backgroundColor: 'rgba(26, 158, 143, 0.1)',
  },
  calendarActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  cancelBtn: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Brand.colors.green.light,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  cancelBtnText: {
    color: Brand.colors.black.b8,
    fontFamily: Fonts.heading,
    fontSize: 12,
  },
  applyBtn: {
    borderRadius: 999,
    backgroundColor: Brand.colors.green.normal,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  applyBtnText: {
    color: Brand.colors.black.b1,
    fontFamily: Fonts.headingBold,
    fontSize: 12,
  },
});
