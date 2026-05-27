// Admin tab — driver application queue.
// Lists all driver applications with status badges. Tapping one opens the full review screen.

import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import AnimatedPressable from '@/components/animated-pressable';
import GlassCard from '@/components/glass-card';
import { Brand, Fonts, withElevation } from '@/constants/theme';
import { ApplicationStatus, DriverApplication } from '@/contexts/applications';
import { useApplications } from '@/contexts/applications';
import { useAppTheme } from '@/hooks/use-app-theme';

type Filter = 'all' | ApplicationStatus;

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; color: string; icon: string }> = {
  pending:          { label: 'Pendiente',          color: '#f7a900',                        icon: 'time-outline' },
  under_review:     { label: 'En revisión',         color: Brand.colors.blue.normal,         icon: 'eye-outline' },
  needs_correction: { label: 'Corrección',          color: '#ff7c2a',                        icon: 'alert-circle-outline' },
  approved:         { label: 'Aprobada',            color: Brand.colors.green.normal,        icon: 'checkmark-circle-outline' },
  rejected:         { label: 'Rechazada',           color: Brand.colors.alerts.error,        icon: 'close-circle-outline' },
};

function StatusBadge({ status }: { status: ApplicationStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <View style={[badge.wrap, { backgroundColor: cfg.color + '22', borderColor: cfg.color + '55' }]}>
      <Text style={[badge.text, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}
const badge = StyleSheet.create({
  wrap: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  text: { fontSize: 11, fontFamily: Fonts.headingBold },
});

function makeStyles(c: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.screenBg },
    heroHeader: {
      paddingHorizontal: Brand.grid.margin,
      paddingTop: 58,
      paddingBottom: 14,
    },
    heroMini: { color: Brand.colors.green.light, fontSize: 13, fontFamily: Fonts.heading },
    heroTitle: { color: Brand.colors.black.b1, fontSize: 28, fontFamily: Fonts.headingHeavy },
    surface: {
      backgroundColor: c.bottomSurface,
      borderTopLeftRadius: Brand.radius[24],
      borderTopRightRadius: Brand.radius[24],
      flex: 1,
    },
    scrollContent: { paddingTop: 16, paddingBottom: 40 },
    chipsRow: {
      flexDirection: 'row', flexWrap: 'wrap', gap: 8,
      paddingHorizontal: Brand.grid.margin, paddingBottom: 14,
    },
    filterChip: {
      borderRadius: 999, borderWidth: 1,
      paddingHorizontal: 12, paddingVertical: 6,
      overflow: 'hidden',
    },
    filterChipText: { fontSize: 12, fontFamily: Fonts.heading },
    list: { paddingHorizontal: Brand.grid.margin, gap: 10 },
    card: { borderRadius: Brand.radius[16], padding: Brand.spacing[16] },
    cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
    avatar: {
      width: 42, height: 42, borderRadius: 21,
      backgroundColor: Brand.colors.green.light,
      alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    },
    avatarText: { fontSize: 15, color: Brand.colors.green.darker, fontFamily: Fonts.headingBold },
    nameBlock: { flex: 1 },
    name: { fontSize: 14, color: c.textPrimary, fontFamily: Fonts.headingBold },
    email: { fontSize: 11, color: c.textMuted, fontFamily: Fonts.sans, marginTop: 1 },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: c.border, marginBottom: 10 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    vehicleText: { fontSize: 13, color: c.textSecondary, fontFamily: Fonts.heading },
    plateText: { fontSize: 13, color: c.textPrimary, fontFamily: Fonts.headingBold },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    metaText: { fontSize: 11, color: c.textMuted, fontFamily: Fonts.sans },
    emptyState: { alignItems: 'center', paddingVertical: 40, gap: 10 },
    emptyText: { color: c.textMuted, fontFamily: Fonts.heading, fontSize: 14 },
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminApplicationsScreen() {
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation();
  const router = useRouter();
  const { applications, loadApplications, applicationsLoading } = useApplications();
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => { loadApplications(); }, []);

  useEffect(() => {
    navigation.setOptions({ title: 'Solicitudes', icon: { sf: 'doc.text' } });
  }, [navigation]);

  const filtered = useMemo(() =>
    filter === 'all' ? applications : applications.filter((a) => a.status === filter),
    [applications, filter]
  );

  const counts: Record<Filter, number> = useMemo(() => ({
    all:              applications.length,
    pending:          applications.filter((a) => a.status === 'pending').length,
    under_review:     applications.filter((a) => a.status === 'under_review').length,
    needs_correction: applications.filter((a) => a.status === 'needs_correction').length,
    approved:         applications.filter((a) => a.status === 'approved').length,
    rejected:         applications.filter((a) => a.status === 'rejected').length,
  }), [applications]);

  const filters: { key: Filter; label: string }[] = [
    { key: 'all',              label: `Todas (${counts.all})` },
    { key: 'pending',          label: `Pendientes (${counts.pending})` },
    { key: 'under_review',     label: `En revisión (${counts.under_review})` },
    { key: 'needs_correction', label: `Corrección (${counts.needs_correction})` },
    { key: 'approved',         label: `Aprobadas (${counts.approved})` },
    { key: 'rejected',         label: `Rechazadas (${counts.rejected})` },
  ];

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.screenBg : '#0a3f39' }]}>
      <View style={styles.heroHeader}>
        <Text style={styles.heroMini}>Panel de administración</Text>
        <Text style={styles.heroTitle}>Solicitudes</Text>
      </View>

      <View style={styles.surface}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Filter chips */}
          <View style={styles.chipsRow}>
            {filters.map((f) => {
              const active = filter === f.key;
              return (
                <Pressable
                  key={f.key}
                  style={[styles.filterChip, {
                    backgroundColor: active ? Brand.colors.green.normal : colors.surfaceAlt,
                    borderColor: active ? Brand.colors.green.normal : colors.border,
                  }]}
                  onPress={() => setFilter(f.key)}
                >
                  <Text style={[styles.filterChipText, { color: active ? '#fff' : colors.textSecondary }]}>
                    {f.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Cards */}
          <View style={styles.list}>
            {filtered.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="documents-outline" size={40} color={colors.textMuted} />
                <Text style={styles.emptyText}>No hay solicitudes en esta categoría</Text>
              </View>
            ) : (
              filtered.map((app, idx) => (
                <Animated.View key={app.id} entering={FadeInDown.duration(200).delay(idx * 40)}>
                  <AnimatedPressable
                    pressedScale={0.99}
                    onPress={() => router.push({ pathname: '/application-detail', params: { id: app.id } })}
                  >
                    <GlassCard style={styles.card} intensity={32}>
                      <View style={styles.cardTop}>
                        <View style={styles.avatar}>
                          <Text style={styles.avatarText}>{app.applicantAvatar}</Text>
                        </View>
                        <View style={styles.nameBlock}>
                          <Text style={styles.name}>{app.applicantName}</Text>
                          <Text style={styles.email}>{app.applicantEmail}</Text>
                        </View>
                        <StatusBadge status={app.status} />
                      </View>

                      <View style={styles.divider} />

                      <View style={styles.detailRow}>
                        <Text style={styles.vehicleText}>
                          {app.vehicle.brand} {app.vehicle.model} {app.vehicle.year}
                        </Text>
                        <Text style={styles.plateText}>{app.vehicle.plate}</Text>
                      </View>
                      <View style={styles.metaRow}>
                        <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
                        <Text style={styles.metaText}>{formatDate(app.submittedAt)}</Text>
                        {app.attempts > 1 && (
                          <>
                            <View style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: colors.textMuted }} />
                            <Text style={styles.metaText}>Intento #{app.attempts}</Text>
                          </>
                        )}
                      </View>
                    </GlassCard>
                  </AnimatedPressable>
                </Animated.View>
              ))
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
