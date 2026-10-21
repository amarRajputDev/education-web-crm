import { SearchX, Inbox, FileText, CalendarX } from "lucide-react";
import { cn } from "@/lib/cn";

const ICONS = {
  search: SearchX,
  empty: Inbox,
  document: FileText,
  calendar: CalendarX,
};

export function EmptyState({
  title,
  description,
  action,
  icon = "empty",
  compact = false,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: keyof typeof ICONS;
  compact?: boolean;
}) {
  const Icon = ICONS[icon];
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#cfd7e6] bg-[#fbfcfe] px-6 text-center",
        compact ? "py-8" : "py-14",
      )}
    >
      <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-royal-100 text-royal">
        <Icon className="h-6 w-6" aria-hidden />
      </span>
      <h3 className="text-base font-bold text-charcoal">{title}</h3>
      {description ? (
        <p className="mt-1.5 max-w-md text-sm leading-relaxed text-slate-body">{description}</p>
      ) : null}
      {action ? <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div> : null}
    </div>
  );
}

export function Spinner({ className, label = "Loading" }: { className?: string; label?: string }) {
  return (
    <span className={cn("inline-block animate-spin rounded-full border-2 border-current border-t-transparent", className)} role="status" aria-label={label} />
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} aria-hidden />;
}

export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3 p-4" aria-busy="true" aria-label="Loading records">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-3">
          {Array.from({ length: cols }).map((__, colIndex) => (
            <Skeleton key={colIndex} className={colIndex === 0 ? "h-4 w-40" : "h-4 flex-1"} />
          ))}
        </div>
      ))}
    </div>
  );
}
