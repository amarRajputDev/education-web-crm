"use client";

import { useActionState, useId, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { saveSettings, type ContentActionState } from "@/app/admin/actions/site-content";
import { ErrorSummary, FieldShell, TextArea, TextInput } from "@/components/ui/fields";
import { SETTING_DEFINITIONS } from "@/lib/setting-defs";
import { DEMO_IMAGES } from "./block-defaults";
import { useActionFeedback } from "./use-action-feedback";

const EMPTY: ContentActionState = {};

const STAT_KEYS = ["stat_programs", "stat_faculty", "stat_students", "stat_partners"] as const;

const TEXTAREA_KEYS: string[] = ["hero_text", "announcement_text"];
const NUMBER_KEYS: string[] = [...STAT_KEYS];

function definitionFor(key: string): {
  value: string;
  group: string;
  label: string;
  type: "text" | "textarea" | "number" | "boolean" | "url" | "tel" | "email" | "json";
  help?: string;
} {
  return SETTING_DEFINITIONS[key] ?? { value: "", group: "home", label: key, type: "text" };
}

function SettingField({
  fieldKey,
  value,
  error,
  listId,
}: {
  fieldKey: string;
  value: string;
  error?: string;
  listId?: string;
}) {
  const definition = definitionFor(fieldKey);
  const isNumber = NUMBER_KEYS.includes(fieldKey);
  const isTextarea = TEXTAREA_KEYS.includes(fieldKey);

  return (
    <FieldShell
      label={definition.label}
      error={error}
      hint={
        isNumber
          ? "Digits, commas and a trailing + are accepted (e.g. 6,500+)."
          : fieldKey === "hero_image"
            ? "Pick a bundled demo image or type a /images path."
            : definition.help
      }
    >
      {(id) => (
        <>
          <input type="hidden" name="key" value={fieldKey} />
          {isTextarea ? (
            <TextArea
              id={id}
              name="value"
              defaultValue={value}
              rows={3}
              maxLength={600}
              invalid={Boolean(error)}
            />
          ) : (
            <TextInput
              id={id}
              name="value"
              defaultValue={value}
              list={listId}
              maxLength={400}
              invalid={Boolean(error)}
            />
          )}
        </>
      )}
    </FieldShell>
  );
}

export function HomepageSettingsForm({ values }: { values: Record<string, string> }) {
  const [state, formAction, pending] = useActionState(saveSettings, EMPTY);
  const listId = useId();
  const [enabled, setEnabled] = useState(
    (values.announcement_enabled ?? "true") === "true" || values.announcement_enabled === "1",
  );

  useActionFeedback(state, "Homepage settings saved");

  const errors = state.errors;

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <ErrorSummary errors={errors} />

      <section className="space-y-4">
        <div>
          <h3 className="text-sm font-bold text-navy">Announcement strip</h3>
          <p className="mt-0.5 text-xs text-slate-body">Shown above the public header on every page.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldShell
            label={definitionFor("announcement_enabled").label}
            error={errors?.announcement_enabled}
            hint={definitionFor("announcement_enabled").help}
          >
            {(id) => (
              <div className="flex items-center gap-3 rounded-xl border border-line bg-offwhite/60 px-3 py-3">
                <input type="hidden" name="key" value="announcement_enabled" />
                <input type="hidden" name="value" value={enabled ? "true" : "false"} />
                <input
                  id={id}
                  type="checkbox"
                  checked={enabled}
                  onChange={(event) => setEnabled(event.target.checked)}
                  className="h-4 w-4 shrink-0 rounded border-line-strong accent-[#0b6b5c]"
                />
                <span className="text-sm font-semibold text-navy">
                  {enabled ? "Visible on the public site" : "Hidden on the public site"}
                </span>
              </div>
            )}
          </FieldShell>

          <SettingField
            fieldKey="application_window"
            value={values.application_window ?? ""}
            error={errors?.application_window}
          />
        </div>
        <SettingField
          fieldKey="announcement_text"
          value={values.announcement_text ?? ""}
          error={errors?.announcement_text}
        />
      </section>

      <section className="space-y-4 border-t border-line pt-5">
        <div>
          <h3 className="text-sm font-bold text-navy">Homepage hero</h3>
          <p className="mt-0.5 text-xs text-slate-body">Headline block at the top of the public homepage.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <SettingField fieldKey="hero_eyebrow" value={values.hero_eyebrow ?? ""} error={errors?.hero_eyebrow} />
          <SettingField fieldKey="hero_title" value={values.hero_title ?? ""} error={errors?.hero_title} />
        </div>
        <SettingField fieldKey="hero_text" value={values.hero_text ?? ""} error={errors?.hero_text} />
        <SettingField
          fieldKey="hero_image"
          value={values.hero_image ?? ""}
          error={errors?.hero_image}
          listId={listId}
        />
        <datalist id={listId}>
          {DEMO_IMAGES.map((src) => (
            <option key={src} value={src} />
          ))}
        </datalist>
      </section>

      <section className="space-y-4 border-t border-line pt-5">
        <div>
          <h3 className="text-sm font-bold text-navy">Homepage statistics</h3>
          <p className="mt-0.5 text-xs text-slate-body">Four counters shown under the hero.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {STAT_KEYS.map((key) => (
            <SettingField key={key} fieldKey={key} value={values[key] ?? ""} error={errors?.[key]} />
          ))}
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
        <p role="status" aria-live="polite" className="mr-auto text-xs font-semibold text-success">
          {state.ok ? state.message : ""}
        </p>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
          {pending ? "Saving…" : "Save homepage settings"}
        </button>
      </div>
    </form>
  );
}
