import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Cpu,
  Dumbbell,
  Flame,
  Headphones,
  Palette,
  PartyPopper,
  ShieldCheck,
  UtensilsCrossed,
} from "lucide-react";
import { PageHeader, SectionHeading } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { getGallery, getPublishedEvents } from "@/lib/content";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Campus Life",
  description:
    "Library, laboratories, classrooms, sports, clubs, cultural activities and student support services at Aarohan Institute.",
};

const FACILITY_SECTIONS = [
  {
    id: "library",
    icon: BookOpen,
    title: "Central library",
    image: "/images/library.jpg",
    text: "Three floors of print collections, journal packages and digital databases, with silent study zones on the upper floors and collaborative tables below. Access runs 8:00 AM to 8:00 PM on working days.",
    points: ["45,000+ print titles*", "24/7 digital access", "Reading halls & discussion rooms", "Research methodology support"],
  },
  {
    id: "laboratories",
    icon: Cpu,
    title: "Laboratories & studios",
    image: "/images/laboratory.jpg",
    text: "Computing, electronics, chemistry, clinical and design studios are shared across schools and booked through the department timetable. Practical sessions are scheduled every week of the semester.",
    points: ["Networked computing labs", "Chemistry & bio-analysis labs", "Clinical skills simulation room", "Design & media studio"],
  },
  {
    id: "classrooms",
    icon: Headphones,
    title: "Classrooms",
    image: "/images/classroom.jpg",
    text: "Tiered lecture theatres and flexible classrooms with lecture capture, so a session you missed can be revisited. Seminar rooms handle small-group tutorials and mentor meetings.",
    points: ["Lecture capture in every room", "Flexible group seating", "Two seminar halls", "Mentor meeting rooms"],
  },
  {
    id: "sports",
    icon: Dumbbell,
    title: "Sports & fitness",
    image: "/images/sports.jpg",
    text: "An outdoor athletics track, courts for basketball and badminton, cricket nets and an indoor fitness centre. Inter-school competitions run through the year and peak at the annual sports meet.",
    points: ["Athletics track & field", "Basketball & badminton courts", "Indoor fitness centre", "Annual sports meet"],
  },
  {
    id: "clubs",
    icon: Palette,
    title: "Clubs & societies",
    image: "/images/campus-event.jpg",
    text: "The student council runs clubs for coding, debating, photography, theatre, music, and social service. Clubs recruit at the start of each semester and schedule sessions around the class timetable.",
    points: ["Coding & robotics club", "Debating society", "Photography & film circle", "Social service league"],
  },
  {
    id: "culture",
    icon: PartyPopper,
    title: "Cultural activities",
    image: "/images/graduation.jpg",
    text: "Rangmanch, the annual cultural festival, brings three days of music, theatre, literary and fine-arts events. Monthly open-mic evenings keep the stage active between festivals.",
    points: ["Rangmanch annual festival", "Monthly open-mic nights", "Inter-school competitions", "Convocation & felicitation"],
  },
];

const SUPPORT = [
  { icon: ShieldCheck, title: "Student welfare cell", text: "Counselling, grievance redressal and welfare support with confidential access." },
  { icon: Headphones, title: "Academic mentoring", text: "A named faculty mentor for progress reviews, attendance support and study planning." },
  { icon: Flame, title: "Health & safety", text: "First-aid room, campus security, fire safety drills and an emergency contact tree." },
  { icon: UtensilsCrossed, title: "Cafeteria & hostel", text: "Subsidised cafeteria, separate hostel blocks with mess, Wi-Fi and resident wardens." },
];

