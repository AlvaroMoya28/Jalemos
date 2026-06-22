// Progressive search card for the Search screen: reveals destination, date/time and
// seats as the user fills them in. Pure presentational — all state lives in the parent
// (useTripSearch); this component just renders inputs and calls back.

import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { Pressable, Text, View } from 'react-native';

import GlassCard from '@/components/shared/glass-card';
import PlaceSearchInput from '@/components/shared/place-search-input';
import { Brand } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { makeStyles } from '@/styles/tabs/search.styles';
import { dateLabel, timeLabel } from '@/utils/datetime';

type SearchStyles = ReturnType<typeof makeStyles>;
type AppColors = ReturnType<typeof useAppTheme>['colors'];

interface Props {
  from: string;
  setFrom: (v: string) => void;
  to: string;
  setTo: (v: string) => void;
  seats: number;
  setSeats: (updater: (prev: number) => number) => void;
  selectedDate: Date | null;
  onOpenDate: () => void;
  onSearch: () => void;
  onClear: () => void;
  styles: SearchStyles;
  colors: AppColors;
}

export default function SearchFormCard({
  from, setFrom, to, setTo, seats, setSeats, selectedDate, onOpenDate, onSearch, onClear, styles, colors,
}: Props) {
  const hasOrigin = from.trim().length > 0;
  const hasDestination = to.trim().length > 0;
  const hasDate = selectedDate !== null;
  const hasAnyInput = hasOrigin || hasDestination || hasDate || seats !== 1;

  return (
    <GlassCard style={styles.searchCard} intensity={46}>
      <View style={styles.verticalField}>
        <Text style={styles.fieldLabel}>Origen</Text>
        <PlaceSearchInput
          value={from}
          onChangeText={setFrom}
          onSelect={(pred) => setFrom(pred.description)}
          leadingIcon={<Ionicons name="radio-button-on" size={12} color={Brand.colors.green.dark} />}
          fieldStyle={styles.searchField}
          placeholder="De"
          placeholderTextColor={colors.textPlaceholder}
        />
      </View>

      {hasOrigin && (
        <Animated.View entering={FadeInDown.duration(220)} exiting={FadeOut.duration(140)} layout={LinearTransition.duration(220)} style={styles.verticalField}>
          <Text style={styles.fieldLabel}>Destino</Text>
          <PlaceSearchInput
            value={to}
            onChangeText={setTo}
            onSelect={(pred) => setTo(pred.description)}
            leadingIcon={<Ionicons name="location-outline" size={13} color={Brand.colors.green.normal} />}
            fieldStyle={styles.searchField}
            placeholder="A"
            placeholderTextColor={colors.textPlaceholder}
          />
        </Animated.View>
      )}

      {hasDestination && (
        <Animated.View entering={FadeInDown.duration(220)} exiting={FadeOut.duration(140)} layout={LinearTransition.duration(220)} style={styles.verticalField}>
          <Text style={styles.fieldLabel}>Fecha y hora</Text>
          <Pressable style={styles.searchField} onPress={onOpenDate}>
            <Ionicons name="calendar-outline" size={12} color={Brand.colors.green.dark} />
            <Text style={[styles.searchInput, !selectedDate && styles.placeholderText]}>
              {selectedDate
                ? `${dateLabel(selectedDate)} · ${timeLabel(selectedDate.getHours(), selectedDate.getMinutes())}`
                : 'Seleccionar fecha y hora'}
            </Text>
            <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
          </Pressable>
        </Animated.View>
      )}

      {hasDate && (
        <Animated.View entering={FadeInDown.duration(220)} exiting={FadeOut.duration(140)} layout={LinearTransition.duration(220)} style={styles.verticalField}>
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
      )}

      {hasDate && (
        <Animated.View entering={FadeInDown.duration(220)} exiting={FadeOut.duration(140)} layout={LinearTransition.duration(220)} style={styles.actionRow}>
          {hasAnyInput && (
            <Pressable style={styles.clearBtn} onPress={onClear}>
              <Text style={styles.clearBtnText}>Limpiar</Text>
            </Pressable>
          )}
          <Pressable style={styles.searchBtn} onPress={onSearch}>
            <Text style={styles.searchBtnText}>Buscar</Text>
          </Pressable>
        </Animated.View>
      )}
    </GlassCard>
  );
}
