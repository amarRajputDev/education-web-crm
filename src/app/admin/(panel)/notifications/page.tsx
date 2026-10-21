import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { AdminCard, AdminPageHeader } from "@/components/admin/page-header";
import { NotificationsList } from "@/components/admin/notifications-list";
import { EmptyState } from "@/components/ui/feedback";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Notifications · Admin",
  robots: { index: false, follow: false },
};

type NotificationRow = {
  id: number;
  type: string;
  title: string;
  body: string;
  link: string;
  read_at: string | null;
  created_at: string;
};

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const ctx = await requireAuth();
  const params = await searchParams;
  const filter = params.filter === "unread" ? "unread" : "all";

  const db = getDb();
  const rows = db
    .prepare(
      `SELECT id, type, title, body, link, read_at, created_at
         FROM notifications
        WHERE (user_id = ? OR user_id IS NULL)
          ${filter === "unread" ? "AND read_at IS NULL" : ""}
        ORDER BY created_at DESC
        LIMIT 100`,
    )
    .all(ctx.user.id) as NotificationRow[];

  const totals = db
    .prepare(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN read_at IS NULL THEN 1 ELSE 0 END) AS unread
         FROM notifications
        WHERE user_id = ? OR user_id IS NULL`,
    )
    .get(ctx.user.id) as { total: number; unread: number | null };

  const unread = totals.unread ?? 0;

  const tabs = [
    { key: "all", label: "All", count: totals.total },
    { key: "unread", label: "Unread", count: unread },
  ] as const;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Notifications"
        description="Updates about enquiries, applications, follow-ups and system activity for your account."
        meta={[
          { label: "Unread", value: unread },
          { label: "Total", value: totals.total },
        ]}
      />

      <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Notification filters">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.key === "all" ? "/admin/notifications" : "/admin/notifications?filter=unread"}
            role="tab"
            aria-selected={filter === tab.key}
            className={cn(
              "rounded-xl border px-3.5 py-2 text-[12.5px] font-bold transition",
              filter === tab.key
                ? "border-navy bg-navy text-white"
                : "border-line bg-paper text-slate-body hover:border-royal hover:text-royal",
            )}
          >
            {tab.label}
            <span
              className={cn(
                "ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-extrabold",
                filter === tab.key ? "bg-white/20" : "bg-royal-100 text-royal",
              )}
            >
              {tab.count}
            </span>
          </Link>
        ))}
      </div>

      <AdminCard title={filter === "unread" ? "Unread notifications" : "All notifications"}>
        {rows.length === 0 ? (
          filter === "unread" ? (
            <EmptyState
              compact
              title="Nothing unread"
              description="Every notification has been marked as read."
              action={
                <Link href="/admin/notifications" className="btn btn-outline btn-sm">
                  View all notifications
                </Link>
              }
            />
          ) : (
            <EmptyState
              compact
              title="No notifications yet"
              description="Updates about your work will appear here as they happen."
            />
          )
        ) : (
          <NotificationsList items={rows} />
        )}
      </AdminCard>
    </div>
  );
}
