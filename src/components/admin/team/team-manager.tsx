"use client";

import { useActionState, useState, useTransition } from "react";
import { KeyRound, LogOut, Pencil, Plus, Power } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  createUser,
  forceLogoutUser,
  resetPassword,
  updateUser,
  type TeamActionState,
} from "@/app/admin/actions/team";
import { useActionFeedback } from "@/components/admin/content-hub/use-action-feedback";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import { ErrorSummary, FieldShell, Select, TextInput } from "@/components/ui/fields";
import { initials, relativeTime } from "@/lib/format";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";

export type TeamUser = {
  id: number;
  name: string;
  email: string;
  phone: string;
  designation: string;
  role_key: string;
  role_name: string;
  status: string;
  last_login_at: string | null;
  session_count: number;
};

export type TeamRole = { key: string; name: string; description: string };

const EMPTY: TeamActionState = {};

const ROLE_TONES: Record<string, "gold" | "info" | "neutral" | "warning"> = {
  super_admin: "gold",
  admission_manager: "info",
  counsellor: "neutral",
  editor: "warning",
};

const STATUS_TONES: Record<string, "success" | "warning" | "danger"> = {
  active: "success",
  invited: "warning",
  inactive: "danger",
};

function Avatar({ name }: { name: string }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy text-[11px] font-extrabold text-gold">
      {initials(name)}
    </span>
  );
}

