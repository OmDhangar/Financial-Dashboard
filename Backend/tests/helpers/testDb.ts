// tests/helpers/testDb.ts
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

// Use a dedicated test database — never run against the main DB
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL ?? '';

export const testPrisma = new PrismaClient({
    datasources: { db: { url: TEST_DATABASE_URL } },
});

export const cleanDatabase = async (): Promise<void> => {
    // Delete in dependency order to respect FK constraints
    await testPrisma.record.deleteMany();
    await testPrisma.category.deleteMany();
    await testPrisma.user.deleteMany();
};

export const createTestUser = async (
    overrides: Partial<{
        email: string;
        name: string;
        password: string;
        role: Role;
    }> = {},
) => {
    const passwordHash = await bcrypt.hash(overrides.password ?? 'Password123!', 12);

    return testPrisma.user.create({
        data: {
            email: overrides.email ?? `test-${Date.now()}@example.com`,
            name: overrides.name ?? 'Test User',
            passwordHash,
            role: overrides.role ?? Role.VIEWER,
        },
    });
};

export const createTestCategory = async (name = `Category-${Date.now()}`) => {
    return testPrisma.category.create({ data: { name } });
};

export const createTestRecord = async (
    userId: string,
    categoryId: string,
    overrides: Partial<{
        amount: number;
        type: 'INCOME' | 'EXPENSE';
        date: Date;
        notes: string;
    }> = {},
) => {
    return testPrisma.record.create({
        data: {
            amount: overrides.amount ?? 1000,
            type: overrides.type ?? 'INCOME',
            categoryId,
            date: overrides.date ?? new Date(),
            notes: overrides.notes,
            createdById: userId,
        },
    });
};