import { useState, useEffect, useCallback } from "react";
import { usersService } from "@/api/users.service";
import type { User, PaginationMeta, UserFilters, Role, Status } from "@/types";
import { formatDate } from "@/lib/formatters";
import { useDebounce } from "@/hooks/useDebounce";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { PaginationControls } from "@/components/PaginationControls";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { RoleBadge } from "@/components/RoleBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { TableSkeleton } from "@/components/Skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Search, MoreHorizontal } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

const userSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Min 6 characters"),
  role: z.enum(["VIEWER", "ANALYST", "ADMIN"]),
});

type UserFormData = z.infer<typeof userSchema>;

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState<UserFilters>({ page: 1, limit: 10 });
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const form = useForm<UserFormData>({ resolver: zodResolver(userSchema), defaultValues: { name: "", email: "", password: "", role: "VIEWER" } });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await usersService.getAll({ ...filters, search: debouncedSearch });
      setUsers(res.data);
      setMeta(res.meta);
    } catch {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [filters, debouncedSearch]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { setFilters((f) => ({ ...f, page: 1 })); }, [debouncedSearch]);

  const onSubmit = async (data: UserFormData) => {
    try {
      await usersService.create({ name: data.name, email: data.email, password: data.password, role: data.role });
      toast.success("User created");
      setFormOpen(false);
      form.reset();
      fetchUsers();
    } catch (err: any) {
      const details = err?.response?.data?.error?.details;
      if (details) details.forEach((d: any) => form.setError(d.field as any, { message: d.message }));
      else toast.error(err?.response?.data?.error?.message || "Failed to create user");
    }
  };

  const handleRoleChange = async (id: string, role: Role) => {
    try {
      await usersService.updateRole(id, role);
      toast.success("Role updated");
      fetchUsers();
    } catch {
      toast.error("Failed to update role");
    }
  };

  const handleStatusToggle = async (user: User) => {
    const newStatus: Status = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await usersService.updateStatus(user.id, newStatus);
      toast.success("Status updated");
      fetchUsers();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await usersService.delete(deleteId);
      toast.success("User deleted");
      setDeleteId(null);
      fetchUsers();
    } catch {
      toast.error("Failed to delete user");
    } finally {
      setDeleting(false);
    }
  };

  if (error) return <ErrorState message={error} onRetry={fetchUsers} />;

  return (
    <div>
      <PageHeader title="Users" description="Manage system users" action={<Button onClick={() => { form.reset(); setFormOpen(true); }} size="sm"><Plus className="h-4 w-4 mr-1" /> Add User</Button>} />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-secondary border-border h-9" />
        </div>
        <Select value={filters.role || "ALL"} onValueChange={(v) => setFilters((f) => ({ ...f, role: v === "ALL" ? "" : v as Role, page: 1 }))}>
          <SelectTrigger className="w-[130px] bg-secondary border-border h-9"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="ALL">All Roles</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="ANALYST">Analyst</SelectItem>
            <SelectItem value="VIEWER">Viewer</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.status || "ALL"} onValueChange={(v) => setFilters((f) => ({ ...f, status: v === "ALL" ? "" : v as Status, page: 1 }))}>
          <SelectTrigger className="w-[130px] bg-secondary border-border h-9"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="bg-card border-border overflow-hidden">
        {loading ? <div className="p-4"><TableSkeleton /></div> : users.length === 0 ? <EmptyState title="No users found" /> : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">User</TableHead>
                  <TableHead className="text-muted-foreground">Role</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground">Created</TableHead>
                  <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id} className="border-border">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/20 text-primary text-xs">{u.name.split(" ").map((n) => n[0]).join("").toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-foreground">{u.name}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><RoleBadge role={u.role} /></TableCell>
                    <TableCell><StatusBadge status={u.status} /></TableCell>
                    <TableCell className="text-muted-foreground text-sm">{formatDate(u.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-card border-border">
                          <DropdownMenuItem onClick={() => handleRoleChange(u.id, "ADMIN")} className="text-sm">Set Admin</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRoleChange(u.id, "ANALYST")} className="text-sm">Set Analyst</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRoleChange(u.id, "VIEWER")} className="text-sm">Set Viewer</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusToggle(u)} className="text-sm">
                            {u.status === "ACTIVE" ? "Deactivate" : "Activate"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteId(u.id)} className="text-sm text-destructive">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
          <DialogHeader><DialogTitle className="text-foreground">Create User</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel className="text-foreground">Name</FormLabel><FormControl><Input {...field} className="bg-secondary border-border" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel className="text-foreground">Email</FormLabel><FormControl><Input {...field} type="email" className="bg-secondary border-border" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem><FormLabel className="text-foreground">Password</FormLabel><FormControl><Input {...field} type="password" className="bg-secondary border-border" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="role" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Role</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="VIEWER">Viewer</SelectItem>
                      <SelectItem value="ANALYST">Analyst</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setFormOpen(false)} className="border-border">Cancel</Button>
                <Button type="submit">Create</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} title="Delete User" description="This will permanently delete this user." onConfirm={handleDelete} loading={deleting} />
    </div>
  );
}
