// src/server.ts
import { createApp } from './app';
import { config } from './config/env';
import { logger } from './config/logger';
import { prisma } from './lib/prisma';

const app = createApp();

const server = app.listen(config.app.port, () => {
    logger.info(`🚀 Server running on port ${config.app.port} [${config.app.nodeEnv}]`);
});

// ─── Graceful Shutdown ────────────────────────────────────────────────────────

const shutdown = async (signal: string): Promise<void> => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);

    server.close(async () => {
        logger.info('HTTP server closed. Disconnecting database...');

        try {
            await prisma.$disconnect();
            logger.info('Database disconnected. Process exiting.');
            process.exit(0);
        } catch (err) {
            logger.error('Error during database disconnect', { err });
            process.exit(1);
        }
    });

    // Force exit after 10 seconds if connections do not drain
    setTimeout(() => {
        logger.error('Could not close connections in time — forcing exit.');
        process.exit(1);
    }, 10_000).unref();
};

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

process.on('unhandledRejection', (reason: unknown) => {
    logger.error('Unhandled Promise Rejection', { reason });
    void shutdown('unhandledRejection');
});

process.on('uncaughtException', (err: Error) => {
    logger.error('Uncaught Exception', { message: err.message, stack: err.stack });
    void shutdown('uncaughtException');
});

export default server;