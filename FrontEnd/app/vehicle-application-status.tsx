// Pantalla de estado para el conductor — muestra el pipeline de su solicitud
// de vehículo adicional (pending → under_review → approved / rejected / needs_correction).

import GlassCard from '@/components/glass-card';
import { Brand, Fonts, withElevation } from '@/constants/theme';
import { REVIEW_ISSUES } from '@/constants/mock-applications';
import { DriverApplication, useApplications } from '@/contexts/applications';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

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
    <View style={{ flexDirection: 'row', gap: 14 }}>
      <View style={{ alignItems: 'center', width: 28 }}>
        <View style={[step.dot, { borderColor: dotColor, backgroundColor: state === 'pending' ? 'transparent' : dotColor }]}>
          {state === 'done'   && <Ionicons name="checkmark" size={13} color="#fff" />}
          {state === 'active' && <View style={step.pulse} />}
          {state === 'error'  && <Ionicons name="close" size={13} color="#fff" />}
        </View>
        {!isLast && <View style={[step.line, { backgroundColor: lineColor }]} />}
      </View>
      <View style={{ flex: 1, paddingBottom: isLast ? 0 : 28, paddingTop: 2 }}>
        <Text style={[step.label, {
          color: state === 'pending' ? colors.textMuted :
                 state === 'error'   ? Brand.colors.alerts.error :
                 colors.textPrimary,
        }]}>{label}</Text>
        {sublabel && <Text style={[step.sub, { color: colors.textMuted }]}>{sublabel}</Text>}
      </View>
    </View>
  );
}

const step = StyleSheet.create({
  dot:   { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  pulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  line:  { flex: 1, width: 2, minHeight: 16, marginTop: 4 },
  label: { fontSize: 14, fontFamily: Fonts.headingBold },
  sub:   { fontSize: 12, fontFamily: Fonts.sans, marginTop: 3, lineHeight: 17 },
});

function stepsFromApp(app: DriverApplication, colors: ReturnType<typeof useAppTheme>['colors']): Array<{ state: StepState; label: string; sublabel?: string; isLast?: boolean }> {
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

function makeStyles(c: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    container:   { flex: 1, backgroundColor: c.screenBg },
    header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Brand.grid.margin, paddingVertical: 12, backgroundColor: c.screenBg },
    backBtn:     { width: 38, height: 38, borderRadius: 19, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.border, ...withElevation(100) },
    headerTitle: { flex: 1, textAlign: 'center', color: c.textPrimary, fontFamily: Fonts.headingBold, fontSize: 16 },
    content:     { paddingHorizontal: Brand.grid.margin, paddingBottom: 32, gap: 14 },
    card:        { borderRadius: Brand.radius[16], padding: Brand.spacing[16], gap: 12 },
    label:       { fontSize: 11, color: c.textMuted, fontFamily: Fonts.headingBold, textTransform: 'uppercase' },
    infoRow:     { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
    infoCell:    { flex: 1 },
    infoKey:     { fontSize: 10, color: c.textMuted, fontFamily: Fonts.sans, textTransform: 'uppercase', marginBottom: 2 },
    infoValue:   { fontSize: 13, color: c.textPrimary, fontFamily: Fonts.heading },
    feedbackBox: { borderRadius: Brand.radius[12], padding: 12, gap: 6, backgroundColor: '#ff7c2a18', borderWidth: 1, borderColor: '#ff7c2a44' },
    feedbackTitle: { fontSize: 12, color: '#ff7c2a', fontFamily: Fonts.headingBold },
    feedbackText:  { fontSize: 12, color: c.textSecondary, fontFamily: Fonts.sans, lineHeight: 18 },
    resubmitBtn: { borderRadius: 999, backgroundColor: Brand.colors.green.normal, alignItems: 'center', paddingVertical: 13 },
    resubmitText: { color: '#fff', fontFamily: Fonts.headingBold, fontSize: 14 },
    backBtnFull: { borderRadius: 999, borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceAlt, alignItems: 'center', paddingVertical: 13 },
    backBtnFullText: { color: c.textSecondary, fontFamily: Fonts.heading, fontSize: 14 },
  });
}

export default function VehicleApplicationStatusScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { myVehicleApplications } = useApplications();

  const app = useMemo(
    () => myVehicleApplications.find((a) => a.id === (Array.isArray(id) ? id[0] : id)),
    [myVehicleApplications, id]
  );

  if (!app) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: colors.textMuted, fontFamily: Fonts.heading, fontSize: 14 }}>Solicitud no encontrada</Text>
      </View>
    );
  }

  const steps = stepsFromApp(app, colors);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Estado del vehículo</Text>
        <View style={{ width: 38 }} />
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
          <Pressable style={styles.backBtnFull} onPress={() => router.back()}>
            <Text style={styles.backBtnFullText}>Volver al perfil</Text>
          </Pressable>
        </Animated.View>

      </ScrollView>
    </View>
  );
}
