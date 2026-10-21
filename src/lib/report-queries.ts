import "server-only";
import { formatDate } from "./format";
import { getDb } from "./db";
import { can, PERMISSIONS } from "./rbac";

export type ReportKey =
  | "enquiries"
  | "applications"
  | "coursewise"
  | "source"
  | "counsellor"
  | "followups"
  | "enrolment";

export const REPORT_KEYS: ReportKey[] = [
  "enquiries",
  "applications",
  "coursewise",
  "source",
  "counsellor",
  "followups",
  "enrolment",
];

export const REPORT_OPTIONS: { value: ReportKey; label: string; hint: string }[] = [
  {
    value: "enquiries",
    label: "Enquiry list",
    hint: "Every enquiry in the window with its source, status, owner and days to first contact.",
  },
  {
    value: "applications",
    label: "Application list",
    hint: "Submitted applications with status, document state and the linked counsellor.",
  },
  {
    value: "coursewise",
    label: "Course-wise performance",
    hint: "Enquiries, applications and conversions grouped by programme interest.",
  },
  {
    value: "source",
    label: "Lead source performance",
    hint: "Where enquiries came from and which acquisition sources convert best.",
  },
  {
    value: "counsellor",
    label: "Counsellor performance",
    hint: "Assigned, contacted and converted counts for each counsellor in the window.",
  },
  {
    value: "followups",
    label: "Follow-up completion",
    hint: "Follow-up task hygiene per counsellor: completed, pending, missed and overdue.",
  },
  {
    value: "enrolment",
    label: "Enrolment conversion",
    hint: "Enquiries → applications → enrolments per programme, with conversion percentages.",
  },
];

export const REPORT_RANGE_VALUES = ["7", "30", "90", "365", "all"];

export type ReportFilters = {
  /** yyyy-mm-dd, inclusive lower bound — overrides `range` when set */
  from?: string;
  /** yyyy-mm-dd, inclusive upper bound — overrides `range` when set */
  to?: string;
  /** Look-back window in days ("7" | "30" | "90" | "365") or "all" */
  range?: string;
  courseId?: number;
  counsellorId?: number;
  status?: string;
};

/** Visibility rule. When `all` is false the SQL always adds `e.counsellor_id = ?`. */
export type ReportScope = { all: boolean; userId: number };

