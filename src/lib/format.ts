/** Presentation helpers shared by the public site and the admin panel. */

export function formatDate(value: string | null | undefined, fallback = "—"): string {
  if (!value) return fallback;
  const date = new Date(value.includes("T") ? value : value.replace(" ", "T") + "Z");
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(value: string | null | undefined, fallback = "—"): string {
  if (!value) return fallback;
  const date = new Date(value.includes("T") ? value : value.replace(" ", "T") + "Z");
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function relativeTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value.includes("T") ? value : value.replace(" ", "T") + "Z");
  if (Number.isNaN(date.getTime())) return "—";
  const diff = date.getTime() - Date.now();
  const abs = Math.abs(diff);
  const minutes = Math.round(abs / 60000);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (minutes < 60) return rtf.format(Math.round(diff / 60000), "minute");
  const hours = Math.round(abs / 3600000);
  if (hours < 24) return rtf.format(Math.round(diff / 3600000), "hour");
  const days = Math.round(abs / 86400000);
  if (days < 30) return rtf.format(Math.round(diff / 86400000), "day");
  const months = Math.round(abs / 2592000000);
  if (months < 12) return rtf.format(Math.round(diff / 2592000000), "month");
  return rtf.format(Math.round(diff / 31536000000), "year");
}

/**
 * True when the given timestamp is in the past.
 * Accepts both ISO strings and SQLite "YYYY-MM-DD HH:MM:SS" values.
 */
export function isBeforeNow(value: string | null | undefined): boolean {
  if (!value) return false;
  const date = new Date(value.includes("T") || value.includes("Z") ? value : value.replace(" ", "T") + "Z");
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() < Date.now();
}

export function formatCurrency(amount: number | null | undefined): string {
  if (!amount) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export type Tone = "neutral" | "info" | "success" | "warning" | "danger" | "gold";

const TONE_CLASSES: Record<Tone, string> = {
  neutral: "bg-[#eef1f7] text-[#4c5871] border-[#e0e5ef]",
  info: "bg-royal-100 text-royal-600 border-[#cddcf7]",
  success: "bg-success-100 text-success border-[#c3e6d8]",
  warning: "bg-amber-100 text-amber border-[#f2dfba]",
  danger: "bg-danger-100 text-danger border-[#f6cfcf]",
  gold: "bg-gold-100 text-gold-700 border-[#f0dfb9]",
};

export function toneClass(tone: Tone): string {
  return TONE_CLASSES[tone] ?? TONE_CLASSES.neutral;
}

export function statusTone(key: string): Tone {
  const value = key.toLowerCase();
  if (["converted", "enrolled", "approved", "verified", "completed", "published", "active"].includes(value))
    return "success";
  if (["rejected", "invalid_lead", "not_interested", "missed", "overdue", "documents_required"].includes(value))
    return "danger";
  if (["under_review", "contact_pending", "interview_scheduled", "waitlisted", "pending", "documents_required"].includes(value))
    return "warning";
  if (["new", "submitted", "draft"].includes(value)) return "info";
  if (["interested", "counselling_scheduled", "application_started", "application_submitted", "contacted"].includes(value))
    return "gold";
  return "neutral";
}

export function priorityTone(priority: string): Tone {
  switch (priority) {
    case "urgent":
      return "danger";
    case "high":
      return "warning";
    case "low":
      return "neutral";
    default:
      return "info";
  }
}

export function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (value: unknown) => {
    if (value === null || value === undefined) return "";
    const text = String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const lines = [headers.join(",")];
  for (const row of rows) lines.push(headers.map((key) => escape(row[key])).join(","));
  return lines.join("\n");
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 13 && digits.startsWith("091")) return digits.slice(3);
  return digits.slice(-10);
}

export function normalizeEmail(input: string): string {
  return input.trim().toLowerCase();
}
