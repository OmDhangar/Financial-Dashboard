export type Role = "VIEWER" | "ANALYST" | "ADMIN";
export type Status = "ACTIVE" | "INACTIVE";
export type RecordType = "INCOME" | "EXPENSE";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: Status;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialRecord {
  id: string;
  amount: string;
  type: RecordType;
  category: { id: string; name: string };
  categoryId: string;
  date: string;
  notes?: string;
  createdBy: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  createdAt: string;
}

export interface DashboardSummary {
  totalIncome: string;
  totalExpense: string;
  netBalance: string;
  transactionCount: number;
  isPersonal?: boolean;
}

export interface Trend {
  month: string;
  type: RecordType;
  total: string;
  count: number;
}

export interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  total: string;
  count: number;
  type: RecordType;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UserExpense {
  userId: string;
  userName: string;
  userEmail: string;
  totalExpense: string;
  totalIncome: string;
  netBalance: string;
  transactionCount: number;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: { field: string; message: string }[];
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RecordFilters {
  type?: RecordType | "";
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  includeDeleted?: boolean;
  page?: number;
  limit?: number;
}

export interface UserFilters {
  role?: Role | "";
  status?: Status | "";
  search?: string;
  page?: number;
  limit?: number;
}
