"use client";

import { useActionState, useId, useState } from "react";
import { Loader2, RotateCcw, Save, X } from "lucide-react";
import { saveBlock, type ContentActionState } from "@/app/admin/actions/site-content";
import { ErrorSummary, FieldShell, TextArea, TextInput } from "@/components/ui/fields";
import { DEMO_IMAGES, type BlockDefinition } from "./block-defaults";
import { useActionFeedback } from "./use-action-feedback";

const EMPTY: ContentActionState = {};

export type BlockEditorValues = {
  title: string;
  body: string;
  image: string;
  metaJson: string;
};

export function BlockEditor({
  definition,
  initial,
  onClose,
}: {
  definition: BlockDefinition;
  initial: BlockEditorValues;
  onClose?: () => void;
}) {
  const [state, formAction, pending] = useActionState(saveBlock, EMPTY);
  const listId = useId();
  const [metaText, setMetaText] = useState(initial.metaJson);
  const [imageValue, setImageValue] = useState(initial.image);

  useActionFeedback(state, "Content block saved", onClose);

  const metaError = state.errors?.metaJson;

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="blockKey" value={definition.key} />
      <ErrorSummary errors={state.errors} />

      <div className="grid gap-4 sm:grid-cols-2">
        <FieldShell label="Heading" required error={state.errors?.title} className="sm:col-span-2">
          {(id) => (
            <TextInput
              id={id}
              name="title"
              defaultValue={initial.title}
              required
              maxLength={180}
              invalid={Boolean(state.errors?.title)}
              placeholder="Shown as the section heading on the public site"
            />
          )}
        </FieldShell>

        <FieldShell
          label="Body copy"
          hint="A blank line starts a new paragraph."
          error={state.errors?.body}
          className="sm:col-span-2"
        >
          {(id) => (
            <TextArea
              id={id}
              name="body"
              defaultValue={initial.body}
              rows={8}
              maxLength={20000}
              invalid={Boolean(state.errors?.body)}
              placeholder={"First paragraph.\n\nSecond paragraph."}
            />
          )}
        </FieldShell>

        <FieldShell
          label="Image path"
          hint="Choose a bundled demo image or type another path under /images."
          error={state.errors?.image}
        >
          {(id) => (
            <>
              <TextInput
                id={id}
                name="image"
                list={listId}
                value={imageValue}
                onChange={(event) => setImageValue(event.target.value)}
                invalid={Boolean(state.errors?.image)}
                placeholder="/images/hero-campus.jpg"
              />
              <datalist id={listId}>
                {DEMO_IMAGES.map((src) => (
                  <option key={src} value={src} />
                ))}
              </datalist>
            </>
          )}
        </FieldShell>

        <div className="w-full">
          <span className="label">Preview</span>
          {imageValue ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageValue}
              alt=""
              className="h-[76px] w-full max-w-[190px] rounded-xl border border-line bg-offwhite object-cover"
            />
          ) : (
            <p className="rounded-xl border border-dashed border-line-strong px-3 py-4 text-xs text-slate-body">
              No image selected.
            </p>
          )}
        </div>

        <div className="sm:col-span-2">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div className="min-w-0 flex-1">
              <label htmlFor={`${listId}-meta`} className="label">
                Meta JSON
              </label>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setMetaText(JSON.stringify(definition.defaultMeta, null, 2))}
            >
              <RotateCcw className="h-4 w-4" aria-hidden />
              Reset to default
            </button>
          </div>
          <textarea
            id={`${listId}-meta`}
            name="metaJson"
            className="field font-mono text-xs"
            rows={10}
            spellCheck={false}
            value={metaText}
            onChange={(event) => setMetaText(event.target.value)}
            aria-invalid={metaError ? true : undefined}
            aria-describedby={metaError ? `${listId}-meta-error` : undefined}
          />
          {metaError ? (
            <p id={`${listId}-meta-error`} className="error-text">
              {metaError}
            </p>
          ) : (
            <p className="hint mt-1">
              Structured data for this block, e.g. name / role / stats. Must be a JSON object.
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line pt-4">
        <p role="status" aria-live="polite" className="mr-auto text-xs font-semibold text-success">
          {state.ok ? state.message : ""}
        </p>
        {onClose ? (
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose} disabled={pending}>
            <X className="h-4 w-4" aria-hidden />
            Close
          </button>
        ) : null}
        <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
          {pending ? "Saving…" : "Save block"}
        </button>
      </div>
    </form>
  );
}
