"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search, SearchX, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { EmptyState } from "@/components/ui/feedback";

export type FaqItem = {
  id: number;
  category: string;
  question: string;
  answer: string;
};

export function FaqAccordion({
  faqs,
  searchPlaceholder = "Search questions…",
  idPrefix = "faq",
}: {
  faqs: FaqItem[];
  searchPlaceholder?: string;
  idPrefix?: string;
}) {
  const categories = useMemo(() => {
    const seen: string[] = [];
    for (const faq of faqs) {
      if (!seen.includes(faq.category)) seen.push(faq.category);
    }
    return seen;
  }, [faqs]);

  const [active, setActive] = useState<string>("All");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<number | null>(faqs[0]?.id ?? null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return faqs.filter((faq) => {
      const inCategory = active === "All" || faq.category === active;
      const inSearch = !needle || faq.question.toLowerCase().includes(needle);
      return inCategory && inSearch;
    });
  }, [faqs, active, query]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const faq of faqs) map.set(faq.category, (map.get(faq.category) ?? 0) + 1);
    return map;
  }, [faqs]);

  const tabs = ["All", ...categories];
  const hasFilters = active !== "All" || query.trim().length > 0;

  if (faqs.length === 0) {
    return (
      <EmptyState
        title="No FAQs published yet"
        description="Frequently asked questions are added from the admin panel and will appear here once published."
        icon="empty"
      />
    );
  }

  return (
    <div>
      {/* search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-body" aria-hidden />
        <label htmlFor={`${idPrefix}-search`} className="sr-only">
          Search frequently asked questions
        </label>
        <input
          id={`${idPrefix}-search`}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={searchPlaceholder}
          className="field rounded-full pl-11 pr-10"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-body transition hover:bg-offwhite hover:text-navy"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </div>

      {/* category tabs */}
      <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Filter FAQs by category">
        {tabs.map((tab) => {
          const isActive = active === tab;
          const count = tab === "All" ? faqs.length : (counts.get(tab) ?? 0);
          return (
            <button
              key={tab}
              type="button"
              aria-pressed={isActive}
              onClick={() => setActive(tab)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold transition",
                isActive
                  ? "border-navy bg-navy text-white"
                  : "border-line-strong bg-paper text-slate-body hover:border-royal hover:text-royal",
              )}
            >
              {tab}
              <span
                className={cn(
                  "rounded-full px-1.5 text-[10px] font-extrabold",
                  isActive ? "bg-gold text-navy" : "bg-offwhite text-slate-body",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* results */}
      <div className="mt-7">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-body" aria-live="polite">
          {filtered.length} {filtered.length === 1 ? "question" : "questions"}
          {active !== "All" ? ` in ${active}` : ""}
          {query.trim() ? ` matching “${query.trim()}”` : ""}
        </p>

        {filtered.length === 0 ? (
          <EmptyState
            icon="search"
            title="No matching questions"
            description="Try a different word, browse another category, or ask us directly — the counselling desk replies within one working day."
            action={
              hasFilters ? (
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    setQuery("");
                    setActive("All");
                  }}
                >
                  Clear filters
                </button>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-hidden rounded-3xl border border-line bg-paper">
            {filtered.map((faq, index) => {
              const isOpen = openId === faq.id;
              const buttonId = `${idPrefix}-btn-${faq.id}`;
              const panelId = `${idPrefix}-panel-${faq.id}`;
              return (
                <div key={faq.id} className={cn("border-b border-line last:border-b-0", index === 0 && "bg-offwhite/50")}>
                  <h3 className="m-0">
                    <button
                      type="button"
                      id={buttonId}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => setOpenId(isOpen ? null : faq.id)}
                      className="flex w-full items-start justify-between gap-5 px-5 py-5 text-left transition hover:bg-offwhite/70 md:px-7"
                    >
                      <span className="flex items-start gap-3">
                        <span className="mt-0.5 font-display text-xs font-semibold text-gold-700">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="text-[15px] font-bold leading-snug text-navy">{faq.question}</span>
                      </span>
                      <span
                        className={cn(
                          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition",
                          isOpen ? "rotate-180 border-navy bg-navy text-white" : "border-line-strong bg-offwhite text-slate-body",
                        )}
                      >
                        <ChevronDown className="h-4 w-4" aria-hidden />
                      </span>
                    </button>
                  </h3>
                  {isOpen ? (
                    <div id={panelId} role="region" aria-labelledby={buttonId} className="px-5 pb-6 md:px-7">
                      <span className="mb-2 inline-block rounded-full border border-line bg-offwhite px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-royal">
                        {faq.category}
                      </span>
                      <p className="max-w-3xl text-sm leading-relaxed text-slate-body">{faq.answer}</p>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}

        {filtered.length > 0 && hasFilters ? (
          <button
            type="button"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-royal hover:underline"
            onClick={() => {
              setQuery("");
              setActive("All");
            }}
          >
            <SearchX className="h-3.5 w-3.5" aria-hidden />
            Reset filters
          </button>
        ) : null}
      </div>
    </div>
  );
}
