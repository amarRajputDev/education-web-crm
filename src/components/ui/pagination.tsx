"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

export function Pagination({
  page,
  pageCount,
  total,
  onPage,
  label = "records",
}: {
  page: number;
  pageCount: number;
  total: number;
  onPage: (page: number) => void;
  label?: string;
}) {
  if (total === 0) return null;
  const pages = Array.from({ length: pageCount }, (_, index) => index + 1).filter((value) => {
    if (value === 1 || value === pageCount) return true;
    return Math.abs(value - page) <= 1;
  });

  const items: (number | "gap")[] = [];
  let previous = 0;
  for (const value of pages) {
    if (previous && value - previous > 1) items.push("gap");
    items.push(value);
    previous = value;
  }

  return (
    <nav className="flex flex-col gap-3 border-t border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between" aria-label="Pagination">
      <p className="text-xs text-slate-body">
        Showing page <span className="font-semibold text-navy">{page}</span> of{" "}
        <span className="font-semibold text-navy">{Math.max(pageCount, 1)}</span> · {total} {label}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="rounded-lg border border-line bg-white p-1.5 text-slate-body transition hover:border-royal hover:text-royal disabled:opacity-40"
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </button>
        {items.map((item, index) =>
          item === "gap" ? (
            <span key={`gap-${index}`} className="px-1 text-xs text-slate-body">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPage(item)}
              aria-current={item === page ? "page" : undefined}
              className={cn(
                "min-w-8 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition",
                item === page ? "bg-navy text-white" : "border border-line bg-white text-slate-body hover:border-royal hover:text-royal",
              )}
            >
              {item}
            </button>
          ),
        )}
        <button
          type="button"
          className="rounded-lg border border-line bg-white p-1.5 text-slate-body transition hover:border-royal hover:text-royal disabled:opacity-40"
          onClick={() => onPage(page + 1)}
          disabled={page >= pageCount}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </nav>
  );
}
