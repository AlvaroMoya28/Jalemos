// Admin tab — user reports moderation panel.
// Lists all reports with status and reason. Tapping one opens an action bottom sheet
// where the admin can suspend the user for N days, deactivate their account, or dismiss.

import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown, SlideInDown, SlideOutDown } from 'react-native-reanimated';

import AnimatedPressable from '@/components/animated-pressable';
import GlassCard from '@/components/glass-card';
import { Brand, Fonts, withElevation } from '@/constants/theme';
import {
  UserReport,
  ReportStatus,
  REPORT_REASON_LABELS,
} from '@/constants/mock-reports';
import { useApplications } from '@/contexts/applications';
import { useAppTheme } from '@/hooks/use-app-theme';

type Filter = 'all' | ReportStatus;

const REASON_COLORS: Record<string, string> = {
  bad_behavior:      '#ff7c2a',
  dangerous_driving: Brand.colors.alerts.error,
  no_show:           '#f7a900',
  late_cancellation: '#f7a900',
  harassment:        Brand.colors.alerts.error,
  vehicle_condition: '#9c6bff',
  other:             Brand.colors.black.b6,
};

const SUSPENSION_OPTIONS = [
  { days: 1,  label: '1 día' },
  { days: 3,  label: '3 días' },
  { days: 7,  label: '7 días' },
  { days: 30, label: '30 días' },
];

function makeStyles(c: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.screenBg },
    heroHeader: {
      paddingHorizontal: Brand.grid.margin,
      paddingTop: 58, paddingBottom: 14,
    },
    heroMini: { color: Brand.colors.green.light, fontSize: 13, fontFamily: Fonts.heading },
    heroTitle: { color: Brand.colors.black.b1, fontSize: 28, fontFamily: Fonts.headingHeavy },
    surface: {
      backgroundColor: c.bottomSurface,
      borderTopLeftRadius: Brand.radius[24],
      borderTopRightRadius: Brand.radius[24],
      flex: 1,
      paddingTop: 16,
    },
    filterRow: {
      flexDirection: 'row', gap: 8,
      paddingHorizontal: Brand.grid.margin,
      paddingBottom: 14,
    },
    filterChip: {
      borderRadius: 999, borderWidth: 1,
      paddingHorizontal: 14, paddingVertical: 7,
    },
    filterChipText: { fontSize: 12, fontFamily: Fonts.heading },
    list: { paddingHorizontal: Brand.grid.margin, gap: 10, paddingBottom: 24 },
    card: { borderRadius: Brand.radius[16], padding: Brand.spacing[16], gap: 10 },
    cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    avatar: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: Brand.colors.green.light,
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    avatarText: { fontSize: 14, color: Brand.colors.green.darker, fontFamily: Fonts.headingBold },
    cardInfo: { flex: 1 },
    reportedName: { fontSize: 14, color: c.textPrimary, fontFamily: Fonts.headingBold },
    reportedRole: { fontSize: 11, color: c.textMuted, fontFamily: Fonts.sans, marginTop: 1 },
    reasonBadge: {
      borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3,
      borderWidth: 1,
    },
    reasonText: { fontSize: 11, fontFamily: Fonts.headingBold },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: c.border },
    detailsText: {
      fontSize: 12, color: c.textSecondary,
      fontFamily: Fonts.sans, lineHeight: 17,
    },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    metaText: { fontSize: 11, color: c.textMuted, fontFamily: Fonts.sans },
    resolvedBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3,
    },
    resolvedText: { fontSize: 11, fontFamily: Fonts.headingBold },
    emptyState: { alignItems: 'center', paddingVertical: 40, gap: 10 },
    emptyText: { color: c.textMuted, fontFamily: Fonts.heading, fontSize: 14 },
    // Action sheet
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: Brand.radius[24],
      borderTopRightRadius: Brand.radius[24],
      paddingHorizontal: Brand.grid.margin,
      paddingTop: 16,
      paddingBottom: 32,
      gap: 14,
    },
    sheetHandle: {
      width: 40, height: 4, borderRadius: 2,
      backgroundColor: c.border, alignSelf: 'center', marginBottom: 4,
    },
    sheetTitle: { fontSize: 16, color: c.textPrimary, fontFamily: Fonts.headingBold, textAlign: 'center' },
    sheetReported: { fontSize: 13, color: c.textMuted, fontFamily: Fonts.sans, textAlign: 'center', marginTop: -6 },
    sheetSection: { fontSize: 11, color: c.textMuted, fontFamily: Fonts.headingBold, textTransform: 'uppercase' },
    suspensionRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    suspensionChip: {
      flex: 1, minWidth: 70,
      borderRadius: 999, borderWidth: 1,
      borderColor: '#ff7c2a55', backgroundColor: '#ff7c2a18',
      alignItems: 'center', paddingVertical: 10,
    },
    suspensionChipText: { color: '#ff7c2a', fontFamily: Fonts.headingBold, fontSize: 13 },
    btnDeactivate: {
      borderRadius: 999, backgroundColor: Brand.colors.alerts.error,
      alignItems: 'center', paddingVertical: 13,
    },
    btnDeactivateText: { color: '#fff', fontFamily: Fonts.headingBold, fontSize: 14 },
    btnDismiss: {
      borderRadius: 999, borderWidth: 1,
      borderColor: c.border, backgroundColor: c.surfaceAlt,
      alignItems: 'center', paddingVertical: 13,
    },
    btnDismissText: { color: c.textSecondary, fontFamily: Fonts.heading, fontSize: 14 },
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function ResolvedLabel({ report }: { report: UserReport }) {
  if (!report.adminAction) return null;
  const config = {
    suspended:   { label: `Suspendido ${report.adminAction.suspensionDays}d`, color: '#ff7c2a' },
    deactivated: { label: 'Cuenta desactivada', color: Brand.colors.alerts.error },
    dismissed:   { label: 'Desestimado', color: Brand.colors.black.b6 },
  }[report.adminAction.type];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: config.color + '22', borderRadius: 999, borderWidth: 1,
      borderColor: config.color + '55', paddingHorizontal: 8, paddingVertical: 3 }}>
      <Text style={{ fontSize: 11, fontFamily: Fonts.headingBold, color: config.color }}>{config.label}</Text>
    </View>
  );
}

