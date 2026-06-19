import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { styles } from './styles/emergency-report-modal.styles';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useAuth } from '@/contexts/auth';
import { reportsApi } from '@/services/api';
import { Brand } from '@/constants/theme';

interface Props {
  visible: boolean;
  tripId: string;
  onDismiss: () => void;
  defaultType?: 'emergency' | 'driver_report';
  lockType?: boolean;
  onSuccess?: () => void;
}

type ReportType = 'emergency' | 'driver_report';

const MAX_DESC = 400;

export default function EmergencyReportModal({ visible, tripId, onDismiss, defaultType = 'emergency', lockType = false, onSuccess }: Props) {
  const { token } = useAuth();
  const { colors, isDark } = useAppTheme();

  const [type, setType] = useState<ReportType>(defaultType);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const reset = () => {
    setType(defaultType);
    setDescription('');
    setSubmitting(false);
    setSent(false);
  };

  const handleClose = () => {
    reset();
    onDismiss();
  };

  const handleSubmit = async () => {
    if (!token) return;
    if (description.trim().length < 5) {
      Alert.alert('Descripción requerida', 'Por favor describe la situación antes de enviar.');
      return;
    }
    setSubmitting(true);
    try {
      await reportsApi.create({ tripId, type, description: description.trim() }, token);
      setSent(true);
      onSuccess?.();
    } catch (e: any) {
      Alert.alert('Error al enviar', e.message ?? 'No se pudo enviar el reporte. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const emergencyColor = '#e53e3e';
  const driverColor    = '#f4a522';
  const isEmergency    = type === 'emergency';
  const activeColor    = isEmergency ? emergencyColor : driverColor;

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={handleClose}>
      <BlurView intensity={30} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill}>
        {/* Tap outside the sheet to dismiss */}
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />

        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={[styles.sheet, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
            <Pressable onPress={handleClose} style={styles.handleWrap}>
              <View style={styles.handle} />
            </Pressable>

            {sent ? (
              // ── Confirmation screen ──────────────────────────────────────
              <View style={styles.successWrap}>
                <Ionicons name="checkmark-circle" size={56} color={Brand.colors.green.normal} />
                <Text style={[styles.successTitle, { color: colors.textPrimary }]}>
                  Reporte enviado
                </Text>
                <Text style={[styles.successBody, { color: colors.textSecondary }]}>
                  {isEmergency
                    ? 'El equipo de Jalemos fue notificado de tu emergencia y actuará de inmediato.'
                    : 'Tu reporte fue recibido. El equipo de Jalemos lo revisará a la brevedad.'}
                </Text>
                <Pressable
                  style={[styles.doneBtn, { backgroundColor: Brand.colors.green.normal }]}
                  onPress={handleClose}
                >
                  <Text style={styles.doneBtnText}>Cerrar</Text>
                </Pressable>
              </View>
            ) : (
              // ── Report form (scrollable so keyboard never covers buttons) ──
              <ScrollView
                bounces={false}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.formContent}
              >
                <Text style={[styles.title, { color: colors.textPrimary }]}>
                  {isEmergency ? '🚨 Botón de emergencia' : 'Reportar al conductor'}
                </Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  Tu reporte llega al equipo de Jalemos en tiempo real.
                </Text>

                {/* Type selector — hidden when type is locked (e.g. post-trip driver report) */}
                {!lockType && <View style={styles.typeRow}>
                  {(['emergency', 'driver_report'] as ReportType[]).map(t => {
                    const isSelected = type === t;
                    const color      = t === 'emergency' ? emergencyColor : driverColor;
                    const label      = t === 'emergency' ? 'Emergencia' : 'Reporte al conductor';
                    const icon       = t === 'emergency' ? 'warning' : 'person-remove';
                    return (
                      <Pressable
                        key={t}
                        style={[
                          styles.typeBtn,
                          {
                            borderColor: isSelected ? color : colors.border,
                            backgroundColor: isSelected ? color + '18' : 'transparent',
                          },
                        ]}
                        onPress={() => setType(t)}
                      >
                        <Ionicons name={icon as any} size={22} color={isSelected ? color : colors.textMuted} />
                        <Text style={[styles.typeBtnLabel, { color: isSelected ? color : colors.textMuted }]}>
                          {label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>}

                {/* Description */}
                <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
                  {isEmergency ? '¿Qué está ocurriendo?' : '¿Qué sucedió con el conductor?'}
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { color: colors.textPrimary, backgroundColor: colors.inputBg, borderColor: colors.border },
                  ]}
                  placeholder={
                    isEmergency
                      ? 'Describe la emergencia con el mayor detalle posible…'
                      : 'Describe la conducta o situación del conductor…'
                  }
                  placeholderTextColor={colors.textMuted}
                  value={description}
                  onChangeText={t => setDescription(t.slice(0, MAX_DESC))}
                  multiline
                  returnKeyType="default"
                />
                <Text style={[styles.charCount, { color: colors.textMuted }]}>
                  {description.length}/{MAX_DESC}
                </Text>

                {/* Submit */}
                <Pressable
                  style={[styles.submitBtn, { backgroundColor: activeColor, opacity: submitting ? 0.7 : 1 }]}
                  onPress={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="send" size={18} color="#fff" />
                      <Text style={styles.submitBtnText}>Enviar reporte</Text>
                    </>
                  )}
                </Pressable>

                <Pressable style={styles.cancelLink} onPress={handleClose} disabled={submitting}>
                  <Text style={[styles.cancelText, { color: colors.textMuted }]}>Cancelar</Text>
                </Pressable>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </BlurView>
    </Modal>
  );
}
