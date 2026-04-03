// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';
import { logger } from '../config/logger';

declare global {
  // Prevent multiple instances during hot reload in dev
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

const createPrismaClient = (): PrismaClient => {
  const client = new PrismaClient({
    log: [
      { level: 'query', emit: 'event' },
      { level: 'error', emit: 'event' },
      { level: 'warn', emit: 'event' },
    ],
  });

  client.$on('query', (e: any) => {
    logger.debug('Prisma Query', { query: e.query, duration: `${e.duration}ms` });
  });

  client.$on('error', (e: any) => {
    logger.error('Prisma Error', { message: e.message });
  });

  client.$on('warn', (e: any) => {
    logger.warn('Prisma Warning', { message: e.message });
  });

  return client;
};

export const prisma: PrismaClient = globalThis.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}
