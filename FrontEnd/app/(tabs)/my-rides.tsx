// My Rides screen — shows the user's personal trip history.
// Follows the same hero-banner + rounded bottom surface visual pattern
// as the Search and Offer screens for consistency.

import GlassCard from '@/components/glass-card';
import NotificationsModal from '@/components/NotificationsModal';
import { Brand, Fonts, withElevation } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type Status = 'completed' | 'upcoming' | 'cancelled';

interface Trip {
  from: string;
  to: string;
  date: string;
  time: string;
  price: number;
  seats: number;
  status: Status;
  counterpart: string;
  rating?: number;
}

const asPassenger: Trip[] = [
  { from: 'San Jose', to: 'Heredia', date: '12 Abr 2026', time: '5:30 PM', price: 1500, seats: 1, status: 'completed', counterpart: 'Carlos M.', rating: 5 },
  { from: 'Cartago', to: 'San Jose', date: '8 Abr 2026', time: '7:00 AM', price: 2000, seats: 1, status: 'completed', counterpart: 'Maria R.', rating: 4 },
  { from: 'Alajuela', to: 'Escazu', date: '25 Abr 2026', time: '8:15 AM', price: 1800, seats: 2, status: 'upcoming', counterpart: 'Jose L.' },
];

const asDriver: Trip[] = [
  { from: 'Heredia', to: 'San Pedro', date: '10 Abr 2026', time: '6:00 PM', price: 1200, seats: 3, status: 'completed', counterpart: '3 pasajeros', rating: 5 },
  { from: 'San Jose', to: 'Liberia', date: '1 Abr 2026', time: '9:00 AM', price: 6500, seats: 4, status: 'completed', counterpart: '4 pasajeros', rating: 5 },
  { from: 'Escazu', to: 'Jaco', date: '30 Abr 2026', time: '11:00 AM', price: 4500, seats: 2, status: 'upcoming', counterpart: '2 pasajeros' },
];

const HERO_HEIGHT = 200;

function statusStyle(status: Status) {
  if (status === 'completed') return { label: 'Completado', bg: Brand.colors.green.light, color: Brand.colors.green.dark };
  if (status === 'upcoming') return { label: 'Próximo', bg: Brand.colors.blue.light, color: Brand.colors.blue.dark };
  return { label: 'Cancelado', bg: '#fde6e5', color: Brand.colors.alerts.error };
}

