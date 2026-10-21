import type { Metadata } from "next";
import { BadgeCheck, Clock, Mail, ShieldUser, UserRound } from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { ROLE_DEFINITIONS, rolePermissions } from "@/lib/rbac";
import { formatDateTime } from "@/lib/format";
import { AdminCard, AdminPageHeader } from "@/components/admin/page-header";
import { ChangePasswordForm } from "@/components/admin/change-password-form";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My profile · Admin",
  robots: { index: false, follow: false },
};

function humanise(key: string): string {
  return key
    .replace(/\./g, " · ")
    .split(" ")
    .map((part) => (part === "·" ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join(" ");
}

export default async function ProfilePage() {
  const ctx = await requireAuth();
  const role = ROLE_DEFINITIONS[ctx.user.role_key];
  const permissions = rolePermissions(ctx.user.role_key);

  const details = [
    { icon: UserRound, label: "Full name", value: ctx.user.name },
    { icon: Mail, label: "Email", value: ctx.user.email },
    { icon: BadgeCheck, label: "Designation", value: ctx.user.designation || "—" },
    { icon: Clock, label: "Last login", value: formatDateTime(ctx.user.last_login_at) },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="My profile"
        description="Your account details and the permissions your role grants. Contact another Super Admin if something here looks wrong."
        meta={[
          { label: "Role", value: role?.name ?? ctx.user.role_name },
          { label: "Status", value: ctx.user.status },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <AdminCard
          className="lg:col-span-2"
          title="Account details"
          description="Read-only — your name, email and role are managed by a Super Admin on the Team page."
        >
          <dl className="grid gap-3 sm:grid-cols-2">
            {details.map((item) => (
              <div key={item.label} className="rounded-xl border border-line bg-offwhite/50 p-3.5">
                <dt className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-body">
                  <item.icon className="h-3.5 w-3.5" aria-hidden />
                  {item.label}
                </dt>
                <dd className="mt-1 truncate text-sm font-semibold text-navy">{item.value}</dd>
              </div>
            ))}
            <div className="rounded-xl border border-line bg-offwhite/50 p-3.5 sm:col-span-2">
              <dt className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-body">
                <ShieldUser className="h-3.5 w-3.5" aria-hidden />
                Role
              </dt>
              <dd className="mt-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="gold">{role?.name ?? ctx.user.role_name}</Badge>
                  <span className="font-mono text-[11px] text-slate-body">{ctx.user.role_key}</span>
                </div>
                {role ? <p className="mt-1.5 text-xs leading-relaxed text-slate-body">{role.description}</p> : null}
              </dd>
            </div>
          </dl>
        </AdminCard>

        <AdminCard
          title="Permissions"
          description={`Granted through the ${role?.name ?? ctx.user.role_name} role. Enforced server-side on every request.`}
        >
          <ul className="flex flex-wrap gap-1.5">
            {permissions.length === 0 ? (
              <li className="text-xs text-slate-body">No permissions granted.</li>
            ) : (
              permissions.map((permission) => (
                <li key={permission}>
                  <Badge tone="info">{humanise(permission)}</Badge>
                </li>
              ))
            )}
          </ul>
        </AdminCard>
      </div>

      <AdminCard
        title="Change password"
        description="Changing your password signs you out of every other device. This device stays signed in."
      >
        <ChangePasswordForm />
      </AdminCard>
    </div>
  );
}
