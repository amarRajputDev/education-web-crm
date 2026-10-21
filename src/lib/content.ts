import "server-only";
import { getDb, parseJson } from "./db";

export type ContentBlock = {
  title: string;
  body: string;
  image: string;
  meta: Record<string, unknown>;
};

export function getBlock(key: string): ContentBlock | null {
  try {
    const row = getDb()
      .prepare(`SELECT title, body, image, meta FROM content_blocks WHERE block_key = ?`)
      .get(key) as { title: string; body: string; image: string; meta: string } | undefined;
    if (!row) return null;
    return {
      title: row.title,
      body: row.body,
      image: row.image,
      meta: parseJson<Record<string, unknown>>(row.meta, {}),
    };
  } catch {
    return null;
  }
}

export function paragraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function getPublishedCourses(limit = 50) {
  return getDb()
    .prepare(
      `SELECT c.id, c.name, c.slug, c.code, c.degree_level, c.study_mode, c.duration_label,
              c.duration_months, c.eligibility, c.overview, c.image, c.fee_amount, c.fee_note,
              c.scholarship_info, c.seats, c.featured,
              d.name AS department_name, d.slug AS department_slug, d.id AS department_id
         FROM courses c
         LEFT JOIN departments d ON d.id = c.department_id
        WHERE c.status = 'published'
        ORDER BY c.featured DESC, c.name
        LIMIT ?`,
    )
    .all(limit) as {
    id: number;
    name: string;
    slug: string;
    code: string;
    degree_level: string;
    study_mode: string;
    duration_label: string;
    duration_months: number;
    eligibility: string;
    overview: string;
    image: string;
    fee_amount: number;
    fee_note: string;
    scholarship_info: string;
    seats: number;
    featured: number;
    department_name: string | null;
    department_slug: string | null;
    department_id: number | null;
  }[];
}

export function getPublishedFaculty(limit = 60) {
  return getDb()
    .prepare(
      `SELECT f.id, f.name, f.slug, f.designation, f.qualifications, f.experience_years,
              f.research_interests, f.bio, f.email, f.photo, f.display_order,
              d.name AS department_name, d.slug AS department_slug, d.id AS department_id
         FROM faculty f
         LEFT JOIN departments d ON d.id = f.department_id
        WHERE f.visibility = 'published'
        ORDER BY f.display_order, f.name
        LIMIT ?`,
    )
    .all(limit) as {
    id: number;
    name: string;
    slug: string;
    designation: string;
    qualifications: string;
    experience_years: number;
    research_interests: string;
    bio: string;
    email: string;
    photo: string;
    display_order: number;
    department_name: string | null;
    department_slug: string | null;
    department_id: number | null;
  }[];
}

export function getDepartments() {
  return getDb()
    .prepare(
      `SELECT d.id, d.name, d.slug, d.code, d.overview, d.image, d.sort_order,
              f.name AS head_name, f.photo AS head_photo, f.designation AS head_designation
         FROM departments d
         LEFT JOIN faculty f ON f.id = d.head_faculty_id
        WHERE d.visibility = 'published'
        ORDER BY d.sort_order, d.name`,
    )
    .all() as {
    id: number;
    name: string;
    slug: string;
    code: string;
    overview: string;
    image: string;
    sort_order: number;
    head_name: string | null;
    head_photo: string | null;
    head_designation: string | null;
  }[];
}

export function getPublishedEvents(limit = 12) {
  return getDb()
    .prepare(
      `SELECT id, title, slug, category, summary, body, location, starts_at, ends_at, image, registration_url
         FROM events
        WHERE status = 'published'
        ORDER BY starts_at ASC
        LIMIT ?`,
    )
    .all(limit) as {
    id: number;
    title: string;
    slug: string;
    category: string;
    summary: string;
    body: string;
    location: string;
    starts_at: string;
    ends_at: string | null;
    image: string;
    registration_url: string;
  }[];
}

export function getPublishedNews(limit = 12) {
  return getDb()
    .prepare(
      `SELECT id, title, slug, category, excerpt, body, cover_image, author, published_at
         FROM news_posts
        WHERE status = 'published'
        ORDER BY published_at DESC
        LIMIT ?`,
    )
    .all(limit) as {
    id: number;
    title: string;
    slug: string;
    category: string;
    excerpt: string;
    body: string;
    cover_image: string;
    author: string;
    published_at: string;
  }[];
}

export function getFaqs(category?: string) {
  const db = getDb();
  const rows = category
    ? (db
        .prepare(
          `SELECT id, category, question, answer, sort_order FROM faqs
            WHERE status = 'published' AND category = ? ORDER BY sort_order`,
        )
        .all(category) as { id: number; category: string; question: string; answer: string }[])
    : (db
        .prepare(
          `SELECT id, category, question, answer, sort_order FROM faqs
            WHERE status = 'published' ORDER BY sort_order`,
        )
        .all() as { id: number; category: string; question: string; answer: string }[]);
  return rows;
}

export function getDownloads() {
  return getDb()
    .prepare(
      `SELECT id, title, category, description, file_path, external_url, downloads_count
         FROM downloads WHERE status = 'published' ORDER BY id`,
    )
    .all() as {
    id: number;
    title: string;
    category: string;
    description: string;
    file_path: string;
    external_url: string;
    downloads_count: number;
  }[];
}

export function getTestimonials(limit = 6) {
  return getDb()
    .prepare(
      `SELECT id, name, role, program, grad_year, quote, photo, is_demo
         FROM testimonials WHERE status = 'published' ORDER BY sort_order LIMIT ?`,
    )
    .all(limit) as {
    id: number;
    name: string;
    role: string;
    program: string;
    grad_year: string;
    quote: string;
    photo: string;
    is_demo: number;
  }[];
}

export function getGallery(limit = 24) {
  return getDb()
    .prepare(
      `SELECT id, title, category, image, caption FROM gallery_items
        WHERE status = 'published' ORDER BY sort_order LIMIT ?`,
    )
    .all(limit) as { id: number; title: string; category: string; image: string; caption: string }[];
}

export function getAcademicSessions() {
  return getDb()
    .prepare(`SELECT id, name, slug, start_date, end_date, application_deadline, is_current, status
                FROM academic_sessions ORDER BY start_date DESC`)
    .all() as {
    id: number;
    name: string;
    slug: string;
    start_date: string;
    end_date: string;
    application_deadline: string;
    is_current: number;
    status: string;
  }[];
}
