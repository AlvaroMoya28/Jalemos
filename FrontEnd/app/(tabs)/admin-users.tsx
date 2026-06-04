// Admin tab — user management panel.
// Paginated list with search, filters by role/status, sort options and admin actions.

import { Ionicons } from '@expo/vector-icons';
import { Redirect, useNavigation, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import AnimatedPressable from '@/components/animated-pressable';
import GlassCard from '@/components/glass-card';
import { Brand } from '@/constants/theme';
import {
  AdminUser,
  SortBy,
  UserFilters,
  UserRole,
  useAdminUsers,
} from '@/contexts/admin-users';
import { useAuth } from '@/contexts/auth';
import { useUserMode } from '@/contexts/user-mode';
import { useAppTheme } from '@/hooks/use-app-theme';
import { badge, starsInline, loadingOverlay, makeStyles } from '../../styles/tabs/admin-users.styles';

// ─── Badge helpers ────────────────────────────────────────────────────────────

const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
  admin:     { label: 'Admin',     color: '#9b59b6' },
  driver:    { label: 'Conductor', color: Brand.colors.blue.normal },
  passenger: { label: 'Pasajero',  color: Brand.colors.green.normal },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  active:      { label: 'Activo',      color: Brand.colors.green.normal,  icon: 'checkmark-circle-outline' },
  suspended:   { label: 'Suspendido',  color: '#f7a900',                  icon: 'time-outline' },
  deactivated: { label: 'Desactivado', color: Brand.colors.alerts.error,   icon: 'ban-outline' },
};

function RoleBadge({ role }: { role: string }) {
  const cfg = ROLE_CONFIG[role] ?? ROLE_CONFIG.passenger;
  return (
    <View style={[badge.wrap, { backgroundColor: cfg.color + '22', borderColor: cfg.color + '55' }]}>
      <Text style={[badge.text, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.active;
  return (
    <View style={[badge.wrap, { backgroundColor: cfg.color + '22', borderColor: cfg.color + '55' }]}>
      <Ionicons name={cfg.icon as any} size={10} color={cfg.color} />
      <Text style={[badge.text, { color: cfg.color, marginLeft: 3 }]}>{cfg.label}</Text>
    </View>
  );
}


// ─── Stars rating ─────────────────────────────────────────────────────────────

function Stars({ value }: { value: number }) {
  const filled = Math.round(value);
  return (
    <View style={starsInline.row}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Ionicons
          key={i}
          name={i < filled ? 'star' : 'star-outline'}
          size={11}
          color={Brand.colors.yellow.normal}
        />
      ))}
    </View>
  );
}

// ─── Action modal ─────────────────────────────────────────────────────────────

interface ActionItem {
  label: string;
  icon:  string;
  color: string;
  onPress: () => void;
}

