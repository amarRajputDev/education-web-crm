import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/rbac";
import { getDb } from "@/lib/db";
import { AdminPageHeader } from "@/components/admin/page-header";
import { DOCUMENT_SEEDS } from "@/components/admin/content-hub/block-defaults";
import {
  DownloadsManager,
  type DownloadRow,
} from "@/components/admin/content-hub/download-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Downloads",
  description: "Manage the documents prospects and students can download from the public website.",
};

export default async function DownloadsPage() {
  await requireAuth(PERMISSIONS.CONTENT_MANAGE);

  const rows = getDb()
    .prepare(
      `SELECT id, title, category, description, file_path, external_url, status, downloads_count
         FROM downloads
        ORDER BY id`,
    )
    .all() as DownloadRow[];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Downloads"
        description="Documents offered on the admissions and public pages. Each entry links to a file or an external URL."
      />

      <div className="rounded-2xl border border-gold/60 bg-gold-100/60 p-4 sm:p-5">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-gold-700">
          Place files in public/documents
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-body">
          The <span className="font-semibold text-navy">File path</span> must match a file inside{" "}
          <span className="rounded bg-white/70 px-1.5 py-0.5 font-mono text-[11px] text-navy">public/documents</span>,
          referenced with a leading slash. Seeded documents:
        </p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {DOCUMENT_SEEDS.map((document) => (
            <li
              key={document.path}
              className="rounded-lg border border-gold/40 bg-white/70 px-2 py-1 font-mono text-[11px] text-navy"
              title={document.title}
            >
              {document.path}
            </li>
          ))}
        </ul>
      </div>

      <DownloadsManager rows={rows} />
    </div>
  );
}
