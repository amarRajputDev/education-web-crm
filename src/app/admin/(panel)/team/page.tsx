import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { PERMISSIONS, ROLE_DEFINITIONS } from "@/lib/rbac";
import { AdminCard, AdminPageHeader } from "@/components/admin/page-header";
import { RolesMatrix } from "@/components/admin/team/roles-matrix";
import { TeamManager, type TeamUser } from "@/components/admin/team/team-manager";
import { EmptyState } from "@/components/ui/feedback";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Team & Permissions · Admin",
  robots: { index: false, follow: false },
};

export default async function TeamPage() {
  const ctx = await requireAuth(PERMISSIONS.USER_MANAGE);

  const users = getDb()
    .prepare(
      `SELECT u.id, u.name, u.email, u.phone, u.designation, u.role_key, u.status, u.last_login_at,
              r.name AS role_name,
              (SELECT COUNT(*) FROM sessions s WHERE s.user_id = u.id AND s.expires_at > datetime('now')) AS session_count
         FROM users u
         JOIN roles r ON r.key = u.role_key
        ORDER BY u.name COLLATE NOCASE`,
    )
    .all() as TeamUser[];

  const roles = Object.entries(ROLE_DEFINITIONS).map(([key, role]) => ({
    key,
    name: role.name,
    description: role.description,
  }));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Team & permissions"
        description="Manage who can sign in to the admin panel, which role they hold and their account status. Every change is written to the audit log."
        meta={[
          { label: "Members", value: users.length },
          { label: "Roles", value: roles.length },
          { label: "Signed in as", value: ctx.user.role_name },
        ]}
      />

      <AdminCard
        title="Users"
        description="Deactivating a user or resetting their password revokes all of their sessions immediately."
        padding={false}
      >
        <div className="p-5 sm:p-6">
          {users.length === 0 ? (
            <EmptyState title="No users yet" description="Create the first login for your team." />
          ) : (
            <TeamManager users={users} roles={roles} currentUserId={ctx.user.id} />
          )}
        </div>
      </AdminCard>

      <AdminCard
        title="Roles & permissions"
        description="Read-only overview of the permission set each role carries. Permissions are enforced server-side on every request — hiding a menu item is never the access control."
      >
        <RolesMatrix />
        <ul className="mt-4 space-y-2">
          {roles.map((role) => (
            <li key={role.key} className="rounded-xl border border-line bg-offwhite/50 p-3 text-sm">
              <span className="font-semibold text-navy">{role.name}</span>
              <span className="ml-2 text-xs text-slate-body">({role.key})</span>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-body">{role.description}</p>
            </li>
          ))}
        </ul>
      </AdminCard>
    </div>
  );
}
