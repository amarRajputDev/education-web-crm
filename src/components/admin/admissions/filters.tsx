"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Filter, RotateCcw, Search } from "lucide-react";
import { cn } from "@/lib/cn";

const KEYS = ["status", "course", "reviewer", "doc"] as const;

export function AdmissionsFilters({
  courses,
  reviewers,
  statuses,
  resultCount,
}: {
  courses: { value: string; label: string }[];
  reviewers: { value: string; label: string }[];
  statuses: { value: string; label: string }[];
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

  const reset = () => router.push(pathname);

  const activeCount = ["q", ...KEYS, "from", "to"].filter((key) => value(key)).length;
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <label htmlFor="application-search" className="sr-only">
              Search applications
            </label>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-body" aria-hidden />
            <input
              id="application-search"
              name="q"
              type="search"
              defaultValue={value("q")}
              placeholder="Search applicant name, application ID, email or phone…"
              className="field !pl-9 !text-[13px]"
            />
          </div>
          <button type="submit" className="btn btn-primary btn-sm">
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
              <label htmlFor="af-status" className="label">
                Application status
              </label>
              <select id="af-status" className={selectClass} value={value("status")} onChange={(event) => set("status", event.target.value)}>
                <option value="">All statuses</option>
                {statuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="af-course" className="label">
                Course
              </label>
              <select id="af-course" className={selectClass} value={value("course")} onChange={(event) => set("course", event.target.value)}>
                <option value="">All courses</option>
                {courses.map((course) => (
                  <option key={course.value} value={course.value}>
                    {course.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="af-reviewer" className="label">
                Reviewer
              </label>
              <select
                id="af-reviewer"
                className={selectClass}
                value={value("reviewer")}
                onChange={(event) => set("reviewer", event.target.value)}
              >
                <option value="">All reviewers</option>
                <option value="none">Unassigned only</option>
                {reviewers.map((reviewer) => (
                  <option key={reviewer.value} value={reviewer.value}>
                    {reviewer.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="af-doc" className="label">
                Documents
              </label>
              <select id="af-doc" className={selectClass} value={value("doc")} onChange={(event) => set("doc", event.target.value)}>
                <option value="">Any document state</option>
                <option value="pending">Pending</option>
                <option value="partial">Partial</option>
                <option value="complete">Complete</option>
                <option value="verified">Verified</option>
              </select>
            </div>
            <div>
              <label htmlFor="af-from" className="label">
                Submitted from
              </label>
              <input id="af-from" type="date" name="from" defaultValue={value("from")} className={selectClass} />
            </div>
            <div>
              <label htmlFor="af-to" className="label">
                Submitted until
              </label>
              <input id="af-to" type="date" name="to" defaultValue={value("to")} className={selectClass} />
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
