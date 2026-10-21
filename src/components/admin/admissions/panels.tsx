"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Download, Loader2, Save, ShieldAlert, UserCheck, XCircle } from "lucide-react";
import {
  addApplicationNote,
  assignReviewer,
  setDocumentStatus,
  updateApplicationStatus,
  type ApplicationActionResult,
} from "@/app/admin/actions/applications";
import { ErrorSummary, FieldShell, Select, TextArea, TextInput } from "@/components/ui/fields";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";

const EMPTY: ApplicationActionResult = { ok: false, message: "" };

/* ------------------------------------------------------------------ */
/* status decision + reviewer                                           */
/* ------------------------------------------------------------------ */
export function DecisionPanel({
  applicationId,
  status,
  reviewerId,
  statuses,
  reviewers,
  reasonRequired,
  canManage,
}: {
  applicationId: number;
  status: string;
  reviewerId: number | null;
  statuses: { key: string; name: string; requires_reason: number }[];
  reviewers: { id: number; name: string }[];
  reasonRequired: boolean;
  canManage: boolean;
}) {
  const [state, action, pending] = useActionState(updateApplicationStatus, EMPTY);
  const router = useRouter();
  const toast = useToast();
  const [current, setCurrent] = useState(status);

  useEffect(() => {
    if (state.ok) toast.success(state.message);
    else if (state.message) toast.error("Could not update status", state.message);
    if (state.ok) router.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const selected = statuses.find((item) => item.key === current);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="applicationId" value={applicationId} />
      <ErrorSummary errors={state.errors} />

      <FieldShell label="Decision status" required>
        {(id) => (
          <Select
            id={id}
            name="status"
            value={current}
            onChange={(event) => setCurrent(event.target.value)}
            disabled={!canManage}
          >
            {statuses.map((item) => (
              <option key={item.key} value={item.key}>
                {item.name}
              </option>
            ))}
          </Select>
        )}
      </FieldShell>

      {(selected?.requires_reason === 1 || reasonRequired) ? (
        <FieldShell
          label="Decision reason"
          required
          hint="Required for approve / reject / waitlist decisions — kept in the audit trail."
          error={state.errors?.decisionReason}
        >
          {(id) => (
            <TextArea
              id={id}
              name="decisionReason"
              rows={3}
              invalid={Boolean(state.errors?.decisionReason)}
              placeholder="e.g. Eligible under management quota; marks verified against board result."
            />
          )}
        </FieldShell>
      ) : (
        <input type="hidden" name="decisionReason" value="" />
      )}

      <FieldShell label="Review note (optional)" hint="Visible to the admissions team">
        {(id) => <TextArea id={id} name="notes" rows={2} placeholder="Add context for this decision…" />}
      </FieldShell>

      <button type="submit" className="btn btn-primary" disabled={pending || !canManage}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
        {pending ? "Saving…" : "Record decision"}
      </button>

      {state.message ? (
        <p role="status" className={state.ok ? "text-xs font-semibold text-success" : "text-xs font-semibold text-danger"}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

export function ReviewerAssign({
  applicationId,
  reviewerId,
  reviewers,
  canManage,
}: {
  applicationId: number;
  reviewerId: number | null;
  reviewers: { id: number; name: string }[];
  canManage: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [value, setValue] = useState(reviewerId ? String(reviewerId) : "");
  const [pending, startTransition] = useState(false);

  if (!canManage) {
    return <p className="text-xs text-slate-body">Reviewer: {reviewers.find((item) => item.id === reviewerId)?.name ?? "Not assigned"}</p>;
  }

  return (
    <form
      action={async (formData: FormData) => {
        startTransition(true);
        try {
          const result = await assignReviewer(formData);
          if (result.ok) toast.success(result.message);
          else toast.error("Could not assign reviewer", result.message);
          router.refresh();
        } finally {
          startTransition(false);
        }
      }}
      className="flex flex-wrap items-end gap-2"
    >
      <input type="hidden" name="applicationId" value={applicationId} />
      <div className="min-w-0 flex-1">
        <label htmlFor="reviewer-select" className="label">
          Assigned reviewer
        </label>
        <select
          id="reviewer-select"
          name="reviewerId"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="w-full rounded-xl border border-line-strong bg-paper px-3 py-2 text-[13px]"
        >
          <option value="">Unassigned</option>
          {reviewers.map((reviewer) => (
            <option key={reviewer.id} value={reviewer.id}>
              {reviewer.name}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" className="btn btn-navy btn-sm" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <UserCheck className="h-4 w-4" aria-hidden />}
        {pending ? "Saving…" : "Assign"}
      </button>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* documents                                                           */
/* ------------------------------------------------------------------ */
export function DocumentsPanel({
  documents,
  canReview,
}: {
  documents: {
    id: number;
    doc_type: string;
    original_name: string;
    mime_type: string;
    size_bytes: number;
    status: string;
    remarks: string;
    uploaded_at: string;
  }[];
  canReview: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState<number | null>(null);

  const apply = async (documentId: number, status: "verified" | "rejected", remarks: string) => {
    const formData = new FormData();
    formData.set("documentId", String(documentId));
    formData.set("status", status);
    formData.set("remarks", remarks);
    setBusy(documentId);
    try {
      const result = await setDocumentStatus(EMPTY, formData);
      if (result.ok) toast.success(result.message);
      else toast.error("Could not update document", result.message);
      router.refresh();
    } finally {
      setBusy(null);
    }
  };

  if (documents.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line-strong px-5 py-8 text-center">
        <p className="text-sm font-bold text-navy">No documents uploaded</p>
        <p className="mt-1 text-xs text-slate-body">The applicant has not attached any files with this application.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {documents.map((doc) => (
        <li key={doc.id} className="rounded-2xl border border-line bg-offwhite/50 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={doc.status === "verified" ? "success" : doc.status === "rejected" ? "danger" : "warning"}>
                  {doc.status}
                </Badge>
                <span className="text-[13px] font-bold text-navy">{doc.doc_type}</span>
                <span className="text-[11px] text-slate-body">
                  {doc.original_name} · {(doc.size_bytes / 1024).toFixed(0)} KB
                </span>
              </div>
              {doc.remarks ? <p className="mt-1 text-xs text-slate-body">Remark: {doc.remarks}</p> : null}
            </div>

            <a href={`/api/admin/documents/${doc.id}`} className="btn btn-outline btn-sm">
              <Download className="h-4 w-4" aria-hidden />
              Download
            </a>
          </div>

          {canReview ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
              <label htmlFor={`doc-remarks-${doc.id}`} className="sr-only">
                Remarks for document {doc.id}
              </label>
              <input
                id={`doc-remarks-${doc.id}`}
                defaultValue={doc.remarks}
                placeholder="Remarks (required to reject)"
                className="field !w-auto min-w-[200px] flex-1 !py-1.5 !text-xs"
                data-doc-remarks={doc.id}
              />
              <button
                type="button"
                disabled={busy === doc.id}
                onClick={() => {
                  const input = window.document.querySelector<HTMLInputElement>(`[data-doc-remarks="${doc.id}"]`);
                  void apply(doc.id, "verified", input?.value ?? "");
                }}
                className="btn btn-primary btn-sm"
              >
                {busy === doc.id ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <CheckCircle2 className="h-4 w-4" aria-hidden />}
                Verify
              </button>
              <button
                type="button"
                disabled={busy === doc.id}
                onClick={() => {
                  const input = window.document.querySelector<HTMLInputElement>(`[data-doc-remarks="${doc.id}"]`);
                  const remarks = input?.value ?? "";
                  if (remarks.length < 3) {
                    toast.error("Add a remark before rejecting", "Explain why the document is being rejected.");
                    input?.focus();
                    return;
                  }
                  void apply(doc.id, "rejected", remarks);
                }}
                className="btn btn-danger btn-sm"
              >
                <XCircle className="h-4 w-4" aria-hidden />
                Reject
              </button>
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* review note                                                         */
/* ------------------------------------------------------------------ */
export function ApplicationNoteForm({ applicationId }: { applicationId: number }) {
  const [state, action, pending] = useActionState(addApplicationNote, EMPTY);
  const router = useRouter();
  const toast = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      toast.success(state.message);
      formRef.current?.reset();
      router.refresh();
    } else if (state.message) {
      toast.error("Could not save the note", state.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-3">
      <input type="hidden" name="applicationId" value={applicationId} />
      <input type="hidden" name="isInternal" value="1" />
      <ErrorSummary errors={state.errors} />
      <FieldShell label="Internal note" required error={state.errors?.notes}>
        {(id) => (
          <TextArea
            id={id}
            name="notes"
            rows={3}
            invalid={Boolean(state.errors?.notes)}
            placeholder="Interview observations, document clarifications, calls made…"
          />
        )}
      </FieldShell>
      <button type="submit" className="btn btn-navy btn-sm" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <ShieldAlert className="h-4 w-4" aria-hidden />}
        {pending ? "Saving…" : "Add internal note"}
      </button>
    </form>
  );
}
