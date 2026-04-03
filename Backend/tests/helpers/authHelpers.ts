// tests/helpers/authHelper.ts
import request from 'supertest';
import { Application } from 'express';
import { Role } from '@prisma/client';
import { createTestUser } from './testDb';

export const getAuthToken = async (
    app: Application,
    role: Role = Role.VIEWER,
): Promise<{ token: string; userId: string }> => {
    const email = `${role.toLowerCase()}-${Date.now()}@test.com`;
    const password = 'Password123!';

    await createTestUser({ email, role, password });

    const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email, password });

    if (res.status !== 200) {
        throw new Error(`Failed to get auth token for role ${role}: ${JSON.stringify(res.body)}`);
    }

    return {
        token: res.body.data.token as string,
        userId: res.body.data.user.id as string,
    };
};

export const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });