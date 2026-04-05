// src/modules/dashboard/dashboard.controller.ts
import { Request, Response, NextFunction } from 'express';
import { dashboardService } from './dashboard.service';
import { apiResponse } from '../../../common/response/ApiResponse';
import {
    SummaryQuery,
    TrendsQuery,
    CategoryBreakdownQuery,
    RecentQuery,
    ExpensesByUserQuery,
} from './dashboard.schema';

export class DashboardController {
    /**
     * GET /api/v1/dashboard/summary
     * Total income, expenses, net balance, transaction count for a period.
     * VIEWER: scoped to own records.
     */
    async summary(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const query = req.query as unknown as SummaryQuery;
            const data = await dashboardService.getSummary(query, req.user!.id, req.user!.role);
            res.status(200).json(apiResponse.success(data));
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/dashboard/trends
     * Month-by-month income vs expense trend for a given year.
     * VIEWER: scoped to own records.
     */
    async trends(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const query = req.query as unknown as TrendsQuery;
            const data = await dashboardService.getMonthlyTrends(query, req.user!.id, req.user!.role);
            res.status(200).json(apiResponse.success(data));
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/dashboard/categories
     * Spending and income breakdown per category for a period.
     * VIEWER: scoped to own records. ANALYST/ADMIN: can pass ?userId= to filter.
     */
    async categories(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const query = req.query as unknown as CategoryBreakdownQuery;
            const data = await dashboardService.getCategoryBreakdown(query, req.user!.id, req.user!.role);
            res.status(200).json(apiResponse.success(data));
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/dashboard/recent
     * Latest N financial records with category and creator info.
     * VIEWER: scoped to own records.
     */
    async recent(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const query = req.query as unknown as RecentQuery;
            const data = await dashboardService.getRecentActivity(query, req.user!.id, req.user!.role);
            res.status(200).json(apiResponse.success(data));
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/dashboard/by-user
     * Expenses grouped by user — for ANALYST and ADMIN only.
     */
    async expensesByUser(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const query = req.query as unknown as ExpensesByUserQuery;
            const data = await dashboardService.getExpensesByUser(query);
            res.status(200).json(apiResponse.success(data));
        } catch (error) {
            next(error);
        }
    }
}

export const dashboardController = new DashboardController();