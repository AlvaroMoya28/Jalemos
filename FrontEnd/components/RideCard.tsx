// Card component used to display a single available ride in the search results list.
// Tapping it fires a press animation via AnimatedPressable.
// Text and border colors adapt automatically to the device light/dark mode setting.
// TODO: add an onPress handler to navigate to the ride detail / booking screen.

import AnimatedPressable from '@/components/animated-pressable';
import GlassCard from '@/components/glass-card';
import { Brand, Fonts, withElevation } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export interface Ride {
  from: string;
  to: string;
  date: string;
  time: string;
  price: number;
  seats: number;
  driver: string;
  rating: number;
  /** Two-letter avatar initials derived from the driver's name. */
  avatar: string;
}

interface RideCardProps {
  ride: Ride;
}

function makeStyles(c: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    card: {
      borderRadius: Brand.radius[16],
      padding: Brand.spacing[12],
      ...withElevation(100),
    },
    rowTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 10,
      gap: 12,
    },
    routeBlock: {
      flex: 1,
    },
    routeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    originDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: Brand.colors.green.normal,
    },
    routeConnector: {
      height: 10,
      borderLeftWidth: 2,
      borderLeftColor: c.border,
      marginLeft: 3,
      marginVertical: 3,
    },
    routeText: {
      fontSize: 14,
      color: c.textPrimary,
      fontFamily: Fonts.heading,
    },
    priceBlock: {
      alignItems: 'flex-end',
    },
    price: {
      fontSize: 19,
      fontFamily: Fonts.headingHeavy,
      color: Brand.colors.green.normal,
    },
    caption: {
      fontSize: 10,
      color: c.textMuted,
      fontFamily: Fonts.sans,
    },
    detailsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 10,
    },
    detailItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    detailText: {
      fontSize: 12,
      color: c.textSecondary,
      fontFamily: Fonts.sans,
    },
    driverRow: {
      borderTopWidth: 1,
      borderTopColor: c.border,
      paddingTop: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    avatar: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: Brand.colors.green.light,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontSize: 12,
      color: Brand.colors.green.darker,
      fontFamily: Fonts.headingBold,
    },
    driverName: {
      flex: 1,
      fontSize: 12,
      fontFamily: Fonts.heading,
      color: c.textPrimary,
    },
    ratingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
    },
    ratingText: {
      fontSize: 12,
      fontFamily: Fonts.heading,
      color: c.textPrimary,
    },
  });
}

export default function RideCard({ ride }: RideCardProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <AnimatedPressable pressedScale={0.992}>
      <GlassCard style={styles.card} intensity={34}>
        <View style={styles.rowTop}>
          <View style={styles.routeBlock}>
            <View style={styles.routeRow}>
              <View style={styles.originDot} />
              <Text style={styles.routeText}>{ride.from}</Text>
            </View>
            <View style={styles.routeConnector} />
            <View style={styles.routeRow}>
              <Ionicons name="location" size={11} color={Brand.colors.green.normal} />
              <Text style={styles.routeText}>{ride.to}</Text>
            </View>
          </View>

          <View style={styles.priceBlock}>
            <Text style={styles.price}>₡{ride.price.toLocaleString()}</Text>
            <Text style={styles.caption}>por persona</Text>
          </View>
        </View>

        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.detailText}>{ride.date} · {ride.time}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="people-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.detailText}>{ride.seats} lugares</Text>
          </View>
        </View>

        <View style={styles.driverRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{ride.avatar}</Text>
          </View>
          <Text style={styles.driverName}>{ride.driver}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color="#f7a900" />
            <Text style={styles.ratingText}>{ride.rating}</Text>
          </View>
        </View>
      </GlassCard>
    </AnimatedPressable>
  );
}
