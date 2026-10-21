import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/rbac";
import { getAllSettings, SETTING_DEFINITIONS, type SettingType } from "@/lib/settings";
import { AdminCard, AdminPageHeader } from "@/components/admin/page-header";
import {
  SettingsGroupForm,
  type SettingsField,
  type SettingsGroup,
} from "@/components/admin/settings/settings-form";
import { IntegrationStatusCard } from "@/components/admin/settings/integration-status";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Settings · Admin",
  robots: { index: false, follow: false },
};

const GROUP_ORDER = ["brand", "contact", "home", "integrations", "privacy"] as const;

const GROUP_META: Record<string, { label: string; description: string }> = {
  brand: {
    label: "Brand & identity",
    description: "Institute name, tagline and the canonical URL used across the public site.",
  },
  contact: {
    label: "Contact details",
    description: "Phone numbers, email addresses, address, map and WhatsApp chat settings.",
  },
  home: {
    label: "Homepage",
    description: "Announcement strip, hero content and the statistics shown on the landing page.",
  },
  integrations: {
    label: "Integrations",
    description: "Transactional email provider and analytics. Keys live in the environment, not here.",
  },
  privacy: {
    label: "Privacy & retention",
    description: "How long enquiry and application records are kept before scheduled clean-up.",
  },
};

function buildGroups(): SettingsGroup[] {
  const settings = getAllSettings();
  const buckets = new Map<string, SettingsField[]>();

  for (const [key, definition] of Object.entries(SETTING_DEFINITIONS)) {
    const field: SettingsField = {
      key,
      label: definition.label,
      type: definition.type as SettingType,
      help: definition.help,
      value: settings[key] ?? definition.value,
    };
    const list = buckets.get(definition.group) ?? [];
    list.push(field);
    buckets.set(definition.group, list);
  }

  const ordered = [...GROUP_ORDER, ...[...buckets.keys()].filter((key) => !GROUP_ORDER.includes(key as (typeof GROUP_ORDER)[number]))];

  return ordered
    .filter((key) => buckets.has(key))
    .map((key) => ({
      key,
      label: GROUP_META[key]?.label ?? key.charAt(0).toUpperCase() + key.slice(1),
      description: GROUP_META[key]?.description ?? "",
      fields: buckets.get(key) ?? [],
    }));
}

export default async function SettingsPage() {
  const ctx = await requireAuth(PERMISSIONS.SETTINGS_MANAGE);
  const groups = buildGroups();
  const settings = getAllSettings();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Site settings"
        description="Configuration for the public website. Every group saves independently and changes take effect immediately."
        meta={[
          { label: "Groups", value: groups.length },
          { label: "Settings", value: groups.reduce((total, group) => total + group.fields.length, 0) },
          { label: "Signed in as", value: ctx.user.role_name },
        ]}
      />

      {groups.map((group) => (
        <AdminCard key={group.key} title={group.label} description={group.description}>
          <SettingsGroupForm group={group} />
        </AdminCard>
      ))}

      <IntegrationStatusCard settings={settings} />
    </div>
  );
}
