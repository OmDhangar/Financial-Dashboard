// tests/integration/records.test.ts
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
import { describe, beforeEach, it } from 'node:test';

const app = createApp();

describe('Records Routes — Integration', () => {
    let adminToken: string;
    let analystToken: string;
    let viewerToken: string;
    let categoryId: string;

    beforeAll(async () => {
        await cleanDatabase();

        const [admin, analyst, viewer, category] = await Promise.all([
            getAuthToken(app, Role.ADMIN),
            getAuthToken(app, Role.ANALYST),
            getAuthToken(app, Role.VIEWER),
            createTestCategory('Salary'),
        ]);

        adminToken = admin.token;
        analystToken = analyst.token;
        viewerToken = viewer.token;
        categoryId = category.id;
    });

    afterAll(async () => {
        await cleanDatabase();
        await testPrisma.$disconnect();
    });

    // ─── GET /api/v1/records ──────────────────────────────────────────────────────

    describe('GET /api/v1/records', () => {
        beforeEach(async () => {
            await testPrisma.record.deleteMany();
        });

        it('should return paginated records for all authenticated roles', async () => {
            const user = await createTestUser({ role: Role.ADMIN });
            await createTestRecord(user.id, categoryId, { amount: 1000, type: 'INCOME' });
            await createTestRecord(user.id, categoryId, { amount: 500, type: 'EXPENSE' });

            const res = await request(app)
                .get('/api/v1/records')
                .set(authHeader(viewerToken));

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.meta).toBeDefined();
            expect(res.body.meta.total).toBeGreaterThanOrEqual(2);
        });

        it('should filter records by type', async () => {
            const user = await createTestUser({ role: Role.ADMIN });
            await createTestRecord(user.id, categoryId, { type: 'INCOME' });
            await createTestRecord(user.id, categoryId, { type: 'EXPENSE' });

            const res = await request(app)
                .get('/api/v1/records?type=INCOME')
                .set(authHeader(viewerToken));

            expect(res.status).toBe(200);
            expect(res.body.data.every((r: { type: string }) => r.type === 'INCOME')).toBe(true);
        });

        it('should return 401 without authentication', async () => {
            const res = await request(app).get('/api/v1/records');
            expect(res.status).toBe(401);
        });
    });

    // ─── POST /api/v1/records ─────────────────────────────────────────────────────

    describe('POST /api/v1/records', () => {
        const validPayload = () => ({
            amount: 15000,
            type: 'INCOME',
            categoryId,
            date: new Date().toISOString(),
            notes: 'Monthly salary',
        });

        it('should create a record as ADMIN', async () => {
            const res = await request(app)
                .post('/api/v1/records')
                .set(authHeader(adminToken))
                .send(validPayload());

            expect(res.status).toBe(201);
            expect(res.body.data.amount).toBe('15000.00');
            expect(res.body.data.type).toBe('INCOME');
            expect(res.body.data.category.id).toBe(categoryId);
        });

        it('should return 403 for VIEWER', async () => {
            const res = await request(app)
                .post('/api/v1/records')
                .set(authHeader(viewerToken))
                .send(validPayload());

            expect(res.status).toBe(403);
        });
    });

    // ─── PATCH /api/v1/records/:id ────────────────────────────────────────────────

    describe('PATCH /api/v1/records/:id', () => {
        it('should update a record as ADMIN', async () => {
            const user = await createTestUser({ role: Role.ADMIN });
            const record = await createTestRecord(user.id, categoryId, { notes: 'Original' });

            const res = await request(app)
                .patch(`/api/v1/records/${record.id}`)
                .set(authHeader(adminToken))
                .send({ notes: 'Updated' });

            expect(res.status).toBe(200);
            expect(res.body.data.notes).toBe('Updated');
        });
    });

    // ─── DELETE /api/v1/records/:id ───────────────────────────────────────────────

    describe('DELETE /api/v1/records/:id', () => {
        it('should soft-delete a record as ADMIN', async () => {
            const user = await createTestUser({ role: Role.ADMIN });
            const record = await createTestRecord(user.id, categoryId);

            const deleteRes = await request(app)
                .delete(`/api/v1/records/${record.id}`)
                .set(authHeader(adminToken));

            expect(deleteRes.status).toBe(200);

            const dbRecord = await testPrisma.record.findUnique({ where: { id: record.id } });
            expect(dbRecord?.deletedAt).not.toBeNull();
        });
    });
});
