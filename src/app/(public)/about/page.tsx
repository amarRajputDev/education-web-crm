import Link from "next/link";
import {
  ArrowRight,
  Award,
  BookOpen,
  Building2,
  CalendarRange,
  FlaskConical,
  Library,
  Quote,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { PageHeader, SectionHeading } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { getBlock, getDepartments, getDownloads, paragraphs, getPublishedFaculty } from "@/lib/content";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "About Us",
  description:
    "Vision, mission, history, leadership and facilities of Aarohan Institute of Higher Education — a demo institute website built by Agentiva.",
};

const MILESTONES = [
  { year: "2004", title: "Institute founded", text: "Aarohan opens with two schools and its first cohort of 180 students." },
  { year: "2009", title: "Engineering school added", text: "The School of Engineering & Technology begins offering undergraduate programmes." },
  { year: "2013", title: "Central library & labs", text: "A three-floor central library and shared laboratory block enter service." },
  { year: "2017", title: "Industry interface cell", text: "Formal live-project and internship partnerships begin with regional employers." },
  { year: "2021", title: "Hybrid learning upgrade", text: "Lecture capture, digital submission and remote mentoring become standard." },
  { year: "2024", title: "Six schools, one campus", text: "Health sciences and design schools complete the current academic structure." },
];

const FACILITIES = [
  { icon: Library, title: "Central library", text: "Three floors of print collections, journal access and silent study zones." },
  { icon: FlaskConical, title: "Laboratories", text: "Computing, electronics, chemistry, clinical and design studios." },
  { icon: Building2, title: "Lecture theatres", text: "Tiered halls with lecture capture in every teaching room." },
  { icon: Users, title: "Mentor cells", text: "Each student is assigned a faculty mentor for academic and personal guidance." },
  { icon: CalendarRange, title: "Seminar halls", text: "Two halls for guest lectures, defence presentations and workshops." },
  { icon: BookOpen, title: "Research support", text: "Methodology clinics, ethics review guidance and publication support." },
];

