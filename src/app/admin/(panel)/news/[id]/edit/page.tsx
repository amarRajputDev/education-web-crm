import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { NewsForm, type NewsValues } from "@/components/admin/content/news-form";
import { AdminCard, AdminPageHeader } from "@/components/admin/page-header";
import { formatDate } from "@/lib/format";
import { PERMISSIONS } from "@/lib/rbac";
import { requireAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edit notice · Admin",
  robots: { index: false, follow: false },
};

type NewsRow = {
  id: number;
  title: string;
  category: string;
  excerpt: string;
  body: string;
  cover_image: string;
  author: string;
  status: string;
  published_at: string | null;
};

export default async function AdminNewsEditPage({
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
      `SELECT id, title, category, excerpt, body, cover_image, author, status, published_at
         FROM news_posts WHERE id = ?`,
    )
    .get(id) as NewsRow | undefined;
  if (!row) notFound();

  const initial: NewsValues = {
    id: row.id,
    title: row.title,
    category: row.category,
    excerpt: row.excerpt,
    body: row.body,
    coverImage: row.cover_image,
    author: row.author,
    status: row.status,
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Edit notice"
        description={
          row.status === "published"
            ? `Currently live on the website — published ${formatDate(row.published_at)}.`
            : "This notice is a draft and is hidden from the public website."
        }
        meta={[
          { label: "Status", value: row.status },
          { label: "Category", value: row.category },
        ]}
        actions={
          <Link href="/admin/news" className="btn btn-outline btn-sm">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to list
          </Link>
        }
      />

      <AdminCard title="Notice details" description="Fields marked with * are required.">
        <NewsForm initial={initial} />
      </AdminCard>
    </div>
  );
}
