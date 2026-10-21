"use client";

import { useState, useTransition } from "react";
import { Check, CheckCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { markAllReadAction, markReadAction } from "@/app/admin/actions/notifications";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/cn";

export type NotificationRow = {
  id: number;
  type: string;
  title: string;
  body: string;
  link: string;
  read_at: string | null;
  created_at: string;
};

const DOT_TONES: Record<string, string> = {
  success: "bg-success",
  warning: "bg-amber",
  danger: "bg-danger",
  error: "bg-danger",
  info: "bg-royal",
};

export function NotificationsList({ items }: { items: NotificationRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<number | null>(null);

  const unread = items.filter((item) => !item.read_at).length;
  if (items.length === 0) return null;

  const markRead = (id: number) => {
    setBusyId(id);
    startTransition(async () => {
      await markReadAction(id);
      setBusyId(null);
      router.refresh();
    });
  };

  const markAll = () => {
    startTransition(async () => {
      await markAllReadAction();
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-body">
          {unread > 0 ? (
            <>
              <span className="font-semibold text-navy">{unread}</span> unread of {items.length} shown
            </>
          ) : (
            <span className="font-semibold text-success">All caught up</span>
          )}
        </p>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={markAll}
          disabled={isPending || unread === 0}
        >
          <CheckCheck className="h-4 w-4" aria-hidden />
          {isPending ? "Working…" : "Mark all read"}
        </button>
      </div>

      <ul className="space-y-2.5">
        {items.map((item) => {
          const tone = DOT_TONES[item.type] ?? DOT_TONES.info;
          const body = (
            <>
              <span
                className={cn(
                  "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full",
                  item.read_at ? "bg-[#c9d1e0]" : tone,
                )}
                aria-hidden
              />
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    "block truncate text-sm",
                    item.read_at ? "font-semibold text-slate-body" : "font-bold text-navy",
                  )}
                >
                  {item.title}
                </span>
                {item.body ? (
                  <span className="mt-0.5 block truncate text-xs text-slate-body">{item.body}</span>
                ) : null}
                <span className="mt-0.5 block text-[11px] font-medium text-slate-body">
                  {relativeTime(item.created_at)}
                  {item.read_at ? " · read" : " · unread"}
                </span>
              </span>
            </>
          );

          return (
            <li key={item.id}>
              <div
                className={cn(
                  "flex items-start gap-3 rounded-2xl border p-3.5 transition",
                  item.read_at ? "border-line bg-white/60" : "border-royal/30 bg-royal-100/40",
                )}
              >
                {item.link ? (
                  <Link
                    href={item.link}
                    className="flex min-w-0 flex-1 items-start gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal"
                  >
                    {body}
                  </Link>
                ) : (
                  <span className="flex min-w-0 flex-1 items-start gap-3">{body}</span>
                )}
                {!item.read_at ? (
                  <button
                    type="button"
                    onClick={() => markRead(item.id)}
                    disabled={isPending && busyId === item.id}
                    className="btn btn-ghost btn-sm shrink-0"
                    aria-label={`Mark "${item.title}" as read`}
                  >
                    <Check className="h-4 w-4" aria-hidden />
                    {isPending && busyId === item.id ? "…" : "Mark read"}
                  </button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
