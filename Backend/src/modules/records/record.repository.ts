// src/modules/records/record.repository.ts
import { Prisma, RecordType } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { ListRecordsQuery } from './record.schema';

const recordWithRelations = {
    id: true,
    amount: true,
    type: true,
    date: true,
    notes: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
    category: { select: { id: true, name: true } },
    createdBy: { select: { id: true, name: true } },
} as const;

export interface CreateRecordData {
    amount: number;
    type: RecordType;
    categoryId: string;
    date: Date;
    notes?: string;
    createdById: string;
}

export interface UpdateRecordData {
    amount?: number;
    type?: RecordType;
    categoryId?: string;
    date?: Date;
    notes?: string | null;
}

export class RecordRepository {
    async findById(id: string) {
        return prisma.record.findFirst({
            where: { id, deletedAt: null },
            select: recordWithRelations,
        });
    }

    async findMany(query: ListRecordsQuery, userIdScope?: string, isAdmin?: boolean) {
        let deletedAtFilter: Prisma.DateTimeNullableFilter | null = null;
        
        if (isAdmin && query.includeDeleted) {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            deletedAtFilter = { gte: thirtyDaysAgo };
        }

        const where: Prisma.RecordWhereInput = {
            deletedAt: deletedAtFilter,
            ...(userIdScope ? { createdById: userIdScope } : {}),
            ...(query.type ? { type: query.type } : {}),
            ...(query.categoryId ? { categoryId: query.categoryId } : {}),
            ...(query.startDate || query.endDate
                ? {
                    date: {
                        ...(query.startDate ? { gte: query.startDate } : {}),
                        ...(query.endDate ? { lte: query.endDate } : {}),
                    },
                }
                : {}),
            ...(query.search ? {
                notes: { contains: query.search, mode: 'insensitive' },
            } : {}),
        };

        const skip = (Number(query.page) - 1) * Number(query.limit);
        const orderBy: Prisma.RecordOrderByWithRelationInput = {
            [query.sortBy]: query.sortOrder,
        };

        const [records, total] = await Promise.all([
            prisma.record.findMany({
                where,
                select: recordWithRelations,
                skip,
                take: query.limit,
                orderBy,
            }),
            prisma.record.count({ where }),
        ]);

        return { records, total };
    }

    async create(data: CreateRecordData) {
        return prisma.record.create({
            data: {
                amount: data.amount,
                type: data.type,
                categoryId: data.categoryId,
                date: data.date,
                notes: data.notes,
                createdById: data.createdById,
            },
            select: recordWithRelations,
        });
    }

    async update(id: string, data: UpdateRecordData) {
        return prisma.record.update({
            where: { id },
            data,
            select: recordWithRelations,
        });
    }

    async softDelete(id: string) {
        return prisma.record.update({
            where: { id },
            data: { deletedAt: new Date() },
            select: { id: true },
        });
    }

    async restore(id: string) {
        return prisma.record.update({
            where: { id },
            data: { deletedAt: null },
            select: recordWithRelations,
        });
    }
}

export const recordRepository = new RecordRepository();