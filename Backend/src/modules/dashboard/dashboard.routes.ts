// src/modules/dashboard/dashboard.routes.ts
import { Router } from 'express';
import { dashboardController } from './dashboard.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorization';
import { validate } from '../../middleware/validate';
import { dashboardLimiter } from '../../middleware/rateLimiter';
import {
    summaryQuerySchema,
    trendsQuerySchema,
    categoryBreakdownQuerySchema,
    recentQuerySchema,
} from './dashboard.schema';

const router = Router();

router.use(authenticate, dashboardLimiter);

/**
 * @route   GET /api/v1/dashboard/summary
 * @access  ANALYST | ADMIN
 */
router.get(
    '/summary',
    authorize('ANALYST', 'ADMIN'),
    validate(summaryQuerySchema),
    (req, res, next) => dashboardController.summary(req, res, next),
);

/**
 * @route   GET /api/v1/dashboard/trends
 * @access  ANALYST | ADMIN
 */
router.get(
    '/trends',
    authorize('ANALYST', 'ADMIN'),
    validate(trendsQuerySchema),
    (req, res, next) => dashboardController.trends(req, res, next),
);

/**
 * @route   GET /api/v1/dashboard/categories
 * @access  ANALYST | ADMIN
 */
router.get(
    '/categories',
    authorize('ANALYST', 'ADMIN'),
    validate(categoryBreakdownQuerySchema),
    (req, res, next) => dashboardController.categories(req, res, next),
);

/**
 * @route   GET /api/v1/dashboard/recent
 * @access  VIEWER | ANALYST | ADMIN
 */
router.get(
    '/recent',
    validate(recentQuerySchema),
    (req, res, next) => dashboardController.recent(req, res, next),
);

export default router;