"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageSquarePlus, PhoneCall } from "lucide-react";
import { addEnquiryNote, type EnquiryActionResult } from "@/app/admin/actions/enquiries";
import { ErrorSummary, FieldShell, Select, TextArea, TextInput } from "@/components/ui/fields";
import { useToast } from "@/components/ui/toast";

const EMPTY: EnquiryActionResult = { ok: false, message: "" };

const NOTE_TYPES = [
  { value: "call", label: "Phone call" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Email" },
  { value: "meeting", label: "Meeting / visit" },
  { value: "note", label: "Internal note" },
];

export function NoteForm({ enquiryId }: { enquiryId: number }) {
  const [state, action, pending] = useActionState(addEnquiryNote, EMPTY);
  const router = useRouter();
  const toast = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      toast.success(state.message);
      formRef.current?.reset();
      router.refresh();
    } else if (state.message) {
      toast.error("Could not save the note", state.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-3">
      <input type="hidden" name="enquiryId" value={enquiryId} />
      <ErrorSummary errors={state.errors} />

      <div className="grid gap-3 sm:grid-cols-2">
        <FieldShell label="Contact type" required>
          {(id) => (
            <Select id={id} name="noteType" defaultValue="call">
              {NOTE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </Select>
          )}
        </FieldShell>
        <FieldShell label="Outcome" hint="Short result of the contact">
          {(id) => <TextInput id={id} name="outcome" placeholder="e.g. Counselling booked for Friday" />}
        </FieldShell>
      </div>

      <FieldShell label="Note" required error={state.errors?.body}>
        {(id) => (
          <TextArea
            id={id}
            name="body"
            rows={3}
            invalid={Boolean(state.errors?.body)}
            placeholder="What was discussed? What happens next?"
          />
        )}
      </FieldShell>

      <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <MessageSquarePlus className="h-4 w-4" aria-hidden />}
        {pending ? "Saving…" : "Add to contact history"}
      </button>
    </form>
  );
}

export function QuickCallNote({ enquiryId, phone }: { enquiryId: number; phone: string }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn btn-outline btn-sm">
        <PhoneCall className="h-4 w-4" aria-hidden />
        Log a call
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-offwhite/60 p-4">
      <p className="mb-2 text-xs font-bold text-navy">
        Logging a call to <span className="font-mono">{phone}</span>
      </p>
      <NoteForm enquiryId={enquiryId} />
      <button type="button" onClick={() => setOpen(false)} className="mt-2 text-[11px] font-bold text-slate-body hover:underline">
        Cancel
      </button>
    </div>
  );
}