export default function AboutPage() {
  const overview = getBlock("about_overview");
  const vision = getBlock("mission_vision");
  const director = getBlock("director_message");
  const departments = getDepartments();
  const downloads = getDownloads();
  const faculty = getPublishedFaculty(60);
  const deans = faculty.filter((member) => /dean/i.test(member.designation));
  const visionMeta = vision?.meta as
    | { vision?: string; mission?: string[]; values?: { title: string; text: string }[] }
    | undefined;
  const directorMeta = (director?.meta ?? {}) as { name?: string; role?: string; signature?: string };

  return (
    <>
      <PageHeader
        eyebrow="About the Institute"
        title="An institute built around learning that lasts"
        description="Aarohan Institute of Higher Education is a modern private institute offering undergraduate, postgraduate, diploma and professional programmes across six academic schools."
        breadcrumbs={[{ label: "About Us" }]}
        meta={[
          { label: "Founded", value: "2004" },
          { label: "Schools", value: "6" },
          { label: "Programmes", value: "8" },
          { label: "Campus", value: "1" },
        ]}
      />

      {/* overview */}
      <section id="overview" className="container-page scroll-mt-32 py-16 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div>
            <SectionHeading index="01" eyebrow="Overview" title={overview?.title ?? "Institute overview"} />
            <div className="prose-univ">
              {paragraphs(overview?.body ?? "").map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="/admissions/apply" variant="primary">
                Apply for Admission
              </Button>
              <Button href="/downloads" variant="outline">
                Download prospectus
              </Button>
            </div>
          </div>

          <Reveal className="relative">
            <div className="overflow-hidden rounded-[2.5rem] border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={overview?.image || "/images/about-campus.jpg"}
                alt="Aerial view of the Aarohan Institute campus"
                loading="lazy"
                className="aspect-[4/3] w-full"
              />
            </div>
            <div className="absolute -bottom-6 -left-4 hidden rounded-2xl border border-line bg-paper px-5 py-4 shadow-[var(--shadow-card)] sm:block">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-body">Demo content</p>
              <p className="mt-1 font-display text-base font-semibold text-navy">
                All institute data is fictional sample content
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* vision / mission / values */}
      <section id="vision" className="scroll-mt-32 bg-navy py-16 text-white md:py-24">
        <div className="container-page">
          <SectionHeading
            index="02"
            eyebrow="Vision & Mission"
            title={<span className="text-white">What we are here to do</span>}
            description={<span className="text-white/65">{visionMeta?.vision}</span>}
          />
          <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-7 md:p-9">
              <p className="flex items-center gap-2.5 text-[0.7rem] font-extrabold uppercase tracking-[0.24em] text-gold">
                <Target className="h-4 w-4" aria-hidden />
                Mission
              </p>
              <ol className="mt-6 space-y-5">
                {(visionMeta?.mission ?? []).map((item, index) => (
                  <li key={index} className="flex gap-4 border-b border-white/10 pb-5 last:border-0 last:pb-0">
                    <span className="font-display text-lg font-semibold text-gold">{String(index + 1).padStart(2, "0")}</span>
                    <p className="text-[15px] leading-relaxed text-white/75">{item}</p>
                  </li>
                ))}
              </ol>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {(visionMeta?.values ?? []).map((value) => (
                <div key={value.title} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                  <p className="font-display text-xl font-semibold text-gold">{value.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-white/65">{value.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* history */}
      <section className="container-page py-16 md:py-24">
        <SectionHeading
          index="03"
          eyebrow="History & Milestones"
          title="Two decades of steady growth"
          description="A short, honest timeline — sample milestones prepared for this demonstration."
        />
        <ol className="relative mx-auto max-w-4xl">
          <span className="absolute bottom-4 left-[7px] top-4 w-px bg-line-strong md:left-1/2" aria-hidden />
          {MILESTONES.map((milestone, index) => (
            <Reveal key={milestone.year} delay={index * 60}>
              <li className="relative mb-8 grid gap-4 pl-8 last:mb-0 md:grid-cols-2 md:gap-12 md:pl-0">
                <span
                  className="absolute left-0 top-1.5 h-4 w-4 rounded-full border-4 border-offwhite bg-gold md:left-1/2 md:-translate-x-1/2"
                  aria-hidden
                />
                <div className={index % 2 === 0 ? "md:text-right md:pr-12" : "md:col-start-2 md:pl-12"}>
                  <p className="font-display text-3xl font-semibold text-royal">{milestone.year}</p>
                  <h3 className="mt-1 text-base font-bold text-navy">{milestone.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-body">{milestone.text}</p>
                </div>
              </li>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* director + leadership */}
      <section id="leadership" className="scroll-mt-32 border-y border-line bg-paper py-16 md:py-24">
        <div className="container-page grid gap-12 lg:grid-cols-[1fr_1.2fr]">
          <Reveal>
            <div className="overflow-hidden rounded-[2.5rem] border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={director?.image || "/images/director.jpg"}
                alt={`Portrait of ${directorMeta.name ?? "the Director"}`}
                loading="lazy"
                className="aspect-[4/5] w-full object-top"
              />
            </div>
          </Reveal>

          <div>
            <SectionHeading index="04" eyebrow="Director's Message" title={director?.title ?? "Message from the Director"} />
            <Quote className="h-9 w-9 -scale-x-100 text-gold" aria-hidden />
            <div className="prose-univ mt-4">
              {paragraphs(director?.body ?? "").map((paragraph, index) => (
                <p key={index} className={index === 0 ? "font-display text-xl italic leading-relaxed text-navy" : undefined}>
                  {paragraph}
                </p>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-5">
              <span className="font-display text-2xl italic text-royal">{directorMeta.signature}</span>
              <span className="text-sm text-slate-body">
                {directorMeta.name} · {directorMeta.role}
              </span>
            </div>

            <div className="mt-10">
              <h3 className="text-sm font-extrabold uppercase tracking-[0.16em] text-slate-body">School leadership</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {deans.slice(0, 4).map((member) => (
                  <Link
                    key={member.id}
                    href={`/faculty/${member.slug}`}
                    className="group flex items-center gap-3 rounded-2xl border border-line bg-offwhite/60 p-3 transition hover:border-gold/60 hover:bg-paper"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={member.photo} alt="" loading="lazy" className="h-12 w-12 rounded-xl object-cover object-top" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-navy group-hover:text-royal">{member.name}</span>
                      <span className="block truncate text-[11px] text-slate-body">{member.designation}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* academic philosophy + schools */}
      <section className="container-page py-16 md:py-24">
        <SectionHeading
          index="05"
          eyebrow="Academic Philosophy"
          title="Fundamentals first, practice always"
          description="Coursework is reviewed annually with partner organisations, and every programme carries a project, studio or internship component."
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((department) => (
            <Reveal key={department.id}>
              <article className="card group relative flex h-full flex-col overflow-hidden">
                <div className="relative aspect-[16/9] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={department.image}
                    alt=""
                    loading="lazy"
                    className="h-full w-full transition duration-700 group-hover:scale-105"
                  />
                  <span className="absolute left-4 top-4 rounded-full bg-paper/95 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest text-navy">
                    {department.code}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-base font-bold leading-snug text-navy">{department.name}</h3>
                  <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-body">{department.overview}</p>
                  <Link href={`/academics#${department.slug}`} className="link-sweep mt-4 self-start text-sm font-bold text-royal">
                    Department overview →
                  </Link>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* facilities */}
      <section className="bg-paper py-16 md:py-24">
        <div className="container-page">
          <SectionHeading index="06" eyebrow="Facilities" title="What the campus offers" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FACILITIES.map((facility) => (
              <div key={facility.title} className="flex gap-4 rounded-3xl border border-line bg-offwhite/60 p-6">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-navy text-gold">
                  <facility.icon className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <h3 className="text-[15px] font-bold text-navy">{facility.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-body">{facility.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* accreditations */}
      <section id="accreditations" className="container-page scroll-mt-32 py-16 md:py-24">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-start">
          <SectionHeading
            index="07"
            eyebrow="Accreditations & Affiliations"
            title="Documentation placeholders"
            description="No official accreditation or affiliation is claimed on this demo website."
          />
          <div className="rounded-3xl border border-dashed border-gold/70 bg-gold-100/50 p-7">
            <Badge tone="gold">Demo placeholder</Badge>
            <p className="mt-4 text-sm leading-relaxed text-slate-body">
              Replace this block with verified approval letters, affiliation details and accreditation records before
              publishing. Claims that cannot be substantiated must never appear on a public institute website.
            </p>
            <ul className="mt-5 space-y-3">
              {["Approval / recognition documentation", "University affiliation details", "Programme-wise accreditation status", "Grade or ranking disclosures (if any)"].map(
                (item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-navy">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-royal" aria-hidden />
                    {item}
                  </li>
                ),
              )}
            </ul>
          </div>
        </div>
      </section>

      {/* downloads + CTA */}
      <section className="border-t border-line bg-paper">
        <div className="container-page grid gap-8 py-16 md:grid-cols-2 md:items-center md:py-20">
          <div>
            <p className="flex items-center gap-3 text-[0.7rem] font-extrabold uppercase tracking-[0.24em] text-royal">
              <Sparkles className="h-3.5 w-3.5 text-gold" aria-hidden />
              Prospectus & Resources
            </p>
            <h2 className="mt-4 text-[clamp(1.6rem,3vw,2.3rem)] leading-tight text-navy">
              Everything you need, in one document.
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-slate-body">
              Programmes, eligibility, fee structure, scholarships and the admission checklist — downloadable for
              offline reading.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button href="/downloads" variant="navy">
                <Award className="h-4 w-4" aria-hidden />
                Browse downloads
              </Button>
              <Button href="/contact" variant="outline">
                Contact admissions
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          </div>

          <ul className="divide-y divide-line overflow-hidden rounded-3xl border border-line bg-offwhite/60">
            {downloads.slice(0, 4).map((download) => (
              <li key={download.id} className="flex items-center gap-4 px-5 py-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy text-gold">
                  <BookOpen className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-navy">{download.title}</p>
                  <p className="truncate text-xs text-slate-body">{download.category}</p>
                </div>
                <Link href="/downloads" className="text-sm font-bold text-royal hover:underline">
                  Get
                </Link>
              </li>
            ))}
            {downloads.length === 0 ? (
              <li className="p-5">
                <EmptyState title="No downloads published" compact />
              </li>
            ) : null}
          </ul>
        </div>
        <div className="container-page border-t border-line py-6 text-[11px] text-slate-body">
          Institute overview updated {formatDate(null, "just now")} · demo data maintained from the admin panel.
        </div>
      </section>
    </>
  );
}
