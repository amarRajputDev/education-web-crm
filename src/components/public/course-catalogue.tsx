"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { CourseCard, type CourseCardData } from "@/components/public/course-card";
import { EmptyState } from "@/components/ui/feedback";
import { cn } from "@/lib/cn";

export type FilterableCourse = CourseCardData & {
  study_mode: string;
  duration_label: string;
  duration_months: number;
  department_name?: string | null;
};

export function CourseCatalogue({
  courses,
  departments,
}: {
  courses: FilterableCourse[];
  departments: { id: number; name: string }[];
}) {
  const [query, setQuery] = useState("");
  const [degree, setDegree] = useState("All");
  const [department, setDepartment] = useState("All");
  const [mode, setMode] = useState("All");
  const [duration, setDuration] = useState("All");
  const [visible, setVisible] = useState(6);

  const degreeLevels = useMemo(
    () => ["All", ...Array.from(new Set(courses.map((course) => course.degree_level)))],
    [courses],
  );
  const modes = useMemo(() => ["All", ...Array.from(new Set(courses.map((course) => course.study_mode)))], [courses]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return courses.filter((course) => {
      if (degree !== "All" && course.degree_level !== degree) return false;
      if (department !== "All" && course.department_name !== department) return false;
      if (mode !== "All" && course.study_mode !== mode) return false;
      if (duration === "short" && course.duration_months > 24) return false;
      if (duration === "medium" && (course.duration_months <= 24 || course.duration_months > 36)) return false;
      if (duration === "long" && course.duration_months <= 36) return false;
      if (needle) {
        const haystack = `${course.name} ${course.overview} ${course.department_name ?? ""} ${course.eligibility}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }, [courses, query, degree, department, mode, duration]);

  const activeFilters = [degree, department, mode, duration].filter((value) => value !== "All").length + (query ? 1 : 0);

  const reset = () => {
    setQuery("");
    setDegree("All");
    setDepartment("All");
    setMode("All");
    setDuration("All");
    setVisible(6);
  };

  const chip = (active: boolean) =>
    cn(
      "rounded-full border px-3.5 py-1.5 text-xs font-bold transition",
      active
        ? "border-navy bg-navy text-white"
        : "border-line-strong bg-paper text-slate-body hover:border-royal hover:text-royal",
    );

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr] lg:items-start">
      {/* filters */}
      <aside className="lg:sticky lg:top-32">
        <div className="rounded-3xl border border-line bg-paper p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-navy">
              <SlidersHorizontal className="h-4 w-4 text-royal" aria-hidden />
              Filters
            </p>
            {activeFilters > 0 ? (
              <button type="button" onClick={reset} className="flex items-center gap-1 text-xs font-bold text-danger hover:underline">
                <X className="h-3.5 w-3.5" aria-hidden />
                Clear ({activeFilters})
              </button>
            ) : null}
          </div>

          <div className="relative mt-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-body" aria-hidden />
            <label htmlFor="course-search" className="sr-only">
              Search programmes
            </label>
            <input
              id="course-search"
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setVisible(6);
              }}
              placeholder="Search programmes…"
              className="field !pl-9"
            />
          </div>

          <div className="mt-5">
            <p className="label">Degree level</p>
            <div className="flex flex-wrap gap-2">
              {degreeLevels.map((level) => (
                <button key={level} type="button" onClick={() => setDegree(level)} className={chip(degree === level)}>
                  {level === "All" ? "All levels" : level}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <label htmlFor="filter-department" className="label">
              Department
            </label>
            <select
              id="filter-department"
              className="field"
              value={department === "All" ? "All" : department}
              onChange={(event) => setDepartment(event.target.value)}
            >
              <option value="All">All departments</option>
              {departments.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-5">
            <p className="label">Study mode</p>
            <div className="flex flex-wrap gap-2">
              {modes.map((value) => (
                <button key={value} type="button" onClick={() => setMode(value)} className={chip(mode === value)}>
                  {value === "All" ? "Any mode" : value}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <p className="label">Duration</p>
            <div className="flex flex-wrap gap-2">
              {[
                { key: "All", label: "Any" },
                { key: "short", label: "≤ 2 years" },
                { key: "medium", label: "3 years" },
                { key: "long", label: "4 years" },
              ].map((option) => (
                <button key={option.key} type="button" onClick={() => setDuration(option.key)} className={chip(duration === option.key)}>
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* results */}
      <div>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-body">
            <span className="font-bold text-navy">{filtered.length}</span> programme
            {filtered.length === 1 ? "" : "s"} found
          </p>
          <p className="hidden text-xs text-slate-body sm:block">Showing published programmes only</p>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon="search"
            title="No programmes match these filters"
            description="Try a different keyword, or clear the filters to see every published programme."
            action={
              <button type="button" className="btn btn-primary btn-sm" onClick={reset}>
                Clear all filters
              </button>
            }
          />
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2">
              {filtered.slice(0, visible).map((course) => (
                <CourseCard key={course.id} course={course} sourcePage="/courses" />
              ))}
            </div>
            {visible < filtered.length ? (
              <div className="mt-8 flex justify-center">
                <button type="button" className="btn btn-outline" onClick={() => setVisible((value) => value + 6)}>
                  Load more programmes ({filtered.length - visible} remaining)
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
