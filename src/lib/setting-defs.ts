/**
 * Static definitions for every editable site setting.
 *
 * Kept in its own module so the database seed can read them without importing
 * the database layer (which would create an import cycle).
 */

export type SettingType =
  | "text"
  | "textarea"
  | "number"
  | "boolean"
  | "url"
  | "tel"
  | "email"
  | "json";

export const SETTING_DEFINITIONS: Record<
  string,
  { value: string; group: string; label: string; type: SettingType; help?: string }
> = {
  institute_name: {
    value: "Aarohan Institute of Higher Education",
    group: "brand",
    label: "Institute name",
    type: "text",
  },
  tagline: {
    value: "Discover Your Potential. Build Your Future.",
    group: "brand",
    label: "Tagline",
    type: "text",
  },
  short_name: { value: "Aarohan Institute", group: "brand", label: "Short name", type: "text" },
  logo_text: { value: "AIHE", group: "brand", label: "Logo monogram", type: "text" },
  site_url: {
    value: "http://localhost:3000",
    group: "brand",
    label: "Site URL (canonical)",
    type: "url",
    help: "Used for canonical URLs, sitemap and social sharing metadata.",
  },
  admission_helpline: { value: "+91 98200 41127", group: "contact", label: "Admission helpline", type: "tel" },
  admission_email: {
    value: "admissions@aarohan-institute.edu",
    group: "contact",
    label: "Admission email",
    type: "email",
  },
  general_email: { value: "info@aarohan-institute.edu", group: "contact", label: "General email", type: "email" },
  address: {
    value: "Survey No. 142, Knowledge Park III, Greater Noida, Uttar Pradesh 201310, India",
    group: "contact",
    label: "Campus address",
    type: "textarea",
  },
  office_hours: {
    value: "Monday – Saturday, 9:00 AM – 6:00 PM (Admissions desk closes at 5:30 PM)",
    group: "contact",
    label: "Office hours",
    type: "text",
  },
  map_embed: {
    value: "",
    group: "contact",
    label: "Map embed URL",
    type: "url",
    help: "Optional. Leave empty to show a stylised campus map placeholder.",
  },
  whatsapp_number: {
    value: "",
    group: "contact",
    label: "WhatsApp number",
    type: "tel",
    help: "Format: 919876543210. Leave empty to hide the floating WhatsApp button.",
  },
  announcement_enabled: { value: "true", group: "home", label: "Show announcement strip", type: "boolean" },
  announcement_text: {
    value: "Admissions Open for the 2027–28 Academic Session",
    group: "home",
    label: "Announcement text",
    type: "text",
  },
  announcement_link: { value: "/admissions", group: "home", label: "Announcement link", type: "text" },
  application_window: {
    value: "Application window: 1 January 2027 – 31 July 2027",
    group: "home",
    label: "Application window note",
    type: "text",
  },
  hero_eyebrow: { value: "Shape Your Future With Us", group: "home", label: "Hero eyebrow", type: "text" },
  hero_title: {
    value: "Your Ambition Deserves a Great Beginning.",
    group: "home",
    label: "Hero headline",
    type: "text",
  },
  hero_text: {
    value:
      "Industry-aligned programmes, experienced faculty and hands-on learning — designed to turn your potential into a career you are proud of.",
    group: "home",
    label: "Hero supporting text",
    type: "textarea",
  },
  hero_image: { value: "/images/hero-campus.jpg", group: "home", label: "Hero image", type: "text" },
  stat_programs: { value: "42", group: "home", label: "Statistic: academic programmes", type: "number" },
  stat_faculty: { value: "180+", group: "home", label: "Statistic: experienced faculty", type: "number" },
  stat_students: { value: "6,500+", group: "home", label: "Statistic: student community", type: "number" },
  stat_partners: { value: "75+", group: "home", label: "Statistic: industry collaborations", type: "number" },
  email_provider: {
    value: "not_configured",
    group: "integrations",
    label: "Transactional email provider",
    type: "text",
    help: "Set to 'resend', 'sendgrid' or 'smtp' only after configuring API keys in the environment.",
  },
  email_from: {
    value: "admissions@aarohan-institute.edu",
    group: "integrations",
    label: "From address",
    type: "email",
  },
  analytics_id: { value: "", group: "integrations", label: "Analytics ID", type: "text" },
  retention_days: {
    value: "730",
    group: "privacy",
    label: "Record retention (days)",
    type: "number",
    help: "Applies to enquiry and application records flagged for scheduled clean-up.",
  },
  footer_note: {
    value: "Demo content — all institutes, people, programmes and statistics shown here are fictional samples.",
    group: "brand",
    label: "Footer disclaimer",
    type: "textarea",
  },
};