export default function AdminReportsScreen() {
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation();
  const { reports, suspendUserFromReport, deactivateUserFromReport, dismissReport } = useApplications();
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedReport, setSelectedReport] = useState<UserReport | null>(null);

  useEffect(() => {
    navigation.setOptions({ title: 'Reportes', icon: { sf: 'flag' } });
  }, [navigation]);

  const filtered = useMemo(() =>
    filter === 'all' ? reports : reports.filter((r) => r.status === filter),
    [reports, filter]
  );

  const counts = useMemo(() => ({
    all:       reports.length,
    pending:   reports.filter((r) => r.status === 'pending').length,
    resolved:  reports.filter((r) => r.status === 'resolved').length,
    dismissed: reports.filter((r) => r.status === 'dismissed').length,
  }), [reports]);

  const filterList: { key: Filter; label: string }[] = [
    { key: 'all',       label: `Todos (${counts.all})` },
    { key: 'pending',   label: `Pendientes (${counts.pending})` },
    { key: 'resolved',  label: `Resueltos (${counts.resolved})` },
    { key: 'dismissed', label: `Desestimados (${counts.dismissed})` },
  ];

  const handleSuspend = (days: number) => {
    if (!selectedReport) return;
    suspendUserFromReport(selectedReport.id, days);
    setSelectedReport(null);
  };

  const handleDeactivate = () => {
    if (!selectedReport) return;
    deactivateUserFromReport(selectedReport.id);
    setSelectedReport(null);
  };

  const handleDismiss = () => {
    if (!selectedReport) return;
    dismissReport(selectedReport.id);
    setSelectedReport(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.screenBg : '#0a3f39' }]}>
      <View style={styles.heroHeader}>
        <Text style={styles.heroMini}>Panel de administración</Text>
        <Text style={styles.heroTitle}>Reportes</Text>
      </View>

      <View style={styles.surface}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {filterList.map((f) => {
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
        </ScrollView>

        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="flag-outline" size={40} color={colors.textMuted} />
              <Text style={styles.emptyText}>No hay reportes en esta categoría</Text>
            </View>
          ) : (
            filtered.map((report, idx) => {
              const reasonColor = REASON_COLORS[report.reason] ?? colors.textMuted;
              const isPending = report.status === 'pending';
              return (
                <Animated.View key={report.id} entering={FadeInDown.duration(200).delay(idx * 40)}>
                  <AnimatedPressable
                    pressedScale={0.99}
                    onPress={() => isPending ? setSelectedReport(report) : undefined}
                  >
                    <GlassCard style={styles.card} intensity={32}>
                      <View style={styles.cardHeader}>
                        <View style={styles.avatar}>
                          <Text style={styles.avatarText}>{report.reportedUserAvatar}</Text>
                        </View>
                        <View style={styles.cardInfo}>
                          <Text style={styles.reportedName}>{report.reportedUserName}</Text>
                          <Text style={styles.reportedRole}>
                            {report.reportedUserRole === 'passenger+driver' ? 'Conductor / Pasajero' : 'Pasajero'}
                          </Text>
                        </View>
                        <View style={[styles.reasonBadge, {
                          backgroundColor: reasonColor + '22',
                          borderColor: reasonColor + '55',
                        }]}>
                          <Text style={[styles.reasonText, { color: reasonColor }]}>
                            {REPORT_REASON_LABELS[report.reason]}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.divider} />

                      <Text style={styles.detailsText} numberOfLines={2}>{report.details}</Text>

                      <View style={styles.metaRow}>
                        <Ionicons name="person-outline" size={12} color={colors.textMuted} />
                        <Text style={styles.metaText}>Reportado por {report.reportedByName}</Text>
                        <View style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: colors.textMuted }} />
                        <Text style={styles.metaText}>{formatDate(report.createdAt)}</Text>
                        {!isPending && <ResolvedLabel report={report} />}
                        {isPending && (
                          <View style={{ marginLeft: 'auto' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                              <Text style={[styles.metaText, { color: Brand.colors.green.normal }]}>Ver acciones</Text>
                              <Ionicons name="chevron-forward" size={12} color={Brand.colors.green.normal} />
                            </View>
                          </View>
                        )}
                      </View>
                    </GlassCard>
                  </AnimatedPressable>
                </Animated.View>
              );
            })
          )}
        </ScrollView>
      </View>

      {/* Action bottom sheet */}
      <Modal
        visible={!!selectedReport}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedReport(null)}
      >
        <Pressable style={styles.backdrop} onPress={() => setSelectedReport(null)}>
          <Animated.View
            entering={SlideInDown.duration(280)}
            exiting={SlideOutDown.duration(220)}
            style={styles.sheet}
          >
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Acción sobre el usuario</Text>
            <Text style={styles.sheetReported}>{selectedReport?.reportedUserName}</Text>

            {/* Reason summary */}
            <GlassCard style={{ borderRadius: Brand.radius[12], padding: 12, gap: 4 }} intensity={28}>
              <Text style={{ fontSize: 12, color: colors.textMuted, fontFamily: Fonts.headingBold, textTransform: 'uppercase' }}>
                Motivo del reporte
              </Text>
              <Text style={{ fontSize: 13, color: colors.textPrimary, fontFamily: Fonts.heading }}>
                {selectedReport ? REPORT_REASON_LABELS[selectedReport.reason] : ''}
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, fontFamily: Fonts.sans, lineHeight: 17, marginTop: 2 }}
                numberOfLines={3}>
                {selectedReport?.details}
              </Text>
            </GlassCard>

            {/* Suspension options */}
            <Text style={styles.sheetSection}>Suspender cuenta temporalmente</Text>
            <View style={styles.suspensionRow}>
              {SUSPENSION_OPTIONS.map((opt) => (
                <Pressable key={opt.days} style={styles.suspensionChip} onPress={() => handleSuspend(opt.days)}>
                  <Text style={styles.suspensionChipText}>{opt.label}</Text>
                </Pressable>
              ))}
            </View>

            {/* Deactivate */}
            <AnimatedPressable pressedScale={0.98} onPress={handleDeactivate}>
              <View style={styles.btnDeactivate}>
                <Text style={styles.btnDeactivateText}>Desactivar cuenta permanentemente</Text>
              </View>
            </AnimatedPressable>

            {/* Dismiss */}
            <AnimatedPressable pressedScale={0.98} onPress={handleDismiss}>
              <View style={styles.btnDismiss}>
                <Text style={styles.btnDismissText}>Desestimar reporte</Text>
              </View>
            </AnimatedPressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </View>
  );
}
