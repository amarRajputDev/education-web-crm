"use client";

import { useEffect, useActionState, useState } from "react";
import { saveEvent, type ContentActionResult } from "@/app/admin/actions/content";
import { ImagePathPicker } from "@/components/admin/content/image-picker";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { ErrorSummary, FieldShell, Select, TextArea, TextInput } from "@/components/ui/fields";
import { useToast } from "@/components/ui/toast";

const EMPTY: ContentActionResult = { ok: false, message: "", errors: {} };

const EVENT_CATEGORIES = ["Academic", "Workshop", "Seminar", "Cultural", "Sports", "Admission", "Other"] as const;

export type EventValues = {
  id?: number;
  title: string;
  category: string;
  summary: string;
  body: string;
  location: string;
  startsAt: string;
  endsAt: string;
  image: string;
  registrationUrl: string;
  status: string;
};

/** ISO / SQLite timestamp → value usable by <input type="datetime-local">. */
function toLocalInput(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const toIso = (value: string): string => (value ? new Date(value).toISOString() : "");

export function EventForm({ initial }: { initial?: EventValues }) {
  const [state, action, pending] = useActionState(saveEvent, EMPTY);
  const toast = useToast();
  const [startsAtLocal, setStartsAtLocal] = useState(() => toLocalInput(initial?.startsAt));
  const [endsAtLocal, setEndsAtLocal] = useState(() => toLocalInput(initial?.endsAt));

  useEffect(() => {
    if (!state.message) return;
    if (state.ok) toast.success(state.message);
    else toast.error(state.message);
  }, [state, toast]);

  return (
    <form action={action} className="space-y-5" noValidate>
      {initial?.id ? <input type="hidden" name="id" value={initial.id} /> : null}
      {/* The server stores ISO timestamps; the visible inputs stay in local time. */}
      <input type="hidden" name="startsAt" value={toIso(startsAtLocal)} />
      <input type="hidden" name="endsAt" value={toIso(endsAtLocal)} />

      <ErrorSummary errors={state.errors} />

      <FieldShell label="Title" required error={state.errors?.title}>
        {(id) => (
          <TextInput
            id={id}
            name="title"
            required
            defaultValue={initial?.title ?? ""}
            invalid={Boolean(state.errors?.title)}
            placeholder="e.g. Inter-college cricket tournament"
          />
        )}
      </FieldShell>

      <div className="grid gap-4 sm:grid-cols-2">
        <FieldShell label="Category" required error={state.errors?.category}>
          {(id) => (
            <Select id={id} name="category" defaultValue={initial?.category ?? "Academic"} invalid={Boolean(state.errors?.category)}>
              {EVENT_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Select>
          )}
        </FieldShell>

        <FieldShell label="Location" error={state.errors?.location}>
          {(id) => (
            <TextInput
              id={id}
              name="location"
              defaultValue={initial?.location ?? ""}
              invalid={Boolean(state.errors?.location)}
              placeholder="Main Auditorium"
            />
          )}
        </FieldShell>

        <FieldShell label="Starts at" required error={state.errors?.startsAt}>
          {(id) => (
            <TextInput
              id={id}
              type="datetime-local"
              value={startsAtLocal}
              required
              invalid={Boolean(state.errors?.startsAt)}
              onChange={(event) => setStartsAtLocal(event.target.value)}
            />
          )}
        </FieldShell>

        <FieldShell label="Ends at" error={state.errors?.endsAt} hint="Optional for single-day events.">
          {(id) => (
            <TextInput
              id={id}
              type="datetime-local"
              value={endsAtLocal}
              invalid={Boolean(state.errors?.endsAt)}
              onChange={(event) => setEndsAtLocal(event.target.value)}
            />
          )}
        </FieldShell>
      </div>

      <FieldShell label="Summary" error={state.errors?.summary} hint="Short teaser shown on event cards.">
        {(id) => (
          <TextArea
            id={id}
            name="summary"
            rows={2}
            maxLength={400}
            defaultValue={initial?.summary ?? ""}
            invalid={Boolean(state.errors?.summary)}
            placeholder="One or two sentences about the event"
          />
        )}
      </FieldShell>

      <FieldShell
        label="Body"
        error={state.errors?.body}
        hint="Tip: leave a blank line between paragraphs — each block is rendered as its own paragraph."
      >
        {(id) => (
          <TextArea
            id={id}
            name="body"
            rows={8}
            defaultValue={initial?.body ?? ""}
            invalid={Boolean(state.errors?.body)}
            placeholder="Detailed description, agenda, eligibility…"
          />
        )}
      </FieldShell>

      <div className="grid gap-4 sm:grid-cols-2">
        <ImagePathPicker
          name="image"
          label="Event image"
          defaultValue={initial?.image ?? "/images/seminar.jpg"}
          error={state.errors?.image}
          hint="Pick a bundled demo image or type a /images path."
        />

        <FieldShell label="Registration URL" error={state.errors?.registrationUrl} hint="Optional external link for registrations.">
          {(id) => (
            <TextInput
              id={id}
              name="registrationUrl"
              type="url"
              defaultValue={initial?.registrationUrl ?? ""}
              invalid={Boolean(state.errors?.registrationUrl)}
              placeholder="https://…"
            />
          )}
        </FieldShell>
      </div>

      <FieldShell label="Status" required error={state.errors?.status} hint="Drafts are hidden from the public site.">
        {(id) => (
          <Select id={id} name="status" defaultValue={initial?.status ?? "draft"} invalid={Boolean(state.errors?.status)}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </Select>
        )}
      </FieldShell>

      {state.message ? (
        <p
          role="status"
          className={cn(
            "rounded-xl border px-4 py-3 text-sm font-semibold",
            state.ok ? "border-[#c3e6d8] bg-success-100 text-success" : "border-[#f6cfcf] bg-danger-100 text-danger",
          )}
        >
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2 border-t border-line pt-5">
        <Button type="submit" loading={pending}>
          {pending ? "Saving…" : initial?.id ? "Save changes" : "Create event"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => window.history.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
