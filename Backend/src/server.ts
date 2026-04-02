// src/server.ts
import { config } from 'dotenv';
import { logger } from './config/logger';
import app from './app';

config();

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
});

const exitHandler = () => {
    logger.info('Server shutting down...');
    server.close(() => {
        logger.info('Server closed');
        process.exit(0);
    });
};

process.on('SIGTERM', exitHandler);
process.on('SIGINT', exitHandler);

process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception', { error: err.stack });
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection', { reason });
    process.exit(1);
});