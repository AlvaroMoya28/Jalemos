// Tappable card summarising an admin-managed user (avatar, name, role/status
// badges and headline stats). Tapping opens the action sheet.

import { Ionicons } from '@expo/vector-icons';
import { Image, Text, View } from 'react-native';

import AnimatedPressable from '@/components/shared/animated-pressable';
import GlassCard from '@/components/shared/glass-card';
import { Brand } from '@/constants/theme';
import { AdminUser } from '@/contexts/admin-users';
import { useAppTheme } from '@/hooks/use-app-theme';
import { makeStyles } from '@/styles/tabs/admin-users.styles';

import { RoleBadge, Stars, StatusBadge } from './user-badges';

export default function UserCard({ user, onPress, styles, colors }: {
  user: AdminUser;
  onPress: () => void;
  styles: ReturnType<typeof makeStyles>;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  return (
    <AnimatedPressable pressedScale={0.99} onPress={onPress}>
      <GlassCard style={styles.card} intensity={32}>
        <View style={styles.cardTop}>
          {user.profilePhotoUrl ? (
            <Image
              source={{ uri: user.profilePhotoUrl }}
              style={[styles.avatar, { backgroundColor: Brand.colors.green.light + '44' }]}
            />
          ) : (
            <View style={[styles.avatar, { backgroundColor: Brand.colors.green.light + '44' }]}>
              <Text style={styles.avatarText}>{user.avatar}</Text>
            </View>
          )}
          <View style={styles.nameBlock}>
            <Text style={styles.name}>{user.firstName} {user.lastName}</Text>
            <Text style={styles.username}>@{user.username}</Text>
            <View style={styles.badgeRow}>
              <RoleBadge role={user.role} />
              <StatusBadge status={user.displayStatus} />
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </View>

        <View style={styles.divider} />

        <View style={styles.statsRow}>
          <Stars value={user.meanRating} />
          <Text style={styles.statText}>{user.meanRating.toFixed(1)}</Text>
          <View style={styles.statItem}>
            <Ionicons name="car-outline" size={13} color={colors.textMuted} />
            <Text style={styles.statText}>{user.totalTrips} viajes</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="navigate-outline" size={13} color={colors.textMuted} />
            <Text style={styles.statText}>{user.kms.toFixed(0)} km</Text>
          </View>
        </View>
      </GlassCard>
    </AnimatedPressable>
  );
}
