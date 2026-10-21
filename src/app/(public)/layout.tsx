import { getDb } from "@/lib/db";
import { getSetting } from "@/lib/settings";
import { SiteHeader, type NavCourse, type NavDepartment } from "@/components/public/site-header";
import { SiteFooter } from "@/components/public/site-footer";
import { WhatsAppFloat } from "@/components/public/whatsapp-float";

export const dynamic = "force-dynamic";

function navData() {
  try {
    const db = getDb();
    const courses = db
      .prepare(
        `SELECT c.name, c.slug, c.degree_level AS degreeLevel, COALESCE(d.name, 'General') AS department
           FROM courses c
           LEFT JOIN departments d ON d.id = c.department_id
          WHERE c.status = 'published'
          ORDER BY CASE c.degree_level
                     WHEN 'Undergraduate' THEN 1 WHEN 'Postgraduate' THEN 2
                     WHEN 'Diploma' THEN 3 WHEN 'Certificate' THEN 4 ELSE 5 END,
                   c.name`,
      )
      .all() as NavCourse[];
    const departments = db
      .prepare(`SELECT name, slug FROM departments WHERE visibility = 'published' ORDER BY sort_order, name`)
      .all() as NavDepartment[];
    return { courses, departments };
  } catch {
    return { courses: [] as NavCourse[], departments: [] as NavDepartment[] };
  }
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const { courses, departments } = navData();

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-navy focus:px-4 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to main content
      </a>
      <SiteHeader
        instituteName={getSetting("institute_name")}
        shortName={getSetting("short_name")}
        monogram={getSetting("logo_text", "AIHE")}
        helpline={getSetting("admission_helpline")}
        email={getSetting("admission_email")}
        announcement={getBoolean("announcement_enabled") ? getSetting("announcement_text") : ""}
        announcementLink={getSetting("announcement_link", "/admissions")}
        portalHref="/portal"
        courses={courses}
        departments={departments}
      />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <SiteFooter />
      <WhatsAppFloat />
    </div>
  );
}

function getBoolean(key: string): boolean {
  const value = getSetting(key, "true").toLowerCase();
  return value === "true" || value === "1" || value === "yes";
}
