// src/modules/records/record.routes.ts
import { Router } from 'express';
import { recordController } from './record.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorization';
import { validate } from '../../middleware/validate';
import {
    createRecordSchema,
    updateRecordSchema,
    recordIdParamSchema,
    listRecordsSchema,
} from './record.schema';

const router = Router();

router.use(authenticate);

/**
 * @route   GET /api/v1/records
 * @access  VIEWER | ANALYST | ADMIN
 */
router.get('/', validate(listRecordsSchema), (req, res, next) =>
    recordController.list(req, res, next),
);

/**
 * @route   GET /api/v1/records/:id
 * @access  VIEWER | ANALYST | ADMIN
 */
router.get('/:id', validate(recordIdParamSchema), (req, res, next) =>
    recordController.getById(req, res, next),
);

/**
 * @route   POST /api/v1/records
 * @access  ADMIN
 */
router.post('/', authorize('ADMIN'), validate(createRecordSchema), (req, res, next) =>
    recordController.create(req, res, next),
);

/**
 * @route   PATCH /api/v1/records/:id
 * @access  ADMIN
 */
router.patch('/:id', authorize('ADMIN'), validate(updateRecordSchema), (req, res, next) =>
    recordController.update(req, res, next),
);

/**
 * @route   DELETE /api/v1/records/:id
 * @access  ADMIN
 */
router.delete('/:id', authorize('ADMIN'), validate(recordIdParamSchema), (req, res, next) =>
    recordController.delete(req, res, next),
);

export default router;