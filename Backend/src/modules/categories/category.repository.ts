// src/modules/categories/category.repository.ts
import { prisma } from '../../lib/prisma';

export class CategoryRepository {
  async findAll() {
    return prisma.category.findMany({ orderBy: { name: 'asc' } });
  }

  async findById(id: string) {
    return prisma.category.findUnique({ where: { id } });
  }

  async findByName(name: string) {
    return prisma.category.findUnique({ where: { name } });
  }

  async create(name: string) {
    return prisma.category.create({ data: { name } });
  }

  async delete(id: string) {
    return prisma.category.delete({ where: { id } });
  }

  async hasRecords(id: string): Promise<boolean> {
    const count = await prisma.record.count({ where: { categoryId: id } });
    return count > 0;
  }
}

export const categoryRepository = new CategoryRepository();
