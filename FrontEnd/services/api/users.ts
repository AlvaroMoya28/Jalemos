// Admin user-management API.
import { get, patch } from "./client";

export interface AdminUserDTO {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "admin" | "passenger" | "driver";
  meanRating: number;
  totalTrips: number;
  kms: number;
  isActive: boolean;
  suspendedUntil: string | null;
  createdAt: string;
  profilePhotoUrl: string | null;
}

export interface PagedUsersResponse {
  users: AdminUserDTO[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface UsersQueryParams {
  search?: string;
  role?: "admin" | "passenger" | "driver";
  status?: "active" | "suspended" | "deactivated";
  sortBy?:
    | "name_asc"
    | "name_desc"
    | "rating_asc"
    | "rating_desc"
    | "trips_asc"
    | "trips_desc"
    | "newest"
    | "oldest";
  page?: number;
  pageSize?: number;
}

export const usersApi = {
  getAll: (params: UsersQueryParams, token: string) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.role) qs.set("role", params.role);
    if (params.status) qs.set("status", params.status);
    if (params.sortBy) qs.set("sortBy", params.sortBy);
    if (params.page) qs.set("page", String(params.page));
    if (params.pageSize) qs.set("pageSize", String(params.pageSize));
    const q = qs.toString();
    return get<PagedUsersResponse>(`/api/users${q ? `?${q}` : ""}`, token);
  },

  getById: (id: string, token: string) =>
    get<AdminUserDTO>(`/api/users/${id}`, token),

  changeRole: (id: string, role: "admin" | "passenger" | "driver", token: string) =>
    patch<void>(`/api/users/${id}/role`, { role }, token),

  ban: (id: string, days: number, token: string) =>
    patch<void>(`/api/users/${id}/ban`, { days }, token),

  liftBan: (id: string, token: string) =>
    patch<void>(`/api/users/${id}/lift-ban`, {}, token),

  deactivate: (id: string, token: string) =>
    patch<void>(`/api/users/${id}/deactivate`, {}, token),

  activate: (id: string, token: string) =>
    patch<void>(`/api/users/${id}/activate`, {}, token),
};
