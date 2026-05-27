// Context for admin user management — paginated list with filters and admin actions.

import { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { AdminUserDTO, PagedUsersResponse, UsersQueryParams, usersApi } from '@/services/api';
import { useAuth } from '@/contexts/auth';

export type UserRole   = 'admin' | 'passenger' | 'driver';
export type UserStatus = 'all' | 'active' | 'suspended' | 'deactivated';
export type SortBy     =
  | 'name_asc' | 'name_desc'
  | 'rating_asc' | 'rating_desc'
  | 'trips_asc' | 'trips_desc'
  | 'newest' | 'oldest';

export interface AdminUser extends AdminUserDTO {
  avatar: string;
  displayStatus: 'active' | 'suspended' | 'deactivated';
}

export interface UserFilters {
  search:   string;
  role:     'all' | UserRole;
  status:   UserStatus;
  sortBy:   SortBy;
  page:     number;
}

const DEFAULT_FILTERS: UserFilters = {
  search: '',
  role:   'all',
  status: 'all',
  sortBy: 'name_asc',
  page:   1,
};

const PAGE_SIZE = 30;

interface AdminUsersContextValue {
  users:       AdminUser[];
  totalCount:  number;
  totalPages:  number;
  filters:     UserFilters;
  loading:     boolean;
  error:       string | null;
  setFilters:  (partial: Partial<UserFilters>) => void;
  loadUsers:   () => Promise<void>;
  changeRole:  (userId: string, role: UserRole) => Promise<void>;
  ban:         (userId: string, days: number) => Promise<void>;
  liftBan:     (userId: string) => Promise<void>;
  deactivate:  (userId: string) => Promise<void>;
  activate:    (userId: string) => Promise<void>;
}

const AdminUsersContext = createContext<AdminUsersContextValue>({
  users: [], totalCount: 0, totalPages: 0,
  filters: DEFAULT_FILTERS, loading: false, error: null,
  setFilters: () => {},
  loadUsers:  async () => {},
  changeRole: async () => {},
  ban:        async () => {},
  liftBan:    async () => {},
  deactivate: async () => {},
  activate:   async () => {},
});

function computeStatus(u: AdminUserDTO): 'active' | 'suspended' | 'deactivated' {
  if (!u.isActive) return 'deactivated';
  if (u.suspendedUntil && new Date(u.suspendedUntil) > new Date()) return 'suspended';
  return 'active';
}

function toAdminUser(u: AdminUserDTO): AdminUser {
  const initials = `${u.firstName[0] ?? ''}${u.lastName[0] ?? ''}`.toUpperCase();
  return { ...u, avatar: initials, displayStatus: computeStatus(u) };
}

export function AdminUsersProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [users,      setUsers]      = useState<AdminUser[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [filters,    setFiltersState] = useState<UserFilters>(DEFAULT_FILTERS);

  const setFilters = useCallback((partial: Partial<UserFilters>) => {
    setFiltersState((prev) => {
      const next = { ...prev, ...partial };
      // Reset page when any filter (except page itself) changes
      if (Object.keys(partial).some((k) => k !== 'page')) next.page = 1;
      return next;
    });
  }, []);

  const loadUsers = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const params: UsersQueryParams = {
        page:     filters.page,
        pageSize: PAGE_SIZE,
        sortBy:   filters.sortBy,
      };
      if (filters.search)         params.search = filters.search;
      if (filters.role !== 'all') params.role   = filters.role as UserRole;
      if (filters.status !== 'all') params.status = filters.status as 'active' | 'suspended' | 'deactivated';

      const res: PagedUsersResponse = await usersApi.getAll(params, token);
      setUsers(res.users.map(toAdminUser));
      setTotalCount(res.totalCount);
      setTotalPages(res.totalPages);
    } catch (e: any) {
      setError(e?.message ?? 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  }, [token, filters]);

  const changeRole = useCallback(async (userId: string, role: UserRole) => {
    if (!token) return;
    await usersApi.changeRole(userId, role, token);
    await loadUsers();
  }, [token, loadUsers]);

  const ban = useCallback(async (userId: string, days: number) => {
    if (!token) return;
    await usersApi.ban(userId, days, token);
    await loadUsers();
  }, [token, loadUsers]);

  const liftBan = useCallback(async (userId: string) => {
    if (!token) return;
    await usersApi.liftBan(userId, token);
    await loadUsers();
  }, [token, loadUsers]);

  const deactivate = useCallback(async (userId: string) => {
    if (!token) return;
    await usersApi.deactivate(userId, token);
    await loadUsers();
  }, [token, loadUsers]);

  const activate = useCallback(async (userId: string) => {
    if (!token) return;
    await usersApi.activate(userId, token);
    await loadUsers();
  }, [token, loadUsers]);

  return (
    <AdminUsersContext.Provider value={{
      users, totalCount, totalPages, filters, loading, error,
      setFilters, loadUsers, changeRole, ban, liftBan, deactivate, activate,
    }}>
      {children}
    </AdminUsersContext.Provider>
  );
}

export const useAdminUsers = () => useContext(AdminUsersContext);
