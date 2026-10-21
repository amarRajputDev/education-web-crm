"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type DragEvent } from "react";
import { ChevronLeft, ChevronRight, GripVertical, UserRound } from "lucide-react";
import { bulkUpdateEnquiries } from "@/app/admin/actions/enquiries";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { priorityTone, isBeforeNow, relativeTime } from "@/lib/format";
import { cn } from "@/lib/cn";

export type KanbanCard = {
  id: number;
  ref: string;
  name: string;
  course_interest: string;
  priority: string;
  counsellor_name: string | null;
  next_followup_at: string | null;
};

export function KanbanBoard({
  columns,
  grouped,
}: {
  columns: { key: string; name: string }[];
  grouped: Record<string, KanbanCard[]>;
}) {
  const router = useRouter();
  const toast = useToast();
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const move = (id: number, status: string) => {
    const formData = new FormData();
    formData.set("ids", String(id));
    formData.set("action", "status");
    formData.set("status", status);
    startTransition(async () => {
      const result = await bulkUpdateEnquiries(formData);
      if (result.ok) {
        toast.success("Moved", `Enquiry moved to ${columns.find((column) => column.key === status)?.name ?? status}`);
        router.refresh();
      } else {
        toast.error("Could not move enquiry", result.message);
      }
    });
  };

  const onDrop = (event: DragEvent<HTMLDivElement>, status: string) => {
    event.preventDefault();
    setDragOver(null);
    const id = Number(event.dataTransfer.getData("text/plain"));
    if (Number.isInteger(id) && id > 0) move(id, status);
  };

  const scrollColumns = (direction: -1 | 1) => {
    const container = document.getElementById("kanban-scroll");
    container?.scrollBy({ left: direction * 340, behavior: "smooth" });
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs text-slate-body">
          Drag a card to another column to change its status, or use the arrows on each card. {pending ? "Updating…" : ""}
        </p>
        <div className="flex gap-1 lg:hidden">
          <button type="button" onClick={() => scrollColumns(-1)} className="btn btn-outline btn-sm" aria-label="Scroll board left">
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
          <button type="button" onClick={() => scrollColumns(1)} className="btn btn-outline btn-sm" aria-label="Scroll board right">
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>

      <div id="kanban-scroll" className="-mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-4">
        {columns.map((column) => {
          const cards = grouped[column.key] ?? [];
          return (
            <div
              key={column.key}
              onDragOver={(event) => {
                event.preventDefault();
                setDragOver(column.key);
              }}
              onDragLeave={() => setDragOver((current) => (current === column.key ? null : current))}
              onDrop={(event) => onDrop(event, column.key)}
              className={cn(
                "flex w-[290px] shrink-0 snap-start flex-col rounded-3xl border bg-offwhite/70 p-3 transition",
                dragOver === column.key ? "border-royal bg-royal-100" : "border-line",
              )}
            >
              <div className="mb-3 flex items-center justify-between gap-2 px-1">
                <p className="text-[12px] font-extrabold uppercase tracking-[0.14em] text-navy">{column.name}</p>
                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-slate-body">{cards.length}</span>
              </div>

              <div className="flex-1 space-y-2.5">
                {cards.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-line-strong px-3 py-6 text-center text-[11px] text-slate-body">
                    Drop an enquiry here
                  </p>
                ) : (
                  cards.map((card) => {
                    const index = columns.findIndex((item) => item.key === column.key);
                    const overdue = isBeforeNow(card.next_followup_at);
                    return (
                      <article
                        key={card.id}
                        draggable={!pending}
                        onDragStart={(event) => {
                          event.dataTransfer.setData("text/plain", String(card.id));
                          event.dataTransfer.effectAllowed = "move";
                        }}
                        className={cn(
                          "group cursor-grab rounded-2xl border border-line bg-paper p-3 shadow-[var(--shadow-card)] transition active:cursor-grabbing hover:border-royal/40",
                          pending && "opacity-60",
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <Link href={`/admin/enquiries/${card.id}`} className="min-w-0">
                            <span className="block font-mono text-[11px] text-royal">{card.ref}</span>
                            <span className="block truncate text-[13.5px] font-bold text-navy">{card.name}</span>
                          </Link>
                          <GripVertical className="h-4 w-4 shrink-0 text-line-strong group-hover:text-royal" aria-hidden />
                        </div>

                        <p className="mt-1.5 line-clamp-2 text-[11.5px] text-slate-body">{card.course_interest || "No course specified"}</p>

                        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                          <Badge tone={priorityTone(card.priority)}>{card.priority}</Badge>
                          {card.counsellor_name ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-body">
                              <UserRound className="h-3 w-3" aria-hidden />
                              {card.counsellor_name.split(" ")[0]}
                            </span>
                          ) : (
                            <span className="text-[11px] text-danger">Unassigned</span>
                          )}
                        </div>

                        <p className={cn("mt-2 text-[11px]", overdue ? "font-semibold text-danger" : "text-slate-body")}>
                          {card.next_followup_at ? `Follow-up ${relativeTime(card.next_followup_at)}` : "No follow-up scheduled"}
                        </p>

                        <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-line pt-2">
                          <button
                            type="button"
                            disabled={index <= 0 || pending}
                            onClick={() => move(card.id, columns[index - 1].key)}
                            className="rounded-lg border border-line px-2 py-1 text-[11px] font-bold text-slate-body transition hover:border-royal hover:text-royal disabled:opacity-30"
                            aria-label={`Move ${card.ref} back to ${index > 0 ? columns[index - 1].name : ""}`}
                          >
                            ← Back
                          </button>
                          <button
                            type="button"
                            disabled={index >= columns.length - 1 || pending}
                            onClick={() => move(card.id, columns[index + 1].key)}
                            className="rounded-lg border border-line px-2 py-1 text-[11px] font-bold text-slate-body transition hover:border-royal hover:text-royal disabled:opacity-30"
                            aria-label={`Move ${card.ref} forward`}
                          >
                            Advance →
                          </button>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
