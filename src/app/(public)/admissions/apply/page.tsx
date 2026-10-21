import { PageHeader, SectionHeading } from "@/components/ui/section";
import { ApplicationWizard } from "@/components/public/application-wizard";
import { getPublishedCourses, getAcademicSessions } from "@/lib/content";
import Link from "next/link";
import { CheckCircle2, Phone, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Apply Online",
  description:
    "Six-step online admission application for Aarohan Institute of Higher Education — personal, academic, programme, address, documents and review.",
};

export default function ApplyPage() {
  const courses = getPublishedCourses().map((course) => ({
    id: course.id,
    name: course.name,
    department: course.department_name ?? "General",
    duration: course.duration_label,
    mode: course.study_mode,
  }));

  const sessions = getAcademicSessions()
    .filter((session) => session.status !== "closed")
    .map((session) => ({
      id: session.id,
      name: session.name,
      deadline: session.application_deadline,
    }));

  return (
    <>
      <PageHeader
        eyebrow="Online Admission"
        title="Application form"
        description="Six short steps — personal details, academics, programme choice, address, documents and review. You will receive a unique reference number on submission."
        breadcrumbs={[{ label: "Admissions", href: "/admissions" }, { label: "Apply Online" }]}
        meta={[
          { label: "Steps", value: "6" },
          { label: "Time needed", value: "~10 min" },
          { label: "Sessions open", value: String(sessions.length) },
          { label: "Programmes", value: String(courses.length) },
        ]}
      >
        <Link href="/admissions/track" className="btn btn-gold">
          Track an application
        </Link>
        <Link href="/admissions" className="btn btn-outline !border-white/25 !text-white hover:!bg-white/10">
          Admission details
        </Link>
      </PageHeader>

      <section className="container-page py-12 md:py-16">
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {[
            { icon: CheckCircle2, title: "Autosaved as you go", text: "Move between steps freely — nothing is lost while you navigate." },
            { icon: ShieldCheck, title: "Private document storage", text: "Uploads are stored with restricted access, never as public links." },
            { icon: Phone, title: "Help while you apply", text: "Call +91 98200 41127 if anything on this form is unclear." },
          ].map((item) => (
            <div key={item.title} className="flex gap-3 rounded-2xl border border-line bg-paper p-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy text-gold">
                <item.icon className="h-4 w-4" aria-hidden />
              </span>
              <div>
                <p className="text-[13px] font-bold text-navy">{item.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-body">{item.text}</p>
              </div>
            </div>
          ))}
        </div>

        {courses.length === 0 || sessions.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gold/70 bg-gold-100/50 p-8 text-center">
            <p className="font-bold text-navy">Applications are not open right now.</p>
            <p className="mt-2 text-sm text-slate-body">
              No published programme or open session is available. Please check the admissions page or contact the
              admission desk.
            </p>
            <Link href="/admissions" className="btn btn-navy mt-5">
              Admission overview
            </Link>
          </div>
        ) : (
          <ApplicationWizard courses={courses} sessions={sessions} />
        )}

        <div className="mt-10 rounded-3xl border border-line bg-paper p-6">
          <SectionHeading
            index="—"
            align="left"
            eyebrow="Before you submit"
            title="Keep these documents ready"
          />
          <ul className="grid gap-2.5 sm:grid-cols-2">
            {[
              "Recent photograph (JPEG/PNG, max 2 MB)",
              "Identity proof — Aadhaar, passport or school ID",
              "Last qualifying mark sheet",
              "Transfer / migration certificate",
              "Category certificate, if applicable",
              "Character certificate from the last institution",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-slate-body">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
