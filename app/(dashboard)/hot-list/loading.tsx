import { Skeleton } from "@/components/ui/skeleton";

export default function HotListLoading() {
  return (
    <div className="px-6 py-8 lg:px-10 max-w-3xl mx-auto space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
