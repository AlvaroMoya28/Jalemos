// Profile tab — thin container that composes the profile sections.
// Mode-aware: passenger (favourites, payment methods, share), driver (vehicles, docs),
// plus the always-visible QR, preferences and support sections. Section UIs live in
// components/profile/*; payment-method state lives in usePaymentMethods.

import GlassCard from '@/components/shared/glass-card';
import NotificationsModal from '@/components/shared/NotificationsModal';
import UnreadBadge from '@/components/shared/unread-badge';
import DriverSections from '@/components/profile/driver-sections';
import PaymentMethodsSection from '@/components/profile/payment-methods-section';
import ProfileHeaderCard from '@/components/profile/profile-header-card';
import QrSection from '@/components/profile/qr-section';
import { Brand } from '@/constants/theme';
import { useNotifications } from '@/contexts/notifications';
import { useApplications } from '@/contexts/applications';
import { useAuth } from '@/contexts/auth';
import { useLoading } from '@/contexts/loading';
import { useUserMode } from '@/contexts/user-mode';
import { useAppTheme } from '@/hooks/use-app-theme';
import { ApiError, meApi, VehicleDTO, vehiclesApi } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { CommonActions } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect, useNavigation } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActionSheetIOS, Alert, Image, Platform, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { makeStyles, staticStyles as profileStaticStyles } from '../../styles/tabs/profile.styles';

