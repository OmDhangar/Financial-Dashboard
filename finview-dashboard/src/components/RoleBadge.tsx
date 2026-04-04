import { Badge } from "@/components/ui/badge";
import type { Role } from "@/types";

const roleConfig: Record<Role, { label: string; className: string }> = {
  ADMIN: { label: "Admin", className: "bg-primary/20 text-primary border-primary/30 hover:bg-primary/20" },
  ANALYST: { label: "Analyst", className: "bg-[hsl(var(--accent))]/20 text-[hsl(var(--accent))] border-[hsl(var(--accent))]/30 hover:bg-[hsl(var(--accent))]/20" },
  VIEWER: { label: "Viewer", className: "bg-muted text-muted-foreground border-border hover:bg-muted" },
};

export function RoleBadge({ role }: { role: Role }) {
  const cfg = roleConfig[role];
  return <Badge variant="outline" className={cfg.className}>{cfg.label}</Badge>;
}
