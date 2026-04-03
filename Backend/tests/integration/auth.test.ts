// tests/integration/auth.test.ts
import request from 'supertest';
import { createApp } from '../../src/app';
import { cleanDatabase, createTestUser, testPrisma } from '../helpers/testDb';

const app = createApp();

describe('Auth Routes — Integration', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    afterAll(async () => {
        await cleanDatabase();
        await testPrisma.$disconnect();
    });

    // ─── POST /api/v1/auth/register ───────────────────────────────────────────────

    describe('POST /api/v1/auth/register', () => {
        const validPayload = {
            email: 'newuser@example.com',
            name: 'New User',
            password: 'Password123!',
        };

        it('should register a new user and return 201 with token', async () => {
            const res = await request(app).post('/api/v1/auth/register').send(validPayload);

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.token).toBeDefined();
            expect(res.body.data.user.email).toBe(validPayload.email);
            expect(res.body.data.user.role).toBe('VIEWER');
        });

        it('should return 409 when email is already registered', async () => {
            await request(app).post('/api/v1/auth/register').send(validPayload);
            const res = await request(app).post('/api/v1/auth/register').send(validPayload);

            expect(res.status).toBe(409);
            expect(res.body.success).toBe(false);
            expect(res.body.error.code).toBe('CONFLICT');
        });

        it('should return 400 for invalid email', async () => {
            const res = await request(app)
                .post('/api/v1/auth/register')
                .send({ ...validPayload, email: 'not-an-email' });

            expect(res.status).toBe(400);
            expect(res.body.error.code).toBe('VALIDATION_ERROR');
        });

        it('should return 400 for weak password', async () => {
            const res = await request(app)
                .post('/api/v1/auth/register')
                .send({ ...validPayload, password: 'weak' });

            expect(res.status).toBe(400);
            expect(res.body.error.code).toBe('VALIDATION_ERROR');
        });

        it('should not expose passwordHash in the response', async () => {
            const res = await request(app).post('/api/v1/auth/register').send(validPayload);

            expect(JSON.stringify(res.body)).not.toContain('passwordHash');
            expect(JSON.stringify(res.body)).not.toContain('password_hash');
        });
    });

    // ─── POST /api/v1/auth/login ──────────────────────────────────────────────────

    describe('POST /api/v1/auth/login', () => {
        beforeEach(async () => {
            await createTestUser({ email: 'login@example.com', password: 'Password123!' });
        });

        it('should login with valid credentials and return token', async () => {
            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({ email: 'login@example.com', password: 'Password123!' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.token).toBeDefined();
            expect(typeof res.body.data.token).toBe('string');
        });

        it('should return 401 for wrong password', async () => {
            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({ email: 'login@example.com', password: 'WrongPassword!' });

            expect(res.status).toBe(401);
            expect(res.body.error.code).toBe('UNAUTHORIZED');
        });

        it('should return 401 for non-existent email', async () => {
            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({ email: 'ghost@example.com', password: 'Password123!' });

            expect(res.status).toBe(401);
        });

        it('should return 400 for missing fields', async () => {
            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({ email: 'login@example.com' }); // missing password

            expect(res.status).toBe(400);
        });
    });

    // ─── GET /api/v1/auth/me ──────────────────────────────────────────────────────

    describe('GET /api/v1/auth/me', () => {
        it('should return the authenticated user profile', async () => {
            const { body: loginBody } = await request(app)
                .post('/api/v1/auth/register')
                .send({ email: 'me@example.com', name: 'Me User', password: 'Password123!' });

            const token = loginBody.data.token as string;

            const res = await request(app)
                .get('/api/v1/auth/me')
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.data.email).toBe('me@example.com');
        });

        it('should return 401 without a token', async () => {
            const res = await request(app).get('/api/v1/auth/me');
            expect(res.status).toBe(401);
        });

        it('should return 401 with a malformed token', async () => {
            const res = await request(app)
                .get('/api/v1/auth/me')
                .set('Authorization', 'Bearer invalid.jwt.token');
            expect(res.status).toBe(401);
        });
    });
});