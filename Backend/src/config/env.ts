// src/config/env.ts
import * as env from 'env-var';
import dotenv from 'dotenv';

dotenv.config();

export const config = {
    app: {
        nodeEnv: env.get('NODE_ENV').default('development').asString(),
        port: env.get('PORT').default('3000').asPortNumber(),
        isProduction: env.get('NODE_ENV').default('development').asString() === 'production',
    },
    db: {
        url: env.get('DATABASE_URL').required().asString(),
    },
    jwt: {
        secret: env.get('JWT_SECRET').required().asString(),
        expiresIn: env.get('JWT_EXPIRES_IN').default('7d').asString(),
    },
    cors: {
        origin: env.get('CORS_ORIGIN').default('http://localhost:8080').asString(),
    },
    rateLimit: {
        windowMs: env.get('RATE_LIMIT_WINDOW_MS').default('900000').asIntPositive(),
        maxRequests: env.get('RATE_LIMIT_MAX_REQUESTS').default('100').asIntPositive(),
        authMax: env.get('AUTH_RATE_LIMIT_MAX').default('10').asIntPositive(),
    },
} as const;