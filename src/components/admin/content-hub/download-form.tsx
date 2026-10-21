"use client";

import { useActionState, useState } from "react";
import { Download, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import {
  deleteDownload,
  saveDownload,
  type ContentActionState,
} from "@/app/admin/actions/site-content";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import { ErrorSummary, FieldShell, Select, TextArea, TextInput } from "@/components/ui/fields";
import { EmptyState } from "@/components/ui/feedback";
import { statusTone } from "@/lib/format";
import { useToast } from "@/components/ui/toast";
import { useActionFeedback } from "./use-action-feedback";

const EMPTY: ContentActionState = {};

export type DownloadRow = {
  id: number;
  title: string;
  category: string;
  description: string;
  file_path: string;
  external_url: string;
  status: string;
  downloads_count: number;
};

const FORM_ID = "download-editor-form";

const CATEGORIES = ["Prospectus", "Fees", "Admissions", "Academic", "Forms", "Policies"];

export function DownloadForm({
  initial,
  onClose,
}: {
  initial: DownloadRow | null;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(saveDownload, EMPTY);

  useActionFeedback(state, "Downloads updated", onClose);

  return (
    <Dialog
      open
      onClose={onClose}
      size="lg"
      title={initial ? `Edit ${initial.title}` : "New document"}
      description="Documents must exist under /public/documents unless you use an external link."
      footer={
        <>
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={pending}>
            Cancel
          </button>
          <button type="submit" form={FORM_ID} className="btn btn-primary" disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            {pending ? "Saving…" : initial ? "Save changes" : "Add document"}
          </button>
        </>
      }
    >
      <form id={FORM_ID} action={formAction} className="space-y-4" noValidate>
        {initial ? <input type="hidden" name="id" value={initial.id} /> : null}
        <ErrorSummary errors={state.errors} />

        <FieldShell label="Title" required error={state.errors?.title}>
          {(id) => (
            <TextInput
              id={id}
              name="title"
              required
              maxLength={160}
              defaultValue={initial?.title ?? ""}
              invalid={Boolean(state.errors?.title)}
              placeholder="Institute Prospectus 2027–28"
            />
          )}
        </FieldShell>

        <div className="grid gap-4 sm:grid-cols-2">
          <FieldShell label="Category" required error={state.errors?.category}>
            {(id) => (
              <>
                <TextInput
                  id={id}
                  name="category"
                  required
                  list="download-categories"
                  maxLength={60}
                  defaultValue={initial?.category ?? "Prospectus"}
                  invalid={Boolean(state.errors?.category)}
                />
                <datalist id="download-categories">
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category} />
                  ))}
                </datalist>
              </>
            )}
          </FieldShell>

          <FieldShell label="Status" required error={state.errors?.status} hint="Drafts are hidden from the public site.">
            {(id) => (
              <Select
                id={id}
                name="status"
                defaultValue={initial?.status ?? "published"}
                invalid={Boolean(state.errors?.status)}
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </Select>
            )}
          </FieldShell>
        </div>

        <FieldShell label="Description" error={state.errors?.description} hint="One line shown under the title.">
          {(id) => (
            <TextArea
              id={id}
              name="description"
              rows={2}
              maxLength={500}
              defaultValue={initial?.description ?? ""}
              invalid={Boolean(state.errors?.description)}
              placeholder="Programmes, campuses, admission process and fee overview."
            />
          )}
        </FieldShell>

        <div className="grid gap-4 sm:grid-cols-2">
          <FieldShell
            label="File path"
            error={state.errors?.filePath}
            hint="e.g. /documents/prospectus-2027-28.txt — the file must live in public/documents."
          >
            {(id) => (
              <TextInput
                id={id}
                name="filePath"
                maxLength={300}
                defaultValue={initial?.file_path ?? ""}
                invalid={Boolean(state.errors?.filePath)}
                placeholder="/documents/prospectus-2027-28.txt"
              />
            )}
          </FieldShell>

          <FieldShell
            label="External link"
            error={state.errors?.externalUrl}
            hint="Optional. Used instead of a file when both are filled in."
          >
            {(id) => (
              <TextInput
                id={id}
                name="externalUrl"
                type="url"
                maxLength={400}
                defaultValue={initial?.external_url ?? ""}
                invalid={Boolean(state.errors?.externalUrl)}
                placeholder="https://…"
              />
            )}
          </FieldShell>
        </div>

        <p role="status" aria-live="polite" className="text-xs font-semibold text-success">
          {state.ok ? state.message : ""}
        </p>
      </form>
    </Dialog>
  );
}

export function DownloadsManager({ rows }: { rows: DownloadRow[] }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DownloadRow | null>(null);
  const [confirming, setConfirming] = useState<DownloadRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const toast = useToast();

  async function run(mutate: () => Promise<ContentActionState>) {
    setBusy(true);
    try {
      const result = await mutate();
      const message = result.message ?? "Done.";
      setStatus(message);
      if (result.ok) toast.success(message);
      else toast.error(message);
    } catch {
      const message = "Something went wrong. Please try again.";
      setStatus(message);
      toast.error(message);
    } finally {
      setBusy(false);
      setConfirming(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-body">
          <span className="font-semibold text-navy">{rows.length}</span> document{rows.length === 1 ? "" : "s"} ·{" "}
          <span className="font-semibold text-navy">
            {rows.reduce((total, row) => total + row.downloads_count, 0)}
          </span>{" "}
          downloads recorded
        </p>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" aria-hidden />
          New document
        </button>
      </div>

      {status ? (
        <p role="status" aria-live="polite" className="text-xs font-semibold text-royal">
          {status}
        </p>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState
          icon="document"
          title="No documents yet"
          description="Add a prospectus, fee structure or checklist so applicants can download it."
          action={
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" aria-hidden />
              New document
            </button>
          }
        />
      ) : (
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Title</th>
                <th scope="col">Category</th>
                <th scope="col">Path</th>
                <th scope="col">Status</th>
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <span className="flex min-w-[220px] items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-royal-100 text-royal">
                        <Download className="h-4 w-4" aria-hidden />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-navy">{row.title}</span>
                        <span className="line-clamp-1 block max-w-[320px] text-xs text-slate-body">
                          {row.description || "—"}
                        </span>
                      </span>
                    </span>
                  </td>
                  <td className="whitespace-nowrap text-xs">{row.category}</td>
                  <td className="max-w-[300px]">
                    <span className="block truncate font-mono text-[11px] text-slate-body">
                      {row.file_path || row.external_url || "—"}
                    </span>
                  </td>
                  <td>
                    <Badge tone={statusTone(row.status)}>{row.status}</Badge>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        disabled={busy}
                        aria-label={`Edit ${row.title}`}
                        title="Edit"
                        onClick={() => {
                          setEditing(row);
                          setFormOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm text-danger"
                        disabled={busy}
                        aria-label={`Delete ${row.title}`}
                        title="Delete"
                        onClick={() => setConfirming(row)}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {formOpen ? <DownloadForm initial={editing} onClose={() => setFormOpen(false)} /> : null}

      <ConfirmDialog
        open={Boolean(confirming)}
        onClose={() => setConfirming(null)}
        onConfirm={() => {
          if (confirming) void run(() => deleteDownload(confirming.id));
        }}
        title="Delete document"
        message={`Delete "${confirming?.title ?? ""}" from the downloads list? The file on disk is not removed.`}
        confirmLabel="Delete"
        loading={busy}
      />
    </div>
  );
}
