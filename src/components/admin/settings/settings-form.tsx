"use client";

import { useActionState, useMemo, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { saveSettings, type ContentActionState } from "@/app/admin/actions/site-content";
import { useActionFeedback } from "@/components/admin/content-hub/use-action-feedback";
import { ErrorSummary, FieldShell, TextArea, TextInput } from "@/components/ui/fields";

export type SettingsFieldType = "text" | "textarea" | "number" | "boolean" | "url" | "tel" | "email" | "json";

export type SettingsField = {
  key: string;
  label: string;
  type: SettingsFieldType;
  help?: string;
  value: string;
};

export type SettingsGroup = {
  key: string;
  label: string;
  description: string;
  fields: SettingsField[];
};

const EMPTY: ContentActionState = {};

/**
 * One save form for a single settings group. Controls post repeating
 * `key`/`value` pairs in DOM order so `saveSettings` can zip them; boolean
 * fields mirror their checkbox into a hidden `value` (the checkbox itself
 * carries no `name`), so an unticked box still submits "false".
 */
export function SettingsGroupForm({ group }: { group: SettingsGroup }) {
  const router = useRouter();
  const initialValues = useMemo(
    () => Object.fromEntries(group.fields.map((field) => [field.key, field.value])),
    [group.fields],
  );
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [prevInitialValues, setPrevInitialValues] = useState(initialValues);
  if (prevInitialValues !== initialValues) {
    // Re-sync local values after the server revalidates with fresh settings.
    setPrevInitialValues(initialValues);
    setValues(initialValues);
  }
  const [state, formAction, pending] = useActionState(saveSettings, EMPTY);
  useActionFeedback(state, "Settings saved", () => router.refresh());

  const dirty = group.fields.some((field) => (values[field.key] ?? "") !== (initialValues[field.key] ?? ""));
  const setValue = (key: string, next: string) => setValues((current) => ({ ...current, [key]: next }));

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <ErrorSummary errors={state.errors} />

      <div className="grid gap-4 sm:grid-cols-2">
        {group.fields.map((field) => (
          <FieldShell
            key={field.key}
            label={field.label}
            hint={field.help}
            error={state.errors?.[field.key]}
            className={field.type === "textarea" || field.type === "boolean" ? "sm:col-span-2" : undefined}
          >
            {(id) => (
              <FieldControl
                id={id}
                field={field}
                value={values[field.key] ?? ""}
                error={state.errors?.[field.key]}
                onChange={(next) => setValue(field.key, next)}
              />
            )}
          </FieldShell>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
        <p role="status" aria-live="polite" className="mr-auto text-xs font-semibold">
          {state.ok ? (
            <span className="text-success">Saved</span>
          ) : dirty ? (
            <span className="text-amber">Unsaved changes</span>
          ) : (
            <span className="text-slate-body">All changes saved.</span>
          )}
        </p>
        <button type="submit" className="btn btn-primary" disabled={pending || !dirty}>
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Save className="h-4 w-4" aria-hidden />
          )}
          {pending ? "Saving…" : `Save ${group.label.toLowerCase()}`}
        </button>
      </div>
    </form>
  );
}

function FieldControl({
  id,
  field,
  value,
  error,
  onChange,
}: {
  id: string;
  field: SettingsField;
  value: string;
  error?: string;
  onChange: (next: string) => void;
}) {
  if (field.type === "boolean") {
    const checked = value === "true" || value === "1";
    return (
      <div className="flex items-center gap-3 rounded-xl border border-line bg-offwhite/60 px-3 py-3">
        <input type="hidden" name="key" value={field.key} />
        <input type="hidden" name="value" value={checked ? "true" : "false"} />
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked ? "true" : "false")}
          className="h-4 w-4 shrink-0 rounded border-line-strong accent-[#0b6b5c]"
        />
        <span className="text-sm font-semibold text-navy">{checked ? "Enabled" : "Disabled"}</span>
      </div>
    );
  }

  return (
    <>
      <input type="hidden" name="key" value={field.key} />
      {field.type === "textarea" ? (
        <TextArea
          id={id}
          name="value"
          defaultValue={value}
          rows={3}
          maxLength={2000}
          invalid={Boolean(error)}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <TextInput
          id={id}
          name="value"
          type={field.type === "number" || field.type === "json" ? "text" : field.type}
          defaultValue={value}
          maxLength={600}
          invalid={Boolean(error)}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </>
  );
}
