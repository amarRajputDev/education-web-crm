"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, Send, ShieldCheck } from "lucide-react";
import { submitEnquiry, type ActionState } from "@/app/actions/public";
import { ErrorSummary, FieldShell, Select, TextArea, TextInput } from "@/components/ui/fields";

export type EnquiryCourseOption = { id: number; name: string };

const EMPTY: ActionState = { ok: false, message: "" };

export function EnquiryForm({
  courses,
  defaultCourseId,
  source = "Website",
  sourcePage,
  compact = false,
  title = "Send an admission enquiry",
  intro,
  accent = "light",
}: {
  courses: EnquiryCourseOption[];
  defaultCourseId?: number;
  source?: string;
  sourcePage?: string;
  compact?: boolean;
  title?: string;
  intro?: string;
  accent?: "light" | "dark";
}) {
  const [state, action, pending] = useActionState(submitEnquiry, EMPTY);
  const [consentError, setConsentError] = useState(false);
  const successRef = useRef<HTMLDivElement>(null);
  const isDark = accent === "dark";

  useEffect(() => {
    if (state.ok) successRef.current?.focus();
  }, [state.ok]);

  if (state.ok) {
    return (
      <div
        ref={successRef}
        tabIndex={-1}
        role="status"
        className="animate-fade-up flex flex-col items-center rounded-2xl border border-[#c3e6d8] bg-success-100 px-6 py-10 text-center"
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success text-white">
          <CheckCircle2 className="h-7 w-7" aria-hidden />
        </span>
        <h3 className="mt-4 text-lg font-extrabold text-charcoal">Enquiry received</h3>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-body">{state.message}</p>
        {state.ref ? (
          <p className="mt-4 rounded-lg border border-[#c3e6d8] bg-white px-4 py-2 text-sm font-semibold text-success">
            Reference: <span className="font-mono">{state.ref}</span>
          </p>
        ) : null}
        <p className="mt-4 text-xs text-slate-body">
          Our counselling desk operates Monday to Saturday, 9:00 AM – 6:00 PM.
        </p>
        <button type="button" className="btn btn-outline mt-5" onClick={() => window.location.reload()}>
          Submit another enquiry
        </button>
      </div>
    );
  }

  return (
    <form action={action} noValidate className={isDark ? "text-white" : ""}>
      {title ? (
        <h3 className={`text-xl font-extrabold ${isDark ? "text-white" : "text-navy"}`}>{title}</h3>
      ) : null}
      {intro ? (
        <p className={`mt-2 text-sm leading-relaxed ${isDark ? "text-white/70" : "text-slate-body"}`}>{intro}</p>
      ) : null}

      <ErrorSummary errors={state.errors} />

      <input type="hidden" name="sourcePage" value={sourcePage ?? (typeof window !== "undefined" ? window.location.pathname : "/")} />
      <input type="hidden" name="utmCampaign" value={typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("utm_campaign") ?? "" : ""} />

      <div className={`mt-5 grid gap-4 ${compact ? "sm:grid-cols-2" : "sm:grid-cols-2"}`}>
        <FieldShell label="Student name" required error={state.errors?.name}>
          {() => <TextInput name="name" autoComplete="name" placeholder="e.g. Ananya Krishnan" required invalid={Boolean(state.errors?.name)} />}
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
        <FieldShell label="Email address" error={state.errors?.email}>
          {() => (
            <TextInput
              name="email"
              type="email"
              autoComplete="email"
              placeholder="student@example.com"
              invalid={Boolean(state.errors?.email)}
            />
          )}
        </FieldShell>
        <FieldShell label="Interested programme" error={state.errors?.courseId || state.errors?.courseInterest}>
          {() => (
            <Select name="courseId" defaultValue={defaultCourseId ? String(defaultCourseId) : ""} invalid={Boolean(state.errors?.courseId)}>
              <option value="">Select a programme</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
              <option value="">Other / not decided yet</option>
            </Select>
          )}
        </FieldShell>
        <FieldShell label="Preferred contact method" required error={state.errors?.preferredContact}>
          {() => (
            <Select name="preferredContact" defaultValue="Phone">
              <option value="Phone">Phone call</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Email">Email</option>
            </Select>
          )}
        </FieldShell>
        <FieldShell label="How did you hear about us?" hint="Optional attribution">
          {() => (
            <Select name="source" defaultValue={source}>
              {["Website", "Phone", "Walk-in", "Social Media", "Referral", "Campaign", "Event", "Other"].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </Select>
          )}
        </FieldShell>
        <div className="sm:col-span-2">
          <FieldShell label="Message" hint="Tell us what you would like to know (optional)">
            {() => <TextArea name="message" rows={compact ? 3 : 4} placeholder="Questions about eligibility, fees, hostels, scholarships…" />}
          </FieldShell>
        </div>
      </div>

      <div className="mt-5">
        <label className="flex items-start gap-3 text-xs leading-relaxed text-slate-body">
          <input
            type="checkbox"
            name="consent"
            required
            onChange={(event) => setConsentError(!event.target.checked && event.target.required)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#c9d2e2] accent-[#285cc4]"
          />
          <span>
            I consent to Aarohan Institute storing these details to respond to my enquiry, and I agree to the{" "}
            <a href="/privacy" target="_blank" className="font-semibold text-royal underline underline-offset-2">
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
          {pending ? "Submitting…" : "Submit Enquiry"}
        </button>
        <p className={`flex items-center gap-1.5 text-xs ${isDark ? "text-white/60" : "text-slate-body"}`}>
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
          Your details are stored securely and never shared.
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
