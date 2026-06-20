// Calendar + infinite hour/minute wheel modal for picking a trip's departure
// date & time. Owns its own draft state; commits via onApply when "Aplicar" is
// tapped.

import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
// initialDate is read via a ref so the open-init effect can depend only on
// `visible` (re-init when the modal opens, not when the parent's date changes).
import {
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import GlassCard from '@/components/shared/glass-card';
import { useAppTheme } from '@/hooks/use-app-theme';
import { makeStyles, ampmContainerStyle } from '@/styles/tabs/offer.styles';
import { buildCalendarDays, isSameDay, monthLabel, to24Hour } from './offer-date-utils';

const PICKER_ITEM_HEIGHT = 36;
const HOUR_COUNT = 12;
const MIN_COUNT  = 60;
// Repeat arrays enough times that reaching an edge requires ~10 000 px of scrolling
const HOUR_REPS  = 100;
const MIN_REPS   = 10;
const infiniteHours   = Array.from({ length: HOUR_REPS * HOUR_COUNT }, (_, i) => (i % HOUR_COUNT) + 1);
const infiniteMinutes = Array.from({ length: MIN_REPS * MIN_COUNT },  (_, i) => i % MIN_COUNT);
// Midpoints — where we park the scroll when the picker opens
const HOURS_CENTER = Math.floor(HOUR_REPS / 2) * HOUR_COUNT;
const MINS_CENTER  = Math.floor(MIN_REPS / 2) * MIN_COUNT;

export default function DateTimePickerModal({
  visible, initialDate, onApply, onClose, styles, colors,
}: {
  visible: boolean;
  initialDate: Date | null;
  onApply: (date: Date) => void;
  onClose: () => void;
  styles: ReturnType<typeof makeStyles>;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  const [cursorDate, setCursorDate]   = useState(() => new Date());
  const [draftDate, setDraftDate]     = useState<Date | null>(null);
  const [draftHour, setDraftHour]     = useState(7);
  const [draftMinute, setDraftMinute] = useState(0);
  const [draftPeriod, setDraftPeriod] = useState<'AM' | 'PM'>('AM');
  const hourScrollRef   = useRef<ScrollView>(null);
  const minuteScrollRef = useRef<ScrollView>(null);
  const initialDateRef  = useRef(initialDate);
  initialDateRef.current = initialDate;

  // Initialize the drafts + scroll position whenever the modal opens
  useEffect(() => {
    if (!visible) return;
    const source = initialDateRef.current ?? new Date();
    const rawHour = source.getHours();
    const h12 = rawHour % 12 === 0 ? 12 : rawHour % 12;
    const period: 'AM' | 'PM' = rawHour < 12 ? 'AM' : 'PM';
    setCursorDate(new Date(source.getFullYear(), source.getMonth(), 1));
    setDraftDate(new Date(source.getFullYear(), source.getMonth(), source.getDate()));
    setDraftHour(h12);
    setDraftMinute(source.getMinutes());
    setDraftPeriod(period);
    setTimeout(() => {
      hourScrollRef.current?.scrollTo({ y: (HOURS_CENTER + h12 - 1) * PICKER_ITEM_HEIGHT, animated: false });
      minuteScrollRef.current?.scrollTo({ y: (MINS_CENTER + source.getMinutes()) * PICKER_ITEM_HEIGHT, animated: false });
    }, 0);
  }, [visible]);

  const onHourScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.max(0, Math.min(infiniteHours.length - 1, Math.round(e.nativeEvent.contentOffset.y / PICKER_ITEM_HEIGHT)));
    setDraftHour(infiniteHours[idx]);
    hourScrollRef.current?.scrollTo({ y: idx * PICKER_ITEM_HEIGHT, animated: true });
  };

  const onMinuteScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.max(0, Math.min(infiniteMinutes.length - 1, Math.round(e.nativeEvent.contentOffset.y / PICKER_ITEM_HEIGHT)));
    setDraftMinute(infiniteMinutes[idx]);
    minuteScrollRef.current?.scrollTo({ y: idx * PICKER_ITEM_HEIGHT, animated: true });
  };

  const apply = () => {
    const merged = new Date(draftDate ?? new Date());
    merged.setHours(to24Hour(draftHour, draftPeriod), draftMinute, 0, 0);
    onApply(merged);
  };

  const calendarDays = buildCalendarDays(cursorDate);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.calendarBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
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
                  {infiniteHours.map((hour, idx) => (
                    <View key={idx} style={styles.wheelItem}>
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
                  {infiniteMinutes.map((minute, idx) => (
                    <View key={idx} style={styles.wheelItem}>
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
                <Pressable style={[styles.ampmBtn, draftPeriod === 'AM' && styles.ampmBtnActive]} onPress={() => setDraftPeriod('AM')}>
                  <Text style={[styles.ampmText, draftPeriod === 'AM' && styles.ampmTextActive]}>AM</Text>
                </Pressable>
                <Pressable style={[styles.ampmBtn, draftPeriod === 'PM' && styles.ampmBtnActive]} onPress={() => setDraftPeriod('PM')}>
                  <Text style={[styles.ampmText, draftPeriod === 'PM' && styles.ampmTextActive]}>PM</Text>
                </Pressable>
              </View>
            </View>
          </View>

          <View style={styles.calendarActions}>
            <Pressable style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </Pressable>
            <Pressable style={styles.applyBtn} onPress={apply}>
              <Text style={styles.applyBtnText}>Aplicar</Text>
            </Pressable>
          </View>
        </GlassCard>
      </View>
    </Modal>
  );
}
