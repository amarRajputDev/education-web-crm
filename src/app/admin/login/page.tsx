import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, GraduationCap, ShieldCheck } from "lucide-react";
import { getAuthContext } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getSetting } from "@/lib/settings";
import { LoginForm, DemoCredentials } from "@/components/admin/login-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Sign in",
  robots: { index: false, follow: false },
};

function demoAccounts() {
  if (process.env.HIDE_DEMO_LOGIN_HINTS === "1") return [];
  try {
    const rows = getDb()
      .prepare(
        `SELECT u.email, r.name AS role FROM users u
           JOIN roles r ON r.key = u.role_key
          WHERE u.status = 'active'
          ORDER BY CASE r.key WHEN 'super_admin' THEN 0 WHEN 'admission_manager' THEN 1 ELSE 2 END, u.id
          LIMIT 5`,
      )
      .all() as { email: string; role: string }[];
    return rows;
  } catch {
    return [];
  }
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const auth = await getAuthContext();
  if (auth) redirect("/admin/dashboard");
  const { next } = await searchParams;
  const accounts = demoAccounts();

  return (
    <div className="relative isolate flex min-h-screen overflow-hidden bg-navy">
      <div className="absolute inset-0 grid-lines-light opacity-60" aria-hidden />
      <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-royal/40 blur-[120px]" aria-hidden />
      <div className="pointer-events-none absolute -bottom-40 right-0 h-96 w-96 rounded-full bg-gold/12 blur-[120px]" aria-hidden />

      {/* brand side */}
      <div className="relative hidden w-[44%] flex-col justify-between p-12 text-white lg:flex xl:w-[46%]">
        <Link href="/" className="inline-flex items-center gap-3 self-start">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-sm font-extrabold text-gold">
            {getSetting("logo_text", "AIHE")}
          </span>
          <span className="font-display text-lg font-semibold">{getSetting("short_name")}</span>
        </Link>

        <div>
          <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.3em] text-gold">Admission CRM</p>
          <h1 className="mt-5 max-w-md text-[clamp(2rem,3.4vw,3rem)] leading-[1.05] text-white">
            One panel for every enquiry, application and deadline.
          </h1>
          <ul className="mt-8 space-y-3">
            {[
              "Lead management with follow-ups and a Kanban pipeline",
              "Application review with document verification and audit trail",
              "Live analytics calculated from real records",
              "Role-based access enforced on the server",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-white/70">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="max-w-md text-xs leading-relaxed text-white/45">
          A demonstration product by Agentiva — websites, admission systems and business automation for educational
          institutes.
        </p>
      </div>

      {/* form side */}
      <div className="relative flex w-full items-center justify-center px-5 py-10 sm:px-10 lg:w-[56%] xl:w-[54%]">
        <div className="w-full max-w-[440px]">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold text-white/60 transition hover:text-gold lg:hidden"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Back to website
          </Link>

          <div className="rounded-[2rem] border border-white/10 bg-paper p-6 shadow-[var(--shadow-pop)] sm:p-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-[0.65rem] font-extrabold uppercase tracking-[0.24em] text-royal">Secure sign in</p>
                <h2 className="mt-2 text-2xl font-bold text-navy">Admin panel</h2>
                <p className="mt-1.5 text-sm text-slate-body">
                  Authorised staff only. Access is logged and audited.
                </p>
              </div>
              <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-navy text-gold sm:flex">
                <GraduationCap className="h-5 w-5" aria-hidden />
              </span>
            </div>

            {next && next !== "/admin/dashboard" ? (
              <p className="mb-4 rounded-xl border border-line bg-offwhite px-3.5 py-2.5 text-xs text-slate-body">
                Sign in to continue to <span className="font-semibold text-navy">{next}</span>
              </p>
            ) : null}

            <LoginForm />
          </div>

          {accounts.length > 0 ? (
            <div className="mt-5">
              <DemoCredentials credentials={accounts} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
