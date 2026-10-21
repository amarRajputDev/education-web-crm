"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

export type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items, className = "" }: { items: Crumb[]; className?: string }) {
  const pathname = usePathname();
  const all = [{ label: "Home", href: "/" }, ...items];
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-slate-body">
        {all.map((item, index) => {
          const last = index === all.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {index === 0 ? <Home className="h-3.5 w-3.5" aria-hidden /> : null}
              {item.href && !last ? (
                <Link href={item.href} className="transition hover:text-royal">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className="font-medium text-navy">
                  {item.label}
                </span>
              )}
              {last ? null : <ChevronRight className="h-3.5 w-3.5 text-[#a7b1c4]" aria-hidden />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
