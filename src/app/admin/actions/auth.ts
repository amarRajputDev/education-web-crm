"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { checkRateLimit, clientMeta, createSession, destroySession, verifyPassword } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { loginSchema } from "@/lib/validation";

export type LoginState = { error?: string; fieldErrors?: Record<string, string> };

const safeNext = (value: unknown): string => {
  const next = typeof value === "string" ? value : "";
  if (!next.startsWith("/")) return "/admin/dashboard";
  if (next.startsWith("//")) return "/admin/dashboard";
  if (!next.startsWith("/admin")) return "/admin/dashboard";
  if (next.startsWith("/admin/login")) return "/admin/dashboard";
  return next;
};

export async function loginAction(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const { ip, userAgent } = await clientMeta();
  if (!checkRateLimit(`login:${ip}`, 8, 900)) {
    return { error: "Too many sign-in attempts. Please wait a few minutes and try again." };
  }

  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
    return { fieldErrors };
  }

  const db = getDb();
  const row = db
    .prepare(`SELECT id, name, email, password_hash, role_key, status FROM users WHERE LOWER(email) = ?`)
    .get(parsed.data.email.trim().toLowerCase()) as
    | { id: number; name: string; email: string; password_hash: string; role_key: string; status: string }
    | undefined;

  // Constant message: never reveal whether an account exists.
  const invalid = { error: "Incorrect email or password." };
  if (!row) {
    logAudit({ action: "auth.login_failed", detail: parsed.data.email, ip });
    return invalid;
  }

  const ok = await verifyPassword(parsed.data.password, row.password_hash);
  if (!ok) {
    logAudit({ action: "auth.login_failed", detail: row.email, ip });
    return invalid;
  }
  if (row.status !== "active") {
    logAudit({ action: "auth.login_blocked", detail: `${row.email} (${row.status})`, ip });
    return { error: "This account is inactive. Please contact the administrator." };
  }

  await createSession(row.id, ip, userAgent);
  db.prepare("UPDATE users SET last_login_at = datetime('now') WHERE id = ?").run(row.id);
  logAudit({ userId: row.id, action: "auth.login", entity: "user", entityId: row.id, detail: row.email, ip });

  redirect(safeNext(formData.get("next")));
}

export async function logoutAction(): Promise<void> {
  const { ip } = await clientMeta();
  await destroySession();
  logAudit({ action: "auth.logout", ip });
  redirect("/admin/login");
}

export async function requestPasswordReset(_state: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!z.string().email().safeParse(email).success) {
    return { error: "Enter a valid email address." };
  }
  // No mail provider is configured in the demo, so we deliberately do not
  // pretend a reset email was sent.
  return {
    error:
      "Password resets are performed by a Super Admin in this demo (Admin → Team & Permissions → Reset password). No email was sent.",
  };
}
