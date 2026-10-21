import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NewsForm } from "@/components/admin/content/news-form";
import { AdminCard, AdminPageHeader } from "@/components/admin/page-header";
import { PERMISSIONS } from "@/lib/rbac";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "New notice · Admin",
  robots: { index: false, follow: false },
};

export default async function AdminNewsNewPage() {
  await requireAuth(PERMISSIONS.CONTENT_MANAGE);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="New notice"
        description="Create a news story, notice, achievement or announcement for the public website."
        actions={
          <Link href="/admin/news" className="btn btn-outline btn-sm">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to list
          </Link>
        }
      />

      <AdminCard title="Notice details" description="Fields marked with * are required.">
        <NewsForm />
      </AdminCard>
    </div>
  );
}
