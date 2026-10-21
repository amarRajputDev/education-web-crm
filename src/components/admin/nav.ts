import {
  BarChart3,
  BookOpen,
  Building2,
  ClipboardList,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Megaphone,
  ScrollText,
  Settings,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import { PERMISSIONS, can, type PermissionKey } from "@/lib/rbac";

export type AdminNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  permission: PermissionKey;
  badge?: "enquiries" | "applications";
  children?: { label: string; href: string; permission: PermissionKey }[];
};

export const ADMIN_NAV: AdminNavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, permission: PERMISSIONS.DASHBOARD_VIEW },
  {
    label: "Enquiries",
    href: "/admin/enquiries",
    icon: Megaphone,
    permission: PERMISSIONS.ENQUIRY_VIEW,
    badge: "enquiries",
    children: [
      { label: "All enquiries", href: "/admin/enquiries", permission: PERMISSIONS.ENQUIRY_VIEW },
      { label: "Follow-ups today", href: "/admin/enquiries?view=today", permission: PERMISSIONS.ENQUIRY_VIEW },
      { label: "Pipeline (Kanban)", href: "/admin/enquiries?view=kanban", permission: PERMISSIONS.ENQUIRY_VIEW },
    ],
  },
  {
    label: "Admissions",
    href: "/admin/admissions",
    icon: ClipboardList,
    permission: PERMISSIONS.APPLICATION_VIEW,
    badge: "applications",
    children: [
      { label: "Applications", href: "/admin/admissions", permission: PERMISSIONS.APPLICATION_VIEW },
      { label: "Awaiting review", href: "/admin/admissions?status=submitted", permission: PERMISSIONS.APPLICATION_VIEW },
      { label: "Students", href: "/admin/students", permission: PERMISSIONS.STUDENT_VIEW },
    ],
  },
  {
    label: "Academics",
    href: "/admin/courses",
    icon: GraduationCap,
    permission: PERMISSIONS.COURSE_MANAGE,
    children: [
      { label: "Courses", href: "/admin/courses", permission: PERMISSIONS.COURSE_MANAGE },
      { label: "Faculty", href: "/admin/faculty", permission: PERMISSIONS.FACULTY_MANAGE },
      { label: "Departments", href: "/admin/departments", permission: PERMISSIONS.DEPARTMENT_MANAGE },
    ],
  },
  {
    label: "Website Content",
    href: "/admin/content",
    icon: FileText,
    permission: PERMISSIONS.CONTENT_MANAGE,
    children: [
      { label: "Content overview", href: "/admin/content", permission: PERMISSIONS.CONTENT_MANAGE },
      { label: "News & notices", href: "/admin/news", permission: PERMISSIONS.CONTENT_MANAGE },
      { label: "Events", href: "/admin/events", permission: PERMISSIONS.CONTENT_MANAGE },
      { label: "Gallery", href: "/admin/gallery", permission: PERMISSIONS.MEDIA_MANAGE },
      { label: "Testimonials", href: "/admin/testimonials", permission: PERMISSIONS.CONTENT_MANAGE },
      { label: "FAQs", href: "/admin/faqs", permission: PERMISSIONS.CONTENT_MANAGE },
      { label: "Downloads", href: "/admin/downloads", permission: PERMISSIONS.CONTENT_MANAGE },
    ],
  },
  { label: "Reports & Analytics", href: "/admin/reports", icon: BarChart3, permission: PERMISSIONS.REPORT_VIEW },
  { label: "Team & Permissions", href: "/admin/team", icon: Users, permission: PERMISSIONS.USER_MANAGE },
  { label: "Audit Logs", href: "/admin/audit-logs", icon: ScrollText, permission: PERMISSIONS.AUDIT_VIEW },
  { label: "Settings", href: "/admin/settings", icon: Settings, permission: PERMISSIONS.SETTINGS_MANAGE },
];

export function visibleNav(permissions: PermissionKey[]): AdminNavItem[] {
  return ADMIN_NAV.filter((item) => permissions.includes(item.permission)).map((item) => ({
    ...item,
    children: item.children?.filter((child) => permissions.includes(child.permission)),
  }));
}

export function hasPermission(permissions: PermissionKey[], permission: PermissionKey): boolean {
  return permissions.includes(permission);
}

export const ROLE_BADGES: Record<string, string> = {
  super_admin: "Super Admin",
  admission_manager: "Admission Manager",
  counsellor: "Counsellor",
  editor: "Content Editor",
};

export const QUICK_CREATE = [
  { label: "Add enquiry", href: "/admin/enquiries/new", permission: PERMISSIONS.ENQUIRY_MANAGE, icon: Megaphone },
  { label: "Create course", href: "/admin/courses/new", permission: PERMISSIONS.COURSE_MANAGE, icon: BookOpen },
  { label: "Add faculty member", href: "/admin/faculty/new", permission: PERMISSIONS.FACULTY_MANAGE, icon: UserRound },
  { label: "Publish notice", href: "/admin/news/new", permission: PERMISSIONS.CONTENT_MANAGE, icon: FileText },
  { label: "Add event", href: "/admin/events/new", permission: PERMISSIONS.CONTENT_MANAGE, icon: Building2 },
  { label: "Review applications", href: "/admin/admissions?status=submitted", permission: PERMISSIONS.APPLICATION_VIEW, icon: ClipboardList },
].filter((item) => true);

export { can };
