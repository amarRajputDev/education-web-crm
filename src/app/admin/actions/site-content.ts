"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertPermission } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { getDb } from "@/lib/db";
import { PERMISSIONS } from "@/lib/rbac";
import { SETTING_DEFINITIONS, setManySettings } from "@/lib/settings";
import { fieldErrors } from "@/lib/validation";
import { BLOCK_KEYS } from "@/components/admin/content-hub/block-defaults";

export type ContentActionState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string>;
};

const testimonialSchema = z.object({
  id: z.coerce.number().int().min(1).optional(),
  name: z.string().trim().min(2, "Name is required").max(120, "Keep the name under 120 characters"),
  role: z.string().trim().max(160, "Keep the role under 160 characters"),
  program: z.string().trim().max(120, "Keep the programme under 120 characters"),
  gradYear: z.string().trim().max(12, "Enter a four digit year"),
  quote: z.string().trim().min(10, "Quote must be at least 10 characters").max(800, "Keep the quote under 800 characters"),
  photo: z.string().trim().max(300, "Image path is too long"),
  isDemo: z.boolean(),
  status: z.enum(["published", "draft"]),
});

const faqSchema = z.object({
  id: z.coerce.number().int().min(1).optional(),
  category: z.string().trim().min(1, "Category is required").max(60, "Keep the category under 60 characters"),
  question: z.string().trim().min(5, "Question must be at least 5 characters").max(300, "Keep the question under 300 characters"),
  answer: z.string().trim().min(5, "Answer must be at least 5 characters").max(4000, "Keep the answer under 4000 characters"),
  sortOrder: z.coerce.number().int().min(0, "Order cannot be negative").max(9999, "Order must be 9999 or less"),
  status: z.enum(["published", "draft"]),
});

const downloadSchema = z.object({
  id: z.coerce.number().int().min(1).optional(),
  title: z.string().trim().min(3, "Title is required").max(160, "Keep the title under 160 characters"),
  category: z.string().trim().min(1, "Category is required").max(60, "Keep the category under 60 characters"),
  description: z.string().trim().max(500, "Keep the description under 500 characters"),
  filePath: z.string().trim().max(300, "File path is too long"),
  externalUrl: z.string().trim().max(400, "Link is too long"),
  status: z.enum(["published", "draft"]),
});

/** Every mutation clears the content hub, the public site and its layout cache. */
function revalidateContent(adminPath?: string): void {
  revalidatePath("/admin/content");
  if (adminPath && adminPath !== "/admin/content") revalidatePath(adminPath);
  revalidatePath("/");
  revalidatePath("/", "layout");
}

function numericId(formData: FormData, name = "id"): number | undefined {
  const raw = String(formData.get(name) ?? "").trim();
  if (!raw) return undefined;
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? value : undefined;
}

/* ------------------------------------------------------------------ */
/* content blocks                                                      */
/* ------------------------------------------------------------------ */

export async function saveBlock(
  _prev: ContentActionState,
  formData: FormData,
): Promise<ContentActionState> {
  const ctx = await assertPermission(PERMISSIONS.CONTENT_MANAGE);
  const errors: Record<string, string> = {};

  const blockKey = String(formData.get("blockKey") ?? "");
  if (!BLOCK_KEYS.includes(blockKey as (typeof BLOCK_KEYS)[number])) {
    errors.blockKey = "Unknown content block key.";
  }

  const title = String(formData.get("title") ?? "").trim();
  if (title.length === 0) errors.title = "Add a heading for this block.";
  else if (title.length > 180) errors.title = "Keep the heading under 180 characters.";

  const body = String(formData.get("body") ?? "");
  if (body.length > 20000) errors.body = "Body is too long (limit 20,000 characters).";

  const image = String(formData.get("image") ?? "").trim();
  if (image.length > 300) errors.image = "Image path is too long (limit 300 characters).";

  const metaRaw = String(formData.get("metaJson") ?? "").trim();
  let metaText = "{}";
  if (metaRaw.length === 0) {
    errors.metaJson = "Must be valid JSON";
  } else {
    try {
      const parsed: unknown = JSON.parse(metaRaw);
      if (parsed === null || typeof parsed !== "object") {
        errors.metaJson = "Must be valid JSON (an object or array).";
      } else {
        metaText = JSON.stringify(parsed);
      }
    } catch {
      errors.metaJson = "Must be valid JSON";
    }
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, message: "Some fields need attention.", errors };
  }

  const db = getDb();
  const existing = db
    .prepare(`SELECT block_key FROM content_blocks WHERE block_key = ?`)
    .get(blockKey) as { block_key: string } | undefined;

  if (existing) {
    db.prepare(
      `UPDATE content_blocks
          SET title = ?, body = ?, image = ?, meta = ?, updated_by = ?, updated_at = datetime('now')
        WHERE block_key = ?`,
    ).run(title, body, image, metaText, ctx.user.id, blockKey);
  } else {
    db.prepare(
      `INSERT INTO content_blocks (block_key, title, body, image, meta, status, updated_by, updated_at)
       VALUES (?, ?, ?, ?, ?, 'published', ?, datetime('now'))`,
    ).run(blockKey, title, body, image, metaText, ctx.user.id);
  }

  logAudit({
    userId: ctx.user.id,
    action: "content.block.save",
    entity: "content_block",
    entityId: blockKey,
    detail: title,
  });
  revalidateContent();
  return { ok: true, message: `Saved "${title}".` };
}

