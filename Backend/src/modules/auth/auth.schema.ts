// src/modules/auth/auth.schema.ts
import { z } from 'zod';

export const registerSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email address').toLowerCase(),
        name: z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
        password: z
            .string()
            .min(8, 'Password must be at least 8 characters')
            .max(72, 'Password cannot exceed 72 characters')
            .regex(
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                'Password must contain at least one uppercase letter, one lowercase letter, and one number',
            ),
    }),
});

export const loginSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email address').toLowerCase(),
        password: z.string().min(1, 'Password is required'),
    }),
});

export type RegisterDto = z.infer<typeof registerSchema>['body'];
export type LoginDto = z.infer<typeof loginSchema>['body'];