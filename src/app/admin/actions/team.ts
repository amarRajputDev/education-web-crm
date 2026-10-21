"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertPermission, clientMeta, hashPassword } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { getDb } from "@/lib/db";
import { PERMISSIONS } from "@/lib/rbac";
import { adminUserSchema, fieldErrors } from "@/lib/validation";

export type TeamActionState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string>;
};

const roleKeySchema = z.enum(["super_admin", "admission_manager", "counsellor", "editor"]);
const statusSchema = z.enum(["active", "invited", "inactive"]);

const updateUserSchema = z.object({
  userId: z.coerce.number().int().min(1, "Unknown user"),
  name: z.string().trim().min(2, "Name is required").max(120, "Keep the name under 120 characters"),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
  phone: z.string().trim().max(30, "Keep the phone under 30 characters").default(""),
  designation: z.string().trim().max(120, "Keep the designation under 120 characters").default(""),
  roleKey: roleKeySchema,
  status: statusSchema,
});

const resetPasswordSchema = z
  .object({
    userId: z.coerce.number().int().min(1, "Unknown user"),
    password: z.string().min(8, "Password must be at least 8 characters").max(72, "Keep the password under 72 characters"),
    confirm: z.string().min(8, "Confirm the new password"),
  })
  .refine((data) => data.password === data.confirm, {
    message: "The two passwords do not match",
    path: ["confirm"],
  });

function countOtherActiveSuperAdmins(db: ReturnType<typeof getDb>, userId: number): number {
  const row = db
    .prepare(
      `SELECT COUNT(*) AS c FROM users
        WHERE role_key = 'super_admin' AND status = 'active' AND id != ?`,
    )
    .get(userId) as { c: number };
  return row.c;
}

