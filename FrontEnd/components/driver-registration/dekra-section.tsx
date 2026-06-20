// Dekra technical-inspection card: document photo + expiry (MM/AA).

import { Text, View } from 'react-native';

import ExpiryInput from '@/components/shared/expiry-input';
import GlassCard from '@/components/shared/glass-card';
import { Brand } from '@/constants/theme';
import { useDriverRegistrationForm } from '@/hooks/use-driver-registration-form';
import { makeStyles } from '@/styles/app/driver-registration.styles';
import PhotoPickerBtn from './photo-picker-btn';

export default function DekraSection({ form, styles }: {
  form: ReturnType<typeof useDriverRegistrationForm>;
  styles: ReturnType<typeof makeStyles>;
}) {
  const { dekraPhoto, dekraExpiry, setDekraExpiry, openPhotoOptions, err } = form;
  return (
    <View style={styles.cardWrap}>
      <GlassCard style={styles.card} intensity={48}>
        <Text style={styles.sectionLabel}>Revisión técnica Dekra <Text style={{ color: Brand.colors.alerts.error }}>*</Text></Text>

        <PhotoPickerBtn
          photo={dekraPhoto}
          label="Foto de la revisión técnica *"
          sublabel="Toca para adjuntar"
          onPress={() => openPhotoOptions('dekra')}
          style={styles.photoBtnFull}
          error={err('dekraPhoto')}
        />

        <Text style={[styles.photoSublabel, { marginBottom: 4 }]}>Fecha de vencimiento (MM/AA) <Text style={{ color: Brand.colors.alerts.error }}>*</Text></Text>
        <ExpiryInput
          value={dekraExpiry}
          onChangeText={setDekraExpiry}
          fieldStyle={{ ...styles.inputWrap, ...(err('dekraExpiry') ? { borderColor: Brand.colors.alerts.error } : {}) }}
          inputStyle={styles.input}
        />
      </GlassCard>
    </View>
  );
}
