// Profile screen — displays the user's avatar, stats, vehicles, payment methods,
// app settings, and a logout action.
// Follows the same hero-banner + rounded bottom surface visual pattern
// as the Search, Offer and My Rides screens for consistency.

import GlassCard from '@/components/glass-card';
import NotificationsModal from '@/components/NotificationsModal';
import { Brand, Fonts, withElevation } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import { CommonActions } from '@react-navigation/native';
import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';

type SectionItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  desc: string;
};

type Section = {
  title: string;
  items: SectionItem[];
};

const sections: Section[] = [
  {
    title: 'Preferencias',
    items: [
      { icon: 'settings-outline', label: 'Configuración', desc: 'Idioma y notificaciones' },
      { icon: 'shield-checkmark-outline', label: 'Privacidad y seguridad', desc: 'Datos y permisos' },
    ],
  },
  {
    title: 'Soporte',
    items: [
      { icon: 'help-circle-outline', label: 'Ayuda', desc: 'Preguntas frecuentes' },
      { icon: 'information-circle-outline', label: 'Acerca de Jalemos', desc: 'Versión 1.0.0' },
    ],
  },
];

const HERO_HEIGHT = 200;

function makeStyles(c: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.screenBg,
    },
    // ── Hero ──────────────────────────────────────────────────────────────────
    heroWrap: {
      height: HERO_HEIGHT,
      position: 'relative',
    },
    heroImage: {
      width: '100%',
      height: HERO_HEIGHT,
    },
    heroOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(10, 63, 57, 0.38)',
    },
    heroHeader: {
      position: 'absolute',
      top: 58,
      left: Brand.grid.margin,
      right: Brand.grid.margin,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    heroMini: {
      color: Brand.colors.green.light,
      fontSize: 13,
      fontFamily: Fonts.heading,
    },
    heroTitle: {
      color: Brand.colors.black.b1,
      fontSize: 32,
      fontFamily: Fonts.headingHeavy,
    },
    bellBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    bellDot: {
      position: 'absolute',
      top: 10,
      right: 10,
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: '#ffb13e',
    },
    // ── Bottom surface ────────────────────────────────────────────────────────
    bottomSurface: {
      backgroundColor: c.bottomSurface,
      borderTopLeftRadius: Brand.radius[24],
      borderTopRightRadius: Brand.radius[24],
      marginTop: -4,
      paddingTop: 18,
      paddingBottom: 24,
    },
    // ── Profile card ──────────────────────────────────────────────────────────
    profileCard: {
      marginHorizontal: Brand.grid.margin,
      borderRadius: Brand.radius[16],
      padding: 14,
      ...withElevation(200),
    },
    profileTop: {
      flexDirection: 'row',
      gap: 10,
    },
    avatar: {
      width: 62,
      height: 62,
      borderRadius: 31,
      backgroundColor: Brand.colors.green.normal,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      color: Brand.colors.black.b1,
      fontSize: 23,
      fontFamily: Fonts.headingHeavy,
    },
    profileMain: {
      flex: 1,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    name: {
      fontSize: 17,
      color: c.textPrimary,
      fontFamily: Fonts.headingBold,
    },
    email: {
      color: c.textMuted,
      fontSize: 12,
      fontFamily: Fonts.sans,
      marginTop: 1,
    },
    ratingRow: {
      marginTop: 3,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    rating: {
      color: c.textPrimary,
      fontFamily: Fonts.heading,
      fontSize: 12,
    },
    ratingSub: {
      color: c.textMuted,
      fontSize: 12,
      fontFamily: Fonts.sans,
    },
    statsRow: {
      marginTop: 10,
      borderTopWidth: 1,
      borderTopColor: c.borderSubtle,
      paddingTop: 10,
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    statItem: {
      alignItems: 'center',
      flex: 1,
    },
    statValue: {
      fontFamily: Fonts.headingBold,
      color: c.textPrimary,
      fontSize: 16,
    },
    statValueGreen: {
      fontFamily: Fonts.headingBold,
      color: Brand.colors.green.normal,
      fontSize: 16,
    },
    statLabel: {
      fontSize: 11,
      color: c.textMuted,
      fontFamily: Fonts.sans,
      marginTop: 2,
    },
    // ── Action buttons ────────────────────────────────────────────────────────
    favButton: {
      marginTop: 10,
      marginHorizontal: Brand.grid.margin,
      borderRadius: Brand.radius[16],
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      ...withElevation(100),
    },
    favIconWrap: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: Brand.colors.green.normal,
      alignItems: 'center',
      justifyContent: 'center',
    },
    favTextWrap: {
      flex: 1,
    },
    favTitle: {
      color: c.textPrimary,
      fontFamily: Fonts.headingBold,
      fontSize: 14,
    },
    favSub: {
      color: c.textMuted,
      fontSize: 12,
      fontFamily: Fonts.sans,
    },
    shareButton: {
      marginTop: 10,
      marginHorizontal: Brand.grid.margin,
      borderRadius: 999,
      backgroundColor: Brand.colors.green.normal,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
      paddingVertical: 12,
    },
    shareButtonText: {
      color: Brand.colors.black.b1,
      fontSize: 14,
      fontFamily: Fonts.headingBold,
    },
    // ── Section cards ─────────────────────────────────────────────────────────
    sectionWrap: {
      marginTop: 12,
      marginHorizontal: Brand.grid.margin,
    },
    sectionTitle: {
      marginBottom: 6,
      marginLeft: 2,
      fontSize: 11,
      color: c.textMuted,
      textTransform: 'uppercase',
      fontFamily: Fonts.heading,
    },
    sectionCard: {
      borderRadius: Brand.radius[16],
      overflow: 'hidden',
      ...withElevation(100),
    },
    vehicleSectionHeader: {
      paddingHorizontal: 12,
      paddingTop: 12,
      paddingBottom: 8,
    },
    vehicleSectionTitle: {
      color: c.textPrimary,
      fontSize: 14,
      fontFamily: Fonts.headingBold,
    },
    vehicleSectionSub: {
      color: c.textMuted,
      fontSize: 11,
      fontFamily: Fonts.sans,
      marginTop: 2,
    },
    sectionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 12,
      paddingVertical: 11,
    },
    sectionItemBorder: {
      borderBottomWidth: 1,
      borderBottomColor: c.borderSubtle,
    },
    sectionDivider: {
      height: 1,
      backgroundColor: c.borderSubtle,
    },
    vehicleList: {
      gap: 8,
      padding: 12,
    },
    vehicleCard: {
      borderRadius: Brand.radius[12],
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.vehicleCardBg,
      padding: 10,
    },
    vehicleRowTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    vehicleTextWrap: {
      flex: 1,
    },
    vehicleNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap',
    },
    primaryBadge: {
      fontSize: 10,
      color: Brand.colors.green.dark,
      fontFamily: Fonts.headingBold,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    itemIconWrap: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: Brand.colors.green.light,
      alignItems: 'center',
      justifyContent: 'center',
    },
    itemTextWrap: {
      flex: 1,
    },
    itemLabel: {
      color: c.textPrimary,
      fontFamily: Fonts.heading,
      fontSize: 14,
    },
    itemDesc: {
      color: c.textMuted,
      fontSize: 12,
      fontFamily: Fonts.sans,
    },
    // ── Wallet ────────────────────────────────────────────────────────────────
    walletWrapInPayment: {
      marginVertical: 10,
      marginHorizontal: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    walletCard: {
      flex: 1,
      borderRadius: Brand.radius[16],
      backgroundColor: Brand.colors.green.dark,
      padding: 14,
      minHeight: 120,
      justifyContent: 'space-between',
      ...withElevation(400),
    },
    walletBrand: {
      alignSelf: 'flex-end',
      color: Brand.colors.black.b1,
      fontSize: 10,
      fontFamily: Fonts.sans,
    },
    walletNumber: {
      color: Brand.colors.black.b1,
      letterSpacing: 1,
      fontSize: 12,
      fontFamily: Fonts.sans,
    },
    walletDate: {
      alignSelf: 'flex-end',
      color: Brand.colors.black.b1,
      fontSize: 12,
      fontFamily: Fonts.sans,
    },
    walletCounter: {
      width: 116,
      borderRadius: Brand.radius[16],
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.walletCounterBg,
      padding: 10,
      justifyContent: 'center',
      alignItems: 'center',
      ...withElevation(100),
    },
    walletAmount: {
      color: Brand.colors.green.normal,
      fontSize: 28,
      fontFamily: Fonts.headingHeavy,
      marginBottom: 8,
    },
    counterButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    counterCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: Brand.colors.green.normal,
      alignItems: 'center',
      justifyContent: 'center',
    },
    // ── Logout ────────────────────────────────────────────────────────────────
    logoutBtn: {
      marginTop: 14,
      marginHorizontal: Brand.grid.margin,
      borderRadius: Brand.radius[12],
      borderWidth: 1,
      borderColor: Brand.colors.alerts.error,
      backgroundColor: c.logoutBg,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      flexDirection: 'row',
      paddingVertical: 12,
    },
    logoutText: {
      color: Brand.colors.alerts.error,
      fontFamily: Fonts.headingBold,
      fontSize: 14,
    },
  });
}

