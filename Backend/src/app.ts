// src/app.ts
import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { config } from './config/env';
import { logger } from './config/logger';
import { generalLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { apiResponse } from '../common/response/ApiResponse';

// Route modules
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/user.routes';
import recordRoutes from './modules/records/record.routes';
import categoryRoutes from './modules/categories/category.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';

export const createApp = (): Application => {
    const app = express();

    // ─── Security ────────────────────────────────────────────────────────────────
    app.use(helmet());
    app.use(
        cors({
            origin: config.cors.origin,
            methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization'],
            credentials: true,
        }),
    );

    // ─── Body Parsing ─────────────────────────────────────────────────────────────
    app.use(express.json({ limit: '10kb' })); // Hard cap prevents oversized payloads
    app.use(express.urlencoded({ extended: true, limit: '10kb' }));

    // ─── HTTP Request Logging ─────────────────────────────────────────────────────
    app.use(
        morgan('combined', {
            stream: { write: (message) => logger.http(message.trim()) },
            skip: () => config.app.nodeEnv === 'test',
        }),
    );

    // ─── Global Rate Limiter ──────────────────────────────────────────────────────
    app.use('/api', generalLimiter);

    // ─── Health Check ─────────────────────────────────────────────────────────────
    app.get('/health', (_req: Request, res: Response) => {
        res.status(200).json(
            apiResponse.success({
                status: 'ok',
                environment: config.app.nodeEnv,
                timestamp: new Date().toISOString(),
            }),
        );
    });

    // ─── API Routes ───────────────────────────────────────────────────────────────
    app.use('/api/v1/auth', authRoutes);
    app.use('/api/v1/users', userRoutes);
    app.use('/api/v1/records', recordRoutes);
    app.use('/api/v1/categories', categoryRoutes);
    app.use('/api/v1/dashboard', dashboardRoutes);

    // ─── 404 Handler ─────────────────────────────────────────────────────────────
    app.use((req: Request, res: Response) => {
        res.status(404).json(
            apiResponse.error('NOT_FOUND', `Route ${req.method} ${req.path} not found`),
        );
    });

    // ─── Global Error Handler (must be last) ─────────────────────────────────────
    app.use(errorHandler);

    return app;
};