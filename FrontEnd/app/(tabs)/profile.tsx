// Profile tab — shows the user's avatar, stats, and mode-aware sections.
// A Pasajero / Conductor segmented toggle lets the user switch roles:
//   • First-time drivers are routed to /driver-registration to complete their profile.
//   • Returning drivers flip the UserModeContext directly and jump to the Offer tab.
// Passenger sections: favourite places, payment methods, share button.
// Driver sections:    registered vehicles, licence and Dekra documents.
// Preferencias and Soporte sections are always visible regardless of mode.
// Stats row adapts labels and values to reflect the active role (saved vs earned).

import GlassCard from '@/components/glass-card';
import NotificationsModal from '@/components/NotificationsModal';
import QrDisplay from '@/components/qr-display';
import { Brand, Fonts } from '@/constants/theme';
import { makeStyles, staticStyles as profileStaticStyles } from '../../styles/tabs/profile.styles';
import { meApi, VehicleDTO, vehiclesApi } from '@/services/api';
import { useApplications } from '@/contexts/applications';
import { useAuth } from '@/contexts/auth';
import { useLoading } from '@/contexts/loading';
import { useUserMode } from '@/contexts/user-mode';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Ionicons } from '@expo/vector-icons';
import { CommonActions } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { router, useNavigation, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActionSheetIOS, Alert, ActivityIndicator, Image, Platform, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';

const preferencesSections = [
  {
    title: 'Preferencias',
    items: [
      { icon: 'settings-outline' as const, label: 'Configuración', desc: 'Idioma y notificaciones', route: null },
      { icon: 'shield-checkmark-outline' as const, label: 'Privacidad y seguridad', desc: 'Datos y permisos', route: null },
    ],
  },
  {
    title: 'Soporte',
    items: [
      { icon: 'help-circle-outline' as const, label: 'Ayuda', desc: 'Preguntas frecuentes', route: null },
      { icon: 'document-text-outline' as const, label: 'Políticas de uso', desc: 'Términos y condiciones', route: '/policies' as const },
      { icon: 'information-circle-outline' as const, label: 'Acerca de Jalemos', desc: 'Versión 1.0.0', route: null },
    ],
  },
];

type ExpiryState = 'ok' | 'soon' | 'expired';

function expiryState(month: number | null, year: number | null): ExpiryState {
  if (!month || !year) return 'ok';
  const now = new Date();
  const expiry = new Date(year, month - 1, 1); // first day of expiry month
  const diffMs = expiry.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffDays < 0) return 'expired';
  if (diffDays <= 60) return 'soon';
  return 'ok';
}

function expiryLabel(month: number | null, year: number | null): string {
  if (!month || !year) return 'Sin fecha';
  return `Vence ${String(month).padStart(2, '0')}/${year}`;
}

