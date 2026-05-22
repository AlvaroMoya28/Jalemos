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
import { useAuth } from '@/contexts/auth';
import { useUserMode } from '@/contexts/user-mode';
import { Brand, Fonts, withElevation } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Ionicons } from '@expo/vector-icons';
import { router, useNavigation } from 'expo-router';
import { CommonActions } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useMemo, useState } from 'react';
import { ActionSheetIOS, Alert, Image, Platform, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';

const preferencesSections = [
  {
    title: 'Preferencias',
    items: [
      { icon: 'settings-outline' as const, label: 'Configuración', desc: 'Idioma y notificaciones' },
      { icon: 'shield-checkmark-outline' as const, label: 'Privacidad y seguridad', desc: 'Datos y permisos' },
    ],
  },
  {
    title: 'Soporte',
    items: [
      { icon: 'help-circle-outline' as const, label: 'Ayuda', desc: 'Preguntas frecuentes' },
      { icon: 'information-circle-outline' as const, label: 'Acerca de Jalemos', desc: 'Versión 1.0.0' },
    ],
  },
];

const HERO_HEIGHT = 200;

function makeStyles(c: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.screenBg },
    heroWrap: { height: HERO_HEIGHT, position: 'relative' },
    heroImage: { width: '100%', height: HERO_HEIGHT },
    heroOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(10, 63, 57, 0.38)' },
    heroHeader: {
      position: 'absolute', top: 58,
      left: Brand.grid.margin, right: Brand.grid.margin,
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    heroMini: { color: Brand.colors.green.light, fontSize: 13, fontFamily: Fonts.heading },
    heroTitle: { color: Brand.colors.black.b1, fontSize: 32, fontFamily: Fonts.headingHeavy },
    bellBtn: {
      width: 40, height: 40, borderRadius: 20,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    },
    bellDot: {
      position: 'absolute', top: 10, right: 10,
      width: 7, height: 7, borderRadius: 4, backgroundColor: '#ffb13e',
    },
    bottomSurface: {
      backgroundColor: c.bottomSurface,
      borderTopLeftRadius: Brand.radius[24],
      borderTopRightRadius: Brand.radius[24],
      marginTop: -4, paddingTop: 18, paddingBottom: 24,
    },
    profileCard: {
      marginHorizontal: Brand.grid.margin,
      borderRadius: Brand.radius[16],
      padding: 14,
      ...withElevation(200),
    },
    profileTop: { flexDirection: 'row', gap: 10 },
    avatar: {
      width: 62, height: 62, borderRadius: 31,
      backgroundColor: Brand.colors.green.normal,
      alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    },
    avatarText: { color: Brand.colors.black.b1, fontSize: 23, fontFamily: Fonts.headingHeavy },
    avatarPhoto: { width: 62, height: 62, borderRadius: 31 },
    // Edit badge overlaid on the avatar
    avatarEditBadge: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', paddingVertical: 3,
    },
    profileMain: { flex: 1 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    name: { fontSize: 17, color: c.textPrimary, fontFamily: Fonts.headingBold },
    email: { color: c.textMuted, fontSize: 12, fontFamily: Fonts.sans, marginTop: 1 },
    ratingRow: { marginTop: 3, flexDirection: 'row', alignItems: 'center', gap: 4 },
    rating: { color: c.textPrimary, fontFamily: Fonts.heading, fontSize: 12 },
    ratingSub: { color: c.textMuted, fontSize: 12, fontFamily: Fonts.sans },
    statsRow: {
      marginTop: 10, borderTopWidth: 1, borderTopColor: c.borderSubtle,
      paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between',
    },
    statItem: { alignItems: 'center', flex: 1 },
    statValue: { fontFamily: Fonts.headingBold, color: c.textPrimary, fontSize: 16 },
    statValueGreen: { fontFamily: Fonts.headingBold, color: Brand.colors.green.normal, fontSize: 16 },
    statLabel: { fontSize: 11, color: c.textMuted, fontFamily: Fonts.sans, marginTop: 2 },
    // ── Mode toggle ───────────────────────────────────────────────────────────
    modeToggleWrap: {
      marginHorizontal: Brand.grid.margin,
      marginTop: 10,
      flexDirection: 'row',
      backgroundColor: c.inputBg,
      borderRadius: 999,
      padding: 4,
      borderWidth: 1,
      borderColor: c.border,
    },
    modeBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center',
      justifyContent: 'center', gap: 6,
      paddingVertical: 8, borderRadius: 999,
    },
    modeBtnActive: { backgroundColor: Brand.colors.green.normal },
    modeBtnText: { fontSize: 13, fontFamily: Fonts.headingBold, color: c.textMuted },
    modeBtnTextActive: { color: Brand.colors.black.b1 },
    // ── Action buttons ────────────────────────────────────────────────────────
    favButton: {
      marginTop: 10, marginHorizontal: Brand.grid.margin,
      borderRadius: Brand.radius[16], padding: 12,
      flexDirection: 'row', alignItems: 'center', gap: 10,
      ...withElevation(100),
    },
    favIconWrap: {
      width: 38, height: 38, borderRadius: 12,
      backgroundColor: Brand.colors.green.normal,
      alignItems: 'center', justifyContent: 'center',
    },
    favTextWrap: { flex: 1 },
    favTitle: { color: c.textPrimary, fontFamily: Fonts.headingBold, fontSize: 14 },
    favSub: { color: c.textMuted, fontSize: 12, fontFamily: Fonts.sans },
    shareButton: {
      marginTop: 10, marginHorizontal: Brand.grid.margin,
      borderRadius: 999, backgroundColor: Brand.colors.green.normal,
      alignItems: 'center', justifyContent: 'center',
      flexDirection: 'row', gap: 8, paddingVertical: 12,
    },
    shareButtonText: { color: Brand.colors.black.b1, fontSize: 14, fontFamily: Fonts.headingBold },
    // ── Section cards ─────────────────────────────────────────────────────────
    sectionWrap: { marginTop: 12, marginHorizontal: Brand.grid.margin },
    sectionTitle: {
      marginBottom: 6, marginLeft: 2, fontSize: 11,
      color: c.textMuted, textTransform: 'uppercase', fontFamily: Fonts.heading,
    },
    sectionCard: { borderRadius: Brand.radius[16], overflow: 'hidden', ...withElevation(100) },
    vehicleSectionHeader: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 8 },
    vehicleSectionTitle: { color: c.textPrimary, fontSize: 14, fontFamily: Fonts.headingBold },
    vehicleSectionSub: { color: c.textMuted, fontSize: 11, fontFamily: Fonts.sans, marginTop: 2 },
    sectionItem: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      paddingHorizontal: 12, paddingVertical: 11,
    },
    sectionItemBorder: { borderBottomWidth: 1, borderBottomColor: c.borderSubtle },
    sectionDivider: { height: 1, backgroundColor: c.borderSubtle },
    vehicleList: { gap: 8, padding: 12 },
    vehicleCard: {
      borderRadius: Brand.radius[12], borderWidth: 1,
      borderColor: c.border, backgroundColor: c.vehicleCardBg, padding: 10,
    },
    vehicleRowTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    vehicleTextWrap: { flex: 1 },
    vehicleNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    primaryBadge: {
      fontSize: 10, color: Brand.colors.green.dark, fontFamily: Fonts.headingBold,
      borderRadius: 999, borderWidth: 1, borderColor: c.border,
      paddingHorizontal: 8, paddingVertical: 2,
    },
    itemIconWrap: {
      width: 34, height: 34, borderRadius: 10,
      backgroundColor: Brand.colors.green.light,
      alignItems: 'center', justifyContent: 'center',
    },
    itemTextWrap: { flex: 1 },
    itemLabel: { color: c.textPrimary, fontFamily: Fonts.heading, fontSize: 14 },
    itemDesc: { color: c.textMuted, fontSize: 12, fontFamily: Fonts.sans },
    walletWrapInPayment: {
      marginVertical: 10, marginHorizontal: 12,
      flexDirection: 'row', justifyContent: 'space-between', gap: 12,
    },
    walletCard: {
      flex: 1, borderRadius: Brand.radius[16],
      backgroundColor: Brand.colors.green.dark,
      padding: 14, minHeight: 120, justifyContent: 'space-between',
      ...withElevation(400),
    },
    walletBrand: { alignSelf: 'flex-end', color: Brand.colors.black.b1, fontSize: 10, fontFamily: Fonts.sans },
    walletNumber: { color: Brand.colors.black.b1, letterSpacing: 1, fontSize: 12, fontFamily: Fonts.sans },
    walletDate: { alignSelf: 'flex-end', color: Brand.colors.black.b1, fontSize: 12, fontFamily: Fonts.sans },
    walletCounter: {
      width: 116, borderRadius: Brand.radius[16], borderWidth: 1,
      borderColor: c.border, backgroundColor: c.walletCounterBg,
      padding: 10, justifyContent: 'center', alignItems: 'center',
      ...withElevation(100),
    },
    walletAmount: { color: Brand.colors.green.normal, fontSize: 28, fontFamily: Fonts.headingHeavy, marginBottom: 8 },
    counterButtons: { flexDirection: 'row', gap: 12 },
    counterCircle: {
      width: 32, height: 32, borderRadius: 16,
      backgroundColor: Brand.colors.green.normal,
      alignItems: 'center', justifyContent: 'center',
    },
    logoutBtn: {
      marginTop: 14, marginHorizontal: Brand.grid.margin,
      borderRadius: Brand.radius[12], borderWidth: 1,
      borderColor: Brand.colors.alerts.error, backgroundColor: c.logoutBg,
      alignItems: 'center', justifyContent: 'center',
      gap: 6, flexDirection: 'row', paddingVertical: 12,
    },
    logoutText: { color: Brand.colors.alerts.error, fontFamily: Fonts.headingBold, fontSize: 14 },
  });
}

