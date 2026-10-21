import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/rbac";
import { getDb } from "@/lib/db";
import { AdminPageHeader } from "@/components/admin/page-header";
import { FaqsManager, type FaqRow } from "@/components/admin/content-hub/faq-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "FAQs",
  description: "Manage the frequently asked questions shown on the public website.",
};

export default async function FaqsPage() {
  await requireAuth(PERMISSIONS.CONTENT_MANAGE);

  const rows = getDb()
    .prepare(
      `SELECT id, category, question, answer, sort_order, status
         FROM faqs
        ORDER BY category, sort_order, id`,
    )
    .all() as FaqRow[];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="FAQs"
        description="Questions are grouped by category and ordered by sort order. Use the arrows inside a group to move a question up or down."
      />
      <FaqsManager rows={rows} />
    </div>
  );
}
