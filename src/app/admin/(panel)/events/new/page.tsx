import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { EventForm } from "@/components/admin/content/event-form";
import { AdminCard, AdminPageHeader } from "@/components/admin/page-header";
import { PERMISSIONS } from "@/lib/rbac";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "New event · Admin",
  robots: { index: false, follow: false },
};

export default async function AdminEventsNewPage() {
  await requireAuth(PERMISSIONS.CONTENT_MANAGE);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="New event"
        description="Schedule a seminar, workshop, cultural programme or any other institute event."
        actions={
          <Link href="/admin/events" className="btn btn-outline btn-sm">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to list
          </Link>
        }
      />

      <AdminCard title="Event details" description="Fields marked with * are required.">
        <EventForm />
      </AdminCard>
    </div>
  );
}
