import apiClient from "./client";
import type { ApiSuccessResponse, Category } from "@/types";

export const categoriesService = {
  async getAll() {
    const res = await apiClient.get<ApiSuccessResponse<Category[]>>("/categories");
    return res.data.data;
  },

  async create(payload: { name: string }) {
    const res = await apiClient.post<ApiSuccessResponse<Category>>("/categories", payload);
    return res.data.data;
  },

  async delete(id: string) {
    await apiClient.delete(`/categories/${id}`);
  },
};
