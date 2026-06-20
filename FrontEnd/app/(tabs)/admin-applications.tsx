// Admin tab — driver application queue.
// Active applications (pending/under_review/needs_correction) show as individual paginated cards.
// Approved and rejected are grouped under collapsible section headers, collapsed by default.

import { Ionicons } from '@expo/vector-icons';
import { Redirect, useNavigation, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import ApplicationCard from '@/components/admin/application-card';
import ApplicationsSection from '@/components/admin/applications-section';
import FilterChips from '@/components/admin/filter-chips';
import { ApplicationStatus, DriverApplication, useApplications } from '@/contexts/applications';
import { useAuth } from '@/contexts/auth';
import { useUserMode } from '@/contexts/user-mode';
import { useAppTheme } from '@/hooks/use-app-theme';
import { makeStyles } from '../../styles/tabs/admin-applications.styles';

type Filter = 'all' | ApplicationStatus;

const PAGE_SIZE = 10;

export default function AdminApplicationsScreen() {
  const { user } = useAuth();
  const { mode } = useUserMode();
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation();
  const router = useRouter();
  const { applications, loadApplications } = useApplications();
  const [filter, setFilter] = useState<Filter>('all');
  const [page, setPage]     = useState(1);

  useEffect(() => { if (user?.role === 'admin') loadApplications(); }, [loadApplications, user?.role]);
  useEffect(() => { navigation.setOptions({ title: 'Solicitudes', icon: { sf: 'doc.text' } }); }, [navigation]);
  useEffect(() => { setPage(1); }, [filter]);

  const active   = useMemo(() => applications.filter((a) => !['approved', 'rejected'].includes(a.status)), [applications]);
  const approved = useMemo(() => applications.filter((a) => a.status === 'approved'),  [applications]);
  const rejected = useMemo(() => applications.filter((a) => a.status === 'rejected'),  [applications]);

  // For specific-status filters, show all matching apps paginated (including approved/rejected)
  const isCollapsedFilter = filter === 'all';
  const filtered = useMemo(() => {
    if (filter === 'all') return active;
    return applications.filter((a) => a.status === filter);
  }, [filter, applications, active]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);

  const counts = useMemo(() => ({
    all:              applications.length,
    pending:          applications.filter((a) => a.status === 'pending').length,
    under_review:     applications.filter((a) => a.status === 'under_review').length,
    needs_correction: applications.filter((a) => a.status === 'needs_correction').length,
    approved:         approved.length,
    rejected:         rejected.length,
  }), [applications, approved, rejected]);

  // Non-admins must never see this screen. Redirect them to the appropriate user tab based on their mode.
  if (user?.role !== 'admin') {
    const fallback = (mode === 'driver' && user?.role === 'passenger+driver') ? '/(tabs)/offer' : '/(tabs)/search';
    return <Redirect href={fallback} />;
  }

  const filters: { key: Filter; label: string }[] = [
    { key: 'all',              label: `Todas (${counts.all})` },
    { key: 'pending',          label: `Pendientes (${counts.pending})` },
    { key: 'under_review',     label: `En revisión (${counts.under_review})` },
    { key: 'needs_correction', label: `Corrección (${counts.needs_correction})` },
    { key: 'approved',         label: `Aprobadas (${counts.approved})` },
    { key: 'rejected',         label: `Rechazadas (${counts.rejected})` },
  ];

  const goToDetail = (app: DriverApplication) =>
    router.push({ pathname: '/application-detail', params: { id: app.id } });

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.screenBg : '#0a3f39' }]}>
      <View style={styles.heroHeader}>
        <Text style={styles.heroMini}>Panel de administración</Text>
        <Text style={styles.heroTitle}>Solicitudes</Text>
      </View>

      <View style={styles.surface}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Filter chips */}
          <FilterChips options={filters} value={filter} onChange={setFilter} styles={styles} colors={colors} />

          {/* Main list */}
          <View style={styles.list}>
            {paginated.length === 0 && !isCollapsedFilter ? (
              <View style={styles.emptyState}>
                <Ionicons name="documents-outline" size={40} color={colors.textMuted} />
                <Text style={styles.emptyText}>No hay solicitudes en esta categoría</Text>
              </View>
            ) : (
              paginated.map((app, idx) => (
                <Animated.View key={app.id} entering={FadeInDown.duration(200).delay(idx * 40)}>
                  <ApplicationCard app={app} onPress={() => goToDetail(app)} styles={styles} colors={colors} />
                </Animated.View>
              ))
            )}
          </View>

          {/* Pagination for active/filtered list */}
          {totalPages > 1 && (
            <View style={styles.pagination}>
              <Pressable
                style={[styles.pageBtn, page <= 1 && { opacity: 0.35 }]}
                onPress={() => page > 1 && setPage(page - 1)}
                disabled={page <= 1}
              >
                <Text style={styles.pageBtnText}>Anterior</Text>
              </Pressable>
              <Text style={styles.pageInfo}>{page} / {totalPages}</Text>
              <Pressable
                style={[styles.pageBtn, page >= totalPages && { opacity: 0.35 }]}
                onPress={() => page < totalPages && setPage(page + 1)}
                disabled={page >= totalPages}
              >
                <Text style={styles.pageBtnText}>Siguiente</Text>
              </Pressable>
            </View>
          )}

          {/* Collapsible sections — only in "all" view */}
          {isCollapsedFilter && (
            <>
              <ApplicationsSection
                title="Aprobadas"
                count={counts.approved}
                color={colors.textMuted}
                apps={approved}
                onPress={goToDetail}
                styles={styles}
                colors={colors}
              />
              <ApplicationsSection
                title="Rechazadas"
                count={counts.rejected}
                color={colors.textMuted}
                apps={rejected}
                onPress={goToDetail}
                styles={styles}
                colors={colors}
              />
            </>
          )}

          {/* Empty state for "all" with nothing active */}
          {isCollapsedFilter && active.length === 0 && counts.approved === 0 && counts.rejected === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="documents-outline" size={40} color={colors.textMuted} />
              <Text style={styles.emptyText}>No hay solicitudes</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}