function ActionModal({
  user,
  visible,
  onClose,
  styles,
  colors,
  isDark,
  onChangeRole,
  onBan,
  onLiftBan,
  onDeactivate,
  onActivate,
}: {
  user: AdminUser | null;
  visible: boolean;
  onClose: () => void;
  styles: ReturnType<typeof makeStyles>;
  colors: any;
  isDark: boolean;
  onChangeRole: (role: UserRole) => void;
  onBan: (days: number) => void;
  onLiftBan: () => void;
  onDeactivate: () => void;
  onActivate: () => void;
}) {
  if (!user) return null;

  const isSuspended   = user.displayStatus === 'suspended';
  const isDeactivated = user.displayStatus === 'deactivated';
  const isActive      = user.displayStatus === 'active';

  const actions: ActionItem[] = [];

  // Role actions
  if (user.role !== 'admin') {
    actions.push({
      label: 'Hacer administrador',
      icon:  'shield-checkmark-outline',
      color: '#9b59b6',
      onPress: () => { onClose(); onChangeRole('admin'); },
    });
  } else {
    actions.push({
      label: 'Quitar rol administrador',
      icon:  'shield-outline',
      color: colors.textSecondary,
      onPress: () => { onClose(); onChangeRole('passenger'); },
    });
  }

  if (user.role === 'driver') {
    actions.push({
      label: 'Retirar rol conductor',
      icon:  'car-outline',
      color: '#f7a900',
      onPress: () => { onClose(); onChangeRole('passenger'); },
    });
  }

  // Suspension actions
  if (isSuspended) {
    actions.push({
      label: 'Levantar suspensión',
      icon:  'checkmark-circle-outline',
      color: Brand.colors.green.normal,
      onPress: () => { onClose(); onLiftBan(); },
    });
  }

  if (isActive || isSuspended) {
    actions.push(
      { label: 'Suspender 1 día',     icon: 'time-outline', color: '#f7a900', onPress: () => { onClose(); onBan(1); } },
      { label: 'Suspender 7 días',    icon: 'time-outline', color: '#f7a900', onPress: () => { onClose(); onBan(7); } },
      { label: 'Suspender 30 días',   icon: 'time-outline', color: '#f7a900', onPress: () => { onClose(); onBan(30); } },
      { label: 'Suspender permanente',icon: 'ban-outline',  color: Brand.colors.alerts.error, onPress: () => { onClose(); onBan(0); } },
    );
  }

  // Activation / deactivation
  if (isDeactivated) {
    actions.push({
      label: 'Reactivar cuenta',
      icon:  'refresh-circle-outline',
      color: Brand.colors.green.normal,
      onPress: () => { onClose(); onActivate(); },
    });
  } else {
    actions.push({
      label: 'Desactivar cuenta',
      icon:  'close-circle-outline',
      color: Brand.colors.alerts.error,
      onPress: () => { onClose(); onDeactivate(); },
    });
  }

  const bg = isDark ? '#0e1f1c' : '#ffffff';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: bg }]} onPress={(e) => e.stopPropagation()}>
          <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
          <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>
            {user.firstName} {user.lastName}
          </Text>
          <Text style={[styles.sheetEmail, { color: colors.textMuted }]}>{user.email}</Text>
          <View style={[styles.sheetDivider, { backgroundColor: colors.border }]} />

          <ScrollView>
            {actions.map((a) => (
              <Pressable key={a.label} style={styles.actionBtn} onPress={a.onPress}>
                <Ionicons name={a.icon as any} size={20} color={a.color} />
                <Text style={[styles.actionLabel, { color: a.color }]}>{a.label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Pressable
            style={[styles.cancelBtn, { backgroundColor: colors.surfaceAlt }]}
            onPress={onClose}
          >
            <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancelar</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Sort options ─────────────────────────────────────────────────────────────

const SORT_OPTIONS: { key: SortBy; label: string }[] = [
  { key: 'name_asc',    label: 'A → Z' },
  { key: 'name_desc',   label: 'Z → A' },
  { key: 'rating_desc', label: 'Mejor rating' },
  { key: 'rating_asc',  label: 'Peor rating' },
  { key: 'trips_desc',  label: 'Más viajes' },
  { key: 'trips_asc',   label: 'Menos viajes' },
  { key: 'newest',      label: 'Más nuevos' },
  { key: 'oldest',      label: 'Más antiguos' },
];

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function AdminUsersScreen() {
  const { user } = useAuth();
  const { mode } = useUserMode();
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation();

  const {
    users, totalCount, totalPages, filters, loading, error,
    setFilters, loadUsers, changeRole, ban, liftBan, deactivate, activate,
  } = useAdminUsers();

  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchInput,   setSearchInput]   = useState('');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    navigation.setOptions({ title: 'Usuarios', icon: { sf: 'person.2' } });
  }, [navigation]);

  // Reload whenever filters change or tab comes back into focus
  useEffect(() => { if (user?.role === 'admin') loadUsers(); }, [filters, loadUsers, user?.role]);
  useFocusEffect(useCallback(() => { if (user?.role === 'admin') loadUsers(); }, [loadUsers, user?.role]));

  // Debounce search input → filters.search
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setFilters({ search: searchInput });
    }, 400);
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [searchInput, setFilters]);

  // ── Admin actions with confirmation ───────────────────────────────────────

  const handleAction = useCallback(async (fn: () => Promise<void>, successMsg: string) => {
    setActionLoading(true);
    try {
      await fn();
      Alert.alert('Listo', successMsg);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Ocurrió un error');
    } finally {
      setActionLoading(false);
    }
  }, []);

  const handleChangeRole = useCallback((user: AdminUser, role: UserRole) => {
    const label = role === 'admin' ? 'administrador' : role === 'driver' ? 'conductor' : 'pasajero';
    Alert.alert(
      'Cambiar rol',
      `¿Cambiar el rol de ${user.firstName} a ${label}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: () => handleAction(() => changeRole(user.id, role), 'Rol actualizado'),
        },
      ],
    );
  }, [changeRole, handleAction]);

  const handleBan = useCallback((user: AdminUser, days: number) => {
    const desc = days === 0 ? 'permanentemente' : `por ${days} día${days > 1 ? 's' : ''}`;
    Alert.alert(
      'Suspender usuario',
      `¿Suspender a ${user.firstName} ${desc}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Suspender',
          style: 'destructive',
          onPress: () => handleAction(() => ban(user.id, days), 'Usuario suspendido'),
        },
      ],
    );
  }, [ban, handleAction]);

  const handleLiftBan = useCallback((user: AdminUser) => {
    handleAction(() => liftBan(user.id), 'Suspensión levantada');
  }, [liftBan, handleAction]);

  const handleDeactivate = useCallback((user: AdminUser) => {
    Alert.alert(
      'Desactivar cuenta',
      `¿Desactivar la cuenta de ${user.firstName}? No podrá iniciar sesión.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desactivar',
          style: 'destructive',
          onPress: () => handleAction(() => deactivate(user.id), 'Cuenta desactivada'),
        },
      ],
    );
  }, [deactivate, handleAction]);

  const handleActivate = useCallback((user: AdminUser) => {
    handleAction(() => activate(user.id), 'Cuenta reactivada');
  }, [activate, handleAction]);

  const hasActiveFilters =
    filters.role !== 'all' || filters.status !== 'all' ||
    filters.sortBy !== 'name_asc' || searchInput !== '';

  const clearAllFilters = useCallback(() => {
    setSearchInput('');
    setFilters({ role: 'all', status: 'all', sortBy: 'name_asc', page: 1 });
  }, [setFilters]);

  // Non-admins must never see this screen. Redirect them to the appropriate user tab based on their mode.
  if (user?.role !== 'admin') {
    const fallback = (mode === 'driver' && user?.role === 'passenger+driver') ? '/(tabs)/offer' : '/(tabs)/search';
    return <Redirect href={fallback} />;
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  const heroColor = isDark ? colors.screenBg : '#0a3f39';

  return (
    <View style={[styles.container, { backgroundColor: heroColor }]}>
      {/* Hero header */}
      <View style={styles.heroHeader}>
        <Text style={styles.heroMini}>Panel de administración</Text>
        <Text style={styles.heroTitle}>Usuarios</Text>
        <Text style={styles.heroSub}>{totalCount} usuario{totalCount !== 1 ? 's' : ''} registrados</Text>
      </View>

      <View style={styles.surface}>
        {/* Single scroll area: search + filters + cards + pagination */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Search */}
          <View style={styles.searchRow}>
            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={16} color={colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar por nombre, usuario o email…"
                placeholderTextColor={colors.textMuted}
                value={searchInput}
                onChangeText={setSearchInput}
                autoCorrect={false}
                autoCapitalize="none"
                clearButtonMode="while-editing"
              />
              {searchInput.length > 0 && (
                <Pressable onPress={() => setSearchInput('')}>
                  <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                </Pressable>
              )}
            </View>
          </View>

          {/* Rol */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Rol</Text>
            <View style={styles.chipsRow}>
              {([
                { key: 'all',       label: 'Todos' },
                { key: 'passenger', label: 'Pasajeros' },
                { key: 'driver',    label: 'Conductores' },
                { key: 'admin',     label: 'Admins' },
              ] as { key: UserFilters['role']; label: string }[]).map((f) => {
                const active = filters.role === f.key;
                return (
                  <Pressable
                    key={f.key}
                    style={[styles.filterChip, {
                      backgroundColor: active ? Brand.colors.green.normal : colors.surfaceAlt,
                      borderColor:     active ? Brand.colors.green.normal : colors.border,
                    }]}
                    onPress={() => setFilters({ role: f.key })}
                  >
                    <Text style={[styles.filterChipText, { color: active ? '#fff' : colors.textSecondary }]}>
                      {f.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Estado */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Estado</Text>
            <View style={styles.chipsRow}>
              {([
                { key: 'all',         label: 'Todos' },
                { key: 'active',      label: 'Activos' },
                { key: 'suspended',   label: 'Suspendidos' },
                { key: 'deactivated', label: 'Desactivados' },
              ] as { key: UserFilters['status']; label: string }[]).map((f) => {
                const active = filters.status === f.key;
                return (
                  <Pressable
                    key={f.key}
                    style={[styles.filterChip, {
                      backgroundColor: active ? Brand.colors.green.normal : colors.surfaceAlt,
                      borderColor:     active ? Brand.colors.green.normal : colors.border,
                    }]}
                    onPress={() => setFilters({ status: f.key })}
                  >
                    <Text style={[styles.filterChipText, { color: active ? '#fff' : colors.textSecondary }]}>
                      {f.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Ordenar */}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Ordenar por</Text>
            <View style={styles.chipsRow}>
              {SORT_OPTIONS.map((s) => {
                const active = filters.sortBy === s.key;
                return (
                  <Pressable
                    key={s.key}
                    style={[styles.filterChip, {
                      backgroundColor: active ? Brand.colors.green.normal : colors.surfaceAlt,
                      borderColor:     active ? Brand.colors.green.normal : colors.border,
                    }]}
                    onPress={() => setFilters({ sortBy: s.key })}
                  >
                    <Text style={[styles.filterChipText, { color: active ? '#fff' : colors.textSecondary }]}>
                      {s.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Limpiar filtros */}
          {hasActiveFilters && (
            <View style={styles.clearRow}>
              <Pressable
                style={[styles.clearBtn, { borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
                onPress={clearAllFilters}
              >
                <Ionicons name="close-circle-outline" size={13} color={colors.textMuted} />
                <Text style={[styles.clearBtnText, { color: colors.textSecondary }]}>Limpiar filtros</Text>
              </Pressable>
            </View>
          )}

          <View style={styles.listDivider} />

          {/* Cards */}
          {loading && users.length === 0 ? (
            <View style={styles.emptyState}>
              <ActivityIndicator color={Brand.colors.green.normal} />
            </View>
          ) : error ? (
            <View style={styles.emptyState}>
              <Ionicons name="alert-circle-outline" size={40} color={colors.textMuted} />
              <Text style={styles.emptyText}>{error}</Text>
              <Pressable onPress={loadUsers}>
                <Text style={[styles.emptyText, { color: Brand.colors.green.normal }]}>Reintentar</Text>
              </Pressable>
            </View>
          ) : users.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={40} color={colors.textMuted} />
              <Text style={styles.emptyText}>No se encontraron usuarios</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {users.map((u, idx) => (
                <Animated.View key={u.id} entering={FadeInDown.duration(200).delay(idx * 30)}>
                  <AnimatedPressable pressedScale={0.99} onPress={() => setSelectedUser(u)}>
                    <GlassCard style={styles.card} intensity={32}>
                      <View style={styles.cardTop}>
                        {u.profilePhotoUrl ? (
                          <Image
                            source={{ uri: u.profilePhotoUrl }}
                            style={[styles.avatar, { backgroundColor: Brand.colors.green.light + '44' }]}
                          />
                        ) : (
                          <View style={[styles.avatar, { backgroundColor: Brand.colors.green.light + '44' }]}>
                            <Text style={styles.avatarText}>{u.avatar}</Text>
                          </View>
                        )}
                        <View style={styles.nameBlock}>
                          <Text style={styles.name}>{u.firstName} {u.lastName}</Text>
                          <Text style={styles.username}>@{u.username}</Text>
                          <View style={styles.badgeRow}>
                            <RoleBadge role={u.role} />
                            <StatusBadge status={u.displayStatus} />
                          </View>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                      </View>

                      <View style={styles.divider} />

                      <View style={styles.statsRow}>
                        <Stars value={u.meanRating} />
                        <Text style={styles.statText}>{u.meanRating.toFixed(1)}</Text>
                        <View style={styles.statItem}>
                          <Ionicons name="car-outline" size={13} color={colors.textMuted} />
                          <Text style={styles.statText}>{u.totalTrips} viajes</Text>
                        </View>
                        <View style={styles.statItem}>
                          <Ionicons name="navigate-outline" size={13} color={colors.textMuted} />
                          <Text style={styles.statText}>{u.kms.toFixed(0)} km</Text>
                        </View>
                      </View>
                    </GlassCard>
                  </AnimatedPressable>
                </Animated.View>
              ))}

              {totalPages > 1 && (
                <View style={styles.pagination}>
                  <Pressable
                    style={[styles.pageBtn, filters.page <= 1 && { opacity: 0.35 }]}
                    onPress={() => filters.page > 1 && setFilters({ page: filters.page - 1 })}
                    disabled={filters.page <= 1}
                  >
                    <Text style={styles.pageBtnText}>Anterior</Text>
                  </Pressable>
                  <Text style={styles.pageInfo}>{filters.page} / {totalPages}</Text>
                  <Pressable
                    style={[styles.pageBtn, filters.page >= totalPages && { opacity: 0.35 }]}
                    onPress={() => filters.page < totalPages && setFilters({ page: filters.page + 1 })}
                    disabled={filters.page >= totalPages}
                  >
                    <Text style={styles.pageBtnText}>Siguiente</Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </View>

      {/* Action modal */}
      <ActionModal
        user={selectedUser}
        visible={selectedUser !== null}
        onClose={() => setSelectedUser(null)}
        styles={styles}
        colors={colors}
        isDark={isDark}
        onChangeRole={(role) => selectedUser && handleChangeRole(selectedUser, role)}
        onBan={(days) => selectedUser && handleBan(selectedUser, days)}
        onLiftBan={() => selectedUser && handleLiftBan(selectedUser)}
        onDeactivate={() => selectedUser && handleDeactivate(selectedUser)}
        onActivate={() => selectedUser && handleActivate(selectedUser)}
      />

      {/* Global action loading overlay */}
      {actionLoading && (
        <View style={[StyleSheet.absoluteFill, loadingOverlay.overlay]}>
          <ActivityIndicator size="large" color={Brand.colors.green.normal} />
        </View>
      )}
    </View>
  );
}
