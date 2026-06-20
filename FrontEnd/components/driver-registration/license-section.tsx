// Driver's licence card: front/back photos + expiry (MM/AA).

import { Text, View } from 'react-native';

import ExpiryInput from '@/components/shared/expiry-input';
import GlassCard from '@/components/shared/glass-card';
import { Brand } from '@/constants/theme';
import { useDriverRegistrationForm } from '@/hooks/use-driver-registration-form';
import { makeStyles } from '@/styles/app/driver-registration.styles';
import PhotoPickerBtn from './photo-picker-btn';

export default function LicenseSection({ form, styles }: {
  form: ReturnType<typeof useDriverRegistrationForm>;
  styles: ReturnType<typeof makeStyles>;
}) {
  const { licenciaFront, licenciaBack, licenseExpiry, setLicenseExpiry, openPhotoOptions, err } = form;
  return (
    <View style={styles.cardWrap}>
      <GlassCard style={styles.card} intensity={48}>
        <Text style={styles.sectionLabel}>Licencia de conducir <Text style={{ color: Brand.colors.alerts.error }}>*</Text></Text>

        <View style={styles.photoRow}>
          <PhotoPickerBtn
            photo={licenciaFront}
            label="Lado frontal *"
            sublabel="Toca para adjuntar"
            onPress={() => openPhotoOptions('licenciaFront')}
            error={err('licenciaFront')}
          />
          <PhotoPickerBtn
            photo={licenciaBack}
            label="Lado trasero *"
            sublabel="Toca para adjuntar"
            onPress={() => openPhotoOptions('licenciaBack')}
            error={err('licenciaBack')}
          />
        </View>

        <Text style={[styles.photoSublabel, { marginBottom: 4 }]}>Fecha de vencimiento (MM/AA) <Text style={{ color: Brand.colors.alerts.error }}>*</Text></Text>
        <ExpiryInput
          value={licenseExpiry}
          onChangeText={setLicenseExpiry}
          fieldStyle={{ ...styles.inputWrap, ...(err('licenseExpiry') ? { borderColor: Brand.colors.alerts.error } : {}) }}
          inputStyle={styles.input}
        />
      </GlassCard>
    </View>
  );
}
