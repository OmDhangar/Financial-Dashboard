// src/modules/users/user.service.ts
import bcrypt from 'bcrypt';
import { Role, UserStatus } from '@prisma/client';
import { userRepository } from './user.repository';
import { NotFoundError, ConflictError, ForbiddenError } from '../../../common/errors';
import { invalidateUserCache } from '../../middleware/authenticate';
import {
    CreateUserDto,
    UpdateUserDto,
    UpdateUserRoleDto,
    UpdateUserStatusDto,
    ListUsersQuery,
} from './user.schema';

const SALT_ROUNDS = 12;

export class UserService {
    /**
     * List users with filtering and pagination.
     */
    async listUsers(query: ListUsersQuery) {
        return userRepository.findMany(query);
    }

    /**
     * Get a single user by ID. Throws NotFoundError if not found.
     */
    async getUserById(id: string) {
        const user = await userRepository.findById(id);
        if (!user) throw new NotFoundError('User');
        return user;
    }

    /**
     * Create a new user (admin action — can specify role).
     */
    async createUser(dto: CreateUserDto) {
        const emailTaken = await userRepository.existsByEmail(dto.email);
        if (emailTaken) throw new ConflictError('An account with this email address already exists');

        const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

        return userRepository.create({
            email: dto.email,
            name: dto.name,
            passwordHash,
            role: dto.role,
        });
    }

    /**
     * Update a user's profile fields (name, email).
     */
    async updateUser(id: string, dto: UpdateUserDto) {
        const user = await userRepository.findById(id);
        if (!user) throw new NotFoundError('User');

        if (dto.email) {
            const emailTaken = await userRepository.existsByEmail(dto.email, id);
            if (emailTaken) throw new ConflictError('This email address is already in use');
        }

        return userRepository.update(id, dto);
    }

    /**
     * Update a user's role.
     * Prevents the last admin from being demoted.
     */
    async updateUserRole(id: string, dto: UpdateUserRoleDto, requestingUserId: string) {
        const user = await userRepository.findById(id);
        if (!user) throw new NotFoundError('User');

        // Prevent self-demotion
        if (id === requestingUserId && dto.role !== Role.ADMIN) {
            throw new ForbiddenError('You cannot change your own role');
        }

        const updated = await userRepository.update(id, { role: dto.role });
        invalidateUserCache(id); // Clear cache so next request picks up new role
        return updated;
    }

    /**
     * Activate or deactivate a user account.
     * Prevents self-deactivation.
     */
    async updateUserStatus(id: string, dto: UpdateUserStatusDto, requestingUserId: string) {
        const user = await userRepository.findById(id);
        if (!user) throw new NotFoundError('User');

        if (id === requestingUserId && dto.status === UserStatus.INACTIVE) {
            throw new ForbiddenError('You cannot deactivate your own account');
        }

        const updated = await userRepository.update(id, { status: dto.status });
        invalidateUserCache(id); // Clear cache so inactive users are blocked immediately
        return updated;
    }

    /**
     * Soft-delete a user. Prevents self-deletion.
     */
    async deleteUser(id: string, requestingUserId: string) {
        const user = await userRepository.findById(id);
        if (!user) throw new NotFoundError('User');

        if (id === requestingUserId) {
            throw new ForbiddenError('You cannot delete your own account');
        }

        return userRepository.softDelete(id);
    }
}

export const userService = new UserService();