import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/rbac";
import { getDb, parseJson } from "@/lib/db";
import { AdminPageHeader } from "@/components/admin/page-header";
import { CourseForm } from "@/components/admin/academics/course-form";
import {
  textFromCurriculum,
  textFromFaqs,
  textFromItems,
  type CourseFormValues,
} from "@/components/admin/academics/shared";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Edit course" };

type CourseRow = {
  id: number;
  name: string;
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
  fee_amount: number;
  fee_note: string;
  scholarship_info: string;
  image: string;
  status: string;
  featured: number;
  seo_title: string;
  seo_description: string;
  learning_outcomes: string;
  curriculum: string;
  careers: string;
  faqs: string;
  session_ids: string;
};

export default async function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAuth(PERMISSIONS.COURSE_MANAGE);
  void ctx;

  const { id } = await params;
  const courseId = Number(id);
  const db = getDb();

  const row =
    Number.isInteger(courseId) && courseId > 0
      ? (db.prepare(`SELECT * FROM courses WHERE id = ?`).get(courseId) as CourseRow | undefined)
      : undefined;
  if (!row) notFound();

  const departments = db
    .prepare(`SELECT id, name FROM departments ORDER BY sort_order, name`)
    .all() as { id: number; name: string }[];
  const sessions = db
    .prepare(`SELECT id, name FROM academic_sessions ORDER BY start_date DESC`)
    .all() as { id: number; name: string }[];

  const values: CourseFormValues = {
    id: row.id,
    name: row.name,
    code: row.code,
    degreeLevel: row.degree_level,
    departmentId: row.department_id ?? 0,
    durationMonths: row.duration_months,
    durationLabel: row.duration_label,
    studyMode: row.study_mode,
    seats: row.seats,
    eligibility: row.eligibility,
    overview: row.overview,
    description: row.description,
    feeAmount: row.fee_amount ?? 0,
    feeNote: row.fee_note,
    scholarshipInfo: row.scholarship_info,
    image: row.image,
    status: row.status,
    featured: row.featured === 1,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    learningOutcomes: textFromItems(parseJson<string[]>(row.learning_outcomes, [])),
    curriculum: textFromCurriculum(
      parseJson<{ semester: string; subjects: string[] }[]>(row.curriculum, []),
    ),
    careers: textFromItems(parseJson<string[]>(row.careers, [])),
    faqs: textFromFaqs(parseJson<{ q: string; a: string }[]>(row.faqs, [])),
    sessionIds: parseJson<number[]>(row.session_ids, []),
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`Edit ${row.name}`}
        description="Changes are saved to the database immediately and revalidated across the admin panel."
        actions={
          <Link href="/admin/courses" className="btn btn-ghost btn-sm">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to courses
          </Link>
        }
      />
      <CourseForm departments={departments} sessions={sessions} values={values} />
    </div>
  );
}
