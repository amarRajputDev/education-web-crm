import Link from "next/link";
import { ArrowRight, BellRing, CalendarDays, Newspaper } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { PageHeader, SectionHeading } from "@/components/ui/section";
import { NewsFilter } from "@/components/public/news-filter";
import { getPublishedNews } from "@/lib/content";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "News & Notices",
  description:
    "Announcements, academic notices, achievements and campus updates from Aarohan Institute of Higher Education, Greater Noida.",
};

export default function NewsPage() {
  const posts = getPublishedNews(60);
  const categories = Array.from(new Set(posts.map((post) => post.category)));
  const latest = posts[0]?.published_at ?? null;
  const notices = posts.filter((post) => post.category === "Notice").slice(0, 6);

  return (
    <>
      <PageHeader
        eyebrow="News & Notices"
        title="The institute, as it happens"
        description="Official announcements, academic notices, student achievements and campus updates — written by the editorial desk and maintained from the admin panel."
        breadcrumbs={<Breadcrumbs items={[{ label: "News" }]} />}
        meta={[
          { label: "Articles", value: String(posts.length) },
          { label: "Categories", value: String(categories.length) },
          { label: "Latest", value: formatDate(latest, "—") },
        ]}
      >
        <Link href="/events" className="btn btn-gold">
          <CalendarDays className="h-4 w-4" aria-hidden />
          Full events calendar
        </Link>
        <Link
          href="/contact"
          className="btn btn-outline !border-white/25 !text-white hover:!border-gold hover:!bg-white/10 hover:!text-gold"
        >
          Contact the institute
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </PageHeader>

      {/* notice board strip */}
      <section className="border-b border-line bg-paper" aria-label="Notice board">
        <div className="container-page py-8 md:py-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-2.5 text-[0.7rem] font-extrabold uppercase tracking-[0.24em] text-royal">
              <BellRing className="h-4 w-4 text-gold" aria-hidden />
              Notice board
            </p>
            <p className="text-xs text-slate-body">Circulars and deadlines for students &amp; parents</p>
          </div>

          {notices.length === 0 ? (
            <p className="mt-4 text-sm text-slate-body">
              No active notices at the moment — check back shortly, or call the helpline on +91 98200 41127.
            </p>
          ) : (
            <ul className="mt-4 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
              {notices.map((notice) => (
                <li key={notice.id} className="bg-offwhite/70">
                  <Link
                    href={`/news/${notice.slug}`}
                    className="group flex h-full items-start gap-3 px-4 py-3.5 transition hover:bg-paper"
                  >
                    <time
                      dateTime={notice.published_at}
                      className="mt-0.5 shrink-0 font-display text-xs font-semibold text-gold-700"
                    >
                      {formatDate(notice.published_at)}
                    </time>
                    <span className="line-clamp-2 text-sm font-semibold leading-snug text-navy transition group-hover:text-royal">
                      {notice.title}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* archive with filters */}
      <section className="container-page py-16 md:py-24">
        <SectionHeading
          index="01"
          eyebrow="From the editorial desk"
          title="Every published article"
          description="Filter by category or search by keyword. Sample editorial content prepared for this demonstration website."
        />
        <NewsFilter posts={posts} />
      </section>

      {/* CTA band */}
      <section className="border-t border-line bg-navy py-16 text-white md:py-20">
        <div className="container-page grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <p className="flex items-center gap-3 text-[0.7rem] font-extrabold uppercase tracking-[0.24em] text-gold">
              <Newspaper className="h-3.5 w-3.5" aria-hidden />
              Stay involved
            </p>
            <h2 className="mt-4 text-[clamp(1.6rem,3vw,2.3rem)] leading-tight text-white">
              Never miss a date on the campus calendar.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/65">
              Workshops, seminars, open houses and cultural festivals — browse the full calendar, or speak to the
              team about visiting campus for an event.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Link href="/events" className="btn btn-gold">
              <CalendarDays className="h-4 w-4" aria-hidden />
              Upcoming events
            </Link>
            <Link
              href="/contact"
              className="btn btn-outline !border-white/25 !text-white hover:!border-gold hover:!bg-white/10 hover:!text-gold"
            >
              Ask a question
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
