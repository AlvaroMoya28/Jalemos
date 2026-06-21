// "Reseñas recientes" section of the ride-detail screen: shows up to the 5 most recent
// reviews a driver has received. Presentational.

import Animated, { FadeInDown } from 'react-native-reanimated';
import { Text, View } from 'react-native';

import GlassCard from '@/components/shared/glass-card';
import StarRating from '@/components/ride-detail/star-rating';
import { useAppTheme } from '@/hooks/use-app-theme';
import { RatingDTO } from '@/services/api';
import { makeStyles } from '../../styles/app/ride-detail.styles';

type RideDetailStyles = ReturnType<typeof makeStyles>;
type AppColors = ReturnType<typeof useAppTheme>['colors'];

export default function DriverReviews({ reviews, styles, colors }: {
  reviews: RatingDTO[];
  styles: RideDetailStyles;
  colors: AppColors;
}) {
  return (
    <Animated.View entering={FadeInDown.duration(240).delay(200)} style={styles.reviewsSection}>
      <Text style={styles.sectionTitle}>Reseñas recientes</Text>
      {reviews.length === 0 ? (
        <Text style={[styles.reviewComment, { color: colors.textMuted }]}>
          Este conductor aún no tiene reseñas.
        </Text>
      ) : (
        // Show at most the 5 most recent reviews (already sorted newest-first).
        reviews.slice(0, 5).map((review) => {
          const reviewerName = `${review.raterFirstName} ${review.raterLastName}`.trim() || 'Usuario';
          const avatar = `${review.raterFirstName?.[0] ?? ''}${review.raterLastName?.[0] ?? ''}`.toUpperCase() || '?';
          const date = new Date(review.createdAt).toLocaleDateString('es-CR', { day: 'numeric', month: 'short', year: 'numeric' });
          return (
            <GlassCard key={review.id} style={styles.reviewCard} intensity={28}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewAvatar}>
                  <Text style={styles.reviewAvatarText}>{avatar}</Text>
                </View>
                <View style={styles.reviewMeta}>
                  <Text style={styles.reviewerName}>{reviewerName}</Text>
                  <View style={styles.reviewRatingRow}>
                    <StarRating rating={review.score} size={11} />
                    <Text style={styles.reviewDate}>{date}</Text>
                  </View>
                </View>
              </View>
              {review.comment ? <Text style={styles.reviewComment}>{review.comment}</Text> : null}
            </GlassCard>
          );
        })
      )}
    </Animated.View>
  );
}
