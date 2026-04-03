// src/modules/dashboard/dashboard.service.ts
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { SummaryQuery, TrendsQuery, CategoryBreakdownQuery, RecentQuery } from './dashboard.schema';

interface DateRange {
    gte: Date;
    lte: Date;
}

interface TrendRow {
    month: Date;
    type: string;
    total: Decimal;
    count: bigint;
}

interface CategoryBreakdownRow {
    categoryId: string;
    categoryName: string;
    type: string;
    total: Decimal;
    count: bigint;
}

export class DashboardService {
    /**
     * Resolve a period query into a concrete date range [gte, lte].
     */
    private resolveDateRange(query: SummaryQuery | CategoryBreakdownQuery): DateRange {
        if ('startDate' in query && query.startDate && 'endDate' in query && query.endDate) {
            return { gte: query.startDate, lte: query.endDate };
        }

        const now = new Date();
        const year = query.year ?? now.getFullYear();
        const month = query.month ?? now.getMonth() + 1; // 1-indexed

        switch (query.period) {
            case 'weekly': {
                const day = now.getDay(); // 0 = Sunday
                const monday = new Date(now);
                monday.setDate(now.getDate() - ((day + 6) % 7));
                monday.setHours(0, 0, 0, 0);
                const sunday = new Date(monday);
                sunday.setDate(monday.getDate() + 6);
                sunday.setHours(23, 59, 59, 999);
                return { gte: monday, lte: sunday };
            }
            case 'yearly': {
                return {
                    gte: new Date(year, 0, 1, 0, 0, 0, 0),
                    lte: new Date(year, 11, 31, 23, 59, 59, 999),
                };
            }
            case 'monthly':
            default: {
                const daysInMonth = new Date(year, month, 0).getDate();
                return {
                    gte: new Date(year, month - 1, 1, 0, 0, 0, 0),
                    lte: new Date(year, month - 1, daysInMonth, 23, 59, 59, 999),
                };
            }
        }
    }

    /**
     * Summary: total income, total expenses, net balance, transaction count.
     */
    async getSummary(query: SummaryQuery) {
        const dateRange = this.resolveDateRange(query);

        const baseWhere = { deletedAt: null, date: dateRange };

        const [incomeResult, expenseResult] = await Promise.all([
            prisma.record.aggregate({
                where: { ...baseWhere, type: 'INCOME' },
                _sum: { amount: true },
                _count: { _all: true },
            }),
            prisma.record.aggregate({
                where: { ...baseWhere, type: 'EXPENSE' },
                _sum: { amount: true },
                _count: { _all: true },
            }),
        ]);

        const totalIncome = incomeResult._sum.amount ?? new Decimal(0);
        const totalExpense = expenseResult._sum.amount ?? new Decimal(0);
        const netBalance = new Decimal(totalIncome).minus(totalExpense);

        return {
            totalIncome: totalIncome.toString(),
            totalExpense: totalExpense.toString(),
            netBalance: netBalance.toString(),
            transactionCount: incomeResult._count._all + expenseResult._count._all,
            period: { from: dateRange.gte, to: dateRange.lte },
        };
    }

    /**
     * Monthly trends for a given year — income vs expense per month.
     * Uses raw SQL for DATE_TRUNC which is more expressive than Prisma groupBy for time-series.
     */
    async getMonthlyTrends(query: TrendsQuery) {
        const rows = await prisma.$queryRaw<TrendRow[]>`
      SELECT
        DATE_TRUNC('month', date)   AS month,
        type::text                  AS type,
        SUM(amount)                 AS total,
        COUNT(*)                    AS count
      FROM records
      WHERE
        EXTRACT(YEAR FROM date) = ${query.year}
        AND deleted_at IS NULL
      GROUP BY month, type
      ORDER BY month ASC
    `;

        // Normalize BigInt and Decimal to plain JS values
        return rows.map((row: any) => ({
            month: row.month,
            type: row.type,
            total: row.total.toString(),
            count: Number(row.count),
        }));
    }

    /**
     * Category breakdown — sum and count per category per type, for a given period.
     */
    async getCategoryBreakdown(query: CategoryBreakdownQuery) {
        const dateRange = this.resolveDateRange(query);

        const rows = await prisma.$queryRaw<CategoryBreakdownRow[]>`
      SELECT
        r.category_id               AS "categoryId",
        c.name                      AS "categoryName",
        r.type::text                AS type,
        SUM(r.amount)               AS total,
        COUNT(*)                    AS count
      FROM records r
      JOIN categories c ON c.id = r.category_id
      WHERE
        r.deleted_at IS NULL
        AND r.date >= ${dateRange.gte}
        AND r.date <= ${dateRange.lte}
      GROUP BY r.category_id, c.name, r.type
      ORDER BY total DESC
    `;

        return rows.map((row: any) => ({
            categoryId: row.categoryId,
            categoryName: row.categoryName,
            type: row.type,
            total: row.total.toString(),
            count: Number(row.count),
        }));
    }

    /**
     * Recent transactions — latest N records with category and creator info.
     */
    async getRecentActivity(query: RecentQuery) {
        const records = await prisma.record.findMany({
            where: { deletedAt: null },
            orderBy: { date: 'desc' },
            take: query.limit,
            select: {
                id: true,
                amount: true,
                type: true,
                date: true,
                notes: true,
                createdAt: true,
                category: { select: { id: true, name: true } },
                createdBy: { select: { id: true, name: true } },
            },
        });

        return records.map((r: any) => ({
            ...r,
            amount: r.amount.toString(),
        }));
    }
}

export const dashboardService = new DashboardService();