// tests/integration/users.test.ts
import request from 'supertest';
import { Role } from '@prisma/client';
import { createApp } from '../../src/app';
import { cleanDatabase, createTestUser, testPrisma } from '../helpers/testDb';
import { getAuthToken, authHeader } from '../helpers/authHelpers';

const app = createApp();

describe('User Routes — Integration', () => {
    let adminToken: string;
    let viewerToken: string;
    let testUserId: string;

    beforeAll(async () => {
        await cleanDatabase();

        const [admin, viewer] = await Promise.all([
            getAuthToken(app, Role.ADMIN),
            getAuthToken(app, Role.VIEWER),
        ]);

        adminToken = admin.token;
        viewerToken = viewer.token;
    });

    afterAll(async () => {
        await cleanDatabase();
        await testPrisma.$disconnect();
    });

    // ─── GET /api/v1/users ───────────────────────────────────────────────────────

    describe('GET /api/v1/users', () => {
        it('should list all users for ADMIN', async () => {
            const res = await request(app)
                .get('/api/v1/users')
                .set(authHeader(adminToken));

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
        });

        it('should return 403 for VIEWER', async () => {
            const res = await request(app)
                .get('/api/v1/users')
                .set(authHeader(viewerToken));

            expect(res.status).toBe(403);
        });
    });

    // ─── POST /api/v1/users ──────────────────────────────────────────────────────

    describe('POST /api/v1/users', () => {
        const newUserPayload = {
            email: 'admin-created@example.com',
            name: 'New User',
            password: 'Password123!',
            role: 'ANALYST'
        };

        it('should create a new user as ADMIN', async () => {
            const res = await request(app)
                .post('/api/v1/users')
                .set(authHeader(adminToken))
                .send(newUserPayload);

            expect(res.status).toBe(201);
            expect(res.body.data.email).toBe(newUserPayload.email);
            expect(res.body.data.role).toBe('ANALYST');
            testUserId = res.body.data.id;
        });

        it('should return 409 if user email exists', async () => {
            const res = await request(app)
                .post('/api/v1/users')
                .set(authHeader(adminToken))
                .send(newUserPayload);

            expect(res.status).toBe(409);
        });
    });

    // ─── PATCH /api/v1/users/:id/role ───────────────────────────────────────────

    describe('PATCH /api/v1/users/:id/role', () => {
        it('should update user role as ADMIN', async () => {
            const res = await request(app)
                .patch(`/api/v1/users/${testUserId}/role`)
                .set(authHeader(adminToken))
                .send({ role: 'ADMIN' });

            expect(res.status).toBe(200);
            expect(res.body.data.role).toBe('ADMIN');
        });
    });

    // ─── DELETE /api/v1/users/:id ───────────────────────────────────────────────

    describe('DELETE /api/v1/users/:id', () => {
        it('should delete a user as ADMIN', async () => {
            const res = await request(app)
                .delete(`/api/v1/users/${testUserId}`)
                .set(authHeader(adminToken));

            expect(res.status).toBe(200);

            // Verify not found in DB anymore (or soft-deleted if implemented)
            const dbUser = await testPrisma.user.findUnique({ where: { id: testUserId } });
            expect(dbUser).toBeNull();
        });
    });
});
