import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { PERMISSIONS, can } from "@/lib/rbac";
import { getDb } from "@/lib/db";
import { AdminCard, AdminPageHeader } from "@/components/admin/page-header";
import { EnquiryCreateForm } from "@/components/admin/enquiries/create-form";

export const dynamic = "force-dynamic";

export default async function NewEnquiryPage() {
  const ctx = await requireAuth(PERMISSIONS.ENQUIRY_MANAGE);
  const db = getDb();
  const courses = db.prepare(`SELECT id, name FROM courses WHERE status = 'published' ORDER BY name`).all() as {
    id: number;
    name: string;
  }[];
  const counsellors = db
    .prepare(`SELECT id, name FROM users WHERE status = 'active' AND role_key IN ('counsellor','admission_manager') ORDER BY name`)
    .all() as { id: number; name: string }[];

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Add an enquiry"
        description="Capture a phone, walk-in or referral enquiry manually. Duplicates are detected automatically on save."
        actions={
          <Link href="/admin/enquiries" className="btn btn-ghost btn-sm">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to list
          </Link>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <AdminCard title="Enquiry details" description="Fields marked * are required">
          <EnquiryCreateForm
            courses={courses}
            counsellors={counsellors}
            canAssign={can(ctx.user.role_key, PERMISSIONS.ENQUIRY_ASSIGN)}
          />
        </AdminCard>

        <aside className="space-y-4">
          <AdminCard title="Tips for good records">
            <ul className="space-y-2.5 text-sm text-slate-body">
              <li className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden />
                Always record the number the student actually answers.
              </li>
              <li className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden />
                Choose the interested course — it feeds course-wise reports.
              </li>
              <li className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden />
                Schedule the first follow-up now; overdue tasks show on the dashboard.
              </li>
              <li className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden />
                Website submissions appear here automatically with full attribution.
              </li>
            </ul>
          </AdminCard>

          <AdminCard title="Status workflow">
            <ol className="space-y-1.5 text-xs text-slate-body">
              {[
                "New → Contact Pending → Contacted",
                "Contacted → Interested → Counselling Scheduled",
                "Counselling Scheduled → Application Started",
                "Application Submitted → Converted",
              ].map((step) => (
                <li key={step} className="rounded-lg border border-line bg-offwhite/60 px-3 py-2">
                  {step}
                </li>
              ))}
            </ol>
            <p className="mt-3 text-[11px] text-slate-body">
              Statuses are editable by an administrator in the database workflow table.
            </p>
          </AdminCard>
        </aside>
      </div>
    </div>
  );
}
