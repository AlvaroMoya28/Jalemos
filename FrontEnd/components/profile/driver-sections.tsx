// Driver-only profile sections: registered vehicles (+ pending vehicle applications)
// and documents (licence / Dekra with expiry status). Presentational; the screen passes
// data and navigation callbacks.

import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import GlassCard from '@/components/shared/glass-card';
import type { DriverApplication } from '@/contexts/applications';
import type { User } from '@/contexts/auth';
import { Brand, Fonts } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { VehicleDTO } from '@/services/api';
import { makeStyles, staticStyles as profileStaticStyles } from '../../styles/tabs/profile.styles';

type ProfileStyles = ReturnType<typeof makeStyles>;
type AppColors = ReturnType<typeof useAppTheme>['colors'];
export type ExpiryState = 'ok' | 'soon' | 'expired';

export function expiryState(month: number | null, year: number | null): ExpiryState {
  if (!month || !year) return 'ok';
  const now = new Date();
  const expiry = new Date(year, month - 1, 1); // first day of expiry month
  const diffDays = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays < 0) return 'expired';
  if (diffDays <= 60) return 'soon';
  return 'ok';
}

export function expiryLabel(month: number | null, year: number | null): string {
  if (!month || !year) return 'Sin fecha';
  return `Vence ${String(month).padStart(2, '0')}/${year}`;
}

const iconName = (s: ExpiryState) =>
  s === 'expired' ? ('close-circle' as const) : s === 'soon' ? ('warning' as const) : ('checkmark-circle' as const);
const iconColor = (s: ExpiryState) => (s === 'expired' ? Brand.colors.alerts.error : s === 'soon' ? '#f7a900' : Brand.colors.green.normal);

