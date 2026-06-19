// Pantalla de estado para el conductor — muestra el pipeline de su solicitud
// de vehículo adicional (pending → under_review → approved / rejected / needs_correction).

import GlassCard from '@/components/shared/glass-card';
import { Brand, Fonts } from '@/constants/theme';
import { REVIEW_ISSUES } from '@/constants/mock-applications';
import { DriverApplication, useApplications } from '@/contexts/applications';
import { useLoading } from '@/contexts/loading';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { stepStyles, makeStyles } from '../styles/app/vehicle-application-status.styles';

type StepState = 'done' | 'active' | 'pending' | 'error';

function PipelineStep({ state, label, sublabel, isLast = false, colors }: {
  state: StepState;
  label: string;
  sublabel?: string;
  isLast?: boolean;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  const dotColor =
    state === 'done'   ? Brand.colors.green.normal :
    state === 'active' ? Brand.colors.green.normal :
    state === 'error'  ? Brand.colors.alerts.error :
    colors.border;

  const lineColor = state === 'done' ? Brand.colors.green.normal : colors.border;

  return (
    <View style={stepStyles.stepRow}>
      <View style={stepStyles.dotColumn}>
        <View style={[stepStyles.dot, { borderColor: dotColor, backgroundColor: state === 'pending' ? 'transparent' : dotColor }]}>
          {state === 'done'   && <Ionicons name="checkmark" size={13} color="#fff" />}
          {state === 'active' && <View style={stepStyles.pulse} />}
          {state === 'error'  && <Ionicons name="close" size={13} color="#fff" />}
        </View>
        {!isLast && <View style={[stepStyles.line, { backgroundColor: lineColor }]} />}
      </View>
      <View style={[stepStyles.textColumn, { paddingBottom: isLast ? 0 : 28 }]}>
        <Text style={[stepStyles.label, {
          color: state === 'pending' ? colors.textMuted :
                 state === 'error'   ? Brand.colors.alerts.error :
                 colors.textPrimary,
        }]}>{label}</Text>
        {sublabel && <Text style={[stepStyles.sub, { color: colors.textMuted }]}>{sublabel}</Text>}
      </View>
    </View>
  );
}


function stepsFromApp(app: DriverApplication, colors: ReturnType<typeof useAppTheme>['colors']): { state: StepState; label: string; sublabel?: string; isLast?: boolean }[] {
  const s = app.status;
  const submitted:      StepState = 'done';
  const underReview:    StepState = s === 'pending' ? 'pending' : s === 'approved' || s === 'rejected' ? 'done' : 'active';
  const resultState:    StepState = s === 'approved' ? 'done' : s === 'rejected' ? 'error' : s === 'needs_correction' ? 'error' : 'pending';

  const resultLabel =
    s === 'approved'         ? 'Vehículo aprobado' :
    s === 'rejected'         ? 'Solicitud rechazada' :
    s === 'needs_correction' ? 'Requiere corrección' :
    'Decisión final';

  const resultSub =
    s === 'approved'         ? 'El vehículo ya está disponible en tu perfil de conductor.' :
    s === 'rejected'         ? (app.adminFeedback?.notes ?? 'El administrador rechazó la solicitud.') :
    s === 'needs_correction' ? 'El administrador encontró un problema. Reenviá la solicitud.' :
    'El admin revisará y tomará una decisión.';

  return [
    { state: submitted,   label: 'Solicitud enviada',    sublabel: `${app.vehicle.brand} ${app.vehicle.model} · ${app.vehicle.plate}` },
    { state: underReview, label: 'En revisión',          sublabel: s === 'pending' ? 'Esperando que el admin comience la revisión.' : undefined },
    { state: resultState, label: resultLabel, sublabel: resultSub, isLast: true },
  ];
}

export default function VehicleApplicationStatusScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { myVehicleApplications } = useApplications();
  const { showLoader, hideLoader } = useLoading();

  const app = useMemo(
    () => myVehicleApplications.find((a) => a.id === (Array.isArray(id) ? id[0] : id)),
    [myVehicleApplications, id]
  );

  if (!app) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={[stepStyles.notFoundText, { color: colors.textMuted, fontFamily: Fonts.heading }]}>Solicitud no encontrada</Text>
      </View>
    );
  }

  const steps = stepsFromApp(app, colors);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => { showLoader(); router.back(); setTimeout(() => hideLoader(), 300); }} hitSlop={8}>
          <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Estado del vehículo</Text>
        <View style={stepStyles.spacerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Pipeline */}
        <Animated.View entering={FadeInDown.duration(200)}>
          <GlassCard style={styles.card} intensity={32}>
            <Text style={styles.label}>Estado de la solicitud</Text>
            {steps.map((s, i) => (
              <PipelineStep key={i} {...s} colors={colors} />
            ))}
          </GlassCard>
        </Animated.View>

        {/* Datos del vehículo */}
        <Animated.View entering={FadeInDown.duration(200).delay(60)}>
          <GlassCard style={styles.card} intensity={32}>
            <Text style={styles.label}>Vehículo solicitado</Text>
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

        {/* Feedback del admin si hay corrección */}
        {app.adminFeedback && app.status === 'needs_correction' && (
          <Animated.View entering={FadeInDown.duration(200).delay(100)}>
            <View style={styles.feedbackBox}>
              <Text style={styles.feedbackTitle}>Problemas indicados por el admin</Text>
              {app.adminFeedback.issueIds.map((issueId) => {
                const issue = REVIEW_ISSUES.find((i) => i.id === issueId);
                return issue
                  ? <Text key={issueId} style={styles.feedbackText}>• {issue.label}</Text>
                  : null;
              })}
              {app.adminFeedback.notes ? (
                <Text style={[styles.feedbackText, { fontStyle: 'italic', marginTop: 4 }]}>
                  {'"'}{app.adminFeedback.notes}{'"'}
                </Text>
              ) : null}
            </View>
          </Animated.View>
        )}

        {/* Acción: reenviar si necesita corrección */}
        {app.status === 'needs_correction' && (
          <Animated.View entering={FadeInDown.duration(200).delay(140)}>
            <Pressable style={styles.resubmitBtn} onPress={() => router.push('/add-vehicle')}>
              <Text style={styles.resubmitText}>Registrar nuevo vehículo</Text>
            </Pressable>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.duration(200).delay(160)}>
          <Pressable style={styles.backBtnFull} onPress={() => { showLoader(); router.back(); setTimeout(() => hideLoader(), 300); }}>
            <Text style={styles.backBtnFullText}>Volver al perfil</Text>
          </Pressable>
        </Animated.View>

      </ScrollView>
    </View>
  );
}
