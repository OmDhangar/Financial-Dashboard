import axios from "axios";
import { toast } from "sonner";

const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl) return "http://localhost:3000/api/v1";
  // Ensure the URL ends without a slash before appending /api/v1
  const cleanUrl = envUrl.replace(/\/$/, "");
  return cleanUrl.endsWith("/api/v1") ? cleanUrl : `${cleanUrl}/api/v1`;
};

const apiClient = axios.create({
  baseURL: getBaseURL(),
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const errData = error.response?.data;
    const message = errData?.error?.message || error.message || "Something went wrong";

    if (status === 401) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    } else if (status === 403) {
      window.location.href = "/unauthorized";
    } else if (status !== 422) {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
