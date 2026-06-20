// "Detalles del viaje" body of the Offer tab: seats/price counters, vehicle
// picker trigger, notes, earnings summary and the publish CTA. Drives off the
// useOfferForm hook passed from the screen.

import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, TextInput, View } from 'react-native';

import GlassCard from '@/components/shared/glass-card';
import { Brand } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useOfferForm } from '@/hooks/use-offer-form';
import { makeStyles, noVehiclesWarning } from '@/styles/tabs/offer.styles';

export default function OfferForm({ form, styles, colors }: {
  form: ReturnType<typeof useOfferForm>;
  styles: ReturnType<typeof makeStyles>;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  const { seats, setSeats, price, setPrice, vehicles, vehiclesLoading, selectedVehicle,
          setVehicleModalOpen, notes, setNotes, remaining, estimated, publish } = form;

  return (
    <>
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

        {!vehiclesLoading && vehicles.length === 0 && (
          <View style={noVehiclesWarning.container}>
            <Ionicons name="warning-outline" size={18} color={Brand.colors.alerts.error} />
            <View style={noVehiclesWarning.textWrap}>
              <Text style={noVehiclesWarning.title}>Sin vehículos registrados</Text>
              <Text style={noVehiclesWarning.subtitle}>
                Registrá un vehículo desde tu perfil para poder ofrecer viajes.
              </Text>
            </View>
          </View>
        )}

        <View style={styles.vehicleSection}>
          <Text style={styles.sectionLabel}>Vehículo</Text>
          <Pressable
            style={[styles.vehiclePicker, vehicles.length === 0 && !vehiclesLoading && { opacity: 0.45 }]}
            onPress={() => vehicles.length > 0 && setVehicleModalOpen(true)}
            disabled={vehicles.length === 0 && !vehiclesLoading}
          >
            <View>
              {vehiclesLoading ? (
                <Text style={styles.vehicleName}>Cargando vehículos…</Text>
              ) : selectedVehicle ? (
                <>
                  <Text style={styles.vehicleName}>{selectedVehicle.name}</Text>
                  <Text style={styles.vehicleMeta}>{selectedVehicle.plate} · {selectedVehicle.color}</Text>
                </>
              ) : (
                <Text style={[styles.vehicleName, { color: colors.textMuted }]}>Sin vehículos disponibles</Text>
              )}
            </View>
            <Ionicons name="chevron-down" size={18} color={Brand.colors.green.dark} />
          </Pressable>
        </View>

        <View style={styles.notesWrap}>
          <Ionicons name="chatbubble-ellipses-outline" size={16} color={Brand.colors.green.normal} style={styles.notesIcon} />
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Notas para los pasajeros (opcional)"
            placeholderTextColor={colors.textPlaceholder}
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
          <Text style={styles.summaryVehicle}>{selectedVehicle?.name ?? '—'}</Text>
        </View>
      </GlassCard>

      <Pressable
        style={[styles.cta, vehicles.length === 0 && { opacity: 0.45 }]}
        onPress={publish}
        disabled={vehicles.length === 0}
      >
        <Text style={styles.ctaText}>Publicar viaje</Text>
      </Pressable>
    </>
  );
}
