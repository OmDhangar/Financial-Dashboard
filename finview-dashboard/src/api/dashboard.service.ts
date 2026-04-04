import apiClient from "./client";
import type { ApiSuccessResponse, DashboardSummary, Trend, CategoryBreakdown, FinancialRecord } from "@/types";

export const dashboardService = {
  async getSummary() {
    const res = await apiClient.get<ApiSuccessResponse<DashboardSummary>>("/dashboard/summary");
    return res.data.data;
  },

  async getTrends() {
    const res = await apiClient.get<ApiSuccessResponse<Trend[]>>("/dashboard/trends");
    return res.data.data;
  },

  async getCategories() {
    const res = await apiClient.get<ApiSuccessResponse<CategoryBreakdown[]>>("/dashboard/categories");
    return res.data.data;
  },

  async getRecent() {
    const res = await apiClient.get<ApiSuccessResponse<FinancialRecord[]>>("/dashboard/recent");
    return res.data.data;
  },
};
