"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, Eye, EyeOff, Loader2, LockKeyhole, ShieldCheck } from "lucide-react";
import { loginAction, requestPasswordReset, type LoginState } from "@/app/admin/actions/auth";
import { cn } from "@/lib/cn";

const EMPTY: LoginState = {};

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/admin/dashboard";
  const [state, action, pending] = useActionState(loginAction, EMPTY);
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<"login" | "reset">("login");
  const [resetState, resetAction, resetPending] = useActionState(requestPasswordReset, EMPTY);

  if (mode === "reset") {
    return (
      <form action={resetAction} className="space-y-4">
        <div>
          <label htmlFor="reset-email" className="label">
            Account email
          </label>
          <input id="reset-email" name="email" type="email" required className="field" placeholder="you@aarohan.demo" />
        </div>
        {resetState.error ? (
          <p className="rounded-xl border border-[#f6cfcf] bg-danger-100 px-4 py-3 text-xs leading-relaxed text-danger" role="alert">
            {resetState.error}
          </p>
        ) : null}
        <div className="flex items-center justify-between gap-3">
          <button type="button" className="text-sm font-semibold text-royal hover:underline" onClick={() => setMode("login")}>
            ← Back to sign in
          </button>
          <button type="submit" className="btn btn-primary" disabled={resetPending}>
            {resetPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            Request reset
          </button>
        </div>
      </form>
    );
  }

  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="next" value={next} />

      {state.error ? (
        <p className="flex items-start gap-2.5 rounded-xl border border-[#f6cfcf] bg-danger-100 px-4 py-3 text-sm text-danger" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {state.error}
        </p>
      ) : null}

      <div>
        <label htmlFor="login-email" className="label">
          Email address
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="username"
          required
          aria-invalid={Boolean(state.fieldErrors?.email)}
          className="field"
          placeholder="you@aarohan.demo"
        />
        {state.fieldErrors?.email ? <p className="error-text">{state.fieldErrors.email}</p> : null}
      </div>

      <div>
        <label htmlFor="login-password" className="label">
          Password
        </label>
        <div className="relative">
          <input
            id="login-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            aria-invalid={Boolean(state.fieldErrors?.password)}
            className="field !pr-11"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-body hover:text-navy"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
          </button>
        </div>
        {state.fieldErrors?.password ? <p className="error-text">{state.fieldErrors.password}</p> : null}
      </div>

      <div className="flex items-center justify-between gap-3 pt-1">
        <label className="flex items-center gap-2 text-xs text-slate-body">
          <input type="checkbox" name="remember" className="h-4 w-4 rounded border-line-strong accent-[#0b6b5c]" defaultChecked />
          Keep me signed in
        </label>
        <button type="button" className="text-xs font-semibold text-royal hover:underline" onClick={() => setMode("reset")}>
          Forgot password?
        </button>
      </div>

      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <LockKeyhole className="h-4 w-4" aria-hidden />}
        {pending ? "Signing in…" : "Sign in to the panel"}
      </button>
    </form>
  );
}

export function DemoCredentials({ credentials }: { credentials: { email: string; role: string }[] }) {
  const [copied, setCopied] = useState<string | null>(null);

  return (
    <div className="rounded-2xl border border-dashed border-gold/70 bg-gold-100/60 p-4">
      <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-gold-700">
        <ShieldCheck className="h-4 w-4" aria-hidden />
        Demo accounts
      </p>
      <p className="mt-1.5 text-[11px] leading-relaxed text-slate-body">
        Local demonstration credentials — seeded by <span className="font-mono">npm run seed</span> and configurable
        through <span className="font-mono">SEED_ADMIN_PASSWORD</span>. Never reuse them in production.
      </p>
      <ul className="mt-3 space-y-1.5">
        {credentials.map((item) => (
          <li key={item.email}>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(item.email);
                setCopied(item.email);
                setTimeout(() => setCopied(null), 1600);
              }}
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-lg border border-line bg-paper px-3 py-2 text-left transition hover:border-royal/50",
                copied === item.email && "border-royal",
              )}
            >
              <span className="truncate font-mono text-[11px] text-navy">{item.email}</span>
              <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-slate-body">
                {copied === item.email ? "Copied" : item.role}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] text-slate-body">
        Password for every demo role: <span className="font-mono font-semibold text-navy">Agentiva@2026</span>
      </p>
      <Link href="/" className="mt-3 inline-block text-[11px] font-bold text-royal hover:underline">
        ← Back to public website
      </Link>
    </div>
  );
}
