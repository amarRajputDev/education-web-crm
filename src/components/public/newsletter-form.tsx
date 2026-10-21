"use client";

import { useActionState, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { subscribeNewsletter } from "@/app/actions/public";

export function NewsletterForm() {
  const [state, action, pending] = useActionState(subscribeNewsletter, {
    ok: false,
    message: "",
  } as { ok: boolean; message: string });
  const [email, setEmail] = useState("");

  if (state.ok) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white/85">
        <Check className="h-4 w-4 text-gold" aria-hidden />
        {state.message}
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-2 sm:flex-row">
      <label htmlFor="newsletter-email" className="sr-only">
        Email address for newsletter
      </label>
      <input
        id="newsletter-email"
        name="email"
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Your email address"
        className="field !border-white/15 !bg-white/5 !text-white placeholder:!text-white/45 focus:!border-gold focus:!ring-gold/30"
        autoComplete="email"
      />
      <button type="submit" className="btn btn-gold !py-3" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
        Subscribe
      </button>
      {state.message && !state.ok ? (
        <p className="text-xs text-[#ffb4b4]" role="alert">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
