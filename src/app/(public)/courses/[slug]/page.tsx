import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Building2,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  GraduationCap,
  Layers,
  Quote,
  Send,
  Target,
  Users,
  Wallet,
} from "lucide-react";
import { getDb, parseJson } from "@/lib/db";
import { getSetting } from "@/lib/settings";
import { PageHeader, SectionHeading } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion } from "@/components/public/accordion";
import { EnquiryForm } from "@/components/public/enquiry-form";
import { FacultyCard } from "@/components/public/faculty-card";
import { formatCurrency } from "@/lib/format";
import type { CourseCardData } from "@/components/public/course-card";
import type { FacultyCardData } from "@/components/public/faculty-card";

export const dynamic = "force-dynamic";

type CourseRow = {
  id: number;
  name: string;
  slug: string;
  code: string;
  degree_level: string;
  department_id: number | null;
  duration_months: number;
  duration_label: string;
  study_mode: string;
  seats: number;
  eligibility: string;
  overview: string;
  description: string;
  learning_outcomes: string;
  curriculum: string;
  careers: string;
  fee_amount: number;
  fee_note: string;
  scholarship_info: string;
  image: string;
  status: string;
  session_ids: string;
  faqs: string;
  seo_description: string;
  department_name: string | null;
  department_slug: string | null;
};

function loadCourse(slug: string): CourseRow | null {
  const row = getDb()
    .prepare(
      `SELECT c.*, d.name AS department_name, d.slug AS department_slug
         FROM courses c
         LEFT JOIN departments d ON d.id = c.department_id
        WHERE c.slug = ? AND c.status = 'published'`,
    )
    .get(slug) as CourseRow | undefined;
  return row ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = loadCourse(slug);
  if (!course) return { title: "Programme not found" };
  return {
    title: course.name,
    description: course.seo_description || course.overview.slice(0, 180),
    openGraph: { title: course.name, description: course.overview, images: [course.image] },
    alternates: { canonical: `/courses/${course.slug}` },
  };
}