export default function ProfileScreen() {
  const { isDark, colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation();
  const { user, token, logout, driverActivated, setDriverActivated } = useAuth();
  const { showLoader, hideLoader } = useLoading();
  const { mode, profilePhoto, setMode, setProfilePhoto } = useUserMode();
  const { loadMyApplication, myVehicleApplications, loadMyVehicleApplications } = useApplications();
  const isAdmin = user?.role === 'admin';
  const isDriver = !isAdmin && mode === 'driver';

  useEffect(() => {
    navigation.setOptions({ title: 'Perfil', icon: { sf: 'person' } });
  }, [navigation]);

  const [notifOpen, setNotifOpen] = useState(false);
  const [amount, setAmount] = useState(0);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [vehicles, setVehicles] = useState<VehicleDTO[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    if (!token) return;
    // Fetch QR token for all non-admin users
    if (!isAdmin) {
      meApi.get(token).then(me => setQrToken(me.qrToken)).catch(() => {});
    }
    if (!isDriver) return;
    setVehiclesLoading(true);
    vehiclesApi.getMy(token)
      .then(setVehicles)
      .catch(() => {})
      .finally(() => setVehiclesLoading(false));
    loadMyVehicleApplications().catch(() => {});
  }, [isAdmin, isDriver, token, loadMyVehicleApplications]));

  const licenseState = expiryState(user?.licenseExpiryMonth ?? null, user?.licenseExpiryYear ?? null);
  const dekraState   = expiryState(user?.dekraExpiryMonth   ?? null, user?.dekraExpiryYear   ?? null);
  const docsExpired  = licenseState === 'expired' || dekraState === 'expired';
  const docsSoon     = licenseState === 'soon'    || dekraState === 'soon';

  const expiryIconName = (state: ExpiryState) =>
    state === 'expired' ? 'close-circle'     as const :
    state === 'soon'    ? 'warning'           as const :
                          'checkmark-circle'  as const;
  const expiryIconColor = (state: ExpiryState) =>
    state === 'expired' ? Brand.colors.alerts.error :
    state === 'soon'    ? '#f7a900' :
                          Brand.colors.green.normal;

  /** Opens ActionSheet / Alert so the user can retake or pick a new profile photo. */
  const handleEditPhoto = () => {
    if (user?.profilePhotoLocked && user.role === 'passenger+driver') {
      Alert.alert('Foto bloqueada', 'La foto de perfil fue establecida al aprobar tu solicitud de conductor y no se puede cambiar.');
      return;
    }
    const takePhoto = () =>
      ImagePicker.launchCameraAsync({ quality: 0.85, allowsEditing: true, aspect: [1, 1] })
        .then(r => { if (!r.canceled) setProfilePhoto(r.assets[0].uri); });
    const pickPhoto = () =>
      ImagePicker.launchImageLibraryAsync({ quality: 0.85, allowsEditing: true, aspect: [1, 1] })
        .then(r => { if (!r.canceled) setProfilePhoto(r.assets[0].uri); });

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Cancelar', 'Tomar foto', 'Elegir de galería'], cancelButtonIndex: 0 },
        i => { if (i === 1) takePhoto(); if (i === 2) pickPhoto(); }
      );
    } else {
      Alert.alert('Foto de perfil', '', [
        { text: 'Tomar foto',        onPress: takePhoto  },
        { text: 'Elegir de galería', onPress: pickPhoto  },
        { text: 'Cancelar', style: 'cancel'              },
      ]);
    }
  };

  const handleDeleteVehicle = (vehicle: VehicleDTO) => {
    if (!token) return;
    const isLast = vehicles.length === 1;
    Alert.alert(
      isLast ? 'Último vehículo' : 'Eliminar vehículo',
      isLast
        ? `${vehicle.brand} ${vehicle.model} es tu único vehículo. Si lo eliminás, no podrás ofrecer viajes hasta registrar uno nuevo. ¿Continuás?`
        : `¿Eliminar ${vehicle.brand} ${vehicle.model} (${vehicle.numPlate})?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(vehicle.vehicleId);
            try {
              await vehiclesApi.delete(vehicle.vehicleId, token);
              setVehicles(prev => prev.filter(v => v.vehicleId !== vehicle.vehicleId));
            } catch (e: any) {
              Alert.alert('Error', e?.message ?? 'No se pudo eliminar el vehículo.');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    showLoader('Cerrando sesión...');
    try {
      await logout();
      navigation.getParent()?.dispatch(
        CommonActions.reset({ index: 0, routes: [{ name: 'index' }] })
      );
    } finally {
      hideLoader();
    }
  };

  const handleSwitchMode = async (target: 'passenger' | 'driver') => {
    if (target === mode) return;
    if (target === 'driver') {
      if (driverActivated || user?.role === 'passenger+driver') {
        if (!driverActivated) setDriverActivated(true);
        setMode('driver');
        setTimeout(() => router.replace('/(tabs)/offer'), 0);
        return;
      }
      showLoader('Verificando solicitud...');
      try {
        const app = await loadMyApplication();
        if (app) {
          // Application approved but role was revoked by admin → force re-registration
          if (app.status === 'approved' && (user?.role as string) !== 'passenger+driver') {
            router.push('/driver-registration');
          } else {
            router.push('/driver-status');
          }
        } else {
          router.push('/driver-registration');
        }
      } finally {
        hideLoader();
      }
    } else {
      setMode('passenger');
      setTimeout(() => router.replace('/(tabs)/search'), 0);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={profileStaticStyles.scrollContentContainer}
        contentInsetAdjustmentBehavior="automatic"
        style={{ backgroundColor: colors.bottomSurface }}>

        <View style={styles.heroWrap}>
          <Image
            source={isDark ? require('../../assets/images/hero-banner-dark.jpg') : require('../../assets/images/hero-banner.jpg')}
            style={styles.heroImage}
          />
          <View style={styles.heroOverlay} />
          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.heroMini}>Pura Vida</Text>
              <Text style={styles.heroTitle}>Mi perfil</Text>
            </View>
            <Pressable onPress={() => setNotifOpen(true)} style={styles.bellBtn}>
              <Ionicons name="notifications-outline" size={20} color="#ecfff9" />
              <View style={styles.bellDot} />
            </Pressable>
          </View>
        </View>

        <View style={styles.bottomSurface}>

          {/* Profile card */}
          <GlassCard style={styles.profileCard}>
            <View style={styles.profileTop}>
              {/* Avatar — local override first, then server photo, then initials */}
              {(() => {
                const displayPhoto = profilePhoto ?? user?.profilePhotoUrl ?? null;
                return (
                  <Pressable style={styles.avatar} onPress={handleEditPhoto}>
                    {displayPhoto
                      ? <Image source={{ uri: displayPhoto }} style={styles.avatarPhoto} />
                      : <Text style={styles.avatarText}>{user?.avatar ?? '?'}</Text>}
                    <View style={styles.avatarEditBadge}>
                      <Ionicons name={user?.profilePhotoLocked && user.role === 'passenger+driver' ? 'lock-closed-outline' : 'camera-outline'} size={12} color="#fff" />
                    </View>
                  </Pressable>
                );
              })()}
              <View style={styles.profileMain}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{user ? `${user.firstName} ${user.lastName}` : '—'}</Text>
                  <Ionicons name="checkmark-circle" size={16} color={Brand.colors.green.dark} />
                  {isDriver && (
                    <Ionicons name="car" size={16} color={Brand.colors.green.normal} />
                  )}
                </View>
                <Text style={styles.email}>{user?.email ?? ''}</Text>
                {isAdmin ? (
                  <View style={styles.ratingRow}>
                    <Ionicons name="shield-checkmark-outline" size={13} color={Brand.colors.green.normal} />
                    <Text style={[styles.rating, { color: Brand.colors.green.normal }]}>Administrador</Text>
                  </View>
                ) : (
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={13} color="#f7a900" />
                    <Text style={styles.rating}>{user?.rating?.toFixed(1) ?? '—'}</Text>
                    <Text style={styles.ratingSub}>· {isDriver ? `${user?.driverTripsCount ?? 0} viajes ofrecidos` : `${user?.tripsCount ?? 0} viajes`}</Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.statsRow}>
              {isAdmin ? (
                <>
                  <View style={styles.statItem}>
                    <Text style={styles.statValueGreen}>Admin</Text>
                    <Text style={styles.statLabel}>Rol</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{user?.memberSince ?? '—'}</Text>
                    <Text style={styles.statLabel}>Miembro desde</Text>
                  </View>
                </>
              ) : isDriver ? (
                <>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{user?.driverTripsCount ?? 0}</Text>
                    <Text style={styles.statLabel}>Ofrecidos</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{user?.tripsCount ?? 0}</Text>
                    <Text style={styles.statLabel}>Tomados</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValueGreen}>{user?.rating?.toFixed(1) ?? '—'}</Text>
                    <Text style={styles.statLabel}>Calificación</Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{user?.tripsCount ?? 0}</Text>
                    <Text style={styles.statLabel}>Viajes</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{user?.memberSince ?? '—'}</Text>
                    <Text style={styles.statLabel}>Miembro desde</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValueGreen}>{user?.rating?.toFixed(1) ?? '—'}</Text>
                    <Text style={styles.statLabel}>Calificación</Text>
                  </View>
                </>
              )}
            </View>
          </GlassCard>

          {/* Mode toggle — hidden for admins */}
          {!isAdmin && (
          <View style={styles.modeToggleWrap}>
            <Pressable
              style={[styles.modeBtn, !isDriver && styles.modeBtnActive]}
              onPress={() => handleSwitchMode('passenger')}>
              <Ionicons name="person-outline" size={15} color={!isDriver ? Brand.colors.black.b1 : colors.textMuted} />
              <Text style={[styles.modeBtnText, !isDriver && styles.modeBtnTextActive]}>Pasajero</Text>
            </Pressable>
            <Pressable
              style={[styles.modeBtn, isDriver && styles.modeBtnActive]}
              onPress={() => handleSwitchMode('driver')}>
              <Ionicons name="car-outline" size={15} color={isDriver ? Brand.colors.black.b1 : colors.textMuted} />
              <Text style={[styles.modeBtnText, isDriver && styles.modeBtnTextActive]}>Conductor</Text>
            </Pressable>
          </View>
          )}

          {/* Passenger-only sections */}
          {!isAdmin && !isDriver && (
            <>
              <GlassCard style={styles.favButton}>
                <View style={styles.favIconWrap}>
                  <Ionicons name="location-outline" size={16} color="#ecfff9" />
                </View>
                <View style={styles.favTextWrap}>
                  <Text style={styles.favTitle}>Lugares favoritos</Text>
                  <Text style={styles.favSub}>Casa, trabajo y más</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </GlassCard>

              <View style={styles.sectionWrap}>
                <Text style={styles.sectionTitle}>Cuenta</Text>
                <GlassCard style={styles.sectionCard}>
                  <Pressable style={styles.sectionItem}>
                    <View style={styles.itemIconWrap}>
                      <Ionicons name="card-outline" size={16} color={Brand.colors.green.darkActive} />
                    </View>
                    <View style={styles.itemTextWrap}>
                      <Text style={styles.itemLabel}>Métodos de pago</Text>
                      <Text style={styles.itemDesc}>Tarjetas y SINPE Movil</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={15} color={colors.textMuted} />
                  </Pressable>
                  <View style={styles.sectionDivider} />
                  <View style={styles.walletWrapInPayment}>
                    <View style={styles.walletCard}>
                      <Text style={styles.walletBrand}>mastercard</Text>
                      <Text style={styles.walletNumber}>5282 3456 7890 1289</Text>
                      <Text style={styles.walletDate}>09/25</Text>
                    </View>
                    <View style={styles.walletCounter}>
                      <Text style={styles.walletAmount}>₡ {amount.toLocaleString()}</Text>
                      <View style={styles.counterButtons}>
                        <Pressable style={styles.counterCircle} onPress={() => setAmount(v => Math.max(0, v - 500))}>
                          <Ionicons name="remove" size={18} color={Brand.colors.black.b1} />
                        </Pressable>
                        <Pressable style={styles.counterCircle} onPress={() => setAmount(v => v + 500)}>
                          <Ionicons name="add" size={18} color={Brand.colors.black.b1} />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                </GlassCard>
              </View>

              <Pressable style={styles.shareButton} onPress={() => Share.share({ message: 'Jalemos - comparte viaje y ahorra en cada ruta.' })}>
                <Ionicons name="share-social-outline" size={16} color={Brand.colors.black.b1} />
                <Text style={styles.shareButtonText}>Compartir Jalemos</Text>
              </Pressable>
            </>
          )}

          {/* Driver-only sections */}
          {!isAdmin && isDriver && (
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
                      <Text style={[styles.itemDesc, { textAlign: 'center', paddingVertical: 12 }]}>
                        Sin vehículos registrados
                      </Text>
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
                              onPress={() => handleDeleteVehicle(v)}
                              disabled={deletingId === v.vehicleId}
                              hitSlop={8}
                              style={{ padding: 6, opacity: deletingId === v.vehicleId ? 0.4 : 1 }}>
                              <Ionicons name="trash-outline" size={17} color={Brand.colors.alerts.error} />
                            </Pressable>
                          </View>
                        </View>
                      ))
                    )}
                  </View>
                </GlassCard>
                <Pressable
                  style={[styles.favButton, { marginTop: 8 }]}
                  onPress={() => router.push('/add-vehicle')}>
                  <View style={styles.favIconWrap}>
                    <Ionicons name="add" size={18} color="#ecfff9" />
                  </View>
                  <View style={styles.favTextWrap}>
                    <Text style={styles.favTitle}>Agregar vehículo</Text>
                    <Text style={styles.favSub}>Registrar otro vehículo</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </Pressable>

                {/* Solicitudes de vehículo activas */}
                {myVehicleApplications
                  .filter(a => a.status !== 'approved' && a.status !== 'rejected')
                  .map(a => {
                    const statusColor =
                      a.status === 'needs_correction' ? '#ff7c2a' :
                      a.status === 'under_review'     ? Brand.colors.blue.normal :
                      '#f7a900';
                    const statusLabel =
                      a.status === 'needs_correction' ? 'Requiere corrección' :
                      a.status === 'under_review'     ? 'En revisión' :
                      'Pendiente';
                    return (
                      <Pressable
                        key={a.id}
                        style={[styles.favButton, { marginTop: 6, borderWidth: 1, borderColor: statusColor + '44' }]}
                        onPress={() => router.push({ pathname: '/vehicle-application-status', params: { id: a.id } })}>
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
                  })
                }
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
                  <Pressable style={[styles.sectionItem, styles.sectionItemBorder]} onPress={() => router.push('/driver-documents')}>
                    <View style={styles.itemIconWrap}>
                      <Ionicons name="id-card-outline" size={16} color={Brand.colors.green.darkActive} />
                    </View>
                    <View style={styles.itemTextWrap}>
                      <Text style={styles.itemLabel}>Licencia de conducir</Text>
                      <Text style={[styles.itemDesc, { color: expiryIconColor(licenseState) }]}>
                        {expiryLabel(user?.licenseExpiryMonth ?? null, user?.licenseExpiryYear ?? null)}
                      </Text>
                    </View>
                    <Ionicons name={expiryIconName(licenseState)} size={16} color={expiryIconColor(licenseState)} />
                  </Pressable>
                  <Pressable style={styles.sectionItem} onPress={() => router.push('/driver-documents')}>
                    <View style={styles.itemIconWrap}>
                      <Ionicons name="car-sport-outline" size={16} color={Brand.colors.green.darkActive} />
                    </View>
                    <View style={styles.itemTextWrap}>
                      <Text style={styles.itemLabel}>Revisión técnica Dekra</Text>
                      <Text style={[styles.itemDesc, { color: expiryIconColor(dekraState) }]}>
                        {expiryLabel(user?.dekraExpiryMonth ?? null, user?.dekraExpiryYear ?? null)}
                      </Text>
                    </View>
                    <Ionicons name={expiryIconName(dekraState)} size={16} color={expiryIconColor(dekraState)} />
                  </Pressable>
                  <Pressable style={[styles.sectionItem, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderSubtle }]} onPress={() => router.push('/driver-documents')}>
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
          )}

          {/* QR Code section — visible to all non-admin users */}
          {!isAdmin && qrToken && (
            <View style={styles.sectionWrap}>
              <Text style={styles.sectionTitle}>Mi QR de abordaje</Text>
              <GlassCard style={[styles.sectionCard, profileStaticStyles.qrSectionCard]}>
                <Text style={[styles.itemDesc, profileStaticStyles.qrItemDescCentered]}>
                  Muestra este código al conductor para registrarte en el vehículo. Es único e intransferible.
                </Text>
                {showQr ? (
                  <QrDisplay
                    qrToken={qrToken}
                    size={180}
                    label="Tu identificación de abordaje"
                  />
                ) : null}
                <Pressable
                  style={profileStaticStyles.qrToggleBtn}
                  onPress={() => setShowQr(v => !v)}
                >
                  <Ionicons name={showQr ? 'eye-off-outline' : 'qr-code-outline'} size={16} color="#fff" />
                  <Text style={profileStaticStyles.qrToggleBtnText}>
                    {showQr ? 'Ocultar QR' : 'Mostrar mi QR'}
                  </Text>
                </Pressable>
              </GlassCard>
            </View>
          )}

          {/* Always visible: Preferencias + Soporte */}
          {preferencesSections.map(section => (
            <View key={section.title} style={styles.sectionWrap}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <GlassCard style={styles.sectionCard}>
                {section.items.map((item, index) => (
                  <Pressable
                    key={item.label}
                    onPress={() => item.route ? router.push(item.route as any) : undefined}
                    style={[styles.sectionItem, index !== section.items.length - 1 && styles.sectionItemBorder]}>
                    <View style={styles.itemIconWrap}>
                      <Ionicons name={item.icon} size={16} color={Brand.colors.green.darkActive} />
                    </View>
                    <View style={styles.itemTextWrap}>
                      <Text style={styles.itemLabel}>{item.label}</Text>
                      <Text style={styles.itemDesc}>{item.desc}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={15} color={colors.textMuted} />
                  </Pressable>
                ))}
              </GlassCard>
            </View>
          ))}

          <Pressable style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={16} color="#c6443d" />
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </Pressable>

        </View>
      </ScrollView>

      <NotificationsModal visible={notifOpen} onClose={() => setNotifOpen(false)} />
    </View>
  );
}
