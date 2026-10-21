"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowUpDown, CheckSquare, Square, UserRoundCheck, Tag, CircleAlert, Download } from "lucide-react";
import { bulkUpdateEnquiries, type EnquiryActionResult } from "@/app/admin/actions/enquiries";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { relativeTime, isBeforeNow, statusTone, priorityTone } from "@/lib/format";
import { cn } from "@/lib/cn";

export type EnquiryRow = {
  id: number;
  ref: string;
  name: string;
  phone: string;
  email: string;
  course_interest: string;
  source: string;
  status: string;
  status_name: string;
  priority: string;
  counsellor_name: string | null;
  last_contacted_at: string | null;
  next_followup_at: string | null;
  created_at: string;
  updated_at: string;
};

export function EnquiryTable({
  rows,
  statuses,
  counsellors,
  canAssign,
  canExport,
  sort,
  dir,
}: {
  rows: EnquiryRow[];
  statuses: { key: string; name: string }[];
  counsellors: { id: number; name: string }[];
  canAssign: boolean;
  canExport: boolean;
  sort: string;
  dir: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [selected, setSelected] = useState<number[]>([]);
  const [bulkAction, setBulkAction] = useState("");
  const [statusValue, setStatusValue] = useState("");
  const [priorityValue, setPriorityValue] = useState("");
  const [assignValue, setAssignValue] = useState("");
  const [pending, startTransition] = useTransition();

  const rowIds = new Set(rows.map((row) => row.id));
  const visibleSelected = selected.filter((id) => rowIds.has(id));

  const toggle = (id: number) =>
    setSelected((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));

  const allSelected = rows.length > 0 && visibleSelected.length === rows.length;

  const runBulk = () => {
    if (!bulkAction) {
      toast.error("Choose an action first");
      return;
    }
    if (bulkAction === "status" && !statusValue) return toast.error("Choose a status");
    if (bulkAction === "assign" && !assignValue) return toast.error("Choose a counsellor");
    if (bulkAction === "priority" && !priorityValue) return toast.error("Choose a priority");

    const formData = new FormData();
    formData.set("ids", visibleSelected.join(","));
    formData.set("action", bulkAction);
    if (statusValue) formData.set("status", statusValue);
    if (assignValue) formData.set("counsellorId", assignValue);
    if (priorityValue) formData.set("priority", priorityValue);

    startTransition(async () => {
      const result: EnquiryActionResult = await bulkUpdateEnquiries(formData);
      if (result.ok) {
        toast.success(result.message);
        setSelected([]);
        setBulkAction("");
        router.refresh();
      } else {
        toast.error("Bulk update failed", result.message);
      }
    });
  };

  const applySort = (key: string) => {
    const next = sort === key && dir === "asc" ? "desc" : "asc";
    const params = new URLSearchParams(window.location.search);
    params.set("sort", key);
    params.set("dir", next);
    params.delete("page");
    router.push(`${window.location.pathname}?${params.toString()}`);
  };

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line-strong bg-paper px-6 py-12 text-center">
        <p className="font-bold text-navy">No enquiries match these filters</p>
        <p className="mt-1.5 text-sm text-slate-body">Try clearing a filter, or widen the date range.</p>
      </div>
    );
  }

  return (
    <div>
      {visibleSelected.length > 0 ? (
        <div className="sticky top-24 z-20 mb-3 flex flex-wrap items-center gap-2 rounded-2xl border border-royal/40 bg-royal-100 px-4 py-3">
          <p className="text-sm font-bold text-navy">
            {visibleSelected.length} selected
          </p>

          <select
            value={bulkAction}
            onChange={(event) => setBulkAction(event.target.value)}
            aria-label="Bulk action"
            className="rounded-xl border border-line-strong bg-paper px-3 py-2 text-[13px]"
          >
            <option value="">Choose action…</option>
            <option value="status">Change status</option>
            <option value="priority">Change priority</option>
            {canAssign ? <option value="assign">Assign counsellor</option> : null}
          </select>

          {bulkAction === "status" ? (
            <select
              value={statusValue}
              onChange={(event) => setStatusValue(event.target.value)}
              aria-label="New status"
              className="rounded-xl border border-line-strong bg-paper px-3 py-2 text-[13px]"
            >
              <option value="">Select status…</option>
              {statuses.map((status) => (
                <option key={status.key} value={status.key}>
                  {status.name}
                </option>
              ))}
            </select>
          ) : null}
          {bulkAction === "priority" ? (
            <select
              value={priorityValue}
              onChange={(event) => setPriorityValue(event.target.value)}
              aria-label="New priority"
              className="rounded-xl border border-line-strong bg-paper px-3 py-2 text-[13px]"
            >
              <option value="">Select priority…</option>
              {["low", "medium", "high", "urgent"].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          ) : null}
          {bulkAction === "assign" && canAssign ? (
            <select
              value={assignValue}
              onChange={(event) => setAssignValue(event.target.value)}
              aria-label="Counsellor"
              className="rounded-xl border border-line-strong bg-paper px-3 py-2 text-[13px]"
            >
              <option value="">Select counsellor…</option>
              {counsellors.map((counsellor) => (
                <option key={counsellor.id} value={counsellor.id}>
                  {counsellor.name}
                </option>
              ))}
            </select>
          ) : null}

          <button type="button" onClick={runBulk} disabled={pending} className="btn btn-primary btn-sm">
            <UserRoundCheck className="h-4 w-4" aria-hidden />
            {pending ? "Applying…" : "Apply"}
          </button>
          <button type="button" onClick={() => setSelected([])} className="btn btn-ghost btn-sm">
            Clear selection
          </button>

          {canExport && bulkAction === "" ? (
            <Link href="/admin/reports?report=enquiries" className="btn btn-outline btn-sm ml-auto">
              <Download className="h-4 w-4" aria-hidden />
              Export report
            </Link>
          ) : null}
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
              <SortHeader label="Enquiry" field="ref" sort={sort} dir={dir} onSort={applySort} />
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Interested course</th>
              <SortHeader label="Status" field="status" sort={sort} dir={dir} onSort={applySort} />
              <SortHeader label="Priority" field="priority" sort={sort} dir={dir} onSort={applySort} />
              <th className="px-4 py-3">Counsellor</th>
              <SortHeader label="Next follow-up" field="next_followup_at" sort={sort} dir={dir} onSort={applySort} />
              <SortHeader label="Created" field="created_at" sort={sort} dir={dir} onSort={applySort} />
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const overdue =
                isBeforeNow(row.next_followup_at) && !["converted", "invalid_lead"].includes(row.status);
              return (
                <tr key={row.id} className={cn(selected.includes(row.id) && "bg-royal-100/40")}>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggle(row.id)}
                      aria-label={`Select ${row.ref}`}
                      aria-pressed={selected.includes(row.id)}
                      className="text-navy"
                    >
                      {selected.includes(row.id) ? <CheckSquare className="h-4 w-4 text-royal" aria-hidden /> : <Square className="h-4 w-4" aria-hidden />}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/enquiries/${row.id}`} className="font-mono text-[12.5px] font-semibold text-royal hover:underline">
                      {row.ref}
                    </Link>
                    <span className="block text-[11px] text-slate-body">{row.source}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/enquiries/${row.id}`} className="font-semibold text-navy hover:text-royal">
                      {row.name}
                    </Link>
                    <span className="block text-[11px] text-slate-body">{row.phone}</span>
                    {row.email ? <span className="block truncate text-[11px] text-slate-body">{row.email}</span> : null}
                  </td>
                  <td className="max-w-[200px] px-4 py-3">
                    <span className="block truncate text-[13px] text-navy">{row.course_interest || "—"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone(row.status)}>{row.status_name}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={priorityTone(row.priority)}>{row.priority}</Badge>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-slate-body">{row.counsellor_name ?? "Unassigned"}</td>
                  <td className="px-4 py-3">
                    {row.next_followup_at ? (
                      <span className={cn("text-[12.5px] font-semibold", overdue ? "text-danger" : "text-navy")}>
                        {overdue ? <CircleAlert className="mr-1 inline h-3.5 w-3.5" aria-hidden /> : null}
                        {relativeTime(row.next_followup_at)}
                      </span>
                    ) : (
                      <span className="text-[12.5px] text-slate-body">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[12.5px] text-slate-body">{relativeTime(row.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/enquiries/${row.id}`} className="btn btn-outline btn-sm">
                      Open
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-3 flex items-center gap-2 text-[11px] text-slate-body">
        <Tag className="h-3.5 w-3.5" aria-hidden />
        Bulk updates are audited — every changed record keeps a timeline entry.
      </p>
    </div>
  );
}

function SortHeader({
  label,
  field,
  sort,
  onSort,
  className,
}: {
  label: string;
  field: string;
  sort: string;
  dir: string;
  onSort: (field: string) => void;
  className?: string;
}) {
  return (
    <th className={cn("px-4 py-3", className)}>
      <button
        type="button"
        onClick={() => onSort(field)}
        className="inline-flex items-center gap-1 uppercase tracking-wide hover:text-royal"
        aria-label={`Sort by ${label}`}
      >
        {label}
        <ArrowUpDown className={cn("h-3 w-3", sort === field ? "text-royal" : "text-line-strong")} aria-hidden />
      </button>
    </th>
  );
}
