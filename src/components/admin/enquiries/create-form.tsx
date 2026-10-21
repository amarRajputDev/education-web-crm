"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Save } from "lucide-react";
import { createEnquiry, type EnquiryActionResult } from "@/app/admin/actions/enquiries";
import { ErrorSummary, FieldShell, Select, TextArea, TextInput } from "@/components/ui/fields";
import { useToast } from "@/components/ui/toast";

const EMPTY: EnquiryActionResult = { ok: false, message: "" };

export function EnquiryCreateForm({
  courses,
  counsellors,
  canAssign,
}: {
  courses: { id: number; name: string }[];
  counsellors: { id: number; name: string }[];
  canAssign: boolean;
}) {
  const [state, action, pending] = useActionState(createEnquiry, EMPTY);
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    if (state.ok) {
      toast.success(state.message, state.ref ? `Reference ${state.ref}` : undefined);
      if (state.id) router.push(`/admin/enquiries/${state.id}`);
      else router.refresh();
    } else if (state.message) {
      toast.error("Could not create enquiry", state.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={action} className="space-y-5">
      <ErrorSummary errors={state.errors} />

      <div className="grid gap-4 sm:grid-cols-2">
        <FieldShell label="Student name" required error={state.errors?.name}>
          {(id) => <TextInput id={id} name="name" autoComplete="off" placeholder="e.g. Ananya Krishnan" invalid={Boolean(state.errors?.name)} />}
        </FieldShell>
        <FieldShell label="Mobile number" required error={state.errors?.phone}>
          {(id) => <TextInput id={id} name="phone" type="tel" inputMode="tel" placeholder="+91 98765 43210" invalid={Boolean(state.errors?.phone)} />}
        </FieldShell>
        <FieldShell label="Email address" error={state.errors?.email}>
          {(id) => <TextInput id={id} name="email" type="email" placeholder="student@example.com" invalid={Boolean(state.errors?.email)} />}
        </FieldShell>
        <FieldShell label="Interested course" error={state.errors?.courseId}>
          {(id) => (
            <Select id={id} name="courseId" defaultValue="">
              <option value="">Not specified</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </Select>
          )}
        </FieldShell>
        <FieldShell label="Enquiry source" required>
          {(id) => (
            <Select id={id} name="source" defaultValue="Phone">
              {["Website", "Phone", "Walk-in", "Social Media", "Referral", "Campaign", "Event", "Other"].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </Select>
          )}
        </FieldShell>
        <FieldShell label="Preferred contact" required>
          {(id) => (
            <Select id={id} name="preferredContact" defaultValue="Phone">
              {["Phone", "WhatsApp", "Email"].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </Select>
          )}
        </FieldShell>
        <FieldShell label="Priority" required>
          {(id) => (
            <Select id={id} name="priority" defaultValue="medium">
              {["low", "medium", "high", "urgent"].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </Select>
          )}
        </FieldShell>
        <FieldShell label="Assign to" error={state.errors?.counsellorId}>
          {(id) => (
            <Select id={id} name="counsellorId" defaultValue={canAssign ? "" : ""}>
              <option value="">{canAssign ? "Unassigned (defaults to me)" : "Me"}</option>
              {counsellors.map((counsellor) => (
                <option key={counsellor.id} value={counsellor.id}>
                  {counsellor.name}
                </option>
              ))}
            </Select>
          )}
        </FieldShell>
        <FieldShell label="First follow-up" hint="Optional — creates a task immediately">
          {(id) => <TextInput id={id} name="nextFollowupAt" type="datetime-local" />}
        </FieldShell>
        <div className="sm:col-span-2">
          <FieldShell label="Initial note" hint="What was discussed when this enquiry was captured">
            {(id) => <TextArea id={id} name="message" rows={4} placeholder="Asked about B.Tech eligibility and hostel availability." />}
          </FieldShell>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
          {pending ? "Saving…" : "Create enquiry"}
        </button>
        <Link href="/admin/enquiries" className="btn btn-ghost">
          Cancel
        </Link>
        {state.message && !state.ok ? (
          <p role="alert" className="text-xs font-semibold text-danger">
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
