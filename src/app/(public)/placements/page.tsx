import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Building2,
  CalendarCheck,
  Handshake,
  MessagesSquare,
  NotebookPen,
  Quote,
  Target,
  TrendingUp,
  UsersRound,
} from "lucide-react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { PageHeader, SectionHeading } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { getBlock, getTestimonials, paragraphs } from "@/lib/content";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Placements & Career Services",
  description:
    "Placement process, career support services, sample recruiter sectors and student outcomes at Aarohan Institute of Higher Education.",
};

type PlacementsMeta = {
  stats?: { label: string; value: string }[];
  steps?: string[];
};

const SECTORS = [
  "IT & software services",
  "BFSI & fintech",
  "Healthcare & diagnostics",
  "Core manufacturing & engineering",
  "Retail & e-commerce",
  "Media, advertising & design",
  "Logistics & supply chain",
  "Consulting & audit",
  "Education & ed-tech",
  "Telecom & networking",
];

const SUPPORT = [
  {
    icon: NotebookPen,
    title: "Résumé & portfolio review",
    text: "One-to-one reviews each semester so your résumé, GitHub or portfolio is ready before drives begin.",
  },
  {
    icon: Target,
    title: "Aptitude & communication",
    text: "Quantitative aptitude, verbal reasoning and workplace communication workshops run through the year.",
  },
  {
    icon: MessagesSquare,
    title: "Mock interviews",
    text: "Panel interviews with faculty and alumni, with written feedback on every attempt.",
  },
  {
    icon: CalendarCheck,
    title: "Internship coordination",
    text: "Summer internship sourcing, screening support and mentor reporting for every undergraduate programme.",
  },
  {
    icon: Handshake,
    title: "Campus recruitment drives",
    text: "Scheduling, eligibility screening, venue and result processing handled by the career services desk.",
  },
  {
    icon: UsersRound,
    title: "Alumni mentoring",
    text: "Graduates in active roles share interview patterns, role expectations and industry-specific guidance.",
  },
];