export default function CampusLifePage() {
  const gallery = getGallery(12);
  const events = getPublishedEvents(8);

  return (
    <>
      <PageHeader
        eyebrow="Campus Life"
        title="A campus that stays busy after class"
        description="Library floors, working laboratories, studios, sports facilities, student clubs and a full calendar of events — everything that makes three or four years memorable."
        breadcrumbs={[{ label: "Campus Life" }]}
        meta={[
          { label: "Clubs", value: "12+" },
          { label: "Events / year", value: "40+" },
          { label: "Library hours", value: "8 AM – 8 PM" },
          { label: "Hostel", value: "Available" },
        ]}
      >
        <Link href="/news" className="btn btn-gold">
          Campus notices
        </Link>
        <Link href="/contact" className="btn btn-outline !border-white/25 !text-white hover:!bg-white/10">
          Plan a visit
        </Link>
      </PageHeader>

      {/* facilities */}
      <section className="container-page py-16 md:py-24">
        <SectionHeading
          index="01"
          eyebrow="Facilities"
          title="What the campus offers"
          description="Six spaces that carry most of student life — each maintained by a dedicated team and open through the academic week."
        />

        <div className="space-y-6">
          {FACILITY_SECTIONS.map((section, index) => (
            <Reveal key={section.id} delay={index * 40}>
              <article
                id={section.id}
                className={`grid scroll-mt-32 overflow-hidden rounded-[2rem] border border-line bg-paper lg:grid-cols-2 ${
                  index % 2 === 1 ? "lg:[&>figure]:order-2" : ""
                }`}
              >
                <figure className="relative min-h-[240px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={section.image} alt={section.title} loading="lazy" className="absolute inset-0 h-full w-full" />
                  <figcaption className="absolute inset-0 bg-gradient-to-t from-navy/70 via-navy/10 to-transparent" aria-hidden />
                  <span className="absolute left-5 top-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-paper/95 text-navy">
                    <section.icon className="h-5 w-5" aria-hidden />
                  </span>
                </figure>

                <div className="p-6 md:p-8">
                  <Badge tone="gold">{String(index + 1).padStart(2, "0")} · Facility</Badge>
                  <h3 className="mt-3 text-[clamp(1.3rem,2.4vw,1.75rem)] text-navy">{section.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-body">{section.text}</p>
                  <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                    {section.points.map((point) => (
                      <li key={point} className="flex items-start gap-2 text-[13px] text-navy">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
        <p className="mt-6 text-[11px] text-slate-body">* Sample figures — replace with verified institute data.</p>
      </section>

      {/* support services */}
      <section className="border-y border-line bg-paper py-16 md:py-24">
        <div className="container-page">
          <SectionHeading index="02" eyebrow="Student Support" title="Help when you need it" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {SUPPORT.map((item, index) => (
              <Reveal key={item.title} delay={index * 60}>
                <div className="h-full rounded-3xl border border-line bg-offwhite/60 p-6">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-navy text-gold">
                    <item.icon className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="mt-4 text-[15px] font-bold text-navy">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-body">{item.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* gallery */}
      <section id="gallery" className="container-page scroll-mt-32 py-16 md:py-24">
        <SectionHeading
          index="03"
          eyebrow="Gallery"
          title="Around the campus"
          description="A photographic tour of classrooms, laboratories, library floors and campus events."
          action={
            <Link href="/contact" className="btn btn-outline">
              Book a campus visit
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          }
        />
        {gallery.length === 0 ? (
          <EmptyState title="Gallery is being curated" description="Published images from the admin panel will appear here." />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {gallery.map((item, index) => (
              <Reveal key={item.id} delay={index * 45}>
                <figure className="group relative overflow-hidden rounded-3xl border border-line">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    className={`w-full transition duration-700 group-hover:scale-105 ${index % 3 === 0 ? "aspect-[4/5]" : "aspect-[4/3]"}`}
                  />
                  <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy via-navy/60 to-transparent p-4 pt-14">
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-gold">{item.category}</p>
                    <p className="mt-0.5 font-display text-base font-semibold text-white">{item.title}</p>
                    <p className="mt-0.5 line-clamp-1 text-[11px] text-white/65">{item.caption}</p>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {/* student events */}
      <section className="bg-navy py-16 text-white md:py-24">
        <div className="container-page">
          <SectionHeading
            index="04"
            eyebrow="Student Life Events"
            title={<span className="text-white">What&apos;s on this season</span>}
            description={<span className="text-white/65">Workshops, festivals, seminars and meets — maintained from the admin panel.</span>}
            action={
              <Link href="/events" className="btn btn-gold">
                Full events calendar
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            }
          />
          {events.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
              <EmptyState title="No events published yet" description="Upcoming events will appear here as soon as they are published." compact />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {events.slice(0, 4).map((event, index) => (
                <Reveal key={event.id} delay={index * 60}>
                  <Link
                    href={`/events/${event.slug}`}
                    className="group flex h-full flex-col rounded-3xl border border-white/10 bg-white/[0.045] p-5 transition hover:border-gold/50"
                  >
                    <span className="flex h-14 w-14 flex-col items-center justify-center rounded-2xl bg-gold text-navy">
                      <span className="font-display text-xl font-semibold leading-none">
                        {new Date(event.starts_at).getDate()}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-widest">
                        {new Date(event.starts_at).toLocaleString("en", { month: "short" })}
                      </span>
                    </span>
                    <Badge tone="gold" className="mt-4 self-start !bg-white/10 !text-gold !border-transparent">
                      {event.category}
                    </Badge>
                    <h3 className="mt-3 font-ui text-[15px] font-bold leading-snug text-white">{event.title}</h3>
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-white/60">{event.summary}</p>
                    <span className="mt-auto pt-4 text-xs font-bold text-gold opacity-0 transition group-hover:opacity-100">
                      View details →
                    </span>
                  </Link>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* final CTA */}
      <section className="container-page py-16 md:py-20">
        <div className="flex flex-col items-center gap-6 rounded-[2.5rem] border border-line bg-paper p-8 text-center md:p-12">
          <Badge tone="gold">Visit us</Badge>
          <h2 className="max-w-2xl text-[clamp(1.7rem,3.4vw,2.6rem)] leading-tight text-navy">
            See the campus before you decide.
          </h2>
          <p className="max-w-xl text-sm leading-relaxed text-slate-body">
            Campus tours run Monday to Saturday. Walk through the laboratories, library and studios, and meet a faculty
            member from the programme you are considering.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/contact" className="btn btn-navy btn-lg">
              Book a campus tour
            </Link>
            <Link href="/admissions/apply" className="btn btn-gold btn-lg">
              Apply for admission
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
