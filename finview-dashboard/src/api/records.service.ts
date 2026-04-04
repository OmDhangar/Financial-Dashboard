import apiClient from "./client";
import type { ApiSuccessResponse, FinancialRecord, PaginationMeta, RecordFilters } from "@/types";

interface PaginatedRecords {
  data: FinancialRecord[];
  meta: PaginationMeta;
}

export const recordsService = {
  async getAll(filters: RecordFilters = {}): Promise<PaginatedRecords> {
    const params: Record<string, string | number> = {};
    if (filters.type) params.type = filters.type;
    if (filters.categoryId) params.categoryId = filters.categoryId;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    if (filters.search) params.search = filters.search;
    params.page = filters.page || 1;
    params.limit = filters.limit || 10;

    const res = await apiClient.get<ApiSuccessResponse<FinancialRecord[]> & { meta: PaginationMeta }>("/records", { params });
    return { data: res.data.data, meta: res.data.meta! };
  },

  async getById(id: string) {
    const res = await apiClient.get<ApiSuccessResponse<FinancialRecord>>(`/records/${id}`);
    return res.data.data;
  },

  async create(payload: { amount: string; type: string; categoryId: string; date: string; notes?: string }) {
    const res = await apiClient.post<ApiSuccessResponse<FinancialRecord>>("/records", payload);
    return res.data.data;
  },

  async update(id: string, payload: Partial<{ amount: string; type: string; categoryId: string; date: string; notes?: string }>) {
    const res = await apiClient.patch<ApiSuccessResponse<FinancialRecord>>(`/records/${id}`, payload);
    return res.data.data;
  },

  async delete(id: string) {
    await apiClient.delete(`/records/${id}`);
  },
};
