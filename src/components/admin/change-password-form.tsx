"use client";

import { useActionState } from "react";
import { KeyRound } from "lucide-react";
import { changeOwnPassword, type ProfileActionState } from "@/app/admin/actions/profile";
import { useActionFeedback } from "@/components/admin/content-hub/use-action-feedback";
import { ErrorSummary, FieldShell, TextInput } from "@/components/ui/fields";

const EMPTY: ProfileActionState = {};

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changeOwnPassword, EMPTY);
  useActionFeedback(state, "Password updated");

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <ErrorSummary errors={state.errors} />
      <FieldShell label="Current password" required error={state.errors?.currentPassword}>
        {(id) => (
          <TextInput
            id={id}
            name="currentPassword"
            type="password"
            required
            autoComplete="current-password"
            invalid={Boolean(state.errors?.currentPassword)}
          />
        )}
      </FieldShell>
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldShell
          label="New password"
          required
          error={state.errors?.newPassword}
          hint="At least 8 characters, and different from your current password."
        >
          {(id) => (
            <TextInput
              id={id}
              name="newPassword"
              type="password"
              required
              autoComplete="new-password"
              invalid={Boolean(state.errors?.newPassword)}
            />
          )}
        </FieldShell>
        <FieldShell label="Confirm new password" required error={state.errors?.confirmPassword}>
          {(id) => (
            <TextInput
              id={id}
              name="confirmPassword"
              type="password"
              required
              autoComplete="new-password"
              invalid={Boolean(state.errors?.confirmPassword)}
            />
          )}
        </FieldShell>
      </div>
      <div className="flex items-center justify-end gap-3 border-t border-line pt-4">
        <p role="status" aria-live="polite" className="mr-auto text-xs font-semibold">
          {state.ok ? <span className="text-success">{state.message}</span> : null}
        </p>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          <KeyRound className="h-4 w-4" aria-hidden />
          {pending ? "Updating…" : "Update password"}
        </button>
      </div>
    </form>
  );
}
