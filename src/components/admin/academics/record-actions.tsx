"use client";

import { useState } from "react";
import Link from "next/link";
import { Archive, Eye, Globe, Globe2, Pencil } from "lucide-react";
import {
  archiveCourse,
  archiveDepartment,
  archiveFaculty,
  setCourseStatus,
  setDepartmentVisibility,
  setFacultyVisibility,
} from "@/app/admin/actions/academics";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";

type Entity = "course" | "faculty" | "department";
type Result = { ok: boolean; message: string };

const TOGGLES: Record<Entity, (id: number, value: "published" | "draft") => Promise<Result>> = {
  course: setCourseStatus,
  faculty: setFacultyVisibility,
  department: setDepartmentVisibility,
};

const ARCHIVES: Record<Entity, (id: number) => Promise<Result>> = {
  course: archiveCourse,
  faculty: archiveFaculty,
  department: archiveDepartment,
};

const NOUNS: Record<Entity, string> = {
  course: "course",
  faculty: "faculty member",
  department: "department",
};

export function RecordActions({
  entity,
  id,
  name,
  status,
  viewHref,
  editHref,
}: {
  entity: Entity;
  id: number;
  name: string;
  status: string;
  viewHref?: string;
  editHref?: string;
}) {
  const toast = useToast();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const published = status === "published";
  const noun = NOUNS[entity];

  const run = async (task: Promise<Result>) => {
    setPending(true);
    try {
      const result = await task;
      setMessage(result.message);
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    } catch {
      const fallback = "Something went wrong. Please try again.";
      setMessage(fallback);
      toast.error(fallback);
    } finally {
      setPending(false);
      setConfirmOpen(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap items-center justify-end gap-1.5">
        {viewHref ? (
          <Link
            href={viewHref}
            className="rounded-lg border border-line bg-white p-1.5 text-slate-body transition hover:border-royal hover:text-royal"
            aria-label={`View ${name} on site`}
            title="View on site"
          >
            <Eye className="h-4 w-4" aria-hidden />
          </Link>
        ) : null}
        {editHref ? (
          <Link
            href={editHref}
            className="rounded-lg border border-line bg-white p-1.5 text-slate-body transition hover:border-royal hover:text-royal"
            aria-label={`Edit ${name}`}
            title="Edit"
          >
            <Pencil className="h-4 w-4" aria-hidden />
          </Link>
        ) : null}
        <button
          type="button"
          onClick={() => void run(TOGGLES[entity](id, published ? "draft" : "published"))}
          disabled={pending}
          className="btn btn-outline btn-sm !px-2.5 !py-1.5"
          aria-label={published ? `Unpublish ${name}` : `Publish ${name}`}
        >
          {published ? <Globe2 className="h-3.5 w-3.5" aria-hidden /> : <Globe className="h-3.5 w-3.5" aria-hidden />}
          {published ? "Unpublish" : "Publish"}
        </button>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          disabled={pending}
          className="btn btn-ghost btn-sm !px-2.5 !py-1.5 !text-danger hover:!bg-danger-100"
          aria-label={`Archive ${name}`}
        >
          <Archive className="h-3.5 w-3.5" aria-hidden />
          Archive
        </button>
      </div>
      {message ? (
        <p role="status" className="max-w-[220px] text-right text-[11px] font-semibold leading-snug text-slate-body">
          {message}
        </p>
      ) : null}

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void run(ARCHIVES[entity](id))}
        title={`Archive this ${noun}?`}
        message={`"${name}" will be unpublished and hidden from the website. Nothing is deleted — you can publish it again at any time.`}
        confirmLabel="Archive"
        tone="danger"
        loading={pending}
      />
    </div>
  );
}
