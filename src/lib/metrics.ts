import "server-only";
import { getDb } from "./db";

export type RangeDays = 7 | 30 | 90 | 365;

const RANGE_SQL: Record<RangeDays, string> = {
  7: "datetime('now', '-7 days')",
  30: "datetime('now', '-30 days')",
  90: "datetime('now', '-90 days')",
  365: "datetime('now', '-365 days')",
};

export function previousRangeSql(days: RangeDays): string {
  return `datetime('now', '-${days * 2} days')`;
}

function count(sql: string, ...params: unknown[]): number {
  try {
    const row = getDb().prepare(sql).get(...(params as never[])) as { c: number } | undefined;
    return row?.c ?? 0;
  } catch {
    return 0;
  }
}

export function all<T>(sql: string, ...params: unknown[]): T[] {
  try {
    return getDb().prepare(sql).all(...(params as never[])) as T[];
  } catch {
    return [];
  }
}

export function one<T>(sql: string, ...params: unknown[]): T | undefined {
  try {
    return getDb().prepare(sql).get(...(params as never[])) as T | undefined;
  } catch {
    return undefined;
  }
}

/* ------------------------------------------------------------------ */
/* headline KPIs                                                       */
/* ------------------------------------------------------------------ */
export function dashboardKpis(range: RangeDays) {
  const window = RANGE_SQL[range];
  const prevWindow = previousRangeSql(range);

  const metric = (table: string, extra = "1 = 1") => {
    const current = count(`SELECT COUNT(*) AS c FROM ${table} WHERE created_at >= ${window} AND ${extra}`);
    const previous = count(
      `SELECT COUNT(*) AS c FROM ${table} WHERE created_at >= ${prevWindow} AND created_at < ${window} AND ${extra}`,
    );
    return { current, previous, delta: previous > 0 ? Math.round(((current - previous) / previous) * 100) : null };
  };

  const totalEnquiries = count("SELECT COUNT(*) AS c FROM enquiries");
  const totalApplications = count("SELECT COUNT(*) AS c FROM admission_applications");

  const newEnquiries = metric("enquiries");
  const contacted = metric("enquiries", `status IN ('contacted','interested','counselling_scheduled','application_started','application_submitted','converted')`);
  const qualified = metric("enquiries", `status IN ('interested','counselling_scheduled','application_started','application_submitted','converted')`);

  const applicationsSubmitted = metric("admission_applications");
  const underReview = count(`SELECT COUNT(*) AS c FROM admission_applications WHERE status IN ('under_review','documents_required','documents_verified','interview_scheduled')`);
  const accepted = count(`SELECT COUNT(*) AS c FROM admission_applications WHERE status IN ('approved','enrolled')`);
  const rejected = count(`SELECT COUNT(*) AS c FROM admission_applications WHERE status = 'rejected'`);

  const pendingFollowups = count(`SELECT COUNT(*) AS c FROM follow_up_tasks WHERE status = 'pending'`);
  const overdueFollowups = count(
    `SELECT COUNT(*) AS c FROM follow_up_tasks WHERE status = 'pending' AND due_at < datetime('now')`,
  );
  const dueToday = count(
    `SELECT COUNT(*) AS c FROM follow_up_tasks WHERE status = 'pending' AND date(due_at) = date('now')`,
  );
  const completedFollowups = count(`SELECT COUNT(*) AS c FROM follow_up_tasks WHERE status = 'completed'`);
  const allFollowups = count(`SELECT COUNT(*) AS c FROM follow_up_tasks`);
  const followupCompletion = allFollowups > 0 ? Math.round((completedFollowups / allFollowups) * 100) : 0;

  const enrolled = count(`SELECT COUNT(*) AS c FROM admission_applications WHERE status = 'enrolled'`);
  const conversion = totalEnquiries > 0 ? Math.round((totalApplications / totalEnquiries) * 1000) / 10 : 0;
  const enrolmentRate = totalEnquiries > 0 ? Math.round((enrolled / totalEnquiries) * 1000) / 10 : 0;

  return {
    range,
    totalEnquiries,
    totalApplications,
    newEnquiries,
    contacted,
    qualified,
    applicationsSubmitted,
    underReview,
    accepted,
    rejected,
    pendingFollowups,
    overdueFollowups,
    dueToday,
    followupCompletion,
    completedFollowups,
    allFollowups,
    conversion,
    enrolmentRate,
    deltas: { newEnquiries, contacted, qualified, applicationsSubmitted },
  };
}

