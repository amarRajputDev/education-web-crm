import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/rbac";
import { getDb } from "@/lib/db";
import { AdminPageHeader } from "@/components/admin/page-header";
import { FacultyForm } from "@/components/admin/academics/faculty-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "New faculty member" };

export default async function NewFacultyPage() {
  const ctx = await requireAuth(PERMISSIONS.FACULTY_MANAGE);
  void ctx;

  const db = getDb();
  const departments = db
    .prepare(`SELECT id, name FROM departments ORDER BY sort_order, name`)
    .all() as { id: number; name: string }[];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="New faculty member"
        description="Add a profile to the public faculty directory. New records inherit their visibility from the form below."
        actions={
          <Link href="/admin/faculty" className="btn btn-ghost btn-sm">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to faculty
          </Link>
        }
      />
      <FacultyForm departments={departments} />
    </div>
  );
}
