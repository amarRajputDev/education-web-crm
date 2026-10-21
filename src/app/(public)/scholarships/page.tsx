import Link from "next/link";
import {
  ArrowRight,
  Award,
  BadgeIndianRupee,
  CalendarClock,
  ClipboardList,
  FileCheck2,
  HelpCircle,
  Shield,
  Sparkles,
  Wallet,
} from "lucide-react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { PageHeader, SectionHeading } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { getDb } from "@/lib/db";
import { getFaqs, getPublishedCourses } from "@/lib/content";
import { formatCurrency } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Scholarships & Financial Aid",
  description:
    "Merit, need-based, early-bird and sibling concessions at Aarohan Institute of Higher Education — eligibility, programme-wise scholarship notes, documents and application steps.",
};

const CATEGORIES = [
  {
    icon: Award,
    title: "Merit scholarships",
    tag: "Academic performance",
    text: "Tuition concessions for students with consistently strong academic records.",
    points: [
      "85% or above in 10+2 (or equivalent) for undergraduate admissions",
      "70% or above in the qualifying degree for postgraduate admissions",
      "Programme-specific test or portfolio scores where the page mentions them",
      "Renewed each semester on maintaining the programme's minimum performance norm",
    ],
  },
  {
    icon: Wallet,
    title: "Need-based financial aid",
    tag: "Family income",
    text: "Confidential support for verified families facing genuine financial constraints.",
    points: [
      "Family annual income within the published institute threshold (demo: ₹4,50,000)",
      "Government-issued income certificate submitted with the application",
      "Covers up to 30% of tuition, assessed by the financial aid committee",
      "Reviewed confidentially — supporting details are never shared with other students",
    ],
  },
  {
    icon: CalendarClock,
    title: "Early-bird concession",
    tag: "Application timing",
    text: "A straightforward discount for applicants who complete formalities early.",
    points: [
      "10% of the tuition fee for applications completed before the first counselling window",
      "Available across all six schools for the 2027–28 session",
      "Applied directly on the first fee invoice after the offer is accepted",
      "Cannot be clubbed with another tuition concession of the same type",
    ],
  },
  {
    icon: Shield,
    title: "Sibling & defence-ward concession",
    tag: "Family & service",
    text: "Recognising families with more than one student, and those in public service.",
    points: [
      "10% tuition concession for a second sibling enrolled or previously enrolled at Aarohan",
      "10% for children of serving or retired defence and paramilitary personnel",
      "Proof required: sibling institute ID or fee receipt; service record or discharge book",
      "Confirmed at counselling and adjusted semester-wise while eligibility continues",
    ],
  },
];

const DOCUMENTS = [
  { title: "Qualifying mark sheets", text: "10+2 and graduation statements, as applicable to the programme." },
  { title: "Income certificate", text: "Government-issued certificate for need-based financial aid requests." },
  { title: "Category certificate", text: "Valid reservation or category document, if claiming under institute norms." },
  { title: "Defence service record", text: "Service certificate or discharge book for defence-ward concessions." },
  { title: "Sibling proof", text: "Institute ID card or fee receipt of the sibling studying at Aarohan." },
  { title: "Recent photograph", text: "The same passport-size photograph uploaded with the application form." },
];

const STEPS = [
  {
    title: "Review the categories",
    text: "Compare merit, need-based, early-bird and family concessions against your profile and your programme page.",
  },
  {
    title: "Submit your application",
    text: "Complete the online application (or send an enquiry) and mention the scholarship you wish to be considered for.",
  },
  {
    title: "Upload supporting documents",
    text: "Attach mark sheets and the specific proof for your category — income, category, defence or sibling documents.",
  },
  {
    title: "Verification at counselling",
    text: "Bring originals to the counselling session; the admissions desk verifies records before any award is confirmed.",
  },
  {
    title: "Award letter & fee adjustment",
    text: "Approved concessions are issued in writing and adjusted on the tuition invoice for the relevant semester.",
  },
];

function scholarshipNotes() {
  try {
    const rows = getDb()
      .prepare(
        `SELECT name, degree_level, fee_amount, scholarship_info
           FROM courses WHERE status = 'published' ORDER BY degree_level, name`,
      )
      .all() as { name: string; degree_level: string; fee_amount: number; scholarship_info: string }[];
    return new Map(rows.map((row) => [row.name, row]));
  } catch {
    return new Map<string, { name: string; degree_level: string; fee_amount: number; scholarship_info: string }>();
  }
}

