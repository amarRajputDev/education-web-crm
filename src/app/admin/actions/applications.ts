"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertPermission, clientMeta } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/rbac";
import { getDb } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { fieldErrors } from "@/lib/validation";

export type ApplicationActionResult = {
  ok: boolean;
  message: string;
  errors?: Record<string, string>;
  id?: number;
};

function refresh(id?: number) {
  revalidatePath("/admin/admissions");
  if (id) revalidatePath(`/admin/admissions/${id}`);
  revalidatePath("/admin/dashboard");
}

function addReview(
  applicationId: number,
  actorId: number,
  fromStatus: string,
  toStatus: string,
  notes: string,
  decisionReason: string,
) {
  getDb()
    .prepare(
      `INSERT INTO application_reviews (application_id, actor_id, from_status, to_status, notes, decision_reason, created_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
    )
    .run(applicationId, actorId, fromStatus, toStatus, notes, decisionReason);
}

function recomputeDocumentStatus(applicationId: number) {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN status = 'verified' THEN 1 ELSE 0 END) AS verified,
              SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending
         FROM application_documents WHERE application_id = ?`,
    )
    .get(applicationId) as { total: number; verified: number; pending: number };

  let documentStatus = "pending";
  if (row.total > 0 && row.verified === row.total) documentStatus = "verified";
  else if (row.verified > 0 || row.pending < row.total) documentStatus = row.verified > 0 ? "partial" : "pending";

  db.prepare(
    `UPDATE admission_applications SET document_status = ?, updated_at = datetime('now') WHERE id = ?`,
  ).run(documentStatus, applicationId);
}

/* ------------------------------------------------------------------ */
/* status decision                                                     */
/* ------------------------------------------------------------------ */
const statusSchema = z.object({
  applicationId: z.coerce.number().min(1),
  status: z.string().min(1, "Select a status"),
  decisionReason: z.string().trim().max(500).optional().default(""),
  notes: z.string().trim().max(800).optional().default(""),
});

