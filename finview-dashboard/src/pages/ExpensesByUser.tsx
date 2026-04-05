import { useState, useEffect } from "react";
import { dashboardService } from "@/api/dashboard.service";
import type { UserExpense } from "@/types";
import { formatCurrency } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";
import { ChartCard } from "@/components/ChartCard";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { ChartSkeleton, TableSkeleton } from "@/components/Skeletons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function ExpensesByUserPage() {
  const [userExpenses, setUserExpenses] = useState<UserExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await dashboardService.getExpensesByUser();
      setUserExpenses(data);
    } catch {
      setError("Failed to load user expenses data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const chartData = userExpenses.map((u) => ({
    name: u.userName,
    Income: parseFloat(u.totalIncome),
    Expense: parseFloat(u.totalExpense),
  }));

  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  return (
    <div>
      <PageHeader title="Expenses By User" description="Analyze income and expenses grouped by individual users" />

      <div className="grid grid-cols-1 gap-6 mb-6">
        <ChartCard title="User Income vs Expense Comparison">
          {loading ? <ChartSkeleton /> : chartData.length === 0 ? <EmptyState title="No data available" /> : (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(230, 12%, 20%)" />
                <XAxis dataKey="name" stroke="hsl(215, 15%, 55%)" fontSize={12} />
                <YAxis stroke="hsl(215, 15%, 55%)" fontSize={12} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(230, 14%, 11%)", border: "1px solid hsl(230, 12%, 20%)", borderRadius: 8, color: "hsl(210, 20%, 95%)" }} formatter={(v: number) => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="Income" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expense" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-medium">User Details</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <TableSkeleton /> : userExpenses.length === 0 ? <EmptyState title="No active users found" /> : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">User</TableHead>
                    <TableHead className="text-muted-foreground text-right">Transactions</TableHead>
                    <TableHead className="text-muted-foreground text-right">Total Income</TableHead>
                    <TableHead className="text-muted-foreground text-right">Total Expense</TableHead>
                    <TableHead className="text-muted-foreground text-right">Net Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userExpenses.map((u) => {
                    const isPositive = parseFloat(u.netBalance) >= 0;
                    return (
                      <TableRow key={u.userId} className="border-border">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary/20 text-primary text-xs">
                                {u.userName.split(" ").map((n) => n[0]).join("").toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium text-foreground">{u.userName}</p>
                              <p className="text-xs text-muted-foreground">{u.userEmail}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">{u.transactionCount}</TableCell>
                        <TableCell className="text-right text-[hsl(var(--income))] font-medium">+{formatCurrency(parseFloat(u.totalIncome))}</TableCell>
                        <TableCell className="text-right text-[hsl(var(--expense))] font-medium">-{formatCurrency(parseFloat(u.totalExpense))}</TableCell>
                        <TableCell className={`text-right font-bold ${isPositive ? 'text-[hsl(var(--income))]' : 'text-[hsl(var(--expense))]'}`}>
                          {isPositive ? "+" : ""}{formatCurrency(parseFloat(u.netBalance))}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
