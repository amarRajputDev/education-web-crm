"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import {
  deleteEvent,
  deleteNews,
  toggleEventStatus,
  toggleNewsStatus,
  type ContentActionResult,
} from "@/app/admin/actions/content";
import { ConfirmDialog } from "@/components/ui/dialog";
import { cn } from "@/lib/cn";
import { useToast } from "@/components/ui/toast";

type RowItem = { id: number; title: string; slug: string; status: string };

function RowStatus({ state }: { state: ContentActionResult | null }) {
  if (!state?.message) return null;
  return (
    <span
      role="status"
      className={cn(
        "mt-1 block text-[11px] font-semibold",
        state.ok ? "text-success" : "text-danger",
      )}
    >
      {state.message}
    </span>
  );
}

export function NewsRowActions({ item }: { item: RowItem }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [state, setState] = useState<ContentActionResult | null>(null);

  const published = item.status === "published";

  const run = (fn: () => Promise<ContentActionResult>) => {
    startTransition(async () => {
      const result = await fn();
      setState(result);
      if (result.ok) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <div className="flex flex-col items-end">
      <div className="flex items-center justify-end gap-1 whitespace-nowrap">
        {published ? (
          <Link
            href={`/news/${item.slug}`}
            target="_blank"
            rel="noreferrer"
            className="btn btn-ghost btn-sm"
            title="View on site"
            aria-label={`View “${item.title}” on the website`}
          >
            <ExternalLink className="h-4 w-4" aria-hidden />
          </Link>
        ) : null}
        <Link
          href={`/admin/news/${item.id}/edit`}
          className="btn btn-ghost btn-sm"
          title="Edit"
          aria-label={`Edit “${item.title}”`}
        >
          <Pencil className="h-4 w-4" aria-hidden />
        </Link>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          disabled={pending}
          onClick={() => run(() => toggleNewsStatus(item.id))}
          aria-label={published ? `Unpublish “${item.title}”` : `Publish “${item.title}”`}
        >
          {published ? "Unpublish" : "Publish"}
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm text-danger hover:bg-danger-100"
          disabled={pending}
          title="Delete"
          aria-label={`Delete “${item.title}”`}
          onClick={() => setConfirmOpen(true)}
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <RowStatus state={state} />

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          run(() => deleteNews(item.id));
        }}
        title="Delete notice"
        message={`Delete “${item.title}”? This permanently removes the notice from the admin panel and the public website. This cannot be undone.`}
        confirmLabel="Delete notice"
        loading={pending}
      />
    </div>
  );
}

export function EventRowActions({ item }: { item: RowItem }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [state, setState] = useState<ContentActionResult | null>(null);

  const published = item.status === "published";

  const run = (fn: () => Promise<ContentActionResult>) => {
    startTransition(async () => {
      const result = await fn();
      setState(result);
      if (result.ok) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <div className="flex flex-col items-end">
      <div className="flex items-center justify-end gap-1 whitespace-nowrap">
        {published ? (
          <Link
            href={`/events/${item.slug}`}
            target="_blank"
            rel="noreferrer"
            className="btn btn-ghost btn-sm"
            title="View on site"
            aria-label={`View “${item.title}” on the website`}
          >
            <ExternalLink className="h-4 w-4" aria-hidden />
          </Link>
        ) : null}
        <Link
          href={`/admin/events/${item.id}/edit`}
          className="btn btn-ghost btn-sm"
          title="Edit"
          aria-label={`Edit “${item.title}”`}
        >
          <Pencil className="h-4 w-4" aria-hidden />
        </Link>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          disabled={pending}
          onClick={() => run(() => toggleEventStatus(item.id))}
          aria-label={published ? `Unpublish “${item.title}”` : `Publish “${item.title}”`}
        >
          {published ? "Unpublish" : "Publish"}
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm text-danger hover:bg-danger-100"
          disabled={pending}
          title="Delete"
          aria-label={`Delete “${item.title}”`}
          onClick={() => setConfirmOpen(true)}
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <RowStatus state={state} />

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          run(() => deleteEvent(item.id));
        }}
        title="Delete event"
        message={`Delete “${item.title}”? This permanently removes the event from the admin panel and the public website. This cannot be undone.`}
        confirmLabel="Delete event"
        loading={pending}
      />
    </div>
  );
}
