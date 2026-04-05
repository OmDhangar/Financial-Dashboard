// src/modules/dashboard/dashboard.schema.ts
import { z } from 'zod';

const currentYear = new Date().getFullYear();

export const summaryQuerySchema = z.object({
    query: z.object({
        period: z.enum(['weekly', 'monthly', 'yearly']).default('monthly'),
        year: z.coerce
            .number()
            .int()
            .min(2000)
            .max(currentYear + 1)
            .optional(),
        month: z.coerce.number().int().min(1).max(12).optional(),
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
    }),
});

export const trendsQuerySchema = z.object({
    query: z.object({
        year: z.coerce
            .number()
            .int()
            .min(2000)
            .max(currentYear + 1)
            .default(currentYear),
    }),
});

export const categoryBreakdownQuerySchema = z.object({
    query: z.object({
        period: z.enum(['weekly', 'monthly', 'yearly']).default('monthly'),
        year: z.coerce.number().int().min(2000).max(currentYear + 1).optional(),
        month: z.coerce.number().int().min(1).max(12).optional(),
        // Optional: filter by a specific user (ANALYST/ADMIN only)
        userId: z.string().uuid().optional(),
    }),
});

export const recentQuerySchema = z.object({
    query: z.object({
        limit: z.coerce.number().int().min(1).max(50).default(10),
    }),
});

export const expensesByUserQuerySchema = z.object({
    query: z.object({}),
});

export type SummaryQuery = z.infer<typeof summaryQuerySchema>['query'];
export type TrendsQuery = z.infer<typeof trendsQuerySchema>['query'];
export type CategoryBreakdownQuery = z.infer<typeof categoryBreakdownQuerySchema>['query'];
export type RecentQuery = z.infer<typeof recentQuerySchema>['query'];
export type ExpensesByUserQuery = z.infer<typeof expensesByUserQuerySchema>['query'];