// src/middleware/authenticate.ts
import { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { UnauthorizedError } from '../../common/errors';
import { prisma } from '../lib/prisma';
import { AuthenticatedUser } from '../../common/types/express';

interface JwtPayload {
    sub: string;
    email: string;
    role: string;
    iat: number;
    exp: number;
}

export const authenticate: RequestHandler = async (req, _res, next): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader?.startsWith('Bearer ')) {
            throw new UnauthorizedError('No bearer token provided');
        }

        const token = authHeader.slice(7);

        let payload: JwtPayload;
        try {
            payload = jwt.verify(token, config.jwt.secret) as JwtPayload;
        } catch {
            throw new UnauthorizedError('Invalid or expired token');
        }

        // Fetch fresh user data — validates user still exists and is active
        const user = await prisma.user.findFirst({
            where: { id: payload.sub, deletedAt: null },
            select: { id: true, email: true, name: true, role: true, status: true },
        });

        if (!user) {
            throw new UnauthorizedError('User account not found');
        }

        if (user.status === 'INACTIVE') {
            throw new UnauthorizedError('User account is inactive');
        }

        req.user = user as AuthenticatedUser;
        next();
    } catch (error) {
        next(error);
    }
};