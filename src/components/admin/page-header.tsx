import { cn } from "@/lib/cn";

export function AdminPageHeader({
  title,
  description,
  actions,
  meta,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  meta?: { label: string; value: string | number }[];
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-[clamp(1.5rem,2.6vw,2rem)] font-semibold leading-tight text-navy">{title}</h1>
          {description ? <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-slate-body">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>

      {meta && meta.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {meta.map((item) => (
            <span
              key={item.label}
              className="inline-flex items-center gap-2 rounded-xl border border-line bg-paper px-3 py-1.5 text-[12px]"
            >
              <span className="font-bold uppercase tracking-wide text-slate-body">{item.label}</span>
              <span className="font-semibold text-navy">{item.value}</span>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function AdminCard({
  title,
  description,
  actions,
  children,
  className,
  padding = true,
}: {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}) {
  return (
    <section className={cn("card", padding && "p-5 sm:p-6", className)}>
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title ? <h2 className="text-[15px] font-bold text-navy">{title}</h2> : null}
            {description ? <p className="mt-0.5 text-xs text-slate-body">{description}</p> : null}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}
