import fs from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { PERMISSIONS, can } from "@/lib/rbac";
import { getDb, UPLOADS_DIR } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * Authorised document download.
 * Documents live outside /public, are never exposed through the router, and are
 * only streamed after a session + permission + role-scope check.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthContext();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!can(auth.user.role_key, PERMISSIONS.APPLICATION_DOCUMENTS)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const db = getDb();
  const row = db
    .prepare(
      `SELECT d.id, d.original_name, d.stored_name, d.mime_type, d.size_bytes, d.doc_type,
              a.id AS application_id, a.ref, a.full_name, a.enquiry_id,
              (SELECT e.counsellor_id FROM enquiries e WHERE e.id = a.enquiry_id) AS counsellor_id
         FROM application_documents d
         JOIN admission_applications a ON a.id = d.application_id
        WHERE d.id = ?`,
    )
    .get(id) as
    | {
        id: number;
        original_name: string;
        stored_name: string;
        mime_type: string;
        size_bytes: number;
        doc_type: string;
        application_id: number;
        ref: string;
        full_name: string;
        enquiry_id: number | null;
        counsellor_id: number | null;
      }
    | undefined;

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // A counsellor may only open documents of applications linked to their own enquiries.
  if (!can(auth.user.role_key, PERMISSIONS.ENQUIRY_VIEW_ALL) && row.counsellor_id !== auth.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const baseDir = UPLOADS_DIR;
  const filePath = path.resolve(baseDir, row.stored_name);
  if (!filePath.startsWith(baseDir + path.sep)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }
  if (!fs.existsSync(filePath)) {
    return NextResponse.json(
      {
        error: "File missing",
        detail:
          "This document was uploaded during the demo seeding phase and no physical file exists on this machine. Uploads made through the admission form are stored in data/uploads and download correctly.",
      },
      { status: 404 },
    );
  }

  const buffer = fs.readFileSync(filePath);
  logAudit({
    userId: auth.user.id,
    action: "document.download",
    entity: "application_document",
    entityId: row.id,
    detail: `${row.ref} ${row.doc_type}`,
    ip: requestIp(_request),
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": row.mime_type || "application/octet-stream",
      "Content-Length": String(buffer.byteLength),
      "Content-Disposition": `attachment; filename="${encodeURIComponent(row.original_name || `${row.ref}-${row.doc_type}`)}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function requestIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    ""
  );
}
