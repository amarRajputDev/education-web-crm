import Link from "next/link";
import { ArrowUpRight, BookOpen, Mail } from "lucide-react";
import { parseJson } from "@/lib/json";

export type FacultyCardData = {
  id: number;
  name: string;
  slug: string;
  designation: string;
  photo: string;
  email: string;
  qualifications: string;
  research_interests: string;
  department_name?: string | null;
  experience_years?: number;
};

export function FacultyCard({
  member,
  showEmail = true,
}: {
  member: FacultyCardData;
  showEmail?: boolean;
}) {
  const interests = parseJson<string[]>(member.research_interests, []);
  return (
    <article className="card group relative flex h-full flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-pop)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-offwhite">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={member.photo || "/images/p-01.jpg"}
          alt={`Portrait of ${member.name}`}
          loading="lazy"
          className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-navy/85 via-navy/30 to-transparent" aria-hidden />
        <div className="absolute inset-x-4 bottom-3">
          <p className="truncate text-sm font-bold text-white">{member.name}</p>
          <p className="truncate text-[11px] text-white/75">{member.designation}</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-royal">
          {member.department_name ?? "Faculty"}
        </p>
        <p className="mt-2 flex items-start gap-1.5 text-xs text-slate-body">
          <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-700" aria-hidden />
          <span>{member.qualifications}</span>
        </p>
        {interests.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {interests.slice(0, 3).map((interest) => (
              <li key={interest} className="rounded-full bg-offwhite px-2 py-1 text-[11px] font-medium text-slate-body">
                {interest}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-4">
          <Link
            href={`/faculty/${member.slug}`}
            className="relative z-10 inline-flex items-center gap-1 text-sm font-semibold text-royal transition hover:gap-2"
            tabIndex={-1}
          >
            View profile
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </Link>
          {showEmail && member.email ? (
            <a
              href={`mailto:${member.email}`}
              aria-label={`Email ${member.name}`}
              className="relative z-10 flex h-8 w-8 items-center justify-center rounded-lg border border-line text-slate-body transition hover:border-royal hover:text-royal"
              tabIndex={-1}
            >
              <Mail className="h-4 w-4" aria-hidden />
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}
