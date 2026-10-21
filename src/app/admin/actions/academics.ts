"use server";

import { revalidatePath } from "next/cache";
import { assertPermission, clientMeta } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/rbac";
import { getDb } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { slugify } from "@/lib/format";
import {
  adminCourseSchema,
  adminDepartmentSchema,
  adminFacultySchema,
  fieldErrors,
} from "@/lib/validation";
import {
  type AcademicsState,
  curriculumFromText,
  faqsFromText,
  itemsFromCsv,
  itemsFromText,
} from "@/components/admin/academics/shared";

type SlugTable = "courses" | "faculty" | "departments";

const readText = (formData: FormData, key: string): string =>
  String(formData.get(key) ?? "").trim();

const readId = (formData: FormData): number => {
  const value = Number(String(formData.get("id") ?? "").trim());
  return Number.isInteger(value) && value > 0 ? value : 0;
};

const readBool = (formData: FormData, key: string): boolean => {
  const value = formData.get(key);
  return value === "on" || value === "true" || value === "1";
};

function uniqueSlug(table: SlugTable, base: string, excludeId: number): string {
  const db = getDb();
  const root = base || "record";
  const isTaken = (candidate: string): boolean =>
    Boolean(
      db.prepare(`SELECT id FROM ${table} WHERE slug = ? AND id != ?`).get(candidate, excludeId),
    );
  if (!isTaken(root)) return root;
  for (let suffix = 2; suffix < 500; suffix += 1) {
    const candidate = `${root}-${suffix}`;
    if (!isTaken(candidate)) return candidate;
  }
  return `${root}-${Date.now()}`;
}

function findRecord(table: SlugTable, id: number): { id: number; name: string } | undefined {
  return getDb()
    .prepare(`SELECT id, name FROM ${table} WHERE id = ?`)
    .get(id) as { id: number; name: string } | undefined;
}

const invalidStatus = (message: string): AcademicsState => ({
  ok: false,
  message,
  errors: { _form: message },
});

