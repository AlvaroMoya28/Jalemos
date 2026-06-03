// Text input with Google Places Autocomplete restricted to Costa Rica.
// The suggestions dropdown renders inside a transparent Modal positioned below
// the input — this avoids all blur/onPress timing races and overflow:hidden clipping.
// Platform.OS === 'web' skips API calls (CORS blocks the Places REST endpoint in browsers).
// Requires EXPO_PUBLIC_GOOGLE_PLACES_KEY in your .env file.

import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';

import { Brand } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useCurrentLocation } from '@/hooks/use-current-location';
import { styles as s } from './styles/place-search-input.styles';

const PLACES_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY ?? '';

export interface PlacePrediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  coords?: { lat: number; lng: number };
}

interface Props extends Omit<TextInputProps, 'value' | 'onChangeText' | 'onFocus' | 'onBlur'> {
  value: string;
  onChangeText: (text: string) => void;
  /** Called when the user picks a suggestion from the dropdown. */
  onSelect: (pred: PlacePrediction) => void;
  leadingIcon?: React.ReactNode;
  fieldStyle?: object;
  /** Show "Mi ubicación actual" as the first dropdown option. Defaults to true. */
  showCurrentLocation?: boolean;
}

async function fetchPredictions(query: string): Promise<PlacePrediction[]> {
  if (!PLACES_KEY || Platform.OS === 'web') return [];
  try {
    const params = new URLSearchParams({
      input: query.trim(),
      components: 'country:cr',
      language: 'es',
      key: PLACES_KEY,
    });
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`
    );
    const json = await res.json();
    if (json.status === 'ZERO_RESULTS') return [];
    if (json.status !== 'OK') {
      console.warn('[Places]', json.status, json.error_message);
      return [];
    }
    return (json.predictions as any[]).map((p) => ({
      placeId: p.place_id,
      description: p.description,
      mainText: p.structured_formatting?.main_text ?? p.description,
      secondaryText: p.structured_formatting?.secondary_text ?? '',
    }));
  } catch (e) {
    console.warn('[Places] fetch error', e);
    return [];
  }
}

export default function PlaceSearchInput({
  value,
  onChangeText,
  onSelect,
  leadingIcon,
  fieldStyle,
  placeholder,
  placeholderTextColor,
  showCurrentLocation = true,
  ...rest
}: Props) {
  const { colors } = useAppTheme();
  const [suggestions, setSuggestions] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  // Screen coordinates of the input row — used to position the Modal dropdown
  const [dropdownTop, setDropdownTop] = useState(0);
  const [dropdownLeft, setDropdownLeft] = useState(0);
  const [dropdownWidth, setDropdownWidth] = useState(0);

  const { state: locState, fetch: fetchLocation } = useCurrentLocation();
  const locLoading = locState.status === 'loading';

  const wrapRef = useRef<View>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Tracks what the user typed so external value updates (selections) skip the fetch
  const lastTypedRef = useRef('');
  // Set to true right after a selection so the next useEffect cycle skips the API call
  const skipFetchRef = useRef(false);

  const measureWrap = () => {
    wrapRef.current?.measure((_, __, width, height, pageX, pageY) => {
      setDropdownTop(pageY + height + 4);
      setDropdownLeft(pageX);
      setDropdownWidth(width);
    });
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    // Value was set externally (parent) and doesn't match what the user typed
    if (value !== lastTypedRef.current) {
      setSuggestions([]);
      return;
    }

    // Value was just set by a selection — skip re-fetching for the resolved name
    if (skipFetchRef.current) {
      skipFetchRef.current = false;
      return;
    }

    if (value.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const preds = await fetchPredictions(value);
      setSuggestions(preds);
      setLoading(false);
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  const handleChangeText = (text: string) => {
    lastTypedRef.current = text;
    onChangeText(text);
  };

  const handleSelect = (pred: PlacePrediction) => {
    setSuggestions([]);
    setLoading(false);
    // Align lastTypedRef with the selected value AND mark the next effect cycle to skip fetch
    lastTypedRef.current = pred.description;
    skipFetchRef.current = true;
    onSelect(pred);
  };

  const handleSelectLocation = async () => {
    setSuggestions([]);
    const result = await fetchLocation();
    if (result) {
      const { address, coords } = result;
      lastTypedRef.current = address;
      skipFetchRef.current = true;
      onChangeText(address);
      onSelect({
        placeId: '__current_location__',
        description: address,
        mainText: 'Mi ubicación actual',
        secondaryText: address,
        coords,
      });
    }
  };

  const clearField = () => {
    lastTypedRef.current = '';
    onChangeText('');
    setSuggestions([]);
  };

  const showLocationOption = showCurrentLocation && suggestions.length > 0 && !locLoading;
  const showDropdown = suggestions.length > 0 && dropdownTop > 0;

  return (
    <>
      <View ref={wrapRef} style={[s.field, fieldStyle]} onLayout={measureWrap}>
        {leadingIcon}
        <TextInput
          value={value}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor}
          style={[s.input, { color: colors.inputText }]}
          onFocus={measureWrap}
          autoCorrect={false}
          autoCapitalize="none"
          {...rest}
        />
        {loading || locLoading ? (
          <ActivityIndicator size="small" color={Brand.colors.green.normal} />
        ) : value.length > 0 ? (
          <Pressable hitSlop={8} onPress={clearField}>
            <Ionicons name="close-circle" size={15} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {/* Modal dropdown — renders above everything, no overflow:hidden or blur issues */}
      {showDropdown && (
        <Modal transparent visible animationType="none" statusBarTranslucent>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSuggestions([])} />
          <View style={[
            s.dropdown,
            {
              top: dropdownTop,
              left: dropdownLeft,
              width: dropdownWidth,
              backgroundColor: colors.inputBg,
              borderColor: colors.border,
            },
          ]}>
            {/* Pinned "Mi ubicación actual" option */}
            {showLocationOption && (
              <Pressable
                style={[s.item, { backgroundColor: colors.inputBg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
                onPress={handleSelectLocation}
              >
                <Ionicons name="navigate" size={14} color={Brand.colors.green.dark} style={s.iconTopOffset} />
                <View style={s.itemTexts}>
                  <Text style={[s.mainText, { color: Brand.colors.green.dark }]} numberOfLines={1}>
                    Mi ubicación actual
                  </Text>
                  <Text style={[s.secondaryText, { color: colors.textMuted }]} numberOfLines={1}>
                    Usar GPS del dispositivo
                  </Text>
                </View>
              </Pressable>
            )}
            {suggestions.slice(0, 5).map((pred, idx) => (
              <Pressable
                key={pred.placeId}
                style={[
                  s.item,
                  { backgroundColor: colors.inputBg },
                  (showLocationOption || idx > 0) && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
                ]}
                onPress={() => handleSelect(pred)}
              >
                <Ionicons name="location-outline" size={14} color={Brand.colors.green.normal} style={s.iconTopOffset} />
                <View style={s.itemTexts}>
                  <Text style={[s.mainText, { color: colors.textPrimary }]} numberOfLines={1}>{pred.mainText}</Text>
                  {pred.secondaryText ? (
                    <Text style={[s.secondaryText, { color: colors.textMuted }]} numberOfLines={1}>{pred.secondaryText}</Text>
                  ) : null}
                </View>
              </Pressable>
            ))}
          </View>
        </Modal>
      )}
    </>
  );
}

