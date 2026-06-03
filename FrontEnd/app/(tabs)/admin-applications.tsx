// Admin tab — driver application queue.
// Active applications (pending/under_review/needs_correction) show as individual paginated cards.
// Approved and rejected are grouped under collapsible section headers, collapsed by default.

import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import AnimatedPressable from '@/components/animated-pressable';
import GlassCard from '@/components/glass-card';
import { Brand } from '@/constants/theme';
import { ApplicationStatus, DriverApplication, useApplications } from '@/contexts/applications';
import { useAppTheme } from '@/hooks/use-app-theme';
import { badge, appCardInline, makeStyles } from '../../styles/tabs/admin-applications.styles';

type Filter = 'all' | ApplicationStatus;

const PAGE_SIZE = 10;

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; color: string; icon: string }> = {
  pending:          { label: 'Pendiente',    color: '#f7a900',                        icon: 'time-outline' },
  under_review:     { label: 'En revisión',  color: Brand.colors.blue.normal,         icon: 'eye-outline' },
  needs_correction: { label: 'Corrección',   color: '#ff7c2a',                        icon: 'alert-circle-outline' },
  approved:         { label: 'Aprobada',     color: Brand.colors.green.normal,        icon: 'checkmark-circle-outline' },
  rejected:         { label: 'Rechazada',    color: Brand.colors.alerts.error,        icon: 'close-circle-outline' },
};

function StatusBadge({ status }: { status: ApplicationStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <View style={[badge.wrap, { backgroundColor: cfg.color + '22', borderColor: cfg.color + '55' }]}>
      <Text style={[badge.text, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function AppCard({ app, onPress, styles, colors }: {
  app: DriverApplication;
  onPress: () => void;
  styles: ReturnType<typeof makeStyles>;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  return (
    <AnimatedPressable pressedScale={0.99} onPress={onPress}>
      <GlassCard style={styles.card} intensity={32}>
        <View style={styles.cardTop}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{app.applicantAvatar}</Text>
          </View>
          <View style={styles.nameBlock}>
            <Text style={styles.name}>{app.applicantName}</Text>
            <Text style={styles.email}>{app.applicantEmail}</Text>
          </View>
          <View style={appCardInline.badgeContainer}>
            {app.applicationType === 'vehicle' && (
              <View style={[badge.wrap, { backgroundColor: Brand.colors.blue.normal + '22', borderColor: Brand.colors.blue.normal + '55' }]}>
                <Text style={[badge.text, { color: Brand.colors.blue.normal }]}>Nuevo vehículo</Text>
              </View>
            )}
            <StatusBadge status={app.status} />
          </View>
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
  );
}

function CollapsibleSection({ title, count, color, apps, onPress, styles, colors }: {
  title: string;
  count: number;
  color: string;
  apps: DriverApplication[];
  onPress: (app: DriverApplication) => void;
  styles: ReturnType<typeof makeStyles>;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  const [open, setOpen] = useState(false);
  if (count === 0) return null;
  return (
    <>
      <Pressable style={styles.sectionHeader} onPress={() => setOpen((v) => !v)}>
        <View style={styles.sectionHeaderLeft}>
          <Ionicons
            name={open ? 'chevron-down' : 'chevron-forward'}
            size={16}
            color={color}
          />
          <Text style={[styles.sectionHeaderTitle, { color }]}>{title}</Text>
          <Text style={styles.sectionHeaderCount}>{count}</Text>
        </View>
      </Pressable>
      {open && (
        <View style={styles.list}>
          {apps.map((app, idx) => (
            <Animated.View key={app.id} entering={FadeInDown.duration(180).delay(idx * 30)}>
              <AppCard app={app} onPress={() => onPress(app)} styles={styles} colors={colors} />
            </Animated.View>
          ))}
        </View>
      )}
    </>
  );
}

export default function AdminApplicationsScreen() {
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation();
  const router = useRouter();
  const { applications, loadApplications } = useApplications();
  const [filter, setFilter] = useState<Filter>('all');
  const [page, setPage]     = useState(1);

  useEffect(() => { loadApplications(); }, [loadApplications]);
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
                  <AppCard app={app} onPress={() => goToDetail(app)} styles={styles} colors={colors} />
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
              <CollapsibleSection
                title="Aprobadas"
                count={counts.approved}
                color={colors.textMuted}
                apps={approved}
                onPress={goToDetail}
                styles={styles}
                colors={colors}
              />
              <CollapsibleSection
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