/* ------------------------------------------------------------------ */
/* testimonials                                                         */
/* ------------------------------------------------------------------ */

export async function saveTestimonial(
  _prev: ContentActionState,
  formData: FormData,
): Promise<ContentActionState> {
  const ctx = await assertPermission(PERMISSIONS.CONTENT_MANAGE);
  const parsed = testimonialSchema.safeParse({
    id: numericId(formData),
    name: String(formData.get("name") ?? ""),
    role: String(formData.get("role") ?? ""),
    program: String(formData.get("program") ?? ""),
    gradYear: String(formData.get("gradYear") ?? ""),
    quote: String(formData.get("quote") ?? ""),
    photo: String(formData.get("photo") ?? ""),
    isDemo: formData.get("isDemo") !== null,
    status: String(formData.get("status") || "published"),
  });

  if (!parsed.success) {
    return { ok: false, message: "Some fields need attention.", errors: fieldErrors(parsed.error) };
  }

  const data = parsed.data;
  const db = getDb();
  let entityId = data.id ?? 0;

  if (data.id) {
    const info = db
      .prepare(
        `UPDATE testimonials
            SET name = ?, role = ?, program = ?, grad_year = ?, quote = ?, photo = ?, is_demo = ?, status = ?
          WHERE id = ?`,
      )
      .run(
        data.name,
        data.role,
        data.program,
        data.gradYear,
        data.quote,
        data.photo,
        data.isDemo ? 1 : 0,
        data.status,
        data.id,
      );
    if (info.changes === 0) {
      return { ok: false, message: "That testimonial no longer exists.", errors: { _form: "Record not found." } };
    }
  } else {
    const max = db.prepare(`SELECT COALESCE(MAX(sort_order), 0) AS m FROM testimonials`).get() as { m: number };
    const info = db
      .prepare(
        `INSERT INTO testimonials (name, role, program, grad_year, quote, photo, rating, is_demo, status, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, 5, ?, ?, ?)`,
      )
      .run(
        data.name,
        data.role,
        data.program,
        data.gradYear,
        data.quote,
        data.photo,
        data.isDemo ? 1 : 0,
        data.status,
        max.m + 1,
      );
    entityId = Number(info.lastInsertRowid);
  }

  logAudit({
    userId: ctx.user.id,
    action: data.id ? "content.testimonial.update" : "content.testimonial.create",
    entity: "testimonial",
    entityId,
    detail: data.name,
  });
  revalidateContent("/admin/testimonials");
  return {
    ok: true,
    message: data.id ? `Updated the testimonial for ${data.name}.` : `Added the testimonial for ${data.name}.`,
  };
}

export async function deleteTestimonial(id: number): Promise<ContentActionState> {
  const ctx = await assertPermission(PERMISSIONS.CONTENT_MANAGE);
  const db = getDb();
  const row = db.prepare(`SELECT id, name FROM testimonials WHERE id = ?`).get(id) as
    | { id: number; name: string }
    | undefined;
  if (!row) return { ok: false, message: "That testimonial no longer exists." };

  db.prepare(`DELETE FROM testimonials WHERE id = ?`).run(id);
  logAudit({
    userId: ctx.user.id,
    action: "content.testimonial.delete",
    entity: "testimonial",
    entityId: row.id,
    detail: row.name,
  });
  revalidateContent("/admin/testimonials");
  return { ok: true, message: `Deleted the testimonial for ${row.name}.` };
}

