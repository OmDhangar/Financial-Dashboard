import { useState, useEffect } from "react";
import { dashboardService } from "@/api/dashboard.service";
import type { DashboardSummary, Trend, FinancialRecord } from "@/types";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { MetricCard } from "@/components/MetricCard";
import { ChartCard } from "@/components/ChartCard";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { MetricCardSkeleton, ChartSkeleton, TableSkeleton } from "@/components/Skeletons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, parseISO } from "date-fns";

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [recent, setRecent] = useState<FinancialRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [s, t, r] = await Promise.all([
        dashboardService.getSummary(),
        dashboardService.getTrends(),
        dashboardService.getRecent(),
      ]);
      setSummary(s);
      setTrends(t);
      setRecent(r);
    } catch {
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Transform trends for chart
  const chartData = trends.reduce<Record<string, { month: string; Income: number; Expense: number }>>((acc, t) => {
    const key = t.month;
    if (!acc[key]) acc[key] = { month: key, Income: 0, Expense: 0 };
    if (t.type === "INCOME") acc[key].Income = parseFloat(t.total);
    else acc[key].Expense = parseFloat(t.total);
    return acc;
  }, {});

  const chartArray = Object.values(chartData).sort((a, b) => a.month.localeCompare(b.month));

  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  return (
    <div>
      <PageHeader 
        title={summary?.isPersonal ? "My Dashboard" : "Dashboard"} 
        description={summary?.isPersonal ? "Overview of your personal financial activity" : "Overview of organizational financial activity"} 
      />

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <MetricCardSkeleton key={i} />)
        ) : summary ? (
          <>
            <MetricCard title="Net Balance" value={formatCurrency(summary.netBalance)} icon={Wallet} iconColor="text-primary" trend={{ value: 12.5, label: "vs last month" }} />
            <MetricCard title="Total Income" value={formatCurrency(summary.totalIncome)} icon={TrendingUp} iconColor="text-[hsl(var(--income))]" trend={{ value: 8.2, label: "vs last month" }} />
            <MetricCard title="Total Expenses" value={formatCurrency(summary.totalExpense)} icon={TrendingDown} iconColor="text-[hsl(var(--expense))]" trend={{ value: -3.1, label: "vs last month" }} />
            <MetricCard title="Transactions" value={summary.transactionCount.toString()} icon={DollarSign} iconColor="text-[hsl(var(--accent))]" trend={{ value: 5, label: "this period" }} />
          </>
        ) : null}
      </div>

      {/* Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <ChartCard title="Monthly Trends" className="lg:col-span-2">
          {loading ? <ChartSkeleton /> : chartArray.length === 0 ? <EmptyState title="No trend data" /> : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartArray}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(230 12% 20%)" />
                <XAxis dataKey="month" tickFormatter={(v) => { try { return format(parseISO(v), "MMM"); } catch { return v; } }} stroke="hsl(215 15% 55%)" fontSize={12} />
                <YAxis stroke="hsl(215 15% 55%)" fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(230 14% 11%)", border: "1px solid hsl(230 12% 20%)", borderRadius: 8, color: "hsl(210 20% 95%)" }} formatter={(v: number) => formatCurrency(v)} />
                <Legend />
                <Line type="monotone" dataKey="Income" stroke="hsl(142 71% 45%)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Expense" stroke="hsl(0 84% 60%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Recent Transactions */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <TableSkeleton rows={4} /> : recent.length === 0 ? <EmptyState title="No recent transactions" /> : (
              <div className="space-y-3">
                {recent.slice(0, 6).map((r) => (
                  <div key={r.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{r.category.name}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(r.date)}</p>
                    </div>
                    <Badge variant="outline" className={r.type === "INCOME" ? "text-[hsl(var(--income))] border-[hsl(var(--income))]/30" : "text-[hsl(var(--expense))] border-[hsl(var(--expense))]/30"}>
                      {r.type === "INCOME" ? "+" : "-"}{formatCurrency(r.amount)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