function makeStyles(c: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.screenBg,
    },
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
    bottomSurface: {
      backgroundColor: c.bottomSurface,
      borderTopLeftRadius: Brand.radius[24],
      borderTopRightRadius: Brand.radius[24],
      marginTop: -4,
      paddingTop: 18,
      paddingBottom: 24,
    },
    statsRow: {
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: Brand.grid.margin,
      marginBottom: 14,
    },
    statCard: {
      flex: 1,
      borderRadius: Brand.radius[16],
      padding: 12,
      ...withElevation(100),
    },
    statLabel: {
      fontSize: 11,
      color: c.textMuted,
      fontFamily: Fonts.sans,
    },
    statValue: {
      marginTop: 2,
      fontSize: 22,
      fontFamily: Fonts.headingHeavy,
      color: c.textPrimary,
    },
    statValueGreen: {
      marginTop: 2,
      fontSize: 22,
      fontFamily: Fonts.headingHeavy,
      color: Brand.colors.green.normal,
    },
    segment: {
      flexDirection: 'row',
      backgroundColor: c.segmentBg,
      borderRadius: Brand.radius[12],
      padding: 4,
      marginHorizontal: Brand.grid.margin,
    },
    segmentBtn: {
      flex: 1,
      borderRadius: 10,
      paddingVertical: 8,
      alignItems: 'center',
    },
    segmentBtnActive: {
      backgroundColor: c.segmentActiveBg,
    },
    segmentText: {
      color: c.textSecondary,
      fontSize: 12,
      fontFamily: Fonts.heading,
    },
    segmentTextActive: {
      color: Brand.colors.green.normal,
    },
    filtersRow: {
      marginTop: 12,
      marginHorizontal: Brand.grid.margin,
      flexDirection: 'row',
      gap: 16,
      alignItems: 'center',
    },
    radioRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    radioOuter: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: Brand.colors.green.normal,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.radioOuterBg,
    },
    radioOuterActive: {
      backgroundColor: Brand.colors.green.light,
    },
    radioInner: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: Brand.colors.green.normal,
    },
    checkBox: {
      width: 28,
      height: 28,
      borderRadius: Brand.radius[4],
      borderWidth: 2,
      borderColor: Brand.colors.green.normal,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkBoxActive: {
      backgroundColor: Brand.colors.green.normal,
    },
    radioText: {
      fontSize: 12,
      color: c.textPrimary,
      fontFamily: Fonts.heading,
    },
    tripList: {
      marginTop: 12,
      paddingHorizontal: Brand.grid.margin,
      gap: 10,
    },
    tripCard: {
      borderRadius: Brand.radius[16],
      padding: 12,
      ...withElevation(100),
    },
    tripTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    routeWrap: {
      flex: 1,
    },
    routeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    originDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: Brand.colors.green.normal,
    },
    routeConnector: {
      height: 8,
      borderLeftWidth: 2,
      borderLeftColor: c.border,
      marginLeft: 3,
      marginVertical: 3,
    },
    routeText: {
      fontSize: 14,
      fontFamily: Fonts.heading,
      color: c.textPrimary,
    },
    priceWrap: {
      alignItems: 'flex-end',
    },
    priceText: {
      fontSize: 18,
      color: Brand.colors.green.normal,
      fontFamily: Fonts.headingHeavy,
    },
    badge: {
      marginTop: 4,
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    badgeText: {
      fontSize: 10,
      fontWeight: '700',
    },
    metaRow: {
      marginTop: 8,
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    metaText: {
      fontSize: 12,
      color: c.textSecondary,
      fontFamily: Fonts.sans,
    },
    tripBottom: {
      borderTopWidth: 1,
      borderTopColor: c.border,
      marginTop: 9,
      paddingTop: 8,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    tripCounterpart: {
      fontSize: 12,
      color: c.textPrimary,
      fontFamily: Fonts.heading,
    },
    ratingWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
    },
    ratingText: {
      color: c.textPrimary,
      fontSize: 12,
      fontFamily: Fonts.heading,
    },
  });
}

function TripItem({ trip, role, styles }: { trip: Trip; role: 'passenger' | 'driver'; styles: ReturnType<typeof makeStyles> }) {
  const badge = statusStyle(trip.status);
  return (
    <GlassCard style={styles.tripCard} intensity={34}>
      <View style={styles.tripTop}>
        <View style={styles.routeWrap}>
          <View style={styles.routeRow}>
            <View style={styles.originDot} />
            <Text style={styles.routeText}>{trip.from}</Text>
          </View>
          <View style={styles.routeConnector} />
          <View style={styles.routeRow}>
            <Ionicons name="location-outline" size={11} color={Brand.colors.green.normal} />
            <Text style={styles.routeText}>{trip.to}</Text>
          </View>
        </View>

        <View style={styles.priceWrap}>
          <Text style={styles.priceText}>{role === 'driver' ? '+' : ''}₡{trip.price.toLocaleString()}</Text>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
          </View>
        </View>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>{trip.date} · {trip.time}</Text>
        <Text style={styles.metaText}>{trip.seats} plazas</Text>
      </View>

      <View style={styles.tripBottom}>
        <Text style={styles.tripCounterpart}>
          {role === 'driver' ? 'Con ' : 'Conductor: '}{trip.counterpart}
        </Text>
        {trip.rating ? (
          <View style={styles.ratingWrap}>
            <Ionicons name="star" size={13} color="#f7a900" />
            <Text style={styles.ratingText}>{trip.rating}</Text>
          </View>
        ) : null}
      </View>
    </GlassCard>
  );
}

