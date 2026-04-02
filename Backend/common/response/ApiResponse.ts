// src/common/response/apiResponse.ts
import { ErrorDetail } from '../errors/AppError';

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface SuccessResponse<T> {
    success: true;
    data: T;
    meta?: PaginationMeta;
}

export interface ErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        details?: ErrorDetail[];
    };
}

export const apiResponse = {
    success<T>(data: T, meta?: PaginationMeta): SuccessResponse<T> {
        return { success: true, data, ...(meta ? { meta } : {}) };
    },

    error(code: string, message: string, details?: ErrorDetail[]): ErrorResponse {
        return {
            success: false,
            error: { code, message, ...(details ? { details } : {}) },
        };
    },

    paginated<T>(data: T[], page: number, limit: number, total: number): SuccessResponse<T[]> {
        return {
            success: true,
            data,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    },
};