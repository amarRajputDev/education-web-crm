"use server";

import { revalidatePath } from "next/cache";
import { assertPermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/rbac";
import { getDb } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function markReadAction(id: number): Promise<{ ok: boolean }> {
  const context = await assertPermission(PERMISSIONS.NOTIFICATION_VIEW);
  getDb()
    .prepare(
      `UPDATE notifications SET read_at = datetime('now')
        WHERE id = ? AND (user_id = ? OR user_id IS NULL) AND read_at IS NULL`,
    )
    .run(id, context.user.id);
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function markAllReadAction(): Promise<{ ok: boolean }> {
  const context = await assertPermission(PERMISSIONS.NOTIFICATION_VIEW);
  getDb()
    .prepare(
      `UPDATE notifications SET read_at = datetime('now')
        WHERE (user_id = ? OR user_id IS NULL) AND read_at IS NULL`,
    )
    .run(context.user.id);
  revalidatePath("/admin", "layout");
  return { ok: true };
}