export default function MyRidesScreen() {
  const { isDark, colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation();
  useEffect(() => {
    navigation.setOptions({ title: 'Mis Viajes', icon: { sf: 'briefcase' } });
  }, [navigation]);

  const [notifOpen, setNotifOpen] = useState(false);
  const [tab, setTab] = useState<'passenger' | 'driver'>('passenger');
  const [onlyCompleted, setOnlyCompleted] = useState(false);

  const totalSpent = useMemo(
    () => asPassenger.filter((t) => t.status === 'completed').reduce((acc, t) => acc + t.price, 0),
    []
  );
  const totalEarned = useMemo(
    () => asDriver.filter((t) => t.status === 'completed').reduce((acc, t) => acc + t.price, 0),
    []
  );

  const sourceTrips = tab === 'passenger' ? asPassenger : asDriver;
  const trips = onlyCompleted ? sourceTrips.filter((t) => t.status === 'completed') : sourceTrips;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 26 }}>
        {/* Hero banner — same pattern as Search and Offer */}
        <View style={styles.heroWrap}>
          <Image
            source={isDark ? require('../../assets/images/hero-banner-dark.jpg') : require('../../assets/images/hero-banner.jpg')}
            style={styles.heroImage}
          />
          <View style={styles.heroOverlay} />
          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.heroMini}>Pura Vida</Text>
              <Text style={styles.heroTitle}>Mis viajes</Text>
            </View>
            <Pressable onPress={() => setNotifOpen(true)} style={styles.bellBtn}>
              <Ionicons name="notifications-outline" size={20} color="#ecfff9" />
              <View style={styles.bellDot} />
            </Pressable>
          </View>
        </View>

        {/* Rounded bottom surface */}
        <View style={styles.bottomSurface}>
          {/* Stats cards */}
          <View style={styles.statsRow}>
            <GlassCard style={styles.statCard} intensity={34}>
              <Text style={styles.statLabel}>Gastado</Text>
              <Text style={styles.statValue}>₡{totalSpent.toLocaleString()}</Text>
            </GlassCard>
            <GlassCard style={styles.statCard} intensity={34}>
              <Text style={styles.statLabel}>Ganado</Text>
              <Text style={styles.statValueGreen}>₡{totalEarned.toLocaleString()}</Text>
            </GlassCard>
          </View>

          {/* Passenger / driver toggle */}
          <View style={styles.segment}>
            <Pressable style={[styles.segmentBtn, tab === 'passenger' && styles.segmentBtnActive]} onPress={() => setTab('passenger')}>
              <Text style={[styles.segmentText, tab === 'passenger' && styles.segmentTextActive]}>Como pasajero</Text>
            </Pressable>
            <Pressable style={[styles.segmentBtn, tab === 'driver' && styles.segmentBtnActive]} onPress={() => setTab('driver')}>
              <Text style={[styles.segmentText, tab === 'driver' && styles.segmentTextActive]}>Como chofer</Text>
            </Pressable>
          </View>

          {/* Filters */}
          <View style={styles.filtersRow}>
            <Pressable style={styles.radioRow} onPress={() => setOnlyCompleted(false)}>
              <View style={[styles.radioOuter, !onlyCompleted && styles.radioOuterActive]}>
                {!onlyCompleted ? <View style={styles.radioInner} /> : null}
              </View>
              <Text style={styles.radioText}>Todos</Text>
            </Pressable>

            <Pressable style={styles.radioRow} onPress={() => setOnlyCompleted(true)}>
              <View style={[styles.checkBox, onlyCompleted && styles.checkBoxActive]}>
                {onlyCompleted ? <Ionicons name="checkmark" size={14} color={Brand.colors.black.b1} /> : null}
              </View>
              <Text style={styles.radioText}>Solo completados</Text>
            </Pressable>
          </View>

          {/* Trip list */}
          <View style={styles.tripList}>
            {trips.map((trip, idx) => (
              <TripItem key={`${trip.from}-${trip.to}-${idx}`} trip={trip} role={tab} styles={styles} />
            ))}
          </View>
        </View>
      </ScrollView>

      <NotificationsModal visible={notifOpen} onClose={() => setNotifOpen(false)} />
    </View>
  );
}
