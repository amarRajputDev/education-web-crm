"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, Send, ShieldCheck } from "lucide-react";
import { submitContact, type ActionState } from "@/app/actions/public";
import { ErrorSummary, FieldShell, TextArea, TextInput } from "@/components/ui/fields";

const EMPTY: ActionState = { ok: false, message: "" };

export function ContactForm({
  sourcePage = "/contact",
  title = "Send us a message",
  intro = "Fields marked with * are required. We reply within one working day.",
}: {
  sourcePage?: string;
  title?: string;
  intro?: string;
}) {
  const [state, action, pending] = useActionState(submitContact, EMPTY);
  const [consentError, setConsentError] = useState(false);
  const successRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.ok) successRef.current?.focus();
  }, [state.ok]);

  if (state.ok) {
    return (
      <div
        ref={successRef}
        tabIndex={-1}
        role="status"
        className="animate-fade-up flex flex-col items-center rounded-2xl border border-[#c3e6d8] bg-success-100 px-6 py-12 text-center"
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success text-white">
          <CheckCircle2 className="h-7 w-7" aria-hidden />
        </span>
        <h3 className="mt-4 text-lg font-extrabold text-charcoal">Message received</h3>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-body">{state.message}</p>
        {state.ref ? (
          <p className="mt-4 rounded-lg border border-[#c3e6d8] bg-white px-4 py-2 text-sm font-semibold text-success">
            Reference number: <span className="font-mono">{state.ref}</span>
          </p>
        ) : null}
        <p className="mt-4 max-w-sm text-xs leading-relaxed text-slate-body">
          Keep the reference number handy — quote it if you call the admission helpline about this message.
        </p>
        <button type="button" className="btn btn-outline mt-5" onClick={() => window.location.reload()}>
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form action={action} noValidate>
      <h3 className="text-xl font-extrabold text-navy">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-body">{intro}</p>

      <ErrorSummary errors={state.errors} />

      <input type="hidden" name="sourcePage" value={sourcePage} />

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <FieldShell label="Your name" required error={state.errors?.name}>
          {() => (
            <TextInput
              name="name"
              autoComplete="name"
              placeholder="e.g. Rohan Malhotra"
              required
              invalid={Boolean(state.errors?.name)}
            />
          )}
        </FieldShell>
        <FieldShell label="Mobile number" required error={state.errors?.phone}>
          {() => (
            <TextInput
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+91 98765 43210"
              required
              invalid={Boolean(state.errors?.phone)}
            />
          )}
        </FieldShell>
        <div className="sm:col-span-2">
          <FieldShell label="Email address" required error={state.errors?.email}>
            {() => (
              <TextInput
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
                invalid={Boolean(state.errors?.email)}
              />
            )}
          </FieldShell>
        </div>
        <div className="sm:col-span-2">
          <FieldShell label="Subject" required error={state.errors?.subject}>
            {() => (
              <TextInput
                name="subject"
                placeholder="e.g. Hostel availability for first-year students"
                required
                invalid={Boolean(state.errors?.subject)}
              />
            )}
          </FieldShell>
        </div>
        <div className="sm:col-span-2">
          <FieldShell
            label="Message"
            required
            error={state.errors?.message}
            hint="Tell us what you would like to know — programme, fees, documents or a campus visit."
          >
            {() => (
              <TextArea
                name="message"
                rows={5}
                placeholder="Write your question here…"
                required
                invalid={Boolean(state.errors?.message)}
              />
            )}
          </FieldShell>
        </div>
      </div>

      <div className="mt-5">
        <label className="flex items-start gap-3 text-xs leading-relaxed text-slate-body">
          <input
            type="checkbox"
            name="consent"
            required
            onChange={(event) => setConsentError(!event.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-line-strong accent-royal"
          />
          <span>
            I consent to Aarohan Institute storing these details to respond to my message, and I agree to the{" "}
            <a href="/privacy" className="font-semibold text-royal underline underline-offset-2">
              privacy policy
            </a>
            .
          </span>
        </label>
        {state.errors?.consent || consentError ? (
          <p className="error-text" role="alert">
            {state.errors?.consent ?? "Please accept the consent declaration to continue"}
          </p>
        ) : null}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button type="submit" className="btn btn-primary btn-lg w-full sm:w-auto" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
          {pending ? "Sending…" : "Send message"}
        </button>
        <p className="flex items-center gap-1.5 text-xs text-slate-body">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-royal" aria-hidden />
          Stored securely and never shared or sold.
        </p>
      </div>
      {state.message && !state.ok ? (
        <p className="error-text mt-4" role="alert">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
