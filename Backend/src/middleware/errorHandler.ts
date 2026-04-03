// src/middleware/errorHandler.ts
import { ErrorRequestHandler } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../../common/errors/AppError';
import { apiResponse } from '../../common/response/ApiResponse';
import { logger } from '../config/logger';
import { config } from '../config/env';

export const errorHandler: ErrorRequestHandler = (err, req, res, _next): void => {
    // Structured error log — always includes request context
    logger.error({
        message: err instanceof Error ? err.message : 'Unknown error',
        code: err instanceof AppError ? err.code : 'INTERNAL_SERVER_ERROR',
        path: req.path,
        method: req.method,
        userId: req.user?.id ?? null,
        stack: !config.app.isProduction && err instanceof Error ? err.stack : undefined,
    });

    // Known operational errors — safe to expose to client
    if (err instanceof AppError) {
        res
            .status(err.statusCode)
            .json(apiResponse.error(err.code, err.message, err.details));
        return;
    }

    // Prisma constraint errors — translate to user-friendly messages
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        switch (err.code) {
            case 'P2002': {
                const fields = Array.isArray(err.meta?.target)
                    ? (err.meta.target as string[]).join(', ')
                    : 'field';
                res
                    .status(409)
                    .json(apiResponse.error('CONFLICT', `A record with this ${fields} already exists`));
                return;
            }
            case 'P2025': {
                res.status(404).json(apiResponse.error('NOT_FOUND', 'Record not found'));
                return;
            }
            case 'P2003': {
                res
                    .status(400)
                    .json(apiResponse.error('BAD_REQUEST', 'Referenced resource does not exist'));
                return;
            }
            default: {
                res
                    .status(500)
                    .json(apiResponse.error('DATABASE_ERROR', 'A database error occurred'));
                return;
            }
        }
    }

    if (err instanceof Prisma.PrismaClientValidationError) {
        res.status(400).json(apiResponse.error('VALIDATION_ERROR', 'Invalid data provided'));
        return;
    }

    // Fallback — never expose internal details in production
    res
        .status(500)
        .json(
            apiResponse.error(
                'INTERNAL_SERVER_ERROR',
                config.app.isProduction
                    ? 'An unexpected error occurred'
                    : (err instanceof Error ? err.message : 'Unknown error'),
            ),
        );
};