import { Badge } from "@/components/ui/badge";

type IntegrationRow = {
  name: string;
  configured: boolean;
  detail: string;
  configuredLabel?: string;
  notConfiguredLabel?: string;
  href?: string;
};

/**
 * Honest integration status — every row reflects what is actually configured
 * in the environment and the stored settings. Nothing is claimed to work
 * unless both halves of the configuration are present.
 */
export function IntegrationStatusCard({ settings }: { settings: Record<string, string> }) {
  const hasEmailKey = Boolean(process.env.EMAIL_API_KEY || process.env.RESEND_API_KEY);
  const emailProvider = (settings.email_provider ?? "").trim();
  const emailConfigured = hasEmailKey && emailProvider !== "" && emailProvider !== "not_configured";

  const whatsappNumber = (settings.whatsapp_number ?? "").trim();
  const whatsappDigits = whatsappNumber.replace(/\D/g, "");
  const whatsappConfigured = whatsappDigits.length >= 10;

  const mapEmbed = (settings.map_embed ?? "").trim();
  const analyticsId = (settings.analytics_id ?? "").trim();

  const rows: IntegrationRow[] = [
    {
      name: "Transactional email",
      configured: emailConfigured,
      detail: emailConfigured
        ? `Provider “${emailProvider}” with an API key present in the environment.`
        : !hasEmailKey
          ? "No EMAIL_API_KEY or RESEND_API_KEY found in the environment, and the provider is not set."
          : "An API key exists, but the transactional email provider is still set to “not_configured”.",
      notConfiguredLabel: "Not configured",
    },
    {
      name: "WhatsApp chat",
      configured: whatsappConfigured,
      detail: whatsappConfigured
        ? `Floating chat button opens wa.me/${whatsappDigits}.`
        : "Set a WhatsApp number (e.g. 919876543210) in the contact group to enable the chat button.",
      href: whatsappConfigured ? `https://wa.me/${whatsappDigits}` : undefined,
    },
    {
      name: "Map embed",
      configured: Boolean(mapEmbed),
      detail: mapEmbed
        ? "A map embed URL is saved; the contact page renders it."
        : "No map embed URL saved — the contact page shows the stylised campus placeholder.",
    },
    {
      name: "Analytics",
      configured: Boolean(analyticsId),
      detail: analyticsId
        ? `Analytics ID “${analyticsId}” will be injected into the public site.`
        : "No analytics ID saved — no tracking script is injected.",
    },
    {
      name: "CSV export",
      configured: true,
      configuredLabel: "Available",
      detail: "Reports export as CSV from the reports hub (permission reports.export required).",
    },
    {
      name: "PDF export",
      configured: true,
      configuredLabel: "Available",
      detail: "Use Print → “Save as PDF” in the browser from any report page.",
    },
  ];

  return (
    <section className="card p-5 sm:p-6" aria-label="Integration status">
      <div className="mb-4">
        <h2 className="text-[15px] font-bold text-navy">Integration status</h2>
        <p className="mt-0.5 text-xs text-slate-body">
          Reported from the live environment and stored settings — nothing here is decorative.
        </p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {rows.map((row) => (
          <li key={row.name} className="rounded-2xl border border-line bg-offwhite/50 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-navy">{row.name}</p>
              <Badge tone={row.configured ? "success" : "warning"} dot>
                {row.configured ? (row.configuredLabel ?? "Connected") : (row.notConfiguredLabel ?? "Not configured")}
              </Badge>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-body">{row.detail}</p>
            {row.href ? (
              <a
                href={row.href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-xs font-bold text-royal hover:underline"
              >
                Open {row.href.replace("https://", "")} →
              </a>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
