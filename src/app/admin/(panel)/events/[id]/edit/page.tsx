import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { EventForm, type EventValues } from "@/components/admin/content/event-form";
import { AdminCard, AdminPageHeader } from "@/components/admin/page-header";
import { formatDateTime } from "@/lib/format";
import { PERMISSIONS } from "@/lib/rbac";
import { requireAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edit event · Admin",
  robots: { index: false, follow: false },
};

type EventRow = {
  id: number;
  title: string;
  category: string;
  summary: string;
  body: string;
  location: string;
  starts_at: string;
  ends_at: string | null;
  image: string;
  registration_url: string;
  status: string;
};

export default async function AdminEventsEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth(PERMISSIONS.CONTENT_MANAGE);
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const row = getDb()
    .prepare(
      `SELECT id, title, category, summary, body, location, starts_at, ends_at, image, registration_url, status
         FROM events WHERE id = ?`,
    )
    .get(id) as EventRow | undefined;
  if (!row) notFound();

  const initial: EventValues = {
    id: row.id,
    title: row.title,
    category: row.category,
    summary: row.summary,
    body: row.body,
    location: row.location,
    startsAt: row.starts_at,
    endsAt: row.ends_at ?? "",
    image: row.image,
    registrationUrl: row.registration_url,
    status: row.status,
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Edit event"
        description={
          row.status === "published"
            ? `Currently live — starts ${formatDateTime(row.starts_at)}.`
            : "This event is a draft and is hidden from the public website."
        }
        meta={[
          { label: "Status", value: row.status },
          { label: "Category", value: row.category },
          { label: "Starts", value: formatDateTime(row.starts_at) },
        ]}
        actions={
          <Link href="/admin/events" className="btn btn-outline btn-sm">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to list
          </Link>
        }
      />

      <AdminCard title="Event details" description="Fields marked with * are required.">
        <EventForm initial={initial} />
      </AdminCard>
    </div>
  );
}
