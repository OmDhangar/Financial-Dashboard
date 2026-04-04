import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PaginationMeta } from "@/types";

interface Props {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}

export function PaginationControls({ meta, onPageChange }: Props) {
  return (
    <div className="flex items-center justify-between mt-4">
      <p className="text-xs text-muted-foreground">
        Showing {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
      </p>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" className="h-8 w-8 border-border" disabled={meta.page <= 1} onClick={() => onPageChange(meta.page - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {Array.from({ length: Math.min(meta.totalPages, 5) }, (_, i) => {
          const start = Math.max(1, Math.min(meta.page - 2, meta.totalPages - 4));
          const page = start + i;
          if (page > meta.totalPages) return null;
          return (
            <Button key={page} variant={page === meta.page ? "default" : "outline"} size="icon" className="h-8 w-8 border-border text-xs" onClick={() => onPageChange(page)}>
              {page}
            </Button>
          );
        })}
        <Button variant="outline" size="icon" className="h-8 w-8 border-border" disabled={meta.page >= meta.totalPages} onClick={() => onPageChange(meta.page + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