export async function saveCourse(
  _prev: AcademicsState,
  formData: FormData,
): Promise<AcademicsState> {
  const ctx = await assertPermission(PERMISSIONS.COURSE_MANAGE);
  const { ip } = await clientMeta();
  const id = readId(formData);

  const parsed = adminCourseSchema.safeParse({
    name: readText(formData, "name"),
    code: readText(formData, "code"),
    degreeLevel: readText(formData, "degreeLevel"),
    departmentId: readText(formData, "departmentId"),
    durationMonths: readText(formData, "durationMonths"),
    durationLabel: readText(formData, "durationLabel"),
    studyMode: readText(formData, "studyMode"),
    seats: readText(formData, "seats"),
    eligibility: readText(formData, "eligibility"),
    overview: readText(formData, "overview"),
    description: readText(formData, "description"),
    feeAmount: readText(formData, "feeAmount"),
    feeNote: readText(formData, "feeNote"),
    scholarshipInfo: readText(formData, "scholarshipInfo"),
    image: readText(formData, "image"),
    status: readText(formData, "status"),
    featured: readBool(formData, "featured"),
    seoTitle: readText(formData, "seoTitle"),
    seoDescription: readText(formData, "seoDescription"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "We could not save this course — please correct the highlighted fields.",
      errors: fieldErrors(parsed.error),
    };
  }

  const data = parsed.data;
  const learningOutcomes = JSON.stringify(itemsFromText(readText(formData, "learningOutcomes")));
  const curriculum = JSON.stringify(curriculumFromText(readText(formData, "curriculum")));
  const careers = JSON.stringify(itemsFromText(readText(formData, "careers")));
  const faqs = JSON.stringify(faqsFromText(readText(formData, "faqs")));
  const sessionIds = formData
    .getAll("sessionIds")
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0);
  const image = data.image || "/images/course-cs.jpg";

  let recordId = id;
  try {
    const db = getDb();
    if (id > 0 && !findRecord("courses", id)) {
      return {
        ok: false,
        message: "This course no longer exists — it may have been removed by someone else.",
        errors: { _form: "Course not found" },
      };
    }
    const slug = uniqueSlug("courses", slugify(data.name), id);

    if (id > 0) {
      db.prepare(
        `UPDATE courses
            SET name = ?, slug = ?, code = ?, degree_level = ?, department_id = ?,
                duration_months = ?, duration_label = ?, study_mode = ?, seats = ?,
                eligibility = ?, overview = ?, description = ?, learning_outcomes = ?,
                curriculum = ?, careers = ?, fee_amount = ?, fee_note = ?,
                scholarship_info = ?, image = ?, status = ?, featured = ?, session_ids = ?,
                faqs = ?, seo_title = ?, seo_description = ?, updated_at = datetime('now')
          WHERE id = ?`,
      ).run(
        data.name,
        slug,
        data.code,
        data.degreeLevel,
        data.departmentId,
        data.durationMonths,
        data.durationLabel,
        data.studyMode,
        data.seats,
        data.eligibility,
        data.overview,
        data.description,
        learningOutcomes,
        curriculum,
        careers,
        data.feeAmount,
        data.feeNote,
        data.scholarshipInfo,
        image,
        data.status,
        data.featured ? 1 : 0,
        JSON.stringify(sessionIds),
        faqs,
        data.seoTitle,
        data.seoDescription,
        id,
      );
    } else {
      const info = db
        .prepare(
          `INSERT INTO courses (
             name, slug, code, degree_level, department_id, duration_months, duration_label,
             study_mode, seats, eligibility, overview, description, learning_outcomes, curriculum,
             careers, fee_amount, fee_note, scholarship_info, image, status, featured,
             session_ids, faqs, seo_title, seo_description
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          data.name,
          slug,
          data.code,
          data.degreeLevel,
          data.departmentId,
          data.durationMonths,
          data.durationLabel,
          data.studyMode,
          data.seats,
          data.eligibility,
          data.overview,
          data.description,
          learningOutcomes,
          curriculum,
          careers,
          data.feeAmount,
          data.feeNote,
          data.scholarshipInfo,
          image,
          data.status,
          data.featured ? 1 : 0,
          JSON.stringify(sessionIds),
          faqs,
          data.seoTitle,
          data.seoDescription,
        );
      recordId = Number(info.lastInsertRowid);
    }
  } catch {
    return {
      ok: false,
      message: "The course could not be saved because of a database error. Please try again.",
      errors: { _form: "Database error" },
    };
  }

  logAudit({
    userId: ctx.user.id,
    action: id > 0 ? "course.update" : "course.create",
    entity: "course",
    entityId: recordId,
    detail: data.name,
    ip,
  });
  revalidatePath("/admin/courses");
  revalidatePath(`/admin/courses/${recordId}/edit`);

  return {
    ok: true,
    id: recordId,
    message: id > 0 ? `Course "${data.name}" updated.` : `Course "${data.name}" created.`,
  };
}

export async function saveFaculty(
  _prev: AcademicsState,
  formData: FormData,
): Promise<AcademicsState> {
  const ctx = await assertPermission(PERMISSIONS.FACULTY_MANAGE);
  const { ip } = await clientMeta();
  const id = readId(formData);

  const parsed = adminFacultySchema.safeParse({
    name: readText(formData, "name"),
    designation: readText(formData, "designation"),
    departmentId: readText(formData, "departmentId"),
    qualifications: readText(formData, "qualifications"),
    experienceYears: readText(formData, "experienceYears"),
    email: readText(formData, "email"),
    phone: readText(formData, "phone"),
    bio: readText(formData, "bio"),
    researchInterests: readText(formData, "researchInterests"),
    photo: readText(formData, "photo"),
    displayOrder: readText(formData, "displayOrder"),
    visibility: readText(formData, "visibility"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "We could not save this faculty member — please correct the highlighted fields.",
      errors: fieldErrors(parsed.error),
    };
  }

  const data = parsed.data;
  const researchInterests = JSON.stringify(itemsFromCsv(data.researchInterests));

  let recordId = id;
  try {
    const db = getDb();
    if (id > 0 && !findRecord("faculty", id)) {
      return {
        ok: false,
        message: "This faculty record no longer exists — it may have been removed by someone else.",
        errors: { _form: "Faculty member not found" },
      };
    }
    const slug = uniqueSlug("faculty", slugify(data.name), id);

    if (id > 0) {
      db.prepare(
        `UPDATE faculty
            SET name = ?, slug = ?, designation = ?, department_id = ?, qualifications = ?,
                experience_years = ?, research_interests = ?, bio = ?, email = ?, phone = ?,
                photo = ?, display_order = ?, visibility = ?, updated_at = datetime('now')
          WHERE id = ?`,
      ).run(
        data.name,
        slug,
        data.designation,
        data.departmentId,
        data.qualifications,
        data.experienceYears,
        researchInterests,
        data.bio,
        data.email,
        data.phone,
        data.photo,
        data.displayOrder,
        data.visibility,
        id,
      );
    } else {
      const info = db
        .prepare(
          `INSERT INTO faculty (
             name, slug, designation, department_id, qualifications, experience_years,
             research_interests, bio, email, phone, photo, display_order, visibility
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          data.name,
          slug,
          data.designation,
          data.departmentId,
          data.qualifications,
          data.experienceYears,
          researchInterests,
          data.bio,
          data.email,
          data.phone,
          data.photo,
          data.displayOrder,
          data.visibility,
        );
      recordId = Number(info.lastInsertRowid);
    }
  } catch {
    return {
      ok: false,
      message: "The faculty record could not be saved because of a database error. Please try again.",
      errors: { _form: "Database error" },
    };
  }

  logAudit({
    userId: ctx.user.id,
    action: id > 0 ? "faculty.update" : "faculty.create",
    entity: "faculty",
    entityId: recordId,
    detail: data.name,
    ip,
  });
  revalidatePath("/admin/faculty");
  revalidatePath(`/admin/faculty/${recordId}/edit`);

  return {
    ok: true,
    id: recordId,
    message: id > 0 ? `${data.name} updated.` : `${data.name} added to the faculty directory.`,
  };
}

export async function saveDepartment(
  _prev: AcademicsState,
  formData: FormData,
): Promise<AcademicsState> {
  const ctx = await assertPermission(PERMISSIONS.DEPARTMENT_MANAGE);
  const { ip } = await clientMeta();
  const id = readId(formData);

  const parsed = adminDepartmentSchema.safeParse({
    name: readText(formData, "name"),
    code: readText(formData, "code"),
    overview: readText(formData, "overview"),
    image: readText(formData, "image"),
    visibility: readText(formData, "visibility"),
    sortOrder: readText(formData, "sortOrder"),
    seoTitle: readText(formData, "seoTitle"),
    seoDescription: readText(formData, "seoDescription"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "We could not save this department — please correct the highlighted fields.",
      errors: fieldErrors(parsed.error),
    };
  }

  const data = parsed.data;
  const image = data.image || "/images/gallery-1.jpg";

  let recordId = id;
  try {
    const db = getDb();
    if (id > 0 && !findRecord("departments", id)) {
      return {
        ok: false,
        message: "This department no longer exists — it may have been removed by someone else.",
        errors: { _form: "Department not found" },
      };
    }
    const slug = uniqueSlug("departments", slugify(data.name), id);

    if (id > 0) {
      db.prepare(
        `UPDATE departments
            SET name = ?, slug = ?, code = ?, overview = ?, image = ?, visibility = ?,
                sort_order = ?, seo_title = ?, seo_description = ?, updated_at = datetime('now')
          WHERE id = ?`,
      ).run(
        data.name,
        slug,
        data.code,
        data.overview,
        image,
        data.visibility,
        data.sortOrder,
        data.seoTitle,
        data.seoDescription,
        id,
      );
    } else {
      const info = db
        .prepare(
          `INSERT INTO departments (
             name, slug, code, overview, image, visibility, sort_order, seo_title, seo_description
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          data.name,
          slug,
          data.code,
          data.overview,
          image,
          data.visibility,
          data.sortOrder,
          data.seoTitle,
          data.seoDescription,
        );
      recordId = Number(info.lastInsertRowid);
    }
  } catch {
    return {
      ok: false,
      message: "The department could not be saved because of a database error. Please try again.",
      errors: { _form: "Database error" },
    };
  }

  logAudit({
    userId: ctx.user.id,
    action: id > 0 ? "department.update" : "department.create",
    entity: "department",
    entityId: recordId,
    detail: data.name,
    ip,
  });
  revalidatePath("/admin/departments");
  revalidatePath(`/admin/departments/${recordId}/edit`);

  return {
    ok: true,
    id: recordId,
    message: id > 0 ? `Department "${data.name}" updated.` : `Department "${data.name}" created.`,
  };
}

export async function setCourseStatus(
  id: number,
  status: "published" | "draft",
): Promise<AcademicsState> {
  const ctx = await assertPermission(PERMISSIONS.COURSE_MANAGE);
  const { ip } = await clientMeta();
  if (status !== "published" && status !== "draft") {
    return invalidStatus("Unknown course status.");
  }
  const record = findRecord("courses", id);
  if (!record) return invalidStatus("This course no longer exists.");

  getDb()
    .prepare(`UPDATE courses SET status = ?, updated_at = datetime('now') WHERE id = ?`)
    .run(status, id);

  logAudit({
    userId: ctx.user.id,
    action: status === "published" ? "course.publish" : "course.unpublish",
    entity: "course",
    entityId: id,
    detail: record.name,
    ip,
  });
  revalidatePath("/admin/courses");
  revalidatePath(`/admin/courses/${id}/edit`);

  return {
    ok: true,
    id,
    message:
      status === "published"
        ? `"${record.name}" is published and visible on the website.`
        : `"${record.name}" unpublished — it is hidden from the website.`,
  };
}

export async function setFacultyVisibility(
  id: number,
  visibility: "published" | "draft",
): Promise<AcademicsState> {
  const ctx = await assertPermission(PERMISSIONS.FACULTY_MANAGE);
  const { ip } = await clientMeta();
  if (visibility !== "published" && visibility !== "draft") {
    return invalidStatus("Unknown visibility value.");
  }
  const record = findRecord("faculty", id);
  if (!record) return invalidStatus("This faculty record no longer exists.");

  getDb()
    .prepare(`UPDATE faculty SET visibility = ?, updated_at = datetime('now') WHERE id = ?`)
    .run(visibility, id);

  logAudit({
    userId: ctx.user.id,
    action: visibility === "published" ? "faculty.publish" : "faculty.unpublish",
    entity: "faculty",
    entityId: id,
    detail: record.name,
    ip,
  });
  revalidatePath("/admin/faculty");
  revalidatePath(`/admin/faculty/${id}/edit`);

  return {
    ok: true,
    id,
    message:
      visibility === "published"
        ? `${record.name} is visible on the website.`
        : `${record.name} is hidden from the website.`,
  };
}

export async function setDepartmentVisibility(
  id: number,
  visibility: "published" | "draft",
): Promise<AcademicsState> {
  const ctx = await assertPermission(PERMISSIONS.DEPARTMENT_MANAGE);
  const { ip } = await clientMeta();
  if (visibility !== "published" && visibility !== "draft") {
    return invalidStatus("Unknown visibility value.");
  }
  const record = findRecord("departments", id);
  if (!record) return invalidStatus("This department no longer exists.");

  getDb()
    .prepare(`UPDATE departments SET visibility = ?, updated_at = datetime('now') WHERE id = ?`)
    .run(visibility, id);

  logAudit({
    userId: ctx.user.id,
    action: visibility === "published" ? "department.publish" : "department.unpublish",
    entity: "department",
    entityId: id,
    detail: record.name,
    ip,
  });
  revalidatePath("/admin/departments");
  revalidatePath(`/admin/departments/${id}/edit`);

  return {
    ok: true,
    id,
    message:
      visibility === "published"
        ? `"${record.name}" is visible on the website.`
        : `"${record.name}" is hidden from the website.`,
  };
}

const ARCHIVED_MESSAGE =
  "Archived — the record is unpublished and hidden from the website";

export async function archiveCourse(id: number): Promise<AcademicsState> {
  const ctx = await assertPermission(PERMISSIONS.COURSE_MANAGE);
  const { ip } = await clientMeta();
  const record = findRecord("courses", id);
  if (!record) return invalidStatus("This course no longer exists.");

  getDb()
    .prepare(`UPDATE courses SET status = 'draft', updated_at = datetime('now') WHERE id = ?`)
    .run(id);

  logAudit({
    userId: ctx.user.id,
    action: "course.archive",
    entity: "course",
    entityId: id,
    detail: record.name,
    ip,
  });
  revalidatePath("/admin/courses");
  revalidatePath(`/admin/courses/${id}/edit`);

  return { ok: true, id, message: ARCHIVED_MESSAGE };
}

export async function archiveFaculty(id: number): Promise<AcademicsState> {
  const ctx = await assertPermission(PERMISSIONS.FACULTY_MANAGE);
  const { ip } = await clientMeta();
  const record = findRecord("faculty", id);
  if (!record) return invalidStatus("This faculty record no longer exists.");

  getDb()
    .prepare(`UPDATE faculty SET visibility = 'draft', updated_at = datetime('now') WHERE id = ?`)
    .run(id);

  logAudit({
    userId: ctx.user.id,
    action: "faculty.archive",
    entity: "faculty",
    entityId: id,
    detail: record.name,
    ip,
  });
  revalidatePath("/admin/faculty");
  revalidatePath(`/admin/faculty/${id}/edit`);

  return { ok: true, id, message: ARCHIVED_MESSAGE };
}

export async function archiveDepartment(id: number): Promise<AcademicsState> {
  const ctx = await assertPermission(PERMISSIONS.DEPARTMENT_MANAGE);
  const { ip } = await clientMeta();
  const record = findRecord("departments", id);
  if (!record) return invalidStatus("This department no longer exists.");

  getDb()
    .prepare(
      `UPDATE departments SET visibility = 'draft', updated_at = datetime('now') WHERE id = ?`,
    )
    .run(id);

  logAudit({
    userId: ctx.user.id,
    action: "department.archive",
    entity: "department",
    entityId: id,
    detail: record.name,
    ip,
  });
  revalidatePath("/admin/departments");
  revalidatePath(`/admin/departments/${id}/edit`);

  return { ok: true, id, message: ARCHIVED_MESSAGE };
}
