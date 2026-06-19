import { Brand, Fonts } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Ionicons } from '@expo/vector-icons';
import { TextInput, View } from 'react-native';

interface Props {
  value: string;
  onChangeText: (formatted: string) => void;
  fieldStyle?: object;
  inputStyle?: object;
  placeholder?: string;
}

// Formats input as MM/YY — mirrors a credit-card expiry field.
// Strips non-digits, caps at 4, auto-inserts "/" after the month digits.
function format(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

// Parses "MM/YY" → { month, year } where year = 2000 + YY.
// Returns nulls for incomplete / invalid input.
export function parseExpiry(value: string): { month: number | null; year: number | null } {
  const parts = value.split('/');
  if (parts.length !== 2 || parts[1].length < 2) return { month: null, year: null };
  const month = parseInt(parts[0], 10);
  const year  = 2000 + parseInt(parts[1], 10);
  if (isNaN(month) || isNaN(year) || month < 1 || month > 12) return { month: null, year: null };
  return { month, year };
}

export default function ExpiryInput({ value, onChangeText, fieldStyle, inputStyle, placeholder = 'MM/AA' }: Props) {
  const { colors } = useAppTheme();

  return (
    <View style={[{
      flexDirection: 'row', alignItems: 'center', gap: 10,
      borderRadius: 12, borderWidth: 1,
      borderColor: colors.border, backgroundColor: colors.inputBg,
      paddingHorizontal: 12, paddingVertical: 12,
    }, fieldStyle]}>
      <Ionicons name="calendar-outline" size={16} color={Brand.colors.green.normal} />
      <TextInput
        value={value}
        onChangeText={(text) => onChangeText(format(text))}
        placeholder={placeholder}
        placeholderTextColor={colors.textPlaceholder}
        keyboardType="numeric"
        maxLength={5}
        style={[{ flex: 1, fontSize: 14, color: colors.inputText, fontFamily: Fonts.sans }, inputStyle]}
      />
    </View>
  );
}
