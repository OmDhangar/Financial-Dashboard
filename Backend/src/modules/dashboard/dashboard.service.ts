// src/modules/dashboard/dashboard.service.ts
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { SummaryQuery, TrendsQuery, CategoryBreakdownQuery, RecentQuery, ExpensesByUserQuery } from './dashboard.schema';

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

interface ExpensesByUserRow {
    userId: string;
    userName: string;
    userEmail: string;
    totalExpense: Decimal;
    totalIncome: Decimal;
    transactionCount: bigint;
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
     * VIEWER: scoped to their own records only.
     */
    async getSummary(query: SummaryQuery, userId?: string, role?: string) {
        const dateRange = this.resolveDateRange(query);

        const baseWhere: Prisma.RecordWhereInput = {
            deletedAt: null,
            date: dateRange,
            // Scope to user's own records for VIEWER role
            ...(role === 'VIEWER' && userId ? { createdById: userId } : {}),
        };

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
            isPersonal: role === 'VIEWER',
        };
    }

    /**
     * Monthly trends for a given year — income vs expense per month.
     * VIEWER: scoped to their own records only.
     */
    async getMonthlyTrends(query: TrendsQuery, userId?: string, role?: string) {
        const isViewer = role === 'VIEWER' && userId;

        const rows = isViewer
            ? await prisma.$queryRaw<TrendRow[]>`
              SELECT
                DATE_TRUNC('month', date)   AS month,
                type::text                  AS type,
                SUM(amount)                 AS total,
                COUNT(*)                    AS count
              FROM records
              WHERE
                EXTRACT(YEAR FROM date) = ${query.year}
                AND deleted_at IS NULL
                AND created_by_id = ${userId}
              GROUP BY month, type
              ORDER BY month ASC
            `
            : await prisma.$queryRaw<TrendRow[]>`
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

        return rows.map((row: any) => ({
            month: row.month,
            type: row.type,
            total: row.total.toString(),
            count: Number(row.count),
        }));
    }

    /**
     * Category breakdown — sum and count per category per type, for a given period.
     * VIEWER: scoped to own records. ANALYST/ADMIN: can optionally scope by userId.
     */
    async getCategoryBreakdown(query: CategoryBreakdownQuery, userId?: string, role?: string) {
        const dateRange = this.resolveDateRange(query);

        // Determine which userId to filter by
        const filterUserId = role === 'VIEWER' ? userId : query.userId;

        const rows = filterUserId
            ? await prisma.$queryRaw<CategoryBreakdownRow[]>`
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
                AND r.created_by_id = ${filterUserId}
              GROUP BY r.category_id, c.name, r.type
              ORDER BY total DESC
            `
            : await prisma.$queryRaw<CategoryBreakdownRow[]>`
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
     * VIEWER: scoped to own records only.
     */
    async getRecentActivity(query: RecentQuery, userId?: string, role?: string) {
        const where: Prisma.RecordWhereInput = {
            deletedAt: null,
            ...(role === 'VIEWER' && userId ? { createdById: userId } : {}),
        };

        const records = await prisma.record.findMany({
            where,
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

    /**
     * Expenses grouped by user — for ANALYST and ADMIN.
     * Shows each user's total income, total expense, and transaction count.
     */
    async getExpensesByUser(_query: ExpensesByUserQuery) {
        const rows = await prisma.$queryRaw<ExpensesByUserRow[]>`
          SELECT
            u.id                              AS "userId",
            u.name                            AS "userName",
            u.email                           AS "userEmail",
            COALESCE(SUM(CASE WHEN r.type = 'EXPENSE' THEN r.amount ELSE 0 END), 0) AS "totalExpense",
            COALESCE(SUM(CASE WHEN r.type = 'INCOME'  THEN r.amount ELSE 0 END), 0) AS "totalIncome",
            COUNT(r.id)                       AS "transactionCount"
          FROM users u
          LEFT JOIN records r
            ON r.created_by_id = u.id
            AND r.deleted_at IS NULL
          WHERE
            u.deleted_at IS NULL
            AND u.status = 'ACTIVE'
          GROUP BY u.id, u.name, u.email
          ORDER BY "totalExpense" DESC
        `;

        return rows.map((row: any) => ({
            userId: row.userId,
            userName: row.userName,
            userEmail: row.userEmail,
            totalExpense: row.totalExpense.toString(),
            totalIncome: row.totalIncome.toString(),
            netBalance: new Decimal(row.totalIncome).minus(row.totalExpense).toString(),
            transactionCount: Number(row.transactionCount),
        }));
    }
}

export const dashboardService = new DashboardService();