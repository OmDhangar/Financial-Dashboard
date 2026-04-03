// tests/unit/services/user.service.test.ts
import { UserService } from '../../src/modules/users/user.service';
import { NotFoundError, ConflictError, ForbiddenError } from '../../common/errors';
import { Role, UserStatus } from '@prisma/client';

jest.mock('../../src/modules/users/user.repository', () => ({
    userRepository: {
        findById: jest.fn(),
        findByEmail: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        softDelete: jest.fn(),
        existsByEmail: jest.fn(),
    },
}));

jest.mock('bcrypt', () => ({
    hash: jest.fn().mockResolvedValue('$2b$12$hashed'),
}));

import { userRepository } from '../../../src/modules/users/user.repository';
const mockRepo = userRepository as jest.Mocked<typeof userRepository>;

const mockUser = {
    id: 'user-uuid',
    email: 'user@example.com',
    name: 'Test User',
    role: Role.VIEWER,
    status: UserStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
};

describe('UserService', () => {
    let userService: UserService;

    beforeEach(() => {
        userService = new UserService();
        jest.clearAllMocks();
    });

    describe('getUserById', () => {
        it('should return a user when found', async () => {
            mockRepo.findById.mockResolvedValue(mockUser);
            const result = await userService.getUserById('user-uuid');
            expect(result).toEqual(mockUser);
        });

        it('should throw NotFoundError when user does not exist', async () => {
            mockRepo.findById.mockResolvedValue(null);
            await expect(userService.getUserById('bad-id')).rejects.toThrow(NotFoundError);
        });
    });

    describe('createUser', () => {
        it('should create a user when email is unique', async () => {
            mockRepo.existsByEmail.mockResolvedValue(false);
            mockRepo.create.mockResolvedValue(mockUser);

            const result = await userService.createUser({
                email: 'new@example.com',
                name: 'New User',
                password: 'Password123!',
                role: Role.VIEWER,
            });

            expect(result).toEqual(mockUser);
        });

        it('should throw ConflictError when email is taken', async () => {
            mockRepo.existsByEmail.mockResolvedValue(true);

            await expect(
                userService.createUser({
                    email: 'taken@example.com',
                    name: 'User',
                    password: 'Password123!',
                    role: Role.VIEWER,
                }),
            ).rejects.toThrow(ConflictError);

            expect(mockRepo.create).not.toHaveBeenCalled();
        });
    });

    describe('updateUserRole', () => {
        it('should throw ForbiddenError when user tries to change own role', async () => {
            mockRepo.findById.mockResolvedValue(mockUser);

            await expect(
                userService.updateUserRole('user-uuid', { role: Role.ANALYST }, 'user-uuid'),
            ).rejects.toThrow(ForbiddenError);
        });

        it('should allow an admin to change another user role', async () => {
            const targetUser = { ...mockUser, id: 'other-uuid' };
            const updatedUser = { ...targetUser, role: Role.ANALYST };
            mockRepo.findById.mockResolvedValue(targetUser);
            mockRepo.update.mockResolvedValue(updatedUser);

            const result = await userService.updateUserRole(
                'other-uuid',
                { role: Role.ANALYST },
                'admin-uuid',
            );

            expect(result.role).toBe(Role.ANALYST);
        });
    });

    describe('deleteUser', () => {
        it('should throw ForbiddenError when user tries to delete themselves', async () => {
            mockRepo.findById.mockResolvedValue(mockUser);

            await expect(userService.deleteUser('user-uuid', 'user-uuid')).rejects.toThrow(
                ForbiddenError,
            );
        });

        it('should soft-delete another user', async () => {
            const target = { ...mockUser, id: 'target-uuid' };
            mockRepo.findById.mockResolvedValue(target);
            mockRepo.softDelete.mockResolvedValue({ ...target, status: UserStatus.INACTIVE });

            await userService.deleteUser('target-uuid', 'admin-uuid');
            expect(mockRepo.softDelete).toHaveBeenCalledWith('target-uuid');
        });
    });
});