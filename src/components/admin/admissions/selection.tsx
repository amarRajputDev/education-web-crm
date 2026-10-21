"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CheckSquare, Loader2, Square, UserPlus } from "lucide-react";
import { bulkAssignApplications } from "@/app/admin/actions/applications";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { relativeTime, statusTone } from "@/lib/format";
import { cn } from "@/lib/cn";

export type ApplicationRow = {
  id: number;
  ref: string;
  name: string;
  course: string;
  status: string;
  statusName: string;
  documentStatus: string;
  docTotal: number;
  docVerified: number;
  reviewer: string | null;
  submittedAt: string;
  enquiryId: number | null;
};

export function ApplicationSelection({
  rows,
  reviewers,
  canManage,
}: {
  rows: ApplicationRow[];
  reviewers: { id: number; name: string }[];
  canManage: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [selected, setSelected] = useState<number[]>([]);
  const [reviewerId, setReviewerId] = useState("");
  const [pending, startTransition] = useTransition();

  const rowIds = new Set(rows.map((row) => row.id));
  const visibleSelected = selected.filter((id) => rowIds.has(id));
  const allSelected = rows.length > 0 && visibleSelected.length === rows.length;
  const toggle = (id: number) =>
    setSelected((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));

  const assign = () => {
    if (!reviewerId) return toast.error("Choose a reviewer first");
    const formData = new FormData();
    formData.set("ids", visibleSelected.join(","));
    formData.set("reviewerId", reviewerId);
    startTransition(async () => {
      const result = await bulkAssignApplications(formData);
      if (result.ok) {
        toast.success(result.message);
        setSelected([]);
        router.refresh();
      } else {
        toast.error("Assignment failed", result.message);
      }
    });
  };

  return (
    <div>
      {visibleSelected.length > 0 ? (
        <div className="sticky top-24 z-20 mb-3 flex flex-wrap items-center gap-2 rounded-2xl border border-royal/40 bg-royal-100 px-4 py-3">
          <p className="text-sm font-bold text-navy">{visibleSelected.length} selected</p>
          {canManage ? (
            <>
              <label htmlFor="bulk-reviewer" className="sr-only">
                Assign to reviewer
              </label>
              <select
                id="bulk-reviewer"
                value={reviewerId}
                onChange={(event) => setReviewerId(event.target.value)}
                className="rounded-xl border border-line-strong bg-paper px-3 py-2 text-[13px]"
              >
                <option value="">Assign to…</option>
                {reviewers.map((reviewer) => (
                  <option key={reviewer.id} value={reviewer.id}>
                    {reviewer.name}
                  </option>
                ))}
              </select>
              <button type="button" onClick={assign} disabled={pending} className="btn btn-primary btn-sm">
                {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <UserPlus className="h-4 w-4" aria-hidden />}
                {pending ? "Assigning…" : "Assign reviewer"}
              </button>
            </>
          ) : null}
          <button type="button" onClick={() => setSelected([])} className="btn btn-ghost btn-sm">
            Clear selection
          </button>
        </div>
      ) : null}

      <div className="table-shell">
        <table className="data-table">
          <thead>
            <tr>
              <th className="w-10 px-4 py-3">
                <button
                  type="button"
                  onClick={() => setSelected(allSelected ? [] : rows.map((row) => row.id))}
                  aria-label={allSelected ? "Clear selection" : "Select all rows"}
                  className="text-navy"
                >
                  {allSelected ? <CheckSquare className="h-4 w-4" aria-hidden /> : <Square className="h-4 w-4" aria-hidden />}
                </button>
              </th>
              <th className="px-4 py-3">Application</th>
              <th className="px-4 py-3">Applicant</th>
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Documents</th>
              <th className="px-4 py-3">Reviewer</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className={cn(selected.includes(row.id) && "bg-royal-100/40")}>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggle(row.id)}
                    aria-label={`Select ${row.ref}`}
                    aria-pressed={selected.includes(row.id)}
                    className="text-navy"
                  >
                    {selected.includes(row.id) ? (
                      <CheckSquare className="h-4 w-4 text-royal" aria-hidden />
                    ) : (
                      <Square className="h-4 w-4" aria-hidden />
                    )}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/admissions/${row.id}`} className="font-mono text-[12.5px] font-semibold text-royal hover:underline">
                    {row.ref}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/admissions/${row.id}`} className="font-semibold text-navy hover:text-royal">
                    {row.name}
                  </Link>
                </td>
                <td className="max-w-[220px] px-4 py-3">
                  <span className="block truncate text-[13px] text-navy">{row.course || "—"}</span>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={statusTone(row.status)}>{row.statusName}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={row.documentStatus === "verified" ? "success" : row.documentStatus === "pending" ? "neutral" : "warning"}>
                    {row.docTotal === 0 ? "No files" : `${row.docVerified}/${row.docTotal} verified`}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-[13px]">
                  {row.reviewer ? (
                    <span className="text-slate-body">{row.reviewer}</span>
                  ) : (
                    <Badge tone="danger">Unassigned</Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-[12.5px] text-slate-body">{relativeTime(row.submittedAt)}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/admissions/${row.id}`} className="btn btn-outline btn-sm">
                    Review
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
