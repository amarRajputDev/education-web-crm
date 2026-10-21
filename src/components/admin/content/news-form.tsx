"use client";

import { useEffect, useActionState } from "react";
import { saveNews, type ContentActionResult } from "@/app/admin/actions/content";
import { ImagePathPicker } from "@/components/admin/content/image-picker";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { ErrorSummary, FieldShell, Select, TextArea, TextInput } from "@/components/ui/fields";
import { useToast } from "@/components/ui/toast";

const EMPTY: ContentActionResult = { ok: false, message: "", errors: {} };

const NEWS_CATEGORIES = ["News", "Notice", "Achievement", "Announcement"] as const;

export type NewsValues = {
  id?: number;
  title: string;
  category: string;
  excerpt: string;
  body: string;
  coverImage: string;
  author: string;
  status: string;
};

export function NewsForm({ initial }: { initial?: NewsValues }) {
  const [state, action, pending] = useActionState(saveNews, EMPTY);
  const toast = useToast();

  useEffect(() => {
    if (!state.message) return;
    if (state.ok) toast.success(state.message);
    else toast.error(state.message);
  }, [state, toast]);

  return (
    <form action={action} className="space-y-5" noValidate>
      {initial?.id ? <input type="hidden" name="id" value={initial.id} /> : null}

      <ErrorSummary errors={state.errors} />

      <FieldShell label="Title" required error={state.errors?.title}>
        {(id) => (
          <TextInput
            id={id}
            name="title"
            required
            defaultValue={initial?.title ?? ""}
            invalid={Boolean(state.errors?.title)}
            placeholder="e.g. Semester registration deadline extended"
          />
        )}
      </FieldShell>

      <div className="grid gap-4 sm:grid-cols-2">
        <FieldShell label="Category" required error={state.errors?.category}>
          {(id) => (
            <Select id={id} name="category" defaultValue={initial?.category ?? "Notice"} invalid={Boolean(state.errors?.category)}>
              {NEWS_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Select>
          )}
        </FieldShell>

        <FieldShell label="Status" required error={state.errors?.status} hint="Drafts are hidden from the public site.">
          {(id) => (
            <Select id={id} name="status" defaultValue={initial?.status ?? "draft"} invalid={Boolean(state.errors?.status)}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </Select>
          )}
        </FieldShell>
      </div>

      <FieldShell label="Excerpt" error={state.errors?.excerpt} hint="Shown in news listings. Leave blank to use the first lines of the body.">
        {(id) => (
          <TextArea
            id={id}
            name="excerpt"
            rows={2}
            maxLength={400}
            defaultValue={initial?.excerpt ?? ""}
            invalid={Boolean(state.errors?.excerpt)}
            placeholder="One or two sentences summarising the notice"
          />
        )}
      </FieldShell>

      <FieldShell
        label="Body"
        required
        error={state.errors?.body}
        hint="Tip: leave a blank line between paragraphs — each block is rendered as its own paragraph on the public site."
      >
        {(id) => (
          <TextArea
            id={id}
            name="body"
            rows={12}
            required
            defaultValue={initial?.body ?? ""}
            invalid={Boolean(state.errors?.body)}
            placeholder={"First paragraph.\n\nSecond paragraph."}
          />
        )}
      </FieldShell>

      <div className="grid gap-4 sm:grid-cols-2">
        <ImagePathPicker
          name="coverImage"
          label="Cover image"
          defaultValue={initial?.coverImage ?? "/images/news-1.jpg"}
          error={state.errors?.coverImage}
          hint="Pick a bundled demo image or type a /images path."
        />

        <FieldShell label="Author" error={state.errors?.author} hint="Shown as the byline. Defaults to Editorial Team.">
          {(id) => (
            <TextInput
              id={id}
              name="author"
              defaultValue={initial?.author ?? ""}
              invalid={Boolean(state.errors?.author)}
              placeholder="Editorial Team"
            />
          )}
        </FieldShell>
      </div>

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
          {pending ? "Saving…" : initial?.id ? "Save changes" : "Create notice"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => window.history.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
