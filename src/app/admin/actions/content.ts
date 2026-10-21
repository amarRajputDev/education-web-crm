"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logAudit } from "@/lib/audit";
import { assertPermission } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { slugify } from "@/lib/format";
import { PERMISSIONS } from "@/lib/rbac";
import { adminEventSchema, adminNewsSchema, fieldErrors } from "@/lib/validation";

export type ContentActionResult = {
  ok: boolean;
  message: string;
  errors?: Record<string, string>;
};

/** No shared zod schema exists for gallery items, so it lives here. */
const adminGalleryItemSchema = z.object({
  title: z.string().trim().min(2, "Title is required").max(120),
  category: z.enum(["Campus", "Laboratory", "Library", "Sports", "Cultural", "Events"]),
  image: z.string().trim().min(1, "Pick an image path").max(300),
  alt: z.string().trim().max(180).optional().default(""),
  caption: z.string().trim().max(300).optional().default(""),
  sortOrder: z.coerce.number({ message: "Sort order must be a number" }).min(0).max(9999),
  status: z.enum(["published", "draft"]),
});

const SLUG_TABLES = { news: "news_posts", events: "events" } as const;

/** Slugifies `title` and appends -2, -3… until the slug is free. */
function uniqueSlug(section: keyof typeof SLUG_TABLES, title: string, excludeId?: number): string {
  const db = getDb();
  const base = slugify(title) || "item";
  let candidate = base;
  let suffix = 1;
  for (;;) {
    const row = excludeId
      ? db.prepare(`SELECT id FROM ${SLUG_TABLES[section]} WHERE slug = ? AND id != ?`).get(candidate, excludeId)
      : db.prepare(`SELECT id FROM ${SLUG_TABLES[section]} WHERE slug = ?`).get(candidate);
    if (!row) return candidate;
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
}

function revalidateContent(section: "news" | "events" | "gallery"): void {
  revalidatePath(`/admin/${section}`);
  revalidatePath("/");
}

type NewsRow = {
  id: number;
  title: string;
  status: string;
  published_at: string | null;
};

type EventRow = {
  id: number;
  title: string;
  status: string;
  starts_at: string;
  ends_at: string | null;
};

/* ------------------------------------------------------------------ news */

export async function saveNews(
  _prev: ContentActionResult,
  formData: FormData,
): Promise<ContentActionResult> {
  const ctx = await assertPermission(PERMISSIONS.CONTENT_MANAGE);
  const id = Number(formData.get("id")) || 0;

  const parsed = adminNewsSchema.safeParse({
    title: String(formData.get("title") ?? ""),
    category: String(formData.get("category") ?? ""),
    excerpt: String(formData.get("excerpt") ?? ""),
    body: String(formData.get("body") ?? ""),
    coverImage: String(formData.get("coverImage") ?? ""),
    author: String(formData.get("author") ?? ""),
    status: String(formData.get("status") ?? ""),
  });
  if (!parsed.success) {
    return { ok: false, message: "Please fix the highlighted fields.", errors: fieldErrors(parsed.error) };
  }

  const data = parsed.data;
  const db = getDb();
  const now = new Date().toISOString();
  const coverImage = data.coverImage || "/images/news-1.jpg";
  const author = data.author || "Editorial Team";

  if (id > 0) {
    const existing = db
      .prepare("SELECT id, title, status, published_at FROM news_posts WHERE id = ?")
      .get(id) as NewsRow | undefined;
    if (!existing) return { ok: false, message: "That notice no longer exists." };

    // Stamp published_at only on the draft → published transition; keep the
    // original date for items that were already live.
    const publishedAt =
      data.status === "published" && existing.status !== "published" ? now : existing.published_at;
    const slug = uniqueSlug("news", data.title, id);

    db.prepare(
      `UPDATE news_posts
          SET title = ?, slug = ?, category = ?, excerpt = ?, body = ?, cover_image = ?,
              author = ?, status = ?, published_at = ?, updated_at = ?
        WHERE id = ?`,
    ).run(data.title, slug, data.category, data.excerpt, data.body, coverImage, author, data.status, publishedAt, now, id);

    logAudit({
      userId: ctx.user.id,
      action: "news.update",
      entity: "news_post",
      entityId: id,
      detail: data.title,
    });
    revalidateContent("news");
    return { ok: true, message: `“${data.title}” has been saved.` };
  }

  const slug = uniqueSlug("news", data.title);
  const publishedAt = data.status === "published" ? now : null;
  const result = db
    .prepare(
      `INSERT INTO news_posts (title, slug, category, excerpt, body, cover_image, author, status, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(data.title, slug, data.category, data.excerpt, data.body, coverImage, author, data.status, publishedAt);
  const newId = Number(result.lastInsertRowid);

  logAudit({
    userId: ctx.user.id,
    action: "news.create",
    entity: "news_post",
    entityId: newId,
    detail: data.title,
  });
  revalidateContent("news");
  return { ok: true, message: `“${data.title}” has been created.` };
}

export async function deleteNews(id: number): Promise<ContentActionResult> {
  const ctx = await assertPermission(PERMISSIONS.CONTENT_MANAGE);
  const db = getDb();
  const row = db.prepare("SELECT id, title FROM news_posts WHERE id = ?").get(id) as
    | { id: number; title: string }
    | undefined;
  if (!row) return { ok: false, message: "That notice no longer exists." };

  db.prepare("DELETE FROM news_posts WHERE id = ?").run(id);
  logAudit({
    userId: ctx.user.id,
    action: "news.delete",
    entity: "news_post",
    entityId: id,
    detail: row.title,
  });
  revalidateContent("news");
  return { ok: true, message: `“${row.title}” has been deleted.` };
}

export async function toggleNewsStatus(id: number): Promise<ContentActionResult> {
  const ctx = await assertPermission(PERMISSIONS.CONTENT_MANAGE);
  const db = getDb();
  const row = db.prepare("SELECT id, title, status, published_at FROM news_posts WHERE id = ?").get(id) as
    | NewsRow
    | undefined;
  if (!row) return { ok: false, message: "That notice no longer exists." };

  const next = row.status === "published" ? "draft" : "published";
  const publishedAt = next === "published" ? row.published_at ?? new Date().toISOString() : row.published_at;
  db.prepare("UPDATE news_posts SET status = ?, published_at = ?, updated_at = datetime('now') WHERE id = ?").run(
    next,
    publishedAt,
    id,
  );

  logAudit({
    userId: ctx.user.id,
    action: "news.status",
    entity: "news_post",
    entityId: id,
    detail: `${row.title} → ${next}`,
  });
  revalidateContent("news");
  return {
    ok: true,
    message: next === "published" ? `“${row.title}” is now published.` : `“${row.title}” has been unpublished.`,
  };
}

/* ---------------------------------------------------------------- events */

export async function saveEvent(
  _prev: ContentActionResult,
  formData: FormData,
): Promise<ContentActionResult> {
  const ctx = await assertPermission(PERMISSIONS.CONTENT_MANAGE);
  const id = Number(formData.get("id")) || 0;

  const parsed = adminEventSchema.safeParse({
    title: String(formData.get("title") ?? ""),
    category: String(formData.get("category") ?? ""),
    summary: String(formData.get("summary") ?? ""),
    body: String(formData.get("body") ?? ""),
    location: String(formData.get("location") ?? ""),
    startsAt: String(formData.get("startsAt") ?? ""),
    endsAt: String(formData.get("endsAt") ?? ""),
    image: String(formData.get("image") ?? ""),
    registrationUrl: String(formData.get("registrationUrl") ?? ""),
    status: String(formData.get("status") ?? ""),
  });
  if (!parsed.success) {
    return { ok: false, message: "Please fix the highlighted fields.", errors: fieldErrors(parsed.error) };
  }

  const data = parsed.data;
  if (data.endsAt && new Date(data.endsAt).getTime() < new Date(data.startsAt).getTime()) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      errors: { endsAt: "The end time must be after the start time" },
    };
  }

  const db = getDb();
  const now = new Date().toISOString();
  const image = data.image || "/images/seminar.jpg";
  const endsAt = data.endsAt || null;

  if (id > 0) {
    const existing = db.prepare("SELECT id, title, status FROM events WHERE id = ?").get(id) as
      | { id: number; title: string; status: string }
      | undefined;
    if (!existing) return { ok: false, message: "That event no longer exists." };

    const slug = uniqueSlug("events", data.title, id);
    db.prepare(
      `UPDATE events
          SET title = ?, slug = ?, category = ?, summary = ?, body = ?, location = ?,
              starts_at = ?, ends_at = ?, image = ?, registration_url = ?, status = ?, updated_at = ?
        WHERE id = ?`,
    ).run(
      data.title,
      slug,
      data.category,
      data.summary,
      data.body,
      data.location,
      data.startsAt,
      endsAt,
      image,
      data.registrationUrl,
      data.status,
      now,
      id,
    );

    logAudit({
      userId: ctx.user.id,
      action: "events.update",
      entity: "event",
      entityId: id,
      detail: data.title,
    });
    revalidateContent("events");
    return { ok: true, message: `“${data.title}” has been saved.` };
  }

  const slug = uniqueSlug("events", data.title);
  const result = db
    .prepare(
      `INSERT INTO events (title, slug, category, summary, body, location, starts_at, ends_at, image, registration_url, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      data.title,
      slug,
      data.category,
      data.summary,
      data.body,
      data.location,
      data.startsAt,
      endsAt,
      image,
      data.registrationUrl,
      data.status,
    );
  const newId = Number(result.lastInsertRowid);

  logAudit({
    userId: ctx.user.id,
    action: "events.create",
    entity: "event",
    entityId: newId,
    detail: data.title,
  });
  revalidateContent("events");
  return { ok: true, message: `“${data.title}” has been created.` };
}

export async function deleteEvent(id: number): Promise<ContentActionResult> {
  const ctx = await assertPermission(PERMISSIONS.CONTENT_MANAGE);
  const db = getDb();
  const row = db.prepare("SELECT id, title FROM events WHERE id = ?").get(id) as
    | { id: number; title: string }
    | undefined;
  if (!row) return { ok: false, message: "That event no longer exists." };

  db.prepare("DELETE FROM events WHERE id = ?").run(id);
  logAudit({
    userId: ctx.user.id,
    action: "events.delete",
    entity: "event",
    entityId: id,
    detail: row.title,
  });
  revalidateContent("events");
  return { ok: true, message: `“${row.title}” has been deleted.` };
}

export async function toggleEventStatus(id: number): Promise<ContentActionResult> {
  const ctx = await assertPermission(PERMISSIONS.CONTENT_MANAGE);
  const db = getDb();
  const row = db.prepare("SELECT id, title, status, starts_at, ends_at FROM events WHERE id = ?").get(id) as
    | EventRow
    | undefined;
  if (!row) return { ok: false, message: "That event no longer exists." };

  const next = row.status === "published" ? "draft" : "published";
  db.prepare("UPDATE events SET status = ?, updated_at = datetime('now') WHERE id = ?").run(next, id);

  logAudit({
    userId: ctx.user.id,
    action: "events.status",
    entity: "event",
    entityId: id,
    detail: `${row.title} → ${next}`,
  });
  revalidateContent("events");
  return {
    ok: true,
    message: next === "published" ? `“${row.title}” is now published.` : `“${row.title}” has been unpublished.`,
  };
}

/* --------------------------------------------------------------- gallery */

export async function saveGalleryItem(
  _prev: ContentActionResult,
  formData: FormData,
): Promise<ContentActionResult> {
  const ctx = await assertPermission(PERMISSIONS.MEDIA_MANAGE);
  const id = Number(formData.get("id")) || 0;

  const parsed = adminGalleryItemSchema.safeParse({
    title: String(formData.get("title") ?? ""),
    category: String(formData.get("category") ?? ""),
    image: String(formData.get("image") ?? ""),
    alt: String(formData.get("alt") ?? ""),
    caption: String(formData.get("caption") ?? ""),
    sortOrder: String(formData.get("sortOrder") ?? "0"),
    status: String(formData.get("status") ?? ""),
  });
  if (!parsed.success) {
    return { ok: false, message: "Please fix the highlighted fields.", errors: fieldErrors(parsed.error) };
  }

  const data = parsed.data;
  const db = getDb();

  if (id > 0) {
    const existing = db.prepare("SELECT id FROM gallery_items WHERE id = ?").get(id) as { id: number } | undefined;
    if (!existing) return { ok: false, message: "That gallery image no longer exists." };

    db.prepare(
      `UPDATE gallery_items
          SET title = ?, category = ?, image = ?, alt = ?, caption = ?, sort_order = ?, status = ?
        WHERE id = ?`,
    ).run(data.title, data.category, data.image, data.alt, data.caption, data.sortOrder, data.status, id);

    logAudit({
      userId: ctx.user.id,
      action: "gallery.update",
      entity: "gallery_item",
      entityId: id,
      detail: data.title,
    });
    revalidateContent("gallery");
    return { ok: true, message: `“${data.title}” has been saved.` };
  }

  const result = db
    .prepare(
      `INSERT INTO gallery_items (title, category, image, alt, caption, sort_order, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(data.title, data.category, data.image, data.alt, data.caption, data.sortOrder, data.status);
  const newId = Number(result.lastInsertRowid);

  logAudit({
    userId: ctx.user.id,
    action: "gallery.create",
    entity: "gallery_item",
    entityId: newId,
    detail: data.title,
  });
  revalidateContent("gallery");
  return { ok: true, message: `“${data.title}” has been added to the gallery.` };
}

export async function deleteGalleryItem(id: number): Promise<ContentActionResult> {
  const ctx = await assertPermission(PERMISSIONS.MEDIA_MANAGE);
  const db = getDb();
  const row = db.prepare("SELECT id, title FROM gallery_items WHERE id = ?").get(id) as
    | { id: number; title: string }
    | undefined;
  if (!row) return { ok: false, message: "That gallery image no longer exists." };

  db.prepare("DELETE FROM gallery_items WHERE id = ?").run(id);
  logAudit({
    userId: ctx.user.id,
    action: "gallery.delete",
    entity: "gallery_item",
    entityId: id,
    detail: row.title,
  });
  revalidateContent("gallery");
  return { ok: true, message: `“${row.title}” has been deleted.` };
}

export async function reorderGallery(
  id: number,
  direction: "up" | "down",
): Promise<ContentActionResult> {
  const ctx = await assertPermission(PERMISSIONS.MEDIA_MANAGE);
  const db = getDb();
  const row = db.prepare("SELECT id, title, sort_order FROM gallery_items WHERE id = ?").get(id) as
    | { id: number; title: string; sort_order: number }
    | undefined;
  if (!row) return { ok: false, message: "That gallery image no longer exists." };

  const neighbour =
    direction === "up"
      ? (db
          .prepare("SELECT id, sort_order FROM gallery_items WHERE sort_order < ? ORDER BY sort_order DESC, id DESC LIMIT 1")
          .get(row.sort_order) as { id: number; sort_order: number } | undefined)
      : (db
          .prepare("SELECT id, sort_order FROM gallery_items WHERE sort_order > ? ORDER BY sort_order ASC, id ASC LIMIT 1")
          .get(row.sort_order) as { id: number; sort_order: number } | undefined);

  if (!neighbour) {
    return {
      ok: false,
      message: direction === "up" ? "Already at the top of the gallery." : "Already at the bottom of the gallery.",
    };
  }

  const swap = db.transaction(() => {
    db.prepare("UPDATE gallery_items SET sort_order = ? WHERE id = ?").run(neighbour.sort_order, row.sort_order);
    db.prepare("UPDATE gallery_items SET sort_order = ? WHERE id = ?").run(row.sort_order, neighbour.id);
  });
  swap();

  logAudit({
    userId: ctx.user.id,
    action: "gallery.reorder",
    entity: "gallery_item",
    entityId: id,
    detail: `${row.title} moved ${direction}`,
  });
  revalidateContent("gallery");
  return { ok: true, message: `“${row.title}” moved ${direction}.` };
}
