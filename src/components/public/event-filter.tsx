"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarDays, MapPin, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { Reveal } from "@/components/ui/reveal";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/cn";

export type EventItem = {
  id: number;
  title: string;
  slug: string;
  category: string;
  summary: string;
  location: string;
  starts_at: string;
  ends_at: string | null;
  image?: string | null;
};

/** Mirrors the parsing used by the format helpers (ISO or SQLite datetime). */
function parseDate(value: string): Date {
  return new Date(value.includes("T") ? value : value.replace(" ", "T") + "Z");
}

export function EventFilter({ events }: { events: EventItem[] }) {
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(events.map((event) => event.category)))],
    [events],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return events.filter((event) => {
      if (category !== "All" && event.category !== category) return false;
      if (needle) {
        const haystack = `${event.title} ${event.location} ${event.summary}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }, [events, category, query]);

  const reset = () => {
    setCategory("All");
    setQuery("");
  };

  return (
    <div>
      <div className="flex flex-col gap-4 rounded-3xl border border-line bg-paper p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter events by category">
          {categories.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setCategory(value)}
              aria-pressed={category === value}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-bold transition",
                category === value
                  ? "border-navy bg-navy text-white"
                  : "border-line-strong bg-paper text-slate-body hover:border-royal hover:text-royal",
              )}
            >
              {value}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-72">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-body"
            aria-hidden
          />
          <label htmlFor="event-search" className="sr-only">
            Search events by title or location
          </label>
          <input
            id="event-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search title or venue…"
            className="field !pl-9"
          />
        </div>
      </div>

      <p className="mt-6 text-sm text-slate-body">
        Showing <span className="font-bold text-navy">{filtered.length}</span> of {events.length} event
        {events.length === 1 ? "" : "s"}
        {category !== "All" || query.trim() ? (
          <button type="button" onClick={reset} className="ml-3 font-bold text-royal hover:underline">
            Clear filters
          </button>
        ) : null}
      </p>

      {filtered.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon="search"
            title="No events match your search"
            description="Try a different keyword or category — or clear the filters to browse the full calendar."
            action={
              <button type="button" className="btn btn-primary btn-sm" onClick={reset}>
                Clear all filters
              </button>
            }
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((event, index) => {
            const start = parseDate(event.starts_at);
            return (
              <Reveal key={event.id} delay={Math.min(index, 8) * 60}>
                <article className="card group relative flex h-full flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-pop)]">
                  <div className="relative aspect-[16/9] overflow-hidden bg-offwhite">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={event.image ?? "/images/seminar.jpg"}
                      alt={event.title}
                      loading="lazy"
                      className="h-full w-full transition duration-700 group-hover:scale-105"
                    />
                    <div
                      className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-navy/70 to-transparent"
                      aria-hidden
                    />
                    <span className="absolute left-3 top-3 flex h-14 w-14 flex-col items-center justify-center rounded-2xl bg-navy text-white shadow-[var(--shadow-card)]">
                      <span className="font-display text-xl font-semibold leading-none">
                        {start.getDate()}
                      </span>
                      <span className="mt-1 text-[9px] font-bold uppercase tracking-widest text-gold">
                        {start.toLocaleString("en", { month: "short" })}
                      </span>
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <Badge tone="gold" className="self-start">
                      {event.category}
                    </Badge>
                    <h3 className="mt-2.5 font-display text-lg font-semibold leading-snug text-navy transition group-hover:text-royal">
                      <Link href={`/events/${event.slug}`}>
                        <span className="absolute inset-0" aria-hidden />
                        {event.title}
                      </Link>
                    </h3>
                    <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-slate-body">
                      {event.summary}
                    </p>
                    <ul className="mt-4 space-y-1.5 border-t border-line pt-3.5 text-xs text-slate-body">
                      <li className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5 shrink-0 text-royal" aria-hidden />
                        {formatDateTime(event.starts_at)}
                      </li>
                      <li className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-royal" aria-hidden />
                        <span className="truncate">{event.location}</span>
                      </li>
                    </ul>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-royal">
                      View details
                      <span aria-hidden>→</span>
                    </span>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      )}
    </div>
  );
}