const preferencesSections = [
  {
    title: 'Preferencias',
    items: [
      { icon: 'notifications-outline' as const, label: 'Notificaciones', desc: 'Elige qué avisos recibir', route: '/notification-preferences' as const },
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

export default function ProfileScreen() {
  const { isDark, colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation();
  const { user, token, logout, driverActivated, setDriverActivated, setProfilePhotoUrl } = useAuth();
  const { showLoader, hideLoader } = useLoading();
  const { mode, profilePhoto, setMode, setProfilePhoto } = useUserMode();
  const { loadMyApplication, myVehicleApplications, loadMyVehicleApplications } = useApplications();
  const { unreadCount } = useNotifications();
  const isAdmin = user?.role === 'admin';
  const isDriver = !isAdmin && mode === 'driver';

  useEffect(() => {
    navigation.setOptions({ title: 'Perfil', icon: { sf: 'person' } });
  }, [navigation]);

  const [notifOpen, setNotifOpen] = useState(false);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [sendingQr, setSendingQr] = useState(false);
  const [qrCooldown, setQrCooldown] = useState(0); // seconds left before QR can be emailed again
  const [vehicles, setVehicles] = useState<VehicleDTO[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    if (!token) return;
    if (!isAdmin) {
      meApi.get(token).then((me) => setQrToken(me.qrToken)).catch(() => {});
    }
    if (!isDriver) return;
    setVehiclesLoading(true);
    vehiclesApi.getMy(token)
      .then(setVehicles)
      .catch(() => {})
      .finally(() => setVehiclesLoading(false));
    loadMyVehicleApplications().catch(() => {});
  }, [isAdmin, isDriver, token, loadMyVehicleApplications]));

  /** Uploads the picked asset to the backend (S3) and updates the user's photo URL. */
  const uploadProfilePhoto = async (asset: ImagePicker.ImagePickerAsset) => {
    if (!token || !asset.base64) {
      Alert.alert('Error', 'No se pudo leer la imagen seleccionada.');
      return;
    }
    setProfilePhoto(asset.uri); // instant feedback
    showLoader('Guardando foto...');
    try {
      const { profilePhotoUrl } = await meApi.uploadPhoto(asset.base64, token);
      setProfilePhotoUrl(profilePhotoUrl);
      setProfilePhoto(null);
    } catch (e: any) {
      setProfilePhoto(null);
      Alert.alert('No se pudo guardar', e?.message ?? 'Inténtalo de nuevo.');
    } finally {
      hideLoader();
    }
  };

  const handleEditPhoto = () => {
    if (user?.profilePhotoLocked && user.role === 'passenger+driver') {
      Alert.alert('Foto bloqueada', 'La foto de perfil fue establecida al aprobar tu solicitud de conductor y no se puede cambiar.');
      return;
    }
    const takePhoto = () =>
      ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: true, aspect: [1, 1], base64: true })
        .then((r) => { if (!r.canceled) uploadProfilePhoto(r.assets[0]); });
    const pickPhoto = () =>
      ImagePicker.launchImageLibraryAsync({ quality: 0.7, allowsEditing: true, aspect: [1, 1], base64: true })
        .then((r) => { if (!r.canceled) uploadProfilePhoto(r.assets[0]); });

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Cancelar', 'Tomar foto', 'Elegir de galería'], cancelButtonIndex: 0 },
        (i) => { if (i === 1) takePhoto(); if (i === 2) pickPhoto(); },
      );
    } else {
      Alert.alert('Foto de perfil', '', [
        { text: 'Tomar foto', onPress: takePhoto },
        { text: 'Elegir de galería', onPress: pickPhoto },
        { text: 'Cancelar', style: 'cancel' },
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
              setVehicles((prev) => prev.filter((v) => v.vehicleId !== vehicle.vehicleId));
            } catch (e: any) {
              Alert.alert('Error', e?.message ?? 'No se pudo eliminar el vehículo.');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ],
    );
  };

  // Tick the QR-email cooldown down to zero.
  useEffect(() => {
    if (qrCooldown <= 0) return;
    const timer = setInterval(() => setQrCooldown((c) => (c <= 1 ? 0 : c - 1)), 1000);
    return () => clearInterval(timer);
  }, [qrCooldown]);

  const handleSendQrEmail = async () => {
    if (!token || sendingQr || qrCooldown > 0) return;
    setSendingQr(true);
    try {
      await meApi.sendQr(token);
      setQrCooldown(300);
      Alert.alert('QR enviado', 'Te enviamos tu QR de abordaje al correo.');
    } catch (e: any) {
      if (e instanceof ApiError && e.status === 429) {
        setQrCooldown(e.body?.retryAfterSeconds ?? 300);
        Alert.alert('Esperá un momento', e.message);
      } else {
        Alert.alert('Error', e?.message ?? 'No se pudo enviar el QR.');
      }
    } finally {
      setSendingQr(false);
    }
  };

  const handleLogout = async () => {
    showLoader('Cerrando sesión...');
    try {
      await logout();
      navigation.getParent()?.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'index' }] }));
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

  const displayPhoto = profilePhoto ?? user?.profilePhotoUrl ?? null;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={profileStaticStyles.scrollContentContainer}
        contentInsetAdjustmentBehavior="automatic"
        style={{ backgroundColor: colors.bottomSurface }}
      >
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
              <UnreadBadge count={unreadCount} />
            </Pressable>
          </View>
        </View>

        <View style={styles.bottomSurface}>
          <ProfileHeaderCard
            user={user}
            isAdmin={isAdmin}
            isDriver={isDriver}
            displayPhoto={displayPhoto}
            onEditPhoto={handleEditPhoto}
            styles={styles}
            colors={colors}
          />

          {!isAdmin && (
            <View style={styles.modeToggleWrap}>
              <Pressable style={[styles.modeBtn, !isDriver && styles.modeBtnActive]} onPress={() => handleSwitchMode('passenger')}>
                <Ionicons name="person-outline" size={15} color={!isDriver ? Brand.colors.black.b1 : colors.textMuted} />
                <Text style={[styles.modeBtnText, !isDriver && styles.modeBtnTextActive]}>Pasajero</Text>
              </Pressable>
              <Pressable style={[styles.modeBtn, isDriver && styles.modeBtnActive]} onPress={() => handleSwitchMode('driver')}>
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

              <PaymentMethodsSection token={token} isDark={isDark} styles={styles} colors={colors} />

              <Pressable style={styles.shareButton} onPress={() => Share.share({ message: 'Jalemos - comparte viaje y ahorra en cada ruta.' })}>
                <Ionicons name="share-social-outline" size={16} color={Brand.colors.black.b1} />
                <Text style={styles.shareButtonText}>Compartir Jalemos</Text>
              </Pressable>
            </>
          )}

          {/* Driver-only sections */}
          {!isAdmin && isDriver && (
            <DriverSections
              user={user}
              vehicles={vehicles}
              vehiclesLoading={vehiclesLoading}
              deletingId={deletingId}
              onDeleteVehicle={handleDeleteVehicle}
              vehicleApplications={myVehicleApplications}
              onAddVehicle={() => router.push('/add-vehicle')}
              onOpenDocuments={() => router.push('/driver-documents')}
              onOpenVehicleApp={(id) => router.push({ pathname: '/vehicle-application-status', params: { id } })}
              styles={styles}
              colors={colors}
            />
          )}

          {/* QR section — visible to all non-admin users */}
          {!isAdmin && qrToken && (
            <QrSection
              qrToken={qrToken}
              showQr={showQr}
              onToggleQr={() => setShowQr((v) => !v)}
              sendingQr={sendingQr}
              qrCooldown={qrCooldown}
              onSendQr={handleSendQrEmail}
              styles={styles}
              colors={colors}
            />
          )}

          {/* Always visible: Preferencias + Soporte */}
          {preferencesSections.map((section) => (
            <View key={section.title} style={styles.sectionWrap}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <GlassCard style={styles.sectionCard}>
                {section.items.map((item, index) => (
                  <Pressable
                    key={item.label}
                    onPress={() => (item.route ? router.push(item.route as any) : undefined)}
                    style={[styles.sectionItem, index !== section.items.length - 1 && styles.sectionItemBorder]}
                  >
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
