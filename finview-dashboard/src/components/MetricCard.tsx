import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface MetricCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  className?: string;
  iconColor?: string;
}

export function MetricCard({ title, value, icon: Icon, trend, className, iconColor }: MetricCardProps) {
  return (
    <Card className={cn("bg-card border-border", className)}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground">{title}</span>
          <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center bg-secondary", iconColor)}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
        {trend && (
          <p className={cn("text-xs mt-1", trend.value >= 0 ? "text-[hsl(var(--income))]" : "text-[hsl(var(--expense))]")}>
            {trend.value >= 0 ? "+" : ""}{trend.value}% <span className="text-muted-foreground">{trend.label}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
