// Expanded bottom sheet for the passenger's active trip: trip info, in-progress
// map + navigation, boarding QR, payment method/status, cancellation reason and
// the emergency/cancel actions. Driven entirely by props from ActiveTripBubble.

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Brand, Fonts } from '@/constants/theme';
import { buildCancelBody } from '@/hooks/use-passenger-trip-alerts';
import { useAppTheme } from '@/hooks/use-app-theme';
import { ActivePassengerTrip, PaymentDto, PaymentMethodDto } from '@/services/api';
import { openInMaps } from '@/utils/open-in-maps';
import QrDisplay from '../shared/qr-display';
import { PaymentMethodCard } from './payment-method-card';
import { TripInfoCard } from './trip-info-card';
import { styles } from './styles/active-trip-bubble.styles';

export default function ActiveTripSheet({
  trip, colors, isDark, visible, onClose,
  headlineLabel, stateColor, isActive,
  showQr, onToggleQr, qrToken,
  mapUrl, mapError, onMapError,
  paymentMethods, selectedMethod, showMethodPicker, onToggleMethodPicker, onSelectMethod,
  payment, paymentCreating,
  onEmergency, onCancelBooking,
}: {
  trip: ActivePassengerTrip;
  colors: ReturnType<typeof useAppTheme>['colors'];
  isDark: boolean;
  visible: boolean;
  onClose: () => void;
  headlineLabel: string;
  stateColor: string;
  isActive: boolean;
  showQr: boolean;
  onToggleQr: () => void;
  qrToken: string | null;
  mapUrl: string | null;
  mapError: boolean;
  onMapError: () => void;
  paymentMethods: PaymentMethodDto[];
  selectedMethod: PaymentMethodDto | null;
  showMethodPicker: boolean;
  onToggleMethodPicker: () => void;
  onSelectMethod: (m: PaymentMethodDto) => void;
  payment: PaymentDto | null;
  paymentCreating: boolean;
  onEmergency: () => void;
  onCancelBooking: () => void;
}) {
  const launchMaps = () => openInMaps(
    Number(trip.originLatitude), Number(trip.originLongitude),
    Number(trip.destinationLatitude), Number(trip.destinationLongitude),
    trip.origin, trip.destination,
  );

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      {Platform.OS === 'android' ? (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? 'rgba(0,0,0,0.65)' : 'rgba(0,0,0,0.4)' }]} />
      ) : (
        <BlurView intensity={30} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      )}
      <View style={styles.modalBg}>
        <View style={[styles.sheet, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
            <Pressable onPress={onClose} style={styles.handleWrap}>
              <View style={styles.handle} />
            </Pressable>

            <View style={[styles.statusBadge, { backgroundColor: stateColor + '22' }]}>
              <View style={[styles.statusDot, { backgroundColor: stateColor }]} />
              <Text style={[styles.statusText, { color: stateColor }]}>{headlineLabel}</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingBottom: 16 }}>
              <TripInfoCard trip={trip} colors={colors} />

              {/* ── In-progress: map + navigation ── */}
              {trip.tripState === 'in_progress' && (
                <>
                  <View style={[styles.enjoyBanner, { backgroundColor: Brand.colors.green.normal + '18' }]}>
                    <Ionicons name="car-sport" size={22} color={Brand.colors.green.normal} />
                    <Text style={[styles.enjoyText, { color: Brand.colors.green.normal }]}>
                      Vas en camino. ¡Disfruta tu viaje!
                    </Text>
                  </View>

                  <Pressable style={styles.mapWrap} onPress={launchMaps}>
                    {mapUrl && !mapError ? (
                      <Image source={{ uri: mapUrl }} style={styles.mapImage} resizeMode="cover" onError={onMapError} />
                    ) : (
                      <View style={[styles.mapFallback, { backgroundColor: colors.inputBg }]}>
                        <Ionicons name="map-outline" size={34} color={colors.textMuted} />
                        <Text style={[styles.mapFallbackText, { color: colors.textMuted }]} numberOfLines={1}>
                          {trip.origin} → {trip.destination}
                        </Text>
                      </View>
                    )}
                    <View style={styles.mapPin}>
                      <Ionicons name="navigate" size={14} color="#fff" />
                    </View>
                  </Pressable>

                  <Pressable style={styles.navBtn} onPress={launchMaps}>
                    <Ionicons name="navigate-outline" size={18} color="#fff" />
                    <Text style={styles.navBtnText}>Seguir ruta en mapa</Text>
                  </Pressable>
                </>
              )}

              {/* Boarding state badges */}
              {trip.bookingState === 'boarded' && trip.tripState === 'boarding' && (
                <View style={[styles.boardedBadge, { backgroundColor: Brand.colors.green.normal + '22' }]}>
                  <Ionicons name="checkmark-circle" size={20} color={Brand.colors.green.normal} />
                  <Text style={[styles.boardedText, { color: Brand.colors.green.normal }]}>
                    Abordado · espera a que el conductor inicie el viaje
                  </Text>
                </View>
              )}
              {trip.bookingState === 'confirmed' && trip.tripState === 'boarding' && (
                <View style={[styles.boardedBadge, { backgroundColor: '#f4a52222' }]}>
                  <Ionicons name="qr-code" size={20} color="#f4a522" />
                  <Text style={[styles.boardedText, { color: '#f4a522' }]}>
                    Muestra tu QR al conductor para subir
                  </Text>
                </View>
              )}

              {/* QR toggle — only during boarding, before the passenger is aboard */}
              {trip.tripState === 'boarding' && trip.bookingState !== 'boarded' && (
                <Pressable
                  style={[styles.qrBtn, { backgroundColor: Brand.colors.green.normal }]}
                  onPress={onToggleQr}
                >
                  <Ionicons name={showQr ? 'eye-off' : 'qr-code'} size={18} color="#fff" />
                  <Text style={styles.qrBtnText}>{showQr ? 'Ocultar QR' : 'Mostrar mi QR'}</Text>
                </Pressable>
              )}
              {showQr && qrToken && (
                <QrDisplay qrToken={qrToken} size={200} label="Muestra este QR a tu conductor" />
              )}
              {showQr && !qrToken && (
                <Text style={{ color: colors.textMuted, textAlign: 'center', fontFamily: Fonts.sans, fontSize: 13 }}>
                  Cargando QR…
                </Text>
              )}

              {/* Payment method selector — during boarding before boarding */}
              {trip.tripState === 'boarding' && trip.bookingState !== 'boarded' && (
                <PaymentMethodCard
                  colors={colors}
                  paymentMethods={paymentMethods}
                  selectedMethod={selectedMethod}
                  showMethodPicker={showMethodPicker}
                  onToggleMethodPicker={onToggleMethodPicker}
                  onSelectMethod={onSelectMethod}
                />
              )}

              {/* Payment status — shown after trip completes */}
              {trip.tripState === 'completed' && (
                <View style={[styles.card, { backgroundColor: colors.inputBg, borderColor: colors.border, alignItems: 'center', paddingVertical: 16 }]}>
                  {paymentCreating ? (
                    <>
                      <ActivityIndicator color={Brand.colors.green.normal} />
                      <Text style={{ fontFamily: Fonts.sans, fontSize: 13, color: colors.textSecondary, marginTop: 8 }}>Procesando pago…</Text>
                    </>
                  ) : payment ? (
                    <>
                      <Ionicons
                        name={payment.status === 'confirmed' ? 'checkmark-circle' : payment.status === 'failed' ? 'close-circle' : 'time-outline'}
                        size={28}
                        color={payment.status === 'confirmed' ? Brand.colors.green.normal : payment.status === 'failed' ? '#e53e3e' : '#f4a522'}
                      />
                      <Text style={{ fontFamily: Fonts.headingBold, fontSize: 14, color: colors.textPrimary, marginTop: 6 }}>
                        {payment.status === 'confirmed' ? 'Pago confirmado' : payment.status === 'failed' ? 'Pago fallido' : 'Pago pendiente'}
                      </Text>
                      <Text style={{ fontFamily: Fonts.sans, fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                        ₡{payment.amount.toLocaleString()} · {payment.method === 'card' ? 'Tarjeta' : payment.method === 'sinpe' ? 'SINPE' : 'Efectivo'}
                      </Text>
                      {payment.status === 'pending' && (
                        <Text style={{ fontFamily: Fonts.sans, fontSize: 12, color: '#f4a522', marginTop: 4, textAlign: 'center' }}>
                          El conductor confirmará tu pago
                        </Text>
                      )}
                    </>
                  ) : null}
                </View>
              )}

              {/* Cancellation reason (when cancelled) */}
              {trip.tripState === 'cancelled' && trip.cancelReason && (
                <View style={[styles.boardedBadge, { backgroundColor: '#e53e3e22' }]}>
                  <Ionicons name="close-circle" size={20} color="#e53e3e" />
                  <Text style={[styles.boardedText, { color: '#e53e3e', flex: 1 }]}>
                    {buildCancelBody(trip)}
                  </Text>
                </View>
              )}

              {/* Emergency / driver report — only while in_progress */}
              {trip.tripState === 'in_progress' && (
                <Pressable style={[styles.qrBtn, { backgroundColor: '#e53e3e' }]} onPress={onEmergency}>
                  <Ionicons name="warning" size={18} color="#fff" />
                  <Text style={styles.qrBtnText}>Emergencia / Reporte</Text>
                </Pressable>
              )}

              {/* Cancel booking — only if active and not yet boarded */}
              {isActive && trip.bookingState !== 'boarded' && (
                <Pressable style={styles.cancelLink} onPress={onCancelBooking}>
                  <Text style={[styles.cancelLinkText, { color: '#e53e3e' }]}>Cancelar mi reserva</Text>
                </Pressable>
              )}
            </ScrollView>
          </View>
        </View>
    </Modal>
  );
}
