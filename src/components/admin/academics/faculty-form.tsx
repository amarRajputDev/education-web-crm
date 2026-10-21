"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Save } from "lucide-react";
import { saveFaculty } from "@/app/admin/actions/academics";
import { ErrorSummary, FieldShell, Select, TextArea, TextInput } from "@/components/ui/fields";
import { useToast } from "@/components/ui/toast";
import { ImageField } from "./image-field";
import { EMPTY_FACULTY_VALUES, EMPTY_STATE, type AcademicsState, type FacultyFormValues } from "./shared";

export function FacultyForm({
  departments,
  values = EMPTY_FACULTY_VALUES,
}: {
  departments: { id: number; name: string }[];
  values?: FacultyFormValues;
}) {
  const [state, action, pending] = useActionState(saveFaculty, EMPTY_STATE);
  const toast = useToast();
  const router = useRouter();
  const seen = useRef<AcademicsState | null>(null);

  useEffect(() => {
    if (!state.message || seen.current === state) return;
    seen.current = state;
    if (state.ok) {
      toast.success(state.message);
      router.push("/admin/faculty");
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
        <h2 className="text-[15px] font-bold text-navy">Profile</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FieldShell label="Full name" required error={state.errors?.name}>
            {(id) => (
              <TextInput
                id={id}
                name="name"
                defaultValue={values.name}
                placeholder="e.g. Dr. Meera Raghavan"
                required
                invalid={Boolean(state.errors?.name)}
              />
            )}
          </FieldShell>
          <FieldShell label="Designation" required error={state.errors?.designation} hint="e.g. Professor & Head">
            {(id) => (
              <TextInput
                id={id}
                name="designation"
                defaultValue={values.designation}
                placeholder="Professor & Head"
                invalid={Boolean(state.errors?.designation)}
              />
            )}
          </FieldShell>
          <FieldShell label="Department" required error={state.errors?.departmentId}>
            {(id) => (
              <Select
                id={id}
                name="departmentId"
                defaultValue={values.departmentId ? String(values.departmentId) : ""}
                invalid={Boolean(state.errors?.departmentId)}
              >
                <option value="">Select a department</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </Select>
            )}
          </FieldShell>
          <FieldShell label="Qualifications" required error={state.errors?.qualifications} hint="e.g. Ph.D. (CSE), M.Tech">
            {(id) => (
              <TextInput
                id={id}
                name="qualifications"
                defaultValue={values.qualifications}
                placeholder="Ph.D. (CSE), M.Tech"
                invalid={Boolean(state.errors?.qualifications)}
              />
            )}
          </FieldShell>
          <FieldShell label="Experience (years)" required error={state.errors?.experienceYears}>
            {(id) => (
              <TextInput
                id={id}
                name="experienceYears"
                type="number"
                min={0}
                max={60}
                defaultValue={values.experienceYears}
                invalid={Boolean(state.errors?.experienceYears)}
              />
            )}
          </FieldShell>
          <FieldShell label="Email" error={state.errors?.email}>
            {(id) => (
              <TextInput
                id={id}
                name="email"
                type="email"
                defaultValue={values.email}
                placeholder="faculty@aarohan.demo"
                invalid={Boolean(state.errors?.email)}
              />
            )}
          </FieldShell>
          <FieldShell label="Phone" error={state.errors?.phone}>
            {(id) => <TextInput id={id} name="phone" type="tel" defaultValue={values.phone} invalid={Boolean(state.errors?.phone)} />}
          </FieldShell>
          <div className="sm:col-span-2">
            <ImageField
              name="photo"
              label="Photo"
              value={values.photo}
              error={state.errors?.photo}
              placeholder="/images/p-01.jpg"
              hint="Portrait paths p-01…p-16 are available in the suggestions, with a live preview."
            />
          </div>
          <div className="sm:col-span-2">
            <FieldShell label="Short bio" error={state.errors?.bio} hint="Optional, up to 2000 characters.">
              {(id) => <TextArea id={id} name="bio" rows={4} defaultValue={values.bio} invalid={Boolean(state.errors?.bio)} />}
            </FieldShell>
          </div>
        </div>
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="text-[15px] font-bold text-navy">Research & directory order</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FieldShell
              label="Research interests"
              error={state.errors?.researchInterests}
              hint="Comma separated — stored as a JSON array, e.g. Distributed systems, Machine learning, Cloud security."
            >
              {(id) => (
                <TextInput
                  id={id}
                  name="researchInterests"
                  defaultValue={values.researchInterests}
                  placeholder="Distributed systems, Machine learning"
                  invalid={Boolean(state.errors?.researchInterests)}
                />
              )}
            </FieldShell>
          </div>
          <FieldShell label="Directory order" required error={state.errors?.displayOrder} hint="Lower numbers appear first.">
            {(id) => (
              <TextInput
                id={id}
                name="displayOrder"
                type="number"
                min={0}
                max={9999}
                defaultValue={values.displayOrder}
                invalid={Boolean(state.errors?.displayOrder)}
              />
            )}
          </FieldShell>
          <FieldShell label="Visibility" required error={state.errors?.visibility}>
            {(id) => (
              <Select id={id} name="visibility" defaultValue={values.visibility} invalid={Boolean(state.errors?.visibility)}>
                <option value="published">Published — shown in the directory</option>
                <option value="draft">Draft — hidden from the directory</option>
              </Select>
            )}
          </FieldShell>
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
            {pending ? "Saving…" : isEdit ? "Save changes" : "Add faculty member"}
          </button>
          <Link href="/admin/faculty" className="btn btn-ghost">
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
