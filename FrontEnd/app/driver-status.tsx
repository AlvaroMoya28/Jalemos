// Driver application status screen — shown after a passenger submits a driver registration.
// Displays a pipeline timeline (submitted → under review → result) and allows the user
// to resubmit corrected documents when the admin requests changes.

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

import GlassCard from '@/components/shared/glass-card';
import { Brand } from '@/constants/theme';
import { makeStyles, stepStyles } from '../styles/app/driver-status.styles';
import { REVIEW_ISSUES } from '@/constants/mock-applications';
import { useApplications } from '@/contexts/applications';
import { useAuth } from '@/contexts/auth';
import { useLoading } from '@/contexts/loading';
import { useUserMode } from '@/contexts/user-mode';
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


export default function DriverStatusScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { upgradeToDriver, setDriverActivated } = useAuth();
  const { setMode } = useUserMode();
  const { myApplication: application, myApplicationLoading, loadMyApplication } = useApplications();
  const { showLoader, hideLoader } = useLoading();

  // Load on mount and keep fresh
  useEffect(() => { loadMyApplication(); }, [loadMyApplication]);

  const status = application?.status ?? 'pending';

  const cooldownUntil = application?.cooldownUntil ? new Date(application.cooldownUntil) : null;
  const cooldownActive = cooldownUntil ? cooldownUntil > new Date() : false;
  const cooldownDaysLeft = cooldownUntil && cooldownActive
    ? Math.ceil((cooldownUntil.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

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

  const handleActivateDriver = async () => {
    showLoader('Activando modo conductor...');
    try {
      const role = await upgradeToDriver();
      if (role !== 'passenger+driver') {
        Alert.alert(
          'Rol retirado',
          'Un administrador quitó tu rol de conductor. Debés enviar una nueva solicitud para volver a conducir.',
          [{ text: 'Entendido', onPress: () => router.back() }]
        );
        return;
      }
      await setDriverActivated(true);
      setMode('driver');
      router.replace('/(tabs)/offer');
    } finally {
      hideLoader();
    }
  };

  const handleResubmit = () => {
    router.push('/driver-registration');
  };

  if (myApplicationLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, alignItems: 'center', justifyContent: 'center' }]}>
        <Ionicons name="time-outline" size={48} color={colors.textMuted} />
        <Text style={[styles.successBody, { marginTop: 12 }]}>Cargando solicitud...</Text>
      </View>
    );
  }

  if (!application) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, alignItems: 'center', justifyContent: 'center' }]}>
        <Ionicons name="document-outline" size={48} color={colors.textMuted} />
        <Text style={[styles.successBody, { marginTop: 12 }]}>No hay ninguna solicitud activa</Text>
        <Pressable style={[styles.secondaryBtn, { marginTop: 16, paddingHorizontal: 24 }]} onPress={() => { showLoader(); router.back(); setTimeout(() => hideLoader(), 300); }}>
          <Text style={styles.secondaryBtnText}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => { showLoader(); router.back(); setTimeout(() => hideLoader(), 300); }} hitSlop={8}>
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
                  <Text style={styles.adminNotes}>{'"'}{application.adminFeedback.notes}{'"'}</Text>
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
                <Text style={styles.primaryBtnText}>Empezar a ofrecer viajes</Text>
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
            <Pressable style={styles.secondaryBtn} onPress={() => { showLoader(); router.back(); setTimeout(() => hideLoader(), 300); }}>
              <Text style={styles.secondaryBtnText}>Volver al perfil</Text>
            </Pressable>
          </Animated.View>
        ) : null}

        {status === 'rejected' ? (
          <Animated.View entering={FadeInDown.duration(240).delay(200)} style={{ gap: 10 }}>
            {cooldownActive ? (
              <View style={styles.cooldownBanner}>
                <Ionicons name="time-outline" size={16} color={Brand.colors.alerts.error} />
                <Text style={styles.cooldownText}>
                  Podés volver a solicitar en {cooldownDaysLeft === 1 ? '1 día' : `${cooldownDaysLeft} días`}
                </Text>
              </View>
            ) : null}
            <Pressable
              style={[styles.primaryBtn, cooldownActive && { opacity: 0.45 }]}
              onPress={cooldownActive ? undefined : () => router.push('/driver-registration')}
              disabled={cooldownActive}
            >
              <Text style={styles.primaryBtnText}>Nueva solicitud</Text>
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={() => { showLoader(); router.back(); setTimeout(() => hideLoader(), 300); }}>
              <Text style={styles.secondaryBtnText}>Volver al perfil</Text>
            </Pressable>
          </Animated.View>
        ) : null}

        {(status === 'pending' || status === 'under_review') ? (
          <Animated.View entering={FadeInDown.duration(240).delay(200)}>
            <Pressable style={styles.secondaryBtn} onPress={() => { showLoader(); router.back(); setTimeout(() => hideLoader(), 300); }}>
              <Text style={styles.secondaryBtnText}>Volver al perfil</Text>
            </Pressable>
          </Animated.View>
        ) : null}

      </ScrollView>
    </View>
  );
}
