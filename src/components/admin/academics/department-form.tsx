"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Save } from "lucide-react";
import { saveDepartment } from "@/app/admin/actions/academics";
import { ErrorSummary, FieldShell, Select, TextArea, TextInput } from "@/components/ui/fields";
import { useToast } from "@/components/ui/toast";
import { ImageField } from "./image-field";
import {
  EMPTY_DEPARTMENT_VALUES,
  EMPTY_STATE,
  type AcademicsState,
  type DepartmentFormValues,
} from "./shared";

export function DepartmentForm({ values = EMPTY_DEPARTMENT_VALUES }: { values?: DepartmentFormValues }) {
  const [state, action, pending] = useActionState(saveDepartment, EMPTY_STATE);
  const toast = useToast();
  const router = useRouter();
  const seen = useRef<AcademicsState | null>(null);

  useEffect(() => {
    if (!state.message || seen.current === state) return;
    seen.current = state;
    if (state.ok) {
      toast.success(state.message);
      router.push("/admin/departments");
      router.refresh();
    } else {
      toast.error(state.message);
    }
  }, [state, toast, router]);

  const isEdit = values.id > 0;

  return (
    <form action={action} noValidate className="space-y-6">
      <input type="hidden" name="id" value={values.id || ""} />

      <ErrorSummary errors={state.errors} />

      <section className="card p-5 sm:p-6">
        <h2 className="text-[15px] font-bold text-navy">Department details</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FieldShell
            label="Department name"
            required
            error={state.errors?.name}
            hint="The public URL slug is generated from this name."
          >
            {(id) => (
              <TextInput
                id={id}
                name="name"
                defaultValue={values.name}
                placeholder="e.g. School of Computer Science & IT"
                required
                invalid={Boolean(state.errors?.name)}
              />
            )}
          </FieldShell>
          <FieldShell label="Code" error={state.errors?.code} hint="Optional short code, e.g. SCIT.">
            {(id) => <TextInput id={id} name="code" defaultValue={values.code} placeholder="SCIT" invalid={Boolean(state.errors?.code)} />}
          </FieldShell>
          <div className="sm:col-span-2">
            <FieldShell label="Overview" error={state.errors?.overview} hint="Optional, up to 3000 characters.">
              {(id) => <TextArea id={id} name="overview" rows={5} defaultValue={values.overview} invalid={Boolean(state.errors?.overview)} />}
            </FieldShell>
          </div>
          <div className="sm:col-span-2">
            <ImageField
              name="image"
              label="Banner image"
              value={values.image}
              error={state.errors?.image}
              placeholder="/images/gallery-1.jpg"
              hint="Choose an image path from the suggestions — a live preview appears next to the field."
            />
          </div>
        </div>
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="text-[15px] font-bold text-navy">Ordering, visibility & search</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FieldShell label="Sort order" required error={state.errors?.sortOrder} hint="Lower numbers appear first on the academics page.">
            {(id) => (
              <TextInput
                id={id}
                name="sortOrder"
                type="number"
                min={0}
                max={9999}
                defaultValue={values.sortOrder}
                invalid={Boolean(state.errors?.sortOrder)}
              />
            )}
          </FieldShell>
          <FieldShell label="Visibility" required error={state.errors?.visibility}>
            {(id) => (
              <Select id={id} name="visibility" defaultValue={values.visibility} invalid={Boolean(state.errors?.visibility)}>
                <option value="published">Published — shown on the website</option>
                <option value="draft">Draft — hidden from the website</option>
              </Select>
            )}
          </FieldShell>
          <FieldShell label="SEO title" error={state.errors?.seoTitle} hint="Optional, up to 180 characters.">
            {(id) => <TextInput id={id} name="seoTitle" defaultValue={values.seoTitle} invalid={Boolean(state.errors?.seoTitle)} />}
          </FieldShell>
          <FieldShell label="SEO description" error={state.errors?.seoDescription} hint="Optional, up to 320 characters.">
            {(id) => (
              <TextInput
                id={id}
                name="seoDescription"
                defaultValue={values.seoDescription}
                invalid={Boolean(state.errors?.seoDescription)}
              />
            )}
          </FieldShell>
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
            {pending ? "Saving…" : isEdit ? "Save changes" : "Create department"}
          </button>
          <Link href="/admin/departments" className="btn btn-ghost">
            Cancel
          </Link>
        </div>
        {state.message ? (
          <p
            role="status"
            className={
              state.ok
                ? "rounded-xl border border-[#c3e6d8] bg-success-100 px-3.5 py-2 text-xs font-semibold text-success"
                : "rounded-xl border border-[#f6cfcf] bg-danger-100 px-3.5 py-2 text-xs font-semibold text-danger"
            }
          >
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
