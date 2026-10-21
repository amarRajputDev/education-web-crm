import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/rbac";
import { AdminPageHeader } from "@/components/admin/page-header";
import { DepartmentForm } from "@/components/admin/academics/department-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "New department" };

export default async function NewDepartmentPage() {
  const ctx = await requireAuth(PERMISSIONS.DEPARTMENT_MANAGE);
  void ctx;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="New department"
        description="Departments group programmes and faculty on the public website. The URL slug is derived from the name."
        actions={
          <Link href="/admin/departments" className="btn btn-ghost btn-sm">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to departments
          </Link>
        }
      />
      <DepartmentForm />
    </div>
  );
}
