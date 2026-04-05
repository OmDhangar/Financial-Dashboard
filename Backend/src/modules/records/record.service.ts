import { recordRepository } from './record.repository';
import { categoryRepository } from '../categories/category.repository';
import { NotFoundError, ForbiddenError } from '../../../common/errors';
import { CreateRecordDto, UpdateRecordDto, ListRecordsQuery } from './record.schema';

export class RecordService {
    async listRecords(query: ListRecordsQuery, userId: string, role: string) {
        return recordRepository.findMany(query, role === 'VIEWER' ? userId : undefined);
    }

    async getRecordById(id: string) {
        const record = await recordRepository.findById(id);
        if (!record) throw new NotFoundError('Record');
        return record;
    }

    async createRecord(userId: string, dto: CreateRecordDto) {
        // Validate category exists before inserting
        const category = await categoryRepository.findById(dto.categoryId);
        if (!category) throw new NotFoundError('Category');

        return recordRepository.create({
            amount: dto.amount,
            type: dto.type,
            categoryId: dto.categoryId,
            date: dto.date,
            notes: dto.notes,
            createdById: userId,
        });
    }

    async updateRecord(id: string, dto: UpdateRecordDto, userId: string, role: string) {
        const record = await recordRepository.findById(id);
        if (!record) throw new NotFoundError('Record');

        if (role !== 'ADMIN' && record.createdBy.id !== userId) {
            throw new ForbiddenError('You can only update your own records');
        }

        // If category is being changed, validate it exists
        if (dto.categoryId) {
            const category = await categoryRepository.findById(dto.categoryId);
            if (!category) throw new NotFoundError('Category');
        }

        return recordRepository.update(id, {
            ...(dto.amount !== undefined && { amount: dto.amount }),
            ...(dto.type !== undefined && { type: dto.type }),
            ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
            ...(dto.date !== undefined && { date: dto.date }),
            ...(dto.notes !== undefined && { notes: dto.notes }),
        });
    }

    async deleteRecord(id: string, userId: string, role: string) {
        const record = await recordRepository.findById(id);
        if (!record) throw new NotFoundError('Record');

        if (role !== 'ADMIN' && record.createdBy.id !== userId) {
            throw new ForbiddenError('You can only delete your own records');
        }

        return recordRepository.softDelete(id);
    }

    async restoreRecord(id: string) {
        return recordRepository.restore(id);
    }
}

export const recordService = new RecordService();