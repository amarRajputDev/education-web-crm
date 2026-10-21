"use client";

import { useState } from "react";
import { ChevronUp, Pencil, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { relativeTime, statusTone } from "@/lib/format";
import { BlockEditor, type BlockEditorValues } from "./block-editor";
import { BLOCK_DEFINITIONS, type BlockKey } from "./block-defaults";

export type BlockRow = {
  block_key: string;
  title: string;
  body: string;
  image: string;
  meta: string;
  status: string;
  updated_at: string;
};

function parseMeta(raw: string | null | undefined): Record<string, unknown> | null {
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = null;
  }
  return parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)
    ? (parsed as Record<string, unknown>)
    : null;
}

function editorValues(row: BlockRow | undefined, definition: (typeof BLOCK_DEFINITIONS)[number]): BlockEditorValues {
  const meta = parseMeta(row?.meta) ?? definition.defaultMeta;
  return {
    title: row?.title ?? definition.defaultTitle,
    body: row?.body ?? definition.defaultBody,
    image: row?.image ?? definition.defaultImage,
    metaJson: JSON.stringify(meta, null, 2),
  };
}

export function BlockOverview({ rows }: { rows: BlockRow[] }) {
  const [openKey, setOpenKey] = useState<BlockKey | null>(null);
  const byKey = new Map(rows.map((row) => [row.block_key, row]));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {BLOCK_DEFINITIONS.map((definition) => {
          const row = byKey.get(definition.key);
          const open = openKey === definition.key;

          return (
            <article key={definition.key} className="flex min-w-0 flex-col rounded-2xl border border-line bg-offwhite/50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-royal">
                    {definition.label}
                  </p>
                  <p className="mt-1 truncate font-mono text-[11px] text-slate-body">{definition.key}</p>
                </div>
                {row ? <Badge tone={statusTone(row.status)}>{row.status}</Badge> : <Badge tone="warning">missing</Badge>}
              </div>

              {row ? (
                <div className="mt-3 min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-semibold leading-snug text-navy">{row.title || "Untitled block"}</p>
                  <p className="mt-1 text-xs text-slate-body">Updated {relativeTime(row.updated_at)}</p>
                  <p className="mt-1 text-[11px] text-slate-body">{definition.placement}</p>
                </div>
              ) : (
                <div className="mt-3 flex-1">
                  <EmptyState
                    compact
                    icon="document"
                    title="Not created yet"
                    description="This block exists in the seed data but has no row in the database."
                    action={
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => setOpenKey(open ? null : definition.key)}
                        aria-expanded={open}
                      >
                        <Plus className="h-4 w-4" aria-hidden />
                        Create block
                      </button>
                    }
                  />
                </div>
              )}

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setOpenKey(open ? null : definition.key)}
                  aria-expanded={open}
                  aria-label={`${open ? "Close" : "Edit"} ${definition.label}`}
                >
                  {open ? <ChevronUp className="h-4 w-4" aria-hidden /> : <Pencil className="h-4 w-4" aria-hidden />}
                  {open ? "Close editor" : "Edit"}
                </button>
              </div>

              {open ? (
                <div className="mt-4 border-t border-line pt-4">
                  <BlockEditor
                    definition={definition}
                    initial={editorValues(row, definition)}
                    onClose={() => setOpenKey(null)}
                  />
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}
