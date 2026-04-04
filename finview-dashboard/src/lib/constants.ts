import type { Role } from "@/types";

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  ADMIN: ["dashboard", "records", "users", "categories", "analytics", "settings"],
  ANALYST: ["dashboard", "records", "analytics", "settings"],
  VIEWER: ["records", "settings"],
};

export function hasAccess(role: Role, page: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(page) ?? false;
}
