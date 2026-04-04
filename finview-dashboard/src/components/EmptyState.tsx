import { FileX } from "lucide-react";

export function EmptyState({ title = "No data", description = "There's nothing to show here yet." }: { title?: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center mb-4">
        <FileX className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      <p className="text-xs text-muted-foreground mt-1 max-w-sm">{description}</p>
    </div>
  );
}
