// src/config/logger.ts
import winston from 'winston';
import { config } from './env';

const { combine, timestamp, json, colorize, printf, errors } = winston.format;

const devFormat = combine(
    colorize(),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    printf(({ level, message, timestamp, stack, ...meta }) => {
        const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
        return `[${timestamp as string}] ${level}: ${message as string}${stack ? `\n${stack as string}` : ''}${metaStr}`;
    }),
);

const prodFormat = combine(
    timestamp(),
    errors({ stack: true }),
    json(),
);

export const logger = winston.createLogger({
    level: config.app.isProduction ? 'info' : 'debug',
    format: config.app.isProduction ? prodFormat : devFormat,
    defaultMeta: { service: 'finance-dashboard-api' },
    transports: [
        new winston.transports.Console(),
        ...(config.app.isProduction
            ? [
                new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
                new winston.transports.File({ filename: 'logs/combined.log' }),
            ]
            : []),
    ],
    exceptionHandlers: [new winston.transports.Console()],
    rejectionHandlers: [new winston.transports.Console()],
});