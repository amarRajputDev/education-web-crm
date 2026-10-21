/**
 * Role based access control.
 *
 * Permissions live in the database (`permissions` + `role_permissions`) and are
 * enforced inside every server action / route handler through `can()`. Hiding a
 * navigation item in the UI is never treated as authorisation.
 */

export const PERMISSIONS = {
  DASHBOARD_VIEW: "dashboard.view",
  ENQUIRY_VIEW: "enquiries.view",
  ENQUIRY_VIEW_ALL: "enquiries.view_all",
  ENQUIRY_MANAGE: "enquiries.manage",
  ENQUIRY_ASSIGN: "enquiries.assign",
  ENQUIRY_EXPORT: "enquiries.export",
  ENQUIRY_MERGE: "enquiries.merge",
  APPLICATION_VIEW: "applications.view",
  APPLICATION_MANAGE: "applications.manage",
  APPLICATION_DOCUMENTS: "applications.documents",
  APPLICATION_EXPORT: "applications.export",
  COURSE_MANAGE: "courses.manage",
  FACULTY_MANAGE: "faculty.manage",
  DEPARTMENT_MANAGE: "departments.manage",
  CONTENT_MANAGE: "content.manage",
  MEDIA_MANAGE: "media.manage",
  STUDENT_VIEW: "students.view",
  REPORT_VIEW: "reports.view",
  REPORT_EXPORT: "reports.export",
  USER_MANAGE: "users.manage",
  SETTINGS_MANAGE: "settings.manage",
  AUDIT_VIEW: "audit.view",
  NOTIFICATION_VIEW: "notifications.view",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS: PermissionKey[] = Object.values(PERMISSIONS);

export const ROLE_DEFINITIONS: Record<
  string,
  { name: string; description: string; permissions: PermissionKey[] }
> = {
  super_admin: {
    name: "Super Admin",
    description: "Full system access including settings, users and audit logs.",
    permissions: [...ALL_PERMISSIONS],
  },
  admission_manager: {
    name: "Admission Manager",
    description: "Manages enquiries, applications, counsellors and admission reporting.",
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.ENQUIRY_VIEW,
      PERMISSIONS.ENQUIRY_VIEW_ALL,
      PERMISSIONS.ENQUIRY_MANAGE,
      PERMISSIONS.ENQUIRY_ASSIGN,
      PERMISSIONS.ENQUIRY_EXPORT,
      PERMISSIONS.ENQUIRY_MERGE,
      PERMISSIONS.APPLICATION_VIEW,
      PERMISSIONS.APPLICATION_MANAGE,
      PERMISSIONS.APPLICATION_DOCUMENTS,
      PERMISSIONS.APPLICATION_EXPORT,
      PERMISSIONS.STUDENT_VIEW,
      PERMISSIONS.REPORT_VIEW,
      PERMISSIONS.REPORT_EXPORT,
      PERMISSIONS.NOTIFICATION_VIEW,
      PERMISSIONS.COURSE_MANAGE,
      PERMISSIONS.FACULTY_MANAGE,
      PERMISSIONS.DEPARTMENT_MANAGE,
    ],
  },
  counsellor: {
    name: "Counsellor",
    description: "Works only on enquiries assigned to them, with follow-up tools.",
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.ENQUIRY_VIEW,
      PERMISSIONS.ENQUIRY_MANAGE,
      PERMISSIONS.NOTIFICATION_VIEW,
    ],
  },
  editor: {
    name: "Content Editor",
    description: "Maintains courses, faculty, departments, news and website content.",
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.COURSE_MANAGE,
      PERMISSIONS.FACULTY_MANAGE,
      PERMISSIONS.DEPARTMENT_MANAGE,
      PERMISSIONS.CONTENT_MANAGE,
      PERMISSIONS.MEDIA_MANAGE,
      PERMISSIONS.NOTIFICATION_VIEW,
    ],
  },
};

export function rolePermissions(roleKey: string): PermissionKey[] {
  return ROLE_DEFINITIONS[roleKey]?.permissions ?? [];
}

export function can(roleKey: string | null | undefined, permission: PermissionKey): boolean {
  if (!roleKey) return false;
  return rolePermissions(roleKey).includes(permission);
}

export function canAny(roleKey: string | null | undefined, permissions: PermissionKey[]): boolean {
  return permissions.some((permission) => can(roleKey, permission));
}
