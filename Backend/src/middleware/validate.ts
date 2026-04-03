// src/middleware/validate.ts
import { RequestHandler } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ValidationError } from '../../common/errors';
import { ErrorDetail } from '../../common/errors/AppError';

/**
 * Zod validation middleware factory.
 * Validates req.body, req.query, and req.params against the provided schema.
 * On success, overwrites req with coerced + sanitized values.
 */
export const validate = (schema: AnyZodObject): RequestHandler => {
    return async (req, _res, next): Promise<void> => {
        const result = await schema.safeParseAsync({
            body: req.body,
            query: req.query,
            params: req.params,
        });

        if (!result.success) {
            const details = flattenZodErrors(result.error);
            next(new ValidationError(details));
            return;
        }

        // Overwrite with parsed (coerced, sanitized) values
        const parsed = result.data as { body?: unknown; query?: unknown; params?: unknown };
        if (parsed.body !== undefined) req.body = parsed.body;
        if (parsed.query !== undefined) Object.assign(req.query, parsed.query);
        if (parsed.params !== undefined) Object.assign(req.params, parsed.params);

        next();
    };
};

function flattenZodErrors(error: ZodError): ErrorDetail[] {
    return error.errors.map((e) => ({
        field: e.path.filter((p) => p !== 'body' && p !== 'query' && p !== 'params').join('.'),
        message: e.message,
    }));
}