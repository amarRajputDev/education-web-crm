import "server-only";
import { getDb } from "./db";

export type NotificationRow = {
  id: number;
  user_id: number | null;
  type: string;
  title: string;
  body: string;
  link: string;
  entity: string;
  entity_id: number | null;
  read_at: string | null;
  created_at: string;
};

export function notify(params: {
  userId?: number | null;
  type?: "info" | "success" | "warning" | "urgent";
  title: string;
  body?: string;
  link?: string;
  entity?: string;
  entityId?: number;
}): void {
  try {
    getDb()
      .prepare(
        `INSERT INTO notifications (user_id, type, title, body, link, entity, entity_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        params.userId ?? null,
        params.type ?? "info",
        params.title,
        params.body ?? "",
        params.link ?? "",
        params.entity ?? "",
        params.entityId ?? null,
      );
  } catch (error) {
    console.error("notification insert failed", error);
  }
}

export function listNotifications(userId: number, unreadOnly = false, limit = 20): NotificationRow[] {
  const db = getDb();
  const sql = `SELECT * FROM notifications
                WHERE (user_id = ? OR user_id IS NULL)
                  ${unreadOnly ? "AND read_at IS NULL" : ""}
                ORDER BY created_at DESC
                LIMIT ?`;
  return db.prepare(sql).all(userId, limit) as NotificationRow[];
}

export function unreadNotificationCount(userId: number): number {
  const row = getDb()
    .prepare(
      `SELECT COUNT(*) AS count FROM notifications
        WHERE (user_id = ? OR user_id IS NULL) AND read_at IS NULL`,
    )
    .get(userId) as { count: number };
  return row?.count ?? 0;
}

export function markNotificationRead(userId: number, id: number): void {
  getDb()
    .prepare("UPDATE notifications SET read_at = datetime('now') WHERE id = ? AND (user_id = ? OR user_id IS NULL)")
    .run(id, userId);
}

export function markAllNotificationsRead(userId: number): void {
  getDb()
    .prepare(
      "UPDATE notifications SET read_at = datetime('now') WHERE (user_id = ? OR user_id IS NULL) AND read_at IS NULL",
    )
    .run(userId);
}
