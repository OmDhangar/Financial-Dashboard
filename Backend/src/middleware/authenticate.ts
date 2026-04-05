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

// ─── Simple LRU-like user cache ──────────────────────────────────────────────
// Avoids a DB round-trip on every authenticated request.
// TTL: 30 seconds — short enough to propagate role changes quickly.
const USER_CACHE_TTL_MS = 30_000;

interface CacheEntry {
    user: AuthenticatedUser;
    expiresAt: number;
}

const userCache = new Map<string, CacheEntry>();

function getCachedUser(userId: string): AuthenticatedUser | null {
    const entry = userCache.get(userId);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
        userCache.delete(userId);
        return null;
    }
    return entry.user;
}

function setCachedUser(userId: string, user: AuthenticatedUser): void {
    // Prevent unbounded growth — evict oldest if over 1000 entries
    if (userCache.size >= 1000) {
        const firstKey = userCache.keys().next().value;
        if (firstKey) userCache.delete(firstKey);
    }
    userCache.set(userId, { user, expiresAt: Date.now() + USER_CACHE_TTL_MS });
}

/** Invalidate a specific user from cache (call after role/status changes) */
export function invalidateUserCache(userId: string): void {
    userCache.delete(userId);
}
// ─────────────────────────────────────────────────────────────────────────────

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

        // Try cache first — avoids DB on every request
        const cached = getCachedUser(payload.sub);
        if (cached) {
            req.user = cached;
            return next();
        }

        // Cache miss — fetch from DB
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

        const authenticatedUser = user as AuthenticatedUser;
        setCachedUser(payload.sub, authenticatedUser);
        req.user = authenticatedUser;
        next();
    } catch (error) {
        next(error);
    }
};