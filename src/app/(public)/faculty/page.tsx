import { PageHeader, SectionHeading } from "@/components/ui/section";
import { FacultyDirectory } from "@/components/public/faculty-directory";
import { getDepartments, getPublishedFaculty } from "@/lib/content";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Faculty Directory",
  description:
    "Search faculty by name, department, qualification and research interest at Aarohan Institute of Higher Education.",
};

export default function FacultyPage() {
  const members = getPublishedFaculty(60);
  const departments = getDepartments().map((department) => ({ id: department.id, name: department.name }));

  return (
    <>
      <PageHeader
        eyebrow="Our People"
        title="Faculty Directory"
        description="Teachers with academic depth, research output and industry practice — searchable by department, qualification and research interest."
        breadcrumbs={[{ label: "Faculty" }]}
        meta={[
          { label: "Profiles", value: String(members.length) },
          { label: "Schools", value: String(departments.length) },
          { label: "Avg. experience", value: "14 yrs*" },
          { label: "Mentor ratio", value: "1:18*" },
        ]}
      >
        <Link href="/academics" className="btn btn-gold">
          Academic schools
        </Link>
        <Link href="/contact" className="btn btn-outline !border-white/25 !text-white hover:!bg-white/10">
          Contact the institute
        </Link>
      </PageHeader>

      <section className="container-page py-14 md:py-20">
        <FacultyDirectory members={members} departments={departments} />
        <p className="mt-8 text-[11px] text-slate-body">
          * Sample statistics. All faculty profiles on this demo site are fictional sample content.
        </p>
      </section>

      <section className="border-t border-line bg-paper">
        <div className="container-page grid gap-8 py-14 md:grid-cols-2 md:items-center">
          <SectionHeading
            index="01"
            align="left"
            eyebrow="Work with us"
            title="Interested in joining the faculty?"
            description="We publish open positions through the institute's official recruitment notices."
          />
          <div className="flex flex-wrap gap-3 md:justify-end">
            <Link href="/news" className="btn btn-navy">
              View recruitment notices
            </Link>
            <Link href="/contact" className="btn btn-outline">
              Write to the institute
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
