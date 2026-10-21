import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/rbac";
import { getDb } from "@/lib/db";
import { AdminPageHeader } from "@/components/admin/page-header";
import {
  TestimonialsManager,
  type TestimonialRow,
} from "@/components/admin/content-hub/testimonial-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Testimonials",
  description: "Manage the student and parent quotes shown on the public website.",
};

export default async function TestimonialsPage() {
  await requireAuth(PERMISSIONS.CONTENT_MANAGE);

  const rows = getDb()
    .prepare(
      `SELECT id, name, role, program, grad_year, quote, photo, is_demo, status, sort_order
         FROM testimonials
        ORDER BY sort_order, id`,
    )
    .all() as TestimonialRow[];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Testimonials"
        description="Quotes shown on the homepage and the public testimonials section. Entries marked Demo are fictional sample content until a real testimonial replaces them."
      />
      <TestimonialsManager rows={rows} />
    </div>
  );
}
