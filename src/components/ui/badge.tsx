import { cn } from "@/lib/cn";
import { toneClass, type Tone } from "@/lib/format";

export function Badge({
  children,
  tone = "neutral",
  className,
  dot = false,
}: {
  children: React.ReactNode;
  tone?: Tone | string;
  className?: string;
  dot?: boolean;
}) {
  const toneName = (tone in { neutral: 1, info: 1, success: 1, warning: 1, danger: 1, gold: 1 }
    ? tone
    : "neutral") as Tone;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide",
        toneClass(toneName),
        className,
      )}
    >
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden /> : null}
      {children}
    </span>
  );
}