export async function createUser(_prev: TeamActionState, formData: FormData): Promise<TeamActionState> {
  const ctx = await assertPermission(PERMISSIONS.USER_MANAGE);
  const parsed = adminUserSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    roleKey: String(formData.get("roleKey") ?? ""),
    designation: String(formData.get("designation") ?? ""),
    status: String(formData.get("status") || "invited"),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) {
    return { ok: false, message: "Some fields need attention.", errors: fieldErrors(parsed.error) };
  }

  const data = parsed.data;
  // The demo has no invitation-email delivery, so an initial password is required.
  if (!data.password || data.password.length < 8) {
    return {
      ok: false,
      message: "An initial password is required.",
      errors: { password: "Add an initial password of at least 8 characters." },
    };
  }

  const email = data.email.trim().toLowerCase();
  const db = getDb();

  const existing = db.prepare(`SELECT id FROM users WHERE LOWER(email) = ?`).get(email) as
    | { id: number }
    | undefined;
  if (existing) {
    return {
      ok: false,
      message: "That email is already registered.",
      errors: { email: "A user with this email already exists." },
    };
  }

  const passwordHash = await hashPassword(data.password);
  const info = db
    .prepare(
      `INSERT INTO users (name, email, phone, role_key, status, designation, password_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(data.name, email, data.phone, data.roleKey, data.status, data.designation, passwordHash);
  const userId = Number(info.lastInsertRowid);

  logAudit({
    userId: ctx.user.id,
    action: "user.create",
    entity: "user",
    entityId: userId,
    detail: `${data.name} <${email}> · ${data.roleKey} · ${data.status}`,
  });
  revalidatePath("/admin/team");
  return { ok: true, message: `Created ${data.name} with the ${data.roleKey.replace(/_/g, " ")} role.` };
}

export async function updateUser(_prev: TeamActionState, formData: FormData): Promise<TeamActionState> {
  const ctx = await assertPermission(PERMISSIONS.USER_MANAGE);
  const parsed = updateUserSchema.safeParse({
    userId: String(formData.get("userId") ?? ""),
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    designation: String(formData.get("designation") ?? ""),
    roleKey: String(formData.get("roleKey") ?? ""),
    status: String(formData.get("status") ?? ""),
  });
  if (!parsed.success) {
    return { ok: false, message: "Some fields need attention.", errors: fieldErrors(parsed.error) };
  }

  const data = parsed.data;
  const email = data.email.trim().toLowerCase();
  const db = getDb();
  const target = db
    .prepare(`SELECT id, name, email, role_key, status FROM users WHERE id = ?`)
    .get(data.userId) as
    | { id: number; name: string; email: string; role_key: string; status: string }
    | undefined;
  if (!target) {
    return { ok: false, message: "That user no longer exists.", errors: { _form: "User not found." } };
  }

  if (email !== target.email) {
    const duplicate = db.prepare(`SELECT id FROM users WHERE LOWER(email) = ?`).get(email) as
      | { id: number }
      | undefined;
    if (duplicate) {
      return {
        ok: false,
        message: "That email is already registered.",
        errors: { email: "A user with this email already exists." },
      };
    }
  }

  if (target.id === ctx.user.id && data.status === "inactive") {
    return {
      ok: false,
      message: "You cannot deactivate your own account.",
      errors: { status: "You cannot deactivate your own account. Ask another Super Admin instead." },
    };
  }

  if (target.role_key === "super_admin" && data.roleKey !== "super_admin") {
    if (countOtherActiveSuperAdmins(db, target.id) === 0) {
      return {
        ok: false,
        message: "The last Super Admin cannot be demoted.",
        errors: {
          roleKey:
            "This is the only active Super Admin. Promote another user to Super Admin before changing this role.",
        },
      };
    }
  }

  db.prepare(
    `UPDATE users
        SET name = ?, email = ?, phone = ?, designation = ?, role_key = ?, status = ?, updated_at = datetime('now')
      WHERE id = ?`,
  ).run(data.name, email, data.phone, data.designation, data.roleKey, data.status, data.userId);

  if (data.status !== "active") {
    db.prepare(`DELETE FROM sessions WHERE user_id = ?`).run(data.userId);
  }

  logAudit({
    userId: ctx.user.id,
    action: "user.update",
    entity: "user",
    entityId: target.id,
    detail: `${target.name}: ${target.role_key}→${data.roleKey}, ${target.status}→${data.status}${
      email !== target.email ? `, email ${target.email}→${email}` : ""
    }`,
  });
  revalidatePath("/admin/team");
  return { ok: true, message: `Updated ${data.name}.` };
}

export async function resetPassword(_prev: TeamActionState, formData: FormData): Promise<TeamActionState> {
  const ctx = await assertPermission(PERMISSIONS.USER_MANAGE);
  const parsed = resetPasswordSchema.safeParse({
    userId: String(formData.get("userId") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirm: String(formData.get("confirm") ?? ""),
  });
  if (!parsed.success) {
    return { ok: false, message: "Some fields need attention.", errors: fieldErrors(parsed.error) };
  }

  const data = parsed.data;
  const db = getDb();
  const target = db.prepare(`SELECT id, name, email FROM users WHERE id = ?`).get(data.userId) as
    | { id: number; name: string; email: string }
    | undefined;
  if (!target) {
    return { ok: false, message: "That user no longer exists.", errors: { _form: "User not found." } };
  }

  const passwordHash = await hashPassword(data.password);
  db.prepare(
    `UPDATE users
        SET password_hash = ?, must_change_password = 1, updated_at = datetime('now')
      WHERE id = ?`,
  ).run(passwordHash, target.id);
  // Revoke every active session so the old password cannot be used anywhere.
  db.prepare(`DELETE FROM sessions WHERE user_id = ?`).run(target.id);

  const { ip } = await clientMeta();
  logAudit({
    userId: ctx.user.id,
    action: "user.password.reset",
    entity: "user",
    entityId: target.id,
    detail: `Password reset for ${target.email}; all sessions revoked`,
    ip,
  });
  revalidatePath("/admin/team");
  return {
    ok: true,
    message: `Password reset for ${target.name}. All their sessions were signed out.`,
  };
}

export async function forceLogoutUser(userId: number): Promise<TeamActionState> {
  const ctx = await assertPermission(PERMISSIONS.USER_MANAGE);
  const db = getDb();
  const target = db.prepare(`SELECT id, name, email FROM users WHERE id = ?`).get(userId) as
    | { id: number; name: string; email: string }
    | undefined;
  if (!target) {
    return { ok: false, message: "That user no longer exists." };
  }

  db.prepare(`DELETE FROM sessions WHERE user_id = ?`).run(target.id);

  const { ip } = await clientMeta();
  logAudit({
    userId: ctx.user.id,
    action: "user.sessions.revoke",
    entity: "user",
    entityId: target.id,
    detail: `All sessions revoked for ${target.email}`,
    ip,
  });
  revalidatePath("/admin/team");
  return { ok: true, message: `Signed out ${target.name} from all devices.` };
}
