// Admin screen — full driver application review.
// Shows applicant info, vehicle details, document photos, an issue checklist,
// and action buttons: request correction, approve, or reject.

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

import AnimatedPressable from '@/components/animated-pressable';
import GlassCard from '@/components/glass-card';
import { Brand, Fonts } from '@/constants/theme';
import { REVIEW_ISSUES } from '@/constants/mock-applications';
import { ApplicationStatus, useApplications } from '@/contexts/applications';
import { useAppTheme } from '@/hooks/use-app-theme';
import { makeStyles } from '../styles/app/application-detail.styles';

const STATUS_LABELS: Record<ApplicationStatus, { label: string; color: string }> = {
  pending:          { label: 'Pendiente',          color: '#f7a900' },
  under_review:     { label: 'En revisión',         color: Brand.colors.blue.normal },
  needs_correction: { label: 'Requiere corrección', color: '#ff7c2a' },
  approved:         { label: 'Aprobada',            color: Brand.colors.green.normal },
  rejected:         { label: 'Rechazada',           color: Brand.colors.alerts.error },
};

function PhotoCard({
  label,
  url,
  colors,
  onPress,
}: {
  label: string;
  url: string | null;
  colors: ReturnType<typeof useAppTheme>['colors'];
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={url ? onPress : undefined}
      style={{
        width: '47%',
        borderRadius: Brand.radius[12],
        borderWidth: 1,
        borderColor: url ? Brand.colors.green.normal + '55' : colors.border,
        backgroundColor: colors.surfaceAlt,
        aspectRatio: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        overflow: 'hidden',
      }}
    >
      {url ? (
        <>
          <Image
            source={{ uri: url }}
            style={{ position: 'absolute', width: '100%', height: '100%' }}
            resizeMode="cover"
          />
          <View style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            backgroundColor: 'rgba(0,0,0,0.45)', paddingVertical: 4, paddingHorizontal: 6,
          }}>
            <Text style={{ fontSize: 9, fontFamily: Fonts.headingBold, color: '#fff', textAlign: 'center' }}>
              {label}
            </Text>
          </View>
          <View style={{
            position: 'absolute', top: 5, right: 5,
            width: 18, height: 18, borderRadius: 9,
            backgroundColor: Brand.colors.green.normal,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Ionicons name="expand-outline" size={10} color="#fff" />
          </View>
        </>
      ) : (
        <>
          <Ionicons name="document-outline" size={26} color={colors.textMuted} />
          <Text style={{ fontSize: 9, fontFamily: Fonts.sans, color: colors.textMuted, textAlign: 'center', paddingHorizontal: 6 }}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

function PhotoViewer({ url, label, onClose }: { url: string; label: string; onClose: () => void }) {
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
        <Image
          source={{ uri: url }}
          style={{ flex: 1 }}
          resizeMode="contain"
        />
      </View>
    </Modal>
  );
}


export default function ApplicationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { applications, setUnderReview, requestCorrection, approveApplication, rejectApplication, liftCooldown } = useApplications();

  const app = useMemo(
    () => applications.find((a) => a.id === (Array.isArray(id) ? id[0] : id)),
    [applications, id]
  );

  const [selectedIssues, setSelectedIssues] = useState<string[]>(app?.adminFeedback?.issueIds ?? []);
  const [notes, setNotes] = useState(app?.adminFeedback?.notes ?? '');
  const [viewerPhoto, setViewerPhoto] = useState<{ url: string; label: string } | null>(null);

  const isEditable = app?.status === 'pending' || app?.status === 'under_review' || app?.status === 'needs_correction';
  const hasCooldown = app?.status === 'rejected' && !!app.cooldownUntil;

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
      app.applicationType === 'vehicle'
        ? `¿Aprobar el vehículo ${app.vehicle.brand} ${app.vehicle.model} de ${app.applicantName}? Se agregará a su perfil de conductor.`
        : `¿Aprobar la solicitud de ${app.applicantName}? Se le habilitará el modo conductor.`,
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

  const handleLiftCooldown = () => {
    if (!app) return;
    Alert.alert(
      'Levantar cooldown',
      `¿Permitir que ${app.applicantName} envíe una nueva solicitud de conductor sin esperar los 3 días?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Levantar', style: 'default',
          onPress: async () => {
            try { await liftCooldown(app.id); }
            catch (err: any) { Alert.alert('Error', err?.message ?? 'No se pudo levantar el cooldown.'); }
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
        <View style={{ gap: 4, alignItems: 'flex-end' }}>
          <View style={[styles.statusBadge, { backgroundColor: statusCfg.color + '22', borderColor: statusCfg.color + '55' }]}>
            <Text style={{ fontSize: 11, fontFamily: Fonts.headingBold, color: statusCfg.color }}>{statusCfg.label}</Text>
          </View>
          {app.applicationType === 'vehicle' && (
            <View style={[styles.statusBadge, { backgroundColor: Brand.colors.blue.normal + '22', borderColor: Brand.colors.blue.normal + '55' }]}>
              <Text style={{ fontSize: 10, fontFamily: Fonts.headingBold, color: Brand.colors.blue.normal }}>Nuevo vehículo</Text>
            </View>
          )}
          {app.isRenewal && (
            <View style={[styles.statusBadge, { backgroundColor: Brand.colors.blue.normal + '22', borderColor: Brand.colors.blue.normal + '55' }]}>
              <Text style={{ fontSize: 10, fontFamily: Fonts.headingBold, color: Brand.colors.blue.normal }}>Renovación</Text>
            </View>
          )}
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
                      {'Marcar como "En revisión"'}
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
                  {'"'}{app.adminFeedback.notes}{'"'}
                </Text>
              ) : null}
            </View>
          </Animated.View>
        )}

        {/* Applicant info — para solicitudes de vehículo solo mostramos nombre/correo/fecha */}
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
            {app.applicationType !== 'vehicle' && (
              <>
                <View style={styles.infoRow}>
                  <View style={styles.infoCell}>
                    <Text style={styles.infoKey}>Cédula</Text>
                    <Text style={styles.infoValue}>{app.cedula}</Text>
                  </View>
                  <View style={styles.infoCell}>
                    <Text style={styles.infoKey}>Intentos</Text>
                    <Text style={styles.infoValue}>{app.attempts}</Text>
                  </View>
                </View>
                <View style={styles.infoRow}>
                  <View style={[styles.infoCell, { flex: 2 }]}>
                    <Text style={styles.infoKey}>Dirección</Text>
                    <Text style={styles.infoValue}>{app.address}</Text>
                  </View>
                </View>
              </>
            )}
            <View style={styles.infoRow}>
              <View style={styles.infoCell}>
                <Text style={styles.infoKey}>Enviada</Text>
                <Text style={styles.infoValue}>
                  {new Date(app.submittedAt).toLocaleDateString('es-CR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </Text>
              </View>
              {app.applicationType === 'vehicle' && (
                <View style={styles.infoCell}>
                  <Text style={styles.infoKey}>Intentos</Text>
                  <Text style={styles.infoValue}>{app.attempts}</Text>
                </View>
              )}
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

        {/* Expiry dates — no aplica para solicitudes de vehículo */}
        {app.applicationType !== 'vehicle' && (app.licenseExpiryMonth || app.dekraExpiryMonth) && (
          <Animated.View entering={FadeInDown.duration(200).delay(155)}>
            <GlassCard style={styles.card} intensity={32}>
              <Text style={styles.sectionLabel}>Vencimientos declarados</Text>
              <View style={styles.infoRow}>
                <View style={styles.infoCell}>
                  <Text style={styles.infoKey}>Licencia vence</Text>
                  <Text style={styles.infoValue}>
                    {app.licenseExpiryMonth && app.licenseExpiryYear
                      ? `${String(app.licenseExpiryMonth).padStart(2, '0')}/${app.licenseExpiryYear}`
                      : '—'}
                  </Text>
                </View>
                <View style={styles.infoCell}>
                  <Text style={styles.infoKey}>Dekra vence</Text>
                  <Text style={styles.infoValue}>
                    {app.dekraExpiryMonth && app.dekraExpiryYear
                      ? `${String(app.dekraExpiryMonth).padStart(2, '0')}/${app.dekraExpiryYear}`
                      : '—'}
                  </Text>
                </View>
              </View>
            </GlassCard>
          </Animated.View>
        )}

        {/* Documents — ocultos para solicitudes de vehículo */}
        {app.applicationType !== 'vehicle' && <Animated.View entering={FadeInDown.duration(200).delay(160)}>
          <GlassCard style={styles.card} intensity={32}>
            <Text style={styles.sectionLabel}>Documentos adjuntos</Text>
            <View style={styles.photosRow}>
              <PhotoCard
                label="Foto de cara"
                url={app.facePhoto}
                colors={colors}
                onPress={() => app.facePhoto && setViewerPhoto({ url: app.facePhoto, label: 'Foto de cara' })}
              />
              <PhotoCard
                label="Licencia frontal"
                url={app.licensePhotoFront}
                colors={colors}
                onPress={() => app.licensePhotoFront && setViewerPhoto({ url: app.licensePhotoFront, label: 'Licencia frontal' })}
              />
              <PhotoCard
                label="Licencia trasera"
                url={app.licensePhotoBack}
                colors={colors}
                onPress={() => app.licensePhotoBack && setViewerPhoto({ url: app.licensePhotoBack, label: 'Licencia trasera' })}
              />
              <PhotoCard
                label="Dekra"
                url={app.dekraPhoto}
                colors={colors}
                onPress={() => app.dekraPhoto && setViewerPhoto({ url: app.dekraPhoto, label: 'Dekra' })}
              />
            </View>
            {!app.facePhoto && !app.licensePhotoFront && !app.licensePhotoBack && !app.dekraPhoto && (
              <Text style={{ fontSize: 11, fontFamily: Fonts.sans, color: colors.textMuted, textAlign: 'center' }}>
                El solicitante no adjuntó fotos
              </Text>
            )}
            {(app.facePhoto || app.licensePhotoFront || app.licensePhotoBack || app.dekraPhoto) && (
              <Text style={{ fontSize: 10, fontFamily: Fonts.sans, color: colors.textMuted, textAlign: 'center' }}>
                Tocá una foto para verla en pantalla completa
              </Text>
            )}
          </GlassCard>
        </Animated.View>}

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
          <Animated.View entering={FadeInDown.duration(200).delay(200)} style={{ gap: 10 }}>
            {hasCooldown && (
              <AnimatedPressable pressedScale={0.98} onPress={handleLiftCooldown}>
                <View style={[styles.btnWarning, { flexDirection: 'row', gap: 8, justifyContent: 'center' }]}>
                  <Ionicons name="timer-outline" size={17} color="#fff" />
                  <Text style={styles.btnWarningText}>Levantar cooldown</Text>
                </View>
              </AnimatedPressable>
            )}
            <Pressable style={styles.btnSecondary} onPress={() => router.back()}>
              <Text style={styles.btnSecondaryText}>Volver a solicitudes</Text>
            </Pressable>
          </Animated.View>
        )}

      </ScrollView>

      {viewerPhoto && (
        <PhotoViewer
          url={viewerPhoto.url}
          label={viewerPhoto.label}
          onClose={() => setViewerPhoto(null)}
        />
      )}
    </View>
  );
}
