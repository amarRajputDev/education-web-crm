import { getAuthContext } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { toCsv } from "@/lib/format";
import { can, PERMISSIONS } from "@/lib/rbac";
import { buildReport, parseReportParams, reportScope } from "@/lib/report-queries";

export const dynamic = "force-dynamic";

/**
 * CSV export for every report on the reports hub.
 *
 * Authorisation is enforced here on the server: no session → 401, missing
 * `reports.export` permission → 403. Counsellors (and any role without
 * `enquiries.view_all`) only ever receive their own rows because the row
 * builders in `report-queries` apply the scope rule in SQL.
 */
export async function GET(request: Request): Promise<Response> {
  const auth = await getAuthContext();
  if (!auth) return new Response("Unauthorized", { status: 401 });
  if (!can(auth.user.role_key, PERMISSIONS.REPORT_EXPORT)) {
    return new Response("Forbidden — your role cannot export reports.", { status: 403 });
  }

  const url = new URL(request.url);
  const params: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });

  const { report, filters } = parseReportParams(params);
  const result = buildReport(report, filters, reportScope(auth.user.role_key, auth.user.id));

  const csv = result.rows.length > 0 ? toCsv(result.rows) : result.columns.join(",");
  const today = new Date().toISOString().slice(0, 10);
  const filename = `${report}-report-${today}.csv`;

  logAudit({
    userId: auth.user.id,
    action: "report.export",
    entity: "report",
    entityId: report,
    detail: `${result.rows.length} row${result.rows.length === 1 ? "" : "s"} exported (${result.title})`,
  });

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
