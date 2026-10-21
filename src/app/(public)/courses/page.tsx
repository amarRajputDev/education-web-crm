import { PageHeader } from "@/components/ui/section";
import { CourseCatalogue } from "@/components/public/course-catalogue";
import { getDepartments, getPublishedCourses } from "@/lib/content";
import { formatCurrency } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Courses & Programmes",
  description:
    "Search and filter undergraduate, postgraduate, diploma and professional programmes at Aarohan Institute of Higher Education.",
};

export default function CoursesPage() {
  const courses = getPublishedCourses();
  const departments = getDepartments().map((department) => ({ id: department.id, name: department.name }));
  const totalSeats = courses.reduce((sum, course) => sum + course.seats, 0);
  const lowestFee = courses.length ? formatCurrency(Math.min(...courses.map((course) => course.fee_amount))) : "—";

  return (
    <>
      <PageHeader
        eyebrow="Academics"
        title="Courses & Programmes"
        description="Eight flagship programmes across engineering, management, health sciences, design and commerce — searchable by level, department, mode and duration."
        breadcrumbs={[{ label: "Courses" }]}
        meta={[
          { label: "Programmes", value: String(courses.length) },
          { label: "Seats (sample)", value: String(totalSeats) },
          { label: "Levels", value: "UG · PG · Dip" },
          { label: "Session", value: "2027–28" },
        ]}
      >
        <a href="/admissions/apply" className="btn btn-gold">
          Apply for a programme
        </a>
        <a href="/downloads" className="btn btn-outline !border-white/25 !text-white hover:!bg-white/10">
          Download prospectus
        </a>
      </PageHeader>

      <section className="container-page py-14 md:py-20">
        <div className="mb-10 grid gap-4 sm:grid-cols-3">
          {[
            { label: "From", value: lowestFee === "—" ? "—" : `${lowestFee} / semester`, note: "Lowest published fee" },
            { label: "Duration range", value: "1 – 4 years", note: "Diploma to engineering" },
            { label: "Study modes", value: "Full-time", note: "Part-time options on select programmes" },
          ].map((item) => (
            <div key={item.label} className="rounded-3xl border border-line bg-paper p-5">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-body">{item.label}</p>
              <p className="mt-1.5 font-display text-xl font-semibold text-navy">{item.value}</p>
              <p className="mt-1 text-xs text-slate-body">{item.note}</p>
            </div>
          ))}
        </div>

        <CourseCatalogue courses={courses} departments={departments} />
      </section>
    </>
  );
}
