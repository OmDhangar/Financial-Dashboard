import apiClient from "./client";
import type { LoginPayload, LoginResponse, User, ApiSuccessResponse } from "@/types";

export const authService = {
  async login(payload: LoginPayload) {
    const res = await apiClient.post<ApiSuccessResponse<LoginResponse>>("/auth/login", payload);
    const { token, user } = res.data.data;
    localStorage.setItem("auth_token", token);
    localStorage.setItem("auth_user", JSON.stringify(user));
    return { token, user };
  },

  async me() {
    const res = await apiClient.get<ApiSuccessResponse<User>>("/auth/me");
    return res.data.data;
  },

  async logout() {
    try {
      await apiClient.post("/auth/logout");
    } finally {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
    }
  },

  async register(payload: { name: string; email: string; password: string }) {
    const res = await apiClient.post<ApiSuccessResponse<LoginResponse>>("/auth/register", payload);
    return res.data.data;
  },
};
