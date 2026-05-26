// Admin screen — full driver application review.
// Shows applicant info, vehicle details, document photos, an issue checklist,
// and action buttons: request correction, approve, or reject.

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

import AnimatedPressable from '@/components/animated-pressable';
import GlassCard from '@/components/glass-card';
import { Brand, Fonts, withElevation } from '@/constants/theme';
import { REVIEW_ISSUES } from '@/constants/mock-applications';
import { ApplicationStatus, useApplications } from '@/contexts/applications';
import { useAppTheme } from '@/hooks/use-app-theme';

const STATUS_LABELS: Record<ApplicationStatus, { label: string; color: string }> = {
  pending:          { label: 'Pendiente',          color: '#f7a900' },
  under_review:     { label: 'En revisión',         color: Brand.colors.blue.normal },
  needs_correction: { label: 'Requiere corrección', color: '#ff7c2a' },
  approved:         { label: 'Aprobada',            color: Brand.colors.green.normal },
  rejected:         { label: 'Rechazada',           color: Brand.colors.alerts.error },
};

function PhotoCard({
  label,
  hasPhoto,
  colors,
}: {
  label: string;
  hasPhoto: boolean;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  return (
    <View style={{
      flex: 1,
      borderRadius: Brand.radius[12],
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      aspectRatio: 1.5,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      overflow: 'hidden',
    }}>
      <Ionicons
        name={hasPhoto ? 'document' : 'document-outline'}
        size={28}
        color={hasPhoto ? Brand.colors.green.normal : colors.textMuted}
      />
      <Text style={{ fontSize: 10, fontFamily: Fonts.sans, color: colors.textMuted, textAlign: 'center', paddingHorizontal: 8 }}>
        {label}
      </Text>
      {hasPhoto && (
        <View style={{
          position: 'absolute', top: 6, right: 6,
          width: 18, height: 18, borderRadius: 9,
          backgroundColor: Brand.colors.green.normal,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Ionicons name="checkmark" size={11} color="#fff" />
        </View>
      )}
    </View>
  );
}

function makeStyles(c: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.screenBg },
    header: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: Brand.grid.margin, paddingVertical: 12,
      backgroundColor: c.screenBg,
    },
    backBtn: {
      width: 38, height: 38, borderRadius: 19,
      backgroundColor: c.surface,
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: c.border,
      ...withElevation(100),
    },
    headerTitle: {
      flex: 1, textAlign: 'center',
      color: c.textPrimary, fontFamily: Fonts.headingBold, fontSize: 16,
    },
    statusBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1,
    },
    content: { paddingHorizontal: Brand.grid.margin, paddingBottom: 32, gap: 14 },
    card: { borderRadius: Brand.radius[16], padding: Brand.spacing[16], gap: 12 },
    sectionLabel: {
      fontSize: 11, color: c.textMuted,
      fontFamily: Fonts.headingBold, textTransform: 'uppercase',
    },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
    infoCell: { flex: 1 },
    infoKey: { fontSize: 10, color: c.textMuted, fontFamily: Fonts.sans, textTransform: 'uppercase', marginBottom: 2 },
    infoValue: { fontSize: 13, color: c.textPrimary, fontFamily: Fonts.heading },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: c.border },
    photosRow: { flexDirection: 'row', gap: 10 },
    issueItem: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border,
    },
    issueText: { flex: 1, fontSize: 13, color: c.textSecondary, fontFamily: Fonts.sans },
    checkbox: {
      width: 22, height: 22, borderRadius: 6, borderWidth: 2,
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    notesInput: {
      borderRadius: Brand.radius[12], borderWidth: 1,
      borderColor: c.border, backgroundColor: c.inputBg,
      paddingHorizontal: 12, paddingVertical: 10,
      fontSize: 13, color: c.inputText, fontFamily: Fonts.sans,
      minHeight: 80, textAlignVertical: 'top',
    },
    actionRow: { gap: 10 },
    btnPrimary: {
      borderRadius: 999, backgroundColor: Brand.colors.green.normal,
      alignItems: 'center', paddingVertical: 13,
    },
    btnPrimaryText: { color: '#fff', fontFamily: Fonts.headingBold, fontSize: 14 },
    btnWarning: {
      borderRadius: 999, backgroundColor: '#ff7c2a',
      alignItems: 'center', paddingVertical: 13,
    },
    btnWarningText: { color: '#fff', fontFamily: Fonts.headingBold, fontSize: 14 },
    btnDanger: {
      borderRadius: 999,
      borderWidth: 1, borderColor: Brand.colors.alerts.error,
      backgroundColor: Brand.colors.alerts.error + '18',
      alignItems: 'center', paddingVertical: 13,
    },
    btnDangerText: { color: Brand.colors.alerts.error, fontFamily: Fonts.headingBold, fontSize: 14 },
    btnSecondary: {
      borderRadius: 999, borderWidth: 1,
      borderColor: c.border, backgroundColor: c.surfaceAlt,
      alignItems: 'center', paddingVertical: 13,
    },
    btnSecondaryText: { color: c.textSecondary, fontFamily: Fonts.heading, fontSize: 14 },
    // Previous feedback
    feedbackBox: {
      borderRadius: Brand.radius[12], padding: 12, gap: 6,
      backgroundColor: '#ff7c2a18', borderWidth: 1, borderColor: '#ff7c2a44',
    },
    feedbackTitle: { fontSize: 12, color: '#ff7c2a', fontFamily: Fonts.headingBold },
    feedbackText: { fontSize: 12, color: c.textSecondary, fontFamily: Fonts.sans, lineHeight: 18 },
  });
}

