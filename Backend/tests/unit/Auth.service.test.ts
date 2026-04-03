// tests/unit/services/auth.service.test.ts
import { AuthService } from '../../src/modules/auth/auth.service';
import { ConflictError, UnauthorizedError } from '../../common/errors';
import { prisma } from '../../src/lib/prisma';

// Mock prisma and bcrypt at module level
jest.mock('../../src/lib/prisma', () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
        },
    },
}));

jest.mock('bcrypt', () => ({
    hash: jest.fn().mockResolvedValue('$2b$12$hashedpassword'),
    compare: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
    sign: jest.fn().mockReturnValue('mock.jwt.token'),
    verify: jest.fn(),
}));

const bcrypt = jest.requireMock('bcrypt') as {
    hash: jest.Mock;
    compare: jest.Mock;
};

const mockPrismaUser = prisma.user as jest.Mocked<typeof prisma.user>;

const mockUser = {
    id: 'user-uuid-123',
    email: 'test@example.com',
    name: 'Test User',
    passwordHash: '$2b$12$hashedpassword',
    role: 'VIEWER' as const,
    status: 'ACTIVE' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
};

describe('AuthService', () => {
    let authService: AuthService;

    beforeEach(() => {
        authService = new AuthService();
        jest.clearAllMocks();
    });

    // ─── register ────────────────────────────────────────────────────────────────

    describe('register', () => {
        it('should register a new user and return token', async () => {
            mockPrismaUser.findUnique.mockResolvedValue(null);
            mockPrismaUser.create.mockResolvedValue(mockUser);

            const result = await authService.register({
                email: 'test@example.com',
                name: 'Test User',
                password: 'Password123!',
            });

            expect(result.token).toBe('mock.jwt.token');
            expect(result.user.email).toBe('test@example.com');
            expect(mockPrismaUser.findUnique).toHaveBeenCalledWith({
                where: { email: 'test@example.com' },
            });
        });

        it('should throw ConflictError if email already exists', async () => {
            mockPrismaUser.findUnique.mockResolvedValue(mockUser);

            await expect(
                authService.register({
                    email: 'test@example.com',
                    name: 'Test User',
                    password: 'Password123!',
                }),
            ).rejects.toThrow(ConflictError);
        });

        it('should hash the password before storing', async () => {
            mockPrismaUser.findUnique.mockResolvedValue(null);
            mockPrismaUser.create.mockResolvedValue(mockUser);

            await authService.register({
                email: 'new@example.com',
                name: 'New User',
                password: 'Password123!',
            });

            expect(bcrypt.hash).toHaveBeenCalledWith('Password123!', 12);
        });
    });

    // ─── login ───────────────────────────────────────────────────────────────────

    describe('login', () => {
        it('should return token on valid credentials', async () => {
            mockPrismaUser.findFirst.mockResolvedValue(mockUser);
            bcrypt.compare.mockResolvedValue(true as never);

            const result = await authService.login({
                email: 'test@example.com',
                password: 'Password123!',
            });

            expect(result.token).toBe('mock.jwt.token');
            expect(result.user.email).toBe('test@example.com');
        });

        it('should throw UnauthorizedError for wrong password', async () => {
            mockPrismaUser.findFirst.mockResolvedValue(mockUser);
            bcrypt.compare.mockResolvedValue(false as never);

            await expect(
                authService.login({ email: 'test@example.com', password: 'WrongPassword!' }),
            ).rejects.toThrow(UnauthorizedError);
        });

        it('should throw UnauthorizedError for non-existent email', async () => {
            mockPrismaUser.findFirst.mockResolvedValue(null);
            bcrypt.compare.mockResolvedValue(false as never);

            await expect(
                authService.login({ email: 'ghost@example.com', password: 'Password123!' }),
            ).rejects.toThrow(UnauthorizedError);
        });

        it('should throw UnauthorizedError for inactive user', async () => {
            mockPrismaUser.findFirst.mockResolvedValue({ ...mockUser, status: 'INACTIVE' });
            bcrypt.compare.mockResolvedValue(true as never);

            await expect(
                authService.login({ email: 'test@example.com', password: 'Password123!' }),
            ).rejects.toThrow(UnauthorizedError);
        });
    });
});