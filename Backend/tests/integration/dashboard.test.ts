// tests/integration/dashboard.test.ts
import request from 'supertest';
import { Role } from '@prisma/client';
import { createApp } from '../../src/app';
import {
    cleanDatabase,
    createTestUser,
    createTestCategory,
    createTestRecord,
    testPrisma,
} from '../helpers/testDb';
import { getAuthToken, authHeader } from '../helpers/authHelpers';

const app = createApp();

describe('Dashboard Routes — Integration', () => {
    let adminToken: string;
    let analystToken: string;
    let viewerToken: string;

    beforeAll(async () => {
        await cleanDatabase();

        const [admin, analyst, viewer, category] = await Promise.all([
            getAuthToken(app, Role.ADMIN),
            getAuthToken(app, Role.ANALYST),
            getAuthToken(app, Role.VIEWER),
            createTestCategory('Test Income'),
        ]);

        adminToken = admin.token;
        analystToken = analyst.token;
        viewerToken = viewer.token;

        // Create seed records for analytics
        const adminUser = await createTestUser({ role: Role.ADMIN });
        const now = new Date();

        await Promise.all([
            createTestRecord(adminUser.id, category.id, {
                amount: 50000,
                type: 'INCOME',
                date: new Date(now.getFullYear(), now.getMonth(), 1),
            }),
            createTestRecord(adminUser.id, category.id, {
                amount: 20000,
                type: 'EXPENSE',
                date: new Date(now.getFullYear(), now.getMonth(), 10),
            }),
            createTestRecord(adminUser.id, category.id, {
                amount: 30000,
                type: 'INCOME',
                date: new Date(now.getFullYear(), now.getMonth(), 15),
            }),
        ]);
    });

    afterAll(async () => {
        await cleanDatabase();
        await testPrisma.$disconnect();
    });

    // ─── GET /api/v1/dashboard/summary ───────────────────────────────────────────

    describe('GET /api/v1/dashboard/summary', () => {
        it('should return summary for ADMIN', async () => {
            const res = await request(app)
                .get('/api/v1/dashboard/summary')
                .set(authHeader(adminToken));

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('totalIncome');
            expect(res.body.data).toHaveProperty('totalExpense');
            expect(res.body.data).toHaveProperty('netBalance');
            expect(res.body.data).toHaveProperty('transactionCount');
        });

        it('should return summary for ANALYST', async () => {
            const res = await request(app)
                .get('/api/v1/dashboard/summary')
                .set(authHeader(analystToken));

            expect(res.status).toBe(200);
        });

        it('should return 403 for VIEWER', async () => {
            const res = await request(app)
                .get('/api/v1/dashboard/summary')
                .set(authHeader(viewerToken));

            expect(res.status).toBe(403);
        });

        it('should return 401 without authentication', async () => {
            const res = await request(app).get('/api/v1/dashboard/summary');
            expect(res.status).toBe(401);
        });

        it('should accept period query param', async () => {
            const res = await request(app)
                .get('/api/v1/dashboard/summary?period=yearly')
                .set(authHeader(adminToken));

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveProperty('totalIncome');
        });

        it('should return netBalance = totalIncome - totalExpense', async () => {
            const res = await request(app)
                .get('/api/v1/dashboard/summary?period=yearly')
                .set(authHeader(adminToken));

            const { totalIncome, totalExpense, netBalance } = res.body.data as {
                totalIncome: string;
                totalExpense: string;
                netBalance: string;
            };

            const expected = (parseFloat(totalIncome) - parseFloat(totalExpense)).toFixed(2);
            expect(parseFloat(netBalance).toFixed(2)).toBe(expected);
        });
    });

    // ─── GET /api/v1/dashboard/trends ────────────────────────────────────────────

    describe('GET /api/v1/dashboard/trends', () => {
        it('should return monthly trend data for ADMIN', async () => {
            const res = await request(app)
                .get('/api/v1/dashboard/trends')
                .set(authHeader(adminToken));

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);
        });

        it('should return 403 for VIEWER', async () => {
            const res = await request(app)
                .get('/api/v1/dashboard/trends')
                .set(authHeader(viewerToken));

            expect(res.status).toBe(403);
        });

        it('should accept a year query param', async () => {
            const year = new Date().getFullYear();
            const res = await request(app)
                .get(`/api/v1/dashboard/trends?year=${year}`)
                .set(authHeader(analystToken));

            expect(res.status).toBe(200);
        });
    });

    // ─── GET /api/v1/dashboard/categories ────────────────────────────────────────

    describe('GET /api/v1/dashboard/categories', () => {
        it('should return category breakdown for ANALYST', async () => {
            const res = await request(app)
                .get('/api/v1/dashboard/categories?period=yearly')
                .set(authHeader(analystToken));

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);

            if (res.body.data.length > 0) {
                const row = res.body.data[0] as Record<string, unknown>;
                expect(row).toHaveProperty('categoryId');
                expect(row).toHaveProperty('categoryName');
                expect(row).toHaveProperty('type');
                expect(row).toHaveProperty('total');
                expect(row).toHaveProperty('count');
            }
        });
    });

    // ─── GET /api/v1/dashboard/recent ────────────────────────────────────────────

    describe('GET /api/v1/dashboard/recent', () => {
        it('should return recent records for VIEWER', async () => {
            const res = await request(app)
                .get('/api/v1/dashboard/recent')
                .set(authHeader(viewerToken));

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);
        });

        it('should respect the limit param', async () => {
            const res = await request(app)
                .get('/api/v1/dashboard/recent?limit=2')
                .set(authHeader(viewerToken));

            expect(res.status).toBe(200);
            expect(res.body.data.length).toBeLessThanOrEqual(2);
        });

        it('should return 400 for limit exceeding max', async () => {
            const res = await request(app)
                .get('/api/v1/dashboard/recent?limit=999')
                .set(authHeader(viewerToken));

            expect(res.status).toBe(400);
        });
    });
});
