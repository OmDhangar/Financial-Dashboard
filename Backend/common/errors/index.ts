// src/common/errors/index.ts
import { AppError, ErrorDetail } from './AppError';

export { AppError, ErrorDetail };

export class ValidationError extends AppError {
    constructor(details?: ErrorDetail[]) {
        super('Request validation failed', 400, 'VALIDATION_ERROR', details);
    }
}

export class BadRequestError extends AppError {
    constructor(message = 'Bad request') {
        super(message, 400, 'BAD_REQUEST');
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = 'Authentication required') {
        super(message, 401, 'UNAUTHORIZED');
    }
}

export class ForbiddenError extends AppError {
    constructor(message = 'Insufficient permissions') {
        super(message, 403, 'FORBIDDEN');
    }
}

export class NotFoundError extends AppError {
    constructor(resource = 'Resource') {
        super(`${resource} not found`, 404, 'NOT_FOUND');
    }
}

export class ConflictError extends AppError {
    constructor(message = 'A record with this value already exists') {
        super(message, 409, 'CONFLICT');
    }
}

export class InternalError extends AppError {
    constructor(message = 'An unexpected error occurred') {
        super(message, 500, 'INTERNAL_SERVER_ERROR', undefined, false);
    }
}