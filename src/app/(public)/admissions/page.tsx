import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Download,
  FileText,
  GraduationCap,
  HelpCircle,
  Send,
  Wallet,
} from "lucide-react";
import { PageHeader, SectionHeading } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion } from "@/components/public/accordion";
import { EnquiryForm } from "@/components/public/enquiry-form";
import { getAcademicSessions, getDownloads, getFaqs, getPublishedCourses } from "@/lib/content";
import { formatCurrency } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admissions",
  description:
    "Admission overview, eligibility, important dates, documents, fees, scholarships and the online application for Aarohan Institute of Higher Education.",
};

const PROCESS = [
  { title: "Explore programmes", text: "Compare eligibility, duration, curriculum and fees on the courses pages.", href: "/courses" },
  { title: "Submit an enquiry or application", text: "Send an enquiry for a call back, or complete the six-step online application.", href: "/admissions/apply" },
  { title: "Document submission & verification", text: "Upload mark sheets, identity proof and photographs; originals are verified at the desk.", href: "#documents" },
  { title: "Counselling & decision", text: "A counsellor confirms programme fit, scholarships and fee planning.", href: "#dates" },
  { title: "Offer & enrolment", text: "Confirm your seat by completing fee payment to receive an enrolment confirmation.", href: "/admissions/track" },
];

const DOCUMENTS = [
  { title: "Recent photograph", detail: "JPEG or PNG, under 2 MB" },
  { title: "Identity proof", detail: "Aadhaar, passport or school ID — PDF/JPG under 5 MB" },
  { title: "Last qualifying mark sheet", detail: "PDF or clear photograph under 5 MB" },
  { title: "Transfer / migration certificate", detail: "From the last institution attended" },
  { title: "Category certificate", detail: "Only if claiming reservation or a concession" },
  { title: "Character certificate", detail: "From the last institution attended" },
];

const ELIGIBILITY = [
  { level: "Undergraduate", criteria: "10+2 with a minimum of 50% aggregate (45% for reserved categories as per institute norms)" },
  { level: "Postgraduate", criteria: "Bachelor's degree with 50–55% aggregate in a relevant discipline" },
  { level: "Diploma", criteria: "10+2 with Biology or Chemistry, minimum 45% aggregate; minimum age 17 years" },
  { level: "Design programmes", criteria: "10+2 in any stream plus a portfolio review or studio aptitude exercise" },
];

