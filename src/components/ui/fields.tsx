"use client";

import { forwardRef, useId } from "react";
import { cn } from "@/lib/cn";

type FieldShellProps = {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: (id: string) => React.ReactNode;
};

export function FieldShell({ label, hint, error, required, className, children }: FieldShellProps) {
  const id = useId();
  return (
    <div className={cn("w-full", className)}>
      {label ? (
        <label htmlFor={id} className="label">
          {label}
          {required ? <span className="ml-1 text-danger" aria-hidden>*</span> : null}
          {required ? <span className="sr-only"> (required)</span> : null}
        </label>
      ) : null}
      {children(id)}
      {error ? (
        <p className="error-text" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="hint mt-1">{hint}</p>
      ) : null}
    </div>
  );
}

export const TextInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }
>(function TextInput({ className, invalid, ...rest }, ref) {
  return <input ref={ref} aria-invalid={invalid || undefined} className={cn("field", className)} {...rest} />;
});

export const TextArea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }
>(function TextArea({ className, invalid, ...rest }, ref) {
  return <textarea ref={ref} aria-invalid={invalid || undefined} className={cn("field", className)} {...rest} />;
});

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }
>(function Select({ className, invalid, children, ...rest }, ref) {
  return (
    <select ref={ref} aria-invalid={invalid || undefined} className={cn("field appearance-none bg-no-repeat pr-9", className)} {...rest}>
      {children}
    </select>
  );
});

export function ErrorSummary({
  errors,
  title = "Please correct the following",
}: {
  errors: Record<string, string> | undefined;
  title?: string;
}) {
  const list = Object.entries(errors ?? {});
  if (list.length === 0) return null;
  return (
    <div
      className="mb-5 rounded-xl border border-[#f6cfcf] bg-danger-100 p-4"
      role="alert"
      tabIndex={-1}
    >
      <p className="text-sm font-semibold text-danger">{title}</p>
      <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-xs text-[#933838]">
        {list.map(([key, message]) => (
          <li key={key}>{message}</li>
        ))}
      </ul>
    </div>
  );
}
