"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { SESSION_COOKIE, getAuthContext, hashPassword, verifyPassword } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { getDb } from "@/lib/db";

export type ProfileActionState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string>;
};

const hashToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");

export async function changeOwnPassword(
  _prev: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const context = await getAuthContext();
  if (!context) {
    return { ok: false, message: "Your session has expired. Please sign in again." };
  }

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  const errors: Record<string, string> = {};
  if (!currentPassword) errors.currentPassword = "Enter your current password.";
  if (newPassword.length < 8) {
    errors.newPassword = "The new password must be at least 8 characters.";
  } else if (newPassword.length > 72) {
    errors.newPassword = "Keep the new password under 72 characters.";
  } else if (newPassword === currentPassword) {
    errors.newPassword = "The new password must be different from the current one.";
  }
  if (confirmPassword !== newPassword) {
    errors.confirmPassword = "The two passwords do not match.";
  }
  if (Object.keys(errors).length > 0) {
    return { ok: false, message: "Some fields need attention.", errors };
  }

  const db = getDb();
  const row = db
    .prepare(`SELECT id, password_hash FROM users WHERE id = ?`)
    .get(context.user.id) as { id: number; password_hash: string } | undefined;
  if (!row) {
    return { ok: false, message: "Your account no longer exists.", errors: { _form: "Account not found." } };
  }

  const valid = await verifyPassword(currentPassword, row.password_hash);
  if (!valid) {
    return {
      ok: false,
      message: "Current password is incorrect.",
      errors: { currentPassword: "Current password is incorrect" },
    };
  }

  const passwordHash = await hashPassword(newPassword);
  db.prepare(
    `UPDATE users SET password_hash = ?, must_change_password = 0, updated_at = datetime('now') WHERE id = ?`,
  ).run(passwordHash, context.user.id);

  // Revoke every OTHER session so the old password cannot be used anywhere
  // else; the device performing the change stays signed in.
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const currentSessionId = token ? hashToken(token) : "";
  db.prepare(`DELETE FROM sessions WHERE user_id = ? AND id != ?`).run(context.user.id, currentSessionId);

  logAudit({
    userId: context.user.id,
    action: "user.password.change",
    entity: "user",
    entityId: context.user.id,
    detail: "Own password changed; other sessions revoked",
  });
  revalidatePath("/admin/profile");
  return {
    ok: true,
    message: "Password updated. Any other devices have been signed out.",
  };
}
