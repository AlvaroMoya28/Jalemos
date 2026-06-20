// Admin tab — user management panel.
// Paginated list with search, filters by role/status, sort options and admin actions.

import { Ionicons } from '@expo/vector-icons';
import { Redirect, useNavigation, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import UserActionModal from '@/components/admin/user-action-modal';
import UserCard from '@/components/admin/user-card';
import UserFilters from '@/components/admin/user-filters';
import { Brand } from '@/constants/theme';
import { AdminUser, useAdminUsers } from '@/contexts/admin-users';
import { useAuth } from '@/contexts/auth';
import { useUserMode } from '@/contexts/user-mode';
import { useAdminUserActions } from '@/hooks/use-admin-user-actions';
import { useAppTheme } from '@/hooks/use-app-theme';
import { loadingOverlay, makeStyles } from '../../styles/tabs/admin-users.styles';

export default function AdminUsersScreen() {
  const { user } = useAuth();
  const { mode } = useUserMode();
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation();

  const {
    users, totalCount, totalPages, filters, loading, error,
    setFilters, loadUsers,
  } = useAdminUsers();

  const {
    actionLoading, handleChangeRole, handleBan, handleLiftBan, handleDeactivate, handleActivate,
  } = useAdminUserActions();

  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
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
          <UserFilters
            searchInput={searchInput}
            onSearchChange={setSearchInput}
            filters={filters}
            onSetFilters={setFilters}
            hasActiveFilters={hasActiveFilters}
            onClear={clearAllFilters}
            styles={styles}
            colors={colors}
          />

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
                  <UserCard user={u} onPress={() => setSelectedUser(u)} styles={styles} colors={colors} />
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
      <UserActionModal
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