export default function ScholarshipsPage() {
  const courses = getPublishedCourses();
  const notes = scholarshipNotes();
  const faqs = getFaqs()
    .filter((faq) => /scholarship|fee/i.test(faq.category) || /scholarship|fee|installment/i.test(faq.question))
    .slice(0, 3);

  return (
    <>
      <PageHeader
        eyebrow="Financial Aid"
        title="Scholarships that reward merit and ease burden"
        description="Four concession categories, programme-wise scholarship notes and a transparent five-step award process — so families can plan the full cost of a degree before applying."
        breadcrumbs={<Breadcrumbs items={[{ label: "Scholarships" }]} />}
        meta={[
          { label: "Categories", value: "4" },
          { label: "Programmes", value: String(courses.length) },
          { label: "Session", value: "2027–28" },
          { label: "Awards by", value: "Counselling" },
        ]}
      >
        <Link href="/admissions/apply" className="btn btn-gold">
          Apply for admission
        </Link>
        <Link href="/downloads" className="btn btn-outline !border-white/25 !text-white hover:!bg-white/10">
          Fee structure (PDF)
        </Link>
      </PageHeader>

      {/* intro */}
      <section id="overview" className="container-page scroll-mt-32 py-16 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div>
            <SectionHeading
              index="01"
              eyebrow="Overview"
              title="Financial support, decided on evidence"
              description="Aarohan awards concessions on documented merit and genuine need — never on informal influence. Every award is written down, communicated in advance and adjusted openly on the fee invoice."
            />
            <div className="prose-univ">
              <p>
                Tuition fees are payable semester-wise, and approved scholarships are adjusted against the invoice for
                the semester in which they are granted. Families may also request a staged payment plan from the
                accounts office at the time of admission.
              </p>
              <p>
                Award decisions are made during counselling after documents are verified. Nothing on this page is a
                promise of an award — the figures and thresholds are <strong>demo content</strong> prepared for this
                demonstration website and must be replaced with the institute&rsquo;s approved policy before launch.
              </p>
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/admissions/apply" className="btn btn-navy">
                Start your application
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link href="/contact" className="btn btn-outline">
                Ask about aid
              </Link>
            </div>
          </div>

          <Reveal className="relative">
            <div className="overflow-hidden rounded-[2.5rem] border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/graduation.jpg"
                alt="Graduating students at the institute's convocation ceremony"
                loading="lazy"
                className="aspect-[4/3] w-full"
              />
            </div>
            <div className="absolute -bottom-6 -left-4 hidden rounded-2xl border border-line bg-paper px-5 py-4 shadow-[var(--shadow-card)] sm:block">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-body">Demo data</p>
              <p className="mt-1 font-display text-base font-semibold text-navy">
                Sample thresholds and percentages for illustration
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* categories */}
      <section id="categories" className="scroll-mt-32 border-y border-line bg-paper py-16 md:py-24">
        <div className="container-page">
          <SectionHeading
            index="02"
            eyebrow="Concession Categories"
            title="Four ways fees come down"
            description="Eligibility is evaluated per applicant. Where two concessions apply, the higher single award is normally considered unless stated otherwise."
          />
          <div className="grid gap-6 sm:grid-cols-2">
            {CATEGORIES.map((category, index) => (
              <Reveal key={category.title} delay={index * 70}>
                <article className="card flex h-full flex-col p-7">
                  <div className="flex items-start justify-between gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-navy text-gold">
                      <category.icon className="h-5 w-5" aria-hidden />
                    </span>
                    <Badge tone="gold">{category.tag}</Badge>
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-navy">{category.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-body">{category.text}</p>
                  <ul className="mt-4 space-y-2.5 border-t border-line pt-4">
                    {category.points.map((point) => (
                      <li key={point} className="flex items-start gap-2.5 text-sm leading-relaxed text-navy/85">
                        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-700" aria-hidden />
                        {point}
                      </li>
                    ))}
                  </ul>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* programme-wise table */}
      <section id="programme-fees" className="container-page scroll-mt-32 py-16 md:py-24">
        <SectionHeading
          index="03"
          eyebrow="Programme-wise"
          title="Fee and scholarship notes by programme"
          description="Published tuition fees per semester alongside the scholarship note recorded for each programme."
          action={
            <Link href="/courses" className="btn btn-outline btn-sm">
              Full programme details
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          }
        />

        {courses.length === 0 ? (
          <EmptyState
            title="No programmes published yet"
            description="Fee and scholarship information will appear here once programmes are published from the admin panel."
            icon="document"
          />
        ) : (
          <>
            <div className="table-shell">
              <table className="data-table">
                <caption className="sr-only">
                  Programme, degree level, per-semester tuition fee and scholarship information
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Programme</th>
                    <th scope="col">Degree level</th>
                    <th scope="col">Tuition / semester</th>
                    <th scope="col">Scholarship information</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course) => {
                    const note = notes.get(course.name);
                    return (
                      <tr key={course.slug}>
                        <td>
                          <Link href={`/courses/${course.slug}`} className="link-sweep font-semibold text-navy hover:text-royal">
                            {course.name}
                          </Link>
                          <span className="mt-0.5 block text-[11px] text-slate-body">{course.duration_label}</span>
                        </td>
                        <td>{course.degree_level}</td>
                        <td className="whitespace-nowrap font-semibold text-navy">
                          {formatCurrency(course.fee_amount)}
                        </td>
                        <td className="min-w-[280px]">
                          {note?.scholarship_info?.trim() ? (
                            <span className="flex items-start gap-2">
                              <BadgeIndianRupee className="mt-0.5 h-3.5 w-3.5 shrink-0 text-royal" aria-hidden />
                              <span>{note.scholarship_info}</span>
                            </span>
                          ) : (
                            <span className="text-slate-body">
                              Merit and need-based concessions applicable — confirm the current offer with the
                              admissions office.
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-[11px] leading-relaxed text-slate-body">
              Fees shown are sample figures for this demo website. Official fee structure, one-time charges and the
              refund policy are published in the downloadable fee structure document.
            </p>
          </>
        )}
      </section>

      {/* application steps */}
      <section id="how-to-apply" className="scroll-mt-32 bg-navy py-16 text-white md:py-24">
        <div className="container-page">
          <SectionHeading
            index="04"
            eyebrow="How to Apply"
            title={<span className="text-white">Five steps to a scholarship decision</span>}
            description={
              <span className="text-white/65">
                Keep documents ready before counselling — decisions are quicker when verification happens in one visit.
              </span>
            }
          />
          <ol className="relative grid gap-6 md:grid-cols-2 lg:grid-cols-5">
            {STEPS.map((step, index) => (
              <Reveal key={step.title} delay={index * 70}>
                <li className="h-full rounded-3xl border border-white/10 bg-white/[0.045] p-6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/40 font-display text-lg font-semibold text-gold">
                    {index + 1}
                  </span>
                  <h3 className="mt-4 text-[15px] font-bold text-white">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/65">{step.text}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* documents */}
      <section id="documents" className="container-page scroll-mt-32 py-16 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr] lg:items-start">
          <SectionHeading
            index="05"
            eyebrow="Document Checklist"
            title="Keep these ready"
            description="Upload scans with the application and carry the originals to counselling for verification."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {DOCUMENTS.map((document, index) => (
              <Reveal key={document.title} delay={index * 55}>
                <div className="flex h-full gap-3.5 rounded-2xl border border-line bg-paper p-5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-royal-100 text-royal">
                    <FileCheck2 className="h-4 w-4" aria-hidden />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-navy">{document.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-body">{document.text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ excerpt */}
      <section className="border-y border-line bg-paper py-16 md:py-24">
        <div className="container-page">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:items-start">
            <SectionHeading
              index="06"
              eyebrow="Quick Answers"
              title="Scholarship questions we hear often"
              action={
                <Link href="/faqs" className="btn btn-outline btn-sm">
                  <HelpCircle className="h-4 w-4" aria-hidden />
                  All FAQs
                </Link>
              }
            />
            {faqs.length === 0 ? (
              <EmptyState title="No FAQs published yet" compact icon="document" />
            ) : (
              <dl className="divide-y divide-line overflow-hidden rounded-3xl border border-line bg-offwhite/60">
                {faqs.map((faq, index) => (
                  <Reveal key={faq.id} delay={index * 60} as="div" className="px-6 py-5">
                    <dt className="text-[15px] font-bold text-navy">{faq.question}</dt>
                    <dd className="mt-2 text-sm leading-relaxed text-slate-body">{faq.answer}</dd>
                  </Reveal>
                ))}
              </dl>
            )}
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
                <ClipboardList className="h-3.5 w-3.5" aria-hidden />
                Admissions 2027–28
              </p>
              <h2 className="mt-4 text-[clamp(1.7rem,3.2vw,2.5rem)] leading-tight text-white">
                Apply first — <span className="italic text-gold">scholarships are decided at counselling.</span>
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/65">
                Submit the six-step application with your documents, then discuss the concession you are eligible for
                with the counselling team. You will receive a written award decision before the fee is due.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 md:justify-end">
              <Link href="/admissions/apply" className="btn btn-gold">
                <Award className="h-4 w-4" aria-hidden />
                Start application
              </Link>
              <Link href="/contact" className="btn btn-outline !border-white/25 !text-white hover:!bg-white/10">
                Talk to admissions
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
