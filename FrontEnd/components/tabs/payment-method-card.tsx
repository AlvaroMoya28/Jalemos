// Payment method selector card shown in the active trip bubble during boarding.

import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, Text, View } from 'react-native';
import { styles } from './styles/active-trip-bubble.styles';
import { Brand, Fonts } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { PaymentMethodDto, simBehaviorLabel } from '@/services/api';

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
  const selectedWarning = selectedMethod?.type === 'card'
    ? simBehaviorLabel(selectedMethod.simBehavior)
    : null;

  const handleSelectMethod = (m: PaymentMethodDto) => {
    const warning = m.type === 'card' ? simBehaviorLabel(m.simBehavior) : null;
    if (warning) {
      Alert.alert(
        'Tarjeta no válida',
        `Esta tarjeta está marcada como "${warning.text}" y no puede usarse para pagar. Seleccioná otro método o agregá una tarjeta válida desde tu perfil.`,
        [{ text: 'Entendido' }],
      );
    } else {
      onSelectMethod(m);
    }
  };

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
        <View>
          <Text style={{ fontFamily: Fonts.headingBold, fontSize: 14, color: colors.textPrimary, marginTop: 4 }}>
            {selectedMethod.alias}
            {selectedMethod.isFavorite ? ' ★' : ''}
          </Text>
          {selectedWarning && (
            <Text style={{ fontFamily: Fonts.sans, fontSize: 11, color: selectedWarning.color, marginTop: 2 }}>
              {selectedWarning.text} — el pago podría fallar
            </Text>
          )}
        </View>
      ) : (
        <Text style={{ fontFamily: Fonts.sans, fontSize: 13, color: colors.textMuted, marginTop: 4 }}>
          Sin método seleccionado
        </Text>
      )}
      {showMethodPicker && (
        <View style={{ marginTop: 10, gap: 6 }}>
          {paymentMethods.map(m => {
            const warning = m.type === 'card' ? simBehaviorLabel(m.simBehavior) : null;
            return (
              <Pressable
                key={m.id}
                onPress={() => handleSelectMethod(m)}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 8,
                  backgroundColor: selectedMethod?.id === m.id ? Brand.colors.green.normal + '22' : 'transparent',
                  borderWidth: 1,
                  borderColor: selectedMethod?.id === m.id ? Brand.colors.green.normal + '66' : colors.border,
                }}
              >
                <Ionicons
                  name={m.type === 'card' ? 'card-outline' : m.type === 'sinpe' ? 'phone-portrait-outline' : 'cash-outline'}
                  size={14}
                  color={warning ? warning.color : Brand.colors.green.normal}
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: Fonts.sans, fontSize: 13, color: colors.textPrimary }}>{m.alias}</Text>
                  {warning && (
                    <Text style={{ fontFamily: Fonts.sans, fontSize: 11, color: warning.color }}>{warning.text}</Text>
                  )}
                </View>
                {m.isFavorite && <Ionicons name="star" size={12} color="#f7a900" />}
              </Pressable>
            );
          })}
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
