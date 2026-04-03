// src/middleware/rateLimiter.ts
import rateLimit from 'express-rate-limit';
import { config } from '../config/env';
import { apiResponse } from '../../common/response/ApiResponse';

/**
 * General API rate limiter applied to all routes.
 */
export const generalLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: apiResponse.error('RATE_LIMIT_EXCEEDED', 'Too many requests, please try again later.'),
});

/**
 * Strict limiter for auth endpoints (register, login).
 * Prevents brute-force attacks.
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: config.rateLimit.authMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: apiResponse.error(
        'RATE_LIMIT_EXCEEDED',
        'Too many authentication attempts. Please try again in 15 minutes.',
    ),
    skipSuccessfulRequests: true, // Only count failed requests
});

/**
 * Moderate limiter for dashboard analytics endpoints.
 * These are computationally heavier than simple CRUD.
 */
export const dashboardLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: apiResponse.error(
        'RATE_LIMIT_EXCEEDED',
        'Dashboard rate limit exceeded. Please slow down your requests.',
    ),
});