/* ------------------------------------------------------------------ */
/* charts                                                              */
/* ------------------------------------------------------------------ */
export function enquiryTrend(range: RangeDays) {
  const rows = all<{ day: string; count: number }>(
    `SELECT date(created_at) AS day, COUNT(*) AS count
       FROM enquiries
      WHERE created_at >= ${RANGE_SQL[range]}
      GROUP BY day ORDER BY day`,
  );
  return fillDays(rows, range);
}

export function applicationTrend(range: RangeDays) {
  const rows = all<{ day: string; count: number }>(
    `SELECT date(submitted_at) AS day, COUNT(*) AS count
       FROM admission_applications
      WHERE submitted_at >= ${RANGE_SQL[range]}
      GROUP BY day ORDER BY day`,
  );
  return fillDays(rows, range);
}

function fillDays(rows: { day: string; count: number }[], range: RangeDays): { day: string; enquiries: number }[] {
  const map = new Map(rows.map((row) => [row.day, row.count]));
  const out: { day: string; enquiries: number }[] = [];
  const today = new Date();
  for (let index = range - 1; index >= 0; index--) {
    const date = new Date(today);
    date.setDate(today.getDate() - index);
    const key = date.toISOString().slice(0, 10);
    out.push({ day: key, enquiries: map.get(key) ?? 0 });
  }
  return out;
}

export function combinedTrend(range: RangeDays) {
  const enquiries = enquiryTrend(range);
  const applications = applicationTrend(range);
  return enquiries.map((row, index) => ({
    day: row.day,
    enquiries: row.enquiries,
    applications: applications[index]?.enquiries ?? 0,
  }));
}

export function enquiriesByCourse(range: RangeDays) {
  return all<{ label: string; count: number }>(
    `SELECT COALESCE(NULLIF(course_interest, ''), 'Not specified') AS label, COUNT(*) AS count
       FROM enquiries
      WHERE created_at >= ${RANGE_SQL[range]}
      GROUP BY label ORDER BY count DESC LIMIT 8`,
  );
}

export function leadsBySource(range: RangeDays) {
  return all<{ label: string; count: number }>(
    `SELECT source AS label, COUNT(*) AS count
       FROM enquiries
      WHERE created_at >= ${RANGE_SQL[range]}
      GROUP BY source ORDER BY count DESC`,
  );
}

export function applicationStatusDistribution() {
  return all<{ label: string; count: number }>(
    `SELECT COALESCE(s.name, a.status) AS label, COUNT(*) AS count
       FROM admission_applications a
       LEFT JOIN application_statuses s ON s.key = a.status
      GROUP BY a.status ORDER BY COUNT(*) DESC`,
  );
}

export function enquiryStatusDistribution() {
  return all<{ label: string; count: number }>(
    `SELECT COALESCE(s.name, e.status) AS label, e.status AS key, COUNT(*) AS count
       FROM enquiries e
       LEFT JOIN enquiry_statuses s ON s.key = e.status
      GROUP BY e.status ORDER BY COUNT(*) DESC`,
  );
}

