import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BookOpen, Building2, Clock, GraduationCap, Mail, Quote, Users } from "lucide-react";
import { getDb, parseJson } from "@/lib/db";
import { PageHeader, SectionHeading } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FacultyCard } from "@/components/public/faculty-card";
import type { FacultyCardData } from "@/components/public/faculty-card";

export const dynamic = "force-dynamic";

type FacultyRow = {
  id: number;
  name: string;
  slug: string;
  designation: string;
  department_id: number | null;
  qualifications: string;
  experience_years: number;
  research_interests: string;
  expertise: string;
  bio: string;
  email: string;
  phone: string;
  photo: string;
  visibility: string;
  department_name: string | null;
  department_slug: string | null;
  department_overview: string | null;
};

function loadMember(slug: string): FacultyRow | null {
  const row = getDb()
    .prepare(
      `SELECT f.*, d.name AS department_name, d.slug AS department_slug, d.overview AS department_overview
         FROM faculty f
         LEFT JOIN departments d ON d.id = f.department_id
        WHERE f.slug = ? AND f.visibility = 'published'`,
    )
    .get(slug) as FacultyRow | undefined;
  return row ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const member = loadMember(slug);
  if (!member) return { title: "Faculty profile not found" };
  return {
    title: `${member.name} — ${member.designation}`,
    description: member.bio.slice(0, 180) || `${member.name}, ${member.designation} at Aarohan Institute.`,
    openGraph: { title: member.name, description: member.designation, images: [member.photo] },
  };
}

