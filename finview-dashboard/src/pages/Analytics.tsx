import { useState, useEffect } from "react";
import { dashboardService } from "@/api/dashboard.service";
import type { DashboardSummary, Trend, CategoryBreakdown } from "@/types";
import { formatCurrency } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";
import { MetricCard } from "@/components/MetricCard";
import { ChartCard } from "@/components/ChartCard";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { MetricCardSkeleton, ChartSkeleton } from "@/components/Skeletons";
import { DollarSign, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from "recharts";
import { format, parseISO } from "date-fns";

const COLORS = ["hsl(217, 91%, 60%)", "hsl(142, 71%, 45%)", "hsl(0, 84%, 60%)", "hsl(250, 60%, 55%)", "hsl(38, 92%, 50%)", "hsl(180, 60%, 50%)"];

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [s, t, c] = await Promise.all([
        dashboardService.getSummary(),
        dashboardService.getTrends(),
        dashboardService.getCategories(),
      ]);
      setSummary(s);
      setTrends(t);
      setCategoryData(c);
    } catch {
      setError("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const chartData = trends.reduce<Record<string, any>>((acc, t) => {
    const key = t.month;
    if (!acc[key]) acc[key] = { month: key, Income: 0, Expense: 0 };
    if (t.type === "INCOME") acc[key].Income = parseFloat(t.total);
    else acc[key].Expense = parseFloat(t.total);
    return acc;
  }, {});
  const chartArray = Object.values(chartData).sort((a: any, b: any) => a.month.localeCompare(b.month));

  const pieData = categoryData.map((c) => ({ name: c.categoryName, value: parseFloat(c.total) }));

  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  return (
    <div>
      <PageHeader title="Analytics" description="Detailed financial insights" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {loading ? Array.from({ length: 4 }).map((_, i) => <MetricCardSkeleton key={i} />) : summary ? (
          <>
            <MetricCard title="Net Balance" value={formatCurrency(summary.netBalance)} icon={DollarSign} iconColor="text-primary" />
            <MetricCard title="Total Income" value={formatCurrency(summary.totalIncome)} icon={TrendingUp} iconColor="text-[hsl(var(--income))]" />
            <MetricCard title="Total Expenses" value={formatCurrency(summary.totalExpense)} icon={TrendingDown} iconColor="text-[hsl(var(--expense))]" />
            <MetricCard title="Transactions" value={summary.transactionCount.toString()} icon={BarChart3} iconColor="text-[hsl(var(--accent))]" />
          </>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <ChartCard title="Income vs Expense Trend">
          {loading ? <ChartSkeleton /> : chartArray.length === 0 ? <EmptyState title="No trend data" /> : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartArray}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(230, 12%, 20%)" />
                <XAxis dataKey="month" tickFormatter={(v) => { try { return format(parseISO(v), "MMM"); } catch { return v; } }} stroke="hsl(215, 15%, 55%)" fontSize={12} />
                <YAxis stroke="hsl(215, 15%, 55%)" fontSize={12} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(230, 14%, 11%)", border: "1px solid hsl(230, 12%, 20%)", borderRadius: 8, color: "hsl(210, 20%, 95%)" }} formatter={(v: number) => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="Income" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expense" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Category Breakdown">
          {loading ? <ChartSkeleton /> : pieData.length === 0 ? <EmptyState title="No category data" /> : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" paddingAngle={2} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "hsl(230, 14%, 11%)", border: "1px solid hsl(230, 12%, 20%)", borderRadius: 8, color: "hsl(210, 20%, 95%)" }} formatter={(v: number) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <ChartCard title="Monthly Trend Line">
        {loading ? <ChartSkeleton /> : chartArray.length === 0 ? <EmptyState title="No data" /> : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartArray}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(230, 12%, 20%)" />
              <XAxis dataKey="month" tickFormatter={(v) => { try { return format(parseISO(v), "MMM yy"); } catch { return v; } }} stroke="hsl(215, 15%, 55%)" fontSize={12} />
              <YAxis stroke="hsl(215, 15%, 55%)" fontSize={12} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(230, 14%, 11%)", border: "1px solid hsl(230, 12%, 20%)", borderRadius: 8, color: "hsl(210, 20%, 95%)" }} formatter={(v: number) => formatCurrency(v)} />
              <Legend />
              <Line type="monotone" dataKey="Income" stroke="hsl(142, 71%, 45%)" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Expense" stroke="hsl(0, 84%, 60%)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
}