function RowButton({
  label,
  onClick,
  icon: Icon,
  danger = false,
}: {
  label: string;
  onClick: () => void;
  icon: typeof Pencil;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        "rounded-lg border border-line bg-white p-1.5 transition",
        danger ? "text-danger hover:border-danger hover:bg-danger-100" : "text-slate-body hover:border-royal hover:text-royal",
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* dialogs                                                             */
/* ------------------------------------------------------------------ */

function NewUserDialog({ roles, onClose }: { roles: TeamRole[]; onClose: () => void }) {
  const [state, formAction, pending] = useActionState(createUser, EMPTY);
  useActionFeedback(state, "User created", onClose);

  return (
    <Dialog
      open
      onClose={onClose}
      title="New user"
      description="Create a panel login. The user can change their password from their profile."
      footer={
        <>
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={pending}>
            Cancel
          </button>
          <button type="submit" form="new-user-form" className="btn btn-primary" disabled={pending}>
            {pending ? "Creating…" : "Create user"}
          </button>
        </>
      }
    >
      <form id="new-user-form" action={formAction} className="space-y-4" noValidate>
        <ErrorSummary errors={state.errors} />
        <FieldShell label="Full name" required error={state.errors?.name}>
          {(id) => (
            <TextInput id={id} name="name" required autoComplete="name" invalid={Boolean(state.errors?.name)} />
          )}
        </FieldShell>
        <FieldShell label="Email" required error={state.errors?.email}>
          {(id) => (
            <TextInput
              id={id}
              name="email"
              type="email"
              required
              autoComplete="email"
              invalid={Boolean(state.errors?.email)}
            />
          )}
        </FieldShell>
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldShell label="Designation" error={state.errors?.designation} hint="e.g. Senior Counsellor">
            {(id) => <TextInput id={id} name="designation" invalid={Boolean(state.errors?.designation)} />}
          </FieldShell>
          <FieldShell label="Role" required error={state.errors?.roleKey}>
            {(id) => (
              <Select id={id} name="roleKey" defaultValue="counsellor" invalid={Boolean(state.errors?.roleKey)}>
                {roles.map((role) => (
                  <option key={role.key} value={role.key}>
                    {role.name}
                  </option>
                ))}
              </Select>
            )}
          </FieldShell>
          <FieldShell label="Status" required error={state.errors?.status}>
            {(id) => (
              <Select id={id} name="status" defaultValue="active" invalid={Boolean(state.errors?.status)}>
                <option value="active">Active</option>
                <option value="invited">Invited</option>
                <option value="inactive">Inactive</option>
              </Select>
            )}
          </FieldShell>
          <FieldShell
            label="Initial password"
            required
            error={state.errors?.password}
            hint="At least 8 characters. The user should change it after first sign-in."
          >
            {(id) => (
              <TextInput
                id={id}
                name="password"
                type="password"
                required
                autoComplete="new-password"
                invalid={Boolean(state.errors?.password)}
              />
            )}
          </FieldShell>
        </div>
      </form>
    </Dialog>
  );
}

function EditUserDialog({
  user,
  roles,
  onClose,
}: {
  user: TeamUser;
  roles: TeamRole[];
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(updateUser, EMPTY);
  useActionFeedback(state, "User updated", onClose);

  return (
    <Dialog
      open
      onClose={onClose}
      title={`Edit ${user.name}`}
      description="Change role, status and contact details."
      footer={
        <>
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={pending}>
            Cancel
          </button>
          <button type="submit" form="edit-user-form" className="btn btn-primary" disabled={pending}>
            {pending ? "Saving…" : "Save changes"}
          </button>
        </>
      }
    >
      <form id="edit-user-form" action={formAction} className="space-y-4" noValidate>
        <ErrorSummary errors={state.errors} />
        <input type="hidden" name="userId" value={user.id} />
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldShell label="Full name" required error={state.errors?.name}>
            {(id) => (
              <TextInput
                id={id}
                name="name"
                defaultValue={user.name}
                required
                invalid={Boolean(state.errors?.name)}
              />
            )}
          </FieldShell>
          <FieldShell label="Email" required error={state.errors?.email}>
            {(id) => (
              <TextInput
                id={id}
                name="email"
                type="email"
                defaultValue={user.email}
                required
                autoComplete="email"
                invalid={Boolean(state.errors?.email)}
              />
            )}
          </FieldShell>
          <FieldShell label="Phone" error={state.errors?.phone}>
            {(id) => (
              <TextInput id={id} name="phone" type="tel" defaultValue={user.phone} invalid={Boolean(state.errors?.phone)} />
            )}
          </FieldShell>
          <FieldShell label="Designation" error={state.errors?.designation}>
            {(id) => (
              <TextInput
                id={id}
                name="designation"
                defaultValue={user.designation}
                invalid={Boolean(state.errors?.designation)}
              />
            )}
          </FieldShell>
          <FieldShell label="Role" required error={state.errors?.roleKey}>
            {(id) => (
              <Select id={id} name="roleKey" defaultValue={user.role_key} invalid={Boolean(state.errors?.roleKey)}>
                {roles.map((role) => (
                  <option key={role.key} value={role.key}>
                    {role.name}
                  </option>
                ))}
              </Select>
            )}
          </FieldShell>
          <FieldShell
            label="Status"
            required
            error={state.errors?.status}
            hint="Deactivating a user also signs them out of every device."
          >
            {(id) => (
              <Select id={id} name="status" defaultValue={user.status} invalid={Boolean(state.errors?.status)}>
                <option value="active">Active</option>
                <option value="invited">Invited</option>
                <option value="inactive">Inactive</option>
              </Select>
            )}
          </FieldShell>
        </div>
        <p className="rounded-xl border border-line bg-offwhite/60 p-3 text-xs text-slate-body">
          Signed in as <span className="font-semibold text-navy">{user.email}</span> — the last login was{" "}
          {relativeTime(user.last_login_at)}.
        </p>
      </form>
    </Dialog>
  );
}

function ResetPasswordDialog({ user, onClose }: { user: TeamUser; onClose: () => void }) {
  const [state, formAction, pending] = useActionState(resetPassword, EMPTY);
  useActionFeedback(state, "Password reset", onClose);

  return (
    <Dialog
      open
      onClose={onClose}
      title={`Reset password for ${user.name}`}
      description="Sets a new password and immediately signs the user out of every device."
      footer={
        <>
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={pending}>
            Cancel
          </button>
          <button type="submit" form="reset-password-form" className="btn btn-danger" disabled={pending}>
            {pending ? "Resetting…" : "Reset password"}
          </button>
        </>
      }
    >
      <form id="reset-password-form" action={formAction} className="space-y-4" noValidate>
        <ErrorSummary errors={state.errors} />
        <input type="hidden" name="userId" value={user.id} />
        <FieldShell
          label="New password"
          required
          error={state.errors?.password}
          hint="At least 8 characters."
        >
          {(id) => (
            <TextInput
              id={id}
              name="password"
              type="password"
              required
              autoComplete="new-password"
              invalid={Boolean(state.errors?.password)}
            />
          )}
        </FieldShell>
        <FieldShell label="Confirm new password" required error={state.errors?.confirm}>
          {(id) => (
            <TextInput
              id={id}
              name="confirm"
              type="password"
              required
              autoComplete="new-password"
              invalid={Boolean(state.errors?.confirm)}
            />
          )}
        </FieldShell>
      </form>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* manager                                                             */
/* ------------------------------------------------------------------ */

type ManagerAction =
  | { type: "new" }
  | { type: "edit"; user: TeamUser }
  | { type: "reset"; user: TeamUser }
  | { type: "toggle"; user: TeamUser }
  | { type: "signout"; user: TeamUser };

export function TeamManager({
  users,
  roles,
  currentUserId,
}: {
  users: TeamUser[];
  roles: TeamRole[];
  currentUserId: number;
}) {
  const router = useRouter();
  const toast = useToast();
  const [action, setAction] = useState<ManagerAction | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  const close = () => setAction(null);

  const runToggle = (user: TeamUser) => {
    const nextStatus = user.status === "active" ? "inactive" : "active";
    startTransition(async () => {
      setBusyId(user.id);
      const formData = new FormData();
      formData.set("userId", String(user.id));
      formData.set("name", user.name);
      formData.set("email", user.email);
      formData.set("phone", user.phone ?? "");
      formData.set("designation", user.designation ?? "");
      formData.set("roleKey", user.role_key);
      formData.set("status", nextStatus);
      const result = await updateUser(EMPTY, formData);
      setBusyId(null);
      if (result.ok) toast.success(result.message ?? "Updated", `Status is now ${nextStatus}.`);
      else toast.error("Could not update user", result.message ?? "Please try again.");
      close();
      router.refresh();
    });
  };

  const runSignout = (user: TeamUser) => {
    startTransition(async () => {
      setBusyId(user.id);
      const result = await forceLogoutUser(user.id);
      setBusyId(null);
      if (result.ok) toast.success(result.message ?? "Sessions revoked.");
      else toast.error("Could not sign out user", result.message ?? "Please try again.");
      close();
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-body">
          {users.length} team member{users.length === 1 ? "" : "s"} · role changes take effect on the next request.
        </p>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => setAction({ type: "new" })}>
          <Plus className="h-4 w-4" aria-hidden />
          New user
        </button>
      </div>

      <div className="table-shell">
        <table className="data-table">
          <caption className="sr-only">Team members with role, status and account actions</caption>
          <thead>
            <tr>
              <th scope="col">Member</th>
              <th scope="col">Designation</th>
              <th scope="col">Role</th>
              <th scope="col">Status</th>
              <th scope="col">Last login</th>
              <th scope="col" className="text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <Avatar name={user.name} />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-navy">
                        {user.name}
                        {user.id === currentUserId ? (
                          <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-royal">(you)</span>
                        ) : null}
                      </p>
                      <p className="truncate text-xs text-slate-body">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap text-slate-body">{user.designation || "—"}</td>
                <td>
                  <Badge tone={ROLE_TONES[user.role_key] ?? "neutral"}>{user.role_name}</Badge>
                </td>
                <td>
                  <Badge tone={STATUS_TONES[user.status] ?? "neutral"} dot>
                    {user.status}
                  </Badge>
                </td>
                <td className="whitespace-nowrap text-slate-body">{relativeTime(user.last_login_at)}</td>
                <td>
                  <div className="flex flex-wrap items-center justify-end gap-1.5">
                    <RowButton label={`Edit ${user.name}`} icon={Pencil} onClick={() => setAction({ type: "edit", user })} />
                    <RowButton
                      label={`Reset password for ${user.name}`}
                      icon={KeyRound}
                      onClick={() => setAction({ type: "reset", user })}
                    />
                    <RowButton
                      label={user.status === "active" ? `Deactivate ${user.name}` : `Activate ${user.name}`}
                      icon={Power}
                      danger={user.status === "active"}
                      onClick={() => setAction({ type: "toggle", user })}
                    />
                    <RowButton
                      label={`Sign out ${user.name} from all sessions`}
                      icon={LogOut}
                      danger
                      onClick={() => setAction({ type: "signout", user })}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {action?.type === "new" ? <NewUserDialog roles={roles} onClose={close} /> : null}
      {action?.type === "edit" ? (
        <EditUserDialog user={action.user} roles={roles} onClose={close} />
      ) : null}
      {action?.type === "reset" ? <ResetPasswordDialog user={action.user} onClose={close} /> : null}
      {action?.type === "toggle" ? (
        <ConfirmDialog
          open
          onClose={close}
          onConfirm={() => runToggle(action.user)}
          loading={isPending || busyId === action.user.id}
          title={action.user.status === "active" ? "Deactivate user" : "Activate user"}
          confirmLabel={action.user.status === "active" ? "Deactivate" : "Activate"}
          tone={action.user.status === "active" ? "danger" : "primary"}
          message={
            action.user.status === "active"
              ? `Deactivate ${action.user.name}? They will lose access immediately and all their sessions will be signed out.`
              : `Reactivate ${action.user.name}? They will be able to sign in again with their existing password.`
          }
        />
      ) : null}
      {action?.type === "signout" ? (
        <ConfirmDialog
          open
          onClose={close}
          onConfirm={() => runSignout(action.user)}
          loading={isPending || busyId === action.user.id}
          title="Sign out everywhere"
          confirmLabel="Sign out sessions"
          message={`This signs ${action.user.name} out of ${
            action.user.session_count > 0 ? `${action.user.session_count} active session${action.user.session_count === 1 ? "" : "s"}` : "all sessions"
          } immediately. Their password is unchanged and they can sign in again.`}
        />
      ) : null}
    </div>
  );
}
