// Payment confirmation step shown after the driver rates each boarded passenger.
// Lists pending SINPE/cash payments so the driver can confirm them before ending the trip.

import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { styles, passengerRowStyles } from './styles/boarding-screen.styles';
import { Brand, Fonts } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { PaymentDto } from '@/services/api';

interface Props {
  colors: ReturnType<typeof useAppTheme>['colors'];
  insets: { top: number; bottom: number };
  loadingPayments: boolean;
  pendingPayments: (PaymentDto & { passengerName: string })[];
  confirmingId: string | null;
  onConfirmPayment: (paymentId: string) => void;
  onFinish: () => void;
}

export function PaymentConfirmationStep({
  colors, insets, loadingPayments, pendingPayments, confirmingId, onConfirmPayment, onFinish,
}: Props) {
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.screenBg, paddingTop: insets.top, paddingHorizontal: 20 }]}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontSize: 18, marginTop: 24, marginBottom: 4 }]}>
        Confirmar pagos
      </Text>
      <Text style={{ fontFamily: Fonts.sans, fontSize: 13, color: colors.textSecondary, marginBottom: 20 }}>
        Los pagos con SINPE o efectivo requieren tu confirmación.
      </Text>

      {loadingPayments ? (
        <View style={{ alignItems: 'center', marginTop: 40, gap: 12 }}>
          <ActivityIndicator color={Brand.colors.green.normal} />
          <Text style={{ fontFamily: Fonts.sans, fontSize: 13, color: colors.textSecondary, textAlign: 'center' }}>
            Esperando que los pasajeros confirmen su método de pago…
          </Text>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 10 }} showsVerticalScrollIndicator={false}>
          {pendingPayments.map(p => (
            <View key={p.id} style={[passengerRowStyles.row, { backgroundColor: colors.inputBg, borderColor: colors.border, flexDirection: 'column', alignItems: 'flex-start', gap: 8 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons name="person-outline" size={18} color={Brand.colors.green.normal} />
                <View>
                  <Text style={[passengerRowStyles.name, { color: colors.textPrimary }]}>{p.passengerName}</Text>
                  <Text style={[passengerRowStyles.seats, { color: colors.textSecondary }]}>
                    ₡{p.amount.toLocaleString()} · {p.method === 'sinpe' ? 'SINPE Móvil' : 'Efectivo'}
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={() => onConfirmPayment(p.id)}
                disabled={confirmingId === p.id}
                style={{ alignSelf: 'flex-end', backgroundColor: Brand.colors.green.normal, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8, opacity: confirmingId === p.id ? 0.6 : 1 }}
              >
                {confirmingId === p.id
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={{ fontFamily: Fonts.headingBold, fontSize: 13, color: '#fff' }}>Confirmar pago</Text>
                }
              </Pressable>
            </View>
          ))}
        </ScrollView>
      )}

      {!loadingPayments && (
        <Pressable
          onPress={onFinish}
          style={{ marginBottom: insets.bottom + 16, marginTop: 12, padding: 16, alignItems: 'center', borderRadius: 12, backgroundColor: colors.inputBg }}
        >
          <Text style={{ fontFamily: Fonts.headingBold, color: colors.textSecondary }}>
            {pendingPayments.length === 0 ? 'Finalizar' : 'Omitir y finalizar'}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
