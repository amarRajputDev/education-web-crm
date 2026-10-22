import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  FlaskConical,
  GraduationCap,
  HeartHandshake,
  MapPin,
  Palette,
  Quote,
  Search,
  Sparkles,
  TrendingUp,
  Upload,
  Users,
  Wifi,
} from "lucide-react";
import { getDb, parseJson } from "@/lib/db";
import { getSetting } from "@/lib/settings";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "@/components/ui/section";
import { Counter, Reveal } from "@/components/ui/reveal";
import { CourseCard, type CourseCardData } from "@/components/public/course-card";
import { FacultyCard, type FacultyCardData } from "@/components/public/faculty-card";
import { EnquiryForm } from "@/components/public/enquiry-form";
import { EmptyState } from "@/components/ui/feedback";
import { formatDate, formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

type WhyItem = { icon: string; title: string; text: string };

const WHY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Users,
  FlaskConical,
  Briefcase,
  TrendingUp,
  BookOpen,
  HeartHandshake,
  Palette,
  Wifi,
};

/** Deliberate asymmetry: wide feature tiles + compact tiles = a bento rhythm. */
const BENTO_SPANS = [
  "lg:col-span-2 lg:row-span-2",
  "",
  "",
  "lg:col-span-2",
  "",
  "",
  "",
  "lg:col-span-2",
];

function homeData() {
  const db = getDb();
  const courses = db
    .prepare(
      `SELECT c.id, c.name, c.slug, c.degree_level, c.duration_label, c.study_mode, c.eligibility,
              c.overview, c.image, d.name AS department_name
         FROM courses c
         LEFT JOIN departments d ON d.id = c.department_id
        WHERE c.status = 'published'
        ORDER BY c.featured DESC, c.id
        LIMIT 6`,
    )
    .all() as CourseCardData[];

  const faculty = db
    .prepare(
      `SELECT f.id, f.name, f.slug, f.designation, f.photo, f.email, f.qualifications,
              f.research_interests, d.name AS department_name
         FROM faculty f
         LEFT JOIN departments d ON d.id = f.department_id
        WHERE f.visibility = 'published'
        ORDER BY f.display_order, f.id
        LIMIT 4`,
    )
    .all() as FacultyCardData[];

  const testimonials = db
    .prepare(`SELECT * FROM testimonials WHERE status = 'published' ORDER BY sort_order LIMIT 6`)
    .all() as {
    id: number;
    name: string;
    role: string;
    program: string;
    grad_year: string;
    quote: string;
    photo: string;
    is_demo: number;
  }[];

  const news = db
    .prepare(
      `SELECT title, slug, category, excerpt, cover_image, published_at
         FROM news_posts WHERE status = 'published' ORDER BY published_at DESC LIMIT 3`,
    )
    .all() as { title: string; slug: string; category: string; excerpt: string; cover_image: string; published_at: string }[];

  const events = db
    .prepare(
      `SELECT title, slug, category, summary, location, starts_at, image
         FROM events WHERE status = 'published' AND starts_at >= datetime('now')
        ORDER BY starts_at ASC LIMIT 4`,
    )
    .all() as { title: string; slug: string; category: string; summary: string; location: string; starts_at: string; image: string }[];

  const gallery = db
    .prepare(`SELECT title, image, caption, category FROM gallery_items WHERE status = 'published' ORDER BY sort_order LIMIT 8`)
    .all() as { title: string; image: string; caption: string; category: string }[];

  const enquiryCourses = db
    .prepare(`SELECT id, name FROM courses WHERE status = 'published' ORDER BY name`)
    .all() as { id: number; name: string }[];

  const whyBlock = db.prepare(`SELECT meta FROM content_blocks WHERE block_key = 'why_choose'`).get() as
    | { meta: string }
    | undefined;
  const directorBlock = db
    .prepare(`SELECT title, body, image, meta FROM content_blocks WHERE block_key = 'director_message'`)
    .get() as { title: string; body: string; image: string; meta: string } | undefined;

  return { courses, faculty, testimonials, news, events, gallery, enquiryCourses, whyBlock, directorBlock };
}