export async function toggleTestimonialStatus(id: number): Promise<ContentActionState> {
  const ctx = await assertPermission(PERMISSIONS.CONTENT_MANAGE);
  const db = getDb();
  const row = db.prepare(`SELECT id, name, status FROM testimonials WHERE id = ?`).get(id) as
    | { id: number; name: string; status: string }
    | undefined;
  if (!row) return { ok: false, message: "That testimonial no longer exists." };

  const next = row.status === "published" ? "draft" : "published";
  db.prepare(`UPDATE testimonials SET status = ? WHERE id = ?`).run(next, row.id);
  logAudit({
    userId: ctx.user.id,
    action: "content.testimonial.status",
    entity: "testimonial",
    entityId: row.id,
    detail: `${row.name} → ${next}`,
  });
  revalidateContent("/admin/testimonials");
  return { ok: true, message: `${row.name}'s testimonial is now ${next}.` };
}

/* ------------------------------------------------------------------ */
/* FAQs                                                                 */
/* ------------------------------------------------------------------ */

export async function saveFaq(_prev: ContentActionState, formData: FormData): Promise<ContentActionState> {
  const ctx = await assertPermission(PERMISSIONS.CONTENT_MANAGE);
  const parsed = faqSchema.safeParse({
    id: numericId(formData),
    category: String(formData.get("category") ?? ""),
    question: String(formData.get("question") ?? ""),
    answer: String(formData.get("answer") ?? ""),
    sortOrder: String(formData.get("sortOrder") ?? "0"),
    status: String(formData.get("status") || "published"),
  });

  if (!parsed.success) {
    return { ok: false, message: "Some fields need attention.", errors: fieldErrors(parsed.error) };
  }

  const data = parsed.data;
  const db = getDb();
  let entityId = data.id ?? 0;

  if (data.id) {
    const info = db
      .prepare(
        `UPDATE faqs SET category = ?, question = ?, answer = ?, sort_order = ?, status = ? WHERE id = ?`,
      )
      .run(data.category, data.question, data.answer, data.sortOrder, data.status, data.id);
    if (info.changes === 0) {
      return { ok: false, message: "That question no longer exists.", errors: { _form: "Record not found." } };
    }
  } else {
    const info = db
      .prepare(
        `INSERT INTO faqs (category, question, answer, sort_order, status) VALUES (?, ?, ?, ?, ?)`,
      )
      .run(data.category, data.question, data.answer, data.sortOrder, data.status);
    entityId = Number(info.lastInsertRowid);
  }

  logAudit({
    userId: ctx.user.id,
    action: data.id ? "content.faq.update" : "content.faq.create",
    entity: "faq",
    entityId,
    detail: data.question,
  });
  revalidateContent("/admin/faqs");
  return { ok: true, message: data.id ? "Question updated." : "Question added." };
}

export async function deleteFaq(id: number): Promise<ContentActionState> {
  const ctx = await assertPermission(PERMISSIONS.CONTENT_MANAGE);
  const db = getDb();
  const row = db.prepare(`SELECT id, question FROM faqs WHERE id = ?`).get(id) as
    | { id: number; question: string }
    | undefined;
  if (!row) return { ok: false, message: "That question no longer exists." };

  db.prepare(`DELETE FROM faqs WHERE id = ?`).run(id);
  logAudit({
    userId: ctx.user.id,
    action: "content.faq.delete",
    entity: "faq",
    entityId: row.id,
    detail: row.question,
  });
  revalidateContent("/admin/faqs");
  return { ok: true, message: "Question deleted." };
}

