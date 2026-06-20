// Photo capture slot: shows a camera prompt, or the captured thumbnail with a
// done check + retake overlay once a photo is attached.

import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Image, Pressable, Text, View } from 'react-native';

import { Brand } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { PhotoSlot } from '@/components/driver-registration/driver-reg-validation';
import { makeStyles } from '@/styles/app/driver-registration.styles';

export default function PhotoPickerBtn({ photo, label, sublabel, onPress, style, error }: {
  photo: PhotoSlot;
  label: string;
  sublabel?: string;
  onPress: () => void;
  style?: object;
  error?: boolean;
}) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <Pressable
      style={[style ?? styles.photoBtn, photo ? styles.photoBtnDone : error && { borderColor: Brand.colors.alerts.error, borderStyle: 'solid' }]}
      onPress={onPress}
    >
      {photo ? (
        <>
          <Image source={{ uri: photo.uri }} style={styles.photoThumb} />
          <View style={styles.photoDoneIcon}>
            <Ionicons name="checkmark-circle" size={20} color={Brand.colors.green.normal} />
          </View>
          <View style={styles.retakeOverlay}>
            <Ionicons name="camera-outline" size={18} color="#fff" />
          </View>
        </>
      ) : (
        <>
          <Ionicons name="camera-outline" size={26} color={Brand.colors.green.normal} />
          <Text style={styles.photoLabel}>{label}</Text>
          {sublabel ? <Text style={styles.photoSublabel}>{sublabel}</Text> : null}
        </>
      )}
    </Pressable>
  );
}
