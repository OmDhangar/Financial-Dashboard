import type { Role } from "@/types";

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  ADMIN: ["dashboard", "records", "users", "categories", "analytics", "analytics-by-user", "analytics-category", "settings"],
  ANALYST: ["dashboard", "records", "analytics", "analytics-by-user", "analytics-category", "settings"],
  VIEWER: ["dashboard", "records", "settings"],
};

export function hasAccess(role: Role, page: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(page) ?? false;
}