export default async function FacultyProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const member = loadMember(slug);
  if (!member) notFound();

  const db = getDb();
  const interests = parseJson<string[]>(member.research_interests, []);
  const expertise = parseJson<string[]>(member.expertise, []);

  const colleagues = db
    .prepare(
      `SELECT f.id, f.name, f.slug, f.designation, f.photo, f.email, f.qualifications,
              f.research_interests, d.name AS department_name
         FROM faculty f
         LEFT JOIN departments d ON d.id = f.department_id
        WHERE f.department_id = ? AND f.id != ? AND f.visibility = 'published'
        ORDER BY f.display_order
        LIMIT 3`,
    )
    .all(member.department_id ?? -1, member.id) as FacultyCardData[];

  const programmes = db
    .prepare(
      `SELECT c.name, c.slug, c.degree_level, c.duration_label, c.image
         FROM courses c
        WHERE c.department_id = ? AND c.status = 'published'
        LIMIT 4`,
    )
    .all(member.department_id ?? -1) as { name: string; slug: string; degree_level: string; duration_label: string; image: string }[];

  return (
    <>
      <PageHeader
        eyebrow={member.department_name ?? "Faculty"}
        title={member.name}
        description={member.designation}
        breadcrumbs={[{ label: "Faculty", href: "/faculty" }, { label: member.name }]}
        meta={[
          { label: "Experience", value: `${member.experience_years} yrs` },
          { label: "School", value: (member.department_name ?? "—").replace("School of ", "") },
          { label: "Profiles", value: "Verified*" },
        ]}
      >
        {member.email ? (
          <Link href={`mailto:${member.email}`} className="btn btn-gold">
            <Mail className="h-4 w-4" aria-hidden />
            Email {member.name.split(" ")[0]}
          </Link>
        ) : null}
        <Link href="/faculty" className="btn btn-outline !border-white/25 !text-white hover:!bg-white/10">
          All faculty
        </Link>
      </PageHeader>

      <div className="container-page grid gap-10 py-14 lg:grid-cols-[330px_1fr] lg:py-20">
        <aside className="lg:sticky lg:top-32 lg:self-start">
          <div className="overflow-hidden rounded-3xl border border-line bg-paper">
            <div className="aspect-[4/5] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={member.photo || "/images/p-01.jpg"}
                alt={`Portrait of ${member.name}`}
                className="h-full w-full object-top"
              />
            </div>
            <div className="p-5">
              <Badge tone="gold">{member.designation}</Badge>
              <dl className="mt-4 space-y-2.5 text-sm">
                {[
                  ["School", member.department_name ?? "—"],
                  ["Experience", `${member.experience_years} years`],
                  ["Qualifications", member.qualifications],
                ].map(([label, value]) => (
                  <div key={label} className="flex gap-3 border-b border-line pb-2.5 last:border-0 last:pb-0">
                    <dt className="w-24 shrink-0 text-[11px] font-bold uppercase tracking-wide text-slate-body">{label}</dt>
                    <dd className="min-w-0 flex-1 text-[13px] text-navy">{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-5 space-y-2">
                {member.email ? (
                  <Link href={`mailto:${member.email}`} className="btn btn-primary w-full">
                    <Mail className="h-4 w-4" aria-hidden />
                    Send an email
                  </Link>
                ) : null}
                <Link href="/contact" className="btn btn-outline w-full">
                  Contact the institute
                </Link>
              </div>
              <p className="mt-4 text-[11px] leading-relaxed text-slate-body">
                Contact details are published for demonstration. Use the main institute channels for real enquiries.
              </p>
            </div>
          </div>
        </aside>

        <div className="min-w-0 space-y-14">
          <section>
            <SectionHeading index="01" eyebrow="Biography" title={`About ${member.name.split(" ")[0]}`} />
            <div className="prose-univ">
              {member.bio ? (
                member.bio.split(/\n\s*\n/).map((paragraph, index) => <p key={index}>{paragraph}</p>)
              ) : (
                <p>
                  {member.name} serves as {member.designation} in the {member.department_name} with{" "}
                  {member.experience_years} years of academic and professional experience.
                </p>
              )}
            </div>
          </section>

          <section>
            <SectionHeading index="02" eyebrow="Expertise" title="Research & teaching interests" />
            <div className="flex flex-wrap gap-2.5">
              {[...new Set([...interests, ...expertise])].map((item) => (
                <span key={item} className="rounded-full border border-line bg-paper px-4 py-2 text-sm font-semibold text-navy">
                  {item}
                </span>
              ))}
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {[
                { icon: Clock, label: "Teaching experience", value: `${member.experience_years} years` },
                { icon: GraduationCap, label: "Highest qualification", value: member.qualifications.split(",")[0] },
                { icon: BookOpen, label: "School", value: member.department_name ?? "—" },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-line bg-paper p-4">
                  <p className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-body">
                    <item.icon className="h-3.5 w-3.5 text-royal" aria-hidden />
                    {item.label}
                  </p>
                  <p className="mt-1.5 font-display text-base font-semibold text-navy">{item.value}</p>
                </div>
              ))}
            </div>
          </section>

          {programmes.length > 0 ? (
            <section>
              <SectionHeading index="03" eyebrow="Programmes" title="Programmes in this school" />
              <ul className="grid gap-3 sm:grid-cols-2">
                {programmes.map((programme) => (
                  <li key={programme.slug}>
                    <Link
                      href={`/courses/${programme.slug}`}
                      className="group flex items-center gap-4 rounded-2xl border border-line bg-paper p-3.5 transition hover:border-royal/50"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={programme.image} alt="" className="h-14 w-16 shrink-0 rounded-xl object-cover" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold text-navy group-hover:text-royal">{programme.name}</span>
                        <span className="block text-[11px] text-slate-body">
                          {programme.degree_level} · {programme.duration_label}
                        </span>
                      </span>
                      <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-royal opacity-0 transition group-hover:opacity-100" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="rounded-3xl border border-dashed border-gold/70 bg-gold-100/50 p-6">
            <p className="flex items-center gap-2 text-sm font-bold text-navy">
              <Quote className="h-4 w-4 text-gold" aria-hidden />
              Demo profile
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-body">
              This faculty profile is fictional sample content created for the Agentiva demonstration. Replace it with
              authorised faculty information — including published research, if any — before going live.
            </p>
          </section>

          {colleagues.length > 0 ? (
            <section>
              <SectionHeading
                index="04"
                eyebrow="Colleagues"
                title={`Others in ${(member.department_name ?? "the department").replace("School of ", "")}`}
                action={
                  <Link href="/faculty" className="btn btn-outline btn-sm">
                    Faculty directory
                  </Link>
                }
              />
              <div className="grid gap-5 sm:grid-cols-3">
                {colleagues.map((colleague, index) => (
                  <Reveal key={colleague.id} delay={index * 60}>
                    <FacultyCard member={colleague} />
                  </Reveal>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>

      <section className="border-t border-line bg-paper">
        <div className="container-page flex flex-col items-center gap-5 py-14 text-center">
          <h2 className="max-w-2xl text-[clamp(1.5rem,3vw,2.2rem)] leading-tight text-navy">
            Learn from this faculty — start your application.
          </h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button href="/admissions/apply" variant="gold">
              Apply for Admission
            </Button>
            <Button href="/courses" variant="outline">
              <Users className="h-4 w-4" aria-hidden />
              Browse programmes
            </Button>
            <Button href="/academics" variant="ghost">
              <Building2 className="h-4 w-4" aria-hidden />
              Academic schools
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
