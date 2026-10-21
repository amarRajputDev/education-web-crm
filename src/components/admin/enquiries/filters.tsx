"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Filter, RotateCcw, Search } from "lucide-react";
import { cn } from "@/lib/cn";

export type FilterOption = { value: string; label: string };

export function EnquiryFilters({
  courses,
  counsellors,
  statuses,
  sources,
  resultCount,
}: {
  courses: FilterOption[];
  counsellors: FilterOption[];
  statuses: FilterOption[];
  sources: FilterOption[];
  defaultValues?: Record<string, string>;
  resultCount?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const value = (key: string) => searchParams.get(key) ?? "";

  const set = (key: string, nextValue: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextValue) params.set(key, nextValue);
    else params.delete(key);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  const reset = () => {
    const params = new URLSearchParams();
    const view = searchParams.get("view");
    if (view) params.set("view", view);
    router.push(view ? `${pathname}?${params.toString()}` : pathname);
  };

  const activeCount = ["q", "status", "course", "counsellor", "source", "priority", "from", "to"].filter((key) =>
    value(key),
  ).length;

  const selectClass =
    "w-full rounded-xl border border-line-strong bg-paper px-3 py-2 text-[13px] text-navy focus:border-royal focus:outline-none focus:ring-2 focus:ring-royal/15";

  return (
    <div className="card p-4">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const params = new URLSearchParams(searchParams.toString());
          const data = new FormData(event.currentTarget);
          for (const [key, entry] of data.entries()) {
            const nextValue = String(entry);
            if (nextValue) params.set(key, nextValue);
            else params.delete(key);
          }
          params.delete("page");
          router.push(`${pathname}?${params.toString()}`);
        }}
        className="flex flex-col gap-3"
      >
        {value("view") ? <input type="hidden" name="view" value={value("view")} /> : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <label htmlFor="enquiry-search" className="sr-only">
              Search enquiries
            </label>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-body" aria-hidden />
            <input
              id="enquiry-search"
              name="q"
              type="search"
              defaultValue={value("q")}
              placeholder="Search name, phone, email or enquiry ID…"
              className="field !pl-9 !text-[13px]"
            />
          </div>

          <button type="submit" className="btn btn-primary btn-sm">
            <Search className="h-4 w-4" aria-hidden />
            Search
          </button>
          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            className={cn("btn btn-outline btn-sm", open && "bg-royal-100")}
            aria-expanded={open}
          >
            <Filter className="h-4 w-4" aria-hidden />
            Filters
            {activeCount > 0 ? (
              <span className="ml-1 rounded-full bg-royal px-1.5 py-0.5 text-[10px] font-extrabold text-white">{activeCount}</span>
            ) : null}
          </button>
          {activeCount > 0 ? (
            <button type="button" onClick={reset} className="btn btn-ghost btn-sm">
              <RotateCcw className="h-4 w-4" aria-hidden />
              Reset
            </button>
          ) : null}
          {typeof resultCount === "number" ? (
            <p className="text-xs text-slate-body sm:ml-auto">
              <span className="font-bold text-navy">{resultCount}</span> matching
            </p>
          ) : null}
        </div>

        {open ? (
          <div className="grid gap-3 border-t border-line pt-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="f-status" className="label">
                Status
              </label>
              <select id="f-status" className={selectClass} value={value("status")} onChange={(event) => set("status", event.target.value)}>
                <option value="">All statuses</option>
                {statuses.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="f-course" className="label">
                Interested course
              </label>
              <select id="f-course" className={selectClass} value={value("course")} onChange={(event) => set("course", event.target.value)}>
                <option value="">All courses</option>
                {courses.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="f-counsellor" className="label">
                Counsellor
              </label>
              <select
                id="f-counsellor"
                className={selectClass}
                value={value("counsellor")}
                onChange={(event) => set("counsellor", event.target.value)}
              >
                <option value="">All counsellors</option>
                {counsellors.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="f-source" className="label">
                Source
              </label>
              <select id="f-source" className={selectClass} value={value("source")} onChange={(event) => set("source", event.target.value)}>
                <option value="">All sources</option>
                {sources.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="f-priority" className="label">
                Priority
              </label>
              <select id="f-priority" className={selectClass} value={value("priority")} onChange={(event) => set("priority", event.target.value)}>
                <option value="">Any priority</option>
                {["urgent", "high", "medium", "low"].map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="f-from" className="label">
                Created from
              </label>
              <input id="f-from" type="date" name="from" defaultValue={value("from")} className={selectClass} />
            </div>
            <div>
              <label htmlFor="f-to" className="label">
                Created until
              </label>
              <input id="f-to" type="date" name="to" defaultValue={value("to")} className={selectClass} />
            </div>
            <div className="flex items-end sm:col-span-2">
              <button type="submit" className="btn btn-navy btn-sm w-full">
                Apply date filters
              </button>
            </div>
          </div>
        ) : null}
      </form>
    </div>
  );
}
