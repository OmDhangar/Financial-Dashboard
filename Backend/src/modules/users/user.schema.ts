// src/modules/users/user.schema.ts
import { z } from 'zod';
import { Role, UserStatus } from '@prisma/client';

export const createUserSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email address').toLowerCase(),
        name: z.string().min(2).max(100).trim(),
        password: z
            .string()
            .min(8)
            .max(72)
            .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
        role: z.nativeEnum(Role).optional().default(Role.VIEWER),
    }),
});

export const updateUserSchema = z.object({
    params: z.object({ id: z.string().uuid('Invalid user ID') }),
    body: z.object({
        name: z.string().min(2).max(100).trim().optional(),
        email: z.string().email().toLowerCase().optional(),
    }).refine((data) => Object.keys(data).length > 0, {
        message: 'At least one field must be provided for update',
    }),
});

export const updateUserRoleSchema = z.object({
    params: z.object({ id: z.string().uuid('Invalid user ID') }),
    body: z.object({
        role: z.nativeEnum(Role, { errorMap: () => ({ message: 'Invalid role' }) }),
    }),
});

export const updateUserStatusSchema = z.object({
    params: z.object({ id: z.string().uuid('Invalid user ID') }),
    body: z.object({
        status: z.nativeEnum(UserStatus, { errorMap: () => ({ message: 'Invalid status' }) }),
    }),
});

export const userIdParamSchema = z.object({
    params: z.object({ id: z.string().uuid('Invalid user ID') }),
});

const listUsersQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    role: z.nativeEnum(Role).optional(),
    status: z.nativeEnum(UserStatus).optional(),
    search: z.string().max(100).optional(),
});

export const listUsersSchema = z.object({
    query: listUsersQuerySchema,
});

export type CreateUserDto = z.infer<typeof createUserSchema>['body'];
export type UpdateUserDto = z.infer<typeof updateUserSchema>['body'];
export type UpdateUserRoleDto = z.infer<typeof updateUserRoleSchema>['body'];
export type UpdateUserStatusDto = z.infer<typeof updateUserStatusSchema>['body'];
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;