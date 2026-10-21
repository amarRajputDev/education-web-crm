import type { MetadataRoute } from "next";
import { getDb } from "@/lib/db";
import { getSetting } from "@/lib/settings";

export const dynamic = "force-dynamic";

function safeQuery(sql: string): { url: string; lastModified?: string }[] {
  try {
    return getDb().prepare(sql).all() as { url: string; lastModified?: string }[];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (getSetting("site_url", "http://localhost:3000") || "http://localhost:3000").replace(/\/$/, "");
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/about",
    "/academics",
    "/courses",
    "/faculty",
    "/campus-life",
    "/admissions",
    "/admissions/apply",
    "/admissions/track",
    "/news",
    "/events",
    "/contact",
    "/faqs",
    "/scholarships",
    "/placements",
    "/downloads",
    "/privacy",
    "/terms",
    "/accessibility",
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : path.startsWith("/admissions") ? 0.9 : 0.7,
  }));

  const courses = safeQuery(
    `SELECT CONCAT('/courses/', slug) AS url, updated_at AS lastModified FROM courses WHERE status = 'published'`,
  ).map((row) => ({ url: `${base}${row.url}`, lastModified: new Date(row.lastModified ?? now), changeFrequency: "monthly" as const, priority: 0.8 }));

  const faculty = safeQuery(
    `SELECT CONCAT('/faculty/', slug) AS url, updated_at AS lastModified FROM faculty WHERE visibility = 'published'`,
  ).map((row) => ({ url: `${base}${row.url}`, lastModified: new Date(row.lastModified ?? now), changeFrequency: "monthly" as const, priority: 0.5 }));

  const news = safeQuery(
    `SELECT CONCAT('/news/', slug) AS url, published_at AS lastModified FROM news_posts WHERE status = 'published'`,
  ).map((row) => ({ url: `${base}${row.url}`, lastModified: new Date(row.lastModified ?? now), changeFrequency: "monthly" as const, priority: 0.6 }));

  const events = safeQuery(
    `SELECT CONCAT('/events/', slug) AS url, updated_at AS lastModified FROM events WHERE status = 'published'`,
  ).map((row) => ({ url: `${base}${row.url}`, lastModified: new Date(row.lastModified ?? now), changeFrequency: "weekly" as const, priority: 0.6 }));

  return [...staticRoutes, ...courses, ...faculty, ...news, ...events];
}
