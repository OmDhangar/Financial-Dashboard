// tests/unit/services/record.service.test.ts
import { RecordService } from '../../../src/modules/records/record.service';
import { NotFoundError } from '../../../src/common/errors';

// Mock repositories
jest.mock('../../../src/modules/records/record.repository', () => ({
    recordRepository: {
        findById: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        softDelete: jest.fn(),
    },
}));

jest.mock('../../../src/modules/categories/category.repository', () => ({
    categoryRepository: {
        findById: jest.fn(),
    },
}));

import { recordRepository } from '../../../src/modules/records/record.repository';
import { categoryRepository } from '../../../src/modules/categories/category.repository';

const mockRecordRepo = recordRepository as jest.Mocked<typeof recordRepository>;
const mockCategoryRepo = categoryRepository as jest.Mocked<typeof categoryRepository>;

const mockCategory = { id: 'cat-uuid', name: 'Salary', createdAt: new Date() };

const mockRecord = {
    id: 'rec-uuid',
    amount: '5000.00' as unknown as import('@prisma/client').Prisma.Decimal,
    type: 'INCOME' as const,
    date: new Date(),
    notes: 'Test record',
    createdAt: new Date(),
    updatedAt: new Date(),
    category: { id: 'cat-uuid', name: 'Salary' },
    createdBy: { id: 'user-uuid', name: 'Admin' },
};

describe('RecordService', () => {
    let recordService: RecordService;

    beforeEach(() => {
        recordService = new RecordService();
        jest.clearAllMocks();
    });

    // ─── getRecordById ────────────────────────────────────────────────────────────

    describe('getRecordById', () => {
        it('should return a record when it exists', async () => {
            mockRecordRepo.findById.mockResolvedValue(mockRecord);

            const result = await recordService.getRecordById('rec-uuid');

            expect(result).toEqual(mockRecord);
            expect(mockRecordRepo.findById).toHaveBeenCalledWith('rec-uuid');
        });

        it('should throw NotFoundError when record does not exist', async () => {
            mockRecordRepo.findById.mockResolvedValue(null);

            await expect(recordService.getRecordById('non-existent')).rejects.toThrow(NotFoundError);
        });
    });

    // ─── createRecord ─────────────────────────────────────────────────────────────

    describe('createRecord', () => {
        it('should create a record when category exists', async () => {
            mockCategoryRepo.findById.mockResolvedValue(mockCategory);
            mockRecordRepo.create.mockResolvedValue(mockRecord);

            const result = await recordService.createRecord('user-uuid', {
                amount: 5000,
                type: 'INCOME',
                categoryId: 'cat-uuid',
                date: new Date(),
            });

            expect(result).toEqual(mockRecord);
            expect(mockCategoryRepo.findById).toHaveBeenCalledWith('cat-uuid');
            expect(mockRecordRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({ createdById: 'user-uuid', categoryId: 'cat-uuid' }),
            );
        });

        it('should throw NotFoundError when category does not exist', async () => {
            mockCategoryRepo.findById.mockResolvedValue(null);

            await expect(
                recordService.createRecord('user-uuid', {
                    amount: 5000,
                    type: 'INCOME',
                    categoryId: 'non-existent-cat',
                    date: new Date(),
                }),
            ).rejects.toThrow(NotFoundError);

            expect(mockRecordRepo.create).not.toHaveBeenCalled();
        });
    });

    // ─── updateRecord ─────────────────────────────────────────────────────────────

    describe('updateRecord', () => {
        it('should update an existing record', async () => {
            const updatedRecord = { ...mockRecord, notes: 'Updated notes' };
            mockRecordRepo.findById.mockResolvedValue(mockRecord);
            mockRecordRepo.update.mockResolvedValue(updatedRecord);

            const result = await recordService.updateRecord('rec-uuid', { notes: 'Updated notes' });

            expect(result.notes).toBe('Updated notes');
        });

        it('should throw NotFoundError when record does not exist', async () => {
            mockRecordRepo.findById.mockResolvedValue(null);

            await expect(
                recordService.updateRecord('non-existent', { notes: 'x' }),
            ).rejects.toThrow(NotFoundError);
        });

        it('should validate new categoryId if provided', async () => {
            mockRecordRepo.findById.mockResolvedValue(mockRecord);
            mockCategoryRepo.findById.mockResolvedValue(null);

            await expect(
                recordService.updateRecord('rec-uuid', { categoryId: 'invalid-cat' }),
            ).rejects.toThrow(NotFoundError);
        });
    });

    // ─── deleteRecord ─────────────────────────────────────────────────────────────

    describe('deleteRecord', () => {
        it('should soft-delete an existing record', async () => {
            mockRecordRepo.findById.mockResolvedValue(mockRecord);
            mockRecordRepo.softDelete.mockResolvedValue({ id: 'rec-uuid' });

            await recordService.deleteRecord('rec-uuid');

            expect(mockRecordRepo.softDelete).toHaveBeenCalledWith('rec-uuid');
        });

        it('should throw NotFoundError when record does not exist', async () => {
            mockRecordRepo.findById.mockResolvedValue(null);

            await expect(recordService.deleteRecord('non-existent')).rejects.toThrow(NotFoundError);
            expect(mockRecordRepo.softDelete).not.toHaveBeenCalled();
        });
    });
});