export default function ApplicationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { applications, setUnderReview, requestCorrection, approveApplication, rejectApplication } = useApplications();

  const app = useMemo(
    () => applications.find((a) => a.id === (Array.isArray(id) ? id[0] : id)),
    [applications, id]
  );

  const [selectedIssues, setSelectedIssues] = useState<string[]>(app?.adminFeedback?.issueIds ?? []);
  const [notes, setNotes] = useState(app?.adminFeedback?.notes ?? '');

  const isEditable = app?.status === 'pending' || app?.status === 'under_review' || app?.status === 'needs_correction';

  const toggleIssue = (issueId: string) => {
    setSelectedIssues((prev) =>
      prev.includes(issueId) ? prev.filter((i) => i !== issueId) : [...prev, issueId]
    );
  };

  const handleSetUnderReview = async () => {
    if (!app) return;
    try { await setUnderReview(app.id); } catch {}
  };

  const handleRequestCorrection = async () => {
    if (!app) return;
    if (selectedIssues.length === 0) {
      Alert.alert('Sin problemas seleccionados', 'Marcá al menos un problema para solicitar corrección.');
      return;
    }
    try {
      await requestCorrection(app.id, selectedIssues, notes);
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'No se pudo actualizar la solicitud.');
    }
  };

  const handleApprove = () => {
    if (!app) return;
    Alert.alert(
      'Aprobar solicitud',
      `¿Aprobar la solicitud de ${app.applicantName}? Se le habilitará el modo conductor.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aprobar', style: 'default',
          onPress: async () => {
            try { await approveApplication(app.id); router.back(); }
            catch (err: any) { Alert.alert('Error', err?.message ?? 'No se pudo aprobar.'); }
          },
        },
      ]
    );
  };

  const handleReject = () => {
    if (!app) return;
    Alert.alert(
      'Rechazar solicitud',
      '¿Rechazar permanentemente esta solicitud? El usuario no podrá activar el modo conductor.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Rechazar', style: 'destructive',
          onPress: async () => {
            try { await rejectApplication(app.id, selectedIssues, notes); router.back(); }
            catch (err: any) { Alert.alert('Error', err?.message ?? 'No se pudo rechazar.'); }
          },
        },
      ]
    );
  };

  if (!app) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: colors.textMuted, fontFamily: Fonts.heading, fontSize: 14 }}>Solicitud no encontrada</Text>
      </View>
    );
  }

  const statusCfg = STATUS_LABELS[app.status];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{app.applicantName}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusCfg.color + '22', borderColor: statusCfg.color + '55' }]}>
          <Text style={{ fontSize: 11, fontFamily: Fonts.headingBold, color: statusCfg.color }}>{statusCfg.label}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Set under review if still pending */}
        {app.status === 'pending' && (
          <Animated.View entering={FadeInDown.duration(200)}>
            <AnimatedPressable pressedScale={0.99} onPress={handleSetUnderReview}>
              <View style={[styles.card, { backgroundColor: Brand.colors.blue.normal + '18', borderColor: Brand.colors.blue.normal + '44', borderWidth: 1 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Ionicons name="eye-outline" size={20} color={Brand.colors.blue.normal} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontFamily: Fonts.headingBold, color: Brand.colors.blue.normal }}>
                      Marcar como "En revisión"
                    </Text>
                    <Text style={{ fontSize: 11, fontFamily: Fonts.sans, color: colors.textMuted, marginTop: 2 }}>
                      Indicarle al solicitante que ya se está revisando su caso
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={Brand.colors.blue.normal} />
                </View>
              </View>
            </AnimatedPressable>
          </Animated.View>
        )}

        {/* Previous admin feedback if resubmission */}
        {app.attempts > 1 && app.adminFeedback && (
          <Animated.View entering={FadeInDown.duration(200).delay(40)}>
            <View style={styles.feedbackBox}>
              <Text style={styles.feedbackTitle}>Problemas del intento anterior (#{app.attempts - 1})</Text>
              {app.adminFeedback.issueIds.map((id) => {
                const issue = REVIEW_ISSUES.find((i) => i.id === id);
                return issue ? (
                  <Text key={id} style={styles.feedbackText}>• {issue.label}</Text>
                ) : null;
              })}
              {app.adminFeedback.notes ? (
                <Text style={[styles.feedbackText, { fontStyle: 'italic', marginTop: 4 }]}>
                  "{app.adminFeedback.notes}"
                </Text>
              ) : null}
            </View>
          </Animated.View>
        )}

        {/* Applicant info */}
        <Animated.View entering={FadeInDown.duration(200).delay(80)}>
          <GlassCard style={styles.card} intensity={32}>
            <Text style={styles.sectionLabel}>Solicitante</Text>
            <View style={styles.infoRow}>
              <View style={styles.infoCell}>
                <Text style={styles.infoKey}>Nombre</Text>
                <Text style={styles.infoValue}>{app.applicantName}</Text>
              </View>
              <View style={styles.infoCell}>
                <Text style={styles.infoKey}>Correo</Text>
                <Text style={styles.infoValue}>{app.applicantEmail}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.infoCell}>
                <Text style={styles.infoKey}>Enviada</Text>
                <Text style={styles.infoValue}>
                  {new Date(app.submittedAt).toLocaleDateString('es-CR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </Text>
              </View>
              <View style={styles.infoCell}>
                <Text style={styles.infoKey}>Intentos</Text>
                <Text style={styles.infoValue}>{app.attempts}</Text>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Vehicle info */}
        <Animated.View entering={FadeInDown.duration(200).delay(120)}>
          <GlassCard style={styles.card} intensity={32}>
            <Text style={styles.sectionLabel}>Vehículo</Text>
            <View style={styles.infoRow}>
              <View style={styles.infoCell}>
                <Text style={styles.infoKey}>Marca / Modelo</Text>
                <Text style={styles.infoValue}>{app.vehicle.brand} {app.vehicle.model}</Text>
              </View>
              <View style={styles.infoCell}>
                <Text style={styles.infoKey}>Año</Text>
                <Text style={styles.infoValue}>{app.vehicle.year}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.infoCell}>
                <Text style={styles.infoKey}>Placa</Text>
                <Text style={styles.infoValue}>{app.vehicle.plate}</Text>
              </View>
              <View style={styles.infoCell}>
                <Text style={styles.infoKey}>Color</Text>
                <Text style={styles.infoValue}>{app.vehicle.color}</Text>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Documents */}
        <Animated.View entering={FadeInDown.duration(200).delay(160)}>
          <GlassCard style={styles.card} intensity={32}>
            <Text style={styles.sectionLabel}>Documentos adjuntos</Text>
            <View style={styles.photosRow}>
              <PhotoCard label="Licencia frontal" hasPhoto={!!app.licensePhotoFront} colors={colors} />
              <PhotoCard label="Licencia trasera" hasPhoto={!!app.licensePhotoBack} colors={colors} />
              <PhotoCard label="Dekra" hasPhoto={!!app.dekraPhoto} colors={colors} />
            </View>
            <Text style={{ fontSize: 11, fontFamily: Fonts.sans, color: colors.textMuted, textAlign: 'center' }}>
              Los documentos reales se mostrarán cuando el backend esté conectado
            </Text>
          </GlassCard>
        </Animated.View>

        {/* Issue checklist + notes — only for editable states */}
        {isEditable && (
          <Animated.View entering={FadeInDown.duration(200).delay(200)}>
            <GlassCard style={styles.card} intensity={32}>
              <Text style={styles.sectionLabel}>Problemas encontrados</Text>
              {REVIEW_ISSUES.map((issue) => {
                const selected = selectedIssues.includes(issue.id);
                return (
                  <Pressable key={issue.id} style={styles.issueItem} onPress={() => toggleIssue(issue.id)}>
                    <View style={[styles.checkbox, {
                      borderColor: selected ? Brand.colors.green.normal : colors.border,
                      backgroundColor: selected ? Brand.colors.green.normal : 'transparent',
                    }]}>
                      {selected && <Ionicons name="checkmark" size={13} color="#fff" />}
                    </View>
                    <Text style={styles.issueText}>{issue.label}</Text>
                  </Pressable>
                );
              })}

              <View style={styles.divider} />
              <Text style={styles.sectionLabel}>Notas adicionales (opcional)</Text>
              <TextInput
                style={styles.notesInput}
                value={notes}
                onChangeText={setNotes}
                placeholder="Agregá detalles específicos para el solicitante..."
                placeholderTextColor={colors.textPlaceholder}
                multiline
              />
            </GlassCard>
          </Animated.View>
        )}

        {/* Actions */}
        {isEditable && (
          <Animated.View entering={FadeInDown.duration(200).delay(240)} style={styles.actionRow}>
            <AnimatedPressable pressedScale={0.98} onPress={handleApprove}>
              <View style={styles.btnPrimary}>
                <Text style={styles.btnPrimaryText}>Aprobar solicitud</Text>
              </View>
            </AnimatedPressable>

            <AnimatedPressable pressedScale={0.98} onPress={handleRequestCorrection}>
              <View style={styles.btnWarning}>
                <Text style={styles.btnWarningText}>Solicitar corrección</Text>
              </View>
            </AnimatedPressable>

            <AnimatedPressable pressedScale={0.98} onPress={handleReject}>
              <View style={styles.btnDanger}>
                <Text style={styles.btnDangerText}>Rechazar solicitud</Text>
              </View>
            </AnimatedPressable>
          </Animated.View>
        )}

        {!isEditable && (
          <Animated.View entering={FadeInDown.duration(200).delay(200)}>
            <Pressable style={styles.btnSecondary} onPress={() => router.back()}>
              <Text style={styles.btnSecondaryText}>Volver a solicitudes</Text>
            </Pressable>
          </Animated.View>
        )}

      </ScrollView>
    </View>
  );
}
