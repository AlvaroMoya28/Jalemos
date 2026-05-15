import GlassCard from '@/components/glass-card';
import { Brand, Fonts, withElevation } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import { CommonActions } from '@react-navigation/native';
import { useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';

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

export default function ProfileScreen() {
  const navigation = useNavigation();

  const handleLogout = () => {
    navigation.getParent()?.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'index' }],
      })
    );
  };

  const vehicles = [
    { id: 'veh-1', name: 'Toyota Yaris', plate: 'CR-1234', color: 'Gris', primary: true },
    { id: 'veh-2', name: 'Nissan Kicks', plate: 'CR-7788', color: 'Blanco', primary: false },
  ];
  const [amount, setAmount] = useState(0);

  const openShare = async () => {
    await Share.share({
      message: 'Jalemos - comparte viaje y ahorra en cada ruta. Descárgala y jalemos juntos.',
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mi perfil</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <GlassCard style={styles.profileCard}>
          <View style={styles.profileTop}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>AS</Text>
            </View>
            <View style={styles.profileMain}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>Andres Solano</Text>
                <Ionicons name="checkmark-circle" size={16} color="#0e8d75" />
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

        <GlassCard style={styles.favButton}>
          <View style={styles.favIconWrap}>
            <Ionicons name="location-outline" size={16} color="#ecfff9" />
          </View>
          <View style={styles.favTextWrap}>
            <Text style={styles.favTitle}>Lugares favoritos</Text>
            <Text style={styles.favSub}>Casa, trabajo y más</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#758783" />
        </GlassCard>

        <Pressable style={styles.shareButton} onPress={openShare}>
          <Ionicons name="share-social-outline" size={16} color={Brand.colors.black.b1} />
          <Text style={styles.shareButtonText}>Compartir Jalemos</Text>
        </Pressable>

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
                      <Ionicons name="car-outline" size={16} color="#23413b" />
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

        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>Cuenta</Text>
          <GlassCard style={styles.sectionCard}>
            <Pressable style={styles.sectionItem}>
              <View style={styles.itemIconWrap}>
                <Ionicons name="card-outline" size={16} color="#23413b" />
              </View>
              <View style={styles.itemTextWrap}>
                <Text style={styles.itemLabel}>Métodos de pago</Text>
                <Text style={styles.itemDesc}>Tarjetas y SINPE Movil</Text>
              </View>
              <Ionicons name="chevron-forward" size={15} color="#758783" />
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

        {sections.map((section) => (
          <View key={section.title} style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <GlassCard style={styles.sectionCard}>
              {section.items.map((item, index) => (
                <Pressable key={item.label} style={[styles.sectionItem, index !== section.items.length - 1 && styles.sectionItemBorder]}>
                  <View style={styles.itemIconWrap}>
                    <Ionicons name={item.icon} size={16} color="#23413b" />
                  </View>
                  <View style={styles.itemTextWrap}>
                    <Text style={styles.itemLabel}>{item.label}</Text>
                    <Text style={styles.itemDesc}>{item.desc}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={15} color="#758783" />
                </Pressable>
              ))}
            </GlassCard>
          </View>
        ))}

        <Pressable style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={16} color="#c6443d" />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.colors.black.b3,
  },
  header: {
    backgroundColor: Brand.colors.green.dark,
    borderBottomLeftRadius: Brand.radius[24],
    borderBottomRightRadius: Brand.radius[24],
    paddingTop: 54,
    paddingHorizontal: Brand.grid.margin,
    paddingBottom: 36,
  },
  headerTitle: {
    color: Brand.colors.black.b1,
    fontSize: 24,
    fontFamily: Fonts.headingHeavy,
  },
  content: {
    paddingHorizontal: Brand.grid.margin,
    paddingBottom: 24,
    marginTop: 0,
  },
  profileCard: {
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
    color: Brand.colors.black.b10,
    fontFamily: Fonts.headingBold,
  },
  email: {
    color: Brand.colors.black.b7,
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
    color: Brand.colors.black.b10,
    fontFamily: Fonts.heading,
    fontSize: 12,
  },
  ratingSub: {
    color: Brand.colors.black.b7,
    fontSize: 12,
    fontFamily: Fonts.sans,
  },
  statsRow: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: Brand.colors.green.light,
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
    color: Brand.colors.black.b10,
    fontSize: 16,
  },
  statValueGreen: {
    fontFamily: Fonts.headingBold,
    color: Brand.colors.green.normal,
    fontSize: 16,
  },
  statLabel: {
    fontSize: 11,
    color: Brand.colors.black.b7,
    fontFamily: Fonts.sans,
    marginTop: 2,
  },
  favButton: {
    marginTop: 10,
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
    color: Brand.colors.black.b10,
    fontFamily: Fonts.headingBold,
    fontSize: 14,
  },
  favSub: {
    color: Brand.colors.black.b7,
    fontSize: 12,
    fontFamily: Fonts.sans,
  },
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
    borderColor: Brand.colors.green.light,
    backgroundColor: 'rgba(255, 255, 255, 0.62)',
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
  shareButton: {
    marginTop: 12,
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
  sectionWrap: {
    marginTop: 12,
  },
  sectionTitle: {
    marginBottom: 6,
    marginLeft: 2,
    fontSize: 11,
    color: Brand.colors.black.b7,
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
    color: Brand.colors.black.b10,
    fontSize: 14,
    fontFamily: Fonts.headingBold,
  },
  vehicleSectionSub: {
    color: Brand.colors.black.b7,
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
    borderBottomColor: 'rgba(186, 226, 221, 0.82)',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: 'rgba(186, 226, 221, 0.82)',
  },
  vehicleList: {
    gap: 8,
    padding: 12,
  },
  vehicleCard: {
    borderRadius: Brand.radius[12],
    borderWidth: 1,
    borderColor: Brand.colors.green.light,
    backgroundColor: 'rgba(255, 255, 255, 0.66)',
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
    borderColor: Brand.colors.green.light,
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
    color: Brand.colors.black.b10,
    fontFamily: Fonts.heading,
    fontSize: 14,
  },
  itemDesc: {
    color: Brand.colors.black.b7,
    fontSize: 12,
    fontFamily: Fonts.sans,
  },
  logoutBtn: {
    marginTop: 14,
    borderRadius: Brand.radius[12],
    borderWidth: 1,
    borderColor: Brand.colors.alerts.error,
    backgroundColor: '#fff0f1',
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