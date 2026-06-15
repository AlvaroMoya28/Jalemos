// Payment method selector card shown in the active trip bubble during boarding.

import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { styles } from './styles/active-trip-bubble.styles';
import { Brand, Fonts } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { PaymentMethodDto } from '@/services/api';

export function PaymentMethodCard({
  colors, paymentMethods, selectedMethod, showMethodPicker, onToggleMethodPicker, onSelectMethod,
}: {
  colors: ReturnType<typeof useAppTheme>['colors'];
  paymentMethods: PaymentMethodDto[];
  selectedMethod: PaymentMethodDto | null;
  showMethodPicker: boolean;
  onToggleMethodPicker: () => void;
  onSelectMethod: (method: PaymentMethodDto) => void;
}) {
  return (
    <View style={[styles.card, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="card-outline" size={14} color={Brand.colors.green.normal} />
          <Text style={{ fontFamily: Fonts.sans, fontSize: 12, color: colors.textSecondary }}>Método de pago</Text>
        </View>
        <Pressable onPress={onToggleMethodPicker} hitSlop={8}>
          <Text style={{ fontFamily: Fonts.headingBold, fontSize: 12, color: Brand.colors.green.normal }}>Cambiar</Text>
        </Pressable>
      </View>
      {selectedMethod ? (
        <Text style={{ fontFamily: Fonts.headingBold, fontSize: 14, color: colors.textPrimary, marginTop: 4 }}>
          {selectedMethod.alias}
          {selectedMethod.isFavorite ? ' ★' : ''}
        </Text>
      ) : (
        <Text style={{ fontFamily: Fonts.sans, fontSize: 13, color: colors.textMuted, marginTop: 4 }}>
          Sin método seleccionado
        </Text>
      )}
      {showMethodPicker && (
        <View style={{ marginTop: 10, gap: 6 }}>
          {paymentMethods.map(m => (
            <Pressable
              key={m.id}
              onPress={() => onSelectMethod(m)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 8, backgroundColor: selectedMethod?.id === m.id ? Brand.colors.green.normal + '22' : colors.screenBg }}
            >
              <Ionicons
                name={m.type === 'card' ? 'card-outline' : m.type === 'sinpe' ? 'phone-portrait-outline' : 'cash-outline'}
                size={14}
                color={Brand.colors.green.normal}
              />
              <Text style={{ fontFamily: Fonts.sans, fontSize: 13, color: colors.textPrimary, flex: 1 }}>{m.alias}</Text>
              {m.isFavorite && <Ionicons name="star" size={12} color="#f7a900" />}
            </Pressable>
          ))}
          {paymentMethods.length === 0 && (
            <Text style={{ fontFamily: Fonts.sans, fontSize: 12, color: colors.textMuted, textAlign: 'center', padding: 8 }}>
              Sin métodos guardados. Agrega uno en tu perfil.
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
