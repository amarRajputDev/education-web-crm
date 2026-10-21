"use client";

import { useId, useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/cn";
import { TextInput } from "@/components/ui/fields";

/** Demo images shipped in /public/images — all .jpg. */
export const DEMO_IMAGES: string[] = [
  "/images/news-1.jpg",
  "/images/news-2.jpg",
  "/images/news-3.jpg",
  "/images/seminar.jpg",
  "/images/workshop.jpg",
  "/images/campus-event.jpg",
  "/images/graduation.jpg",
  "/images/sports.jpg",
  "/images/placement.jpg",
  "/images/research.jpg",
  "/images/laboratory.jpg",
  "/images/classroom.jpg",
  "/images/library.jpg",
  "/images/about-campus.jpg",
  "/images/hero-campus.jpg",
  "/images/gallery-1.jpg",
  "/images/gallery-2.jpg",
  "/images/gallery-3.jpg",
  "/images/gallery-4.jpg",
  "/images/director.jpg",
  ...Array.from({ length: 16 }, (_, index) => `/images/p-${String(index + 1).padStart(2, "0")}.jpg`),
];

/**
 * Text input with a datalist of the bundled demo images and a live preview.
 * Controlled internally so the preview updates as the path is typed.
 */
export function ImagePathPicker({
  name,
  label,
  defaultValue = "",
  error,
  hint,
  required = false,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  error?: string;
  hint?: string;
  required?: boolean;
}) {
  const listId = useId();
  const [value, setValue] = useState(defaultValue);
  const [failed, setFailed] = useState(false);
  const preview = value.trim();

  return (
    <div className="w-full">
      <div>
        <label htmlFor={listId} className="label">
          {label}
          {required ? <span className="ml-1 text-danger" aria-hidden>*</span> : null}
          {required ? <span className="sr-only"> (required)</span> : null}
        </label>
        <TextInput
          id={listId}
          name={name}
          list={`${listId}-options`}
          value={value}
          invalid={Boolean(error)}
          placeholder="/images/seminar.jpg"
          autoComplete="off"
          onChange={(event) => {
            setValue(event.target.value);
            setFailed(false);
          }}
        />
        <datalist id={`${listId}-options`}>
          {DEMO_IMAGES.map((path) => (
            <option key={path} value={path} />
          ))}
        </datalist>
      </div>

      {error ? (
        <p className="error-text" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="hint mt-1">{hint}</p>
      ) : null}

      {preview ? (
        <div className="mt-3 flex items-center gap-3 rounded-xl border border-line bg-offwhite/60 p-3">
          {failed ? (
            <span className="flex h-16 w-24 shrink-0 items-center justify-center rounded-xl border border-dashed border-line-strong bg-paper text-slate-body">
              <ImageOff className="h-5 w-5" aria-hidden />
            </span>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt=""
              className="h-16 w-24 shrink-0 rounded-xl border border-line object-cover"
              onError={() => setFailed(true)}
            />
          )}
          <div className="min-w-0">
            <p className="truncate font-mono text-[11px] text-navy">{preview}</p>
            <p className={cn("mt-0.5 text-[11px] font-semibold", failed ? "text-danger" : "text-slate-body")}>
              {failed ? "Image not found — check the path" : "Preview"}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
