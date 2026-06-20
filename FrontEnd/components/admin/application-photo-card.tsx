// Thumbnail tile for an attached application document; tappable to open the
// full-screen viewer when a photo is present.

import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, Text, View } from 'react-native';

import { Brand, Fonts } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

export default function ApplicationPhotoCard({ label, url, colors, onPress }: {
  label: string;
  url: string | null;
  colors: ReturnType<typeof useAppTheme>['colors'];
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={url ? onPress : undefined}
      style={{
        width: '47%', borderRadius: Brand.radius[12], borderWidth: 1,
        borderColor: url ? Brand.colors.green.normal + '55' : colors.border,
        backgroundColor: colors.surfaceAlt, aspectRatio: 1.5,
        alignItems: 'center', justifyContent: 'center', gap: 6, overflow: 'hidden',
      }}
    >
      {url ? (
        <>
          <Image source={{ uri: url }} style={{ position: 'absolute', width: '100%', height: '100%' }} resizeMode="cover" />
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.45)', paddingVertical: 4, paddingHorizontal: 6 }}>
            <Text style={{ fontSize: 9, fontFamily: Fonts.headingBold, color: '#fff', textAlign: 'center' }}>{label}</Text>
          </View>
          <View style={{ position: 'absolute', top: 5, right: 5, width: 18, height: 18, borderRadius: 9, backgroundColor: Brand.colors.green.normal, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="expand-outline" size={10} color="#fff" />
          </View>
        </>
      ) : (
        <>
          <Ionicons name="document-outline" size={26} color={colors.textMuted} />
          <Text style={{ fontSize: 9, fontFamily: Fonts.sans, color: colors.textMuted, textAlign: 'center', paddingHorizontal: 6 }}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}
