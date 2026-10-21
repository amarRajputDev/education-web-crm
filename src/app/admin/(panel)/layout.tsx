import { requireAuth } from "@/lib/auth";
import { PERMISSIONS, can, rolePermissions } from "@/lib/rbac";
import { getDb } from "@/lib/db";
import { AdminShell, type ShellNotification } from "@/components/admin/shell";

export const dynamic = "force-dynamic";

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const context = await requireAuth();
  const roleKey = context.user.role_key;
  const db = getDb();

  const notifications = db
    .prepare(
      `SELECT id, title, body, link, type, created_at, read_at
         FROM notifications
        WHERE user_id = ? OR user_id IS NULL
        ORDER BY created_at DESC
        LIMIT 12`,
    )
    .all(context.user.id) as ShellNotification[];

  const unread = notifications.filter((item) => !item.read_at).length;

  // Counsellors only see the workload assigned to them.
  const canViewAllEnquiries = can(roleKey, PERMISSIONS.ENQUIRY_VIEW_ALL);
  const enquiries =
    can(roleKey, PERMISSIONS.ENQUIRY_VIEW)
      ? (
          db
            .prepare(
              `SELECT COUNT(*) AS c FROM enquiries
                WHERE (? = 1 OR counsellor_id = ?)
                  AND status NOT IN ('converted','invalid_lead','not_interested')`,
            )
            .get(canViewAllEnquiries ? 1 : 0, context.user.id) as { c: number }
        ).c
      : 0;

  const applications = can(roleKey, PERMISSIONS.APPLICATION_VIEW)
    ? (
        db
          .prepare(
            `SELECT COUNT(*) AS c FROM admission_applications
              WHERE status IN ('submitted','under_review','documents_required')`,
          )
          .get() as { c: number }
      ).c
    : 0;

  return (
    <AdminShell
      user={{
        name: context.user.name,
        email: context.user.email,
        roleKey: context.user.role_key,
        roleName: context.user.role_name,
        designation: context.user.designation,
      }}
      permissions={rolePermissions(roleKey)}
      notifications={notifications}
      unreadCount={unread}
      badges={{ enquiries, applications }}
    >
      {children}
    </AdminShell>
  );
}
