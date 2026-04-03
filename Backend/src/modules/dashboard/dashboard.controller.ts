// src/modules/dashboard/dashboard.controller.ts
import { Request, Response, NextFunction } from 'express';
import { dashboardService } from './dashboard.service';
import { apiResponse } from '../../../common/response/ApiResponse';
import {
    SummaryQuery,
    TrendsQuery,
    CategoryBreakdownQuery,
    RecentQuery,
} from './dashboard.schema';

export class DashboardController {
    /**
     * GET /api/v1/dashboard/summary
     * Total income, expenses, net balance, transaction count for a period.
     */
    async summary(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const query = req.query as unknown as SummaryQuery;
            const data = await dashboardService.getSummary(query);
            res.status(200).json(apiResponse.success(data));
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/dashboard/trends
     * Month-by-month income vs expense trend for a given year.
     */
    async trends(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const query = req.query as unknown as TrendsQuery;
            const data = await dashboardService.getMonthlyTrends(query);
            res.status(200).json(apiResponse.success(data));
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/dashboard/categories
     * Spending and income breakdown per category for a period.
     */
    async categories(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const query = req.query as unknown as CategoryBreakdownQuery;
            const data = await dashboardService.getCategoryBreakdown(query);
            res.status(200).json(apiResponse.success(data));
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/dashboard/recent
     * Latest N financial records with category and creator info.
     */
    async recent(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const query = req.query as unknown as RecentQuery;
            const data = await dashboardService.getRecentActivity(query);
            res.status(200).json(apiResponse.success(data));
        } catch (error) {
            next(error);
        }
    }
}

export const dashboardController = new DashboardController();