export default function HomePage() {
  const { courses, faculty, testimonials, news, events, gallery, enquiryCourses, whyBlock, directorBlock } = homeData();

  const heroImage = getSetting("hero_image", "/images/hero-campus.jpg");
  const whyRaw = parseJson<WhyItem[] | { items?: WhyItem[] }>(whyBlock?.meta ?? "{}", []);
  const whyItems: WhyItem[] = (Array.isArray(whyRaw) ? whyRaw : (whyRaw.items ?? [])).filter(
    (item) => item && typeof item.title === "string",
  );
  const directorMeta = parseJson<{ name: string; role: string; signature: string }>(directorBlock?.meta ?? "{}", {
    name: "",
    role: "",
    signature: "",
  });

  const stats = [
    { label: "Academic programmes", value: getSetting("stat_programs", "42"), numeric: 42 },
    { label: "Experienced faculty", value: getSetting("stat_faculty", "180+"), numeric: 180 },
    { label: "Student community", value: getSetting("stat_students", "6,500+"), numeric: 6500 },
    { label: "Industry collaborations", value: getSetting("stat_partners", "75+"), numeric: 75 },
  ];

  const processSteps = [
    { icon: Search, title: "Explore Programs", text: "Compare programmes, eligibility, duration and fee details across six schools." },
    { icon: FileText, title: "Submit Enquiry or Application", text: "Send an enquiry or complete the six-step online application form." },
    { icon: Upload, title: "Document Submission", text: "Upload mark sheets, identity proof and photographs for verification." },
    { icon: ClipboardCheck, title: "Track Application Status", text: "Use your reference number to follow every update from the review team." },
  ];

  const marqueeItems = [
    "B.Tech Computer Science",
    "BBA",
    "MBA",
    "BCA",
    "M.Sc Data Science",
    "B.Com (Hons.)",
    "B.Des Interaction Design",
    "Diploma · Medical Lab Technology",
  ];

  return (
    <>
      {/* ============ HERO ============ */}
      <section className="relative isolate overflow-hidden bg-navy text-white">
        <div className="absolute inset-0 grid-lines-light opacity-60" aria-hidden />
        <div className="pointer-events-none absolute -left-40 -top-40 h-[26rem] w-[26rem] rounded-full bg-royal/45 blur-[120px]" aria-hidden />
        <div className="pointer-events-none absolute -bottom-52 right-[30%] h-96 w-96 rounded-full bg-gold/12 blur-[110px]" aria-hidden />

        <div className="container-page relative grid gap-12 pb-20 pt-14 md:pt-16 lg:grid-cols-[1.12fr_1fr] lg:items-center lg:gap-16 lg:pb-28 lg:pt-20">
          {/* --- copy --- */}
          <div className="animate-rise-in">
            <p className="inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.2em] text-gold">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              {getSetting("hero_eyebrow")}
            </p>

            <h1 className="mt-7 text-[clamp(2.5rem,6.4vw,4.6rem)] leading-[0.98] tracking-[-0.03em] text-white">
              Your ambition deserves a{" "}
              <span className="relative inline-block whitespace-nowrap italic text-gold">
                great beginning
                <svg
                  className="absolute -bottom-2 left-0 h-3 w-full text-gold/45"
                  viewBox="0 0 300 12"
                  preserveAspectRatio="none"
                  aria-hidden
                >
                  <path d="M2 9C60 3 140 2 298 7" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
                </svg>
              </span>
              .
            </h1>

            <p className="mt-8 max-w-xl text-base leading-relaxed text-white/70 md:text-lg">
              {getSetting("hero_text")}
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button href="/courses" variant="gold" size="lg">
                Explore Programs
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
              <Button
                href="/admissions/apply"
                variant="outline"
                size="lg"
                className="!border-white/25 !text-white hover:!border-gold hover:!bg-white/10 hover:!text-gold"
              >
                Apply for Admission
              </Button>
            </div>

            <ul className="mt-10 grid gap-3 border-t border-white/10 pt-7 text-sm text-white/70 sm:grid-cols-2">
              {[
                { icon: GraduationCap, text: "UG · PG · Diploma · Professional" },
                { icon: TrendingUp, text: "Industry-linked projects every semester" },
                { icon: HeartHandshake, text: "Faculty mentor assigned to every student" },
                { icon: Building2, text: "Six schools, one connected campus" },
              ].map((item) => (
                <li key={item.text} className="flex items-center gap-2.5">
                  <item.icon className="h-4 w-4 shrink-0 text-gold" aria-hidden />
                  {item.text}
                </li>
              ))}
            </ul>
          </div>

          {/* --- imagery --- */}
          <div className="relative animate-fade-in">
            <div className="absolute -left-4 -top-4 hidden h-28 w-28 border-l-2 border-t-2 border-gold/70 sm:block" aria-hidden />
            <div className="relative overflow-hidden rounded-t-[14rem] rounded-b-3xl border border-white/12 shadow-[var(--shadow-lift)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={heroImage}
                alt="Students walking through the Aarohan Institute campus"
                className="aspect-[4/5] w-full object-cover lg:aspect-[3/4]"
                fetchPriority="high"
                width={1200}
                height={1600}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy/70 via-navy/5 to-transparent" aria-hidden />
            </div>

            {/* rotated side label */}
            <span
              className="absolute -right-6 top-1/2 hidden origin-right -translate-y-1/2 rotate-90 text-[10px] font-extrabold uppercase tracking-[0.42em] text-white/40 lg:block"
              aria-hidden
            >
              Established 2004 · Noida
            </span>

            {/* floating highlight card */}
            <div className="animate-fade-up absolute -bottom-8 -left-2 w-[min(90%,340px)] rounded-3xl border border-line bg-paper p-5 text-navy shadow-[var(--shadow-pop)] sm:left-4">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gold-100 text-gold-700">
                  <TrendingUp className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-body">
                    Academic highlight
                  </p>
                  <p className="mt-1 font-display text-[17px] font-semibold leading-snug text-navy">
                    Live projects with partner organisations
                  </p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-3.5 text-center">
                {[
                  { value: "6", label: "Schools" },
                  { value: "8", label: "Flagship programmes" },
                  { value: "75+", label: "Industry partners" },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="font-display text-xl font-semibold text-royal">{item.value}</p>
                    <p className="text-[9.5px] font-semibold uppercase tracking-wide text-slate-body">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* --- programme marquee --- */}
        <div className="marquee relative overflow-hidden border-t border-white/10 bg-navy-800 py-3.5">
          <div className="marquee-track gap-10">
            {[0, 1].map((copy) => (
              <div key={copy} className="flex shrink-0 items-center gap-10 pr-10" aria-hidden={copy === 1}>
                {marqueeItems.map((item) => (
                  <span key={item} className="flex items-center gap-10 whitespace-nowrap text-[11px] font-extrabold uppercase tracking-[0.26em] text-white/55">
                    {item}
                    <span className="h-1.5 w-1.5 rounded-full bg-gold" aria-hidden />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ STATS LEDGER ============ */}
      <section className="border-b border-line bg-paper" aria-label="Institute statistics">
        <div className="container-page grid grid-cols-2 divide-x divide-y divide-line lg:grid-cols-4 lg:divide-y-0">
          {stats.map((stat, index) => (
            <Reveal key={stat.label} delay={index * 70} className="px-4 py-8 text-center md:px-6 md:py-10 lg:text-left">
              <span className="section-index">{String(index + 1).padStart(2, "0")}</span>
              <p className="mt-3 font-display text-[clamp(2.4rem,5vw,3.6rem)] font-semibold leading-none text-navy">
                <Counter value={stat.numeric} />
                {stat.value.replace(/[\d,]/g, "")}
              </p>
              <p className="mt-2.5 font-ui text-[13px] font-semibold tracking-wide text-slate-body">{stat.label}</p>
            </Reveal>
          ))}
        </div>
        <div className="container-page pb-5 text-center text-[11px] text-slate-body lg:text-left">
          Sample statistics — editable in Admin → Settings → Homepage.
        </div>
      </section>

      {/* ============ PROGRAMMES ============ */}
      <section className="container-page py-20 md:py-28">
        <SectionHeading
          index="01"
          eyebrow="Programmes"
          title={
            <>
              Degrees built for{" "}
              <span className="italic text-royal">real careers</span>
            </>
          }
          description="Eight flagship programmes across engineering, management, health sciences and design — each with a published curriculum, eligibility criteria and career pathways."
          action={
            <Link href="/courses" className="btn btn-outline">
              View all programmes
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          }
        />
        {courses.length === 0 ? (
          <EmptyState title="No programmes published yet" description="Published courses from the admin panel will appear here." />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:[&>*:nth-child(3n+2)]:translate-y-8">
            {courses.map((course) => (
              <Reveal key={course.id}>
                <CourseCard course={course} sourcePage="/" />
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {/* ============ WHY CHOOSE — BENTO ============ */}
      <section className="relative isolate overflow-hidden bg-navy py-20 text-white md:py-28">
        <div className="absolute inset-0 grid-lines-light opacity-50" aria-hidden />
        <div className="container-page relative">
          <SectionHeading
            index="02"
            eyebrow="Why Aarohan"
            title={<span className="text-white">A campus designed for serious learning</span>}
            description={
              <span className="text-white/65">
                Every programme is supported by faculty mentoring, working laboratories, industry exposure and
                structured career guidance.
              </span>
            }
          />
          <div className="grid auto-rows-[minmax(160px,auto)] gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {whyItems.map((item, index) => {
              const Icon = WHY_ICONS[item.icon] ?? BookOpen;
              const span = BENTO_SPANS[index] ?? "";
              const feature = span.includes("row-span-2");
              return (
                <Reveal key={item.title} delay={index * 55} className={span}>
                  <div className="group flex h-full flex-col rounded-3xl border border-white/10 bg-white/[0.045] p-6 transition duration-300 hover:border-gold/50 hover:bg-white/[0.08]">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gold text-navy transition group-hover:rotate-6">
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <h3 className="mt-4 text-base font-bold text-white">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/60">{item.text}</p>
                    {feature ? (
                      <div className="mt-auto flex flex-wrap gap-2 pt-6">
                        {["Project studios", "24×7 library", "Mentor cells", "Placement prep"].map((tag) => (
                          <span key={tag} className="rounded-full border border-white/15 px-3 py-1 text-[11px] text-white/60">
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ DIRECTOR ============ */}
      <section className="container-page py-20 md:py-28">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,340px)_1fr] lg:gap-16">
          <Reveal className="relative mx-auto w-full max-w-[320px] lg:mx-0">
            <div className="absolute -inset-3 rounded-t-[10rem] rounded-b-3xl border border-dashed border-gold/60" aria-hidden />
            <div className="relative overflow-hidden rounded-t-[9rem] rounded-b-3xl bg-paper">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={directorBlock?.image || "/images/director.jpg"}
                alt={`Portrait of ${directorMeta.name || "the Director"}`}
                loading="lazy"
                className="aspect-[4/5] w-full object-cover object-top"
              />
            </div>
            <div className="absolute -bottom-5 left-1/2 w-[85%] -translate-x-1/2 rounded-2xl border border-line bg-paper px-4 py-3 text-center shadow-[var(--shadow-card)]">
              <p className="font-display text-base font-semibold text-navy">{directorMeta.name}</p>
              <p className="text-[11px] text-slate-body">{directorMeta.role}</p>
            </div>
          </Reveal>

          <div>
            <div className="mb-5 flex items-center gap-4" aria-hidden>
              <span className="section-index">03</span>
              <span className="h-px w-16 bg-line-strong" />
              <span className="font-ui text-[0.7rem] font-extrabold uppercase tracking-[0.24em] text-royal">
                From the Director&apos;s desk
              </span>
            </div>
            <Quote className="h-10 w-10 -scale-x-100 text-gold" aria-hidden />
            <blockquote className="mt-4 font-display text-[clamp(1.4rem,2.6vw,2.1rem)] font-normal italic leading-[1.32] text-navy">
              “Education works when curiosity meets opportunity. We do not ask students to fit a mould — we ask them
              to explore widely, work honestly and leave with the confidence to build something of their own.”
            </blockquote>
            <div className="prose-univ mt-6 max-w-2xl">
              {(directorBlock?.body ?? "")
                .split("\n\n")
                .slice(1)
                .map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
            </div>
            <div className="mt-7 flex flex-wrap items-center gap-6">
              <span className="font-display text-2xl italic text-royal">{directorMeta.signature}</span>
              <Link href="/about#leadership" className="link-sweep text-sm font-bold text-navy">
                Read the institute story →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FACULTY ============ */}
      <section className="border-y border-line bg-paper py-20 md:py-28">
        <div className="container-page">
          <SectionHeading
            index="04"
            eyebrow="People"
            title={
              <>
                Taught by people who <span className="italic text-royal">still practise</span>
              </>
            }
            description="Faculty with academic depth, research output and industry experience — accessible to students beyond scheduled class hours."
            action={
              <Link href="/faculty" className="btn btn-outline">
                Meet Our Faculty
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            }
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {faculty.map((member, index) => (
              <Reveal key={member.id} delay={index * 70}>
                <FacultyCard member={member} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CAMPUS MOSAIC ============ */}
      <section className="container-page py-20 md:py-28">
        <SectionHeading
          index="05"
          eyebrow="Campus & Student Experience"
          title="Life beyond the lecture hall"
          description="Laboratories, library floors, studios, sports facilities and a full calendar of student-led events."
          action={
            <Link href="/campus-life" className="btn btn-outline">
              Explore Campus Life
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          }
        />
        <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
          {gallery.slice(0, 6).map((item, index) => (
            <Reveal key={`${item.title}-${index}`} delay={index * 50} className="mb-5 break-inside-avoid">
              <figure className="group relative overflow-hidden rounded-3xl border border-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image}
                  alt={item.title}
                  loading="lazy"
                  className={`w-full transition duration-700 group-hover:scale-[1.04] ${
                    index % 3 === 0 ? "aspect-[4/5]" : index % 3 === 1 ? "aspect-[4/3]" : "aspect-square"
                  }`}
                />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy via-navy/60 to-transparent p-5 pt-16">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-gold">{item.category}</p>
                  <p className="mt-1 font-display text-lg font-semibold text-white">{item.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-white/65">{item.caption}</p>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============ ADMISSION PROCESS TIMELINE ============ */}
      <section className="relative isolate overflow-hidden bg-navy py-20 text-white md:py-28">
        <div className="absolute inset-0 grid-lines-light opacity-40" aria-hidden />
        <div className="container-page relative">
          <SectionHeading
            index="06"
            eyebrow="Admissions"
            title={<span className="text-white">Four simple steps to your seat</span>}
            description={
              <span className="text-white/65">
                A transparent, trackable admission process — from first exploration to confirmed enrolment.
              </span>
            }
            action={
              <Link href="/admissions/apply" className="btn btn-gold">
                Start Your Application
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            }
          />

          <ol className="relative grid gap-8 lg:grid-cols-4 lg:gap-6">
            <span className="absolute left-0 right-0 top-8 hidden border-t border-dashed border-white/20 lg:block" aria-hidden />
            {processSteps.map((step, index) => (
              <Reveal key={step.title} delay={index * 80} className="relative">
                <li className="h-full">
                  <span className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full border border-gold/40 bg-navy font-display text-2xl font-semibold text-gold">
                    {index + 1}
                  </span>
                  <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                    <step.icon className="h-5 w-5 text-gold" aria-hidden />
                    <h3 className="mt-3 text-base font-bold text-white">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/60">{step.text}</p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ============ TESTIMONIALS ============ */}
      <section className="container-page py-20 md:py-28">
        <SectionHeading
          index="07"
          eyebrow="Voices"
          title="What students & parents tell us"
          description="Sample testimonials shown for demonstration — to be replaced with verified, authorised feedback."
        />
        <div className="grid gap-6 [&>*]:min-w-0 md:grid-cols-3 md:[&>*:nth-child(2)]:md:mt-10">
          {testimonials.slice(0, 3).map((item) => (
            <Reveal key={item.id}>
              <figure className="card relative flex h-full flex-col overflow-hidden p-5 sm:p-7">
                <Quote className="h-9 w-9 -scale-x-100 text-gold" aria-hidden />
                <blockquote className="mt-4 flex-1 break-words font-display text-[17px] leading-[1.6] text-navy">
                  “{item.quote}”
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-line pt-5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.photo || "/images/p-01.jpg"}
                    alt=""
                    loading="lazy"
                    className="h-11 w-11 rounded-full object-cover ring-2 ring-gold/40"
                  />
                  <div className="min-w-0">
                    <p className="truncate font-ui text-sm font-bold text-navy">{item.name}</p>
                    <p className="truncate text-xs text-slate-body">{item.role}</p>
                  </div>
                  <Badge tone="neutral" className="ml-auto">
                    Demo
                  </Badge>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============ NEWS + EVENTS ============ */}
      <section className="border-y border-line bg-paper py-20 md:py-28">
        <div className="container-page grid gap-14 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <SectionHeading index="08" align="left" eyebrow="News & Notices" title="Latest from the institute" />
            {news.length === 0 ? (
              <EmptyState title="No news published yet" compact />
            ) : (
              <ul className="border-t border-line">
                {news.map((item) => (
                  <li key={item.slug}>
                    <Link
                      href={`/news/${item.slug}`}
                      className="group flex items-start gap-5 border-b border-line py-6 transition hover:bg-offwhite/70"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.cover_image}
                        alt=""
                        loading="lazy"
                        className="hidden h-24 w-32 shrink-0 rounded-2xl object-cover sm:block"
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <Badge tone={item.category === "Achievement" ? "gold" : "info"}>{item.category}</Badge>
                          <time className="text-[11px] font-semibold uppercase tracking-wide text-slate-body">
                            {formatDate(item.published_at)}
                          </time>
                        </div>
                        <h3 className="mt-2.5 font-display text-xl font-semibold leading-snug text-navy transition group-hover:text-royal">
                          {item.title}
                        </h3>
                        <p className="mt-1.5 line-clamp-2 text-sm text-slate-body">{item.excerpt}</p>
                        <span className="mt-2 inline-block text-xs font-bold text-royal opacity-0 transition group-hover:opacity-100">
                          Read article →
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/news" className="link-sweep mt-6 inline-block text-sm font-bold text-navy">
              All news & notices →
            </Link>
          </div>

          <div>
            <SectionHeading index="09" align="left" eyebrow="Calendar" title="Upcoming events" />
            {events.length === 0 ? (
              <EmptyState title="No upcoming events" compact />
            ) : (
              <ul className="space-y-4">
                {events.map((event) => (
                  <li key={event.slug}>
                    <Link
                      href={`/events/${event.slug}`}
                      className="group flex items-start gap-4 rounded-3xl border border-line bg-offwhite/60 p-4 transition hover:border-gold/60 hover:bg-paper hover:shadow-[var(--shadow-card)]"
                    >
                      <span className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-navy text-white">
                        <span className="font-display text-2xl font-semibold leading-none">
                          {new Date(event.starts_at).getDate()}
                        </span>
                        <span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gold">
                          {new Date(event.starts_at).toLocaleString("en", { month: "short" })}
                        </span>
                      </span>
                      <div className="min-w-0">
                        <Badge tone="gold">{event.category}</Badge>
                        <h3 className="mt-2 text-[15px] font-bold leading-snug text-navy transition group-hover:text-royal">
                          {event.title}
                        </h3>
                        <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-body">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                            {formatDateTime(event.starts_at)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" aria-hidden />
                            {event.location}
                          </span>
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/events" className="link-sweep mt-6 inline-block text-sm font-bold text-navy">
              Full events calendar →
            </Link>
          </div>
        </div>
      </section>

      {/* ============ LEAD GENERATION ============ */}
      <section className="container-page py-20 md:py-28">
        <div className="relative isolate overflow-hidden rounded-[2rem] bg-navy text-white shadow-[var(--shadow-pop)] md:rounded-[2.5rem]">
          <div className="absolute inset-0 grid-lines-light opacity-50" aria-hidden />
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-royal/40 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute -bottom-32 left-10 h-72 w-72 rounded-full bg-gold/12 blur-3xl" aria-hidden />

          <div className="relative grid gap-10 p-7 sm:p-10 lg:grid-cols-2 lg:gap-14 lg:p-14">
            <div>
              <p className="flex items-center gap-3 text-[0.7rem] font-extrabold uppercase tracking-[0.24em] text-gold">
                <span className="h-px w-10 bg-gold/70" aria-hidden />
                Admission Enquiry
              </p>
              <h2 className="mt-5 text-[clamp(1.8rem,3.4vw,2.7rem)] leading-[1.05] text-white">
                Not sure where to start? <span className="italic text-gold">Talk to a counsellor.</span>
              </h2>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-white/70">
                Share a few details and our admission counsellor will call you with programme options, eligibility,
                scholarships and important dates — usually within one working day.
              </p>
              <ul className="mt-7 grid gap-3 sm:grid-cols-2">
                {[
                  "Personalised programme shortlisting",
                  "Scholarship and fee guidance",
                  "Document checklist for your application",
                  "Campus visit and hostel information",
                ].map((point) => (
                  <li key={point} className="flex items-start gap-2.5 text-sm text-white/75">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
                    {point}
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button href="/admissions/apply" variant="gold">
                  <GraduationCap className="h-4 w-4" aria-hidden />
                  Apply Now
                </Button>
                <Button
                  href="/contact"
                  variant="outline"
                  className="!border-white/25 !text-white hover:!border-gold hover:!text-gold"
                >
                  <Building2 className="h-4 w-4" aria-hidden />
                  Visit campus
                </Button>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-paper p-6 text-charcoal sm:p-8">
              <EnquiryForm
                courses={enquiryCourses}
                source="Website"
                sourcePage="/"
                compact
                title="Request a call back"
                intro="Fields marked with * are required."
              />
            </div>
          </div>
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className="border-t border-line bg-paper">
        <div className="container-page flex flex-col items-center gap-7 py-20 text-center md:py-24">
          <span className="section-index">— Aarohan Institute —</span>
          <h2 className="max-w-4xl text-[clamp(2rem,5vw,3.5rem)] leading-[1.04] text-navy">
            Your future deserves a{" "}
            <span className="italic text-royal">great beginning</span>.
          </h2>
          <p className="max-w-2xl text-base text-slate-body md:text-lg">
            Applications for the 2027–28 academic session are open across all six schools. Explore the programme that
            fits your ambition — then take the first step.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button href="/courses" variant="navy" size="lg">
              Explore Courses
            </Button>
            <Button href="/admissions/apply" variant="gold" size="lg">
              Apply for Admission
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
