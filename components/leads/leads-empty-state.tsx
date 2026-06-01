import { Users } from "lucide-react";

interface LeadsEmptyStateProps {
  filtered?: boolean;
}

export function LeadsEmptyState({ filtered }: LeadsEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted mb-4">
        <Users className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground mb-1">
        {filtered ? "No leads match your filters" : "Your lead workspace is ready."}
      </p>
      <p className="text-xs text-muted-foreground max-w-xs">
        {filtered
          ? "Try adjusting your search or filters to find what you're looking for."
          : "Add your first prospect to start building your sales rhythm."}
      </p>
    </div>
  );
}
