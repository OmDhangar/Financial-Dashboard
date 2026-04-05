// src/modules/records/record.schema.ts
import { z } from 'zod';
import { RecordType } from '@prisma/client';

export const createRecordSchema = z.object({
    body: z.object({
        amount: z
            .number({ invalid_type_error: 'Amount must be a number' })
            .positive('Amount must be positive')
            .multipleOf(0.01, 'Amount cannot have more than 2 decimal places'),
        type: z.nativeEnum(RecordType, { errorMap: () => ({ message: 'Type must be INCOME or EXPENSE' }) }),
        categoryId: z.string().uuid('Invalid category ID'),
        date: z.coerce.date({ errorMap: () => ({ message: 'Invalid date format' }) }),
        notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
    }),
});

export const updateRecordSchema = z.object({
    params: z.object({ id: z.string().uuid('Invalid record ID') }),
    body: z
        .object({
            amount: z.number().positive('Amount must be positive').multipleOf(0.01).optional(),
            type: z.nativeEnum(RecordType).optional(),
            categoryId: z.string().uuid('Invalid category ID').optional(),
            date: z.coerce.date().optional(),
            notes: z.string().max(500).optional().nullable(),
        })
        .refine((data) => Object.keys(data).length > 0, {
            message: 'At least one field must be provided for update',
        }),
});

export const recordIdParamSchema = z.object({
    params: z.object({ id: z.string().uuid('Invalid record ID') }),
});

export const listRecordsQuerySchema = z.object({
    type: z.nativeEnum(RecordType).optional(),
    categoryId: z.string().uuid().optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    search: z.string().max(100).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sortBy: z.enum(['date', 'amount', 'createdAt']).default('date'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    includeDeleted: z.coerce.boolean().optional(),
});

export const listRecordsSchema = z.object({
    query: listRecordsQuerySchema,
});

export type CreateRecordDto = z.infer<typeof createRecordSchema>['body'];
export type UpdateRecordDto = z.infer<typeof updateRecordSchema>['body'];
export type ListRecordsQuery = z.infer<typeof listRecordsQuerySchema>;