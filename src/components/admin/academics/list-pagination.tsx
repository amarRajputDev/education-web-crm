"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Pagination } from "@/components/ui/pagination";

export function ListPagination({
  page,
  pageCount,
  total,
  label,
}: {
  page: number;
  pageCount: number;
  total: number;
  label: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const goTo = (nextPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(nextPage));
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <Pagination page={page} pageCount={pageCount} total={total} onPage={goTo} label={label} />
  );
}
