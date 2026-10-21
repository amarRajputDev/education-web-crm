"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * URL-driven pagination for admin lists (no callbacks — every page is a link,
 * so results survive refresh, back-button and shared URLs).
 */
export function AdminPager({
  page,
  pageCount,
  total,
  label = "records",
}: {
  page: number;
  pageCount: number;
  total: number;
  label?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (total === 0) return null;

  const hrefFor = (target: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (target <= 1) params.delete("page");
    else params.set("page", String(target));
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  const candidates = Array.from({ length: pageCount }, (_, index) => index + 1).filter((value) => {
    if (value === 1 || value === pageCount) return true;
    return Math.abs(value - page) <= 1;
  });

  const items: (number | "gap")[] = [];
  let previous = 0;
  for (const value of candidates) {
    if (previous && value - previous > 1) items.push("gap");
    items.push(value);
    previous = value;
  }

  return (
    <nav
      className="flex flex-col gap-3 border-t border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
      aria-label="Pagination"
    >
      <p className="text-xs text-slate-body">
        Page <span className="font-semibold text-navy">{page}</span> of{" "}
        <span className="font-semibold text-navy">{pageCount}</span> · {total} {label}
      </p>
      <div className="flex flex-wrap items-center gap-1">
        <Link
          href={hrefFor(page - 1)}
          aria-disabled={page <= 1}
          className={cn(
            "rounded-lg border border-line bg-white p-1.5 text-slate-body transition hover:border-royal hover:text-royal",
            page <= 1 && "pointer-events-none opacity-40",
          )}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </Link>
        {items.map((item, index) =>
          item === "gap" ? (
            <span key={`gap-${index}`} className="px-1 text-xs text-slate-body">
              …
            </span>
          ) : (
            <Link
              key={item}
              href={hrefFor(item)}
              aria-current={item === page ? "page" : undefined}
              className={cn(
                "min-w-8 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition",
                item === page
                  ? "bg-navy text-white"
                  : "border border-line bg-white text-slate-body hover:border-royal hover:text-royal",
              )}
            >
              {item}
            </Link>
          ),
        )}
        <Link
          href={hrefFor(page + 1)}
          aria-disabled={page >= pageCount}
          className={cn(
            "rounded-lg border border-line bg-white p-1.5 text-slate-body transition hover:border-royal hover:text-royal",
            page >= pageCount && "pointer-events-none opacity-40",
          )}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </nav>
  );
}