export function conversionFunnel(range: RangeDays) {
  const window = RANGE_SQL[range];
  const stages = [
    { label: "Enquiries received", value: count(`SELECT COUNT(*) AS c FROM enquiries WHERE created_at >= ${window}`) },
    {
      label: "Contacted",
      value: count(
        `SELECT COUNT(*) AS c FROM enquiries WHERE created_at >= ${window}
           AND status IN ('contacted','interested','counselling_scheduled','application_started','application_submitted','converted')`,
      ),
    },
    {
      label: "Qualified / interested",
      value: count(
        `SELECT COUNT(*) AS c FROM enquiries WHERE created_at >= ${window}
           AND status IN ('interested','counselling_scheduled','application_started','application_submitted','converted')`,
      ),
    },
    { label: "Applications started", value: count(`SELECT COUNT(*) AS c FROM enquiries WHERE created_at >= ${window} AND status IN ('application_started','application_submitted','converted')`) },
    { label: "Applications submitted", value: count(`SELECT COUNT(*) AS c FROM admission_applications WHERE submitted_at >= ${window}`) },
    { label: "Enrolled", value: count(`SELECT COUNT(*) AS c FROM admission_applications WHERE submitted_at >= ${window} AND status = 'enrolled'`) },
  ];
  const peak = Math.max(1, stages[0].value);
  return stages.map((stage) => ({ ...stage, percent: Math.round((stage.value / peak) * 100) }));
}

export function counsellorPerformance(range: RangeDays) {
  return all<{ name: string; assigned: number; contacted: number; converted: number }>(
    `SELECT u.name,
            COUNT(*) AS assigned,
            SUM(CASE WHEN e.status NOT IN ('new','contact_pending') THEN 1 ELSE 0 END) AS contacted,
            SUM(CASE WHEN e.status = 'converted' THEN 1 ELSE 0 END) AS converted
       FROM enquiries e
       JOIN users u ON u.id = e.counsellor_id
      WHERE e.created_at >= ${RANGE_SQL[range]}
      GROUP BY u.id
      ORDER BY converted DESC, contacted DESC`,
  );
}

export function followupSummary() {
  return {
    pending: count(`SELECT COUNT(*) AS c FROM follow_up_tasks WHERE status = 'pending'`),
    overdue: count(`SELECT COUNT(*) AS c FROM follow_up_tasks WHERE status = 'pending' AND due_at < datetime('now')`),
    dueToday: count(`SELECT COUNT(*) AS c FROM follow_up_tasks WHERE status = 'pending' AND date(due_at) = date('now')`),
    completed: count(`SELECT COUNT(*) AS c FROM follow_up_tasks WHERE status = 'completed'`),
    missed: count(`SELECT COUNT(*) AS c FROM follow_up_tasks WHERE status = 'missed'`),
  };
}

export function recentActivity(limit = 6) {
  return all<{
    id: number;
    action: string;
    detail: string;
    entity: string;
    entity_id: string;
    created_at: string;
    user_name: string | null;
  }>(
    `SELECT a.id, a.action, a.detail, a.entity, a.entity_id, a.created_at, u.name AS user_name
       FROM audit_logs a
       LEFT JOIN users u ON u.id = a.user_id
      ORDER BY a.created_at DESC LIMIT ?`,
    limit,
  );
}

export function recentRecords() {
  return {
    enquiries: all<{
      id: number;
      ref: string;
      name: string;
      course_interest: string;
      status: string;
      created_at: string;
      phone: string;
    }>(
      `SELECT id, ref, name, course_interest, status, created_at, phone
         FROM enquiries ORDER BY created_at DESC LIMIT 6`,
    ),
    applications: all<{
      id: number;
      ref: string;
      full_name: string;
      course_name: string;
      status: string;
      submitted_at: string;
    }>(
      `SELECT id, ref, full_name, course_name, status, submitted_at
         FROM admission_applications ORDER BY submitted_at DESC LIMIT 6`,
    ),
    followups: all<{
      id: number;
      note: string;
      due_at: string;
      status: string;
      student: string;
      counsellor: string;
      enquiry_id: number;
    }>(
      `SELECT t.id, t.note, t.due_at, t.status, e.name AS student, u.name AS counsellor, t.enquiry_id
         FROM follow_up_tasks t
         JOIN enquiries e ON e.id = t.enquiry_id
         LEFT JOIN users u ON u.id = t.counsellor_id
        WHERE t.status = 'pending'
        ORDER BY t.due_at ASC LIMIT 8`,
    ),
  };
}
