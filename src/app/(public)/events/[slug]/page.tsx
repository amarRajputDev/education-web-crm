import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock,
  ExternalLink,
  MapPin,
  User,
} from "lucide-react";
import { getDb } from "@/lib/db";
import { paragraphs } from "@/lib/content";
import { formatDate, isBeforeNow } from "@/lib/format";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/ui/reveal";

export const dynamic = "force-dynamic";

type EventRow = {
  id: number;
  title: string;
  slug: string;
  category: string;
  summary: string;
  body: string;
  location: string;
  starts_at: string;
  ends_at: string | null;
  image: string;
  registration_url: string;
};

type RelatedEvent = {
  id: number;
  title: string;
  slug: string;
  category: string;
  summary: string;
  location: string;
  starts_at: string;
};

const ORGANISERS: Record<string, string> = {
  Academic: "Office of Academic Affairs",
  Workshop: "Industry Interface Cell",
  Seminar: "Research & Postgraduate Studies",
  Cultural: "Student Council — Cultural Committee",
  Sports: "Student Welfare Committee",
  Admission: "Admissions Counselling Desk",
  Other: "Student Affairs Office",
};

function parseDate(value: string): Date {
  return new Date(value.includes("T") ? value : value.replace(" ", "T") + "Z");
}

function formatTimeOnly(value: string): string {
  return parseDate(value).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function getEvent(slug: string): EventRow | null {
  const row = getDb()
    .prepare(
      `SELECT id, title, slug, category, summary, body, location, starts_at, ends_at, image, registration_url
         FROM events
        WHERE slug = ? AND status = 'published'`,
    )
    .get(slug) as EventRow | undefined;
  return row ?? null;
}

function getRelated(event: EventRow): RelatedEvent[] {
  const db = getDb();
  const select = `SELECT id, title, slug, category, summary, location, starts_at FROM events`;
  const sameCategory = db
    .prepare(
      `${select} WHERE status = 'published' AND category = ? AND id != ?
        ORDER BY starts_at ASC LIMIT 3`,
    )
    .all(event.category, event.id) as RelatedEvent[];
  if (sameCategory.length >= 2) return sameCategory.slice(0, 3);
  const seen = new Set(sameCategory.map((item) => item.id));
  const filler = (db
    .prepare(
      `${select} WHERE status = 'published' AND id != ?
        ORDER BY starts_at ASC LIMIT 4`,
    )
    .all(event.id) as RelatedEvent[]).filter((item) => !seen.has(item.id) && item.id !== event.id);
  return [...sameCategory, ...filler].slice(0, 3);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = getEvent(slug);
  if (!event) return { title: "Event not found" };
  return {
    title: event.title,
    description: event.summary,
    openGraph: {
      title: event.title,
      description: event.summary,
      type: "website",
      images: event.image ? [{ url: event.image, alt: event.title }] : undefined,
    },
  };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = getEvent(slug);
  if (!event) notFound();

  const related = getRelated(event);
  const bodyParagraphs = paragraphs(event.body);
  const start = parseDate(event.starts_at);
  const organiser = ORGANISERS[event.category] ?? "Student Affairs Office";
  const isPast = isBeforeNow(event.starts_at);

  return (
    <>
      <PageHero event={event} organiser={organiser} isPast={isPast} />

      <section className="container-page py-12 md:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.35fr_1fr] lg:items-start">
          {/* main content */}
          <div>
            <figure className="overflow-hidden rounded-3xl border border-line shadow-[var(--shadow-card)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={event.image || "/images/seminar.jpg"}
                alt={`${event.title} at Aarohan Institute`}
                loading="lazy"
                className="aspect-[16/9] w-full"
              />
            </figure>

            {event.summary ? (
              <p className="mt-8 font-display text-xl italic leading-relaxed text-navy md:text-2xl">
                {event.summary}
              </p>
            ) : null}

            <div className="prose-univ mt-6">
              {bodyParagraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>

            <div className="no-print mt-10 border-t border-line pt-6">
              <Link href="/events" className="btn btn-ghost btn-sm">
                <ArrowLeft className="h-4 w-4" aria-hidden />
                Back to all events
              </Link>
            </div>
          </div>

          {/* details + registration */}
          <aside className="lg:sticky lg:top-32">
            <div className="rounded-3xl border border-line bg-paper p-6 shadow-[var(--shadow-card)]">
              <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.2em] text-royal">Event details</p>
              <dl className="mt-5 space-y-4">
                <div className="flex gap-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-navy text-gold">
                    <CalendarDays className="h-4.5 w-4.5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-body">Date</dt>
                    <dd className="mt-0.5 text-sm font-semibold leading-snug text-navy">
                      {formatDate(event.starts_at)}
                      {event.ends_at ? ` – ${formatDate(event.ends_at)}` : ""}
                    </dd>
                  </div>
                </div>
                <div className="flex gap-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-navy text-gold">
                    <Clock className="h-4.5 w-4.5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-body">Time</dt>
                    <dd className="mt-0.5 text-sm font-semibold leading-snug text-navy">
                      {formatTimeOnly(event.starts_at)}
                      {event.ends_at ? ` – ${formatTimeOnly(event.ends_at)}` : " onwards"}
                    </dd>
                  </div>
                </div>
                <div className="flex gap-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-navy text-gold">
                    <MapPin className="h-4.5 w-4.5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-body">Venue</dt>
                    <dd className="mt-0.5 text-sm font-semibold leading-snug text-navy">
                      {event.location || "To be announced"}
                      <span className="block font-normal text-slate-body">
                        Aarohan Institute of Higher Education, Greater Noida
                      </span>
                    </dd>
                  </div>
                </div>
                <div className="flex gap-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-navy text-gold">
                    <User className="h-4.5 w-4.5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-body">Organised by</dt>
                    <dd className="mt-0.5 text-sm font-semibold leading-snug text-navy">{organiser}</dd>
                  </div>
                </div>
              </dl>
            </div>

            {/* registration panel */}
            <div className="mt-5 rounded-3xl border border-gold/50 bg-gold-100/50 p-6">
              <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.2em] text-gold-700">
                Registration
              </p>
              {event.registration_url ? (
                <>
                  <p className="mt-3 text-sm leading-relaxed text-slate-body">
                    Seats are limited. Complete your registration on the external portal — you will receive a
                    confirmation e-mail from the events desk.
                  </p>
                  <a
                    href={event.registration_url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="btn btn-gold mt-5 w-full"
                  >
                    Register now
                    <ExternalLink className="h-4 w-4" aria-hidden />
                  </a>
                </>
              ) : (
                <>
                  <p className="mt-3 text-sm leading-relaxed text-slate-body">
                    Online registration for this event has not opened yet. Leave your interest with the counselling
                    desk and we will notify you when seats are released.
                  </p>
                  <button type="button" className="btn btn-outline mt-5 w-full" disabled>
                    Registration opens soon
                  </button>
                  <Link
                    href="/contact?subject=Event"
                    className="mt-3 inline-block text-sm font-bold text-royal hover:underline"
                  >
                    Ask about this event →
                  </Link>
                </>
              )}
              <p className="mt-4 border-t border-gold/40 pt-3 text-[11px] leading-relaxed text-slate-body">
                Helpline +91 98200 41127 · Visitor entry closes 15 minutes after start time.
              </p>
            </div>
          </aside>
        </div>
      </section>

      {/* related */}
      {related.length > 0 ? (
        <section className="border-t border-line bg-paper py-14 md:py-20">
          <div className="container-page">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="mb-4 flex items-center gap-4" aria-hidden>
                  <span className="section-index">02</span>
                  <span className="h-px w-16 bg-line-strong" />
                  <span className="font-ui text-[0.7rem] font-extrabold uppercase tracking-[0.24em] text-royal">
                    Keep exploring
                  </span>
                </div>
                <h2 className="text-[clamp(1.6rem,3vw,2.2rem)] leading-tight text-navy">Related events</h2>
              </div>
              <Link href="/events" className="link-sweep text-sm font-bold text-navy">
                Full calendar →
              </Link>
            </div>
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item, index) => {
                const itemStart = parseDate(item.starts_at);
                return (
                  <Reveal key={item.id} delay={index * 70}>
                    <li className="h-full">
                      <Link
                        href={`/events/${item.slug}`}
                        className="group flex h-full items-start gap-4 rounded-3xl border border-line bg-offwhite/60 p-4 transition hover:border-gold/60 hover:bg-paper hover:shadow-[var(--shadow-card)]"
                      >
                        <span className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-navy text-white">
                          <span className="font-display text-xl font-semibold leading-none">
                            {itemStart.getDate()}
                          </span>
                          <span className="mt-1 text-[9px] font-bold uppercase tracking-widest text-gold">
                            {itemStart.toLocaleString("en", { month: "short" })}
                          </span>
                        </span>
                        <div className="min-w-0">
                          <Badge tone="gold" className="bg-white">
                            {item.category}
                          </Badge>
                          <h3 className="mt-2 text-sm font-bold leading-snug text-navy transition group-hover:text-royal">
                            {item.title}
                          </h3>
                          <p className="mt-1 flex items-center gap-1 text-xs text-slate-body">
                            <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                            <span className="truncate">{item.location}</span>
                          </p>
                          <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-body">
                            {formatDate(item.starts_at)}
                          </p>
                        </div>
                      </Link>
                    </li>
                  </Reveal>
                );
              })}
            </ul>
          </div>
        </section>
      ) : null}

      {/* final CTA */}
      <section className="bg-navy py-14 text-white md:py-16">
        <div className="container-page flex flex-col items-start gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-[clamp(1.4rem,2.8vw,2rem)] leading-tight text-white">
              Planning to visit campus?
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/65">
              Club your event visit with a guided campus tour, or speak to the team about the 2027–28 admission
              cycle.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/admissions/apply" className="btn btn-gold">
              Apply for Admission
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href="/contact?subject=Event"
              className="btn btn-outline !border-white/25 !text-white hover:!border-gold hover:!bg-white/10 hover:!text-gold"
            >
              Contact us
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function PageHero({
  event,
  organiser,
  isPast,
}: {
  event: EventRow;
  organiser: string;
  isPast: boolean;
}) {
  return (
    <header className="relative isolate overflow-hidden bg-navy text-white">
      <div className="absolute inset-0 grid-lines-light opacity-60" aria-hidden />
      <div
        className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full bg-royal/40 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-40 left-[8%] h-72 w-72 rounded-full bg-gold/15 blur-3xl"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute -bottom-16 right-4 select-none font-display text-[clamp(7rem,20vw,16rem)] leading-none text-white/[0.045] md:right-10"
        aria-hidden
      >
        {event.title.trim().slice(0, 1).toUpperCase()}
      </span>

      <div className="container-page relative py-10 md:py-14">
        <Breadcrumbs
          items={[{ label: "Events", href: "/events" }, { label: event.title }]}
          className="[&_a]:text-white/65 [&_span]:text-white/65"
        />
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Badge tone="gold" className="bg-white/10 !text-gold !border-white/20">
            {event.category}
          </Badge>
          {isPast ? (
            <span className="text-[11px] font-semibold uppercase tracking-wider text-white/55">Held recently</span>
          ) : null}
        </div>
        <h1 className="mt-4 max-w-4xl text-[clamp(2.1rem,5vw,3.5rem)] leading-[1.03] text-white">
          {event.title}
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/70">{event.summary}</p>
        <p className="mt-7 border-t border-white/10 pt-5 text-sm text-white/60">
          Organised by <span className="font-semibold text-white/85">{organiser}</span>
        </p>
      </div>
      <div className="h-1 w-full bg-gradient-to-r from-gold via-royal to-transparent" aria-hidden />
    </header>
  );
}
