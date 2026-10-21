"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import {
  deleteGalleryItem,
  reorderGallery,
  type ContentActionResult,
} from "@/app/admin/actions/content";
import { GalleryItemForm } from "@/components/admin/content/gallery-item-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/feedback";
import { statusTone } from "@/lib/format";
import { useToast } from "@/components/ui/toast";

export type GalleryItem = {
  id: number;
  title: string;
  category: string;
  image: string;
  alt: string;
  caption: string;
  sort_order: number;
  status: string;
};

const CATEGORY_OPTIONS = ["All", "Campus", "Laboratory", "Library", "Sports", "Cultural", "Events"] as const;

export function GalleryManager({ items }: { items: GalleryItem[] }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [category, setCategory] = useState<(typeof CATEGORY_OPTIONS)[number]>("All");
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<GalleryItem | null>(null);
  const [deleting, setDeleting] = useState<GalleryItem | null>(null);
  const [status, setStatus] = useState<ContentActionResult | null>(null);

  const visible = useMemo(
    () => (category === "All" ? items : items.filter((item) => item.category === category)),
    [items, category],
  );

  const position = useMemo(() => {
    const map = new Map<number, number>();
    items.forEach((item, index) => map.set(item.id, index));
    return map;
  }, [items]);

  const publishedCount = items.filter((item) => item.status === "published").length;

  const run = (fn: () => Promise<ContentActionResult>) => {
    startTransition(async () => {
      const result = await fn();
      setStatus(result);
      if (result.ok) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Gallery"
        description="Curate the photo gallery shown on the public website. Use the arrows to control the display order."
        meta={[
          { label: "Images", value: items.length },
          { label: "Published", value: publishedCount },
          { label: "Drafts", value: items.length - publishedCount },
        ]}
        actions={
          <Button type="button" size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            Add image
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="sm:w-56">
          <label htmlFor="gallery-category" className="label">
            Filter by category
          </label>
          <select
            id="gallery-category"
            className="field appearance-none bg-no-repeat pr-9"
            value={category}
            onChange={(event) => setCategory(event.target.value as (typeof CATEGORY_OPTIONS)[number])}
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option === "All" ? "All categories" : option}
              </option>
            ))}
          </select>
        </div>
        <p role="status" aria-live="polite" className="min-h-5 text-sm font-semibold text-slate-body">
          {status?.message ?? ""}
        </p>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title={items.length === 0 ? "No gallery images yet" : "No images in this category"}
          description={
            items.length === 0
              ? "Add your first photo to start building the public gallery."
              : "Try a different category, or add a new image to this one."
          }
          icon="empty"
          action={
            <Button type="button" size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden />
              Add image
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Gallery images">
          {visible.map((item) => {
            const index = position.get(item.id) ?? 0;
            return (
              <li key={item.id} className="card flex flex-col overflow-hidden">
                <div className="relative aspect-[4/3] w-full bg-offwhite">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image}
                    alt={item.alt || item.title}
                    className="h-full w-full object-cover"
                    onError={(event) => {
                      const target = event.currentTarget;
                      target.style.display = "none";
                      target.parentElement?.classList.add("flex", "items-center", "justify-center");
                    }}
                  />
                  <span className="absolute left-3 top-3">
                    <Badge tone={statusTone(item.status)} dot>
                      {item.status}
                    </Badge>
                  </span>
                </div>

                <div className="flex flex-1 flex-col gap-1 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold text-navy">{item.title}</h3>
                    <Badge tone="neutral">{item.category}</Badge>
                  </div>
                  {item.caption ? <p className="text-xs leading-relaxed text-slate-body">{item.caption}</p> : null}
                  <p className="mt-1 font-mono text-[10px] text-slate-body">{item.image}</p>

                  <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        disabled={pending || index === 0}
                        onClick={() => run(() => reorderGallery(item.id, "up"))}
                        aria-label={`Move “${item.title}” up`}
                        title="Move up"
                      >
                        <ArrowUp className="h-4 w-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        disabled={pending || index === items.length - 1}
                        onClick={() => run(() => reorderGallery(item.id, "down"))}
                        aria-label={`Move “${item.title}” down`}
                        title="Move down"
                      >
                        <ArrowDown className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => setEditing(item)}
                        aria-label={`Edit “${item.title}”`}
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm text-danger hover:bg-danger-100"
                        onClick={() => setDeleting(item)}
                        aria-label={`Delete “${item.title}”`}
                        title="Delete"
                        disabled={pending}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add gallery image"
        description="Choose a bundled demo image or type any /images path."
        size="lg"
      >
        <GalleryItemForm onDone={() => setAddOpen(false)} />
      </Dialog>

      <Dialog
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title="Edit gallery image"
        description={editing?.title}
        size="lg"
      >
        {editing ? (
          <GalleryItemForm
            key={editing.id}
            initial={{
              id: editing.id,
              title: editing.title,
              category: editing.category,
              image: editing.image,
              alt: editing.alt,
              caption: editing.caption,
              sortOrder: editing.sort_order,
              status: editing.status,
            }}
            onDone={() => setEditing(null)}
          />
        ) : null}
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          const target = deleting;
          setDeleting(null);
          if (target) run(() => deleteGalleryItem(target.id));
        }}
        title="Delete gallery image"
        message={
          deleting
            ? `Delete “${deleting.title}” from the gallery? This cannot be undone.`
            : "This cannot be undone."
        }
        confirmLabel="Delete image"
        loading={pending}
      />
    </div>
  );
}
