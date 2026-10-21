import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

export type HeaderCell = {
  key: string;
  label: React.ReactNode;
  align?: "left" | "right";
  ariaSort?: "ascending" | "descending" | "none";
};

export function AcademicsTable({
  label,
  headers,
  children,
  footer,
}: {
  label: string;
  headers: HeaderCell[];
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="table-shell">
      <table className="data-table" aria-label={label}>
        <thead>
          <tr>
            {headers.map((header) => (
              <th
                key={header.key}
                scope="col"
                aria-sort={header.ariaSort}
                className={header.align === "right" ? "text-right" : undefined}
              >
                {header.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
      {footer}
    </div>
  );
}

export function SortHeader({
  label,
  href,
  active,
  dir,
}: {
  label: string;
  href: string;
  active: boolean;
  dir: string;
}) {
  const Icon = active ? (dir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <Link href={href} className="inline-flex items-center gap-1 transition hover:text-royal">
      {label}
      <Icon className="h-3.5 w-3.5" aria-hidden />
      <span className="sr-only">
        {active
          ? dir === "asc"
            ? ", sorted ascending, activate to sort descending"
            : ", sorted descending, activate to sort ascending"
          : ", activate to sort"}
      </span>
    </Link>
  );
}
