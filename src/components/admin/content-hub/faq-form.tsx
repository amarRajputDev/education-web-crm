"use client";

import { useActionState, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import {
  deleteFaq,
  reorderFaq,
  saveFaq,
  toggleFaqStatus,
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

export type FaqRow = {
  id: number;
  category: string;
  question: string;
  answer: string;
  sort_order: number;
  status: string;
};

const FORM_ID = "faq-editor-form";

export function FaqForm({
  initial,
  categories,
  defaultOrder,
  onClose,
}: {
  initial: FaqRow | null;
  categories: string[];
  defaultOrder: number;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(saveFaq, EMPTY);
  const listId = `faq-categories-${initial ? initial.id : "new"}`;

  useActionFeedback(state, "FAQs updated", onClose);

  return (
    <Dialog
      open
      onClose={onClose}
      title={initial ? "Edit question" : "New question"}
      description="Questions are grouped by category and ordered by the number in each group."
      footer={
        <>
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={pending}>
            Cancel
          </button>
          <button type="submit" form={FORM_ID} className="btn btn-primary" disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            {pending ? "Saving…" : initial ? "Save changes" : "Add question"}
          </button>
        </>
      }
    >
      <form id={FORM_ID} action={formAction} className="space-y-4" noValidate>
        {initial ? <input type="hidden" name="id" value={initial.id} /> : null}
        <ErrorSummary errors={state.errors} />

        <FieldShell label="Category" required error={state.errors?.category} hint="Grouping heading on the public FAQs page.">
          {(id) => (
            <>
              <TextInput
                id={id}
                name="category"
                required
                list={listId}
                maxLength={60}
                defaultValue={initial?.category ?? "Admissions"}
                invalid={Boolean(state.errors?.category)}
                placeholder="Admissions"
              />
              <datalist id={listId}>
                {categories.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
            </>
          )}
        </FieldShell>

        <FieldShell label="Question" required error={state.errors?.question}>
          {(id) => (
            <TextInput
              id={id}
              name="question"
              required
              maxLength={300}
              defaultValue={initial?.question ?? ""}
              invalid={Boolean(state.errors?.question)}
              placeholder="How do I apply for a programme?"
            />
          )}
        </FieldShell>

        <FieldShell
          label="Answer"
          required
          error={state.errors?.answer}
          hint="A blank line starts a new paragraph on the public site."
        >
          {(id) => (
            <TextArea
              id={id}
              name="answer"
              required
              rows={5}
              maxLength={4000}
              defaultValue={initial?.answer ?? ""}
              invalid={Boolean(state.errors?.answer)}
              placeholder="Give a short, complete answer."
            />
          )}
        </FieldShell>

        <div className="grid gap-4 sm:grid-cols-2">
          <FieldShell
            label="Sort order"
            error={state.errors?.sortOrder}
            hint="Lower numbers appear first inside the category."
          >
            {(id) => (
              <TextInput
                id={id}
                name="sortOrder"
                type="number"
                min={0}
                max={9999}
                defaultValue={initial?.sort_order ?? defaultOrder}
                invalid={Boolean(state.errors?.sortOrder)}
              />
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

        <p role="status" aria-live="polite" className="text-xs font-semibold text-success">
          {state.ok ? state.message : ""}
        </p>
      </form>
    </Dialog>
  );
}

export function FaqsManager({ rows }: { rows: FaqRow[] }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FaqRow | null>(null);
  const [confirming, setConfirming] = useState<FaqRow | null>(null);
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

  const groups = useMemo(() => {
    const map = new Map<string, FaqRow[]>();
    for (const row of rows) {
      const bucket = map.get(row.category);
      if (bucket) bucket.push(row);
      else map.set(row.category, [row]);
    }
    return Array.from(map.entries())
      .map(([category, items]) => ({
        category,
        items: [...items].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id),
      }))
      .sort((a, b) => (a.items[0]?.sort_order ?? 0) - (b.items[0]?.sort_order ?? 0) || a.category.localeCompare(b.category));
  }, [rows]);

  const categories = useMemo(() => groups.map((group) => group.category), [groups]);
  const maxOrder = rows.reduce((max, row) => Math.max(max, row.sort_order), 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-body">
          <span className="font-semibold text-navy">{rows.length}</span> question{rows.length === 1 ? "" : "s"} across{" "}
          <span className="font-semibold text-navy">{groups.length}</span> categor{groups.length === 1 ? "y" : "ies"}
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
          New question
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
          title="No questions yet"
          description="Add frequently asked questions so visitors can self-serve before contacting admissions."
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
              New question
            </button>
          }
        />
      ) : (
        groups.map((group) => (
          <section key={group.category} aria-label={`${group.category} questions`}>
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-sm font-bold text-navy">{group.category}</h3>
              <span className="text-xs text-slate-body">
                {group.items.length} question{group.items.length === 1 ? "" : "s"} · use the arrows to reorder
              </span>
            </div>
            <div className="table-shell">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Order</th>
                    <th scope="col">Question</th>
                    <th scope="col">Answer</th>
                    <th scope="col">Status</th>
                    <th scope="col">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {group.items.map((row, index) => (
                    <tr key={row.id}>
                      <td>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            className="rounded-lg border border-line bg-white p-1.5 text-slate-body transition hover:border-royal hover:text-royal disabled:opacity-40"
                            disabled={busy || index === 0}
                            aria-label={`Move "${row.question}" up in ${group.category}`}
                            title="Move up"
                            onClick={() => run(() => reorderFaq(row.id, "up"))}
                          >
                            <ArrowUp className="h-4 w-4" aria-hidden />
                          </button>
                          <span className="w-7 text-center tabular-nums text-xs font-semibold text-navy">
                            {row.sort_order}
                          </span>
                          <button
                            type="button"
                            className="rounded-lg border border-line bg-white p-1.5 text-slate-body transition hover:border-royal hover:text-royal disabled:opacity-40"
                            disabled={busy || index === group.items.length - 1}
                            aria-label={`Move "${row.question}" down in ${group.category}`}
                            title="Move down"
                            onClick={() => run(() => reorderFaq(row.id, "down"))}
                          >
                            <ArrowDown className="h-4 w-4" aria-hidden />
                          </button>
                        </div>
                      </td>
                      <td className="min-w-[240px] font-semibold text-navy">{row.question}</td>
                      <td className="max-w-[420px]">
                        <span className="line-clamp-2 block text-xs text-slate-body">{row.answer}</span>
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
                            aria-label={`Edit question: ${row.question}`}
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
                                ? `Unpublish question: ${row.question}`
                                : `Publish question: ${row.question}`
                            }
                            title={row.status === "published" ? "Unpublish" : "Publish"}
                            onClick={() => run(() => toggleFaqStatus(row.id))}
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
                            aria-label={`Delete question: ${row.question}`}
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
          </section>
        ))
      )}

      {formOpen ? (
        <FaqForm
          initial={editing}
          categories={categories}
          defaultOrder={maxOrder + 1}
          onClose={() => setFormOpen(false)}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(confirming)}
        onClose={() => setConfirming(null)}
        onConfirm={() => {
          if (confirming) void run(() => deleteFaq(confirming.id));
        }}
        title="Delete question"
        message={`Delete "${confirming?.question ?? ""}"? This cannot be undone.`}
        confirmLabel="Delete"
        loading={busy}
      />
    </div>
  );
}
