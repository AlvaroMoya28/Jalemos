// Admin tab — user reports moderation panel.
// Lists all reports with status and reason. Tapping one opens an action bottom sheet
// where the admin can suspend the user for N days, deactivate their account, or dismiss.
// E3-1: added "Reportes en viaje" tab that fetches real trip reports from the API.

import { Ionicons } from '@expo/vector-icons';
import { Redirect, useNavigation } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown, SlideInDown, SlideOutDown } from 'react-native-reanimated';

import AnimatedPressable from '@/components/shared/animated-pressable';
import GlassCard from '@/components/shared/glass-card';
import { Brand, Fonts } from '@/constants/theme';
import {
  UserReport,
  ReportStatus,
  REPORT_REASON_LABELS,
} from '@/constants/mock-reports';
import { useApplications } from '@/contexts/applications';
import { useAuth } from '@/contexts/auth';
import { useUserMode } from '@/contexts/user-mode';
import { useAppTheme } from '@/hooks/use-app-theme';
import { reportsApi, TripReportDto } from '@/services/api';
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

// ── Trip report helpers ────────────────────────────────────────────────────

type TripView = 'all' | 'open' | 'verified' | 'dismissed' | 'action_taken';

const TRIP_TYPE_CONFIG = {
  emergency:     { label: 'Emergencia', color: '#e53e3e', icon: 'warning'       as const },
  driver_report: { label: 'Reporte',    color: '#f4a522', icon: 'person-remove' as const },
};

