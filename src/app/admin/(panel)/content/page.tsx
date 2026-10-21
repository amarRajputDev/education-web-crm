import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarDays,
  Download,
  HelpCircle,
  Images,
  Newspaper,
  Quote,
  Settings2,
  type LucideIcon,
} from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { PERMISSIONS, can } from "@/lib/rbac";
import { getDb } from "@/lib/db";
import { getSetting } from "@/lib/settings";
import { AdminCard, AdminPageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/ui/feedback";
import { BlockOverview, type BlockRow } from "@/components/admin/content-hub/block-overview";
import { HomepageSettingsForm } from "@/components/admin/content-hub/homepage-settings";
import { BLOCK_KEYS } from "@/components/admin/content-hub/block-defaults";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Website content",
  description:
    "Content hub for the public website: editable blocks, testimonials, FAQs, downloads and homepage settings.",
};

const HOMEPAGE_SETTINGS_KEYS = [
  "announcement_enabled",
  "announcement_text",
  "application_window",
  "hero_eyebrow",
  "hero_title",
  "hero_text",
  "hero_image",
  "stat_programs",
  "stat_faculty",
  "stat_students",
  "stat_partners",
] as const;

const QUICK_LINKS: { label: string; href: string; icon: LucideIcon; description: string }[] = [
  { label: "News & notices", href: "/admin/news", icon: Newspaper, description: "Notices, achievements, announcements" },
  { label: "Events", href: "/admin/events", icon: CalendarDays, description: "Workshops, seminars, campus dates" },
  { label: "Gallery", href: "/admin/gallery", icon: Images, description: "Photos and captions on the public site" },
  { label: "Testimonials", href: "/admin/testimonials", icon: Quote, description: "Student and parent quotes" },
  { label: "FAQs", href: "/admin/faqs", icon: HelpCircle, description: "Grouped, reorderable questions" },
  { label: "Downloads", href: "/admin/downloads", icon: Download, description: "Prospectus, fees, checklists" },
  { label: "Site settings", href: "/admin/settings", icon: Settings2, description: "Brand, contact, integrations" },
];

export default async function ContentHubPage() {
  const ctx = await requireAuth(PERMISSIONS.CONTENT_MANAGE);
  const canSettings = can(ctx.user.role_key, PERMISSIONS.SETTINGS_MANAGE);
  const db = getDb();

  const blockRows = db
    .prepare(
      `SELECT block_key, title, body, image, meta, status, updated_at
         FROM content_blocks
        ORDER BY CASE block_key
          WHEN 'director_message' THEN 1
          WHEN 'about_overview' THEN 2
          WHEN 'why_choose' THEN 3
          WHEN 'mission_vision' THEN 4
          WHEN 'placements' THEN 5
          ELSE 6 END`,
    )
    .all() as BlockRow[];

  const counts = db
    .prepare(
      `SELECT (SELECT COUNT(*) FROM content_blocks) AS blocks,
              (SELECT COUNT(*) FROM testimonials) AS testimonials,
              (SELECT COUNT(*) FROM faqs) AS faqs,
              (SELECT COUNT(*) FROM downloads) AS downloads`,
    )
    .get() as { blocks: number; testimonials: number; faqs: number; downloads: number };

  const values: Record<string, string> = {};
  if (canSettings) {
    for (const key of HOMEPAGE_SETTINGS_KEYS) values[key] = getSetting(key);
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Website content"
        description="Edit the reusable blocks, collections and homepage settings that power the public website. Every change is audited and refreshes the live site."
        meta={[
          { label: "Blocks", value: `${counts.blocks}/${BLOCK_KEYS.length}` },
          { label: "Testimonials", value: counts.testimonials },
          { label: "FAQs", value: counts.faqs },
          { label: "Downloads", value: counts.downloads },
        ]}
      />

      <AdminCard
        title="Content blocks"
        description={`Editable keys: ${BLOCK_KEYS.join(" · ")}`}
      >
        <BlockOverview rows={blockRows} />
      </AdminCard>

      <AdminCard title="Quick links" description="Everything else that makes up the public website.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="group flex min-w-0 items-start gap-3 rounded-2xl border border-line bg-offwhite/50 p-4 transition hover:border-royal/50 hover:bg-paper"
              >
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-royal-100 text-royal transition group-hover:bg-royal group-hover:text-white">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-navy">{link.label}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-slate-body">{link.description}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </AdminCard>

      <AdminCard
        title="Homepage & announcement"
        description="The most-used site settings: announcement strip, hero copy and the four homepage statistics."
      >
        {canSettings ? (
          <HomepageSettingsForm values={values} />
        ) : (
          <EmptyState
            compact
            icon="document"
            title="Settings permission required"
            description="Editing homepage and announcement settings needs the Settings permission. Ask a Super Admin, or open the settings page if you already have it."
            action={
              <Link href="/admin/settings" className="btn btn-outline btn-sm">
                <Settings2 className="h-4 w-4" aria-hidden />
                Open site settings
              </Link>
            }
          />
        )}
      </AdminCard>
    </div>
  );
}
