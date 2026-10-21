"use client";

import { useState } from "react";
import { Check, Link2, Printer, Share2 } from "lucide-react";

export function PrintButton({ className = "btn btn-outline btn-sm" }: { className?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className={className}>
      <Printer className="h-4 w-4" aria-hidden />
      Print
    </button>
  );
}

export function ShareButton({ title, text }: { title: string; text?: string }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = window.location.href;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text: text ?? title, url });
        return;
      } catch {
        /* sharing cancelled — fall back to clipboard */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      /* clipboard unavailable — nothing further to do */
    }
  };

  return (
    <button type="button" onClick={share} className="btn btn-outline btn-sm">
      {copied ? <Check className="h-4 w-4 text-royal" aria-hidden /> : <Share2 className="h-4 w-4" aria-hidden />}
      {copied ? "Link copied" : "Share"}
      {copied ? null : <Link2 className="h-3.5 w-3.5 opacity-50" aria-hidden />}
    </button>
  );
}
