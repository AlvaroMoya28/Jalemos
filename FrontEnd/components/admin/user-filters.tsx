// Search box + role / status / sort filter groups for the user-management
// panel, plus the "clear filters" affordance.

import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, TextInput, View } from 'react-native';

import { SortBy, UserFilters as UserFiltersState } from '@/contexts/admin-users';
import { useAppTheme } from '@/hooks/use-app-theme';
import { makeStyles } from '@/styles/tabs/admin-users.styles';

import FilterChips from './filter-chips';

const ROLE_OPTIONS: { key: UserFiltersState['role']; label: string }[] = [
  { key: 'all',       label: 'Todos' },
  { key: 'passenger', label: 'Pasajeros' },
  { key: 'driver',    label: 'Conductores' },
  { key: 'admin',     label: 'Admins' },
];

const STATUS_OPTIONS: { key: UserFiltersState['status']; label: string }[] = [
  { key: 'all',         label: 'Todos' },
  { key: 'active',      label: 'Activos' },
  { key: 'suspended',   label: 'Suspendidos' },
  { key: 'deactivated', label: 'Desactivados' },
];

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

export default function UserFilters({
  searchInput,
  onSearchChange,
  filters,
  onSetFilters,
  hasActiveFilters,
  onClear,
  styles,
  colors,
}: {
  searchInput: string;
  onSearchChange: (text: string) => void;
  filters: UserFiltersState;
  onSetFilters: (patch: Partial<UserFiltersState>) => void;
  hasActiveFilters: boolean;
  onClear: () => void;
  styles: ReturnType<typeof makeStyles>;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  return (
    <>
      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={16} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre, usuario o email…"
            placeholderTextColor={colors.textMuted}
            value={searchInput}
            onChangeText={onSearchChange}
            autoCorrect={false}
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
          {searchInput.length > 0 && (
            <Pressable onPress={() => onSearchChange('')}>
              <Ionicons name="close-circle" size={16} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Rol */}
      <View style={styles.filterGroup}>
        <Text style={styles.filterLabel}>Rol</Text>
        <FilterChips
          options={ROLE_OPTIONS}
          value={filters.role}
          onChange={(role) => onSetFilters({ role })}
          styles={styles}
          colors={colors}
        />
      </View>

      {/* Estado */}
      <View style={styles.filterGroup}>
        <Text style={styles.filterLabel}>Estado</Text>
        <FilterChips
          options={STATUS_OPTIONS}
          value={filters.status}
          onChange={(status) => onSetFilters({ status })}
          styles={styles}
          colors={colors}
        />
      </View>

      {/* Ordenar */}
      <View style={styles.filterGroup}>
        <Text style={styles.filterLabel}>Ordenar por</Text>
        <FilterChips
          options={SORT_OPTIONS}
          value={filters.sortBy}
          onChange={(sortBy) => onSetFilters({ sortBy })}
          styles={styles}
          colors={colors}
        />
      </View>

      {/* Limpiar filtros */}
      {hasActiveFilters && (
        <View style={styles.clearRow}>
          <Pressable
            style={[styles.clearBtn, { borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
            onPress={onClear}
          >
            <Ionicons name="close-circle-outline" size={13} color={colors.textMuted} />
            <Text style={[styles.clearBtnText, { color: colors.textSecondary }]}>Limpiar filtros</Text>
          </Pressable>
        </View>
      )}
    </>
  );
}
