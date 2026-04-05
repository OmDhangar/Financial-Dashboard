import { useState, useEffect } from "react";
import { dashboardService } from "@/api/dashboard.service";
import { usersService } from "@/api/users.service";
import type { CategoryBreakdown, User } from "@/types";
import { formatCurrency } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";
import { ChartCard } from "@/components/ChartCard";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { ChartSkeleton, TableSkeleton } from "@/components/Skeletons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const COLORS = ["hsl(217, 91%, 60%)", "hsl(142, 71%, 45%)", "hsl(0, 84%, 60%)", "hsl(250, 60%, 55%)", "hsl(38, 92%, 50%)", "hsl(180, 60%, 50%)"];

export default function CategoryExpensesPage() {
  const [categoryData, setCategoryData] = useState<CategoryBreakdown[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    usersService.getAll({ limit: 100 }).then(res => setUsers(res.data)).catch(() => {});
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await dashboardService.getCategoryExpenses(selectedUserId === "ALL" ? undefined : selectedUserId);
      setCategoryData(data);
    } catch {
      setError("Failed to load category expenses data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [selectedUserId]);

  const pieData = categoryData.map((c) => ({ name: c.categoryName, value: parseFloat(c.total) }));

  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  return (
    <div>
      <PageHeader 
        title="Category Expenses" 
        description="Detailed breakdown of spending and income by category" 
        action={
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger className="w-[200px] bg-secondary border-border h-9">
              <SelectValue placeholder="All Users" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="ALL">All Users</SelectItem>
              {users.map(u => (
                <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartCard title="Expense Distribution">
          {loading ? <ChartSkeleton /> : pieData.length === 0 ? <EmptyState title="No category data" /> : (
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={80} outerRadius={120} dataKey="value" paddingAngle={4} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "hsl(230, 14%, 11%)", border: "1px solid hsl(230, 12%, 20%)", borderRadius: 8, color: "hsl(210, 20%, 95%)" }} formatter={(v: number) => formatCurrency(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Category Details</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <TableSkeleton /> : categoryData.length === 0 ? <EmptyState title="No records found for filter" /> : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Category</TableHead>
                    <TableHead className="text-muted-foreground text-center">Type</TableHead>
                    <TableHead className="text-muted-foreground text-right">Transactions</TableHead>
                    <TableHead className="text-muted-foreground text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryData.map((c) => (
                    <TableRow key={`${c.categoryId}-${c.type}`} className="border-border">
                      <TableCell className="font-medium text-foreground">{c.categoryName}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={c.type === "INCOME" ? "text-[hsl(var(--income))] border-[hsl(var(--income))]/30" : "text-[hsl(var(--expense))] border-[hsl(var(--expense))]/30"}>
                          {c.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">{c.count}</TableCell>
                      <TableCell className={`text-right font-medium ${c.type === "INCOME" ? "text-[hsl(var(--income))]" : "text-[hsl(var(--expense))]"}`}>
                        {c.type === "INCOME" ? "+" : "-"}{formatCurrency(parseFloat(c.total))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
