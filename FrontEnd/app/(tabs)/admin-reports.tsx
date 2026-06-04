// Admin tab — user reports moderation panel.
// Lists all reports with status and reason. Tapping one opens an action bottom sheet
// where the admin can suspend the user for N days, deactivate their account, or dismiss.

import { Ionicons } from '@expo/vector-icons';
import { Redirect, useNavigation } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown, SlideInDown, SlideOutDown } from 'react-native-reanimated';

import AnimatedPressable from '@/components/animated-pressable';
import GlassCard from '@/components/glass-card';
import { Brand } from '@/constants/theme';
import {
  UserReport,
  ReportStatus,
  REPORT_REASON_LABELS,
} from '@/constants/mock-reports';
import { useApplications } from '@/contexts/applications';
import { useAuth } from '@/contexts/auth';
import { useUserMode } from '@/contexts/user-mode';
import { useAppTheme } from '@/hooks/use-app-theme';
import { resolvedLabelInline, metaDotInline, sheetReasonCard, makeStyles } from '../../styles/tabs/admin-reports.styles';

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
    <View style={[resolvedLabelInline.container, {
      backgroundColor: config.color + '22',
      borderColor: config.color + '55',
    }]}>
      <Text style={[resolvedLabelInline.text, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

export default function AdminReportsScreen() {
  const { user } = useAuth();
  const { mode } = useUserMode();
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

  // Non-admins must never see this screen. Redirect them to the appropriate user tab based on their mode.
  if (user?.role !== 'admin') {
    const fallback = (mode === 'driver' && user?.role === 'passenger+driver') ? '/(tabs)/offer' : '/(tabs)/search';
    return <Redirect href={fallback} />;
  }

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
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Filter chips */}
          <View style={styles.chipsRow}>
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
          </View>

          {/* Cards */}
          <View style={styles.list}>
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
                          <View style={metaDotInline.pendingActionsContainer}>
                            <View style={metaDotInline.pendingActionsRow}>
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
          </View>
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
            <GlassCard style={sheetReasonCard.card} intensity={28}>
              <Text style={[sheetReasonCard.reasonLabel, { color: colors.textMuted }]}>
                Motivo del reporte
              </Text>
              <Text style={[sheetReasonCard.reasonValue, { color: colors.textPrimary }]}>
                {selectedReport ? REPORT_REASON_LABELS[selectedReport.reason] : ''}
              </Text>
              <Text style={[sheetReasonCard.reasonDetails, { color: colors.textSecondary }]}
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
