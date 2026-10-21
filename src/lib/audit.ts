import "server-only";
import { getDb } from "./db";

export function logAudit(params: {
  userId?: number | null;
  action: string;
  entity?: string;
  entityId?: string | number;
  detail?: string;
  ip?: string;
}): void {
  try {
    getDb()
      .prepare(
        `INSERT INTO audit_logs (user_id, action, entity, entity_id, detail, ip)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(
        params.userId ?? null,
        params.action,
        params.entity ?? "",
        String(params.entityId ?? ""),
        params.detail ?? "",
        params.ip ?? "",
      );
  } catch (error) {
    // Auditing must never break the primary operation.
    console.error("audit log failed", error);
  }
}

export function listAudit(limit = 100) {
  return getDb()
    .prepare(
      `SELECT a.*, u.name AS user_name, u.email AS user_email
         FROM audit_logs a
         LEFT JOIN users u ON u.id = a.user_id
        ORDER BY a.created_at DESC
        LIMIT ?`,
    )
    .all(limit);
}
