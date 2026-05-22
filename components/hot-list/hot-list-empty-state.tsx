import { Flame } from "lucide-react";

export function HotListEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted mb-4">
        <Flame className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground mb-1">Your hot list is empty.</p>
      <p className="text-xs text-muted-foreground max-w-xs">
        Mark important leads as hot to build your daily sales rhythm.
      </p>
    </div>
  );
}
