// Personal info card: read-only registered name, cédula and home address.

import { Ionicons } from '@expo/vector-icons';
import { Text, TextInput, View } from 'react-native';

import GlassCard from '@/components/shared/glass-card';
import PlaceSearchInput from '@/components/shared/place-search-input';
import { Brand } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useDriverRegistrationForm } from '@/hooks/use-driver-registration-form';
import { makeStyles } from '@/styles/app/driver-registration.styles';

export default function PersonalInfoSection({ form, styles, colors }: {
  form: ReturnType<typeof useDriverRegistrationForm>;
  styles: ReturnType<typeof makeStyles>;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  const { user, cedula, setCedula, address, setAddress, err } = form;
  return (
    <View style={styles.cardWrap}>
      <GlassCard style={styles.card} intensity={48}>
        <Text style={styles.sectionLabel}>Información personal</Text>

        {/* Registered name shown read-only for license verification */}
        <View style={[styles.inputWrap, { opacity: 0.65 }]}>
          <Ionicons name="person-outline" size={18} color={Brand.colors.green.normal} />
          <Text style={[styles.input, { color: 'rgba(255,255,255,0.7)' }]}>
            {user ? `${user.firstName} ${user.lastName}` : '—'}
          </Text>
          <Ionicons name="lock-closed-outline" size={14} color="rgba(255,255,255,0.4)" />
        </View>
        <Text style={[styles.photoSublabel, { marginTop: -6, marginLeft: 2 }]}>
          Este nombre se verificará contra tu licencia
        </Text>

        <View style={[styles.inputWrap, err('cedula') && { borderColor: Brand.colors.alerts.error }]}>
          <Ionicons name="card-outline" size={18} color={Brand.colors.green.normal} />
          <TextInput
            value={cedula}
            onChangeText={setCedula}
            placeholder="Número de cédula *"
            placeholderTextColor={colors.textPlaceholder}
            style={styles.input}
            keyboardType="numeric"
            maxLength={15}
          />
        </View>

        <PlaceSearchInput
          value={address}
          onChangeText={setAddress}
          onSelect={(pred) => setAddress(pred.description)}
          leadingIcon={<Ionicons name="location-outline" size={18} color={Brand.colors.green.normal} />}
          fieldStyle={{ ...styles.inputWrap, ...(err('address') ? { borderColor: Brand.colors.alerts.error } : {}) }}
          placeholder="Dirección de domicilio *"
          placeholderTextColor={colors.textPlaceholder}
          style={styles.input}
        />
      </GlassCard>
    </View>
  );
}
