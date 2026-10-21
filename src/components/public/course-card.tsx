import Link from "next/link";
import { ArrowRight, Clock, GraduationCap, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type CourseCardData = {
  id: number;
  name: string;
  slug: string;
  degree_level: string;
  duration_label: string;
  study_mode: string;
  eligibility: string;
  overview: string;
  image: string;
  department_name?: string | null;
};

export function CourseCard({
  course,
  showEnquire = true,
  sourcePage = "/courses",
}: {
  course: CourseCardData;
  showEnquire?: boolean;
  sourcePage?: string;
}) {
  return (
    <article className="card group relative flex h-full flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-pop)]">
      <div className="relative aspect-[16/10] overflow-hidden bg-offwhite">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={course.image || "/images/course-cs.jpg"}
          alt={`${course.name} programme`}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-navy/70 to-transparent" aria-hidden />
        <Badge tone="gold" className="absolute left-3 top-3 bg-white/95 !text-navy !border-transparent">
          {course.degree_level}
        </Badge>
        <p className="absolute bottom-3 left-3 pr-3 text-[11px] font-semibold uppercase tracking-wider text-white/90">
          {course.department_name ?? "General"}
        </p>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-extrabold leading-snug text-navy">
          <Link href={`/courses/${course.slug}`} className="transition group-hover:text-royal">
            <span className="absolute inset-0" aria-hidden />
            {course.name}
          </Link>
        </h3>

        <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-body">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-royal" aria-hidden />
            <dd>{course.duration_label}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-royal" aria-hidden />
            <dd>{course.study_mode}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <GraduationCap className="h-3.5 w-3.5 text-royal" aria-hidden />
            <dd>{course.degree_level}</dd>
          </div>
        </dl>

        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-body">{course.overview}</p>

        <div className="mt-3 rounded-xl bg-offwhite px-3 py-2.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-body">Eligibility</p>
          <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-charcoal">{course.eligibility}</p>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
          <Link
            href={`/courses/${course.slug}`}
            className="relative z-10 inline-flex items-center gap-1 text-sm font-semibold text-royal transition hover:gap-2"
            tabIndex={-1}
          >
            View Details
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          {showEnquire ? (
            <Link
              href={`/contact?course=${course.id}&source=${encodeURIComponent(sourcePage)}`}
              className="btn btn-outline btn-sm relative z-10"
              tabIndex={-1}
            >
              Enquire Now
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}
