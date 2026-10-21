"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { Reveal } from "@/components/ui/reveal";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";

export type NewsPost = {
  id: number;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  cover_image: string;
  author: string;
  published_at: string;
};

const CATEGORY_TONES: Record<string, "info" | "warning" | "gold" | "neutral"> = {
  News: "info",
  Notice: "warning",
  Achievement: "gold",
  Announcement: "neutral",
};

export function NewsFilter({ posts }: { posts: NewsPost[] }) {
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(posts.map((post) => post.category)))],
    [posts],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return posts.filter((post) => {
      if (category !== "All" && post.category !== category) return false;
      if (needle) {
        const haystack = `${post.title} ${post.excerpt} ${post.author} ${post.category}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }, [posts, category, query]);

  const reset = () => {
    setCategory("All");
    setQuery("");
  };

  return (
    <div>
      <div className="flex flex-col gap-4 rounded-3xl border border-line bg-paper p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter articles by category">
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
          <label htmlFor="news-search" className="sr-only">
            Search articles
          </label>
          <input
            id="news-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search articles…"
            className="field !pl-9"
          />
        </div>
      </div>

      <p className="mt-6 text-sm text-slate-body">
        Showing <span className="font-bold text-navy">{filtered.length}</span> of {posts.length} article
        {posts.length === 1 ? "" : "s"}
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
            title="No articles match your search"
            description="Try a different keyword or category — or clear the filters to browse every published article."
            action={
              <button type="button" className="btn btn-primary btn-sm" onClick={reset}>
                Clear all filters
              </button>
            }
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((post, index) => (
            <Reveal key={post.id} delay={Math.min(index, 8) * 60}>
              <article className="card group relative flex h-full flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-pop)]">
                <div className="relative aspect-[16/10] overflow-hidden bg-offwhite">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.cover_image}
                    alt={post.title}
                    loading="lazy"
                    className="h-full w-full transition duration-700 group-hover:scale-105"
                  />
                  <Badge
                    tone={CATEGORY_TONES[post.category] ?? "neutral"}
                    className="absolute left-3 top-3 bg-white/95 !text-navy !border-transparent"
                  >
                    {post.category}
                  </Badge>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wide text-slate-body">
                    <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>
                    <span className="h-1 w-1 rounded-full bg-line-strong" aria-hidden />
                    <span className="truncate">{post.author}</span>
                  </p>
                  <h3 className="mt-2.5 font-display text-xl font-semibold leading-snug text-navy transition group-hover:text-royal">
                    <Link href={`/news/${post.slug}`}>
                      <span className="absolute inset-0" aria-hidden />
                      {post.title}
                    </Link>
                  </h3>
                  <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-body">
                    {post.excerpt}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-royal">
                    Read article
                    <span aria-hidden>→</span>
                  </span>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