export default function ProfileScreen() {
  const { isDark, colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation();
  useEffect(() => {
    navigation.setOptions({ title: 'Perfil', icon: { sf: 'person' } });
  }, [navigation]);

  const [notifOpen, setNotifOpen] = useState(false);
  const [amount, setAmount] = useState(0);

  const vehicles = [
    { id: 'veh-1', name: 'Toyota Yaris', plate: 'CR-1234', color: 'Gris', primary: true },
    { id: 'veh-2', name: 'Nissan Kicks', plate: 'CR-7788', color: 'Blanco', primary: false },
  ];

  const handleLogout = () => {
    navigation.getParent()?.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: 'index' }] })
    );
  };

  const openShare = async () => {
    await Share.share({
      message: 'Jalemos - comparte viaje y ahorra en cada ruta. Descárgala y jalemos juntos.',
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>

        {/* Hero banner — same pattern as all other tabs */}
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

        {/* Rounded bottom surface */}
        <View style={styles.bottomSurface}>

          {/* Profile card */}
          <GlassCard style={styles.profileCard}>
            <View style={styles.profileTop}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>AS</Text>
              </View>
              <View style={styles.profileMain}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>Andres Solano</Text>
                  <Ionicons name="checkmark-circle" size={16} color={Brand.colors.green.dark} />
                </View>
                <Text style={styles.email}>andres@jalemos.cr</Text>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={13} color="#f7a900" />
                  <Text style={styles.rating}>4.9</Text>
                  <Text style={styles.ratingSub}>· 38 viajes</Text>
                </View>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>38</Text>
                <Text style={styles.statLabel}>Viajes</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>2.4k km</Text>
                <Text style={styles.statLabel}>Recorridos</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValueGreen}>₡84k</Text>
                <Text style={styles.statLabel}>Ahorrado</Text>
              </View>
            </View>
          </GlassCard>

          {/* Favorite places */}
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

          {/* Share */}
          <Pressable style={styles.shareButton} onPress={openShare}>
            <Ionicons name="share-social-outline" size={16} color={Brand.colors.black.b1} />
            <Text style={styles.shareButtonText}>Compartir Jalemos</Text>
          </Pressable>

          {/* Vehicles */}
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>Vehiculos</Text>
            <GlassCard style={styles.sectionCard}>
              <View style={styles.vehicleSectionHeader}>
                <Text style={styles.vehicleSectionTitle}>Mis vehículos</Text>
                <Text style={styles.vehicleSectionSub}>Selecciona cuál usar en Ofrecer viaje</Text>
              </View>
              <View style={styles.vehicleList}>
                {vehicles.map((vehicle) => (
                  <View key={vehicle.id} style={styles.vehicleCard}>
                    <View style={styles.vehicleRowTop}>
                      <View style={styles.itemIconWrap}>
                        <Ionicons name="car-outline" size={16} color={Brand.colors.green.darkActive} />
                      </View>
                      <View style={styles.vehicleTextWrap}>
                        <View style={styles.vehicleNameRow}>
                          <Text style={styles.itemLabel}>{vehicle.name}</Text>
                          {vehicle.primary ? <Text style={styles.primaryBadge}>Principal</Text> : null}
                        </View>
                        <Text style={styles.itemDesc}>{vehicle.plate} · {vehicle.color}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </GlassCard>
          </View>

          {/* Payment methods */}
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
                    <Pressable style={styles.counterCircle} onPress={() => setAmount((v) => Math.max(0, v - 500))}>
                      <Ionicons name="remove" size={18} color={Brand.colors.black.b1} />
                    </Pressable>
                    <Pressable style={styles.counterCircle} onPress={() => setAmount((v) => v + 500)}>
                      <Ionicons name="add" size={18} color={Brand.colors.black.b1} />
                    </Pressable>
                  </View>
                </View>
              </View>
            </GlassCard>
          </View>

          {/* Settings sections */}
          {sections.map((section) => (
            <View key={section.title} style={styles.sectionWrap}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <GlassCard style={styles.sectionCard}>
                {section.items.map((item, index) => (
                  <Pressable
                    key={item.label}
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

          {/* Logout */}
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