export default function AdmissionsPage() {
  const sessions = getAcademicSessions();
  const courses = getPublishedCourses();
  const faqs = getFaqs("Admissions");
  const downloads = getDownloads();
  const allCourses = courses.map((course) => ({ id: course.id, name: course.name }));
  const openSessions = sessions.filter((session) => session.status !== "closed");

  return (
    <>
      <PageHeader
        eyebrow="Admissions 2027–28"
        title="Your admission, step by step"
        description="Everything required to apply — eligibility, dates, documents, fees and scholarships — with a trackable online application and a counsellor at every stage."
        breadcrumbs={[{ label: "Admissions" }]}
        meta={[
          { label: "Window", value: "Jun 26 – Jul 27" },
          { label: "Programmes", value: String(courses.length) },
          { label: "Steps", value: "6 steps" },
          { label: "Support", value: "Mon–Sat" },
        ]}
      >
        <Link href="/admissions/apply" className="btn btn-gold">
          <GraduationCap className="h-4 w-4" aria-hidden />
          Apply Now
        </Link>
        <Link href="/admissions/track" className="btn btn-outline !border-white/25 !text-white hover:!bg-white/10">
          Track application
        </Link>
        <Link href="/documents/prospectus-2027-28.txt" download className="btn btn-outline !border-white/25 !text-white hover:!bg-white/10">
          <Download className="h-4 w-4" aria-hidden />
          Prospectus
        </Link>
      </PageHeader>

      {/* overview + process */}
      <section className="container-page py-16 md:py-24">
        <SectionHeading
          index="01"
          eyebrow="How admission works"
          title="Five stages, fully transparent"
          description="Each stage updates your application status. Use your reference number to check progress at any time."
        />
        <ol className="relative grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          {PROCESS.map((step, index) => (
            <Reveal key={step.title} delay={index * 60}>
              <li className="h-full rounded-3xl border border-line bg-paper p-5">
                <span className="section-index">{String(index + 1).padStart(2, "0")}</span>
                <h3 className="mt-3 text-[15px] font-bold leading-snug text-navy">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-body">{step.text}</p>
                <Link href={step.href} className="link-sweep mt-3 inline-block text-xs font-bold text-royal">
                  Go to step →
                </Link>
              </li>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* programmes */}
      <section className="border-y border-line bg-paper py-16 md:py-24">
        <div className="container-page">
          <SectionHeading
            index="02"
            eyebrow="Programmes open for application"
            title="Choose your programme"
            description="All published programmes currently accept applications for the 2027–28 session."
            action={
              <Link href="/courses" className="btn btn-outline">
                Full course catalogue
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            }
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <div key={course.id} className="flex items-center gap-4 rounded-3xl border border-line bg-offwhite/60 p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={course.image} alt="" loading="lazy" className="h-16 w-20 shrink-0 rounded-2xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-navy">{course.name}</p>
                  <p className="text-[11px] text-slate-body">
                    {course.degree_level} · {course.duration_label} · {formatCurrency(course.fee_amount)}/sem
                  </p>
                  <div className="mt-2 flex gap-2">
                    <Link href={`/courses/${course.slug}`} className="text-[11px] font-bold text-royal hover:underline">
                      Details
                    </Link>
                    <Link href="/admissions/apply" className="text-[11px] font-bold text-gold-700 hover:underline">
                      Apply →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* dates + eligibility */}
      <section id="dates" className="container-page scroll-mt-32 py-16 md:py-24">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading index="03" align="left" eyebrow="Important Dates" title="Admission calendar" />
            <div className="overflow-hidden rounded-3xl border border-line bg-paper">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-offwhite text-left text-[11px] uppercase tracking-wider text-navy">
                    <th className="px-5 py-3 font-bold">Session</th>
                    <th className="px-5 py-3 font-bold">Opens</th>
                    <th className="px-5 py-3 font-bold">Closes</th>
                    <th className="px-5 py-3 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
                    <tr key={session.id} className="border-t border-line">
                      <td className="px-5 py-3.5 font-bold text-navy">{session.name}</td>
                      <td className="px-5 py-3.5 text-slate-body">{session.start_date}</td>
                      <td className="px-5 py-3.5 text-slate-body">{session.application_deadline}</td>
                      <td className="px-5 py-3.5">
                        <Badge tone={session.status === "open" ? "success" : session.status === "upcoming" ? "info" : "neutral"}>
                          {session.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 flex items-start gap-2 text-xs text-slate-body">
              <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0 text-royal" aria-hidden />
              Dates are maintained from Admin → Academics → Sessions and shown here automatically.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                { label: "Counselling", value: "Mon – Sat, 9 AM – 5:30 PM" },
                { label: "Document desk", value: "By appointment" },
                { label: "Helpline", value: "+91 98200 41127" },
                { label: "Email", value: "admissions@aarohan-institute.edu" },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-line bg-paper p-4">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-body">{item.label}</p>
                  <p className="mt-1 text-sm font-semibold text-navy">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <SectionHeading index="04" align="left" eyebrow="Eligibility" title="Who can apply" />
            <div className="overflow-hidden rounded-3xl border border-line bg-paper">
              <ul className="divide-y divide-line">
                {ELIGIBILITY.map((item) => (
                  <li key={item.level} className="px-5 py-4">
                    <p className="font-ui text-sm font-bold text-navy">{item.level}</p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-body">{item.criteria}</p>
                  </li>
                ))}
              </ul>
            </div>
            <p className="mt-3 text-xs text-slate-body">
              Programme-specific criteria always take precedence — check the individual course page before applying.
            </p>
          </div>
        </div>
      </section>

      {/* documents */}
      <section id="documents" className="scroll-mt-32 bg-navy py-16 text-white md:py-24">
        <div className="container-page">
          <SectionHeading
            index="05"
            eyebrow="Documents"
            title={<span className="text-white">What you need to upload</span>}
            description={<span className="text-white/65">Keep these ready before you start the application — the form accepts JPEG, PNG and PDF only.</span>}
          />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {DOCUMENTS.map((document, index) => (
              <Reveal key={document.title} delay={index * 55}>
                <li className="h-full rounded-3xl border border-white/10 bg-white/[0.045] p-5">
                  <CheckCircle2 className="h-5 w-5 text-gold" aria-hidden />
                  <p className="mt-3 text-[15px] font-bold text-white">{document.title}</p>
                  <p className="mt-1.5 text-sm text-white/60">{document.detail}</p>
                </li>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* fees + scholarships */}
      <section className="container-page py-16 md:py-24">
        <SectionHeading
          index="06"
          eyebrow="Fees & Scholarships"
          title="Fee structure at a glance"
          description="Per-semester tuition for published programmes. Other charges are listed in the prospectus."
        />
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Programme</th>
                <th>Level</th>
                <th>Duration</th>
                <th>Mode</th>
                <th className="text-right">Tuition / semester</th>
                <th>Scholarship</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.id}>
                  <td>
                    <Link href={`/courses/${course.slug}`} className="font-semibold text-navy hover:text-royal">
                      {course.name}
                    </Link>
                  </td>
                  <td>{course.degree_level}</td>
                  <td>{course.duration_label}</td>
                  <td>{course.study_mode}</td>
                  <td className="text-right font-semibold text-navy">{formatCurrency(course.fee_amount)}</td>
                  <td className="max-w-[260px] text-xs text-slate-body">{course.scholarship_info || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button href="/scholarships" variant="navy">
            <Wallet className="h-4 w-4" aria-hidden />
            Scholarship details
          </Button>
          <Button href="/downloads" variant="outline">
            <FileText className="h-4 w-4" aria-hidden />
            Fee structure document
          </Button>
        </div>
      </section>

      {/* FAQ + prospectus */}
      <section className="border-y border-line bg-paper py-16 md:py-24">
        <div className="container-page grid gap-10 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <SectionHeading index="07" align="left" eyebrow="FAQ" title="Admission questions" />
            <Accordion
              items={faqs.map((faq) => ({ title: faq.question, content: <p>{faq.answer}</p> }))}
              defaultOpen={0}
            />
            <Link href="/faqs" className="link-sweep mt-5 inline-block text-sm font-bold text-navy">
              All frequently asked questions →
            </Link>
          </div>

          <div className="rounded-3xl border border-gold/60 bg-gold-100/60 p-6">
            <p className="flex items-center gap-2 text-[0.7rem] font-extrabold uppercase tracking-[0.2em] text-gold-700">
              <Download className="h-4 w-4" aria-hidden />
              Prospectus
            </p>
            <h3 className="mt-3 text-xl font-bold text-navy">Institute prospectus 2027–28</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-body">
              Programmes, campus, facilities, admission process and fee overview — one document, downloadable for
              offline reading.
            </p>
            <ul className="mt-4 space-y-2">
              {downloads.slice(0, 4).map((download) => (
                <li key={download.id} className="flex items-center justify-between gap-3 rounded-2xl bg-paper px-4 py-3">
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-bold text-navy">{download.title}</span>
                    <span className="block text-[11px] text-slate-body">{download.category}</span>
                  </span>
                  <Link href={download.file_path || "/downloads"} download={Boolean(download.file_path)} className="text-xs font-bold text-royal hover:underline">
                    Download
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-4 flex items-start gap-2 text-[11px] leading-relaxed text-slate-body">
              <HelpCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-700" aria-hidden />
              Demo documents — replace with the institute&apos;s approved prospectus before launch.
            </p>
          </div>
        </div>
      </section>

      {/* enquiry + apply */}
      <section id="enquiry" className="container-page scroll-mt-32 py-16 md:py-24">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-line bg-paper p-6 sm:p-8">
            <EnquiryForm
              courses={allCourses}
              source="Website"
              sourcePage="/admissions"
              title="Talk to an admission counsellor"
              intro="Ask about eligibility, scholarships, hostels or the application process."
            />
          </div>

          <div className="relative isolate overflow-hidden rounded-[2rem] bg-navy p-7 text-white sm:p-9">
            <div className="absolute inset-0 grid-lines-light opacity-50" aria-hidden />
            <div className="relative">
              <ClipboardList className="h-8 w-8 text-gold" aria-hidden />
              <h2 className="mt-5 text-[clamp(1.6rem,3vw,2.3rem)] leading-tight text-white">
                Ready? The application takes about ten minutes.
              </h2>
              <ul className="mt-6 space-y-3">
                {[
                  "Personal, academic and programme details",
                  "Address and document uploads",
                  "Review, declaration and submit",
                  "Instant reference number for tracking",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-white/75">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/admissions/apply" className="btn btn-gold btn-lg">
                  <GraduationCap className="h-4 w-4" aria-hidden />
                  Start your application
                </Link>
                <Link
                  href="/admissions/track"
                  className="btn btn-outline btn-lg !border-white/25 !text-white hover:!bg-white/10"
                >
                  Track status
                </Link>
              </div>
              <p className="mt-5 flex items-center gap-2 text-xs text-white/55">
                <Send className="h-3.5 w-3.5" aria-hidden />
                Confirmation email is sent when an email provider is configured.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
