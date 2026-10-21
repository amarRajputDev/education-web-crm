import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/rbac";
import { getDb } from "@/lib/db";
import { AdminPageHeader } from "@/components/admin/page-header";
import { DepartmentForm } from "@/components/admin/academics/department-form";
import type { DepartmentFormValues } from "@/components/admin/academics/shared";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Edit department" };

type DepartmentRow = {
  id: number;
  name: string;
  code: string;
  overview: string;
  image: string;
  visibility: string;
  sort_order: number;
  seo_title: string;
  seo_description: string;
};

export default async function EditDepartmentPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAuth(PERMISSIONS.DEPARTMENT_MANAGE);
  void ctx;

  const { id } = await params;
  const departmentId = Number(id);
  const db = getDb();

  const row =
    Number.isInteger(departmentId) && departmentId > 0
      ? (db.prepare(`SELECT * FROM departments WHERE id = ?`).get(departmentId) as
          | DepartmentRow
          | undefined)
      : undefined;
  if (!row) notFound();

  const values: DepartmentFormValues = {
    id: row.id,
    name: row.name,
    code: row.code,
    overview: row.overview,
    image: row.image,
    visibility: row.visibility,
    sortOrder: row.sort_order,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`Edit ${row.name}`}
        description="Changes are saved to the database immediately and revalidated across the admin panel."
        actions={
          <Link href="/admin/departments" className="btn btn-ghost btn-sm">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to departments
          </Link>
        }
      />
      <DepartmentForm values={values} />
    </div>
  );
}
