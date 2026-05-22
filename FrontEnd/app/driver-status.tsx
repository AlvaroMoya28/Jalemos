// Driver application status screen — shown after a passenger submits a driver registration.
// Displays a pipeline timeline (submitted → under review → result) and allows the user
// to resubmit corrected documents when the admin requests changes.

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

import GlassCard from '@/components/glass-card';
import { Brand, Fonts, withElevation } from '@/constants/theme';
import { REVIEW_ISSUES } from '@/constants/mock-applications';
import { useApplications } from '@/contexts/applications';
import { useAuth } from '@/contexts/auth';
import { useAppTheme } from '@/hooks/use-app-theme';

type StepState = 'done' | 'active' | 'pending' | 'error';

function PipelineStep({
  state,
  label,
  sublabel,
  isLast = false,
  colors,
}: {
  state: StepState;
  label: string;
  sublabel?: string;
  isLast?: boolean;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  const dotColor =
    state === 'done' ? Brand.colors.green.normal :
    state === 'active' ? Brand.colors.green.normal :
    state === 'error' ? Brand.colors.alerts.error :
    colors.border;

  const lineColor = state === 'done' ? Brand.colors.green.normal : colors.border;

  return (
    <View style={{ flexDirection: 'row', gap: 14 }}>
      <View style={{ alignItems: 'center', width: 28 }}>
        <View style={[
          stepStyles.dot,
          { borderColor: dotColor, backgroundColor: state === 'pending' ? 'transparent' : dotColor },
        ]}>
          {state === 'done' && <Ionicons name="checkmark" size={13} color="#fff" />}
          {state === 'active' && <View style={stepStyles.activePulse} />}
          {state === 'error' && <Ionicons name="close" size={13} color="#fff" />}
        </View>
        {!isLast && <View style={[stepStyles.line, { backgroundColor: lineColor }]} />}
      </View>
      <View style={{ flex: 1, paddingBottom: isLast ? 0 : 28, paddingTop: 2 }}>
        <Text style={[stepStyles.label, {
          color: state === 'pending' ? colors.textMuted :
                 state === 'error' ? Brand.colors.alerts.error :
                 colors.textPrimary,
        }]}>{label}</Text>
        {sublabel ? (
          <Text style={[stepStyles.sublabel, { color: colors.textMuted }]}>{sublabel}</Text>
        ) : null}
      </View>
    </View>
  );
}

const stepStyles = StyleSheet.create({
  dot: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  activePulse: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: Brand.colors.black.b1,
  },
  line: {
    width: 2, flex: 1, minHeight: 24, marginTop: 4,
  },
  label: {
    fontSize: 14,
    fontFamily: Fonts.headingBold,
  },
  sublabel: {
    fontSize: 12,
    fontFamily: Fonts.sans,
    marginTop: 2,
    lineHeight: 17,
  },
});

function makeStyles(c: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.screenBg },
    header: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: Brand.grid.margin,
      paddingVertical: 12,
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
      color: c.textPrimary,
      fontFamily: Fonts.headingBold,
      fontSize: 16,
    },
    content: {
      paddingHorizontal: Brand.grid.margin,
      paddingBottom: 32,
      gap: 16,
    },
    statusBadge: {
      alignSelf: 'flex-start',
      flexDirection: 'row', alignItems: 'center', gap: 6,
      borderRadius: 999,
      paddingHorizontal: 12, paddingVertical: 6,
      borderWidth: 1,
    },
    statusBadgeText: {
      fontSize: 12,
      fontFamily: Fonts.headingBold,
    },
    card: {
      borderRadius: Brand.radius[16],
      padding: Brand.spacing[16],
      gap: 12,
    },
    sectionTitle: {
      fontSize: 13,
      color: c.textMuted,
      fontFamily: Fonts.headingBold,
      textTransform: 'uppercase',
      marginBottom: 4,
    },
    issueItem: {
      flexDirection: 'row', alignItems: 'flex-start', gap: 8,
      paddingVertical: 6,
    },
    issueText: {
      flex: 1,
      fontSize: 13,
      color: c.textSecondary,
      fontFamily: Fonts.sans,
      lineHeight: 18,
    },
    adminNotes: {
      fontSize: 13,
      color: c.textSecondary,
      fontFamily: Fonts.sans,
      lineHeight: 19,
      fontStyle: 'italic',
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.border,
    },
    successIcon: {
      width: 64, height: 64, borderRadius: 32,
      backgroundColor: Brand.colors.green.normal + '22',
      alignItems: 'center', justifyContent: 'center',
      alignSelf: 'center',
      borderWidth: 2,
      borderColor: Brand.colors.green.normal,
    },
    successTitle: {
      fontSize: 18,
      color: c.textPrimary,
      fontFamily: Fonts.headingBold,
      textAlign: 'center',
    },
    successBody: {
      fontSize: 13,
      color: c.textSecondary,
      fontFamily: Fonts.sans,
      textAlign: 'center',
      lineHeight: 19,
    },
    primaryBtn: {
      backgroundColor: Brand.colors.green.normal,
      borderRadius: 999,
      alignItems: 'center',
      paddingVertical: 14,
    },
    primaryBtnText: {
      color: Brand.colors.black.b1,
      fontFamily: Fonts.headingBold,
      fontSize: 14,
    },
    secondaryBtn: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      paddingVertical: 13,
    },
    secondaryBtnText: {
      color: c.textSecondary,
      fontFamily: Fonts.heading,
      fontSize: 14,
    },
    vehicleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    vehicleLabel: {
      fontSize: 11,
      color: c.textMuted,
      fontFamily: Fonts.sans,
      textTransform: 'uppercase',
    },
    vehicleValue: {
      fontSize: 13,
      color: c.textPrimary,
      fontFamily: Fonts.heading,
    },
  });
}

