// src/modules/users/user.repository.ts
import { Prisma, Role, UserStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';

const publicUserSelect = {
    id: true,
    email: true,
    name: true,
    role: true,
    status: true,
    createdAt: true,
    updatedAt: true,
} as const;

export interface UserFilters {
    page: number;
    limit: number;
    role?: Role;
    status?: UserStatus;
    search?: string;
}

export class UserRepository {
    async findById(id: string) {
        return prisma.user.findFirst({
            where: { id, deletedAt: null },
            select: publicUserSelect,
        });
    }

    async findByEmail(email: string) {
        return prisma.user.findFirst({
            where: { email, deletedAt: null },
        });
    }

    async findMany(filters: UserFilters) {
        const where: Prisma.UserWhereInput = {
            deletedAt: null,
            ...(filters.role && { role: filters.role }),
            ...(filters.status && { status: filters.status }),
            ...(filters.search && {
                OR: [
                    { name: { contains: filters.search, mode: 'insensitive' } },
                    { email: { contains: filters.search, mode: 'insensitive' } },
                ],
            }),
        };

        const skip = (filters.page - 1) * filters.limit;

        const [users, total] = await Promise.all([
            prisma.user.findMany({ where, select: publicUserSelect, skip, take: filters.limit, orderBy: { createdAt: 'desc' } }),
            prisma.user.count({ where }),
        ]);

        return { users, total };
    }

    async create(data: Prisma.UserCreateInput) {
        return prisma.user.create({ data, select: publicUserSelect });
    }

    async update(id: string, data: Prisma.UserUpdateInput) {
        return prisma.user.update({ where: { id }, data, select: publicUserSelect });
    }

    async softDelete(id: string) {
        return prisma.user.update({
            where: { id },
            data: { deletedAt: new Date(), status: UserStatus.INACTIVE },
            select: publicUserSelect,
        });
    }

    async existsByEmail(email: string, excludeId?: string) {
        const user = await prisma.user.findFirst({
            where: { email, deletedAt: null, ...(excludeId && { id: { not: excludeId } }) },
            select: { id: true },
        });
        return !!user;
    }
}

export const userRepository = new UserRepository();