export default function ProfileScreen() {
  const { isDark, colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const { mode, isDriverRegistered, profilePhoto, setMode, setProfilePhoto } = useUserMode();
  const isDriver = mode === 'driver';

  useEffect(() => {
    navigation.setOptions({ title: 'Perfil', icon: { sf: 'person' } });
  }, [navigation]);

  const [notifOpen, setNotifOpen] = useState(false);
  const [amount, setAmount] = useState(0);

  const vehicles = [
    { id: 'veh-1', name: 'Toyota Yaris', plate: 'CR-1234', color: 'Gris', primary: true },
    { id: 'veh-2', name: 'Nissan Kicks', plate: 'CR-7788', color: 'Blanco', primary: false },
  ];

  /** Opens ActionSheet / Alert so the user can retake or pick a new profile photo. */
  const handleEditPhoto = () => {
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

  const handleLogout = () => {
    logout();
    navigation.getParent()?.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: 'index' }] })
    );
  };

  const handleSwitchMode = (target: 'passenger' | 'driver') => {
    if (target === mode) return;
    if (target === 'driver') {
      if (!isDriverRegistered) {
        router.push('/driver-registration');
      } else {
        setMode('driver');
        // Defer navigation so the tab layout finishes updating before the route changes
        setTimeout(() => router.replace('/(tabs)/offer'), 0);
      }
    } else {
      setMode('passenger');
      setTimeout(() => router.replace('/(tabs)/search'), 0);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
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
              {/* Avatar — tappable to edit; shows photo when set, initials otherwise */}
              <Pressable style={styles.avatar} onPress={handleEditPhoto}>
                {profilePhoto
                  ? <Image source={{ uri: profilePhoto }} style={styles.avatarPhoto} />
                  : <Text style={styles.avatarText}>{user?.avatar ?? '?'}</Text>}
                <View style={styles.avatarEditBadge}>
                  <Ionicons name="camera-outline" size={12} color="#fff" />
                </View>
              </Pressable>
              <View style={styles.profileMain}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{user ? `${user.firstName} ${user.lastName}` : '—'}</Text>
                  <Ionicons name="checkmark-circle" size={16} color={Brand.colors.green.dark} />
                  {isDriver && (
                    <Ionicons name="car" size={16} color={Brand.colors.green.normal} />
                  )}
                </View>
                <Text style={styles.email}>{user?.email ?? ''}</Text>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={13} color="#f7a900" />
                  <Text style={styles.rating}>{user?.rating?.toFixed(1) ?? '—'}</Text>
                  <Text style={styles.ratingSub}>· {isDriver ? `${user?.tripsCount ?? 0} viajes ofrecidos` : `${user?.tripsCount ?? 0} viajes`}</Text>
                </View>
              </View>
            </View>
            <View style={styles.statsRow}>
              {isDriver ? (
                <>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{user?.tripsCount ?? 0}</Text>
                    <Text style={styles.statLabel}>Ofrecidos</Text>
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

          {/* Mode toggle */}
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

          {/* Passenger-only sections */}
          {!isDriver && (
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
          {isDriver && (
            <>
              <View style={styles.sectionWrap}>
                <Text style={styles.sectionTitle}>Mis vehículos</Text>
                <GlassCard style={styles.sectionCard}>
                  <View style={styles.vehicleSectionHeader}>
                    <Text style={styles.vehicleSectionTitle}>Vehículos registrados</Text>
                    <Text style={styles.vehicleSectionSub}>Selecciona cuál usar al ofrecer</Text>
                  </View>
                  <View style={styles.vehicleList}>
                    {vehicles.map(v => (
                      <View key={v.id} style={styles.vehicleCard}>
                        <View style={styles.vehicleRowTop}>
                          <View style={styles.itemIconWrap}>
                            <Ionicons name="car-outline" size={16} color={Brand.colors.green.darkActive} />
                          </View>
                          <View style={styles.vehicleTextWrap}>
                            <View style={styles.vehicleNameRow}>
                              <Text style={styles.itemLabel}>{v.name}</Text>
                              {v.primary && <Text style={styles.primaryBadge}>Principal</Text>}
                            </View>
                            <Text style={styles.itemDesc}>{v.plate} · {v.color}</Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                </GlassCard>
              </View>

              <View style={styles.sectionWrap}>
                <Text style={styles.sectionTitle}>Documentos</Text>
                <GlassCard style={styles.sectionCard}>
                  <Pressable style={[styles.sectionItem, styles.sectionItemBorder]}>
                    <View style={styles.itemIconWrap}>
                      <Ionicons name="id-card-outline" size={16} color={Brand.colors.green.darkActive} />
                    </View>
                    <View style={styles.itemTextWrap}>
                      <Text style={styles.itemLabel}>Licencia de conducir</Text>
                      <Text style={styles.itemDesc}>Vence 03/27</Text>
                    </View>
                    <Ionicons name="checkmark-circle" size={16} color={Brand.colors.green.normal} />
                  </Pressable>
                  <Pressable style={styles.sectionItem}>
                    <View style={styles.itemIconWrap}>
                      <Ionicons name="checkmark-circle-outline" size={16} color={Brand.colors.green.darkActive} />
                    </View>
                    <View style={styles.itemTextWrap}>
                      <Text style={styles.itemLabel}>Revisión técnica Dekra</Text>
                      <Text style={styles.itemDesc}>Vence 09/25</Text>
                    </View>
                    <Ionicons name="checkmark-circle" size={16} color={Brand.colors.green.normal} />
                  </Pressable>
                </GlassCard>
              </View>
            </>
          )}

          {/* Always visible: Preferencias + Soporte */}
          {preferencesSections.map(section => (
            <View key={section.title} style={styles.sectionWrap}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <GlassCard style={styles.sectionCard}>
                {section.items.map((item, index) => (
                  <Pressable
                    key={item.label}
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
