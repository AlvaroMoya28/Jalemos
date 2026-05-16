import { Ionicons } from '@expo/vector-icons';
import { useMemo, useRef, useState } from 'react';
import Animated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import {
  Alert,
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
import { Brand, Fonts, withElevation } from '@/constants/theme';

// Offer screen — lets drivers publish a new trip with route, date/time, seats, price, and vehicle.
// Shares the same calendar/time-picker pattern as the Search screen.

// Scroll-wheel picker constants — each row is 36 px tall and 5 rows are visible at once
const PICKER_ITEM_HEIGHT = 36;
const PICKER_VISIBLE_ROWS = 5;
const PICKER_HEIGHT = PICKER_ITEM_HEIGHT * PICKER_VISIBLE_ROWS;
const hours = Array.from({ length: 24 }, (_, idx) => idx);
const minutes = Array.from({ length: 60 }, (_, idx) => idx);

/** Returns a localised month + year string for the calendar header. */
function monthLabel(date: Date) {
  return date.toLocaleDateString('es-CR', { month: 'long', year: 'numeric' });
}

/** Returns a short readable date string for the date-picker button. */
function dateLabel(date: Date) {
  return date.toLocaleDateString('es-CR', { weekday: 'short', day: 'numeric', month: 'short' });
}

/** Formats hour and minute as zero-padded HH:MM. */
function timeLabel(hour: number, minute: number) {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/**
 * Builds the flat Date | null array for the calendar grid.
 * Leading nulls align the first day of the month to the correct Mon–Sun column.
 */
function buildCalendarDays(cursor: Date) {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0).getDate();
  // Shift from Sunday-first (JS default) to Monday-first calendar
  const startIndex = (first.getDay() + 6) % 7;
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startIndex; i++) cells.push(null);
  for (let day = 1; day <= lastDay; day++) cells.push(new Date(year, month, day));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/** Returns true when both dates fall on the same calendar day. */
function isSameDay(a: Date | null, b: Date | null) {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Offer screen — form that allows a driver to publish a new ride. */
export default function OfferScreen() {
  // Static mock vehicle list — replace with data fetched from the user's profile
  const vehicles = [
    { id: 'veh-1', name: 'Toyota Yaris', plate: 'CR-1234', color: 'Gris', primary: true },
    { id: 'veh-2', name: 'Nissan Kicks', plate: 'CR-7788', color: 'Blanco', primary: false },
  ];

  // Trip form state
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [seats, setSeats] = useState(2);
  const [price, setPrice] = useState(1500);
  const [vehicleId, setVehicleId] = useState(vehicles[0].id);
  const [notes, setNotes] = useState('');
  const [isRecurring, setIsRecurring] = useState(true);
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);

  // Calendar / time-picker modal state (draft values committed only on "Apply")
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [cursorDate, setCursorDate] = useState(() => new Date());
  const [draftDate, setDraftDate] = useState<Date | null>(null);
  const [draftHour, setDraftHour] = useState(7);
  const [draftMinute, setDraftMinute] = useState(0);
  // Refs used to programmatically snap the scroll-wheel pickers
  const hourScrollRef = useRef<ScrollView>(null);
  const minuteScrollRef = useRef<ScrollView>(null);

  const selectedVehicle = vehicles.find((v) => v.id === vehicleId) ?? vehicles[0];
  // Total estimated earnings = price per seat × number of seats
  const estimated = useMemo(() => seats * price, [price, seats]);
  // Character counter for the optional notes field (max 100)
  const remaining = Math.max(0, 100 - notes.length);
  const calendarDays = useMemo(() => buildCalendarDays(cursorDate), [cursorDate]);

  // Progressive disclosure: hero grows as the origin / destination fields are filled
  const hasOrigin = from.trim().length > 0;
  const hasDestination = to.trim().length > 0;
  const visibleBlocks = 1 + (hasOrigin ? 1 : 0) + (hasDestination ? 1 : 0);
  const heroHeight = 280 + visibleBlocks * 62;

  /** Opens the date/time picker pre-populated with the currently selected date. */
  const openDateModal = () => {
    const source = selectedDate ?? new Date();
    setCursorDate(new Date(source.getFullYear(), source.getMonth(), 1));
    setDraftDate(new Date(source.getFullYear(), source.getMonth(), source.getDate()));
    setDraftHour(source.getHours());
    setDraftMinute(source.getMinutes());
    setCalendarOpen(true);
    // Defer scroll so the ScrollView layout exists before scrollTo fires
    setTimeout(() => {
      hourScrollRef.current?.scrollTo({ y: source.getHours() * PICKER_ITEM_HEIGHT, animated: false });
      minuteScrollRef.current?.scrollTo({ y: source.getMinutes() * PICKER_ITEM_HEIGHT, animated: false });
    }, 0);
  };

  /** Snaps the hour wheel to the nearest row after momentum scrolling ends. */
  const onHourScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.max(0, Math.min(23, Math.round(e.nativeEvent.contentOffset.y / PICKER_ITEM_HEIGHT)));
    setDraftHour(idx);
    hourScrollRef.current?.scrollTo({ y: idx * PICKER_ITEM_HEIGHT, animated: true });
  };

  /** Snaps the minute wheel to the nearest row after momentum scrolling ends. */
  const onMinuteScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.max(0, Math.min(59, Math.round(e.nativeEvent.contentOffset.y / PICKER_ITEM_HEIGHT)));
    setDraftMinute(idx);
    minuteScrollRef.current?.scrollTo({ y: idx * PICKER_ITEM_HEIGHT, animated: true });
  };

  /** Commits draft date + time into selectedDate and closes the picker modal. */
  const applyDateTime = () => {
    const base = draftDate ?? new Date();
    const merged = new Date(base);
    merged.setHours(draftHour, draftMinute, 0, 0);
    setSelectedDate(merged);
    setCalendarOpen(false);
  };

  /** Validates required fields and publishes the trip. TODO: call POST /api/rides. */
  const publish = () => {
    if (!from || !to || !selectedDate) {
      Alert.alert('Campos incompletos', 'Completa origen, destino, fecha y hora.');
      return;
    }
    // TODO: replace with an actual API call to POST /api/rides
    Alert.alert('Listo', `Tu viaje se publicó correctamente con ${selectedVehicle.name}.`);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>

        <View style={[styles.heroWrap, { height: heroHeight }]}>
          <Image
            source={require('../../assets/images/hero-banner.jpg')}
            style={[styles.heroImage, { height: heroHeight }]}
          />
          <View style={styles.heroOverlay} />

          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.heroMini}>Pura Vida</Text>
              <Text style={styles.heroTitle}>Ofrece tu viaje</Text>
            </View>
          </View>

          <GlassCard style={styles.offerCard} intensity={46}>
            <View style={styles.verticalField}>
              <Text style={styles.fieldLabel}>Origen</Text>
              <View style={styles.searchField}>
                <Ionicons name="radio-button-on" size={12} color="#0e8d75" />
                <TextInput
                  value={from}
                  onChangeText={setFrom}
                  placeholder="¿De dónde sales?"
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
                    placeholder="¿A dónde vas?"
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
                    {selectedDate
                      ? `${dateLabel(selectedDate)} · ${timeLabel(selectedDate.getHours(), selectedDate.getMinutes())}`
                      : 'Seleccionar fecha y hora'}
                  </Text>
                  <Ionicons name="chevron-down" size={14} color="#6d7f7b" />
                </Pressable>
              </Animated.View>
            ) : null}
          </GlassCard>
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

            <View style={styles.vehicleSection}>
              <Text style={styles.sectionLabel}>Vehículo</Text>
              <Pressable style={styles.vehiclePicker} onPress={() => setVehicleModalOpen(true)}>
                <View>
                  <Text style={styles.vehicleName}>{selectedVehicle.name}</Text>
                  <Text style={styles.vehicleMeta}>{selectedVehicle.plate} · {selectedVehicle.color}</Text>
                </View>
                <Ionicons name="chevron-down" size={18} color={Brand.colors.green.dark} />
              </Pressable>
            </View>

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Viaje recurrente</Text>
              <Pressable
                style={[styles.toggle, isRecurring ? styles.toggleActive : styles.toggleInactive]}
                onPress={() => setIsRecurring((v) => !v)}
              >
                <View style={[styles.toggleKnob, !isRecurring && styles.toggleKnobInactive]} />
              </Pressable>
            </View>

            <View style={styles.notesWrap}>
              <Ionicons name="chatbubble-ellipses-outline" size={16} color={Brand.colors.green.normal} style={styles.notesIcon} />
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Notas para los pasajeros (opcional)"
                placeholderTextColor="#778783"
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
              <Text style={styles.summaryVehicle}>{selectedVehicle.name}</Text>
            </View>
          </GlassCard>

          <Pressable style={styles.cta} onPress={publish}>
            <Text style={styles.ctaText}>Publicar viaje</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Calendar modal — mismo que Buscar */}
      <Modal visible={calendarOpen} transparent animationType="fade" onRequestClose={() => setCalendarOpen(false)}>
        <View style={styles.calendarBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setCalendarOpen(false)} />
          <GlassCard style={styles.calendarCard} intensity={44}>
            <View style={styles.calendarHeader}>
              <Pressable onPress={() => setCursorDate((p) => new Date(p.getFullYear(), p.getMonth() - 1, 1))}>
                <Ionicons name="chevron-back" size={20} color={Brand.colors.black.b10} />
              </Pressable>
              <Text style={styles.calendarTitle}>{monthLabel(cursorDate)}</Text>
              <Pressable onPress={() => setCursorDate((p) => new Date(p.getFullYear(), p.getMonth() + 1, 1))}>
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
                    <Text style={[styles.dayText, active && styles.dayTextActive]}>
                      {day ? day.getDate() : ''}
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

      {/* Vehicle modal */}
      <Modal visible={vehicleModalOpen} transparent animationType="fade" onRequestClose={() => setVehicleModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setVehicleModalOpen(false)} />
          <GlassCard style={styles.modalCard} intensity={40}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Elegir vehículo</Text>
              <Pressable onPress={() => setVehicleModalOpen(false)}>
                <Ionicons name="close" size={20} color={Brand.colors.black.b10} />
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
                    <Text style={styles.vehicleTag}>{vehicle.primary ? 'Principal' : 'Disponible'}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </GlassCard>
        </View>
      </Modal>
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
    backgroundColor: 'rgba(10, 63, 57, 0.42)',
  },
  heroHeader: {
    position: 'absolute',
    top: 58,
    left: Brand.grid.margin,
    right: Brand.grid.margin,
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
  offerCard: {
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
  bottomSurface: {
    backgroundColor: Brand.colors.black.b1,
    borderTopLeftRadius: Brand.radius[24],
    borderTopRightRadius: Brand.radius[24],
    marginTop: -4,
    paddingTop: 18,
    paddingBottom: 10,
  },
  section: {
    paddingHorizontal: Brand.grid.margin,
    gap: 10,
  },
  sectionTitle: {
    color: Brand.colors.black.b10,
    fontFamily: Fonts.headingBold,
    fontSize: 15,
    marginBottom: 2,
  },
  sectionLabel: {
    fontSize: 11,
    color: Brand.colors.black.b7,
    fontFamily: Fonts.headingBold,
    textTransform: 'uppercase',
  },
  flex1: {
    flex: 1,
  },
  countersRow: {
    flexDirection: 'row',
    gap: 8,
  },
  counterBox: {
    borderRadius: Brand.radius[12],
    borderWidth: 1,
    borderColor: Brand.colors.green.light,
    backgroundColor: Brand.colors.black.b2,
    padding: 10,
  },
  counterHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  counterLabel: {
    fontSize: 11,
    color: Brand.colors.black.b7,
    fontFamily: Fonts.heading,
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  counterBtn: {
    width: 27,
    height: 27,
    borderRadius: 8,
    backgroundColor: Brand.colors.green.normal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterBtnText: {
    color: Brand.colors.black.b1,
    fontFamily: Fonts.headingBold,
    fontSize: 16,
    marginTop: -1,
  },
  counterValue: {
    fontSize: 20,
    fontFamily: Fonts.headingHeavy,
    color: Brand.colors.black.b10,
  },
  priceInput: {
    fontSize: 20,
    fontFamily: Fonts.headingHeavy,
    color: Brand.colors.black.b10,
    paddingVertical: 0,
  },
  vehicleSection: {
    gap: 8,
  },
  vehiclePicker: {
    borderRadius: Brand.radius[12],
    borderWidth: 1,
    borderColor: Brand.colors.green.light,
    backgroundColor: Brand.colors.black.b2,
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vehicleName: {
    color: Brand.colors.black.b10,
    fontSize: 14,
    fontFamily: Fonts.headingBold,
  },
  vehicleMeta: {
    color: Brand.colors.black.b7,
    fontSize: 11,
    fontFamily: Fonts.sans,
    marginTop: 2,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabel: {
    fontSize: 13,
    color: Brand.colors.black.b9,
    fontFamily: Fonts.heading,
  },
  toggle: {
    width: Brand.toggle.width,
    height: Brand.toggle.height,
    borderRadius: 999,
    paddingHorizontal: Brand.toggle.inset,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: Brand.colors.green.dark,
  },
  toggleInactive: {
    backgroundColor: Brand.colors.green.light,
  },
  toggleKnob: {
    width: Brand.toggle.knobWidth,
    height: Brand.toggle.knobHeight,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    alignSelf: 'flex-end',
  },
  toggleKnobInactive: {
    alignSelf: 'flex-start',
  },
  notesWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    borderWidth: 1,
    borderColor: Brand.colors.green.light,
    backgroundColor: Brand.colors.black.b2,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: Brand.radius[12],
  },
  notesIcon: {
    marginTop: 4,
  },
  notesInput: {
    flex: 1,
    minHeight: 60,
    fontSize: 14,
    color: Brand.colors.black.b10,
    fontFamily: Fonts.sans,
  },
  charCount: {
    alignSelf: 'flex-end',
    fontSize: 11,
    color: Brand.colors.black.b7,
    fontFamily: Fonts.sans,
    marginTop: -4,
  },
  summary: {
    marginTop: 14,
    marginHorizontal: Brand.grid.margin,
    borderRadius: Brand.radius[16],
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...withElevation(100),
  },
  summaryLabel: {
    fontSize: 12,
    color: Brand.colors.black.b7,
    fontFamily: Fonts.sans,
  },
  summaryValue: {
    fontSize: 24,
    fontFamily: Fonts.headingHeavy,
    color: Brand.colors.green.normal,
  },
  summaryMath: {
    fontSize: 12,
    color: Brand.colors.black.b7,
    fontFamily: Fonts.heading,
  },
  summaryVehicle: {
    marginTop: 2,
    fontSize: 11,
    color: Brand.colors.black.b8,
    fontFamily: Fonts.sans,
  },
  cta: {
    marginTop: 10,
    marginHorizontal: Brand.grid.margin,
    backgroundColor: Brand.colors.green.normal,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    ...withElevation(100),
  },
  ctaText: {
    color: Brand.colors.black.b1,
    fontSize: 15,
    fontFamily: Fonts.headingBold,
  },
  // Calendar modal
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
  // Vehicle modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 36, 32, 0.42)',
    justifyContent: 'center',
    paddingHorizontal: Brand.grid.margin,
  },
  modalCard: {
    borderRadius: Brand.radius[16],
    padding: 14,
    gap: 12,
    maxHeight: '74%',
    backgroundColor: 'rgba(245, 253, 250, 0.97)',
    borderColor: 'rgba(186, 226, 221, 0.95)',
    borderWidth: 1,
    ...withElevation(400),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    color: Brand.colors.black.b10,
    fontSize: 16,
    fontFamily: Fonts.headingBold,
  },
  modalList: {
    gap: 10,
    paddingBottom: 6,
  },
  vehicleCard: {
    borderRadius: Brand.radius[12],
    borderWidth: 1,
    borderColor: Brand.colors.green.light,
    backgroundColor: 'rgba(255, 255, 255, 0.68)',
    padding: 11,
    gap: 6,
  },
  vehicleCardActive: {
    borderColor: Brand.colors.green.normal,
    backgroundColor: 'rgba(255, 255, 255, 0.86)',
  },
  vehicleTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  vehicleTag: {
    alignSelf: 'flex-start',
    color: Brand.colors.green.dark,
    fontSize: 11,
    fontFamily: Fonts.heading,
  },
});