const TRIP_STATUS_CONFIG = {
  open:         { label: 'Abierto',         color: '#e53e3e' },
  verified:     { label: 'Verificado',      color: '#f4a522' },
  dismissed:    { label: 'Desestimado',     color: '#718096' },
  action_taken: { label: 'Acción tomada',   color: Brand.colors.green.normal },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CR', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Screen ────────────────────────────────────────────────────────────────

export default function AdminReportsScreen() {
  const { user, token } = useAuth();
  const { mode } = useUserMode();
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation();
  const { reports, suspendUserFromReport, deactivateUserFromReport, dismissReport } = useApplications();
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedReport, setSelectedReport] = useState<UserReport | null>(null);

  // ── Trip reports state ──────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<'user' | 'trip'>('trip');
  const [tripReports, setTripReports] = useState<TripReportDto[]>([]);
  const [tripFilter, setTripFilter] = useState<TripView>('all');
  const [tripLoading, setTripLoading] = useState(false);
  const [selectedTripReport, setSelectedTripReport] = useState<TripReportDto | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchTripReports = useCallback(async () => {
    if (!token) return;
    setTripLoading(true);
    try {
      const data = await reportsApi.getAll(token, undefined, 1, 100);
      setTripReports(data);
    } catch { /* silent — admin will see empty state */ }
    finally { setTripLoading(false); }
  }, [token]);

  useEffect(() => {
    if (viewMode === 'trip') fetchTripReports();
  }, [viewMode, fetchTripReports]);

  const handleUpdateTripStatus = async (status: string) => {
    if (!selectedTripReport || !token) return;
    setUpdatingStatus(true);
    try {
      const updated = await reportsApi.updateStatus(selectedTripReport.id, status, null, token);
      setTripReports(prev => prev.map(r => r.id === updated.id ? updated : r));
      setSelectedTripReport(null);
    } catch { /* keep sheet open so admin can retry */ }
    finally { setUpdatingStatus(false); }
  };

  const filteredTripReports = tripFilter === 'all'
    ? tripReports
    : tripReports.filter(r => r.status === tripFilter);

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

  // ── Trip report filter chips ─────────────────────────────────────────────
  const tripFilterList: { key: TripView; label: string }[] = [
    { key: 'all',         label: `Todos (${tripReports.length})` },
    { key: 'open',        label: `Abiertos (${tripReports.filter(r => r.status === 'open').length})` },
    { key: 'verified',    label: `Verificados (${tripReports.filter(r => r.status === 'verified').length})` },
    { key: 'dismissed',   label: `Desestimados (${tripReports.filter(r => r.status === 'dismissed').length})` },
    { key: 'action_taken',label: `Con acción (${tripReports.filter(r => r.status === 'action_taken').length})` },
  ];

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.screenBg : '#0a3f39' }]}>
      <View style={styles.heroHeader}>
        <Text style={styles.heroMini}>Panel de administración</Text>
        <Text style={styles.heroTitle}>Reportes</Text>
      </View>

      <View style={styles.surface}>
        {/* ── Segment toggle ── */}
        <View style={{ flexDirection: 'row', marginHorizontal: 16, marginTop: 16, marginBottom: 4, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}>
          {([['trip', 'En Viaje'], ['user', 'Usuarios']] as const).map(([key, label]) => (
            <Pressable
              key={key}
              style={{ flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: viewMode === key ? Brand.colors.green.normal : 'transparent' }}
              onPress={() => setViewMode(key)}
            >
              <Text style={{ fontFamily: Fonts.headingBold, fontSize: 13, color: viewMode === key ? '#fff' : colors.textSecondary }}>
                {label}
              </Text>
            </Pressable>
          ))}
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* ══ TRIP REPORTS TAB ══════════════════════════════════════════ */}
          {viewMode === 'trip' && (
            <>
              <View style={styles.chipsRow}>
                {tripFilterList.map((f) => {
                  const active = tripFilter === f.key;
                  return (
                    <Pressable
                      key={f.key}
                      style={[styles.filterChip, {
                        backgroundColor: active ? Brand.colors.green.normal : colors.surfaceAlt,
                        borderColor: active ? Brand.colors.green.normal : colors.border,
                      }]}
                      onPress={() => setTripFilter(f.key)}
                    >
                      <Text style={[styles.filterChipText, { color: active ? '#fff' : colors.textSecondary }]}>
                        {f.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.list}>
                {tripLoading ? (
                  <View style={styles.emptyState}>
                    <ActivityIndicator color={Brand.colors.green.normal} />
                  </View>
                ) : filteredTripReports.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="shield-checkmark-outline" size={40} color={colors.textMuted} />
                    <Text style={styles.emptyText}>No hay reportes en esta categoría</Text>
                  </View>
                ) : (
                  filteredTripReports.map((report, idx) => {
                    const typeConf   = TRIP_TYPE_CONFIG[report.type] ?? TRIP_TYPE_CONFIG.emergency;
                    const statusConf = TRIP_STATUS_CONFIG[report.status] ?? { label: report.status, color: colors.textMuted };
                    const isOpen     = report.status === 'open' || report.status === 'verified';
                    return (
                      <Animated.View key={report.id} entering={FadeInDown.duration(200).delay(idx * 40)}>
                        <AnimatedPressable pressedScale={0.99} onPress={() => isOpen ? setSelectedTripReport(report) : undefined}>
                          <GlassCard style={styles.card} intensity={32}>
                            <View style={styles.cardHeader}>
                              <View style={[styles.avatar, { backgroundColor: typeConf.color + '22' }]}>
                                <Ionicons name={typeConf.icon} size={20} color={typeConf.color} />
                              </View>
                              <View style={styles.cardInfo}>
                                <Text style={styles.reportedName}>{typeConf.label}</Text>
                                <Text style={styles.reportedRole}>Durante un viaje activo</Text>
                              </View>
                              <View style={[styles.reasonBadge, { backgroundColor: statusConf.color + '22', borderColor: statusConf.color + '55' }]}>
                                <Text style={[styles.reasonText, { color: statusConf.color }]}>{statusConf.label}</Text>
                              </View>
                            </View>

                            <View style={styles.divider} />

                            <Text style={styles.detailsText} numberOfLines={2}>{report.description}</Text>

                            <View style={styles.metaRow}>
                              <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
                              <Text style={styles.metaText}>{formatDate(report.createdAt)}</Text>
                              {isOpen && (
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
            </>
          )}

          {/* ══ USER REPORTS TAB ══════════════════════════════════════════ */}
          {viewMode === 'user' && (
            <>
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
                        <AnimatedPressable pressedScale={0.99} onPress={() => isPending ? setSelectedReport(report) : undefined}>
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
                              <View style={[styles.reasonBadge, { backgroundColor: reasonColor + '22', borderColor: reasonColor + '55' }]}>
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
            </>
          )}
        </ScrollView>
      </View>

      {/* ── User report action sheet ── */}
      <Modal visible={!!selectedReport} transparent animationType="fade" onRequestClose={() => setSelectedReport(null)}>
        <Pressable style={styles.backdrop} onPress={() => setSelectedReport(null)}>
          <Animated.View entering={SlideInDown.duration(280)} exiting={SlideOutDown.duration(220)} style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Acción sobre el usuario</Text>
            <Text style={styles.sheetReported}>{selectedReport?.reportedUserName}</Text>

            <GlassCard style={sheetReasonCard.card} intensity={28}>
              <Text style={[sheetReasonCard.reasonLabel, { color: colors.textMuted }]}>Motivo del reporte</Text>
              <Text style={[sheetReasonCard.reasonValue, { color: colors.textPrimary }]}>
                {selectedReport ? REPORT_REASON_LABELS[selectedReport.reason] : ''}
              </Text>
              <Text style={[sheetReasonCard.reasonDetails, { color: colors.textSecondary }]} numberOfLines={3}>
                {selectedReport?.details}
              </Text>
            </GlassCard>

            <Text style={styles.sheetSection}>Suspender cuenta temporalmente</Text>
            <View style={styles.suspensionRow}>
              {SUSPENSION_OPTIONS.map((opt) => (
                <Pressable key={opt.days} style={styles.suspensionChip} onPress={() => handleSuspend(opt.days)}>
                  <Text style={styles.suspensionChipText}>{opt.label}</Text>
                </Pressable>
              ))}
            </View>

            <AnimatedPressable pressedScale={0.98} onPress={handleDeactivate}>
              <View style={styles.btnDeactivate}>
                <Text style={styles.btnDeactivateText}>Desactivar cuenta permanentemente</Text>
              </View>
            </AnimatedPressable>

            <AnimatedPressable pressedScale={0.98} onPress={handleDismiss}>
              <View style={styles.btnDismiss}>
                <Text style={styles.btnDismissText}>Desestimar reporte</Text>
              </View>
            </AnimatedPressable>
          </Animated.View>
        </Pressable>
      </Modal>

      {/* ── Trip report action sheet ── */}
      <Modal visible={!!selectedTripReport} transparent animationType="fade" onRequestClose={() => setSelectedTripReport(null)}>
        <Pressable style={styles.backdrop} onPress={() => !updatingStatus && setSelectedTripReport(null)}>
          <Animated.View entering={SlideInDown.duration(280)} exiting={SlideOutDown.duration(220)} style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>
              {selectedTripReport ? TRIP_TYPE_CONFIG[selectedTripReport.type]?.label ?? 'Reporte' : ''}
            </Text>
            <Text style={styles.sheetReported}>Durante un viaje activo</Text>

            <GlassCard style={sheetReasonCard.card} intensity={28}>
              <Text style={[sheetReasonCard.reasonLabel, { color: colors.textMuted }]}>Descripción</Text>
              <Text style={[sheetReasonCard.reasonDetails, { color: colors.textSecondary }]} numberOfLines={5}>
                {selectedTripReport?.description}
              </Text>
              <Text style={[sheetReasonCard.reasonLabel, { color: colors.textMuted, marginTop: 8 }]}>Fecha</Text>
              <Text style={[sheetReasonCard.reasonValue, { color: colors.textPrimary }]}>
                {selectedTripReport ? formatDate(selectedTripReport.createdAt) : ''}
              </Text>
            </GlassCard>

            {updatingStatus ? (
              <ActivityIndicator color={Brand.colors.green.normal} style={{ marginVertical: 8 }} />
            ) : (
              <>
                {selectedTripReport?.status === 'open' && (
                  <AnimatedPressable pressedScale={0.98} onPress={() => handleUpdateTripStatus('verified')}>
                    <View style={[styles.btnDeactivate, { backgroundColor: '#f4a522' }]}>
                      <Text style={styles.btnDeactivateText}>Marcar como verificado</Text>
                    </View>
                  </AnimatedPressable>
                )}

                <AnimatedPressable pressedScale={0.98} onPress={() => handleUpdateTripStatus('action_taken')}>
                  <View style={[styles.btnDeactivate, { backgroundColor: Brand.colors.green.normal }]}>
                    <Text style={styles.btnDeactivateText}>Acción tomada</Text>
                  </View>
                </AnimatedPressable>

                <AnimatedPressable pressedScale={0.98} onPress={() => handleUpdateTripStatus('dismissed')}>
                  <View style={styles.btnDismiss}>
                    <Text style={styles.btnDismissText}>Desestimar reporte</Text>
                  </View>
                </AnimatedPressable>
              </>
            )}
          </Animated.View>
        </Pressable>
      </Modal>
    </View>
  );
}
