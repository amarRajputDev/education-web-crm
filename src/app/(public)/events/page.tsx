import Link from "next/link";
import { ArrowRight, CalendarDays, Info, MapPin, Phone } from "lucide-react";
import { getPublishedEvents } from "@/lib/content";
import { formatDateTime, formatDate, isBeforeNow } from "@/lib/format";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { PageHeader, SectionHeading } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { EmptyState } from "@/components/ui/feedback";
import { EventFilter } from "@/components/public/event-filter";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Events Calendar",
  description:
    "Upcoming workshops, seminars, open houses, cultural festivals and sports meets at Aarohan Institute of Higher Education, Greater Noida.",
};

function parseDate(value: string): Date {
  return new Date(value.includes("T") ? value : value.replace(" ", "T") + "Z");
}

export default function EventsPage() {
  const events = getPublishedEvents(60);
  const upcoming = events.filter((event) => !isBeforeNow(event.starts_at));
  const past = events
    .filter((event) => isBeforeNow(event.starts_at))
    .slice()
    .reverse();
  const categories = Array.from(new Set(events.map((event) => event.category)));

  return (
    <>
      <PageHeader
        eyebrow="Events Calendar"
        title="What's happening on campus"
        description="Open houses, workshops, seminars, cultural festivals and sports meets — the institute's public calendar, updated from the admin panel."
        breadcrumbs={<Breadcrumbs items={[{ label: "Events" }]} />}
        meta={[
          { label: "Upcoming", value: String(upcoming.length) },
          { label: "Categories", value: String(categories.length) },
          { label: "Next date", value: upcoming[0] ? formatDate(upcoming[0].starts_at, "—") : "TBA" },
        ]}
      >
        <Link href="/contact?subject=Event" className="btn btn-gold">
          <Phone className="h-4 w-4" aria-hidden />
          Registration queries
        </Link>
        <Link
          href="/news"
          className="btn btn-outline !border-white/25 !text-white hover:!border-gold hover:!bg-white/10 hover:!text-gold"
        >
          News &amp; notices
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </PageHeader>

      {/* upcoming */}
      <section className="container-page py-16 md:py-24">
        <SectionHeading
          index="01"
          eyebrow="Upcoming"
          title="Dates to circle on your calendar"
          description="All timings are indicative and may be revised — confirm details with the events desk before you travel."
        />
        {upcoming.length === 0 ? (
          <EmptyState
            icon="calendar"
            title="No upcoming events published"
            description="The events desk is preparing the next calendar. Check the news page for announcements, or contact the institute for campus visits."
            action={
              <Link href="/news" className="btn btn-primary btn-sm">
                Browse news &amp; notices
              </Link>
            }
          />
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2">
            {upcoming.map((event, index) => {
              const start = parseDate(event.starts_at);
              return (
                <Reveal key={event.id} delay={Math.min(index, 8) * 60}>
                  <li className="h-full">
                    <Link
                      href={`/events/${event.slug}`}
                      className="group flex h-full items-start gap-4 rounded-3xl border border-line bg-paper p-5 transition hover:border-gold/60 hover:shadow-[var(--shadow-card)]"
                    >
                      <span className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-navy text-white">
                        <span className="font-display text-2xl font-semibold leading-none">
                          {start.getDate()}
                        </span>
                        <span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gold">
                          {start.toLocaleString("en", { month: "short" })}
                        </span>
                      </span>
                      <div className="min-w-0 flex-1">
                        <Badge tone="gold" className="bg-white">
                          {event.category}
                        </Badge>
                        <h3 className="mt-2 text-base font-bold leading-snug text-navy transition group-hover:text-royal">
                          {event.title}
                        </h3>
                        <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-body">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden />
                            {formatDateTime(event.starts_at)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                            {event.location}
                          </span>
                        </p>
                        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-body">
                          {event.summary}
                        </p>
                      </div>
                    </Link>
                  </li>
                </Reveal>
              );
            })}
          </ul>
        )}
      </section>

      {/* full calendar with filters */}
      <section className="border-y border-line bg-paper py-16 md:py-24">
        <div className="container-page">
          <SectionHeading
            index="02"
            eyebrow="Browse"
            title="Search the full calendar"
            description="Filter by category or search by title and venue. Sample event listings prepared for this demonstration website."
          />
          <EventFilter events={events} />
          <p className="mt-8 flex items-start gap-2.5 rounded-2xl border border-line bg-offwhite/60 px-5 py-4 text-xs leading-relaxed text-slate-body">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-royal" aria-hidden />
            This calendar is maintained by the events desk from the institute admin panel. Dates, venues and
            registration links are subject to revision — for confirmation, call the helpline on +91 98200 41127.
          </p>
        </div>
      </section>

      {/* past */}
      <section className="container-page py-16 md:py-24">
        <SectionHeading
          index="03"
          eyebrow="Recently held"
          title="Past events"
          description="A record of events that have already taken place on campus."
        />
        {past.length === 0 ? (
          <EmptyState
            icon="calendar"
            title="No past events in the archive yet"
            description="Once events conclude, they are archived here with photos and recaps. The current calendar is entirely in the future."
            compact
          />
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-3xl border border-line bg-paper">
            {past.map((event) => (
              <li key={event.id}>
                <Link
                  href={`/events/${event.slug}`}
                  className="group flex items-center gap-4 px-5 py-4 transition hover:bg-offwhite/70"
                >
                  <time
                    dateTime={event.starts_at}
                    className="w-24 shrink-0 font-display text-xs font-semibold text-gold-700"
                  >
                    {formatDate(event.starts_at)}
                  </time>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-navy transition group-hover:text-royal">
                      {event.title}
                    </p>
                    <p className="truncate text-xs text-slate-body">{event.location}</p>
                  </div>
                  <Badge tone="neutral" className="hidden sm:inline-flex">
                    {event.category}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-14 flex flex-col items-start gap-5 rounded-[2rem] border border-line bg-navy px-7 py-9 text-white sm:px-10 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="flex items-center gap-3 text-[0.7rem] font-extrabold uppercase tracking-[0.24em] text-gold">
              <Phone className="h-3.5 w-3.5" aria-hidden />
              Attend an event
            </p>
            <h2 className="mt-3 text-[clamp(1.4rem,2.6vw,1.9rem)] leading-tight text-white">
              Questions about registration or visitor entry?
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/65">
              The counselling desk can confirm seats, accessibility arrangements and campus visit norms for any
              public event.
            </p>
          </div>
          <Link href="/contact?subject=Event" className="btn btn-gold shrink-0">
            Contact the events desk
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>
    </>
  );
}
