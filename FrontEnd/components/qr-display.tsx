// Displays a user's unique QR code using the qrserver.com API (no extra native lib needed).
// The QR token is a stable UUID from the backend used for boarding identification.

import { Image, StyleSheet, Text, View } from 'react-native';
import { Brand, Fonts } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

interface Props {
  qrToken: string;
  size?: number;
  label?: string;
}

export default function QrDisplay({ qrToken, size = 200, label }: Props) {
  const { colors } = useAppTheme();
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${qrToken}&format=png&bgcolor=ffffff&color=0a3f39&margin=2`;

  return (
    <View style={s.container}>
      <View style={[s.frame, { borderColor: Brand.colors.green.normal + '55' }]}>
        <Image
          source={{ uri: qrUrl }}
          style={{ width: size, height: size }}
          resizeMode="contain"
        />
      </View>
      {label && (
        <Text style={[s.label, { color: colors.textSecondary }]}>{label}</Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { alignItems: 'center', gap: 12 },
  frame: {
    borderRadius: Brand.radius[12],
    borderWidth: 2,
    padding: 10,
    backgroundColor: '#fff',
  },
  label: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 240,
  },
});
