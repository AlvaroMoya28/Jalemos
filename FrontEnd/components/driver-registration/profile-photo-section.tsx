// Driver profile photo card — face must be clearly visible.

import { Text, View } from 'react-native';

import GlassCard from '@/components/shared/glass-card';
import { Brand } from '@/constants/theme';
import { useDriverRegistrationForm } from '@/hooks/use-driver-registration-form';
import { makeStyles } from '@/styles/app/driver-registration.styles';
import PhotoPickerBtn from './photo-picker-btn';

export default function ProfilePhotoSection({ form, styles }: {
  form: ReturnType<typeof useDriverRegistrationForm>;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View style={styles.cardWrap}>
      <GlassCard style={styles.card} intensity={48}>
        <Text style={styles.sectionLabel}>Foto de perfil <Text style={{ color: Brand.colors.alerts.error }}>*</Text></Text>
        <PhotoPickerBtn
          photo={form.facePhoto}
          label="Tu foto de perfil"
          sublabel="Debe mostrar tu rostro claramente"
          onPress={() => form.openPhotoOptions('face')}
          style={styles.photoBtnFull}
          error={form.err('facePhoto')}
        />
      </GlassCard>
    </View>
  );
}
