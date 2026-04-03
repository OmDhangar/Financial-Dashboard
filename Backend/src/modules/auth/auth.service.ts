// src/modules/auth/auth.service.ts
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { config } from '../../config/env';
import { ConflictError, UnauthorizedError, NotFoundError } from '../../../common/errors';
import { RegisterDto, LoginDto } from './auth.schema';
import { AuthenticatedUser } from '../../../common/types/express';

const SALT_ROUNDS = 12;

export interface AuthTokenPayload {
    token: string;
    user: Omit<AuthenticatedUser, 'status'>;
}

const selectPublicFields = {
    id: true,
    email: true,
    name: true,
    role: true,
    status: true,
    createdAt: true,
} as const;

export class AuthService {
    /**
     * Register a new user. Defaults to VIEWER role.
     * Throws ConflictError if email is already taken.
     */
    async register(dto: RegisterDto): Promise<AuthTokenPayload> {
        const existing = await prisma.user.findUnique({ where: { email: dto.email } });
        if (existing) {
            throw new ConflictError('An account with this email address already exists');
        }

        const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

        const user = await prisma.user.create({
            data: {
                email: dto.email,
                name: dto.name,
                passwordHash,
            },
            select: selectPublicFields,
        });

        const token = this.signToken(user);
        return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
    }

    /**
     * Authenticate a user with email + password.
     * Uses constant-time comparison to prevent timing attacks.
     */
    async login(dto: LoginDto): Promise<AuthTokenPayload> {
        const user = await prisma.user.findFirst({
            where: { email: dto.email, deletedAt: null },
        });

        // Always run bcrypt compare — prevents timing-based email enumeration
        const passwordMatch = user
            ? await bcrypt.compare(dto.password, user.passwordHash)
            : await bcrypt.compare(dto.password, '$2b$12$invalidhashfortimingnormalization');

        if (!user || !passwordMatch) {
            throw new UnauthorizedError('Invalid email or password');
        }

        if (user.status === 'INACTIVE') {
            throw new UnauthorizedError('Your account has been deactivated. Please contact an administrator.');
        }

        const token = this.signToken(user);
        return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
    }

    /**
     * Return the authenticated user's public profile.
     */
    async getProfile(userId: string): Promise<Omit<User, 'passwordHash'>> {
        const user = await prisma.user.findFirst({
            where: { id: userId, deletedAt: null },
            select: { ...selectPublicFields, updatedAt: true, deletedAt: false },
        });

        if (!user) {
            throw new NotFoundError('User');
        }

        return user as unknown as Omit<User, 'passwordHash'>;
    }

    private signToken(user: Pick<User, 'id' | 'email' | 'role'>): string {
        return jwt.sign(
            { sub: user.id, email: user.email, role: user.role },
            config.jwt.secret,
            { expiresIn: config.jwt.expiresIn } as jwt.SignOptions,
        );
    }
}

export const authService = new AuthService();