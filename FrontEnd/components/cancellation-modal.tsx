// Cancellation reason selector — used by both driver and passenger flows.

import { BlurView } from 'expo-blur';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Brand, Fonts } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

interface Reason { key: string; label: string; }

const DRIVER_REASONS: Reason[] = [
  { key: 'vehicle_issue',      label: 'Problema con el vehículo' },
  { key: 'personal_emergency', label: 'Emergencia personal' },
  { key: 'traffic_problem',    label: 'Problema de tránsito' },
  { key: 'route_change',       label: 'Cambio de ruta' },
  { key: 'other',              label: 'Otro motivo' },
];

const PASSENGER_REASONS: Reason[] = [
  { key: 'plans_changed',      label: 'Cambié de planes' },
  { key: 'found_alternative',  label: 'Encontré otra opción' },
  { key: 'personal_emergency', label: 'Emergencia personal' },
  { key: 'other',              label: 'Otro motivo' },
];

interface Props {
  visible: boolean;
  type: 'driver' | 'passenger';
  title?: string;
  onConfirm: (reason: string, details: string | null) => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function CancellationModal({ visible, type, title, onConfirm, onCancel, loading }: Props) {
  const { colors, isDark } = useAppTheme();
  const reasons = type === 'driver' ? DRIVER_REASONS : PASSENGER_REASONS;

  const [selected, setSelected] = useState<string | null>(null);
  const [details, setDetails]   = useState('');

  const handleConfirm = () => {
    if (!selected) return;
    onConfirm(selected, details.trim() || null);
  };

  const reset = () => { setSelected(null); setDetails(''); };

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onCancel}>
      <BlurView intensity={20} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill}>
        <Pressable style={s.backdrop} onPress={onCancel} />
        <View style={[s.sheet, { backgroundColor: isDark ? '#1c1c1e' : '#f8f8f8' }]}>
          <View style={s.handle} />
          <Text style={[s.title, { color: colors.textPrimary }]}>{title ?? '¿Por qué cancelas?'}</Text>
          <Text style={[s.subtitle, { color: colors.textSecondary }]}>Selecciona el motivo de la cancelación</Text>

          <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={false}>
            {reasons.map((r) => (
              <Pressable
                key={r.key}
                style={[
                  s.option,
                  { borderColor: colors.border, backgroundColor: selected === r.key ? Brand.colors.green.normal + '22' : 'transparent' },
                  selected === r.key && { borderColor: Brand.colors.green.normal },
                ]}
                onPress={() => setSelected(r.key)}
              >
                <View style={[s.radio, selected === r.key && { backgroundColor: Brand.colors.green.normal, borderColor: Brand.colors.green.normal }]}>
                  {selected === r.key && <View style={s.radioInner} />}
                </View>
                <Text style={[s.optionLabel, { color: colors.textPrimary }]}>{r.label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {selected === 'other' && (
            <TextInput
              style={[s.input, { color: colors.inputText, borderColor: colors.border, backgroundColor: colors.inputBg }]}
              placeholder="Describe el motivo..."
              placeholderTextColor={colors.textPlaceholder}
              value={details}
              onChangeText={setDetails}
              multiline
              maxLength={200}
            />
          )}

          <View style={s.actions}>
            <Pressable style={[s.btn, { borderColor: colors.border, borderWidth: 1 }]} onPress={() => { reset(); onCancel(); }}>
              <Text style={[s.btnText, { color: colors.textSecondary }]}>Volver</Text>
            </Pressable>
            <Pressable
              style={[s.btn, { backgroundColor: selected ? '#e53e3e' : colors.border }, loading && { opacity: 0.6 }]}
              onPress={handleConfirm}
              disabled={!selected || loading}
            >
              <Text style={[s.btnText, { color: '#fff' }]}>Confirmar cancelación</Text>
            </Pressable>
          </View>
        </View>
      </BlurView>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1 },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 12,
    gap: 12,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: '#ccc', alignSelf: 'center', marginBottom: 8,
  },
  title: { fontFamily: Fonts.headingHeavy, fontSize: 20, textAlign: 'center' },
  subtitle: { fontFamily: Fonts.sans, fontSize: 13, textAlign: 'center' },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 6,
  },
  radio: {
    width: 18, height: 18, borderRadius: 9, borderWidth: 2,
    borderColor: '#aaa', alignItems: 'center', justifyContent: 'center',
  },
  radioInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  optionLabel: { fontFamily: Fonts.heading, fontSize: 14, flex: 1 },
  input: {
    borderWidth: 1, borderRadius: 12, padding: 12,
    fontFamily: Fonts.sans, fontSize: 13, minHeight: 80, textAlignVertical: 'top',
  },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  btn: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnText: { fontFamily: Fonts.headingBold, fontSize: 14 },
});
