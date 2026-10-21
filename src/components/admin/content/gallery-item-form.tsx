"use client";

import { useEffect, useActionState } from "react";
import { saveGalleryItem, type ContentActionResult } from "@/app/admin/actions/content";
import { ImagePathPicker } from "@/components/admin/content/image-picker";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { ErrorSummary, FieldShell, Select, TextArea, TextInput } from "@/components/ui/fields";
import { useToast } from "@/components/ui/toast";

const EMPTY: ContentActionResult = { ok: false, message: "", errors: {} };

const GALLERY_CATEGORIES = ["Campus", "Laboratory", "Library", "Sports", "Cultural", "Events"] as const;

export type GalleryItemValues = {
  id?: number;
  title: string;
  category: string;
  image: string;
  alt: string;
  caption: string;
  sortOrder: number;
  status: string;
};

export function GalleryItemForm({
  initial,
  onDone,
}: {
  initial?: GalleryItemValues;
  onDone?: () => void;
}) {
  const [state, action, pending] = useActionState(saveGalleryItem, EMPTY);
  const toast = useToast();

  useEffect(() => {
    if (!state.message) return;
    if (state.ok) {
      toast.success(state.message);
      onDone?.();
    } else {
      toast.error(state.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, toast]);

  return (
    <form action={action} className="space-y-4" noValidate>
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
            placeholder="e.g. Central library reading hall"
          />
        )}
      </FieldShell>

      <div className="grid gap-4 sm:grid-cols-2">
        <FieldShell label="Category" required error={state.errors?.category}>
          {(id) => (
            <Select id={id} name="category" defaultValue={initial?.category ?? "Campus"} invalid={Boolean(state.errors?.category)}>
              {GALLERY_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Select>
          )}
        </FieldShell>

        <FieldShell label="Sort order" required error={state.errors?.sortOrder} hint="Lower numbers appear first.">
          {(id) => (
            <TextInput
              id={id}
              name="sortOrder"
              type="number"
              min={0}
              max={9999}
              required
              defaultValue={initial?.sortOrder ?? 0}
              invalid={Boolean(state.errors?.sortOrder)}
            />
          )}
        </FieldShell>
      </div>

      <ImagePathPicker
        name="image"
        label="Image"
        defaultValue={initial?.image ?? "/images/gallery-1.jpg"}
        error={state.errors?.image}
        hint="Pick a bundled demo image or type a /images path."
        required
      />

      <FieldShell label="Alt text" error={state.errors?.alt} hint="Describe the photo for screen readers.">
        {(id) => (
          <TextInput
            id={id}
            name="alt"
            defaultValue={initial?.alt ?? ""}
            invalid={Boolean(state.errors?.alt)}
            placeholder="Students in the science laboratory"
          />
        )}
      </FieldShell>

      <FieldShell label="Caption" error={state.errors?.caption}>
        {(id) => (
          <TextArea
            id={id}
            name="caption"
            rows={2}
            maxLength={300}
            defaultValue={initial?.caption ?? ""}
            invalid={Boolean(state.errors?.caption)}
            placeholder="Optional caption shown under the image"
          />
        )}
      </FieldShell>

      <FieldShell label="Status" required error={state.errors?.status}>
        {(id) => (
          <Select id={id} name="status" defaultValue={initial?.status ?? "published"} invalid={Boolean(state.errors?.status)}>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
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

      <div className="flex flex-wrap gap-2 border-t border-line pt-4">
        <Button type="submit" loading={pending}>
          {pending ? "Saving…" : initial?.id ? "Save changes" : "Add image"}
        </Button>
        {onDone ? (
          <Button type="button" variant="ghost" onClick={onDone}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}
