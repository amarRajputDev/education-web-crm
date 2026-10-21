"use server";

import { z } from "zod";
import { getDb } from "@/lib/db";
import { checkRateLimit, clientMeta } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { sendEmail } from "@/lib/email";
import { getSetting } from "@/lib/settings";
import { fieldErrors, contactSchema, enquirySchema, applicationPersonalSchema, applicationAcademicSchema, applicationProgramSchema, applicationAddressSchema, applicationReviewSchema } from "@/lib/validation";
import { normalizeEmail, normalizePhone, slugify } from "@/lib/format";

export type ActionState = {
  ok: boolean;
  message: string;
  errors?: Record<string, string>;
  ref?: string;
};

const ALLOWED_DOCS: Record<string, { mimes: string[]; maxBytes: number }> = {
  photograph: { mimes: ["image/jpeg", "image/png", "image/webp"], maxBytes: 2 * 1024 * 1024 },
  identity: { mimes: ["image/jpeg", "image/png", "image/webp", "application/pdf"], maxBytes: 5 * 1024 * 1024 },
  marksheet: { mimes: ["image/jpeg", "image/png", "image/webp", "application/pdf"], maxBytes: 5 * 1024 * 1024 },
  certificate: { mimes: ["image/jpeg", "image/png", "image/webp", "application/pdf"], maxBytes: 5 * 1024 * 1024 },
  other: { mimes: ["image/jpeg", "image/png", "image/webp", "application/pdf"], maxBytes: 5 * 1024 * 1024 },
};

function findDuplicateEnquiry(phone: string, email: string): { id: number; ref: string } | null {
  const db = getDb();
  const normalizedPhone = normalizePhone(phone);
  const normalizedEmail = normalizeEmail(email);
  const row = db
    .prepare(
      `SELECT id, ref FROM enquiries
        WHERE REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '+', '') LIKE ?
           OR (email != '' AND LOWER(email) = ?)
        ORDER BY id DESC LIMIT 1`,
    )
    .get(`%${normalizedPhone}`, normalizedEmail) as { id: number; ref: string } | undefined;
  return row ?? null;
}

