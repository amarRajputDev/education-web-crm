import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarDays, Clock, User } from "lucide-react";
import { getDb } from "@/lib/db";
import { paragraphs } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/ui/reveal";
import { PrintButton, ShareButton } from "@/components/public/print-button";

export const dynamic = "force-dynamic";

type NewsRow = {
  id: number;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  body: string;
  cover_image: string;
  author: string;
  published_at: string;
};

type RelatedRow = {
  id: number;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  cover_image: string;
  published_at: string;
};

const CATEGORY_TONES: Record<string, "info" | "warning" | "gold" | "neutral"> = {
  News: "info",
  Notice: "warning",
  Achievement: "gold",
  Announcement: "neutral",
};

function getPost(slug: string): NewsRow | null {
  const row = getDb()
    .prepare(
      `SELECT id, title, slug, category, excerpt, body, cover_image, author, published_at
         FROM news_posts
        WHERE slug = ? AND status = 'published'`,
    )
    .get(slug) as NewsRow | undefined;
  return row ?? null;
}

function getRelated(post: NewsRow): RelatedRow[] {
  return getDb()
    .prepare(
      `SELECT id, title, slug, category, excerpt, cover_image, published_at
         FROM news_posts
        WHERE status = 'published' AND category = ? AND id != ?
        ORDER BY published_at DESC
        LIMIT 3`,
    )
    .all(post.category, post.id) as RelatedRow[];
}

function readingTimeMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Article not found" };
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.published_at,
      images: post.cover_image ? [{ url: post.cover_image, alt: post.title }] : undefined,
    },
  };
}

export default async function NewsArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const related = getRelated(post);
  const bodyParagraphs = paragraphs(post.body);
  const minutes = readingTimeMinutes(post.body);

  return (
    <>
      <header className="relative isolate overflow-hidden bg-navy text-white">
        <div className="absolute inset-0 grid-lines-light opacity-60" aria-hidden />
        <div
          className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full bg-royal/40 blur-3xl"
          aria-hidden
        />
        <div className="container-page relative py-10 md:py-14">
          <Breadcrumbs
            items={[{ label: "News", href: "/news" }, { label: post.title }]}
            className="[&_a]:text-white/65 [&_span]:text-white/65"
          />
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Badge tone={CATEGORY_TONES[post.category] ?? "neutral"}>{post.category}</Badge>
            <time
              dateTime={post.published_at}
              className="text-[11px] font-semibold uppercase tracking-wider text-white/55"
            >
              {formatDate(post.published_at)}
            </time>
          </div>
          <h1 className="mt-4 max-w-4xl text-[clamp(2rem,4.6vw,3.4rem)] leading-[1.04] text-white">
            {post.title}
          </h1>
          <ul className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-3 border-t border-white/10 pt-6 text-sm text-white/70">
            <li className="flex items-center gap-2">
              <User className="h-4 w-4 text-gold" aria-hidden />
              {post.author}
            </li>
            <li className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-gold" aria-hidden />
              {formatDate(post.published_at)}
            </li>
            <li className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gold" aria-hidden />
              {minutes} min read
            </li>
          </ul>
        </div>
        <div className="h-1 w-full bg-gradient-to-r from-gold via-royal to-transparent" aria-hidden />
      </header>

      <article className="container-page py-12 md:py-16">
        <div className="mx-auto max-w-3xl">
          <figure className="overflow-hidden rounded-3xl border border-line bg-paper shadow-[var(--shadow-card)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.cover_image}
              alt={post.title}
              loading="lazy"
              className="aspect-[16/9] w-full"
            />
            <figcaption className="border-t border-line px-5 py-3 text-xs leading-relaxed text-slate-body">
              {post.title} — photographed on the Aarohan Institute campus.
            </figcaption>
          </figure>

          {post.excerpt ? (
            <p className="mt-9 font-display text-xl italic leading-relaxed text-navy md:text-2xl">
              {post.excerpt}
            </p>
          ) : null}

          <div className="prose-univ mt-7">
            {bodyParagraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          <p className="mt-10 rounded-2xl border border-dashed border-gold/70 bg-gold-100/40 px-5 py-4 text-xs leading-relaxed text-slate-body">
            <span className="font-bold text-gold-700">Demo content — </span>
            this article is fictional sample copy prepared for the Aarohan Institute demonstration website. Names,
            figures and dates are illustrative only.
          </p>

          <div className="no-print mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
            <Link href="/news" className="btn btn-ghost btn-sm">
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Back to news
            </Link>
            <div className="flex flex-wrap gap-2">
              <ShareButton title={post.title} text={post.excerpt} />
              <PrintButton />
            </div>
          </div>
        </div>
      </article>

      {related.length > 0 ? (
        <section className="border-y border-line bg-paper py-14 md:py-20">
          <div className="container-page">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="mb-4 flex items-center gap-4" aria-hidden>
                  <span className="section-index">02</span>
                  <span className="h-px w-16 bg-line-strong" />
                  <span className="font-ui text-[0.7rem] font-extrabold uppercase tracking-[0.24em] text-royal">
                    Related articles
                  </span>
                </div>
                <h2 className="text-[clamp(1.6rem,3vw,2.2rem)] leading-tight text-navy">
                  More from {post.category.toLowerCase()}
                </h2>
              </div>
              <Link href="/news" className="link-sweep text-sm font-bold text-navy">
                All news &amp; notices →
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item, index) => (
                <Reveal key={item.id} delay={index * 70}>
                  <article className="card group relative flex h-full flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-pop)]">
                    <div className="relative aspect-[16/10] overflow-hidden bg-offwhite">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.cover_image}
                        alt={item.title}
                        loading="lazy"
                        className="h-full w-full transition duration-700 group-hover:scale-105"
                      />
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex flex-wrap items-center gap-3">
                        <Badge tone={CATEGORY_TONES[item.category] ?? "neutral"}>{item.category}</Badge>
                        <time
                          dateTime={item.published_at}
                          className="text-[11px] font-semibold uppercase tracking-wide text-slate-body"
                        >
                          {formatDate(item.published_at)}
                        </time>
                      </div>
                      <h3 className="mt-2.5 font-display text-lg font-semibold leading-snug text-navy transition group-hover:text-royal">
                        <Link href={`/news/${item.slug}`}>
                          <span className="absolute inset-0" aria-hidden />
                          {item.title}
                        </Link>
                      </h3>
                      <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-body">
                        {item.excerpt}
                      </p>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* final CTA */}
      <section className="bg-navy py-16 text-white md:py-20">
        <div className="container-page flex flex-col items-center gap-6 text-center">
          <span className="section-index">— Admissions —</span>
          <h2 className="max-w-3xl text-[clamp(1.7rem,3.6vw,2.6rem)] leading-[1.08] text-white">
            Inspired by the story? Start <span className="italic text-gold">yours</span> here.
          </h2>
          <p className="max-w-xl text-sm leading-relaxed text-white/65 md:text-base">
            Applications for the 2027–28 session are open across all six schools. Begin your application online —
            it takes about ten minutes.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/admissions/apply" className="btn btn-gold">
              Apply for Admission
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href="/contact"
              className="btn btn-outline !border-white/25 !text-white hover:!border-gold hover:!bg-white/10 hover:!text-gold"
            >
              Talk to admissions
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
