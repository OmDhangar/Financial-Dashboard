// src/common/errors/AppError.ts

export interface ErrorDetail {
    field?: string;
    message: string;
}

export class AppError extends Error {
    public readonly statusCode: number;
    public readonly code: string;
    public readonly isOperational: boolean;
    public readonly details?: ErrorDetail[];

    constructor(
        message: string,
        statusCode: number,
        code: string,
        details?: ErrorDetail[],
        isOperational = true,
    ) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = isOperational;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
}