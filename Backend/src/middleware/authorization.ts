// src/middleware/authorize.ts
import { Role } from '@prisma/client';
import { RequestHandler } from 'express';
import { ForbiddenError, UnauthorizedError } from '../../common/errors';

/**
 * Role guard factory. Accepts one or more permitted roles.
 * Short-circuits with 403 if the authenticated user's role is not in the list.
 *
 * Usage: router.post('/records', authenticate, authorize('ADMIN'), handler)
 *        router.get('/dashboard', authenticate, authorize('ANALYST', 'ADMIN'), handler)
 */
export const authorize = (...roles: Role[]): RequestHandler => {
    return (req, _res, next): void => {
        if (!req.user) {
            next(new UnauthorizedError('Authentication required'));
            return;
        }

        if (!roles.includes(req.user.role)) {
            next(new ForbiddenError(`Access restricted to: ${roles.join(', ')}`));
            return;
        }

        next();
    };
};