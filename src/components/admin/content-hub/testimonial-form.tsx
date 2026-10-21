"use client";

import { useActionState, useId, useState } from "react";
import { Eye, EyeOff, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import {
  deleteTestimonial,
  saveTestimonial,
  toggleTestimonialStatus,
  type ContentActionState,
} from "@/app/admin/actions/site-content";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import { ErrorSummary, FieldShell, Select, TextArea, TextInput } from "@/components/ui/fields";
import { EmptyState } from "@/components/ui/feedback";
import { statusTone } from "@/lib/format";
import { useToast } from "@/components/ui/toast";
import { DEMO_IMAGES } from "./block-defaults";
import { useActionFeedback } from "./use-action-feedback";

const EMPTY: ContentActionState = {};

export type TestimonialRow = {
  id: number;
  name: string;
  role: string;
  program: string;
  grad_year: string;
  quote: string;
  photo: string;
  is_demo: number;
  status: string;
  sort_order: number;
};

const FORM_ID = "testimonial-editor-form";

export function TestimonialForm({
  initial,
  onClose,
}: {
  initial: TestimonialRow | null;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(saveTestimonial, EMPTY);
  const photoListId = useId();

  useActionFeedback(state, "Testimonials updated", onClose);

  return (
    <Dialog
      open
      onClose={onClose}
      size="lg"
      title={initial ? `Edit ${initial.name}` : "New testimonial"}
      description="Testimonials appear on the homepage and the public testimonials section."
      footer={
        <>
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={pending}>
            Cancel
          </button>
          <button type="submit" form={FORM_ID} className="btn btn-primary" disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            {pending ? "Saving…" : initial ? "Save changes" : "Add testimonial"}
          </button>
        </>
      }
    >
      <form id={FORM_ID} action={formAction} className="space-y-4" noValidate>
        {initial ? <input type="hidden" name="id" value={initial.id} /> : null}
        <ErrorSummary errors={state.errors} />

        <div className="grid gap-4 sm:grid-cols-2">
          <FieldShell label="Name" required error={state.errors?.name}>
            {(id) => (
              <TextInput
                id={id}
                name="name"
                required
                maxLength={120}
                defaultValue={initial?.name ?? ""}
                invalid={Boolean(state.errors?.name)}
                placeholder="e.g. Aarav Khanna"
              />
            )}
          </FieldShell>

          <FieldShell label="Role / description" error={state.errors?.role} hint="Shown under the name, e.g. Class of 2025.">
            {(id) => (
              <TextInput
                id={id}
                name="role"
                maxLength={160}
                defaultValue={initial?.role ?? ""}
                invalid={Boolean(state.errors?.role)}
                placeholder="B.Tech Computer Science, Class of 2025"
              />
            )}
          </FieldShell>

          <FieldShell label="Programme" error={state.errors?.program}>
            {(id) => (
              <TextInput
                id={id}
                name="program"
                maxLength={120}
                defaultValue={initial?.program ?? ""}
                invalid={Boolean(state.errors?.program)}
                placeholder="B.Tech CSE"
              />
            )}
          </FieldShell>

          <FieldShell label="Graduation year" error={state.errors?.gradYear}>
            {(id) => (
              <TextInput
                id={id}
                name="gradYear"
                maxLength={12}
                inputMode="numeric"
                defaultValue={initial?.grad_year ?? ""}
                invalid={Boolean(state.errors?.gradYear)}
                placeholder="2025"
              />
            )}
          </FieldShell>
        </div>

        <FieldShell
          label="Quote"
          required
          error={state.errors?.quote}
          hint="One or two sentences in the student's own words."
        >
          {(id) => (
            <TextArea
              id={id}
              name="quote"
              required
              rows={4}
              maxLength={800}
              defaultValue={initial?.quote ?? ""}
              invalid={Boolean(state.errors?.quote)}
              placeholder="What did the student take away from their time at the institute?"
            />
          )}
        </FieldShell>

        <div className="grid gap-4 sm:grid-cols-2">
          <FieldShell
            label="Photo path"
            error={state.errors?.photo}
            hint="Pick a bundled demo portrait or type a /images path."
          >
            {(id) => (
              <>
                <TextInput
                  id={id}
                  name="photo"
                  list={photoListId}
                  maxLength={300}
                  defaultValue={initial?.photo ?? ""}
                  invalid={Boolean(state.errors?.photo)}
                  placeholder="/images/p-01.jpg"
                />
                <datalist id={photoListId}>
                  {DEMO_IMAGES.filter((src) => src.includes("/p-")).map((src) => (
                    <option key={src} value={src} />
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

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-offwhite/60 px-3 py-3">
          <input
            type="checkbox"
            name="isDemo"
            value="true"
            defaultChecked={initial ? initial.is_demo === 1 : true}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-line-strong accent-[#0b6b5c]"
          />
          <span>
            <span className="block text-sm font-semibold text-navy">Mark as demo content</span>
            <span className="block text-xs text-slate-body">
              Renders a Demo badge so visitors know the quote is fictional sample content until it is replaced with a
              real testimonial.
            </span>
          </span>
        </label>

        <p role="status" aria-live="polite" className="text-xs font-semibold text-success">
          {state.ok ? state.message : ""}
        </p>
      </form>
    </Dialog>
  );
}

export function TestimonialsManager({ rows }: { rows: TestimonialRow[] }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TestimonialRow | null>(null);
  const [confirming, setConfirming] = useState<TestimonialRow | null>(null);
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

  const published = rows.filter((row) => row.status === "published").length;
  const demoCount = rows.filter((row) => row.is_demo === 1).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-body">
          <span className="font-semibold text-navy">{rows.length}</span> testimonial{rows.length === 1 ? "" : "s"} ·{" "}
          <span className="font-semibold text-navy">{published}</span> published ·{" "}
          <span className="font-semibold text-navy">{demoCount}</span> marked demo
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
          New testimonial
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
          title="No testimonials yet"
          description="Add a student or parent quote to show social proof on the homepage."
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
              New testimonial
            </button>
          }
        />
      ) : (
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Student</th>
                <th scope="col">Role</th>
                <th scope="col">Programme</th>
                <th scope="col">Year</th>
                <th scope="col">Demo</th>
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
                    <div className="flex min-w-[220px] items-center gap-3">
                      {row.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={row.photo}
                          alt=""
                          className="h-9 w-9 shrink-0 rounded-full border border-line bg-offwhite object-cover"
                        />
                      ) : (
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-royal-100 text-[11px] font-bold text-royal">
                          {row.name
                            .split(/\s+/)
                            .filter(Boolean)
                            .slice(0, 2)
                            .map((part) => part[0]?.toUpperCase() ?? "")
                            .join("")}
                        </span>
                      )}
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-navy">{row.name}</span>
                        <span className="line-clamp-1 block max-w-[300px] text-xs text-slate-body">{row.quote}</span>
                      </span>
                    </div>
                  </td>
                  <td className="max-w-[220px] text-xs">{row.role || "—"}</td>
                  <td className="whitespace-nowrap text-xs">{row.program || "—"}</td>
                  <td className="whitespace-nowrap tabular-nums text-xs">{row.grad_year || "—"}</td>
                  <td>
                    {row.is_demo === 1 ? (
                      <span title="Fictional sample content until replaced with a real testimonial.">
                        <Badge tone="warning">Demo</Badge>
                      </span>
                    ) : (
                      <span className="text-xs text-slate-body">—</span>
                    )}
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
                        aria-label={`Edit testimonial by ${row.name}`}
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
                        className="btn btn-ghost btn-sm"
                        disabled={busy}
                        aria-label={
                          row.status === "published"
                            ? `Unpublish testimonial by ${row.name}`
                            : `Publish testimonial by ${row.name}`
                        }
                        title={row.status === "published" ? "Unpublish" : "Publish"}
                        onClick={() => run(() => toggleTestimonialStatus(row.id))}
                      >
                        {row.status === "published" ? (
                          <EyeOff className="h-4 w-4" aria-hidden />
                        ) : (
                          <Eye className="h-4 w-4" aria-hidden />
                        )}
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm text-danger"
                        disabled={busy}
                        aria-label={`Delete testimonial by ${row.name}`}
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

      {formOpen ? <TestimonialForm initial={editing} onClose={() => setFormOpen(false)} /> : null}

      <ConfirmDialog
        open={Boolean(confirming)}
        onClose={() => setConfirming(null)}
        onConfirm={() => {
          if (confirming) void run(() => deleteTestimonial(confirming.id));
        }}
        title="Delete testimonial"
        message={`Delete the testimonial by "${confirming?.name ?? ""}"? This cannot be undone.`}
        confirmLabel="Delete"
        loading={busy}
      />
    </div>
  );
}
