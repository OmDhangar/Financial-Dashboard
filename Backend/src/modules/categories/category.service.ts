// src/modules/categories/category.service.ts
import { categoryRepository } from './category.repository';
import { ConflictError, NotFoundError, BadRequestError } from '../../../common/errors';
import { CreateCategoryDto } from './category.schema';

export class CategoryService {
  async listCategories() {
    return categoryRepository.findAll();
  }

  async createCategory(dto: CreateCategoryDto) {
    const existing = await categoryRepository.findByName(dto.name);
    if (existing) throw new ConflictError(`Category "${dto.name}" already exists`);
    return categoryRepository.create(dto.name);
  }

  async deleteCategory(id: string) {
    const category = await categoryRepository.findById(id);
    if (!category) throw new NotFoundError('Category');

    const hasRecords = await categoryRepository.hasRecords(id);
    if (hasRecords) {
      throw new BadRequestError(
        'Cannot delete a category that has financial records. Reassign or delete the records first.',
      );
    }

    return categoryRepository.delete(id);
  }
}

export const categoryService = new CategoryService();
