import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function MetricCardSkeleton() {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-4 w-24 bg-secondary" />
          <Skeleton className="h-9 w-9 rounded-lg bg-secondary" />
        </div>
        <Skeleton className="h-8 w-32 bg-secondary" />
        <Skeleton className="h-3 w-20 mt-2 bg-secondary" />
      </CardContent>
    </Card>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-full bg-secondary" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full bg-secondary" />
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return <Skeleton className="h-64 w-full bg-secondary rounded-lg" />;
}
