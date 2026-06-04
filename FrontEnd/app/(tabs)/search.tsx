// Search (Buscar) tab — passenger's main screen for finding available rides.
// Displays a hero banner, a quick origin-input card, filter chips (nearby / today / cheapest),
// popular-route shortcuts, and a live-filtered list of ride cards.
// Tab icon and title are set via navigation.setOptions on mount so the NativeTabs
// native pipeline receives the SF Symbol without the EXPO_OS guard blocking it.
// contentInsetAdjustmentBehavior="automatic" lets iOS shift scroll content above the
// floating NativeTabs bar without manual padding calculations.

import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import GlassCard from "@/components/glass-card";
import NotificationsModal from "@/components/NotificationsModal";
import PlaceSearchInput from "@/components/place-search-input";
import RideCard, { Ride } from "@/components/RideCard";
import { Brand } from "@/constants/theme";
import { makeStyles, staticStyles as searchStaticStyles } from "../../styles/tabs/search.styles";
import { useAuth } from "@/contexts/auth";
import { bookingsApi } from '@/services/api';
import { useLoading } from "@/contexts/loading";
import { useTripsData } from "@/hooks/use-trips-data";
import { useUserMode } from "@/contexts/user-mode";
import { useAppTheme } from "@/hooks/use-app-theme";
import Animated, {
  FadeInDown,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";

// Convert `Trip` context objects into the lightweight `Ride` shape used by the UI

// Shortcut routes shown as chips below the search card for quick selection
const quickRoutes = [
  { from: "San Jose", to: "Heredia" },
  { from: "Cartago", to: "San Jose" },
  { from: "Alajuela", to: "SJO" },
];

// Scroll-wheel picker constants — each row is 36 px tall and 5 rows are visible at once
const PICKER_ITEM_HEIGHT = 36;
const HOUR_COUNT   = 12;
const MIN_COUNT    = 60;
const HOUR_REPS    = 100;
const MIN_REPS     = 10;
const infiniteHours   = Array.from({ length: HOUR_REPS * HOUR_COUNT }, (_, i) => (i % HOUR_COUNT) + 1);
const infiniteMinutes = Array.from({ length: MIN_REPS  * MIN_COUNT  }, (_, i) => i % MIN_COUNT);
const HOURS_CENTER = Math.floor(HOUR_REPS / 2) * HOUR_COUNT; // 600
const MINS_CENTER  = Math.floor(MIN_REPS  / 2) * MIN_COUNT;  // 300

function monthLabel(date: Date) {
  return date.toLocaleDateString("es-CR", { month: "long", year: "numeric" });
}

function dateLabel(date: Date) {
  return date.toLocaleDateString("es-CR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function timeLabel(hour: number, minute: number) {
  const period = hour < 12 ? "AM" : "PM";
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}:${String(minute).padStart(2, "0")} ${period}`;
}

function buildCalendarDays(cursor: Date) {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0).getDate();
  const startIndex = (first.getDay() + 6) % 7;
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startIndex; i += 1) cells.push(null);
  for (let day = 1; day <= lastDay; day += 1)
    cells.push(new Date(year, month, day));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function isSameDay(a: Date | null, b: Date | null) {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Search screen — the app's main ride-discovery view.
 * The search card progressively reveals fields as the user fills them in.
 * Results are filtered client-side until a real API is connected.
 */
export default function SearchScreen() {
  const { isDark, colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation();
  const router = useRouter();
  const { showLoader, hideLoader } = useLoading();
  useEffect(() => {
    navigation.setOptions({ title: "Buscar", icon: { sf: "magnifyingglass" } });
  }, [navigation]);

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [seats, setSeats] = useState(1);
  const [notifOpen, setNotifOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const [calendarOpen, setCalendarOpen] = useState(false);
  const [cursorDate, setCursorDate] = useState(() => new Date());
  const [draftDate, setDraftDate] = useState<Date | null>(null);
  const [draftHour, setDraftHour] = useState(7);
  const [draftMinute, setDraftMinute] = useState(0);
  const [draftPeriod, setDraftPeriod] = useState<"AM" | "PM">("AM");
  const hourScrollRef = useRef<ScrollView>(null);
  const minuteScrollRef = useRef<ScrollView>(null);

  const [hasSearched, setHasSearched] = useState(false);
  const { trips, refreshTrips } = useTripsData();
  const [bookings, setBookings] = useState<any[] | null>(null);
  const { user, token } = useAuth();
  const { mode } = useUserMode();

  useFocusEffect(
    useCallback(() => {
      refreshTrips();
      let mounted = true;
      (async () => {
        // fetch user's bookings to know which trips they've already reserved
        // only try if we have a token
        if (!token) {
          setBookings([]);
          return;
        }
        try {
          const list = await bookingsApi.getAll(token);
          if (!mounted) return;
          setBookings(Array.isArray(list) ? list : []);
        } catch {
          if (mounted) setBookings([]);
        }
      })();

      return () => {
        mounted = false;
      };
    }, [refreshTrips, token]),
  );

  const rides: Ride[] = useMemo(() => {
    if (!trips) return [];
    const now = new Date();
    const visibleTrips = trips.filter((t) => {
      // Hide past trips (defense in depth — backend already filters, but guard client-side too)
      if (t.departureAt && new Date(t.departureAt) <= now) return false;
      // Hide trips the user created (as a driver) when browsing as passenger
      if (mode === "passenger" && user?.id && t.driverId === user.id)
        return false;
      // When in passenger mode, only show trips with at least one available seat
      if (
        mode === "passenger" &&
        (typeof t.availableSeats !== "number" || t.availableSeats <= 0)
      )
        return false;
      // Hide trips the current passenger already booked (even if other seats exist)
      if (
        mode === 'passenger' &&
        bookings &&
        bookings.some((b: any) => b.tripId === t.id && b.passengerId === user?.id)
      ) {
        return false;
      }
      return true;
    });
    return visibleTrips.map((t) => {
      const nameParts = t.driverName.split(" ");
      const firstName = nameParts[0] ?? "";
      const lastInitial = nameParts[1]?.[0] ?? "";
      const dep = new Date(t.departureAt);
      return {
        id: t.id,
        from: t.origin,
        to: t.destination,
        date: dateLabel(dep),
        time: timeLabel(dep.getHours(), dep.getMinutes()),
        price: t.rate,
        seats: t.availableSeats,
        driver: `${firstName} ${lastInitial}.`,
        rating: t.driverRating,
        avatar: `${firstName[0] ?? ""}${nameParts[1]?.[0] ?? ""}`.toUpperCase(),
      } as Ride;
    });
  }, [trips, mode, user?.id, bookings]);

  const hasOrigin = from.trim().length > 0;
  const hasDestination = to.trim().length > 0;
  const hasDate = selectedDate !== null;
  const hasAnyInput = hasOrigin || hasDestination || hasDate || seats !== 1;

  const visibleBlocks =
    1 + (hasOrigin ? 1 : 0) + (hasDestination ? 1 : 0) + (hasDate ? 2 : 0);
  const heroHeight = 280 + visibleBlocks * 62;

  const calendarDays = useMemo(
    () => buildCalendarDays(cursorDate),
    [cursorDate],
  );

  const filteredRides = useMemo(() => {
    if (!hasSearched) return rides;
    return rides.filter((ride) => {
      const matchFrom =
        !from.trim() ||
        ride.from.toLowerCase().includes(from.trim().toLowerCase());
      const matchTo =
        !to.trim() || ride.to.toLowerCase().includes(to.trim().toLowerCase());
      return matchFrom && matchTo;
    });
  }, [hasSearched, from, to, rides]);

  const noTripsExist = !trips || trips.length === 0;

  const handleSearch = useCallback(async () => {
    showLoader("Buscando viajes...");
    try {
      await refreshTrips();
      setHasSearched(true);
    } finally {
      hideLoader();
    }
  }, [showLoader, hideLoader, refreshTrips]);

  const handleRidePress = useCallback(
    async (id: string) => {
      showLoader("Cargando viaje...");
      await new Promise<void>((resolve) => setTimeout(resolve, 400));
      hideLoader();
      router.push({ pathname: "/ride-detail", params: { id } });
    },
    [showLoader, hideLoader, router],
  );

  const openDateModal = () => {
    const source = selectedDate ?? new Date();
    const rawHour = source.getHours();
    const h12 = rawHour % 12 === 0 ? 12 : rawHour % 12;
    const period: "AM" | "PM" = rawHour < 12 ? "AM" : "PM";
    setCursorDate(new Date(source.getFullYear(), source.getMonth(), 1));
    setDraftDate(
      new Date(source.getFullYear(), source.getMonth(), source.getDate()),
    );
    setDraftHour(h12);
    setDraftMinute(source.getMinutes());
    setDraftPeriod(period);
    setCalendarOpen(true);
    setTimeout(() => {
      hourScrollRef.current?.scrollTo({
        y: (HOURS_CENTER + h12 - 1) * PICKER_ITEM_HEIGHT,
        animated: false,
      });
      minuteScrollRef.current?.scrollTo({
        y: (MINS_CENTER + source.getMinutes()) * PICKER_ITEM_HEIGHT,
        animated: false,
      });
    }, 0);
  };

  const onHourScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.max(
      0,
      Math.min(
        infiniteHours.length - 1,
        Math.round(event.nativeEvent.contentOffset.y / PICKER_ITEM_HEIGHT),
      ),
    );
    setDraftHour(infiniteHours[idx]);
    hourScrollRef.current?.scrollTo({
      y: idx * PICKER_ITEM_HEIGHT,
      animated: true,
    });
  };

  const onMinuteScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const idx = Math.max(
      0,
      Math.min(
        infiniteMinutes.length - 1,
        Math.round(event.nativeEvent.contentOffset.y / PICKER_ITEM_HEIGHT),
      ),
    );
    setDraftMinute(infiniteMinutes[idx]);
    minuteScrollRef.current?.scrollTo({
      y: idx * PICKER_ITEM_HEIGHT,
      animated: true,
    });
  };

  const applyDateTime = () => {
    const base = draftDate ?? new Date();
    const merged = new Date(base);
    const hour24 =
      draftPeriod === "AM"
        ? draftHour === 12
          ? 0
          : draftHour
        : draftHour === 12
          ? 12
          : draftHour + 12;
    merged.setHours(hour24, draftMinute, 0, 0);
    setSelectedDate(merged);
    setCalendarOpen(false);
  };

  const clearSearch = () => {
    setFrom("");
    setTo("");
    setSelectedDate(null);
    setSeats(1);
    setCalendarOpen(false);
    setHasSearched(false);
  };

  const applyQuickRoute = (routeFrom: string, routeTo: string) => {
    setFrom(routeFrom);
    setTo(routeTo);
    setHasSearched(true);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        style={{ backgroundColor: colors.bottomSurface }}
      >
        <View style={[styles.heroWrap, { height: heroHeight }]}>
          <Image
            source={
              isDark
                ? require("../../assets/images/hero-banner-dark.jpg")
                : require("../../assets/images/hero-banner.jpg")
            }
            style={[styles.heroImage, { height: heroHeight }]}
          />
          <View style={styles.heroOverlay} />

          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.heroMini}>Pura Vida</Text>
              <Text style={styles.heroTitle}>¿A dónde jalamos?</Text>
            </View>
            <Pressable
              onPress={() => setNotifOpen(true)}
              style={styles.bellBtn}
            >
              <Ionicons
                name="notifications-outline"
                size={20}
                color="#ecfff9"
              />
              <View style={styles.bellDot} />
            </Pressable>
          </View>

          <View style={styles.searchCardArea}>
            <GlassCard style={styles.searchCard} intensity={46}>
              <View style={styles.verticalField}>
                <Text style={styles.fieldLabel}>Origen</Text>
                <PlaceSearchInput
                  value={from}
                  onChangeText={setFrom}
                  onSelect={(pred) => setFrom(pred.description)}
                  leadingIcon={
                    <Ionicons
                      name="radio-button-on"
                      size={12}
                      color={Brand.colors.green.dark}
                    />
                  }
                  fieldStyle={styles.searchField}
                  placeholder="De"
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
                    onChangeText={setTo}
                    onSelect={(pred) => setTo(pred.description)}
                    leadingIcon={
                      <Ionicons
                        name="location-outline"
                        size={13}
                        color={Brand.colors.green.normal}
                      />
                    }
                    fieldStyle={styles.searchField}
                    placeholder="A"
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
                    <Ionicons
                      name="calendar-outline"
                      size={12}
                      color={Brand.colors.green.dark}
                    />
                    <Text
                      style={[
                        styles.searchInput,
                        !selectedDate && styles.placeholderText,
                      ]}
                    >
                      {selectedDate
                        ? `${dateLabel(selectedDate)} · ${timeLabel(selectedDate.getHours(), selectedDate.getMinutes())}`
                        : "Seleccionar fecha y hora"}
                    </Text>
                    <Ionicons
                      name="chevron-down"
                      size={14}
                      color={colors.textMuted}
                    />
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
                    <Pressable
                      style={styles.seatAction}
                      onPress={() => setSeats((prev) => Math.max(1, prev - 1))}
                    >
                      <Ionicons
                        name="remove"
                        size={15}
                        color={Brand.colors.black.b1}
                      />
                    </Pressable>
                    <Text style={styles.seatNumber}>{seats}</Text>
                    <Pressable
                      style={styles.seatAction}
                      onPress={() => setSeats((prev) => Math.min(6, prev + 1))}
                    >
                      <Ionicons
                        name="add"
                        size={15}
                        color={Brand.colors.black.b1}
                      />
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
                  <Pressable style={styles.searchBtn} onPress={handleSearch}>
                    <Text style={styles.searchBtnText}>Buscar</Text>
                  </Pressable>
                </Animated.View>
              ) : null}
            </GlassCard>
          </View>
        </View>

        <View style={styles.bottomSurface}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.quickFilters}
            contentContainerStyle={styles.quickFiltersContent}
          >
            <Pressable style={styles.filterBtn}>
              <Ionicons
                name="locate-outline"
                size={14}
                color={Brand.colors.green.dark}
              />
              <Text style={styles.filterText}>Cerca de mí</Text>
            </Pressable>
            <Pressable style={styles.filterBtn}>
              <Ionicons
                name="calendar-outline"
                size={14}
                color={Brand.colors.green.dark}
              />
              <Text style={styles.filterText}>Hoy</Text>
            </Pressable>
            <Pressable style={styles.filterBtn}>
              <Text style={styles.filterText}>Más baratos</Text>
            </Pressable>
          </ScrollView>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rutas populares</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.routesRow}
            >
              {quickRoutes.map((route) => (
                <Pressable
                  key={`${route.from}-${route.to}`}
                  style={styles.routeChip}
                  onPress={() => applyQuickRoute(route.from, route.to)}
                >
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
                {hasSearched
                  ? `${filteredRides.length} resultado${filteredRides.length !== 1 ? "s" : ""}`
                  : "Viajes disponibles"}
              </Text>
              {hasSearched ? (
                <Pressable onPress={clearSearch}>
                  <Text style={styles.sectionLink}>Ver todos</Text>
                </Pressable>
              ) : null}
            </View>

            {filteredRides.length > 0 ? (
              <View style={styles.rideList}>
                {filteredRides.map((ride) => (
                  <RideCard
                    key={ride.id}
                    ride={ride}
                    mode="search"
                    onPress={() => handleRidePress(ride.id)}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  {noTripsExist
                    ? "Aún no hay viajes publicados."
                    : hasSearched
                      ? "No hay viajes para esa ruta."
                      : "No hay viajes disponibles en este momento."}
                </Text>

                {noTripsExist ? (
                  <Pressable
                    onPress={async () => {
                      try {
                        await refreshTrips();
                        setHasSearched(false);
                      } catch {
                        console.warn("Failed to refresh trips");
                      }
                    }}
                  >
                    <Text style={styles.sectionLink}>Actualizar</Text>
                  </Pressable>
                ) : hasSearched ? (
                  <Pressable onPress={clearSearch}>
                    <Text style={styles.sectionLink}>Ver todos los viajes</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={async () => {
                      try {
                        await refreshTrips();
                      } catch {
                        // noop
                      }
                    }}
                  >
                    {/* TODO: Implement refresh functionality, now its only a placeholder */}
                    <Text style={styles.sectionLink}>Actualizar</Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={calendarOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCalendarOpen(false)}
      >
        <View style={styles.calendarBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setCalendarOpen(false)}
          />
          <GlassCard style={styles.calendarCard} intensity={44}>
            <View style={styles.calendarHeader}>
              <Pressable
                onPress={() =>
                  setCursorDate(
                    (prev) =>
                      new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
                  )
                }
              >
                <Ionicons
                  name="chevron-back"
                  size={20}
                  color={colors.textPrimary}
                />
              </Pressable>
              <Text style={styles.calendarTitle}>{monthLabel(cursorDate)}</Text>
              <Pressable
                onPress={() =>
                  setCursorDate(
                    (prev) =>
                      new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
                  )
                }
              >
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.textPrimary}
                />
              </Pressable>
            </View>

            <View style={styles.weekHeader}>
              {["L", "M", "X", "J", "V", "S", "D"].map((day) => (
                <Text key={day} style={styles.weekDay}>
                  {day}
                </Text>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {calendarDays.map((day, idx) => {
                const active = isSameDay(day, draftDate);
                return (
                  <Pressable
                    key={`day-${idx}`}
                    style={[
                      styles.dayCell,
                      active && styles.dayCellActive,
                      !day && styles.dayCellEmpty,
                    ]}
                    disabled={!day}
                    onPress={() => day && setDraftDate(day)}
                  >
                    <Text
                      style={[styles.dayText, active && styles.dayTextActive]}
                    >
                      {day ? day.getDate() : ""}
                    </Text>
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
                    {infiniteHours.map((hour, idx) => (
                      <View key={idx} style={styles.wheelItem}>
                        <Text
                          style={[
                            styles.wheelItemText,
                            draftHour === hour && styles.wheelItemTextActive,
                          ]}
                        >
                          {String(hour).padStart(2, "0")}
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
                    {infiniteMinutes.map((minute, idx) => (
                      <View key={idx} style={styles.wheelItem}>
                        <Text
                          style={[
                            styles.wheelItemText,
                            draftMinute === minute &&
                              styles.wheelItemTextActive,
                          ]}
                        >
                          {String(minute).padStart(2, "0")}
                        </Text>
                      </View>
                    ))}
                  </ScrollView>
                  <View pointerEvents="none" style={styles.wheelHighlight} />
                </View>
              </View>

              <View style={styles.ampmColumn}>
                {/* Spacer matching the height of the 'Hora'/'Minutos' labels above the wheels */}
                <Text style={styles.timeLabel}> </Text>
                <View style={searchStaticStyles.ampmContainer}>
                  <Pressable
                    style={[
                      styles.ampmBtn,
                      draftPeriod === "AM" && styles.ampmBtnActive,
                    ]}
                    onPress={() => setDraftPeriod("AM")}
                  >
                    <Text
                      style={[
                        styles.ampmText,
                        draftPeriod === "AM" && styles.ampmTextActive,
                      ]}
                    >
                      AM
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.ampmBtn,
                      draftPeriod === "PM" && styles.ampmBtnActive,
                    ]}
                    onPress={() => setDraftPeriod("PM")}
                  >
                    <Text
                      style={[
                        styles.ampmText,
                        draftPeriod === "PM" && styles.ampmTextActive,
                      ]}
                    >
                      PM
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>

            <View style={styles.calendarActions}>
              <Pressable
                style={styles.cancelBtn}
                onPress={() => setCalendarOpen(false)}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </Pressable>
              <Pressable style={styles.applyBtn} onPress={applyDateTime}>
                <Text style={styles.applyBtnText}>Aplicar</Text>
              </Pressable>
            </View>
          </GlassCard>
        </View>
      </Modal>

      <NotificationsModal
        visible={notifOpen}
        onClose={() => setNotifOpen(false)}
      />
    </View>
  );
}
