import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Home, ShieldAlert } from "lucide-react";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Access denied · Admin",
  robots: { index: false, follow: false },
};

export default async function UnauthorizedPage() {
  const ctx = await requireAuth();

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="card w-full max-w-xl p-7 text-center sm:p-10">
        <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-danger-100 text-danger">
          <ShieldAlert className="h-8 w-8" aria-hidden />
        </span>

        <p className="mt-5 text-[11px] font-extrabold uppercase tracking-[0.24em] text-danger">
          403 · Access denied
        </p>
        <h1 className="mt-2 text-[clamp(1.4rem,3vw,2rem)] font-semibold leading-tight text-navy">
          You do not have access to this area
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-body">
          Your account is signed in as{" "}
          <span className="font-semibold text-navy">{ctx.user.name}</span> with the{" "}
          <span className="font-semibold text-navy">{ctx.user.role_name}</span> role, and that role does not
          include the permission this page requires. Access is checked on the server for every request —
          changing the address will not bypass it.
        </p>

        <p className="mx-auto mt-4 max-w-md rounded-xl border border-line bg-offwhite/60 p-3 text-xs leading-relaxed text-slate-body">
          If you believe you need this access, ask a Super Admin to update your role on the{" "}
          <Link href="/admin/team" className="font-bold text-royal hover:underline">
            Team &amp; permissions
          </Link>{" "}
          page.
        </p>

        <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
          <Link href="/admin/dashboard" className="btn btn-primary">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to dashboard
          </Link>
          <Link href="/" className="btn btn-outline">
            <Home className="h-4 w-4" aria-hidden />
            Go to public site
          </Link>
        </div>
      </div>
    </div>
  );
}
