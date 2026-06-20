// Full-screen viewer for an application document photo.

import { Ionicons } from '@expo/vector-icons';
import { Image, Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts } from '@/constants/theme';

export default function ApplicationPhotoViewer({ url, label, onClose }: {
  url: string;
  label: string;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#000', paddingTop: insets.top }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 }}>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="close" size={20} color="#fff" />
          </Pressable>
          <Text style={{ flex: 1, color: '#fff', fontFamily: Fonts.headingBold, fontSize: 15 }}>{label}</Text>
        </View>
        <Image source={{ uri: url }} style={{ flex: 1 }} resizeMode="contain" />
      </View>
    </Modal>
  );
}
