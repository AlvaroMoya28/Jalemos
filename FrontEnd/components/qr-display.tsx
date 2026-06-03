// Displays a user's unique QR code using the qrserver.com API (no extra native lib needed).
// The QR token is a stable UUID from the backend used for boarding identification.

import { Image, Text, View } from 'react-native';
import { Brand } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { styles } from './styles/qr-display.styles';

interface Props {
  qrToken: string;
  size?: number;
  label?: string;
}

export default function QrDisplay({ qrToken, size = 200, label }: Props) {
  const { colors } = useAppTheme();
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${qrToken}&format=png&bgcolor=ffffff&color=0a3f39&margin=2`;

  return (
    <View style={styles.container}>
      <View style={[styles.frame, { borderColor: Brand.colors.green.normal + '55' }]}>
        <Image
          source={{ uri: qrUrl }}
          style={{ width: size, height: size }}
          resizeMode="contain"
        />
      </View>
      {label && (
        <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      )}
    </View>
  );
}