export async function updateApplicationStatus(
  _prev: ApplicationActionResult,
  formData: FormData,
): Promise<ApplicationActionResult> {
  const ctx = await assertPermission(PERMISSIONS.APPLICATION_MANAGE);
  const { ip } = await clientMeta();

  const parsed = statusSchema.safeParse({
    applicationId: formData.get("applicationId"),
    status: formData.get("status"),
    decisionReason: formData.get("decisionReason") ?? "",
    notes: formData.get("notes") ?? "",
  });
  if (!parsed.success)
    return { ok: false, message: "Please correct the highlighted fields.", errors: fieldErrors(parsed.error) };

  const db = getDb();
  const application = db
    .prepare(`SELECT id, ref, full_name, status, email FROM admission_applications WHERE id = ?`)
    .get(parsed.data.applicationId) as
    | { id: number; ref: string; full_name: string; status: string; email: string }
    | undefined;
  if (!application) return { ok: false, message: "Application not found." };

  const workflow = db
    .prepare(`SELECT key, name, requires_reason FROM application_statuses WHERE key = ?`)
    .get(parsed.data.status) as { key: string; name: string; requires_reason: number } | undefined;
  if (!workflow) return { ok: false, message: "Unknown status.", errors: { status: "Unknown status value" } };

  if (workflow.requires_reason === 1 && parsed.data.decisionReason.trim().length < 4) {
    return {
      ok: false,
      message: "This decision requires a reason.",
      errors: { decisionReason: "A reason of at least 4 characters is required for this status." },
    };
  }

  try {
    db.prepare(`UPDATE admission_applications SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(
      workflow.key,
      application.id,
    );
    addReview(
      application.id,
      ctx.user.id,
      application.status,
      workflow.key,
      parsed.data.notes,
      parsed.data.decisionReason.trim(),
    );

    logAudit({
      userId: ctx.user.id,
      action: "application.status",
      entity: "admission_application",
      entityId: application.id,
      detail: `${application.ref}: ${application.status} → ${workflow.key}${parsed.data.decisionReason ? ` (${parsed.data.decisionReason})` : ""}`,
      ip,
    });

    notify({
      type: workflow.key === "rejected" ? "warning" : "success",
      title: `Application ${application.ref} → ${workflow.name}`,
      body: `${application.full_name}${parsed.data.decisionReason ? ` · ${parsed.data.decisionReason}` : ""}`,
      link: `/admin/admissions/${application.id}`,
      entity: "applications",
      entityId: application.id,
    });

    refresh(application.id);
    return { ok: true, id: application.id, message: `Status updated to ${workflow.name}.` };
  } catch (error) {
    console.error("updateApplicationStatus failed", error);
    return { ok: false, message: "Could not update the application status." };
  }
}

/* ------------------------------------------------------------------ */
/* reviewer assignment                                                 */
/* ------------------------------------------------------------------ */
export async function assignReviewer(formData: FormData): Promise<ApplicationActionResult> {
  const ctx = await assertPermission(PERMISSIONS.APPLICATION_MANAGE);
  const { ip } = await clientMeta();
  const applicationId = Number(formData.get("applicationId"));
  const reviewerId = Number(formData.get("reviewerId") ?? 0);

  const db = getDb();
  const application = db.prepare(`SELECT id, ref FROM admission_applications WHERE id = ?`).get(applicationId) as
    | { id: number; ref: string }
    | undefined;
  if (!application) return { ok: false, message: "Application not found." };

  if (reviewerId) {
    const reviewer = db
      .prepare(`SELECT id, name FROM users WHERE id = ? AND status = 'active' AND role_key IN ('admission_manager','super_admin','counsellor')`)
      .get(reviewerId) as { id: number; name: string } | undefined;
    if (!reviewer) return { ok: false, message: "Select a valid reviewer." };
    db.prepare(`UPDATE admission_applications SET reviewer_id = ?, updated_at = datetime('now') WHERE id = ?`).run(
      reviewerId,
      applicationId,
    );
    notify({
      userId: reviewerId,
      type: "info",
      title: "Application assigned to you",
      body: application.ref,
      link: `/admin/admissions/${applicationId}`,
      entity: "applications",
      entityId: applicationId,
    });
  } else {
    db.prepare(`UPDATE admission_applications SET reviewer_id = NULL, updated_at = datetime('now') WHERE id = ?`).run(applicationId);
  }

  addReview(applicationId, ctx.user.id, "", "", reviewerId ? "Reviewer assigned" : "Reviewer removed", "");
  logAudit({
    userId: ctx.user.id,
    action: "application.assign",
    entity: "admission_application",
    entityId: applicationId,
    detail: `${application.ref} reviewer=${reviewerId || "none"}`,
    ip,
  });
  refresh(applicationId);
  return { ok: true, id: applicationId, message: reviewerId ? "Reviewer assigned." : "Reviewer cleared." };
}

/* ------------------------------------------------------------------ */
/* internal review notes                                               */
/* ------------------------------------------------------------------ */
const noteSchema = z.object({
  applicationId: z.coerce.number().min(1),
  notes: z.string().trim().min(2, "Write a note").max(800),
  isInternal: z.coerce.number().optional().default(1),
});

export async function addApplicationNote(
  _prev: ApplicationActionResult,
  formData: FormData,
): Promise<ApplicationActionResult> {
  const ctx = await assertPermission(PERMISSIONS.APPLICATION_DOCUMENTS);
  const { ip } = await clientMeta();
  const parsed = noteSchema.safeParse({
    applicationId: formData.get("applicationId"),
    notes: formData.get("notes"),
    isInternal: formData.get("isInternal") ? 1 : 0,
  });
  if (!parsed.success)
    return { ok: false, message: "Please correct the highlighted fields.", errors: fieldErrors(parsed.error) };

  const db = getDb();
  const application = db.prepare(`SELECT id, ref FROM admission_applications WHERE id = ?`).get(parsed.data.applicationId);
  if (!application) return { ok: false, message: "Application not found." };

  db.prepare(
    `INSERT INTO application_reviews (application_id, actor_id, from_status, to_status, notes, decision_reason, is_internal, created_at)
     VALUES (?, ?, '', '', ?, '', ?, datetime('now'))`,
  ).run(parsed.data.applicationId, ctx.user.id, parsed.data.notes, parsed.data.isInternal);

  logAudit({
    userId: ctx.user.id,
    action: "application.note",
    entity: "admission_application",
    entityId: parsed.data.applicationId,
    detail: parsed.data.notes.slice(0, 80),
    ip,
  });
  refresh(parsed.data.applicationId);
  return { ok: true, id: parsed.data.applicationId, message: "Review note added." };
}

/* ------------------------------------------------------------------ */
/* document verification                                               */
/* ------------------------------------------------------------------ */
const documentSchema = z.object({
  documentId: z.coerce.number().min(1),
  status: z.enum(["verified", "rejected", "pending"]),
  remarks: z.string().trim().max(400).optional().default(""),
});

export async function setDocumentStatus(
  _prev: ApplicationActionResult,
  formData: FormData,
): Promise<ApplicationActionResult> {
  const ctx = await assertPermission(PERMISSIONS.APPLICATION_DOCUMENTS);
  const { ip } = await clientMeta();
  const parsed = documentSchema.safeParse({
    documentId: formData.get("documentId"),
    status: formData.get("status"),
    remarks: formData.get("remarks") ?? "",
  });
  if (!parsed.success)
    return { ok: false, message: "Please correct the highlighted fields.", errors: fieldErrors(parsed.error) };
  if (parsed.data.status === "rejected" && parsed.data.remarks.length < 3) {
    return { ok: false, message: "A remark is required when rejecting a document.", errors: { remarks: "Add a remark explaining the rejection." } };
  }

  const db = getDb();
  const document = db
    .prepare(
      `SELECT d.id, d.doc_type, d.application_id, d.status, a.ref
         FROM application_documents d JOIN admission_applications a ON a.id = d.application_id
        WHERE d.id = ?`,
    )
    .get(parsed.data.documentId) as
    | { id: number; doc_type: string; application_id: number; status: string; ref: string }
    | undefined;
  if (!document) return { ok: false, message: "Document not found." };

  db.prepare(
    `UPDATE application_documents
        SET status = ?, remarks = ?, verified_by = ?, uploaded_at = uploaded_at
      WHERE id = ?`,
  ).run(parsed.data.status, parsed.data.remarks, ctx.user.id, parsed.data.documentId);

  recomputeDocumentStatus(document.application_id);
  addReview(
    document.application_id,
    ctx.user.id,
    "",
    "",
    `Document "${document.doc_type}" marked ${parsed.data.status}${parsed.data.remarks ? ` — ${parsed.data.remarks}` : ""}`,
    "",
  );

  logAudit({
    userId: ctx.user.id,
    action: "document.verify",
    entity: "application_document",
    entityId: document.id,
    detail: `${document.ref} ${document.doc_type} → ${parsed.data.status}`,
    ip,
  });
  refresh(document.application_id);
  return { ok: true, id: document.application_id, message: `Document ${parsed.data.status}.` };
}

/* ------------------------------------------------------------------ */
/* bulk reviewer assignment                                            */
/* ------------------------------------------------------------------ */
export async function bulkAssignApplications(formData: FormData): Promise<ApplicationActionResult> {
  const ctx = await assertPermission(PERMISSIONS.APPLICATION_MANAGE);
  const { ip } = await clientMeta();
  const ids = String(formData.get("ids") ?? "")
    .split(",")
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0)
    .slice(0, 200);
  const reviewerId = Number(formData.get("reviewerId") ?? 0);
  if (ids.length === 0) return { ok: false, message: "Select at least one application." };
  if (!reviewerId) return { ok: false, message: "Choose a reviewer." };

  const db = getDb();
  const reviewer = db.prepare(`SELECT id, name FROM users WHERE id = ? AND status = 'active'`).get(reviewerId) as
    | { id: number; name: string }
    | undefined;
  if (!reviewer) return { ok: false, message: "Select a valid reviewer." };

  const stmt = db.prepare(`UPDATE admission_applications SET reviewer_id = ?, updated_at = datetime('now') WHERE id = ?`);
  const auditStmt = db.prepare(
    `INSERT INTO application_reviews (application_id, actor_id, from_status, to_status, notes, created_at)
     VALUES (?, ?, '', '', ?, datetime('now'))`,
  );
  let updated = 0;
  for (const id of ids) {
    const application = db.prepare(`SELECT id FROM admission_applications WHERE id = ?`).get(id);
    if (!application) continue;
    stmt.run(reviewerId, id);
    auditStmt.run(id, ctx.user.id, `Bulk assigned to ${reviewer.name}`);
    updated++;
  }
  if (updated === 0) return { ok: false, message: "No matching applications selected." };

  notify({
    userId: reviewerId,
    type: "info",
    title: `${updated} application${updated === 1 ? "" : "s"} assigned to you`,
    body: `Assigned by ${ctx.user.name}`,
    link: "/admin/admissions",
    entity: "applications",
  });
  logAudit({
    userId: ctx.user.id,
    action: "application.bulk_assign",
    entity: "admission_application",
    entityId: ids.join(","),
    detail: `${updated} → ${reviewer.name}`,
    ip,
  });
  refresh();
  return { ok: true, message: `${updated} application${updated === 1 ? "" : "s"} assigned to ${reviewer.name}.` };
}