export async function submitEnquiry(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const { ip } = await clientMeta();
  if (!checkRateLimit(`enquiry:${ip}`, 8, 3600)) {
    return { ok: false, message: "Too many enquiries from this connection. Please try again later." };
  }

  const payload = {
    name: String(formData.get("name") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    email: String(formData.get("email") ?? ""),
    courseId: formData.get("courseId") ? Number(formData.get("courseId")) : undefined,
    courseInterest: String(formData.get("courseInterest") ?? ""),
    preferredContact: String(formData.get("preferredContact") ?? "Phone"),
    source: String(formData.get("source") ?? "Website"),
    message: String(formData.get("message") ?? ""),
    consent: formData.get("consent"),
  };

  const parsed = enquirySchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, message: "Please correct the highlighted fields.", errors: fieldErrors(parsed.error) };
  }

  const data = parsed.data;
  const email = normalizeEmail(data.email ?? "");
  const phone = normalizePhone(data.phone);
  if (!email && data.preferredContact === "Email") {
    return { ok: false, message: "Email is required when email is your preferred contact method.", errors: { email: "Add an email address" } };
  }

  const db = getDb();
  const duplicate = findDuplicateEnquiry(phone, email);

  const courseRow = data.courseId
    ? (db.prepare("SELECT id, name FROM courses WHERE id = ?").get(data.courseId) as { id: number; name: string } | undefined)
    : undefined;

  const courseInterest = courseRow?.name ?? data.courseInterest ?? "";

  const count = (db.prepare("SELECT COUNT(*) AS c FROM enquiries").get() as { c: number }).c;
  const ref = `ENQ-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

  try {
    const info = db
      .prepare(
        `INSERT INTO enquiries (ref, name, phone, email, course_id, course_interest, source, source_page,
           utm_campaign, preferred_contact, message, consent, status, priority, tags, is_duplicate,
           created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      )
      .run(
        ref,
        data.name.trim(),
        phone,
        email,
        courseRow?.id ?? null,
        courseInterest,
        data.source,
        String(formData.get("sourcePage") ?? "").slice(0, 300),
        String(formData.get("utmCampaign") ?? "").slice(0, 120),
        data.preferredContact,
        (data.message ?? "").trim(),
        "new",
        "medium",
        JSON.stringify(duplicate ? ["possible-duplicate"] : []),
        duplicate ? 1 : 0,
      );

    const enquiryId = Number(info.lastInsertRowid);
    db.prepare(
      `INSERT INTO enquiry_activities (enquiry_id, action, detail, created_at)
       VALUES (?, 'created', ?, datetime('now'))`,
    ).run(enquiryId, `Enquiry received via ${data.source}`);

    if (duplicate) {
      db.prepare(
        `INSERT INTO enquiry_activities (enquiry_id, action, detail, created_at)
         VALUES (?, 'duplicate_flagged', ?, datetime('now'))`,
      ).run(enquiryId, `Possible duplicate of ${duplicate.ref}`);
    }

    notify({
      type: "info",
      title: "New website enquiry",
      body: `${data.name} enquired about ${courseInterest || "a programme"} (${ref}).`,
      link: `/admin/enquiries/${enquiryId}`,
      entity: "enquiries",
      entityId: enquiryId,
    });
    logAudit({ action: "enquiry.create", entity: "enquiry", entityId: enquiryId, detail: ref, ip });

    if (email && emailConfiguredSafe()) {
      await sendEmail({
        to: email,
        subject: `We received your enquiry — ${ref}`,
        text: `Dear ${data.name},\n\nThank you for your interest in ${getSetting("institute_name")}.\n\nYour enquiry reference is ${ref}. Our admissions counsellor will contact you shortly.\n\nAdmission helpline: ${getSetting("admission_helpline")}`,
      });
    }

    return {
      ok: true,
      ref,
      message: `Thank you, ${data.name.split(" ")[0]}! Your enquiry has been recorded with reference ${ref}.`,
    };
  } catch (error) {
    console.error("enquiry submission failed", error);
    return { ok: false, message: "We could not save your enquiry right now. Please try again." };
  }
}

function emailConfiguredSafe(): boolean {
  const provider = getSetting("email_provider", "not_configured");
  const key = process.env.EMAIL_API_KEY ?? process.env.RESEND_API_KEY ?? "";
  return provider !== "not_configured" && key.length > 0;
}

