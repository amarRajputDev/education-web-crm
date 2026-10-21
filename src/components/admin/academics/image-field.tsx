"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";
import { FieldShell, TextInput } from "@/components/ui/fields";
import { DEMO_IMAGES } from "./shared";

export function ImageField({
  name,
  label,
  value,
  hint,
  error,
  placeholder = "/images/course-cs.jpg",
}: {
  name: string;
  label: string;
  value: string;
  hint?: string;
  error?: string;
  placeholder?: string;
}) {
  const [preview, setPreview] = useState(value);

  return (
    <FieldShell label={label} hint={hint} error={error}>
      {(id) => (
        <div className="flex flex-wrap items-start gap-3">
          <div className="min-w-[200px] flex-1">
            <TextInput
              id={id}
              name={name}
              value={preview}
              list={`${id}-images`}
              placeholder={placeholder}
              invalid={Boolean(error)}
              onChange={(event) => setPreview(event.target.value)}
            />
            <datalist id={`${id}-images`}>
              {DEMO_IMAGES.map((image) => (
                <option key={image} value={image} />
              ))}
            </datalist>
          </div>
          <div className="flex h-12 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-offwhite">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="Preview of the selected image"
                className="h-full w-full object-cover"
                onError={(event) => {
                  event.currentTarget.style.visibility = "hidden";
                }}
              />
            ) : (
              <ImageOff className="h-4 w-4 text-slate-body" aria-hidden />
            )}
          </div>
        </div>
      )}
    </FieldShell>
  );
}
