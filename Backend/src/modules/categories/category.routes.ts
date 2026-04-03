// src/modules/categories/category.routes.ts
import { Router } from 'express';
import { categoryController } from './category.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorization';
import { validate } from '../../middleware/validate';
import { createCategorySchema, categoryIdParamSchema } from './category.schema';

const router = Router();

router.use(authenticate);

router.get('/', (req, res, next) => categoryController.list(req, res, next));

router.post('/', authorize('ADMIN'), validate(createCategorySchema), (req, res, next) =>
  categoryController.create(req, res, next),
);

router.delete(
  '/:id',
  authorize('ADMIN'),
  validate(categoryIdParamSchema),
  (req, res, next) => categoryController.delete(req, res, next),
);

export default router;
