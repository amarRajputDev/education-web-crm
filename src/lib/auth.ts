import "server-only";
import crypto from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "./db";
import { can, rolePermissions, type PermissionKey } from "./rbac";

export { hashPassword, verifyPassword } from "./password";

export const SESSION_COOKIE = "aarohan_session";
const SESSION_TTL_DAYS = 7;

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  phone: string;
  role_key: string;
  role_name: string;
  status: string;
  designation: string;
  avatar_url: string;
  last_login_at: string | null;
};

export type AuthContext = {
  user: SessionUser;
  permissions: PermissionKey[];
};

const hashToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");

export async function createSession(userId: number, ip = "", userAgent = ""): Promise<string> {
  const db = getDb();
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  db.prepare(
    `INSERT INTO sessions (id, user_id, expires_at, ip, user_agent) VALUES (?, ?, ?, ?, ?)`,
  ).run(hashToken(token), userId, expires.toISOString(), ip, userAgent.slice(0, 240));
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && process.env.ALLOW_INSECURE_COOKIES !== "1",
    path: "/",
    expires,
  });
  return token;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    try {
      getDb().prepare("DELETE FROM sessions WHERE id = ?").run(hashToken(token));
    } catch {
      // Session table unavailable — cookie is cleared regardless.
    }
  }
  cookieStore.delete(SESSION_COOKIE);
}

export async function getAuthContext(): Promise<AuthContext | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const db = getDb();
  const row = db
    .prepare(
      `SELECT s.id AS session_id, s.expires_at, s.last_seen_at,
              u.id, u.name, u.email, u.phone, u.role_key, u.status, u.designation,
              u.avatar_url, u.last_login_at, r.name AS role_name
         FROM sessions s
         JOIN users u ON u.id = s.user_id
         JOIN roles r ON r.key = u.role_key
        WHERE s.id = ?`,
    )
    .get(hashToken(token)) as
    | {
        session_id: string;
        expires_at: string;
        last_seen_at: string;
        id: number;
        name: string;
        email: string;
        phone: string;
        role_key: string;
        status: string;
        designation: string;
        avatar_url: string;
        last_login_at: string | null;
        role_name: string;
      }
    | undefined;

  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    db.prepare("DELETE FROM sessions WHERE id = ?").run(row.session_id);
    return null;
  }
  if (row.status !== "active") return null;

  const lastSeen = new Date(row.last_seen_at).getTime();
  if (Date.now() - lastSeen > 5 * 60 * 1000) {
    db.prepare("UPDATE sessions SET last_seen_at = datetime('now') WHERE id = ?").run(
      row.session_id,
    );
  }

  return {
    user: {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      role_key: row.role_key,
      role_name: row.role_name,
      status: row.status,
      designation: row.designation,
      avatar_url: row.avatar_url,
      last_login_at: row.last_login_at,
    },
    permissions: rolePermissions(row.role_key),
  };
}

export async function requireAuth(permission?: PermissionKey): Promise<AuthContext> {
  const context = await getAuthContext();
  if (!context) redirect("/admin/login");
  if (permission && !can(context.user.role_key, permission)) redirect("/admin/unauthorized");
  return context;
}

/** Guard for server actions / route handlers — throws instead of redirecting. */
export async function assertPermission(permission: PermissionKey): Promise<AuthContext> {
  const context = await getAuthContext();
  if (!context) throw new Error("AUTH_REQUIRED");
  if (!can(context.user.role_key, permission)) throw new Error("FORBIDDEN");
  return context;
}

export async function clientMeta(): Promise<{ ip: string; userAgent: string }> {
  const store = await headers();
  const ip =
    store.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    store.get("x-real-ip") ||
    "local";
  return { ip, userAgent: store.get("user-agent") ?? "" };
}

/**
 * Fixed-window rate limiter used by public form submissions and login attempts.
 * Returns false when the bucket has exhausted its allowance.
 */
export function checkRateLimit(bucket: string, limit: number, windowSeconds: number): boolean {
  const db = getDb();
  const windowStart = Math.floor(Date.now() / 1000 / windowSeconds) * windowSeconds;
  const key = `${bucket}:${windowStart}`;
  try {
    const result = db
      .prepare(
        `INSERT INTO rate_limits (bucket, window_start, count) VALUES (?, ?, 1)
         ON CONFLICT(bucket, window_start) DO UPDATE SET count = count + 1
         RETURNING count`,
      )
      .get(key, String(windowStart)) as { count: number } | undefined;
    return (result?.count ?? 1) <= limit;
  } catch {
    return true;
  }
}
