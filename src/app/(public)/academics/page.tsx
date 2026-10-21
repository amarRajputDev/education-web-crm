import Link from "next/link";
import { ArrowRight, BookOpen, Users, UserCheck } from "lucide-react";
import { PageHeader, SectionHeading } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { Badge } from "@/components/ui/badge";
import { getDb } from "@/lib/db";
import { getBlock, getDepartments, paragraphs } from "@/lib/content";
import { formatCurrency } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Academics",
  description:
    "Six academic schools, departments, faculty and programme structures at Aarohan Institute of Higher Education.",
};

function departmentCourses() {
  const rows = getDb()
    .prepare(
      `SELECT c.name, c.slug, c.degree_level, c.duration_label, c.fee_amount, c.department_id
         FROM courses c
        WHERE c.status = 'published'
        ORDER BY c.name`,
    )
    .all() as { name: string; slug: string; degree_level: string; duration_label: string; fee_amount: number; department_id: number }[];

  const facultyCounts = getDb()
    .prepare(
      `SELECT department_id, COUNT(*) AS count FROM faculty
        WHERE visibility = 'published' GROUP BY department_id`,
    )
    .all() as { department_id: number; count: number }[];

  const map = new Map<number, typeof rows>();
  for (const row of rows) {
    const list = map.get(row.department_id) ?? [];
    list.push(row);
    map.set(row.department_id, list);
  }
  const counts = new Map<number, number>();
  for (const row of facultyCounts) counts.set(row.department_id, row.count);

  return { map, counts };
}

export default function AcademicsPage() {
  const departments = getDepartments();
  const { map, counts } = departmentCourses();
  const philosophy = getBlock("about_overview");

  return (
    <>
      <PageHeader
        eyebrow="Academics"
        title="Six schools, one connected academic structure"
        description="Every school combines strong fundamentals with applied practice — laboratories, studios, projects and industry-linked assessments built into the timetable."
        breadcrumbs={[{ label: "Academics" }]}
        meta={[
          { label: "Schools", value: String(departments.length) },
          { label: "Faculty", value: "180+*" },
          { label: "Reviews", value: "Annual" },
          { label: "Format", value: "Semester" },
        ]}
      >
        <Link href="/faculty" className="btn btn-gold">
          Faculty directory
        </Link>
        <Link href="/courses" className="btn btn-outline !border-white/25 !text-white hover:!bg-white/10">
          All programmes
        </Link>
      </PageHeader>

      <section className="container-page py-16 md:py-24">
        <SectionHeading
          index="01"
          eyebrow="Academic Philosophy"
          title="How teaching works here"
          description={
            <>
              {paragraphs(philosophy?.body ?? "")?.[1] ??
                "Coursework is reviewed annually with partner organisations, and every programme carries a project, studio or internship component."}
            </>
          }
        />
        <div className="grid gap-5 sm:grid-cols-3">
          {[
            { icon: BookOpen, title: "Fundamentals first", text: "Strong early coverage of mathematics, communication and core theory before specialisation." },
            { icon: Users, title: "Practice every term", text: "Labs, studios, case work and a graded build in every semester." },
            { icon: UserCheck, title: "Named mentor", text: "One faculty mentor tracks each student's academic progress through the programme." },
          ].map((item, index) => (
            <Reveal key={item.title} delay={index * 70}>
              <div className="h-full rounded-3xl border border-line bg-paper p-6">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-navy text-gold">
                  <item.icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-4 text-base font-bold text-navy">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-body">{item.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* departments */}
      <section className="border-y border-line bg-paper">
        <div className="container-page py-16 md:py-24">
          <SectionHeading
            index="02"
            eyebrow="Schools & Departments"
            title="Explore each school"
            description="Department pages carry the overview, head of school, programmes offered and faculty profiles."
          />

          <div className="space-y-6">
            {departments.map((department, index) => {
              const courses = map.get(department.id) ?? [];
              const facultyCount = counts.get(department.id) ?? 0;
              return (
                <Reveal key={department.id} delay={index * 50}>
                  <article
                    id={department.slug}
                    className="grid scroll-mt-32 overflow-hidden rounded-[2rem] border border-line bg-offwhite/50 lg:grid-cols-[340px_1fr]"
                  >
                    <div className="relative min-h-[220px]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={department.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full" />
                      <div className="absolute inset-0 bg-gradient-to-t from-navy/75 via-navy/25 to-transparent" aria-hidden />
                      <div className="absolute inset-x-0 bottom-0 p-5">
                        <span className="rounded-full bg-gold px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest text-navy">
                          {department.code}
                        </span>
                        <p className="mt-2 font-display text-xl font-semibold leading-tight text-white">
                          {department.name}
                        </p>
                        {department.head_name ? (
                          <p className="mt-1 text-[11px] text-white/70">
                            Head · {department.head_name}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="p-6 md:p-8">
                      <p className="prose-univ [&_p]:m-0">{department.overview}</p>

                      <div className="mt-5 flex flex-wrap gap-3">
                        <Badge tone="info">
                          {facultyCount} faculty member{facultyCount === 1 ? "" : "s"}
                        </Badge>
                        <Badge tone="gold">
                          {courses.length} programme{courses.length === 1 ? "" : "s"}
                        </Badge>
                      </div>

                      {courses.length > 0 ? (
                        <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                          {courses.map((course) => (
                            <li key={course.slug}>
                              <Link
                                href={`/courses/${course.slug}`}
                                className="group flex items-center justify-between gap-3 rounded-2xl border border-line bg-paper px-4 py-3 transition hover:border-royal/50"
                              >
                                <span className="min-w-0">
                                  <span className="block truncate text-sm font-bold text-navy group-hover:text-royal">
                                    {course.name}
                                  </span>
                                  <span className="block text-[11px] text-slate-body">
                                    {course.degree_level} · {course.duration_label}
                                    {course.fee_amount ? ` · ${formatCurrency(course.fee_amount)}/sem` : ""}
                                  </span>
                                </span>
                                <ArrowRight className="h-4 w-4 shrink-0 text-royal opacity-0 transition group-hover:opacity-100" aria-hidden />
                              </Link>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-5 rounded-2xl border border-dashed border-line-strong px-4 py-4 text-sm text-slate-body">
                          Programmes for this school will appear here once published from the admin panel.
                        </p>
                      )}

                      <div className="mt-6 flex flex-wrap gap-3">
                        <Link href={`/academics#${department.slug}`} className="btn btn-outline btn-sm">
                          Department overview
                        </Link>
                        <Link href="/faculty" className="link-sweep text-sm font-bold text-navy">
                          Meet the faculty →
                        </Link>
                      </div>
                    </div>
                  </article>
                </Reveal>
              );
            })}
          </div>
          <p className="mt-8 text-[11px] text-slate-body">
            * Faculty and statistics shown on this demo site are sample data.
          </p>
        </div>
      </section>

      <section className="container-page py-16 md:py-24">
        <div className="rounded-[2.5rem] border border-line bg-navy p-8 text-white md:p-12">
          <div className="grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-center">
            <div>
              <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.24em] text-gold">Next step</p>
              <h2 className="mt-4 text-[clamp(1.7rem,3.2vw,2.5rem)] leading-tight text-white">
                Find the programme that fits your ambition.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/65">
                Compare eligibility, duration, curriculum and fee details — then start an application in six steps.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 md:justify-end">
              <Link href="/courses" className="btn btn-gold">
                Explore courses
              </Link>
              <Link
                href="/admissions/apply"
                className="btn btn-outline !border-white/25 !text-white hover:!bg-white/10"
              >
                Apply now
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
