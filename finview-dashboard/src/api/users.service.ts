import apiClient from "./client";
import type { ApiSuccessResponse, User, PaginationMeta, UserFilters } from "@/types";

interface PaginatedUsers {
  data: User[];
  meta: PaginationMeta;
}

export const usersService = {
  async getAll(filters: UserFilters = {}): Promise<PaginatedUsers> {
    const params: Record<string, string | number> = {};
    if (filters.role) params.role = filters.role;
    if (filters.status) params.status = filters.status;
    if (filters.search) params.search = filters.search;
    params.page = filters.page || 1;
    params.limit = filters.limit || 10;

    const res = await apiClient.get<ApiSuccessResponse<User[]> & { meta: PaginationMeta }>("/users", { params });
    return { data: res.data.data, meta: res.data.meta! };
  },

  async getById(id: string) {
    const res = await apiClient.get<ApiSuccessResponse<User>>(`/users/${id}`);
    return res.data.data;
  },

  async create(payload: { name: string; email: string; password: string; role: string }) {
    const res = await apiClient.post<ApiSuccessResponse<User>>("/users", payload);
    return res.data.data;
  },

  async update(id: string, payload: Partial<{ name: string; email: string }>) {
    const res = await apiClient.patch<ApiSuccessResponse<User>>(`/users/${id}`, payload);
    return res.data.data;
  },

  async updateRole(id: string, role: string) {
    const res = await apiClient.patch<ApiSuccessResponse<User>>(`/users/${id}/role`, { role });
    return res.data.data;
  },

  async updateStatus(id: string, status: string) {
    const res = await apiClient.patch<ApiSuccessResponse<User>>(`/users/${id}/status`, { status });
    return res.data.data;
  },

  async delete(id: string) {
    await apiClient.delete(`/users/${id}`);
  },
};
