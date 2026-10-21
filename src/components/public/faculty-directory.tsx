"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { FacultyCard } from "@/components/public/faculty-card";
import { EmptyState } from "@/components/ui/feedback";
import { cn } from "@/lib/cn";

export type FacultyListItem = {
  id: number;
  name: string;
  slug: string;
  designation: string;
  photo: string;
  email: string;
  qualifications: string;
  research_interests: string;
  experience_years: number;
  department_name: string | null;
};

export function FacultyDirectory({
  members,
  departments,
}: {
  members: FacultyListItem[];
  departments: { id: number; name: string }[];
}) {
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("All");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return members.filter((member) => {
      if (department !== "All" && member.department_name !== department) return false;
      if (needle) {
        const interests = member.research_interests.replace(/[[\]"]/g, " ");
        const haystack = `${member.name} ${member.designation} ${member.qualifications} ${interests} ${member.department_name ?? ""}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }, [members, query, department]);

  const chip = (active: boolean) =>
    cn(
      "rounded-full border px-3.5 py-1.5 text-xs font-bold transition",
      active ? "border-navy bg-navy text-white" : "border-line-strong bg-paper text-slate-body hover:border-royal hover:text-royal",
    );

  return (
    <div>
      <div className="mb-8 rounded-3xl border border-line bg-paper p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="relative flex-1">
            <label htmlFor="faculty-search" className="label">
              Search faculty
            </label>
            <Search className="pointer-events-none absolute bottom-3.5 left-3 h-4 w-4 text-slate-body" aria-hidden />
            <input
              id="faculty-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Name, designation, qualification or research area…"
              className="field !pl-9"
            />
          </div>
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-navy">
            <SlidersHorizontal className="h-4 w-4 text-royal" aria-hidden />
            Department
            {department !== "All" || query ? (
              <button
                type="button"
                onClick={() => {
                  setDepartment("All");
                  setQuery("");
                }}
                className="ml-1 flex items-center gap-1 rounded-full border border-danger/40 bg-danger-100 px-2 py-1 text-[11px] normal-case tracking-normal text-danger hover:underline"
              >
                <X className="h-3 w-3" aria-hidden />
                Clear
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => setDepartment("All")} className={chip(department === "All")}>
            All departments
          </button>
          {departments.map((item) => (
            <button key={item.id} type="button" onClick={() => setDepartment(item.name)} className={chip(department === item.name)}>
              {item.name.replace("School of ", "")}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5 flex items-center justify-between gap-3 text-sm text-slate-body">
        <p>
          <span className="font-bold text-navy">{filtered.length}</span> faculty member{filtered.length === 1 ? "" : "s"} shown
        </p>
        <p className="hidden text-xs sm:block">Sample profiles — replace with real faculty data before launch</p>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="search"
          title="No faculty match your search"
          description="Try a different keyword or clear the department filter."
          action={
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                setDepartment("All");
                setQuery("");
              }}
            >
              Reset search
            </button>
          }
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((member) => (
            <FacultyCard
              key={member.id}
              member={{
                ...member,
                experience_years: member.experience_years,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