export async function toggleFaqStatus(id: number): Promise<ContentActionState> {
  const ctx = await assertPermission(PERMISSIONS.CONTENT_MANAGE);
  const db = getDb();
  const row = db.prepare(`SELECT id, question, status FROM faqs WHERE id = ?`).get(id) as
    | { id: number; question: string; status: string }
    | undefined;
  if (!row) return { ok: false, message: "That question no longer exists." };

  const next = row.status === "published" ? "draft" : "published";
  db.prepare(`UPDATE faqs SET status = ? WHERE id = ?`).run(next, row.id);
  logAudit({
    userId: ctx.user.id,
    action: "content.faq.status",
    entity: "faq",
    entityId: row.id,
    detail: `${next} — ${row.question}`,
  });
  revalidateContent("/admin/faqs");
  return { ok: true, message: `Question is now ${next}.` };
}

export async function reorderFaq(id: number, direction: "up" | "down"): Promise<ContentActionState> {
  const ctx = await assertPermission(PERMISSIONS.CONTENT_MANAGE);
  if (direction !== "up" && direction !== "down") {
    return { ok: false, message: "Unknown reorder direction." };
  }

  const db = getDb();
  const row = db.prepare(`SELECT id, category, question, sort_order FROM faqs WHERE id = ?`).get(id) as
    | { id: number; category: string; question: string; sort_order: number }
    | undefined;
  if (!row) return { ok: false, message: "That question no longer exists." };

  const neighbour =
    direction === "up"
      ? (db
          .prepare(
            `SELECT id, sort_order FROM faqs
              WHERE category = ? AND (sort_order < ? OR (sort_order = ? AND id < ?))
              ORDER BY sort_order DESC, id DESC LIMIT 1`,
          )
          .get(row.category, row.sort_order, row.sort_order, row.id) as
          | { id: number; sort_order: number }
          | undefined)
      : (db
          .prepare(
            `SELECT id, sort_order FROM faqs
              WHERE category = ? AND (sort_order > ? OR (sort_order = ? AND id > ?))
              ORDER BY sort_order ASC, id ASC LIMIT 1`,
          )
          .get(row.category, row.sort_order, row.sort_order, row.id) as
          | { id: number; sort_order: number }
          | undefined);

  if (!neighbour) {
    return {
      ok: false,
      message: direction === "up" ? "Already first in this category." : "Already last in this category.",
    };
  }

  const swap = db.transaction(() => {
    db.prepare(`UPDATE faqs SET sort_order = ? WHERE id = ?`).run(neighbour.sort_order, row.id);
    db.prepare(`UPDATE faqs SET sort_order = ? WHERE id = ?`).run(row.sort_order, neighbour.id);
  });
  swap();

  logAudit({
    userId: ctx.user.id,
    action: "content.faq.reorder",
    entity: "faq",
    entityId: row.id,
    detail: `${row.question} moved ${direction}`,
  });
  revalidateContent("/admin/faqs");
  return { ok: true, message: `Moved "${row.question}" ${direction}.` };
}

/* ------------------------------------------------------------------ */
/* downloads                                                            */
/* ------------------------------------------------------------------ */