export default function PlacementsPage() {
  const block = getBlock("placements");
  const meta = (block?.meta ?? {}) as PlacementsMeta;
  const stats = meta.stats ?? [];
  const steps = meta.steps ?? [];
  const body = paragraphs(block?.body ?? "");
  const testimonials = getTestimonials(4);
  const quote = testimonials[0];

  return (
    <>
      <PageHeader
        eyebrow="Careers"
        title="From classroom to first offer"
        description="Career services start in the first year — résumé building, aptitude readiness, mock interviews, internships and organised campus drives with partner organisations."
        breadcrumbs={<Breadcrumbs items={[{ label: "Placements" }]} />}
        meta={
          stats.length >= 2
            ? stats.slice(0, 4).map((stat) => ({ label: stat.label, value: stat.value }))
            : [
                { label: "Partners", value: "75+" },
                { label: "Internships", value: "400+" },
                { label: "Workshops", value: "30+/yr" },
                { label: "Mock rounds", value: "3" },
              ]
        }
      >
        <Link href="/contact" className="btn btn-gold">
          <Handshake className="h-4 w-4" aria-hidden />
          Recruit from Aarohan
        </Link>
        <Link href="/faqs" className="btn btn-outline !border-white/25 !text-white hover:!bg-white/10">
          Career FAQs
        </Link>
      </PageHeader>

      {/* intro */}
      <section id="overview" className="container-page scroll-mt-32 py-16 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div>
            <SectionHeading
              index="01"
              eyebrow="Career Services"
              title={block?.title ?? "Placement & career services"}
              description="A single team coordinates training, internships and recruitment drives — so students face one process, not many."
            />
            <div className="prose-univ">
              {body.length > 0 ? (
                body.map((paragraph, index) => <p key={index}>{paragraph}</p>)
              ) : (
                <p>
                  The career services team works with students from the first year on résumé building, aptitude
                  readiness, mock interviews and internship applications. Partner organisations visit campus for
                  talks, assessments and final placements.
                </p>
              )}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Badge tone="gold">Sample statistics</Badge>
              <Badge tone="neutral">Demo content</Badge>
            </div>
            <p className="mt-3 max-w-xl text-xs leading-relaxed text-slate-body">
              Figures and process details on this page are fictional demo data. Replace them with verified institute
              disclosures before publishing.
            </p>
          </div>

          <Reveal className="relative">
            <div className="overflow-hidden rounded-[2.5rem] border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={block?.image || "/images/placement.jpg"}
                alt="Students at a campus recruitment talk hosted by a partner organisation"
                loading="lazy"
                className="aspect-[4/3] w-full"
              />
            </div>
            <div className="absolute -bottom-6 -right-4 hidden rounded-2xl border border-line bg-paper px-5 py-4 shadow-[var(--shadow-card)] sm:block">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-body">One desk</p>
              <p className="mt-1 font-display text-base font-semibold text-navy">Training, internships & drives</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* stats strip */}
      <section id="stats" className="scroll-mt-32 border-y border-line bg-paper py-14 md:py-16" aria-label="Placement statistics">
        <div className="container-page">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-line bg-line lg:grid-cols-4">
            {stats.map((stat, index) => (
              <Reveal key={stat.label} delay={index * 60} className="bg-paper px-5 py-7 text-center md:px-6">
                <p className="font-display text-[clamp(2rem,4vw,2.9rem)] font-semibold leading-none text-navy">
                  {stat.value}
                </p>
                <p className="mt-2.5 font-ui text-[12px] font-semibold tracking-wide text-slate-body">{stat.label}</p>
              </Reveal>
            ))}
            {stats.length === 0 ? (
              <p className="col-span-full bg-paper px-5 py-7 text-center text-sm text-slate-body lg:col-span-4">
                Placement statistics are maintained in Admin → Content → Placements and will appear here once saved.
              </p>
            ) : null}
          </div>
          <p className="mt-4 text-[11px] text-slate-body">
            Sample statistics shown for demonstration — editable from the admin content block.
          </p>
        </div>
      </section>

      {/* process */}
      <section id="process" className="container-page scroll-mt-32 py-16 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.35fr] lg:items-start">
          <SectionHeading
            index="02"
            eyebrow="The Process"
            title="How a placement cycle runs"
            description="A repeatable sequence every student follows, term after term, until the offer letter is issued."
          />
          <ol className="relative space-y-4">
            <span className="absolute bottom-6 left-[22px] top-6 w-px bg-line-strong" aria-hidden />
            {steps.map((step, index) => (
              <Reveal key={step} delay={index * 70} as="li" className="relative flex gap-5">
                <span className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold/50 bg-offwhite font-display text-base font-semibold text-gold-700">
                  {index + 1}
                </span>
                <div className="flex-1 rounded-3xl border border-line bg-paper p-5">
                  <p className="text-[15px] font-bold leading-snug text-navy">{step}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-body">
                    {index === 0
                      ? "Completed with your faculty mentor before the final year begins."
                      : index === steps.length - 1
                        ? "Offers are logged and communicated with the terms clearly explained."
                        : "Scheduled by the career services desk and tracked on your student record."}
                  </p>
                </div>
              </Reveal>
            ))}
            {steps.length === 0 ? (
              <li className="rounded-3xl border border-dashed border-line-strong bg-paper p-6 text-sm text-slate-body">
                Placement steps are maintained in Admin → Content → Placements.
              </li>
            ) : null}
          </ol>
        </div>
      </section>

      {/* sectors */}
      <section id="sectors" className="scroll-mt-32 bg-navy py-16 text-white md:py-24">
        <div className="container-page">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.3fr] lg:items-start">
            <SectionHeading
              index="03"
              eyebrow="Recruiter Sectors"
              title={<span className="text-white">Where our graduates apply</span>}
              description={
                <span className="text-white/65">
                  Illustrative sectors only — this is not a list of hiring partners and no recruiter is named on this
                  demo site.
                </span>
              }
            />
            <div>
              <ul className="flex flex-wrap gap-3">
                {SECTORS.map((sector, index) => (
                  <Reveal key={sector} delay={index * 45}>
                    <li className="rounded-full border border-white/15 bg-white/[0.05] px-4 py-2 text-sm text-white/80 transition hover:border-gold/60 hover:text-gold">
                      {sector}
                    </li>
                  </Reveal>
                ))}
              </ul>
              <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-dashed border-gold/60 bg-gold/10 px-4 py-1.5 text-[11px] font-bold text-gold">
                <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                Illustrative sectors — verified recruiter lists are shared during placement briefings
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* support services */}
      <section id="support" className="container-page scroll-mt-32 py-16 md:py-24">
        <SectionHeading
          index="04"
          eyebrow="Student Support"
          title="What the career services desk does for you"
          description="Practical, scheduled support — not a single placement-day lecture."
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SUPPORT.map((service, index) => (
            <Reveal key={service.title} delay={index * 60}>
              <div className="h-full rounded-3xl border border-line bg-paper p-6 transition hover:border-royal/40">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-navy text-gold">
                  <service.icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-4 text-[15px] font-bold text-navy">{service.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-body">{service.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* testimonial */}
      <section className="border-y border-line bg-paper py-16 md:py-24">
        <div className="container-page">
          <SectionHeading
            index="05"
            eyebrow="Student Voice"
            title="In their own words"
            description="Sample testimonial shown for demonstration — to be replaced with authorised feedback."
          />
          {quote ? (
            <Reveal className="mx-auto max-w-4xl">
              <figure className="relative overflow-hidden rounded-[2.5rem] border border-line bg-offwhite/60 p-8 md:p-12">
                <Quote className="h-10 w-10 -scale-x-100 text-gold" aria-hidden />
                <blockquote className="mt-5 font-display text-[clamp(1.3rem,2.6vw,1.9rem)] italic leading-[1.45] text-navy">
                  &ldquo;{quote.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-7 flex flex-wrap items-center gap-4 border-t border-line pt-6">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={quote.photo || "/images/p-01.jpg"}
                    alt=""
                    loading="lazy"
                    className="h-14 w-14 rounded-full object-cover object-top ring-2 ring-gold/40"
                  />
                  <div className="min-w-0">
                    <p className="font-ui text-sm font-bold text-navy">{quote.name}</p>
                    <p className="text-xs text-slate-body">
                      {quote.role} · {quote.program} · Class of {quote.grad_year}
                    </p>
                  </div>
                  <Badge tone="neutral" className="ml-auto">
                    Demo
                  </Badge>
                </figcaption>
              </figure>
            </Reveal>
          ) : (
            <EmptyState title="No testimonials published yet" description="Student voices will appear here once published." />
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/news" className="btn btn-outline btn-sm">
              <TrendingUp className="h-4 w-4" aria-hidden />
              Career news & notices
            </Link>
            <Link href="/courses" className="btn btn-ghost btn-sm">
              <Briefcase className="h-4 w-4" aria-hidden />
              Programmes with internships
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-page py-16 md:py-24">
        <div className="relative isolate overflow-hidden rounded-[2.5rem] bg-navy p-8 text-white md:p-12">
          <div className="absolute inset-0 grid-lines-light opacity-50" aria-hidden />
          <div className="relative grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-center">
            <div>
              <p className="flex items-center gap-3 text-[0.7rem] font-extrabold uppercase tracking-[0.24em] text-gold">
                <Building2 className="h-3.5 w-3.5" aria-hidden />
                For students & recruiters
              </p>
              <h2 className="mt-4 text-[clamp(1.7rem,3.2vw,2.5rem)] leading-tight text-white">
                Build the career stage by stage —{" "}
                <span className="italic text-gold">or hire from it.</span>
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/65">
                Students: join a programme and the career services team takes over from year one. Employers: write to
                the placement desk to schedule a talk, internship slot or recruitment drive.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 md:justify-end">
              <Link href="/admissions/apply" className="btn btn-gold">
                Apply to a programme
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link href="/contact" className="btn btn-outline !border-white/25 !text-white hover:!bg-white/10">
                Contact placement desk
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
