import { Skeleton, TableSkeleton } from "@/components/ui/feedback";

export function ListSkeleton({
  label,
  rows = 8,
  cols = 8,
}: {
  label: string;
  rows?: number;
  cols?: number;
}) {
  return (
    <div className="space-y-6" aria-busy="true" aria-label={`Loading ${label}`}>
      <div className="space-y-3">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-7 w-24" />
      </div>
      <Skeleton className="h-24 w-full" />
      <div className="card overflow-hidden">
        <TableSkeleton rows={rows} cols={cols} />
      </div>
    </div>
  );
}
