import { Badge } from "@/components/ui/badge";
import type { Status } from "@/types";

const statusConfig: Record<Status, { label: string; className: string }> = {
  ACTIVE: { label: "Active", className: "bg-[hsl(var(--income))]/15 text-[hsl(var(--income))] border-[hsl(var(--income))]/30 hover:bg-[hsl(var(--income))]/15" },
  INACTIVE: { label: "Inactive", className: "bg-[hsl(var(--expense))]/15 text-[hsl(var(--expense))] border-[hsl(var(--expense))]/30 hover:bg-[hsl(var(--expense))]/15" },
};

export function StatusBadge({ status }: { status: Status }) {
  const cfg = statusConfig[status];
  return <Badge variant="outline" className={cfg.className}>{cfg.label}</Badge>;
}
