import "server-only";
import { getSetting } from "./settings";

export type EmailResult = { sent: boolean; reason?: string };

export function emailConfigured(): boolean {
  const provider = getSetting("email_provider", "not_configured");
  const apiKey = process.env.EMAIL_API_KEY ?? process.env.RESEND_API_KEY ?? "";
  return provider !== "not_configured" && apiKey.length > 0;
}

/**
 * Sends a transactional email when — and only when — an email provider and API
 * key are configured through the environment. Never pretends to send mail.
 */
export async function sendEmail(options: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<EmailResult> {
  const provider = getSetting("email_provider", "not_configured");
  const apiKey = process.env.EMAIL_API_KEY ?? process.env.RESEND_API_KEY ?? "";

  if (provider === "not_configured" || !apiKey) {
    return { sent: false, reason: "Email provider not configured" };
  }
  if (!options.to) return { sent: false, reason: "Missing recipient" };

  try {
    if (provider === "resend") {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: getSetting("email_from"),
          to: [options.to],
          subject: options.subject,
          text: options.text,
          html: options.html,
        }),
      });
      if (!response.ok) return { sent: false, reason: `Provider responded ${response.status}` };
      return { sent: true };
    }
    return { sent: false, reason: `Unsupported provider "${provider}"` };
  } catch (error) {
    return { sent: false, reason: error instanceof Error ? error.message : "Send failed" };
  }
}
