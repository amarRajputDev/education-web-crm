import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export function KpiCard({
  label,
  value,
  delta,
  hint,
  icon: Icon,
  tone = "neutral",
  sub,
}: {
  label: string;
  value: string | number;
  delta?: number | null;
  hint?: string;
  icon: LucideIcon;
  tone?: "neutral" | "success" | "warning" | "danger";
  sub?: string;
}) {
  const toneClasses = {
    neutral: "bg-royal-100 text-royal",
    success: "bg-success-100 text-success",
    warning: "bg-amber-100 text-amber",
    danger: "bg-danger-100 text-danger",
  }[tone];

  return (
    <article className="card group relative overflow-hidden p-5 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-body">{label}</p>
        <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", toneClasses)}>
          <Icon className="h-4 w-4" aria-hidden />
        </span>
      </div>

      <p className="mt-3 font-display text-[clamp(1.9rem,3vw,2.35rem)] font-semibold leading-none text-navy">{value}</p>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        {typeof delta === "number" ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold",
              delta > 0 ? "bg-success-100 text-success" : delta < 0 ? "bg-danger-100 text-danger" : "bg-offwhite text-slate-body",
            )}
          >
            {delta > 0 ? (
              <ArrowUpRight className="h-3 w-3" aria-hidden />
            ) : delta < 0 ? (
              <ArrowDownRight className="h-3 w-3" aria-hidden />
            ) : (
              <Minus className="h-3 w-3" aria-hidden />
            )}
            {Math.abs(delta)}%
          </span>
        ) : null}
        {sub ? <span className="text-[11px] text-slate-body">{sub}</span> : null}
      </div>

      {hint ? <p className="mt-2 text-[11px] leading-relaxed text-slate-body">{hint}</p> : null}
    </article>
  );
}

export function DeltaText({ value, suffix = "" }: { value: number | null; suffix?: string }) {
  if (value === null) return <span className="text-xs text-slate-body">No prior period data</span>;
  return (
    <span className={cn("text-xs font-semibold", value >= 0 ? "text-success" : "text-danger")}>
      {value >= 0 ? "+" : ""}
      {value}%{suffix}
    </span>
  );
}