export async function saveDownload(
  _prev: ContentActionState,
  formData: FormData,
): Promise<ContentActionState> {
  const ctx = await assertPermission(PERMISSIONS.CONTENT_MANAGE);
  const parsed = downloadSchema.safeParse({
    id: numericId(formData),
    title: String(formData.get("title") ?? ""),
    category: String(formData.get("category") ?? ""),
    description: String(formData.get("description") ?? ""),
    filePath: String(formData.get("filePath") ?? ""),
    externalUrl: String(formData.get("externalUrl") ?? ""),
    status: String(formData.get("status") || "published"),
  });

  if (!parsed.success) {
    return { ok: false, message: "Some fields need attention.", errors: fieldErrors(parsed.error) };
  }

  const data = parsed.data;
  const errors: Record<string, string> = {};
  if (!data.filePath && !data.externalUrl) {
    errors.filePath = "Add a file path under /documents or an external link.";
  }
  if (data.externalUrl && !/^https?:\/\/\S+$/i.test(data.externalUrl)) {
    errors.externalUrl = "External link must start with http:// or https://.";
  }
  if (Object.keys(errors).length > 0) {
    return { ok: false, message: "Some fields need attention.", errors };
  }

  const db = getDb();
  let entityId = data.id ?? 0;

  if (data.id) {
    const info = db
      .prepare(
        `UPDATE downloads
            SET title = ?, category = ?, description = ?, file_path = ?, external_url = ?, status = ?
          WHERE id = ?`,
      )
      .run(data.title, data.category, data.description, data.filePath, data.externalUrl, data.status, data.id);
    if (info.changes === 0) {
      return { ok: false, message: "That document no longer exists.", errors: { _form: "Record not found." } };
    }
  } else {
    const info = db
      .prepare(
        `INSERT INTO downloads (title, category, description, file_path, external_url, status)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(data.title, data.category, data.description, data.filePath, data.externalUrl, data.status);
    entityId = Number(info.lastInsertRowid);
  }

  logAudit({
    userId: ctx.user.id,
    action: data.id ? "content.download.update" : "content.download.create",
    entity: "download",
    entityId,
    detail: data.title,
  });
  revalidateContent("/admin/downloads");
  return { ok: true, message: data.id ? `Updated "${data.title}".` : `Added "${data.title}".` };
}

export async function deleteDownload(id: number): Promise<ContentActionState> {
  const ctx = await assertPermission(PERMISSIONS.CONTENT_MANAGE);
  const db = getDb();
  const row = db.prepare(`SELECT id, title FROM downloads WHERE id = ?`).get(id) as
    | { id: number; title: string }
    | undefined;
  if (!row) return { ok: false, message: "That document no longer exists." };

  db.prepare(`DELETE FROM downloads WHERE id = ?`).run(id);
  logAudit({
    userId: ctx.user.id,
    action: "content.download.delete",
    entity: "download",
    entityId: row.id,
    detail: row.title,
  });
  revalidateContent("/admin/downloads");
  return { ok: true, message: `Deleted "${row.title}".` };
}

/* ------------------------------------------------------------------ */
/* site settings                                                        */
/* ------------------------------------------------------------------ */

/**
 * Saves many site settings in one submit.
 *
 * Format: the form posts repeating `key` and `value` inputs in DOM order.
 * `formData.getAll("key")` and `formData.getAll("value")` are zipped
 * index-by-index, so every control renders a hidden `key` input immediately
 * before its value input. Boolean settings mirror their checkbox into a hidden
 * `value` input (the checkbox itself carries no `name`), so an unticked box
 * still submits "false".
 *
 * Booleans are normalised to "true"/"false" and `type: "number"` settings are
 * validated numerically (digits, commas and a trailing "+" are accepted so the
 * seeded display values such as "6,500+" remain valid). Invalid values return
 * `errors` keyed by the setting key itself.
 */
export async function saveSettings(
  _prev: ContentActionState,
  formData: FormData,
): Promise<ContentActionState> {
  const ctx = await assertPermission(PERMISSIONS.SETTINGS_MANAGE);

  const keys = formData.getAll("key").map((value) => String(value));
  const values = formData.getAll("value").map((value) => String(value));

  if (keys.length === 0 || keys.length !== values.length) {
    return {
      ok: false,
      message: "Nothing to save.",
      errors: { _form: "No settings were submitted. Please reload the page and try again." },
    };
  }

  const entries: Record<string, string> = {};
  const errors: Record<string, string> = {};

  for (let index = 0; index < keys.length; index += 1) {
    const key = keys[index];
    const definition = SETTING_DEFINITIONS[key];
    if (!definition) continue;
    const raw = values[index].trim();

    if (definition.type === "boolean") {
      entries[key] = raw === "true" || raw === "on" || raw === "1" ? "true" : "false";
    } else if (definition.type === "number") {
      if (raw.length === 0 || !/^\d[\d,\s]*\+?$/.test(raw)) {
        errors[key] = `${definition.label} must be a number (commas and a trailing "+" are allowed).`;
      } else {
        entries[key] = raw;
      }
    } else {
      entries[key] = raw;
    }
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, message: "Some values are invalid.", errors };
  }

  const updated = Object.keys(entries);
  if (updated.length === 0) {
    return {
      ok: false,
      message: "Nothing to save.",
      errors: { _form: "No known settings were submitted." },
    };
  }

  setManySettings(entries);
  logAudit({
    userId: ctx.user.id,
    action: "settings.update",
    entity: "site_settings",
    entityId: updated[0],
    detail: `Updated ${updated.length} setting${updated.length === 1 ? "" : "s"}: ${updated.join(", ")}`,
  });
  revalidateContent("/admin/settings");
  return { ok: true, message: `Saved ${updated.length} setting${updated.length === 1 ? "" : "s"}.` };
}
