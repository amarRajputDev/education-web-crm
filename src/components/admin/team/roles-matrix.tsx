import { Fragment } from "react";
import { Check, Minus } from "lucide-react";
import { ALL_PERMISSIONS, ROLE_DEFINITIONS, type PermissionKey } from "@/lib/rbac";

function humanise(key: string): string {
  return key
    .replace(/\./g, " · ")
    .split(" ")
    .map((part) => (part === "·" ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join(" ");
}

function categoryOf(key: PermissionKey): string {
  return key.split(".")[0];
}

const CATEGORY_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  enquiries: "Enquiries",
  applications: "Admissions",
  courses: "Courses",
  faculty: "Faculty",
  departments: "Departments",
  content: "Content",
  media: "Media",
  students: "Students",
  reports: "Reports",
  users: "Users",
  settings: "Settings",
  audit: "Audit",
  notifications: "Notifications",
};

/** Read-only matrix of every role and the permissions it carries. */
export function RolesMatrix() {
  const roles = Object.entries(ROLE_DEFINITIONS);
  const categories: { key: string; label: string; permissions: PermissionKey[] }[] = [];
  for (const permission of ALL_PERMISSIONS) {
    const category = categoryOf(permission);
    let entry = categories.find((item) => item.key === category);
    if (!entry) {
      entry = { key: category, label: CATEGORY_LABELS[category] ?? category, permissions: [] };
      categories.push(entry);
    }
    entry.permissions.push(permission);
  }

  return (
    <div className="table-shell">
      <table className="data-table">
        <caption className="sr-only">
          Roles and permissions matrix — read-only view of what each role can access
        </caption>
        <thead>
          <tr>
            <th scope="col">Permission</th>
            {roles.map(([key, role]) => (
              <th key={key} scope="col" className="text-center">
                {role.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => (
            <Fragment key={category.key}>
              <tr>
                <td colSpan={roles.length + 1} className="!bg-royal-100/60 !py-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-royal">
                  {category.label}
                </td>
              </tr>
              {category.permissions.map((permission) => (
                <tr key={permission}>
                  <td className="font-semibold text-navy">
                    {humanise(permission)}
                    <span className="ml-2 font-mono text-[10px] text-slate-body">{permission}</span>
                  </td>
                  {roles.map(([key, role]) => {
                    const granted = role.permissions.includes(permission);
                    return (
                      <td key={key} className="text-center">
                        {granted ? (
                          <Check className="mx-auto h-4 w-4 text-success" aria-label="Granted" />
                        ) : (
                          <Minus className="mx-auto h-4 w-4 text-slate-body/40" aria-label="Not granted" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
