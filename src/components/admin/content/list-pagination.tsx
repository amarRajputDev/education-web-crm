"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Pagination } from "@/components/ui/pagination";

/** Pagination wired to ?page= while preserving the current filters. */
export function ListPagination({
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <Pagination
      page={page}
      pageCount={pageCount}
      total={total}
      label={label}
      onPage={(nextPage) => {
        const params = new URLSearchParams(searchParams.toString());
        if (nextPage <= 1) params.delete("page");
        else params.set("page", String(nextPage));
        const query = params.toString();
        router.push(query ? `${pathname}?${query}` : pathname);
      }}
    />
  );
}