export default async function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = loadCourse(slug);
  if (!course) notFound();

  const db = getDb();
  const outcomes = parseJson<string[]>(course.learning_outcomes, []);
  const curriculum = parseJson<{ semester: string; subjects: string[] }[]>(course.curriculum, []);
  const careers = parseJson<string[]>(course.careers, []);
  const courseFaqs = parseJson<{ q: string; a: string }[]>(course.faqs, []);

  const faculty = db
    .prepare(
      `SELECT f.id, f.name, f.slug, f.designation, f.photo, f.email, f.qualifications,
              f.research_interests, d.name AS department_name
         FROM faculty f
         LEFT JOIN departments d ON d.id = f.department_id
        WHERE f.department_id = ? AND f.visibility = 'published'
        ORDER BY f.display_order
        LIMIT 3`,
    )
    .all(course.department_id ?? -1) as FacultyCardData[];

  const related = db
    .prepare(
      `SELECT c.id, c.name, c.slug, c.degree_level, c.duration_label, c.study_mode, c.eligibility,
              c.overview, c.image, d.name AS department_name
         FROM courses c
         LEFT JOIN departments d ON d.id = c.department_id
        WHERE c.status = 'published' AND c.id != ? AND (c.department_id = ? OR c.degree_level = ?)
        ORDER BY c.featured DESC
        LIMIT 3`,
    )
    .all(course.id, course.department_id ?? -1, course.degree_level) as CourseCardData[];

  const sessions = db
    .prepare(`SELECT id, name, application_deadline FROM academic_sessions WHERE status = 'open' ORDER BY start_date`)
    .all() as { id: number; name: string; application_deadline: string }[];

  const allCourses = db
    .prepare(`SELECT id, name FROM courses WHERE status = 'published' ORDER BY name`)
    .all() as { id: number; name: string }[];

  const facilities = [
    { icon: Layers, title: "Programme laboratories", text: `Dedicated practical sessions for ${course.name} across the department's lab block.` },
    { icon: BookOpen, title: "Library access", text: "Print and digital collections, journal packages and quiet study zones." },
    { icon: Users, title: "Faculty mentor", text: "One named mentor tracks your progress for the full programme." },
    { icon: Target, title: "Career preparation", text: "Résumé reviews, aptitude sessions and mock interviews from year two." },
  ];

  const specs = [
    { icon: Clock, label: "Duration", value: course.duration_label },
    { icon: Layers, label: "Study mode", value: course.study_mode },
    { icon: GraduationCap, label: "Level", value: course.degree_level },
    { icon: Users, label: "Seats (sample)", value: `${course.seats} seats` },
    { icon: Wallet, label: "Fee", value: course.fee_amount ? `${formatCurrency(course.fee_amount)} / semester` : "On request" },
    { icon: FileText, label: "Code", value: course.code || "—" },
  ];

  return (
    <>
      <PageHeader
        eyebrow={course.department_name ?? "Programme"}
        title={course.name}
        description={course.overview}
        breadcrumbs={[{ label: "Courses", href: "/courses" }, { label: course.name }]}
        meta={[
          { label: "Duration", value: course.duration_label },
          { label: "Mode", value: course.study_mode },
          { label: "Level", value: course.degree_level },
          { label: "Session", value: sessions[0]?.name ?? "2027–28" },
        ]}
      >
        <Link href="/admissions/apply" className="btn btn-gold">
          <GraduationCap className="h-4 w-4" aria-hidden />
          Apply Now
        </Link>
        <Link href="#enquire" className="btn btn-outline !border-white/25 !text-white hover:!bg-white/10">
          <Send className="h-4 w-4" aria-hidden />
          Enquire about this course
        </Link>
        <Link href="/documents/prospectus-2027-28.txt" download className="btn btn-outline !border-white/25 !text-white hover:!bg-white/10">
          <Download className="h-4 w-4" aria-hidden />
          Prospectus
        </Link>
      </PageHeader>

      <div className="container-page grid gap-10 py-14 lg:grid-cols-[1fr_330px] lg:py-20">
        {/* ---------------- main column ---------------- */}
        <div className="min-w-0 space-y-16">
          {/* overview */}
          <section>
            <SectionHeading index="01" eyebrow="Overview" title="About this programme" />
            <div className="overflow-hidden rounded-[2rem] border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={course.image} alt={`${course.name} students at work`} className="aspect-[16/8] w-full" />
            </div>
            <div className="prose-univ mt-7">{course.description || course.overview}</div>

            <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {specs.map((spec) => (
                <div key={spec.label} className="rounded-2xl border border-line bg-paper p-4">
                  <dt className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-body">
                    <spec.icon className="h-3.5 w-3.5 text-royal" aria-hidden />
                    {spec.label}
                  </dt>
                  <dd className="mt-1.5 font-display text-lg font-semibold text-navy">{spec.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* outcomes */}
          {outcomes.length > 0 ? (
            <section>
              <SectionHeading index="02" eyebrow="Learning Outcomes" title="What you will be able to do" />
              <ul className="grid gap-3 sm:grid-cols-2">
                {outcomes.map((outcome) => (
                  <li key={outcome} className="flex gap-3 rounded-2xl border border-line bg-paper p-4">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
                    <span className="text-sm leading-relaxed text-slate-body">{outcome}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* curriculum */}
          {curriculum.length > 0 ? (
            <section id="curriculum">
              <SectionHeading
                index="03"
                eyebrow="Curriculum"
                title="Semester structure"
                description="Indicative structure — module names may be revised during the annual curriculum review."
              />
              <Accordion
                items={curriculum.map((entry) => ({
                  title: entry.semester,
                  meta: `${entry.subjects.length} modules`,
                  content: (
                    <ul className="grid gap-2 sm:grid-cols-2">
                      {entry.subjects.map((subject) => (
                        <li key={subject} className="flex items-start gap-2 text-sm text-slate-body">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden />
                          {subject}
                        </li>
                      ))}
                    </ul>
                  ),
                }))}
                allowMultiple
                defaultOpen={0}
              />
            </section>
          ) : null}

          {/* eligibility & admission */}
          <section id="eligibility">
            <SectionHeading index="04" eyebrow="Eligibility" title="Admission requirements" />
            <div className="grid gap-5 md:grid-cols-2">
              <div className="rounded-3xl border border-line bg-paper p-6">
                <p className="flex items-center gap-2 text-[0.7rem] font-extrabold uppercase tracking-[0.18em] text-royal">
                  <BadgeCheck className="h-4 w-4" aria-hidden />
                  Eligibility criteria
                </p>
                <p className="mt-3 text-sm leading-relaxed text-slate-body">{course.eligibility}</p>
                <ul className="mt-5 space-y-2.5">
                  {[
                    "Last qualifying mark sheet",
                    "Transfer / migration certificate",
                    "Identity proof and photograph",
                    "Category certificate, if applicable",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-navy">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-3xl border border-line bg-navy p-6 text-white">
                <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.18em] text-gold">Key dates</p>
                <ul className="mt-4 space-y-4">
                  {(sessions.length ? sessions : [{ id: 0, name: "2027–28", application_deadline: "2027-07-31" }]).map(
                    (session) => (
                      <li key={session.id} className="flex items-start justify-between gap-4 border-b border-white/10 pb-4 last:border-0 last:pb-0">
                        <span>
                          <span className="block text-sm font-bold">{session.name} session</span>
                          <span className="block text-xs text-white/60">Applications close</span>
                        </span>
                        <span className="font-display text-lg font-semibold text-gold">
                          {session.application_deadline}
                        </span>
                      </li>
                    ),
                  )}
                </ul>
                <div className="mt-5 rounded-2xl bg-white/5 p-4 text-xs leading-relaxed text-white/70">
                  Fees: {course.fee_note || "Payable semester-wise."}{" "}
                  {course.scholarship_info ? (
                    <>
                      <span className="mt-2 block text-gold">{course.scholarship_info}</span>
                    </>
                  ) : null}
                </div>
                <Link href="/admissions" className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-gold hover:underline">
                  Full admission process
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            </div>
          </section>

          {/* careers */}
          {careers.length > 0 ? (
            <section>
              <SectionHeading index="05" eyebrow="Careers" title="Where graduates go" />
              <div className="flex flex-wrap gap-2.5">
                {careers.map((career) => (
                  <span key={career} className="rounded-full border border-line bg-paper px-4 py-2 text-sm font-semibold text-navy">
                    {career}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-xs text-slate-body">
                Career pathways shown are illustrative for this demo; placement support is described on the
                <Link href="/placements" className="font-bold text-royal hover:underline"> placements page</Link>.
              </p>
            </section>
          ) : null}

          {/* faculty */}
          {faculty.length > 0 ? (
            <section>
              <SectionHeading
                index="06"
                eyebrow="Faculty"
                title="Who teaches this programme"
                action={
                  <Link href="/faculty" className="btn btn-outline btn-sm">
                    Faculty directory
                  </Link>
                }
              />
              <div className="grid gap-5 sm:grid-cols-3">
                {faculty.map((member, index) => (
                  <Reveal key={member.id} delay={index * 60}>
                    <FacultyCard member={member} />
                  </Reveal>
                ))}
              </div>
            </section>
          ) : null}

          {/* facilities */}
          <section>
            <SectionHeading index="07" eyebrow="Facilities" title="Supporting your studies" />
            <div className="grid gap-4 sm:grid-cols-2">
              {facilities.map((facility) => (
                <div key={facility.title} className="flex gap-4 rounded-3xl border border-line bg-paper p-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-navy text-gold">
                    <facility.icon className="h-4 w-4" aria-hidden />
                  </span>
                  <div>
                    <h3 className="text-[15px] font-bold text-navy">{facility.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-body">{facility.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* course FAQs */}
          {courseFaqs.length > 0 ? (
            <section>
              <SectionHeading index="08" eyebrow="FAQ" title="Questions about this programme" />
              <Accordion
                items={courseFaqs.map((faq) => ({ title: faq.q, content: <p>{faq.a}</p> }))}
                defaultOpen={null}
              />
              <p className="mt-4 text-sm text-slate-body">
                More questions? Browse the <Link href="/faqs" className="font-bold text-royal hover:underline">full FAQ</Link> or
                <Link href="/contact" className="font-bold text-royal hover:underline"> contact admissions</Link>.
              </p>
            </section>
          ) : null}

          {/* enquiry */}
          <section id="enquire" className="scroll-mt-32 rounded-[2rem] border border-line bg-paper p-6 sm:p-8">
            <EnquiryForm
              courses={allCourses}
              defaultCourseId={course.id}
              source="Website"
              sourcePage={`/courses/${course.slug}`}
              title={`Enquire about ${course.name}`}
              intro="Your message is routed directly to the admission counsellor for this programme."
            />
          </section>
        </div>

        {/* ---------------- side rail ---------------- */}
        <aside className="lg:sticky lg:top-32 lg:self-start">
          <div className="overflow-hidden rounded-3xl border border-line bg-paper">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={course.image} alt="" className="aspect-[16/10] w-full" />
            <div className="p-5">
              <Badge tone="gold">{course.degree_level}</Badge>
              <p className="mt-3 font-display text-lg font-semibold leading-snug text-navy">{course.name}</p>
              <dl className="mt-4 space-y-2.5 text-sm">
                {[
                  ["Department", course.department_name ?? "—"],
                  ["Duration", course.duration_label],
                  ["Mode", course.study_mode],
                  ["Eligibility", course.eligibility.slice(0, 90) + (course.eligibility.length > 90 ? "…" : "")],
                  ["Fee", course.fee_amount ? `${formatCurrency(course.fee_amount)} / semester` : "On request"],
                ].map(([label, value]) => (
                  <div key={label} className="flex gap-3 border-b border-line pb-2.5 last:border-0 last:pb-0">
                    <dt className="w-24 shrink-0 text-[11px] font-bold uppercase tracking-wide text-slate-body">{label}</dt>
                    <dd className="min-w-0 flex-1 text-[13px] text-navy">{value}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-5 space-y-2">
                <Link href="/admissions/apply" className="btn btn-gold w-full">
                  Apply Now
                </Link>
                <Link href="#enquire" className="btn btn-primary w-full">
                  Enquire about this course
                </Link>
                <Link href="/documents/prospectus-2027-28.txt" download className="btn btn-outline w-full">
                  <Download className="h-4 w-4" aria-hidden />
                  Download prospectus
                </Link>
              </div>

              <p className="mt-4 flex items-start gap-2 rounded-xl bg-offwhite p-3 text-[11px] leading-relaxed text-slate-body">
                <Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-royal" aria-hidden />
                Admission desk: {getSetting("admission_helpline")} · {getSetting("admission_email")}
              </p>
            </div>
          </div>

          {related.length > 0 ? (
            <div className="mt-6">
              <p className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-navy">
                <Quote className="h-4 w-4 text-gold" aria-hidden />
                Related programmes
              </p>
              <ul className="space-y-3">
                {related.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/courses/${item.slug}`}
                      className="group flex items-center gap-3 rounded-2xl border border-line bg-paper p-3 transition hover:border-royal/50"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.image} alt="" className="h-14 w-16 shrink-0 rounded-xl object-cover" />
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] font-bold text-navy group-hover:text-royal">{item.name}</span>
                        <span className="block text-[11px] text-slate-body">
                          {item.duration_label} · {item.study_mode}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>
      </div>

      {/* bottom CTA */}
      <section className="border-t border-line bg-paper">
        <div className="container-page flex flex-col items-center gap-6 py-16 text-center">
          <h2 className="max-w-2xl text-[clamp(1.6rem,3.4vw,2.5rem)] leading-tight text-navy">
            Ready to begin your application?
          </h2>
          <p className="max-w-xl text-sm text-slate-body">
            Six short steps, a reference number at the end, and full visibility of every update from there.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button href="/admissions/apply" variant="gold" size="lg">
              Start application
            </Button>
            <Button href="/admissions" variant="outline" size="lg">
              <FileText className="h-4 w-4" aria-hidden />
              Admission details
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
