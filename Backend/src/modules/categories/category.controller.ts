// src/modules/categories/category.controller.ts
import { Request, Response, NextFunction } from 'express';
import { categoryService } from './category.service';
import { apiResponse } from '../../../common/response/ApiResponse';
import { CreateCategoryDto } from './category.schema';

export class CategoryController {
  async list(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await categoryService.listCategories();
      res.status(200).json(apiResponse.success(categories));
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await categoryService.createCategory(req.body as CreateCategoryDto);
      res.status(201).json(apiResponse.success(category));
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await categoryService.deleteCategory(req.params.id);
      res.status(200).json(apiResponse.success({ message: 'Category deleted successfully' }));
    } catch (error) {
      next(error);
    }
  }
}

export const categoryController = new CategoryController();
