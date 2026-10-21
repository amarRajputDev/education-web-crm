import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/rbac";
import { getDb } from "@/lib/db";
import { AdminPageHeader } from "@/components/admin/page-header";
import { CourseForm } from "@/components/admin/academics/course-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "New course" };

export default async function NewCoursePage() {
  const ctx = await requireAuth(PERMISSIONS.COURSE_MANAGE);
  void ctx;

  const db = getDb();
  const departments = db
    .prepare(`SELECT id, name FROM departments ORDER BY sort_order, name`)
    .all() as { id: number; name: string }[];
  const sessions = db
    .prepare(`SELECT id, name FROM academic_sessions ORDER BY start_date DESC`)
    .all() as { id: number; name: string }[];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="New course"
        description="Add a programme to the public catalogue. Records start as a draft until you publish them."
        actions={
          <Link href="/admin/courses" className="btn btn-ghost btn-sm">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to courses
          </Link>
        }
      />
      <CourseForm departments={departments} sessions={sessions} />
    </div>
  );
}
