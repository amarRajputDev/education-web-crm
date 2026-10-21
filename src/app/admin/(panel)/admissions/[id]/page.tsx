import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, FileText, GraduationCap, Mail, MapPin, Phone, ScrollText, User2 } from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { PERMISSIONS, can } from "@/lib/rbac";
import { getDb } from "@/lib/db";
import { AdminCard, AdminPageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { DecisionPanel, ReviewerAssign, DocumentsPanel, ApplicationNoteForm } from "@/components/admin/admissions/panels";
import { formatDateTime, relativeTime, statusTone } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAuth(PERMISSIONS.APPLICATION_VIEW);
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const db = getDb();
  const application = db
    .prepare(
      `SELECT a.*, s.name AS status_name, s.requires_reason,
              u.name AS reviewer_name,
              e.ref AS enquiry_ref, e.counsellor_id AS enquiry_counsellor_id
         FROM admission_applications a
         LEFT JOIN application_statuses s ON s.key = a.status
         LEFT JOIN users u ON u.id = a.reviewer_id
         LEFT JOIN enquiries e ON e.id = a.enquiry_id
        WHERE a.id = ?`,
    )
    .get(id) as
    | ({
        id: number;
        ref: string;
        full_name: string;
        dob: string;
        gender: string;
        email: string;
        phone: string;
        parent_name: string;
        parent_phone: string;
        qualification: string;
        institution_name: string;
        board: string;
        passing_year: string;
        marks: string;
        course_id: number | null;
        course_name: string;
        department_id: number | null;
        study_mode: string;
        session_id: number | null;
        session_name: string;
        preference2: string;
        address: string;
        permanent_address: string;
        same_as_current: number;
        city: string;
        state: string;
        postal_code: string;
        photo_path: string;
        status: string;
        document_status: string;
        reviewer_id: number | null;
        consent: number;
        ip: string;
        source_page: string;
        submitted_at: string;
        updated_at: string;
        status_name: string | null;
        requires_reason: number | null;
        reviewer_name: string | null;
        enquiry_id: number | null;
        enquiry_ref: string | null;
        enquiry_counsellor_id: number | null;
      } | undefined);
  if (!application) notFound();

  // Counsellors may only open applications that belong to their own enquiries.
  if (!can(ctx.user.role_key, PERMISSIONS.ENQUIRY_VIEW_ALL)) {
    if (application.enquiry_counsellor_id === null || application.enquiry_counsellor_id !== ctx.user.id) notFound();
  }

  const canManage = can(ctx.user.role_key, PERMISSIONS.APPLICATION_MANAGE);
  const canReview = can(ctx.user.role_key, PERMISSIONS.APPLICATION_DOCUMENTS);

  const documents = db
    .prepare(`SELECT * FROM application_documents WHERE application_id = ? ORDER BY doc_type`)
    .all(id) as {
    id: number;
    doc_type: string;
    original_name: string;
    mime_type: string;
    size_bytes: number;
    status: string;
    remarks: string;
    uploaded_at: string;
  }[];

  const reviews = db
    .prepare(
      `SELECT r.*, u.name AS actor_name FROM application_reviews r
         LEFT JOIN users u ON u.id = r.actor_id
        WHERE r.application_id = ? ORDER BY r.created_at DESC LIMIT 80`,
    )
    .all(id) as {
    id: number;
    from_status: string;
    to_status: string;
    notes: string;
    decision_reason: string;
    is_internal: number;
    created_at: string;
    actor_name: string | null;
  }[];

  const statuses = db
    .prepare(`SELECT key, name, requires_reason FROM application_statuses ORDER BY sort_order`)
    .all() as { key: string; name: string; requires_reason: number }[];
  const reviewers = db
    .prepare(`SELECT id, name FROM users WHERE status = 'active' AND role_key IN ('admission_manager','super_admin','counsellor') ORDER BY name`)
    .all() as { id: number; name: string }[];

  const statusLabel = application.status_name ?? application.status;

  const infoRows = (items: { label: string; value?: string; icon?: typeof User2 }[]) => (
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="flex gap-3 border-b border-line/70 pb-2.5 last:border-0">
          <dt className="flex w-36 shrink-0 items-start gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-body">
            {item.icon ? <item.icon className="mt-0.5 h-3.5 w-3.5 text-royal" aria-hidden /> : null}
            {item.label}
          </dt>
          <dd className="min-w-0 flex-1 break-words text-[13.5px] text-navy">{item.value || "—"}</dd>
        </div>
      ))}
    </dl>
  );

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title={application.full_name}
        description={`${application.ref} · submitted ${formatDateTime(application.submitted_at)}${
          application.source_page ? ` · from ${application.source_page}` : ""
        }`}
        actions={
          <>
            <Link href="/admin/admissions" className="btn btn-ghost btn-sm">
              <ArrowLeft className="h-4 w-4" aria-hidden />
              All applications
            </Link>
            {application.enquiry_id ? (
              <Link href={`/admin/enquiries/${application.enquiry_id}`} className="btn btn-outline btn-sm">
                Open enquiry {application.enquiry_ref}
              </Link>
            ) : null}
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={statusTone(application.status)} dot>
          {statusLabel}
        </Badge>
        <Badge tone={application.document_status === "verified" ? "success" : application.document_status === "pending" ? "neutral" : "warning"}>
          Documents {application.document_status}
        </Badge>
        <Badge tone="info">{application.study_mode}</Badge>
        <Badge tone="gold">{application.session_name || "Session not set"}</Badge>
        <span className="text-xs text-slate-body">
          Reviewer: <span className="font-semibold text-navy">{application.reviewer_name ?? "Not assigned"}</span>
        </span>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <AdminCard title="Personal details">
            {infoRows([
              { label: "Full name", value: application.full_name, icon: User2 },
              { label: "Date of birth", value: application.dob, icon: Calendar },
              { label: "Gender", value: application.gender },
              { label: "Email", value: application.email, icon: Mail },
              { label: "Mobile", value: application.phone, icon: Phone },
              { label: "Parent / guardian", value: application.parent_name },
              { label: "Guardian phone", value: application.parent_phone, icon: Phone },
              { label: "Consent", value: application.consent ? "Given" : "Not recorded" },
            ])}
          </AdminCard>

          <AdminCard title="Academic background">
            {infoRows([
              { label: "Last qualification", value: application.qualification, icon: GraduationCap },
              { label: "Institution", value: application.institution_name },
              { label: "Board / university", value: application.board },
              { label: "Passing year", value: application.passing_year, icon: Calendar },
              { label: "Marks / CGPA", value: application.marks },
              { label: "Applied for", value: application.course_name || "—" },
              { label: "Second preference", value: application.preference2 },
              { label: "Study mode", value: application.study_mode },
            ])}
          </AdminCard>

          <AdminCard title="Correspondence address">
            {infoRows([
              { label: "Address", value: application.address, icon: MapPin },
              { label: "City", value: application.city },
              { label: "State", value: application.state },
              { label: "Postal code", value: application.postal_code },
              { label: "Permanent address", value: application.same_as_current ? "Same as current" : application.permanent_address },
            ])}
          </AdminCard>

          <AdminCard
            title="Documents"
            description={`${documents.length} file${documents.length === 1 ? "" : "s"} attached · stored privately outside the web root`}
            actions={
              <Badge tone={application.document_status === "verified" ? "success" : application.document_status === "pending" ? "neutral" : "warning"}>
                {application.document_status}
              </Badge>
            }
          >
            <DocumentsPanel documents={documents} canReview={canReview} />
          </AdminCard>

          <AdminCard title="Review history" description="Decision trail — immutable, newest first">
            {reviews.length === 0 ? (
              <p className="rounded-xl border border-dashed border-line-strong px-3 py-5 text-center text-xs text-slate-body">
                No review activity yet.
              </p>
            ) : (
              <ol className="relative space-y-4 border-l border-line pl-5">
                {reviews.map((review) => (
                  <li key={review.id} className="relative">
                    <span
                      className="absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-paper bg-royal"
                      aria-hidden
                    />
                    <p className="text-[13px] text-navy">
                      <span className="font-bold">{review.actor_name ?? "System"}</span>
                      {review.to_status && review.from_status && review.to_status !== review.from_status ? (
                        <span className="text-slate-body"> moved status {review.from_status} → </span>
                      ) : null}
                      {review.to_status ? <span className="font-semibold text-royal">{review.to_status}</span> : null}
                      {review.notes ? <span className="text-slate-body"> — {review.notes}</span> : null}
                    </p>
                    {review.decision_reason ? (
                      <p className="mt-0.5 rounded-lg border border-gold/40 bg-gold-100 px-3 py-1.5 text-xs text-gold-700">
                        Reason: {review.decision_reason}
                      </p>
                    ) : null}
                    <p className="mt-1 text-[11px] text-slate-body">{formatDateTime(review.created_at)}</p>
                  </li>
                ))}
              </ol>
            )}

            {canReview ? (
              <div className="mt-4 border-t border-line pt-4">
                <ApplicationNoteForm applicationId={application.id} />
              </div>
            ) : null}
          </AdminCard>
        </div>

        <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
          <AdminCard title="Decision" description="Status changes requiring a reason are enforced server-side">
            <DecisionPanel
              applicationId={application.id}
              status={application.status}
              reviewerId={application.reviewer_id}
              statuses={statuses}
              reviewers={reviewers}
              reasonRequired={application.requires_reason === 1}
              canManage={canManage}
            />
          </AdminCard>

          <AdminCard title="Assignment">
            <ReviewerAssign applicationId={application.id} reviewerId={application.reviewer_id} reviewers={reviewers} canManage={canManage} />
          </AdminCard>

          <AdminCard title="Application record">
            <dl className="space-y-2 text-xs text-slate-body">
              <div className="flex justify-between gap-3">
                <dt>Application ID</dt>
                <dd className="font-mono text-navy">{application.ref}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Submitted</dt>
                <dd className="text-navy">{formatDateTime(application.submitted_at)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Last updated</dt>
                <dd className="text-navy">{relativeTime(application.updated_at)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Source</dt>
                <dd className="break-all text-right text-navy">{application.source_page || "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>IP captured</dt>
                <dd className="font-mono text-navy">{application.ip || "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Linked enquiry</dt>
                <dd className="text-navy">{application.enquiry_ref ?? "—"}</dd>
              </div>
            </dl>
          </AdminCard>

          <AdminCard title="Next steps">
            <ul className="space-y-2 text-xs text-slate-body">
              <li className="flex gap-2">
                <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-royal" aria-hidden />
                Verify every document before approving.
              </li>
              <li className="flex gap-2">
                <ScrollText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-royal" aria-hidden />
                Add an internal note for anything the next reviewer must know.
              </li>
              <li className="flex gap-2">
                <GraduationCap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-royal" aria-hidden />
                On enrolment the applicant appears under Enrolled students.
              </li>
            </ul>
            <Link href="/admin/students" className="btn btn-outline btn-sm mt-4 w-full">
              View enrolled students
            </Link>
          </AdminCard>
        </aside>
      </div>
    </div>
  );
}
