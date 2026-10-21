import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  ClipboardList,
  FileCheck2,
  Megaphone,
  Percent,
  Plus,
  RefreshCw,
  TrendingUp,
  UserCheck,
} from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { PERMISSIONS, can } from "@/lib/rbac";
import {
  combinedTrend,
  conversionFunnel,
  counsellorPerformance,
  dashboardKpis,
  enquiriesByCourse,
  leadsBySource,
  applicationStatusDistribution,
  followupSummary,
  recentActivity,
  recentRecords,
} from "@/lib/metrics";
import { KpiCard } from "@/components/admin/kpi";
import { CategoryBarChart, ChartCard, DonutChart, FunnelList, TrendChart } from "@/components/admin/charts";
import { statusTone, formatDate, formatDateTime, isBeforeNow, relativeTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";

const RANGES = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
  { days: 365, label: "12 months" },
] as const;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const context = await requireAuth(PERMISSIONS.DASHBOARD_VIEW);
  const params = await searchParams;
  const parsedRange = Number(params.range);
  const range: 7 | 30 | 90 | 365 = ([7, 30, 90, 365] as number[]).includes(parsedRange)
    ? (parsedRange as 7 | 30 | 90 | 365)
    : 30;

  const kpis = dashboardKpis(range);
  const trend = combinedTrend(range);
  const funnel = conversionFunnel(range);
  const byCourse = enquiriesByCourse(range);
  const bySource = leadsBySource(range);
  const appStatus = applicationStatusDistribution();
  const counsellors = counsellorPerformance(range);
  const followups = followupSummary();
  const activity = recentActivity(6);
  const records = recentRecords();

  const delta = (value: { delta: number | null }) => value.delta;

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-royal">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
          <h1 className="mt-2 text-[clamp(1.7rem,3.2vw,2.4rem)] leading-tight text-navy">
            Welcome back, {context.user.name.split(" ")[0]}.
          </h1>
          <p className="mt-1.5 text-sm text-slate-body">
            {kpis.overdueFollowups > 0 ? (
              <>
                <span className="font-semibold text-danger">{kpis.overdueFollowups} follow-up{kpis.overdueFollowups === 1 ? "" : "s"} overdue</span>{" "}
                and {kpis.dueToday} due today · {kpis.underReview} application{kpis.underReview === 1 ? "" : "s"} awaiting review
              </>
            ) : (
              <>
                {kpis.dueToday} follow-up{kpis.dueToday === 1 ? "" : "s"} due today · {kpis.underReview} application{kpis.underReview === 1 ? "" : "s"} awaiting review
              </>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-xl border border-line bg-paper p-1">
            {RANGES.map((item) => (
              <Link
                key={item.days}
                href={`/admin/dashboard?range=${item.days}`}
                aria-current={range === item.days ? "true" : undefined}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-[12px] font-bold transition",
                  range === item.days ? "bg-navy text-white" : "text-slate-body hover:text-navy",
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <Link href="/admin/dashboard" className="btn btn-ghost btn-sm" title="Reset to default range">
            <RefreshCw className="h-4 w-4" aria-hidden />
          </Link>
          {can(context.user.role_key, PERMISSIONS.ENQUIRY_MANAGE) ? (
            <Link href="/admin/enquiries/new" className="btn btn-primary btn-sm">
              <Plus className="h-4 w-4" aria-hidden />
              Add enquiry
            </Link>
          ) : null}
          {can(context.user.role_key, PERMISSIONS.APPLICATION_VIEW) ? (
            <Link href="/admin/admissions?status=submitted" className="btn btn-navy btn-sm">
              Review applications
            </Link>
          ) : null}
        </div>
      </div>

      {/* KPI grid */}
      <section aria-label="Key metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          label="Total enquiries"
          value={kpis.totalEnquiries}
          icon={Megaphone}
          hint="All time, all sources"
          sub={kpis.newEnquiries.current ? `${kpis.newEnquiries.current} in last ${range}d` : undefined}
        />
        <KpiCard
          label="New enquiries"
          value={kpis.newEnquiries.current}
          delta={delta(kpis.newEnquiries)}
          icon={TrendingUp}
          tone="neutral"
          hint={`Received in the last ${range} days`}
        />
        <KpiCard
          label="Contacted"
          value={kpis.contacted.current}
          delta={delta(kpis.contacted)}
          icon={UserCheck}
          tone="success"
          hint="Reached at least once"
        />
        <KpiCard
          label="Qualified leads"
          value={kpis.qualified.current}
          delta={delta(kpis.qualified)}
          icon={BadgeCheck}
          tone="warning"
          hint="Interested or further along"
        />
        <KpiCard
          label="Pending follow-ups"
          value={kpis.pendingFollowups}
          icon={CalendarClock}
          tone={kpis.overdueFollowups > 0 ? "danger" : "neutral"}
          hint={`${kpis.overdueFollowups} overdue · ${kpis.dueToday} due today`}
        />
      </section>

      <section aria-label="Admission metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          label="Applications submitted"
          value={kpis.applicationsSubmitted.current}
          delta={delta(kpis.applicationsSubmitted)}
          icon={ClipboardList}
          hint={`In the last ${range} days`}
          sub={`${kpis.totalApplications} all time`}
        />
        <KpiCard label="Under review" value={kpis.underReview} icon={RefreshCw} tone="warning" hint="Review / documents / interview" />
        <KpiCard label="Accepted" value={kpis.accepted} icon={FileCheck2} tone="success" hint="Approved or enrolled" />
        <KpiCard label="Rejected" value={kpis.rejected} icon={ClipboardList} tone="danger" hint="Recorded with a decision reason" />
        <KpiCard
          label="Enquiry → application"
          value={`${kpis.conversion}%`}
          icon={Percent}
          tone="neutral"
          hint={`Enrolment conversion ${kpis.enrolmentRate}%`}
        />
      </section>

      {/* charts row 1 */}
      <div className="grid gap-4 xl:grid-cols-3">
        <ChartCard
          className="xl:col-span-2"
          title="Enquiries & applications over time"
          subtitle={`Daily counts for the last ${range} days`}
          action={
            <Link href="/admin/reports" className="text-xs font-bold text-royal hover:underline">
              Full report →
            </Link>
          }
          ariaLabel="Line and area chart of enquiries and applications per day"
        >
          <TrendChart data={trend} ariaLabel={`Enquiries and applications per day over the last ${range} days`} />
        </ChartCard>

        <ChartCard title="Conversion funnel" subtitle="From first contact to enrolment" ariaLabel="Enquiry to enrolment funnel">
          <FunnelList stages={funnel} />
        </ChartCard>
      </div>

      {/* charts row 2 */}
      <div className="grid gap-4 xl:grid-cols-3">
        <ChartCard title="Enquiries by programme" subtitle={`Top programmes in the last ${range} days`} ariaLabel="Bar chart of enquiries by programme">
          <CategoryBarChart data={byCourse} ariaLabel="Enquiries by programme" layout="vertical" />
        </ChartCard>

        <ChartCard title="Leads by source" subtitle="Where students come from" ariaLabel="Donut chart of leads by source">
          {bySource.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-body">No enquiries in this period.</p>
          ) : (
            <DonutChart data={bySource} ariaLabel="Leads by source donut chart" />
          )}
        </ChartCard>

        <ChartCard title="Application status" subtitle="Distribution across all applications" ariaLabel="Donut chart of application statuses">
          {appStatus.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-body">No applications yet.</p>
          ) : (
            <DonutChart data={appStatus} ariaLabel="Application status donut chart" />
          )}
        </ChartCard>
      </div>

      {/* counsellor performance + follow-ups */}
      <div className="grid gap-4 xl:grid-cols-3">
        <ChartCard
          className="xl:col-span-2"
          title="Counsellor performance"
          subtitle={`Assigned, contacted and converted in the last ${range} days`}
          ariaLabel="Bar chart of counsellor performance"
        >
          {counsellors.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-body">No enquiries assigned to counsellors in this period.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-slate-body">
                    <th className="pb-3 font-bold">Counsellor</th>
                    <th className="pb-3 text-right font-bold">Assigned</th>
                    <th className="pb-3 text-right font-bold">Contacted</th>
                    <th className="pb-3 text-right font-bold">Converted</th>
                    <th className="pb-3 font-bold">Contact rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {counsellors.map((row) => {
                    const rate = row.assigned ? Math.round((row.contacted / row.assigned) * 100) : 0;
                    return (
                      <tr key={row.name}>
                        <td className="py-2.5 font-semibold text-navy">{row.name}</td>
                        <td className="py-2.5 text-right tabular-nums text-slate-body">{row.assigned}</td>
                        <td className="py-2.5 text-right tabular-nums text-slate-body">{row.contacted}</td>
                        <td className="py-2.5 text-right tabular-nums font-bold text-success">{row.converted}</td>
                        <td className="py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-24 overflow-hidden rounded-full bg-offwhite">
                              <div className="h-full rounded-full bg-royal" style={{ width: `${rate}%` }} />
                            </div>
                            <span className="text-[11px] font-semibold text-slate-body">{rate}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Follow-up completion" subtitle="Task hygiene across the team" ariaLabel="Follow-up completion statistics">
          <div className="space-y-5">
            <div>
              <div className="mb-1.5 flex items-center justify-between text-[12.5px]">
                <span className="text-slate-body">Completion rate</span>
                <span className="font-bold text-navy">{followups.completed + followups.pending + followups.missed > 0 ? Math.round((followups.completed / Math.max(1, followups.completed + followups.pending + followups.missed)) * 100) : 0}%</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-offwhite">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-royal to-gold"
                  style={{
                    width: `${
                      followups.completed + followups.pending + followups.missed > 0
                        ? Math.round((followups.completed / Math.max(1, followups.completed + followups.pending + followups.missed)) * 100)
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-3">
              {[
                ["Pending", followups.pending, "text-navy"],
                ["Due today", followups.dueToday, "text-royal"],
                ["Overdue", followups.overdue, "text-danger"],
                ["Completed", followups.completed, "text-success"],
                ["Missed", followups.missed, "text-amber"],
              ].map(([label, value, tone]) => (
                <div key={String(label)} className="rounded-2xl border border-line bg-offwhite/60 p-3">
                  <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-body">{label}</dt>
                  <dd className={cn("font-display text-xl font-semibold", String(tone))}>{Number(value)}</dd>
                </div>
              ))}
            </dl>

            <Link href="/admin/enquiries?view=today" className="btn btn-outline btn-sm w-full">
              Open today&apos;s follow-ups
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </ChartCard>
      </div>

      {/* recent activity grid */}
      <div className="grid gap-4 xl:grid-cols-3">
        <RecentList
          title="Latest enquiries"
          href="/admin/references"
          items={records.enquiries.map((item) => ({
            id: item.id,
            href: `/admin/enquiries/${item.id}`,
            primary: item.name,
            secondary: item.course_interest || "No course specified",
            meta: `${item.ref} · ${relativeTime(item.created_at)}`,
            badge: item.status,
          }))}
          emptyText="No enquiries yet."
        />

        <RecentList
          title="Recent applications"
          href="/admin/admissions"
          items={records.applications.map((item) => ({
            id: item.id,
            href: `/admin/admissions/${item.id}`,
            primary: item.full_name,
            secondary: item.course_name,
            meta: `${item.ref} · ${formatDate(item.submitted_at)}`,
            badge: item.status,
          }))}
          emptyText="No applications yet."
        />

        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[15px] font-bold text-navy">Upcoming follow-ups</h3>
            <Link href="/admin/enquiries?view=today" className="text-xs font-bold text-royal hover:underline">
              View all →
            </Link>
          </div>
          {records.followups.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line-strong px-4 py-6 text-center text-sm text-slate-body">
              Nothing scheduled. Create a follow-up from any enquiry.
            </p>
          ) : (
            <ul className="space-y-3">
              {records.followups.map((task) => {
                const overdue = isBeforeNow(task.due_at);
                return (
                  <li key={task.id}>
                    <Link
                      href={`/admin/enquiries/${task.enquiry_id}`}
                      className="flex items-start gap-3 rounded-2xl border border-line bg-offwhite/50 p-3 transition hover:border-royal/40 hover:bg-paper"
                    >
                      <span className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", overdue ? "bg-danger" : "bg-royal")} aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-bold text-navy">{task.student}</span>
                        <span className="block truncate text-xs text-slate-body">{task.note}</span>
                        <span className={cn("mt-0.5 block text-[11px] font-semibold", overdue ? "text-danger" : "text-slate-body")}>
                          {formatDateTime(task.due_at)} · {task.counsellor ?? "Unassigned"}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* activity feed */}
      <ChartCard title="Recent administrative activity" subtitle="Every sensitive change is written to the audit log">
        {activity.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-body">No activity recorded yet.</p>
        ) : (
          <ol className="relative space-y-4 border-l border-line pl-5">
            {activity.map((item) => (
              <li key={item.id} className="relative">
                <span className="absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-paper bg-royal" aria-hidden />
                <p className="text-[13px] text-navy">
                  <span className="font-bold">{item.user_name ?? "System"}</span>{" "}
                  <span className="text-slate-body">{item.action.replace(/\./g, " ")}</span>
                  {item.detail ? <span className="text-slate-body"> — {item.detail}</span> : null}
                </p>
                <p className="text-[11px] text-slate-body">{relativeTime(item.created_at)}</p>
              </li>
            ))}
          </ol>
        )}
      </ChartCard>
    </div>
  );
}

function RecentList({
  title,
  href,
  items,
  emptyText,
}: {
  title: string;
  href: string;
  items: { id: number; href: string; primary: string; secondary: string; meta: string; badge: string }[];
  emptyText: string;
}) {
  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[15px] font-bold text-navy">{title}</h3>
        <Link href={href === "/admin/references" ? "/admin/enquiries" : href} className="text-xs font-bold text-royal hover:underline">
          View all →
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line-strong px-4 py-6 text-center text-sm text-slate-body">{emptyText}</p>
      ) : (
        <ul className="space-y-2.5">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="flex items-center gap-3 rounded-2xl border border-line bg-offwhite/50 p-3 transition hover:border-royal/40 hover:bg-paper"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-bold text-navy">{item.primary}</span>
                  <span className="block truncate text-xs text-slate-body">{item.secondary}</span>
                  <span className="block text-[11px] text-slate-body">{item.meta}</span>
                </span>
                <Badge tone={statusTone(item.badge)}>{item.badge.replace(/_/g, " ")}</Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
