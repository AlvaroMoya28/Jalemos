// Star rating row (full / half / empty) used across the ride-detail screen.

import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { staticStyles as rideDetailStaticStyles } from '../../styles/app/ride-detail.styles';

export default function StarRating({ rating, size = 13 }: { rating: number; size?: number }) {
  const full = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.4;
  const empty = 5 - full - (hasHalf ? 1 : 0);
  return (
    <View style={rideDetailStaticStyles.starRatingRow}>
      {Array.from({ length: full }).map((_, i) => (
        <Ionicons key={`f${i}`} name="star" size={size} color="#f7a900" />
      ))}
      {hasHalf ? <Ionicons name="star-half" size={size} color="#f7a900" /> : null}
      {Array.from({ length: empty }).map((_, i) => (
        <Ionicons key={`e${i}`} name="star-outline" size={size} color="#f7a900" />
      ))}
    </View>
  );
}
