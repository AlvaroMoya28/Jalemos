// Combined payment-confirmation + trip-finished summary shown to the driver right after
// rating each boarded passenger. One row per passenger: already-resolved payments (card)
// just show their status, SINPE/cash payments still pending get an inline confirm action —
// a single Finalizar/Aceptar button at the bottom ends the trip either way.

import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { styles, passengerRowStyles } from './styles/boarding-screen.styles';
import { Brand, Fonts } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { paymentMethodLabel } from '@/services/api';
import { TripSummaryRow } from '@/hooks/use-boarding-screen';

interface Props {
  colors: ReturnType<typeof useAppTheme>['colors'];
  insets: { top: number; bottom: number };
  loading: boolean;
  rows: TripSummaryRow[];
  confirmingId: string | null;
  onConfirmPayment: (paymentId: string) => void;
  onFinish: () => void;
}

const STATUS_META: Record<Exclude<TripSummaryRow['status'], 'pending'>, { icon: keyof typeof Ionicons.glyphMap; color: string; label: string }> = {
  confirmed:  { icon: 'checkmark-circle', color: Brand.colors.green.normal, label: 'Confirmado' },
  failed:     { icon: 'close-circle',     color: '#e53e3e',                 label: 'Pago fallido' },
  unverified: { icon: 'help-circle',      color: '#888',                    label: 'No se pudo verificar' },
};

export function TripPaymentSummaryScreen({ colors, insets, loading, rows, confirmingId, onConfirmPayment, onFinish }: Props) {
  const anyPending = rows.some(r => r.status === 'pending');

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.screenBg, paddingTop: insets.top, paddingHorizontal: 20 }]}>
      <View style={{ alignItems: 'center', marginTop: 32, marginBottom: 24 }}>
        <Ionicons name="checkmark-circle" size={48} color={Brand.colors.green.normal} />
        <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontSize: 18, marginTop: 12 }]}>
          Viaje finalizado
        </Text>
        <Text style={{ fontFamily: Fonts.sans, fontSize: 13, color: colors.textSecondary, marginTop: 4, textAlign: 'center' }}>
          Resumen de pago por pasajero
        </Text>
      </View>

      {loading ? (
        <View style={{ alignItems: 'center', marginTop: 20, gap: 12 }}>
          <ActivityIndicator color={Brand.colors.green.normal} />
          <Text style={{ fontFamily: Fonts.sans, fontSize: 13, color: colors.textSecondary, textAlign: 'center' }}>
            Esperando que los pasajeros confirmen su método de pago…
          </Text>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 10 }} showsVerticalScrollIndicator={false}>
          {rows.map((r, i) => {
            if (r.status === 'pending') {
              return (
                <View key={i} style={[passengerRowStyles.row, { backgroundColor: colors.inputBg, borderColor: colors.border, flexDirection: 'column', alignItems: 'flex-start', gap: 8 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Ionicons name="time-outline" size={22} color="#f4a522" />
                    <View>
                      <Text style={[passengerRowStyles.name, { color: colors.textPrimary }]}>{r.passengerName}</Text>
                      <Text style={[passengerRowStyles.seats, { color: colors.textSecondary }]}>
                        ₡{(r.amount ?? 0).toLocaleString()} · {paymentMethodLabel(r.method ?? '')}
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => r.paymentId && onConfirmPayment(r.paymentId)}
                    disabled={confirmingId === r.paymentId}
                    style={{ alignSelf: 'flex-end', backgroundColor: Brand.colors.green.normal, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8, opacity: confirmingId === r.paymentId ? 0.6 : 1 }}
                  >
                    {confirmingId === r.paymentId
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Text style={{ fontFamily: Fonts.headingBold, fontSize: 13, color: '#fff' }}>Confirmar pago</Text>
                    }
                  </Pressable>
                </View>
              );
            }

            const meta = STATUS_META[r.status];
            return (
              <View key={i} style={[passengerRowStyles.row, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <Ionicons name={meta.icon} size={22} color={meta.color} />
                <View style={{ flex: 1 }}>
                  <Text style={[passengerRowStyles.name, { color: colors.textPrimary }]}>{r.passengerName}</Text>
                  <Text style={[passengerRowStyles.seats, { color: colors.textSecondary }]}>
                    {r.amount !== null ? `₡${r.amount.toLocaleString()} · ${paymentMethodLabel(r.method ?? '')} · ` : ''}
                    <Text style={{ color: meta.color, fontFamily: Fonts.headingBold }}>{meta.label}</Text>
                  </Text>
                </View>
              </View>
            );
          })}
          {rows.length === 0 && (
            <Text style={{ fontFamily: Fonts.sans, fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginTop: 20 }}>
              El viaje finalizó correctamente.
            </Text>
          )}
        </ScrollView>
      )}

      {!loading && (
        <Pressable
          onPress={onFinish}
          style={{ marginBottom: insets.bottom + 16, marginTop: 12, padding: 16, alignItems: 'center', borderRadius: 12, backgroundColor: Brand.colors.green.normal }}
        >
          <Text style={{ fontFamily: Fonts.headingBold, color: '#fff' }}>{anyPending ? 'Finalizar' : 'Aceptar'}</Text>
        </Pressable>
      )}
    </View>
  );
}
