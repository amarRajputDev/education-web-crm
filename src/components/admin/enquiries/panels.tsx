"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Check, Loader2, Save } from "lucide-react";
import { completeFollowUp, createFollowUp, updateEnquiry, type EnquiryActionResult } from "@/app/admin/actions/enquiries";
import { ErrorSummary, FieldShell, Select, TextInput } from "@/components/ui/fields";
import { useToast } from "@/components/ui/toast";

const EMPTY: EnquiryActionResult = { ok: false, message: "" };

export function EnquiryPanel({
  enquiryId,
  status,
  priority,
  counsellorId,
  nextFollowupAt,
  statuses,
  counsellors,
  canAssign,
}: {
  enquiryId: number;
  status: string;
  priority: string;
  counsellorId: number | null;
  nextFollowupAt: string | null;
  statuses: { key: string; name: string }[];
  counsellors: { id: number; name: string }[];
  canAssign: boolean;
}) {
  const [state, action, pending] = useActionState(updateEnquiry, EMPTY);
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    if (state.ok && state.message) {
      toast.success(state.message);
      router.refresh();
    } else if (!state.ok && state.message) {
      toast.error("Could not update enquiry", state.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const followUpDefault = (() => {
    if (!nextFollowupAt) return "";
    const date = new Date(nextFollowupAt);
    const pad = (value: number) => String(value).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  })();

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="id" value={enquiryId} />
      <ErrorSummary errors={state.errors} />

      <div className="grid gap-4 sm:grid-cols-2">
        <FieldShell label="Status" required error={state.errors?.status}>
          {(id) => (
            <Select id={id} name="status" defaultValue={status} invalid={Boolean(state.errors?.status)}>
              {statuses.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.name}
                </option>
              ))}
            </Select>
          )}
        </FieldShell>

        <FieldShell label="Priority" required error={state.errors?.priority}>
          {(id) => (
            <Select id={id} name="priority" defaultValue={priority}>
              {["low", "medium", "high", "urgent"].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </Select>
          )}
        </FieldShell>

        <FieldShell label="Assigned counsellor" error={canAssign ? state.errors?.counsellorId : undefined}>
          {(id) =>
            canAssign ? (
              <Select id={id} name="counsellorId" defaultValue={counsellorId ? String(counsellorId) : ""}>
                <option value="">Unassigned</option>
                {counsellors.map((counsellor) => (
                  <option key={counsellor.id} value={counsellor.id}>
                    {counsellor.name}
                  </option>
                ))}
              </Select>
            ) : (
              <TextInput readOnly value={counsellors.find((item) => item.id === counsellorId)?.name ?? "Unassigned"} disabled />
            )
          }
        </FieldShell>

        <FieldShell label="Next follow-up" hint={canAssign ? undefined : "Only the assignee can reschedule here"}>
          {(id) => (
            <TextInput
              key={followUpDefault}
              id={id}
              name="nextFollowupAt"
              type="datetime-local"
              defaultValue={followUpDefault}
              disabled={!canAssign}
            />
          )}
        </FieldShell>
      </div>

      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
        {pending ? "Saving…" : "Save changes"}
      </button>

      {state.message ? (
        <p role="status" className={state.ok ? "text-xs font-semibold text-success" : "text-xs font-semibold text-danger"}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

export function FollowUpScheduler({
  enquiryId,
  counsellorId,
  counsellors,
}: {
  enquiryId: number;
  counsellorId: number | null;
  counsellors: { id: number; name: string }[];
}) {
  const [state, action, pending] = useActionState(createFollowUp, EMPTY);
  const router = useRouter();
  const toast = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      toast.success(state.message);
      formRef.current?.reset();
      router.refresh();
    } else if (state.message) {
      toast.error("Could not schedule follow-up", state.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-3">
      <input type="hidden" name="enquiryId" value={enquiryId} />
      <ErrorSummary errors={state.errors} />

      <div className="grid gap-3 sm:grid-cols-2">
        <FieldShell label="Due date & time" required error={state.errors?.dueAt}>
          {(id) => (
            <TextInput id={id} name="dueAt" type="datetime-local" invalid={Boolean(state.errors?.dueAt)} />
          )}
        </FieldShell>
        <FieldShell label="Responsible counsellor" required error={state.errors?.counsellorId}>
          {(id) => (
            <Select id={id} name="counsellorId" defaultValue={counsellorId ? String(counsellorId) : ""} invalid={Boolean(state.errors?.counsellorId)}>
              <option value="">Select…</option>
              {counsellors.map((counsellor) => (
                <option key={counsellor.id} value={counsellor.id}>
                  {counsellor.name}
                </option>
              ))}
            </Select>
          )}
        </FieldShell>
      </div>

      <FieldShell label="Reminder note" hint="What should the counsellor cover?">
        {(id) => <TextInput id={id} name="note" placeholder="e.g. Confirm counselling slot and share fee structure" />}
      </FieldShell>

      <button type="submit" className="btn btn-navy btn-sm" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <CalendarClock className="h-4 w-4" aria-hidden />}
        {pending ? "Scheduling…" : "Schedule follow-up"}
      </button>
    </form>
  );
}

export function CompleteFollowUpButton({ taskId, enquiryId }: { taskId: number; enquiryId: number }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useState(false);

  return (
    <form
      action={async (formData: FormData) => {
        formData.set("taskId", String(taskId));
        startTransition(true);
        try {
          const result = await completeFollowUp(formData);
          if (result.ok) toast.success(result.message);
          else toast.error("Could not complete follow-up", result.message);
          router.refresh();
        } finally {
          startTransition(false);
        }
      }}
    >
      <button type="submit" className="btn btn-outline btn-sm" disabled={pending} aria-label={`Mark follow-up #${taskId} complete`}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Check className="h-4 w-4" aria-hidden />}
        {pending ? "Saving…" : "Complete"}
      </button>
      <span className="sr-only">{enquiryId}</span>
    </form>
  );
}
