// src/common/constants/roles.ts
import { Role } from '@prisma/client';

export { Role };

export const ROLES = {
    VIEWER: Role.VIEWER,
    ANALYST: Role.ANALYST,
    ADMIN: Role.ADMIN,
} as const;

/**
 * Ordered role hierarchy — higher index = more permissions.
 * Used for "at least this role" checks.
 */
export const ROLE_HIERARCHY: Role[] = [Role.VIEWER, Role.ANALYST, Role.ADMIN];

export const hasMinimumRole = (userRole: Role, minimumRole: Role): boolean => {
    return ROLE_HIERARCHY.indexOf(userRole) >= ROLE_HIERARCHY.indexOf(minimumRole);
};