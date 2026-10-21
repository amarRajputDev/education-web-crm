import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/rbac";
import { getDb, parseJson } from "@/lib/db";
import { AdminPageHeader } from "@/components/admin/page-header";
import { FacultyForm } from "@/components/admin/academics/faculty-form";
import { csvFromItems, type FacultyFormValues } from "@/components/admin/academics/shared";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Edit faculty member" };

type FacultyRow = {
  id: number;
  name: string;
  designation: string;
  department_id: number | null;
  qualifications: string;
  experience_years: number;
  email: string;
  phone: string;
  bio: string;
  research_interests: string;
  photo: string;
  display_order: number;
  visibility: string;
};

export default async function EditFacultyPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAuth(PERMISSIONS.FACULTY_MANAGE);
  void ctx;

  const { id } = await params;
  const facultyId = Number(id);
  const db = getDb();

  const row =
    Number.isInteger(facultyId) && facultyId > 0
      ? (db.prepare(`SELECT * FROM faculty WHERE id = ?`).get(facultyId) as FacultyRow | undefined)
      : undefined;
  if (!row) notFound();

  const departments = db
    .prepare(`SELECT id, name FROM departments ORDER BY sort_order, name`)
    .all() as { id: number; name: string }[];

  const values: FacultyFormValues = {
    id: row.id,
    name: row.name,
    designation: row.designation,
    departmentId: row.department_id ?? 0,
    qualifications: row.qualifications,
    experienceYears: row.experience_years,
    email: row.email,
    phone: row.phone,
    bio: row.bio,
    researchInterests: csvFromItems(parseJson<string[]>(row.research_interests, [])),
    photo: row.photo,
    displayOrder: row.display_order,
    visibility: row.visibility,
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`Edit ${row.name}`}
        description="Changes are saved to the database immediately and revalidated across the admin panel."
        actions={
          <Link href="/admin/faculty" className="btn btn-ghost btn-sm">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to faculty
          </Link>
        }
      />
      <FacultyForm departments={departments} values={values} />
    </div>
  );
}
