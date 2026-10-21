"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export function Accordion({
  items,
  defaultOpen = 0,
  allowMultiple = false,
}: {
  items: { id?: string; title: string; meta?: React.ReactNode; content: React.ReactNode }[];
  defaultOpen?: number | null;
  allowMultiple?: boolean;
}) {
  const [open, setOpen] = useState<number[]>(defaultOpen === null ? [] : [defaultOpen]);

  const toggle = (index: number) => {
    setOpen((current) => {
      if (current.includes(index)) return current.filter((value) => value !== index);
      return allowMultiple ? [...current, index] : [index];
    });
  };

  return (
    <div className="divide-y divide-line overflow-hidden rounded-3xl border border-line bg-paper">
      {items.map((item, index) => {
        const expanded = open.includes(index);
        const id = item.id ?? `accordion-item-${index}`;
        return (
          <div key={id}>
            <button
              type="button"
              onClick={() => toggle(index)}
              aria-expanded={expanded}
              aria-controls={`${id}-panel`}
              className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-offwhite/70 md:px-6"
            >
              <span className="section-index shrink-0">{String(index + 1).padStart(2, "0")}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-ui text-[15px] font-bold text-navy">{item.title}</span>
                {item.meta ? <span className="mt-0.5 block text-xs text-slate-body">{item.meta}</span> : null}
              </span>
              <ChevronDown
                className={cn("h-5 w-5 shrink-0 text-royal transition-transform", expanded && "rotate-180")}
                aria-hidden
              />
            </button>
            <div
              id={`${id}-panel`}
              role="region"
              hidden={!expanded}
              className="px-5 pb-5 md:px-6"
            >
              <div className="border-t border-line pt-4 text-sm leading-relaxed text-slate-body">{item.content}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