export default function DriverSections({
  user, vehicles, vehiclesLoading, deletingId, onDeleteVehicle, vehicleApplications,
  onAddVehicle, onOpenDocuments, onOpenVehicleApp, styles, colors,
}: {
  user: User | null;
  vehicles: VehicleDTO[];
  vehiclesLoading: boolean;
  deletingId: string | null;
  onDeleteVehicle: (v: VehicleDTO) => void;
  vehicleApplications: DriverApplication[];
  onAddVehicle: () => void;
  onOpenDocuments: () => void;
  onOpenVehicleApp: (id: string) => void;
  styles: ProfileStyles;
  colors: AppColors;
}) {
  const licenseState = expiryState(user?.licenseExpiryMonth ?? null, user?.licenseExpiryYear ?? null);
  const dekraState = expiryState(user?.dekraExpiryMonth ?? null, user?.dekraExpiryYear ?? null);
  const docsExpired = licenseState === 'expired' || dekraState === 'expired';
  const docsSoon = licenseState === 'soon' || dekraState === 'soon';

  return (
    <>
      <View style={styles.sectionWrap}>
        <Text style={styles.sectionTitle}>Mis vehículos</Text>
        <GlassCard style={styles.sectionCard}>
          <View style={styles.vehicleSectionHeader}>
            <Text style={styles.vehicleSectionTitle}>Vehículos registrados</Text>
            <Text style={styles.vehicleSectionSub}>Selecciona cuál usar al ofrecer</Text>
          </View>
          <View style={styles.vehicleList}>
            {vehiclesLoading ? (
              <ActivityIndicator color={Brand.colors.green.normal} style={profileStaticStyles.activityIndicatorWrap} />
            ) : vehicles.length === 0 ? (
              <Text style={[styles.itemDesc, { textAlign: 'center', paddingVertical: 12 }]}>Sin vehículos registrados</Text>
            ) : (
              vehicles.map((v, idx) => (
                <View key={v.vehicleId} style={styles.vehicleCard}>
                  <View style={styles.vehicleRowTop}>
                    <View style={styles.itemIconWrap}>
                      <Ionicons name="car-outline" size={16} color={Brand.colors.green.darkActive} />
                    </View>
                    <View style={styles.vehicleTextWrap}>
                      <View style={styles.vehicleNameRow}>
                        <Text style={styles.itemLabel}>{v.brand} {v.model}</Text>
                        {idx === 0 && <Text style={styles.primaryBadge}>Principal</Text>}
                      </View>
                      <Text style={styles.itemDesc}>{v.numPlate} · {v.color} · {v.year}</Text>
                    </View>
                    <Pressable
                      onPress={() => onDeleteVehicle(v)}
                      disabled={deletingId === v.vehicleId}
                      hitSlop={8}
                      style={{ padding: 6, opacity: deletingId === v.vehicleId ? 0.4 : 1 }}
                    >
                      <Ionicons name="trash-outline" size={17} color={Brand.colors.alerts.error} />
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </View>
        </GlassCard>
        <Pressable style={[styles.favButton, { marginTop: 8 }]} onPress={onAddVehicle}>
          <View style={styles.favIconWrap}>
            <Ionicons name="add" size={18} color="#ecfff9" />
          </View>
          <View style={styles.favTextWrap}>
            <Text style={styles.favTitle}>Agregar vehículo</Text>
            <Text style={styles.favSub}>Registrar otro vehículo</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </Pressable>

        {vehicleApplications
          .filter((a) => a.status !== 'approved' && a.status !== 'rejected')
          .map((a) => {
            const statusColor = a.status === 'needs_correction' ? '#ff7c2a' : a.status === 'under_review' ? Brand.colors.blue.normal : '#f7a900';
            const statusLabel = a.status === 'needs_correction' ? 'Requiere corrección' : a.status === 'under_review' ? 'En revisión' : 'Pendiente';
            return (
              <Pressable
                key={a.id}
                style={[styles.favButton, { marginTop: 6, borderWidth: 1, borderColor: statusColor + '44' }]}
                onPress={() => onOpenVehicleApp(a.id)}
              >
                <View style={[styles.favIconWrap, { backgroundColor: statusColor + '22' }]}>
                  <Ionicons name="car-outline" size={16} color={statusColor} />
                </View>
                <View style={styles.favTextWrap}>
                  <Text style={styles.favTitle}>{a.vehicle.brand} {a.vehicle.model}</Text>
                  <Text style={[styles.favSub, { color: statusColor }]}>{statusLabel} · {a.vehicle.plate}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </Pressable>
            );
          })}
      </View>

      <View style={styles.sectionWrap}>
        <Text style={styles.sectionTitle}>Documentos</Text>
        {(docsExpired || docsSoon) && (
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 8,
            backgroundColor: docsExpired ? Brand.colors.alerts.error + '18' : '#f7a90018',
            borderRadius: Brand.radius[12], borderWidth: 1,
            borderColor: docsExpired ? Brand.colors.alerts.error + '55' : '#f7a90055',
            padding: 10, marginBottom: 8,
          }}>
            <Ionicons name={docsExpired ? 'warning' : 'time-outline'} size={16} color={docsExpired ? Brand.colors.alerts.error : '#f7a900'} />
            <Text style={{ flex: 1, fontSize: 12, fontFamily: Fonts.sans, color: docsExpired ? Brand.colors.alerts.error : '#f7a900', lineHeight: 17 }}>
              {docsExpired
                ? 'Tenés documentos vencidos. Actualizalos para seguir usando el modo conductor.'
                : 'Algunos documentos vencen pronto. Actualizalos antes de que expiren.'}
            </Text>
          </View>
        )}
        <GlassCard style={styles.sectionCard}>
          <Pressable style={[styles.sectionItem, styles.sectionItemBorder]} onPress={onOpenDocuments}>
            <View style={styles.itemIconWrap}>
              <Ionicons name="id-card-outline" size={16} color={Brand.colors.green.darkActive} />
            </View>
            <View style={styles.itemTextWrap}>
              <Text style={styles.itemLabel}>Licencia de conducir</Text>
              <Text style={[styles.itemDesc, { color: iconColor(licenseState) }]}>
                {expiryLabel(user?.licenseExpiryMonth ?? null, user?.licenseExpiryYear ?? null)}
              </Text>
            </View>
            <Ionicons name={iconName(licenseState)} size={16} color={iconColor(licenseState)} />
          </Pressable>
          <Pressable style={styles.sectionItem} onPress={onOpenDocuments}>
            <View style={styles.itemIconWrap}>
              <Ionicons name="car-sport-outline" size={16} color={Brand.colors.green.darkActive} />
            </View>
            <View style={styles.itemTextWrap}>
              <Text style={styles.itemLabel}>Revisión técnica Dekra</Text>
              <Text style={[styles.itemDesc, { color: iconColor(dekraState) }]}>
                {expiryLabel(user?.dekraExpiryMonth ?? null, user?.dekraExpiryYear ?? null)}
              </Text>
            </View>
            <Ionicons name={iconName(dekraState)} size={16} color={iconColor(dekraState)} />
          </Pressable>
          <Pressable style={[styles.sectionItem, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderSubtle }]} onPress={onOpenDocuments}>
            <View style={[styles.itemIconWrap, profileStaticStyles.updateDocIconWrap]}>
              <Ionicons name="refresh-outline" size={16} color={Brand.colors.green.normal} />
            </View>
            <View style={styles.itemTextWrap}>
              <Text style={[styles.itemLabel, profileStaticStyles.updateDocLabel]}>Actualizar documentos</Text>
              <Text style={styles.itemDesc}>Renovar licencia o Dekra</Text>
            </View>
            <Ionicons name="chevron-forward" size={15} color={colors.textMuted} />
          </Pressable>
        </GlassCard>
      </View>
    </>
  );
}
