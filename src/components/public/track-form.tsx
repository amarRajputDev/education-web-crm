"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, Search } from "lucide-react";
import { checkApplicationStatus, type ActionState } from "@/app/actions/public";

const EMPTY: ActionState = { ok: false, message: "" };

export function TrackForm() {
  const [state, action, pending] = useActionState(checkApplicationStatus, EMPTY);
  const [reference, setReference] = useState("");
  const [email, setEmail] = useState("");

  return (
    <form action={action} noValidate className="space-y-4">
      <div>
        <label htmlFor="track-reference" className="label">
          Application reference number <span className="text-danger">*</span>
        </label>
        <input
          id="track-reference"
          name="reference"
          value={reference}
          onChange={(event) => setReference(event.target.value.toUpperCase())}
          placeholder="APP-2027-0001"
          className="field font-mono uppercase tracking-wide"
          aria-invalid={state.ok === false && state.message.includes("reference") || undefined}
          required
        />
        <p className="hint mt-1">Issued immediately after you submit the application form.</p>
      </div>

      <div>
        <label htmlFor="track-email" className="label">
          Email used in the application
        </label>
        <input
          id="track-email"
          name="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="student@example.com"
          className="field"
          autoComplete="email"
        />
        <p className="hint mt-1">Optional — but required if the application email differs from this device.</p>
      </div>

      <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Search className="h-4 w-4" aria-hidden />}
        {pending ? "Checking…" : "Check status"}
      </button>

      {state.message ? (
        <div
          role={state.ok ? "status" : "alert"}
          className={
            state.ok
              ? "animate-fade-up rounded-2xl border border-[#c3e6d8] bg-success-100 p-5"
              : "animate-fade-up rounded-2xl border border-[#f6cfcf] bg-danger-100 p-5"
          }
        >
          <p className={`flex items-start gap-2.5 text-sm leading-relaxed ${state.ok ? "text-success" : "text-danger"}`}>
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>{state.message}</span>
          </p>
          {state.ok && state.ref ? (
            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-success/20 pt-4">
              <span className="rounded-lg bg-white px-3 py-1.5 font-mono text-sm font-semibold text-navy">{state.ref}</span>
              <Link href="/admissions" className="text-xs font-bold text-royal hover:underline">
                What happens next →
              </Link>
            </div>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
