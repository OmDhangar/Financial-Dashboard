// src/modules/categories/category.schema.ts
import { z } from 'zod';

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(100).trim(),
  }),
});

export const categoryIdParamSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid category ID') }),
});

export type CreateCategoryDto = z.infer<typeof createCategorySchema>['body'];
