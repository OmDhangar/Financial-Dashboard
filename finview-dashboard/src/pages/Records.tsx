import { useState, useEffect, useCallback } from "react";
import { recordsService } from "@/api/records.service";
import { categoriesService } from "@/api/categories.service";
import type { FinancialRecord, Category, PaginationMeta, RecordFilters } from "@/types";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { useAuth } from "@/contexts/AuthContext";
import { useDebounce } from "@/hooks/useDebounce";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { PaginationControls } from "@/components/PaginationControls";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { TableSkeleton } from "@/components/Skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Search, RotateCcw } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

const recordSchema = z.object({
  amount: z.string().min(1, "Amount is required"),
  type: z.enum(["INCOME", "EXPENSE"]),
  categoryId: z.string().min(1, "Category is required"),
  date: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
});

type RecordFormData = z.infer<typeof recordSchema>;

export default function RecordsPage() {
  const { role, user } = useAuth();
  const isAdmin = role === "ADMIN";

  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState<RecordFilters>({ page: 1, limit: 10 });
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FinancialRecord | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const form = useForm<RecordFormData>({ resolver: zodResolver(recordSchema), defaultValues: { amount: "", type: "EXPENSE", categoryId: "", date: "", notes: "" } });

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await recordsService.getAll({ ...filters, search: debouncedSearch });
      setRecords(res.data);
      setMeta(res.meta);
    } catch {
      setError("Failed to load records");
    } finally {
      setLoading(false);
    }
  }, [filters, debouncedSearch]);

  useEffect(() => { categoriesService.getAll().then(setCategories).catch(() => {}); }, []);
  useEffect(() => { fetchRecords(); }, [fetchRecords]);
  useEffect(() => { setFilters((f) => ({ ...f, page: 1 })); }, [debouncedSearch]);

  const openCreate = () => {
    setEditingRecord(null);
    form.reset({ amount: "", type: "EXPENSE", categoryId: "", date: new Date().toISOString().split("T")[0], notes: "" });
    setFormOpen(true);
  };

  const openEdit = (r: FinancialRecord) => {
    setEditingRecord(r);
    form.reset({ amount: r.amount, type: r.type, categoryId: r.categoryId, date: r.date.split("T")[0], notes: r.notes || "" });
    setFormOpen(true);
  };

  const onSubmit = async (data: RecordFormData) => {
    try {
      const payload = { 
        amount: Number(data.amount), 
        type: data.type, 
        categoryId: data.categoryId, 
        date: data.date, 
        notes: data.notes 
      };
      if (editingRecord) {
        await recordsService.update(editingRecord.id, payload);
        toast.success("Record updated");
      } else {
        await recordsService.create(payload);
        toast.success("Record created");
      }
      setFormOpen(false);
      fetchRecords();
    } catch (err: any) {
      const details = err?.response?.data?.error?.details;
      if (details) details.forEach((d: any) => form.setError(d.field as any, { message: d.message }));
      else toast.error("Failed to save record");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await recordsService.delete(deleteId);
      toast.success("Record deleted");
      setDeleteId(null);
      fetchRecords();
    } catch {
      toast.error("Failed to delete record");
    } finally {
      setDeleting(false);
    }
  };

  const handleRestore = async (id: string) => {
    setRestoringId(id);
    try {
      await recordsService.restore(id);
      toast.success("Record restored");
      fetchRecords();
    } catch {
      toast.error("Failed to restore record");
    } finally {
      setRestoringId(null);
    }
  };

  if (error) return <ErrorState message={error} onRetry={fetchRecords} />;

  return (
    <div>
      <PageHeader title="Records" description="Manage financial transactions" action={<Button onClick={openCreate} size="sm"><Plus className="h-4 w-4 mr-1" /> Add Record</Button>} />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search records..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-secondary border-border h-9" />
        </div>
        <Select value={filters.type || "ALL"} onValueChange={(v) => setFilters((f) => ({ ...f, type: v === "ALL" ? "" : v as any, page: 1 }))}>
          <SelectTrigger className="w-[130px] bg-secondary border-border h-9"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="INCOME">Income</SelectItem>
            <SelectItem value="EXPENSE">Expense</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.categoryId || "ALL"} onValueChange={(v) => setFilters((f) => ({ ...f, categoryId: v === "ALL" ? "" : v, page: 1 }))}>
          <SelectTrigger className="w-[160px] bg-secondary border-border h-9"><SelectValue placeholder="All Categories" /></SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="ALL">All Categories</SelectItem>
            {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        {isAdmin && (
          <Button 
            variant={filters.includeDeleted ? "default" : "outline"} 
            size="sm" 
            onClick={() => setFilters(f => ({ ...f, includeDeleted: !f.includeDeleted, page: 1 }))}
            className={filters.includeDeleted ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : "border-border text-muted-foreground"}
          >
            Show Deleted
          </Button>
        )}
      </div>

      <Card className="bg-card border-border overflow-hidden">
        {loading ? <div className="p-4"><TableSkeleton /></div> : records.length === 0 ? <EmptyState title="No records found" /> : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Date</TableHead>
                  <TableHead className="text-muted-foreground">Category</TableHead>
                  <TableHead className="text-muted-foreground">Type</TableHead>
                  <TableHead className="text-muted-foreground text-right">Amount</TableHead>
                  <TableHead className="text-muted-foreground">Notes</TableHead>
                  <TableHead className="text-muted-foreground">Created By</TableHead>
                  <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((r) => (
                  <TableRow key={r.id} className={`border-border ${r.deletedAt ? "opacity-75 bg-destructive/5" : ""}`}>
                    <TableCell className="text-foreground text-sm">{formatDate(r.date)}</TableCell>
                    <TableCell className="text-foreground text-sm">{r.category.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={r.type === "INCOME" ? "text-[hsl(var(--income))] border-[hsl(var(--income))]/30" : "text-[hsl(var(--expense))] border-[hsl(var(--expense))]/30"}>
                        {r.type}
                      </Badge>
                      {r.deletedAt && <Badge variant="destructive" className="ml-2 text-[10px] scale-90">DELETED</Badge>}
                    </TableCell>
                    <TableCell className={`text-right font-medium text-sm ${r.type === "INCOME" ? "text-[hsl(var(--income))]" : "text-[hsl(var(--expense))]"}`}>
                      {r.type === "INCOME" ? "+" : "-"}{formatCurrency(r.amount)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-[150px] truncate">{r.notes || "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{r.createdBy.name}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {r.deletedAt && isAdmin ? (
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground" onClick={() => handleRestore(r.id)} disabled={restoringId === r.id}>
                            <RotateCcw className="h-3 w-3 mr-1" /> Restore
                          </Button>
                        ) : !r.deletedAt ? (
                          <>
                            {(isAdmin || r.createdBy.id === user?.id) && (
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => openEdit(r)}><Pencil className="h-3 w-3" /></Button>
                            )}
                            {(isAdmin || r.createdBy.id === user?.id) && (
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(r.id)}><Trash2 className="h-3 w-3" /></Button>
                            )}
                          </>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="px-4 pb-3">
              <PaginationControls meta={meta} onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))} />
            </div>
          </>
        )}
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editingRecord ? "Edit Record" : "New Record"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="amount" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Amount</FormLabel>
                    <FormControl><Input {...field} placeholder="0.00" className="bg-secondary border-border" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="type" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="INCOME">Income</SelectItem>
                        <SelectItem value="EXPENSE">Expense</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="categoryId" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Category</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select category" /></SelectTrigger></FormControl>
                    <SelectContent className="bg-card border-border">
                      {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="date" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Date</FormLabel>
                  <FormControl><Input {...field} type="date" className="bg-secondary border-border" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Notes (optional)</FormLabel>
                  <FormControl><Input {...field} placeholder="Notes..." className="bg-secondary border-border" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setFormOpen(false)} className="border-border">Cancel</Button>
                <Button type="submit">{editingRecord ? "Update" : "Create"}</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} title="Delete Record" description="This action cannot be undone." onConfirm={handleDelete} loading={deleting} />
    </div>
  );
}