export type ReportResult = {
  title: string;
  columns: string[];
  rows: Record<string, unknown>[];
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const POSITIVE_INT = /^\d+$/;

export function parseReportParams(params: Record<string, string | string[] | undefined>): {
  report: ReportKey;
  filters: ReportFilters;
  errors: Record<string, string>;
} {
  const read = (key: string): string => {
    const raw = params[key];
    const value = Array.isArray(raw) ? raw[0] ?? "" : raw ?? "";
    return value.trim();
  };

  const errors: Record<string, string> = {};

  const reportRaw = read("report");
  let report: ReportKey = "enquiries";
  if (reportRaw) {
    if ((REPORT_KEYS as string[]).includes(reportRaw)) report = reportRaw as ReportKey;
    else errors.report = "Choose a report from the list.";
  }

  const rangeRaw = read("range");
  let range = "30";
  if (rangeRaw) {
    if (REPORT_RANGE_VALUES.includes(rangeRaw)) range = rangeRaw;
    else errors.range = "Choose 7, 30, 90 or 365 days, or all time.";
  }

  const from = read("from");
  const to = read("to");
  if (from && !DATE_PATTERN.test(from)) errors.from = "Use a date in yyyy-mm-dd format.";
  if (to && !DATE_PATTERN.test(to)) errors.to = "Use a date in yyyy-mm-dd format.";
  if (!errors.from && !errors.to && from && to && from > to) {
    errors.to = "The end date must be on or after the start date.";
  }

  const courseId = read("courseId");
  const counsellorId = read("counsellorId");
  if (courseId && !POSITIVE_INT.test(courseId)) errors.courseId = "Choose a programme from the list.";
  if (counsellorId && !POSITIVE_INT.test(counsellorId)) {
    errors.counsellorId = "Choose a counsellor from the list.";
  }

  const status = read("status").toLowerCase();
  if (status && !/^[a-z0-9_]+$/.test(status)) errors.status = "Choose a status from the list.";

  const filters: ReportFilters = { range };
  if (DATE_PATTERN.test(from)) filters.from = from;
  if (DATE_PATTERN.test(to)) filters.to = to;
  if (POSITIVE_INT.test(courseId)) filters.courseId = Number(courseId);
  if (POSITIVE_INT.test(counsellorId)) filters.counsellorId = Number(counsellorId);
  if (status && /^[a-z0-9_]+$/.test(status)) filters.status = status;

  return { report, filters, errors };
}

/**
 * Counsellors only ever see their own records. The scope is applied in SQL —
 * it is never offered as a UI toggle.
 */
export function reportScope(roleKey: string, userId: number): ReportScope {
  const isCounsellor = roleKey === "counsellor";
  return { all: !isCounsellor && can(roleKey, PERMISSIONS.ENQUIRY_VIEW_ALL), userId };
}

/* ------------------------------------------------------------------ */
/* SQL helpers                                                         */
/* ------------------------------------------------------------------ */

type Param = string | number;
type Bound = { conditions: string[]; params: Param[] };
type RawRow = Record<string, string | number | null>;

function query(sql: string, params: Param[]): RawRow[] {
  try {
    return getDb().prepare(sql).all(...(params as never[])) as RawRow[];
  } catch {
    return [];
  }
}

function scalar(sql: string, params: Param[]): number {
  try {
    const row = getDb().prepare(sql).get(...(params as never[])) as { c?: number | null } | undefined;
    return Number(row?.c ?? 0);
  } catch {
    return 0;
  }
}

function whereSql(bound: Bound): string {
  return bound.conditions.length > 0 ? `WHERE ${bound.conditions.join(" AND ")}` : "WHERE 1 = 1";
}

function addWindow(bound: Bound, column: string, filters: ReportFilters): void {
  if (filters.from) {
    bound.conditions.push(`${column} >= ?`);
    bound.params.push(`${filters.from} 00:00:00`);
  }
  if (filters.to) {
    bound.conditions.push(`${column} < datetime(?, '+1 day')`);
    bound.params.push(filters.to);
  }
  if (!filters.from && !filters.to) {
    const days = Number(filters.range);
    if (Number.isFinite(days) && days > 0) {
      bound.conditions.push(`${column} >= datetime('now', ?)`);
      bound.params.push(`-${days} days`);
    }
  }
}

/** Row visibility: enforced in SQL, never in the UI. */
function addScope(bound: Bound, scope: ReportScope): void {
  if (!scope.all) {
    bound.conditions.push("e.counsellor_id = ?");
    bound.params.push(scope.userId);
  }
}

function enquiryBound(filters: ReportFilters, scope: ReportScope): Bound {
  const bound: Bound = { conditions: [], params: [] };
  addWindow(bound, "e.created_at", filters);
  if (filters.courseId) {
    bound.conditions.push("e.course_id = ?");
    bound.params.push(filters.courseId);
  }
  if (filters.counsellorId) {
    bound.conditions.push("e.counsellor_id = ?");
    bound.params.push(filters.counsellorId);
  }
  if (filters.status) {
    bound.conditions.push("e.status = ?");
    bound.params.push(filters.status);
  }
  addScope(bound, scope);
  return bound;
}

function applicationBound(filters: ReportFilters, scope: ReportScope): Bound {
  const bound: Bound = { conditions: [], params: [] };
  addWindow(bound, "a.submitted_at", filters);
  if (filters.courseId) {
    bound.conditions.push("a.course_id = ?");
    bound.params.push(filters.courseId);
  }
  if (filters.counsellorId) {
    bound.conditions.push("e.counsellor_id = ?");
    bound.params.push(filters.counsellorId);
  }
  if (filters.status) {
    bound.conditions.push("a.status = ?");
    bound.params.push(filters.status);
  }
  addScope(bound, scope);
  return bound;
}

function followupBound(filters: ReportFilters, scope: ReportScope): Bound {
  const bound: Bound = { conditions: [], params: [] };
  addWindow(bound, "t.due_at", filters);
  if (filters.courseId) {
    bound.conditions.push("e.course_id = ?");
    bound.params.push(filters.courseId);
  }
  if (filters.counsellorId) {
    bound.conditions.push("t.counsellor_id = ?");
    bound.params.push(filters.counsellorId);
  }
  if (filters.status) {
    bound.conditions.push("t.status = ?");
    bound.params.push(filters.status);
  }
  addScope(bound, scope);
  return bound;
}

const APPLICATION_JOIN = "admission_applications a LEFT JOIN enquiries e ON e.id = a.enquiry_id";
const FOLLOWUP_JOIN = "follow_up_tasks t JOIN enquiries e ON e.id = t.enquiry_id";

function num(value: unknown): number {
  return Number(value ?? 0);
}

function pct(part: number, whole: number): number {
  if (!whole) return 0;
  return Math.round((part / whole) * 1000) / 10;
}

function text(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function date(value: unknown): string {
  return formatDate(text(value) || null);
}

/* ------------------------------------------------------------------ */
/* report definitions                                                  */
/* ------------------------------------------------------------------ */

type ReportDefinition = {
  title: string;
  columns: string[];
  build: (filters: ReportFilters, scope: ReportScope) => Record<string, unknown>[];
};

const REPORT_DEFINITIONS: Record<ReportKey, ReportDefinition> = {
  enquiries: {
    title: "Enquiry list",
    columns: [
      "Reference",
      "Student",
      "Phone",
      "Email",
      "Programme",
      "Source",
      "Status",
      "Priority",
      "Counsellor",
      "Days to contact",
      "Created",
      "Last contacted",
    ],
    build: (filters, scope) => {
      const bound = enquiryBound(filters, scope);
      return query(
        `SELECT e.ref, e.name, e.phone, e.email,
                COALESCE(NULLIF(e.course_interest, ''), c.name, 'Not specified') AS course,
                e.source, e.status, e.priority,
                COALESCE(u.name, 'Unassigned') AS counsellor,
                e.created_at, e.last_contacted_at,
                CASE WHEN e.last_contacted_at IS NOT NULL
                     THEN ROUND(julianday(e.last_contacted_at) - julianday(e.created_at), 1)
                     ELSE NULL END AS days_to_contact
           FROM enquiries e
           LEFT JOIN courses c ON c.id = e.course_id
           LEFT JOIN users u ON u.id = e.counsellor_id
           ${whereSql(bound)}
          ORDER BY e.created_at DESC, e.id DESC`,
        bound.params,
      ).map((row) => ({
        Reference: row.ref,
        Student: row.name,
        Phone: row.phone,
        Email: row.email,
        Programme: row.course,
        Source: row.source,
        Status: row.status,
        Priority: row.priority,
        Counsellor: row.counsellor,
        "Days to contact": row.days_to_contact,
        Created: date(row.created_at),
        "Last contacted": row.last_contacted_at ? date(row.last_contacted_at) : "",
      }));
    },
  },

  applications: {
    title: "Application list",
    columns: ["Reference", "Applicant", "Phone", "Email", "Programme", "Status", "Documents", "Counsellor", "Submitted"],
    build: (filters, scope) => {
      const bound = applicationBound(filters, scope);
      return query(
        `SELECT a.ref, a.full_name, a.phone, a.email,
                COALESCE(NULLIF(a.course_name, ''), c.name, 'Not specified') AS course,
                a.status, a.document_status, a.submitted_at,
                COALESCE(u.name, 'Unassigned') AS counsellor
           FROM admission_applications a
           LEFT JOIN courses c ON c.id = a.course_id
           LEFT JOIN enquiries e ON e.id = a.enquiry_id
           LEFT JOIN users u ON u.id = e.counsellor_id
           ${whereSql(bound)}
          ORDER BY a.submitted_at DESC, a.id DESC`,
        bound.params,
      ).map((row) => ({
        Reference: row.ref,
        Applicant: row.full_name,
        Phone: row.phone,
        Email: row.email,
        Programme: row.course,
        Status: row.status,
        Documents: row.document_status,
        Counsellor: row.counsellor,
        Submitted: date(row.submitted_at),
      }));
    },
  },

  coursewise: {
    title: "Course-wise performance",
    columns: ["Programme", "Enquiries", "Contacted", "Converted", "Applications", "Conversion %"],
    build: (filters, scope) => {
      const bound = enquiryBound(filters, scope);
      return query(
        `SELECT COALESCE(NULLIF(e.course_interest, ''), c.name, 'Not specified') AS course,
                COUNT(*) AS enquiries,
                SUM(CASE WHEN e.last_contacted_at IS NOT NULL THEN 1 ELSE 0 END) AS contacted,
                SUM(CASE WHEN e.status = 'converted' THEN 1 ELSE 0 END) AS converted,
                COUNT(DISTINCT a.id) AS applications
           FROM enquiries e
           LEFT JOIN courses c ON c.id = e.course_id
           LEFT JOIN admission_applications a ON a.enquiry_id = e.id
           ${whereSql(bound)}
          GROUP BY course
          ORDER BY enquiries DESC, course`,
        bound.params,
      ).map((row) => {
        const enquiries = num(row.enquiries);
        const applications = num(row.applications);
        return {
          Programme: row.course,
          Enquiries: enquiries,
          Contacted: num(row.contacted),
          Converted: num(row.converted),
          Applications: applications,
          "Conversion %": pct(applications, enquiries),
        };
      });
    },
  },

  source: {
    title: "Lead source performance",
    columns: ["Source", "Enquiries", "Contacted", "Converted", "Applications", "Conversion %"],
    build: (filters, scope) => {
      const bound = enquiryBound(filters, scope);
      return query(
        `SELECT e.source AS source,
                COUNT(*) AS enquiries,
                SUM(CASE WHEN e.last_contacted_at IS NOT NULL THEN 1 ELSE 0 END) AS contacted,
                SUM(CASE WHEN e.status = 'converted' THEN 1 ELSE 0 END) AS converted,
                COUNT(DISTINCT a.id) AS applications
           FROM enquiries e
           LEFT JOIN admission_applications a ON a.enquiry_id = e.id
           ${whereSql(bound)}
          GROUP BY e.source
          ORDER BY enquiries DESC, e.source`,
        bound.params,
      ).map((row) => {
        const enquiries = num(row.enquiries);
        const applications = num(row.applications);
        return {
          Source: row.source,
          Enquiries: enquiries,
          Contacted: num(row.contacted),
          Converted: num(row.converted),
          Applications: applications,
          "Conversion %": pct(applications, enquiries),
        };
      });
    },
  },

  counsellor: {
    title: "Counsellor performance",
    columns: ["Counsellor", "Assigned", "Contacted", "Converted", "Applications", "Conversion %", "Avg. days to contact"],
    build: (filters, scope) => {
      const bound = enquiryBound(filters, scope);
      return query(
        `SELECT COALESCE(u.name, 'Unassigned') AS counsellor,
                COUNT(*) AS assigned,
                SUM(CASE WHEN e.last_contacted_at IS NOT NULL THEN 1 ELSE 0 END) AS contacted,
                SUM(CASE WHEN e.status = 'converted' THEN 1 ELSE 0 END) AS converted,
                COUNT(DISTINCT a.id) AS applications,
                ROUND(AVG(CASE WHEN e.last_contacted_at IS NOT NULL
                               THEN julianday(e.last_contacted_at) - julianday(e.created_at) END), 1) AS avg_days
           FROM enquiries e
           LEFT JOIN users u ON u.id = e.counsellor_id
           LEFT JOIN admission_applications a ON a.enquiry_id = e.id
           ${whereSql(bound)}
          GROUP BY e.counsellor_id
          ORDER BY converted DESC, contacted DESC, assigned DESC`,
        bound.params,
      ).map((row) => {
        const assigned = num(row.assigned);
        const applications = num(row.applications);
        return {
          Counsellor: row.counsellor,
          Assigned: assigned,
          Contacted: num(row.contacted),
          Converted: num(row.converted),
          Applications: applications,
          "Conversion %": pct(applications, assigned),
          "Avg. days to contact": row.avg_days ?? "",
        };
      });
    },
  },

  followups: {
    title: "Follow-up completion",
    columns: ["Counsellor", "Total tasks", "Completed", "Pending", "Missed", "Overdue", "Completion %"],
    build: (filters, scope) => {
      const bound = followupBound(filters, scope);
      return query(
        `SELECT COALESCE(u.name, 'Unassigned') AS counsellor,
                COUNT(*) AS total,
                SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) AS completed,
                SUM(CASE WHEN t.status = 'pending' THEN 1 ELSE 0 END) AS pending,
                SUM(CASE WHEN t.status = 'missed' THEN 1 ELSE 0 END) AS missed,
                SUM(CASE WHEN t.status = 'pending' AND t.due_at < datetime('now') THEN 1 ELSE 0 END) AS overdue
           FROM follow_up_tasks t
           JOIN enquiries e ON e.id = t.enquiry_id
           LEFT JOIN users u ON u.id = t.counsellor_id
           ${whereSql(bound)}
          GROUP BY t.counsellor_id
          ORDER BY total DESC, completed DESC`,
        bound.params,
      ).map((row) => {
        const total = num(row.total);
        const completed = num(row.completed);
        return {
          Counsellor: row.counsellor,
          "Total tasks": total,
          Completed: completed,
          Pending: num(row.pending),
          Missed: num(row.missed),
          Overdue: num(row.overdue),
          "Completion %": pct(completed, total),
        };
      });
    },
  },

  enrolment: {
    title: "Enrolment conversion",
    columns: ["Programme", "Enquiries", "Applications", "Enrolled", "Conversion %", "Enrolment %"],
    build: (filters, scope) => {
      const bound = enquiryBound(filters, scope);
      return query(
        `SELECT COALESCE(NULLIF(e.course_interest, ''), c.name, 'Not specified') AS course,
                COUNT(*) AS enquiries,
                COUNT(DISTINCT a.id) AS applications,
                COUNT(DISTINCT CASE WHEN a.status = 'enrolled' THEN a.id END) AS enrolled
           FROM enquiries e
           LEFT JOIN courses c ON c.id = e.course_id
           LEFT JOIN admission_applications a ON a.enquiry_id = e.id
           ${whereSql(bound)}
          GROUP BY course
          ORDER BY enquiries DESC, course`,
        bound.params,
      ).map((row) => {
        const enquiries = num(row.enquiries);
        const applications = num(row.applications);
        const enrolled = num(row.enrolled);
        return {
          Programme: row.course,
          Enquiries: enquiries,
          Applications: applications,
          Enrolled: enrolled,
          "Conversion %": pct(applications, enquiries),
          "Enrolment %": pct(enrolled, enquiries),
        };
      });
    },
  },
};

function orderRow(columns: string[], row: Record<string, unknown>): Record<string, unknown> {
  const ordered: Record<string, unknown> = {};
  for (const column of columns) ordered[column] = row[column] ?? "";
  return ordered;
}

/**
 * Builds a report dataset. Rows are keyed by the column labels so the same
 * array feeds the on-screen table and the CSV export.
 */
export function buildReport(report: ReportKey, filters: ReportFilters, scope: ReportScope): ReportResult {
  const definition = REPORT_DEFINITIONS[report] ?? REPORT_DEFINITIONS.enquiries;
  const rows = definition.build(filters, scope).map((row) => orderRow(definition.columns, row));
  return { title: definition.title, columns: definition.columns, rows };
}

/* ------------------------------------------------------------------ */
/* KPI strip                                                           */
/* ------------------------------------------------------------------ */

export type ReportKpis = {
  records: number;
  converted: number;
  conversionPct: number;
  completedFollowups: number;
};

/**
 * Headline figures for the reports hub. They use the same window, course,
 * counsellor and scope as `buildReport`, but ignore the status filter so the
 * conversion ratio always compares enquiries with applications on the same
 * population.
 */
export function reportKpis(report: ReportKey, filters: ReportFilters, scope: ReportScope): ReportKpis {
  const unfiltered: ReportFilters = { ...filters, status: undefined };

  const recordBound =
    report === "applications"
      ? applicationBound(filters, scope)
      : report === "followups"
        ? followupBound(filters, scope)
        : enquiryBound(filters, scope);
  const recordSource =
    report === "applications"
      ? APPLICATION_JOIN
      : report === "followups"
        ? FOLLOWUP_JOIN
        : "enquiries e";
  const records = scalar(
    `SELECT COUNT(*) AS c FROM ${recordSource} ${whereSql(recordBound)}`,
    recordBound.params,
  );

  const enquiries = enquiryBound(unfiltered, scope);
  const applications = applicationBound(unfiltered, scope);
  const followups = followupBound(unfiltered, scope);

  const enquiryCount = scalar(`SELECT COUNT(*) AS c FROM enquiries e ${whereSql(enquiries)}`, enquiries.params);
  const applicationCount = scalar(
    `SELECT COUNT(*) AS c FROM ${APPLICATION_JOIN} ${whereSql(applications)}`,
    applications.params,
  );

  const converted =
    report === "applications"
      ? scalar(
          `SELECT COUNT(*) AS c FROM ${APPLICATION_JOIN} ${whereSql(applications)} AND a.status IN ('approved', 'enrolled')`,
          applications.params,
        )
      : scalar(
          `SELECT COUNT(*) AS c FROM enquiries e ${whereSql(enquiries)} AND e.status = 'converted'`,
          enquiries.params,
        );

  const completedFollowups = scalar(
    `SELECT COUNT(*) AS c FROM ${FOLLOWUP_JOIN} ${whereSql(followups)} AND t.status = 'completed'`,
    followups.params,
  );

  return {
    records,
    converted,
    conversionPct: pct(applicationCount, enquiryCount),
    completedFollowups,
  };
}
