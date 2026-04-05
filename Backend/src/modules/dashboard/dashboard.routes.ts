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
    expensesByUserQuerySchema,
} from './dashboard.schema';

const router = Router();

router.use(authenticate, dashboardLimiter);

/**
 * @route   GET /api/v1/dashboard/summary
 * @access  VIEWER | ANALYST | ADMIN
 * VIEWER sees only their own data (scoped in service layer)
 */
router.get(
    '/summary',
    authorize('VIEWER', 'ANALYST', 'ADMIN'),
    validate(summaryQuerySchema),
    (req, res, next) => dashboardController.summary(req, res, next),
);

/**
 * @route   GET /api/v1/dashboard/trends
 * @access  VIEWER | ANALYST | ADMIN
 */
router.get(
    '/trends',
    authorize('VIEWER', 'ANALYST', 'ADMIN'),
    validate(trendsQuerySchema),
    (req, res, next) => dashboardController.trends(req, res, next),
);

/**
 * @route   GET /api/v1/dashboard/categories
 * @access  VIEWER | ANALYST | ADMIN
 * VIEWER: own data only. ANALYST/ADMIN: can pass ?userId= to scope to a specific user.
 */
router.get(
    '/categories',
    authorize('VIEWER', 'ANALYST', 'ADMIN'),
    validate(categoryBreakdownQuerySchema),
    (req, res, next) => dashboardController.categories(req, res, next),
);

/**
 * @route   GET /api/v1/dashboard/recent
 * @access  VIEWER | ANALYST | ADMIN
 */
router.get(
    '/recent',
    authorize('VIEWER', 'ANALYST', 'ADMIN'),
    validate(recentQuerySchema),
    (req, res, next) => dashboardController.recent(req, res, next),
);

/**
 * @route   GET /api/v1/dashboard/by-user
 * @access  ANALYST | ADMIN
 * Returns aggregated income/expense/balance per user.
 */
router.get(
    '/by-user',
    authorize('ANALYST', 'ADMIN'),
    validate(expensesByUserQuerySchema),
    (req, res, next) => dashboardController.expensesByUser(req, res, next),
);

export default router;