import { cn } from "@/lib/cn";
import { Breadcrumbs, type Crumb } from "./breadcrumbs";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  action,
  index,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "center" | "left";
  className?: string;
  action?: React.ReactNode;
  /** Small editorial section number, e.g. "02". */
  index?: string;
}) {
  const centered = align === "center";
  return (
    <div
      className={cn(
        "mb-10 flex flex-col gap-6 md:mb-14",
        centered ? "items-center text-center" : "items-start",
        className,
      )}
    >
      <div className={cn("w-full", centered ? "max-w-3xl" : "max-w-3xl")}>
        <div
          className={cn(
            "mb-5 flex items-center gap-4",
            centered && "justify-center",
          )}
          aria-hidden
        >
          <span className="section-index">{index ?? "—"}</span>
          <span className="h-px w-16 bg-line-strong" />
          {eyebrow ? (
            <span className="font-ui text-[0.7rem] font-extrabold uppercase tracking-[0.24em] text-royal">
              {eyebrow}
            </span>
          ) : null}
        </div>

        <h2 className="text-[clamp(2rem,4.4vw,3.25rem)] leading-[1.04] text-navy">{title}</h2>

        {description ? (
          <p className={cn("mt-5 max-w-2xl text-base leading-relaxed text-slate-body md:text-[1.0625rem]", centered && "mx-auto")}>
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="flex flex-wrap gap-3">{action}</div> : null}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  breadcrumbs,
  children,
  meta,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  breadcrumbs?: React.ReactNode | Crumb[];
  children?: React.ReactNode;
  meta?: { label: string; value: string }[];
}) {
  return (
    <header className="relative isolate overflow-hidden bg-navy text-white">
      <div className="absolute inset-0 grid-lines-light opacity-70" aria-hidden />
      <div
        className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full bg-royal/40 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-40 left-[8%] h-72 w-72 rounded-full bg-gold/15 blur-3xl"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute -bottom-16 right-4 select-none font-display text-[clamp(7rem,20vw,16rem)] leading-none text-white/[0.045] md:right-10"
        aria-hidden
      >
        {title.trim().slice(0, 1).toUpperCase()}
      </span>

      <div className="container-page relative py-12 md:py-16">
        {breadcrumbs ? (
          <div className="mb-6 [&_a]:text-white/65 [&_span]:text-white/65">
            {Array.isArray(breadcrumbs) ? <Breadcrumbs items={breadcrumbs} /> : breadcrumbs}
          </div>
        ) : null}
        <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-end">
          <div>
            {eyebrow ? (
              <p className="mb-4 flex items-center gap-3 text-xs font-extrabold uppercase tracking-[0.24em] text-gold">
                <span className="h-px w-10 bg-gold/70" aria-hidden />
                {eyebrow}
              </p>
            ) : null}
            <h1 className="max-w-4xl text-[clamp(2.2rem,5.4vw,3.75rem)] leading-[1.02] text-white">{title}</h1>
            {description ? (
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/70 md:text-lg">{description}</p>
            ) : null}
            {children ? <div className="mt-8 flex flex-wrap gap-3">{children}</div> : null}
          </div>

          {meta && meta.length > 0 ? (
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/12 bg-white/10 lg:max-w-sm lg:justify-self-end">
              {meta.map((item) => (
                <div key={item.label} className="bg-navy/70 px-4 py-4 backdrop-blur">
                  <dt className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/50">{item.label}</dt>
                  <dd className="mt-1 font-display text-xl font-semibold text-gold">{item.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </div>

      <div className="h-1 w-full bg-gradient-to-r from-gold via-royal to-transparent" aria-hidden />
    </header>
  );
}