export async function submitContact(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const { ip } = await clientMeta();
  if (!checkRateLimit(`contact:${ip}`, 6, 3600)) {
    return { ok: false, message: "Too many messages from this connection. Please try again later." };
  }

  const parsed = contactSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    email: String(formData.get("email") ?? ""),
    subject: String(formData.get("subject") ?? ""),
    message: String(formData.get("message") ?? ""),
    consent: formData.get("consent"),
  });

  if (!parsed.success) {
    return { ok: false, message: "Please correct the highlighted fields.", errors: fieldErrors(parsed.error) };
  }

  const data = parsed.data;
  const db = getDb();
  const count = (db.prepare("SELECT COUNT(*) AS c FROM enquiries").get() as { c: number }).c;
  const ref = `ENQ-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

  try {
    const info = db
      .prepare(
        `INSERT INTO enquiries (ref, name, phone, email, source, source_page, message, consent, status, priority,
           preferred_contact, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'Website', '/contact', ?, 1, 'new', 'medium', 'Email', datetime('now'), datetime('now'))`,
      )
      .run(
        ref,
        data.name.trim(),
        normalizePhone(data.phone),
        normalizeEmail(data.email),
        `${data.subject}\n\n${data.message}`.slice(0, 1200),
      );
    const enquiryId = Number(info.lastInsertRowid);
    db.prepare(
      `INSERT INTO enquiry_activities (enquiry_id, action, detail, created_at)
       VALUES (?, 'created', 'Contact form submission', datetime('now'))`,
    ).run(enquiryId);
    notify({
      type: "info",
      title: "New contact message",
      body: `${data.name}: ${data.subject}`,
      link: `/admin/enquiries/${enquiryId}`,
      entity: "enquiries",
      entityId: enquiryId,
    });
    logAudit({ action: "contact.create", entity: "enquiry", entityId: enquiryId, detail: ref, ip });
    return { ok: true, ref, message: `Message received — reference ${ref}. We will respond within one working day.` };
  } catch (error) {
    console.error("contact submission failed", error);
    return { ok: false, message: "We could not send your message right now. Please try again." };
  }
}

export async function subscribeNewsletter(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const { ip } = await clientMeta();
  if (!checkRateLimit(`newsletter:${ip}`, 5, 3600)) {
    return { ok: false, message: "Too many attempts. Please try again later." };
  }
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  if (!z.string().email().safeParse(email).success) {
    return { ok: false, message: "Please enter a valid email address." };
  }
  try {
    getDb()
      .prepare("INSERT OR IGNORE INTO newsletter_subscribers (email, source) VALUES (?, 'footer')")
      .run(email);
    return { ok: true, message: "You are subscribed. Thank you!" };
  } catch {
    return { ok: false, message: "Subscription failed. Please try again." };
  }
}

export async function submitApplication(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const { ip } = await clientMeta();
  if (!checkRateLimit(`application:${ip}`, 5, 3600)) {
    return { ok: false, message: "Too many application attempts from this connection. Please try again later." };
  }

  const personal = applicationPersonalSchema.safeParse({
    fullName: String(formData.get("fullName") ?? ""),
    dob: String(formData.get("dob") ?? ""),
    gender: String(formData.get("gender") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    parentName: String(formData.get("parentName") ?? ""),
    parentPhone: String(formData.get("parentPhone") ?? ""),
  });
  const academic = applicationAcademicSchema.safeParse({
    qualification: String(formData.get("qualification") ?? ""),
    institutionName: String(formData.get("institutionName") ?? ""),
    board: String(formData.get("board") ?? ""),
    passingYear: String(formData.get("passingYear") ?? ""),
    marks: String(formData.get("marks") ?? ""),
  });
  const program = applicationProgramSchema.safeParse({
    courseId: String(formData.get("courseId") ?? ""),
    studyMode: String(formData.get("studyMode") ?? "Full-time"),
    sessionId: String(formData.get("sessionId") ?? ""),
    preference2: String(formData.get("preference2") ?? ""),
  });
  const address = applicationAddressSchema.safeParse({
    address: String(formData.get("address") ?? ""),
    sameAsCurrent: formData.get("sameAsCurrent") === "on" || formData.get("sameAsCurrent") === "true",
    permanentAddress: String(formData.get("permanentAddress") ?? ""),
    city: String(formData.get("city") ?? ""),
    state: String(formData.get("state") ?? ""),
    postalCode: String(formData.get("postalCode") ?? ""),
  });
  const review = applicationReviewSchema.safeParse({ declaration: formData.get("declaration") });

  const errors: Record<string, string> = {};
  for (const result of [personal, academic, program, address, review]) {
    if (!result.success) Object.assign(errors, fieldErrors(result.error));
  }
  if (Object.keys(errors).length > 0) {
    return {
      ok: false,
      message: "Some details are missing or invalid. Please review the highlighted fields.",
      errors,
    };
  }

  const db = getDb();
  const course = db
    .prepare("SELECT id, name, department_id, study_mode FROM courses WHERE id = ? AND status = 'published'")
    .get(program.data!.courseId) as { id: number; name: string; department_id: number; study_mode: string } | undefined;
  if (!course) {
    return { ok: false, message: "The selected programme is not accepting applications." };
  }
  const session = db
    .prepare("SELECT id, name FROM academic_sessions WHERE id = ?")
    .get(program.data!.sessionId) as { id: number; name: string } | undefined;
  if (!session) {
    return { ok: false, message: "Please select a valid academic session." };
  }

  /* document handling ------------------------------------------------- */
  const documents: {
    doc_type: string;
    original_name: string;
    stored_name: string;
    mime_type: string;
    size_bytes: number;
  }[] = [];
  const docErrors: Record<string, string> = {};
  const fs = await import("node:fs");
  const path = await import("node:path");
  const crypto = await import("node:crypto");
  const { UPLOADS_DIR: _unusedUploadsDir } = await import("@/lib/db");
  void _unusedUploadsDir;

  for (const key of Object.keys(ALLOWED_DOCS)) {
    const file = formData.get(`doc_${key}`);
    if (!(file instanceof File) || file.size === 0) continue;
    const rule = ALLOWED_DOCS[key];
    if (!rule.mimes.includes(file.type)) {
      docErrors[`doc_${key}`] = `Allowed formats: ${rule.mimes.map((mime) => mime.split("/")[1]).join(", ")}`;
      continue;
    }
    if (file.size > rule.maxBytes) {
      docErrors[`doc_${key}`] = `Maximum size ${Math.round(rule.maxBytes / (1024 * 1024))} MB`;
      continue;
    }
    const storedName = `${crypto.randomBytes(16).toString("hex")}.${file.name.split(".").pop()?.toLowerCase() || "bin"}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const targetDir = path.join(process.cwd(), "data", "uploads");
    fs.mkdirSync(targetDir, { recursive: true });
    fs.writeFileSync(path.join(targetDir, storedName), buffer);
    documents.push({
      doc_type: key,
      original_name: file.name.slice(0, 180),
      stored_name: storedName,
      mime_type: file.type,
      size_bytes: file.size,
    });
  }

  if (Object.keys(docErrors).length > 0) {
    return {
      ok: false,
      message: "One or more documents could not be accepted. Please check the file type and size.",
      errors: docErrors,
    };
  }
  if (documents.length === 0) {
    return {
      ok: false,
      message: "Please upload at least your photograph and mark sheet.",
      errors: { doc_photograph: "Photograph is required", doc_marksheet: "Mark sheet is required" },
    };
  }

  /* persist ----------------------------------------------------------- */
  try {
    const year = new Date().getFullYear();
    const count = (db.prepare("SELECT COUNT(*) AS c FROM admission_applications").get() as { c: number }).c;
    const ref = `APP-${year}-${String(count + 1).padStart(4, "0")}`;

    const linkedEnquiry = db
      .prepare(`SELECT id FROM enquiries WHERE LOWER(email) = ? ORDER BY id DESC LIMIT 1`)
      .get(normalizeEmail(personal.data!.email)) as { id: number } | undefined;

    const sameAsCurrent = address.data!.sameAsCurrent;
    const info = db
      .prepare(
        `INSERT INTO admission_applications (ref, enquiry_id, full_name, dob, gender, email, phone, parent_name,
           parent_phone, qualification, institution_name, board, passing_year, marks, course_id, course_name,
           department_id, study_mode, session_id, session_name, preference2, address, permanent_address,
           same_as_current, city, state, postal_code, status, document_status, consent, ip, source_page,
           submitted_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                 'submitted', ?, 1, ?, ?, datetime('now'), datetime('now'))`,
      )
      .run(
        ref,
        linkedEnquiry?.id ?? null,
        personal.data!.fullName.trim(),
        personal.data!.dob,
        personal.data!.gender ?? "",
        normalizeEmail(personal.data!.email),
        normalizePhone(personal.data!.phone),
        personal.data!.parentName ?? "",
        personal.data!.parentPhone ? normalizePhone(personal.data!.parentPhone) : "",
        academic.data!.qualification,
        academic.data!.institutionName,
        academic.data!.board,
        academic.data!.passingYear,
        academic.data!.marks,
        course.id,
        course.name,
        course.department_id,
        program.data!.studyMode,
        session.id,
        session.name,
        program.data!.preference2 ?? "",
        address.data!.address,
        sameAsCurrent ? address.data!.address : address.data!.permanentAddress ?? "",
        sameAsCurrent ? 1 : 0,
        address.data!.city,
        address.data!.state,
        address.data!.postalCode,
        documents.length === 5 ? "complete" : "partial",
        ip,
        String(formData.get("sourcePage") ?? "/admissions/apply").slice(0, 200),
      );

    const applicationId = Number(info.lastInsertRowid);
    const insertDoc = db.prepare(
      `INSERT INTO application_documents (application_id, doc_type, original_name, stored_name, mime_type, size_bytes, uploaded_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
    );
    for (const document of documents) {
      insertDoc.run(applicationId, document.doc_type, document.original_name, document.stored_name, document.mime_type, document.size_bytes);
    }

    if (linkedEnquiry) {
      db.prepare(
        `UPDATE enquiries SET status = 'application_submitted', updated_at = datetime('now') WHERE id = ?`,
      ).run(linkedEnquiry.id);
      db.prepare(
        `INSERT INTO enquiry_activities (enquiry_id, action, detail, created_at)
         VALUES (?, 'application_submitted', ?, datetime('now'))`,
      ).run(linkedEnquiry.id, `Application ${ref} submitted`);
    }

    db.prepare(
      `INSERT INTO application_reviews (application_id, from_status, to_status, notes, created_at)
       VALUES (?, '', 'submitted', 'Application submitted through the website.', datetime('now'))`,
    ).run(applicationId);

    notify({
      type: "urgent",
      title: "New admission application",
      body: `${personal.data!.fullName} applied for ${course.name} (${ref}).`,
      link: `/admin/admissions/${applicationId}`,
      entity: "applications",
      entityId: applicationId,
    });
    logAudit({ action: "application.create", entity: "application", entityId: applicationId, detail: ref, ip });

    if (emailConfiguredSafe()) {
      await sendEmail({
        to: normalizeEmail(personal.data!.email),
        subject: `Application received — ${ref}`,
        text: `Dear ${personal.data!.fullName},\n\nWe have received your application for ${course.name} (${session.name}).\n\nYour application reference is ${ref}. Keep it safe — you can use it to track your status on the admissions page.\n\nAdmission helpline: ${getSetting("admission_helpline")}`,
      });
    }

    return {
      ok: true,
      ref,
      message: `Application submitted successfully. Your reference number is ${ref}.`,
    };
  } catch (error) {
    console.error("application submission failed", error);
    return { ok: false, message: "We could not submit your application right now. Please try again." };
  }
}

export async function checkApplicationStatus(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const reference = String(formData.get("reference") ?? "").trim().toUpperCase();
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  if (!reference) return { ok: false, message: "Enter your application reference number." };

  const db = getDb();
  const row = db
    .prepare(
      `SELECT a.ref, a.full_name, a.status, a.course_name, a.submitted_at, a.email
         FROM admission_applications a
        WHERE a.ref = ?`,
    )
    .get(reference) as
    | { ref: string; full_name: string; status: string; course_name: string; submitted_at: string; email: string }
    | undefined;

  if (!row) {
    return { ok: false, message: "No application found for that reference number." };
  }
  if (email && normalizeEmail(row.email) !== email) {
    return { ok: false, message: "The email address does not match our records for this reference." };
  }

  const statusRow = db
    .prepare("SELECT name FROM application_statuses WHERE key = ?")
    .get(row.status) as { name: string } | undefined;

  return {
    ok: true,
    ref: row.ref,
    message: `${row.full_name} · ${row.course_name} — current status: ${statusRow?.name ?? row.status}. Submitted on ${row.submitted_at.slice(0, 10)}.`,
  };
}