export default function DriverStatusScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, upgradeToDriver } = useAuth();
  const { getMyApplication } = useApplications();

  const application = user ? getMyApplication(user.id) : undefined;
  const status = application?.status ?? 'pending';

  const statusConfig = {
    pending:          { label: 'Pendiente',           color: '#f7a900', bg: '#f7a90022' },
    under_review:     { label: 'En revisión',          color: Brand.colors.blue.normal, bg: Brand.colors.blue.normal + '22' },
    needs_correction: { label: 'Requiere corrección',  color: '#ff7c2a', bg: '#ff7c2a22' },
    approved:         { label: 'Aprobada',             color: Brand.colors.green.normal, bg: Brand.colors.green.normal + '22' },
    rejected:         { label: 'Rechazada',            color: Brand.colors.alerts.error, bg: Brand.colors.alerts.error + '22' },
  };

  const cfg = statusConfig[status];

  // Pipeline step states
  const step1: StepState = 'done';
  const step2: StepState =
    status === 'pending' ? 'active' :
    status === 'under_review' ? 'active' : 'done';
  const step3: StepState =
    status === 'pending' || status === 'under_review' ? 'pending' :
    status === 'approved' ? 'done' :
    status === 'needs_correction' ? 'error' :
    status === 'rejected' ? 'error' : 'pending';

  const step3Label =
    status === 'approved' ? 'Solicitud aprobada' :
    status === 'rejected' ? 'Solicitud rechazada' :
    status === 'needs_correction' ? 'Se requieren correcciones' :
    'Resultado';

  const handleActivateDriver = () => {
    upgradeToDriver();
    router.replace('/(tabs)/search');
  };

  const handleResubmit = () => {
    router.push('/driver-registration');
  };

  if (!application) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, alignItems: 'center', justifyContent: 'center' }]}>
        <Ionicons name="document-outline" size={48} color={colors.textMuted} />
        <Text style={[styles.successBody, { marginTop: 12 }]}>No hay ninguna solicitud activa</Text>
        <Pressable style={[styles.secondaryBtn, { marginTop: 16, paddingHorizontal: 24 }]} onPress={() => router.back()}>
          <Text style={styles.secondaryBtnText}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Solicitud de conductor</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Status badge */}
        <Animated.View entering={FadeInDown.duration(240).delay(40)}>
          <View style={[styles.statusBadge, { backgroundColor: cfg.bg, borderColor: cfg.color }]}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: cfg.color }} />
            <Text style={[styles.statusBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </Animated.View>

        {/* Pipeline */}
        <Animated.View entering={FadeInDown.duration(240).delay(80)}>
          <GlassCard style={styles.card} intensity={32}>
            <Text style={styles.sectionTitle}>Progreso</Text>
            <PipelineStep
              state={step1}
              label="Solicitud enviada"
              sublabel={new Date(application.submittedAt).toLocaleDateString('es-CR', { day: 'numeric', month: 'long', year: 'numeric' })}
              colors={colors}
            />
            <PipelineStep
              state={step2}
              label="En revisión"
              sublabel={step2 === 'active' && status === 'under_review' ? 'Un administrador está revisando tu solicitud' : undefined}
              colors={colors}
            />
            <PipelineStep
              state={step3}
              label={step3Label}
              isLast
              colors={colors}
            />
          </GlassCard>
        </Animated.View>

        {/* Vehicle summary */}
        <Animated.View entering={FadeInDown.duration(240).delay(120)}>
          <GlassCard style={styles.card} intensity={32}>
            <Text style={styles.sectionTitle}>Vehículo registrado</Text>
            <View style={styles.vehicleRow}>
              <View>
                <Text style={styles.vehicleLabel}>Vehículo</Text>
                <Text style={styles.vehicleValue}>{application.vehicle.brand} {application.vehicle.model} {application.vehicle.year}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.vehicleLabel}>Placa</Text>
                <Text style={styles.vehicleValue}>{application.vehicle.plate}</Text>
              </View>
            </View>
            {application.attempts > 1 && (
              <Text style={[styles.vehicleLabel, { marginTop: 4 }]}>Intento #{application.attempts}</Text>
            )}
          </GlassCard>
        </Animated.View>

        {/* Needs correction — show issues */}
        {(status === 'needs_correction' || status === 'rejected') && application.adminFeedback ? (
          <Animated.View entering={FadeInDown.duration(240).delay(160)}>
            <GlassCard style={[styles.card, {
              borderColor: status === 'rejected' ? Brand.colors.alerts.error + '55' : '#ff7c2a55',
            }]} intensity={28}>
              <Text style={[styles.sectionTitle, {
                color: status === 'rejected' ? Brand.colors.alerts.error : '#ff7c2a',
              }]}>
                {status === 'rejected' ? 'Motivos del rechazo' : 'Correcciones solicitadas'}
              </Text>
              {application.adminFeedback.issueIds.map((issueId) => {
                const issue = REVIEW_ISSUES.find((i) => i.id === issueId);
                return issue ? (
                  <View key={issueId} style={styles.issueItem}>
                    <Ionicons
                      name={status === 'rejected' ? 'close-circle' : 'alert-circle'}
                      size={16}
                      color={status === 'rejected' ? Brand.colors.alerts.error : '#ff7c2a'}
                    />
                    <Text style={styles.issueText}>{issue.label}</Text>
                  </View>
                ) : null;
              })}
              {application.adminFeedback.notes ? (
                <>
                  <View style={styles.divider} />
                  <Text style={styles.adminNotes}>"{application.adminFeedback.notes}"</Text>
                </>
              ) : null}
            </GlassCard>
          </Animated.View>
        ) : null}

        {/* Approved */}
        {status === 'approved' ? (
          <Animated.View entering={FadeInDown.duration(240).delay(160)}>
            <GlassCard style={styles.card} intensity={32}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark" size={32} color={Brand.colors.green.normal} />
              </View>
              <Text style={styles.successTitle}>¡Felicidades!</Text>
              <Text style={styles.successBody}>
                Tu solicitud fue aprobada. Ya podés activar el modo conductor desde tu perfil o directamente desde aquí.
              </Text>
              <Pressable style={styles.primaryBtn} onPress={handleActivateDriver}>
                <Text style={styles.primaryBtnText}>Activar modo conductor</Text>
              </Pressable>
            </GlassCard>
          </Animated.View>
        ) : null}

        {/* Actions */}
        {status === 'needs_correction' ? (
          <Animated.View entering={FadeInDown.duration(240).delay(200)} style={{ gap: 10 }}>
            <Pressable style={styles.primaryBtn} onPress={handleResubmit}>
              <Text style={styles.primaryBtnText}>Corregir y reenviar solicitud</Text>
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={() => router.back()}>
              <Text style={styles.secondaryBtnText}>Volver al perfil</Text>
            </Pressable>
          </Animated.View>
        ) : null}

        {(status === 'pending' || status === 'under_review') ? (
          <Animated.View entering={FadeInDown.duration(240).delay(200)}>
            <Pressable style={styles.secondaryBtn} onPress={() => router.back()}>
              <Text style={styles.secondaryBtnText}>Volver al perfil</Text>
            </Pressable>
          </Animated.View>
        ) : null}

      </ScrollView>
    </View>
  );
}
