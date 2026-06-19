// Card for a low (≤2★) driver rating that an admin can act on.

import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import AnimatedPressable from '@/components/shared/animated-pressable';
import GlassCard from '@/components/shared/glass-card';
import { Fonts } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { RatingDTO } from '@/services/api';
import { metaDotInline, makeStyles } from '@/styles/tabs/admin-reports.styles';
import { formatShortDate } from '@/utils/format';

export default function LowRatingCard({ rating, onPress, styles, colors }: {
  rating: RatingDTO;
  onPress: (driverName: string) => void;
  styles: ReturnType<typeof makeStyles>;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  const driverName = `${rating.ratedFirstName} ${rating.ratedLastName}`.trim() || 'Conductor';
  const raterName  = `${rating.raterFirstName} ${rating.raterLastName}`.trim() || 'Pasajero';
  const stars      = Array.from({ length: 5 }, (_, i) => i < rating.score ? '★' : '☆').join('');

  return (
    <AnimatedPressable pressedScale={0.99} onPress={() => onPress(driverName)}>
      <GlassCard style={styles.card} intensity={32}>
        <View style={styles.cardHeader}>
          <View style={[styles.avatar, { backgroundColor: '#e53e3e22' }]}>
            <Text style={{ fontFamily: Fonts.headingBold, fontSize: 13, color: '#e53e3e' }}>{stars.slice(0, rating.score)}</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.reportedName}>{driverName}</Text>
            <Text style={styles.reportedRole}>Conductor</Text>
          </View>
          <View style={[styles.reasonBadge, { backgroundColor: '#e53e3e22', borderColor: '#e53e3e55' }]}>
            <Text style={[styles.reasonText, { color: '#e53e3e' }]}>{rating.score} / 5</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {rating.comment ? (
          <Text style={styles.detailsText} numberOfLines={2}>{rating.comment}</Text>
        ) : (
          <Text style={[styles.detailsText, { color: colors.textMuted }]}>Sin comentario</Text>
        )}

        <View style={styles.metaRow}>
          <Ionicons name="person-outline" size={12} color={colors.textMuted} />
          <Text style={styles.metaText}>Por {raterName}</Text>
          <View style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: colors.textMuted }} />
          <Text style={styles.metaText}>{formatShortDate(rating.createdAt)}</Text>
          <View style={metaDotInline.pendingActionsContainer}>
            <View style={metaDotInline.pendingActionsRow}>
              <Text style={[styles.metaText, { color: '#e53e3e' }]}>Accionar</Text>
              <Ionicons name="chevron-forward" size={12} color="#e53e3e" />
            </View>
          </View>
        </View>
      </GlassCard>
    </AnimatedPressable>
  );
}
