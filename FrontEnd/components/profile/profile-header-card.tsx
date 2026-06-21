// Profile identity card: avatar (tap to edit), name/role, rating and the stats row.
// Stats adapt to admin / driver / passenger. Presentational.

import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, Text, View } from 'react-native';

import GlassCard from '@/components/shared/glass-card';
import type { User } from '@/contexts/auth';
import { Brand } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { makeStyles } from '../../styles/tabs/profile.styles';

type ProfileStyles = ReturnType<typeof makeStyles>;
type AppColors = ReturnType<typeof useAppTheme>['colors'];

export default function ProfileHeaderCard({
  user, isAdmin, isDriver, displayPhoto, onEditPhoto, styles,
}: {
  user: User | null;
  isAdmin: boolean;
  isDriver: boolean;
  displayPhoto: string | null;
  onEditPhoto: () => void;
  styles: ProfileStyles;
  colors: AppColors;
}) {
  return (
    <GlassCard style={styles.profileCard}>
      <View style={styles.profileTop}>
        <Pressable style={styles.avatar} onPress={onEditPhoto}>
          {displayPhoto
            ? <Image source={{ uri: displayPhoto }} style={styles.avatarPhoto} />
            : <Text style={styles.avatarText}>{user?.avatar ?? '?'}</Text>}
          <View style={styles.avatarEditBadge}>
            <Ionicons name={user?.profilePhotoLocked && user.role === 'passenger+driver' ? 'lock-closed-outline' : 'camera-outline'} size={12} color="#fff" />
          </View>
        </Pressable>
        <View style={styles.profileMain}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{user ? `${user.firstName} ${user.lastName}` : '—'}</Text>
            <Ionicons name="checkmark-circle" size={16} color={Brand.colors.green.dark} />
            {isDriver && <Ionicons name="car" size={16} color={Brand.colors.green.normal} />}
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
            <View style={styles.statItem}><Text style={styles.statValueGreen}>Admin</Text><Text style={styles.statLabel}>Rol</Text></View>
            <View style={styles.statItem}><Text style={styles.statValue}>{user?.memberSince ?? '—'}</Text><Text style={styles.statLabel}>Miembro desde</Text></View>
          </>
        ) : isDriver ? (
          <>
            <View style={styles.statItem}><Text style={styles.statValue}>{user?.driverTripsCount ?? 0}</Text><Text style={styles.statLabel}>Ofrecidos</Text></View>
            <View style={styles.statItem}><Text style={styles.statValue}>{user?.tripsCount ?? 0}</Text><Text style={styles.statLabel}>Tomados</Text></View>
            <View style={styles.statItem}><Text style={styles.statValueGreen}>{user?.rating?.toFixed(1) ?? '—'}</Text><Text style={styles.statLabel}>Calificación</Text></View>
          </>
        ) : (
          <>
            <View style={styles.statItem}><Text style={styles.statValue}>{user?.tripsCount ?? 0}</Text><Text style={styles.statLabel}>Viajes</Text></View>
            <View style={styles.statItem}><Text style={styles.statValue}>{user?.memberSince ?? '—'}</Text><Text style={styles.statLabel}>Miembro desde</Text></View>
            <View style={styles.statItem}><Text style={styles.statValueGreen}>{user?.rating?.toFixed(1) ?? '—'}</Text><Text style={styles.statLabel}>Calificación</Text></View>
          </>
        )}
      </View>
    </GlassCard>
  );
}
