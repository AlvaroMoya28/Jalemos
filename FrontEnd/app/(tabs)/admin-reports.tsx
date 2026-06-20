// Admin tab — user reports moderation panel.
// Three views: in-trip reports (real API), low ratings (real API) and in-memory
// user reports. Tapping a card opens an action bottom sheet.

import { Ionicons } from '@expo/vector-icons';
import { Redirect, useNavigation } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import DriverActionSheet from '@/components/admin/driver-action-sheet';
import FilterChips from '@/components/admin/filter-chips';
import LowRatingCard from '@/components/admin/low-rating-card';
import { TripView } from '@/components/admin/report-config';
import ReportsViewToggle from '@/components/admin/reports-view-toggle';
import TripReportActionSheet from '@/components/admin/trip-report-action-sheet';
import TripReportCard from '@/components/admin/trip-report-card';
import UserReportActionSheet from '@/components/admin/user-report-action-sheet';
import UserReportCard from '@/components/admin/user-report-card';
import { Brand } from '@/constants/theme';
import { ReportStatus, UserReport } from '@/constants/mock-reports';
import { useApplications } from '@/contexts/applications';
import { useAuth } from '@/contexts/auth';
import { useUserMode } from '@/contexts/user-mode';
import { useAdminReports } from '@/hooks/use-admin-reports';
import { useAppTheme } from '@/hooks/use-app-theme';
import { makeStyles } from '../../styles/tabs/admin-reports.styles';

type Filter = 'all' | ReportStatus;

export default function AdminReportsScreen() {
  const { user, token } = useAuth();
  const { mode } = useUserMode();
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation();
  const { reports, suspendUserFromReport, deactivateUserFromReport, dismissReport } = useApplications();
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedReport, setSelectedReport] = useState<UserReport | null>(null);

  const {
    viewMode, setViewMode,
    tripReports, tripFilter, setTripFilter, tripLoading, filteredTripReports,
    selectedTripReport, setSelectedTripReport, updatingStatus, handleUpdateTripStatus,
    lowRatings, ratingsLoading,
    driverActionTarget, setDriverActionTarget, driverActing, handleDriverAction,
  } = useAdminReports(token);

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

  const tripFilterList: { key: TripView; label: string }[] = [
    { key: 'all',         label: `Todos (${tripReports.length})` },
    { key: 'open',        label: `Abiertos (${tripReports.filter(r => r.status === 'open').length})` },
    { key: 'verified',    label: `Verificados (${tripReports.filter(r => r.status === 'verified').length})` },
    { key: 'dismissed',   label: `Desestimados (${tripReports.filter(r => r.status === 'dismissed').length})` },
    { key: 'action_taken',label: `Con acción (${tripReports.filter(r => r.status === 'action_taken').length})` },
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
        {/* ── Segment toggle ── */}
        <ReportsViewToggle value={viewMode} onChange={setViewMode} colors={colors} />

        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* ══ TRIP REPORTS TAB ══════════════════════════════════════════ */}
          {viewMode === 'trip' && (
            <>
              <FilterChips options={tripFilterList} value={tripFilter} onChange={setTripFilter} styles={styles} colors={colors} />

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
                  filteredTripReports.map((report, idx) => (
                    <Animated.View key={report.id} entering={FadeInDown.duration(200).delay(idx * 40)}>
                      <TripReportCard report={report} onPress={() => setSelectedTripReport(report)} styles={styles} colors={colors} />
                    </Animated.View>
                  ))
                )}
              </View>
            </>
          )}

          {/* ══ CALIFICACIONES TAB ═══════════════════════════════════════ */}
          {viewMode === 'ratings' && (
            <View style={styles.list}>
              {ratingsLoading ? (
                <View style={styles.emptyState}>
                  <ActivityIndicator color={Brand.colors.green.normal} />
                </View>
              ) : lowRatings.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="star-outline" size={40} color={colors.textMuted} />
                  <Text style={styles.emptyText}>No hay calificaciones ≤ 2 estrellas</Text>
                </View>
              ) : (
                lowRatings.map((rating, idx) => (
                  <Animated.View key={rating.id} entering={FadeInDown.duration(200).delay(idx * 40)}>
                    <LowRatingCard
                      rating={rating}
                      onPress={(driverName) => setDriverActionTarget({ driverId: rating.ratedId, driverName })}
                      styles={styles}
                      colors={colors}
                    />
                  </Animated.View>
                ))
              )}
            </View>
          )}

          {/* ══ USER REPORTS TAB ══════════════════════════════════════════ */}
          {viewMode === 'user' && (
            <>
              <FilterChips options={filterList} value={filter} onChange={setFilter} styles={styles} colors={colors} />

              <View style={styles.list}>
                {filtered.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="flag-outline" size={40} color={colors.textMuted} />
                    <Text style={styles.emptyText}>No hay reportes en esta categoría</Text>
                  </View>
                ) : (
                  filtered.map((report, idx) => (
                    <Animated.View key={report.id} entering={FadeInDown.duration(200).delay(idx * 40)}>
                      <UserReportCard report={report} onPress={() => setSelectedReport(report)} styles={styles} colors={colors} />
                    </Animated.View>
                  ))
                )}
              </View>
            </>
          )}
        </ScrollView>
      </View>

      {/* ── User report action sheet ── */}
      <UserReportActionSheet
        report={selectedReport}
        visible={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        onSuspend={handleSuspend}
        onDeactivate={handleDeactivate}
        onDismiss={handleDismiss}
        styles={styles}
        colors={colors}
      />

      {/* ── Trip report action sheet ── */}
      <TripReportActionSheet
        report={selectedTripReport}
        visible={!!selectedTripReport}
        updatingStatus={updatingStatus}
        onClose={() => setSelectedTripReport(null)}
        onUpdateStatus={handleUpdateTripStatus}
        onActionDriver={() => {
          if (!selectedTripReport) return;
          setDriverActionTarget({
            driverId:   selectedTripReport.driverId,
            driverName: selectedTripReport.driverName ?? 'Conductor',
            reportId:   selectedTripReport.id,
          });
          setSelectedTripReport(null);
        }}
        styles={styles}
        colors={colors}
      />

      {/* ── Driver action sheet (suspend / revoke role / deactivate) ── */}
      <DriverActionSheet
        target={driverActionTarget}
        visible={!!driverActionTarget}
        driverActing={driverActing}
        onClose={() => setDriverActionTarget(null)}
        onAction={handleDriverAction}
        styles={styles}
      />
    </View>
  );
}
