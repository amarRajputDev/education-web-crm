"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Save } from "lucide-react";
import { saveCourse } from "@/app/admin/actions/academics";
import { ErrorSummary, FieldShell, Select, TextArea, TextInput } from "@/components/ui/fields";
import { useToast } from "@/components/ui/toast";
import { ImageField } from "./image-field";
import {
  CURRICULUM_HINT,
  EMPTY_COURSE_VALUES,
  EMPTY_STATE,
  FAQ_HINT,
  LINE_HINT,
  type AcademicsState,
  type CourseFormValues,
} from "./shared";

const DEGREE_LEVELS = ["Undergraduate", "Postgraduate", "Diploma", "Certificate", "Doctorate"];
const STUDY_MODES = ["Full-time", "Part-time", "Online", "Hybrid"];

export function CourseForm({
  departments,
  sessions,
  values = EMPTY_COURSE_VALUES,
}: {
  departments: { id: number; name: string }[];
  sessions: { id: number; name: string }[];
  values?: CourseFormValues;
}) {
  const [state, action, pending] = useActionState(saveCourse, EMPTY_STATE);
  const toast = useToast();
  const router = useRouter();
  const seen = useRef<AcademicsState | null>(null);

  useEffect(() => {
    if (!state.message || seen.current === state) return;
    seen.current = state;
    if (state.ok) {
      toast.success(state.message);
      router.push("/admin/courses");
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
        <h2 className="text-[15px] font-bold text-navy">Programme basics</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FieldShell label="Programme name" required error={state.errors?.name}>
            {(id) => (
              <TextInput
                id={id}
                name="name"
                defaultValue={values.name}
                placeholder="e.g. B.Tech Computer Science & Engineering"
                required
                invalid={Boolean(state.errors?.name)}
              />
            )}
          </FieldShell>
          <FieldShell label="Course code" error={state.errors?.code} hint="Short code shown on listings, e.g. BT-CSE">
            {(id) => (
              <TextInput
                id={id}
                name="code"
                defaultValue={values.code}
                placeholder="BT-CSE"
                invalid={Boolean(state.errors?.code)}
              />
            )}
          </FieldShell>
          <FieldShell label="Degree level" required error={state.errors?.degreeLevel}>
            {(id) => (
              <Select id={id} name="degreeLevel" defaultValue={values.degreeLevel} invalid={Boolean(state.errors?.degreeLevel)}>
                {DEGREE_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </Select>
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
          <FieldShell label="Duration (months)" required error={state.errors?.durationMonths}>
            {(id) => (
              <TextInput
                id={id}
                name="durationMonths"
                type="number"
                min={1}
                max={120}
                defaultValue={values.durationMonths}
                invalid={Boolean(state.errors?.durationMonths)}
              />
            )}
          </FieldShell>
          <FieldShell label="Duration label" required error={state.errors?.durationLabel} hint="Human readable, e.g. 4 Years">
            {(id) => (
              <TextInput
                id={id}
                name="durationLabel"
                defaultValue={values.durationLabel}
                placeholder="4 Years"
                invalid={Boolean(state.errors?.durationLabel)}
              />
            )}
          </FieldShell>
          <FieldShell label="Study mode" required error={state.errors?.studyMode}>
            {(id) => (
              <Select id={id} name="studyMode" defaultValue={values.studyMode} invalid={Boolean(state.errors?.studyMode)}>
                {STUDY_MODES.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </Select>
            )}
          </FieldShell>
          <FieldShell label="Seats" required error={state.errors?.seats}>
            {(id) => (
              <TextInput
                id={id}
                name="seats"
                type="number"
                min={1}
                max={2000}
                defaultValue={values.seats}
                invalid={Boolean(state.errors?.seats)}
              />
            )}
          </FieldShell>
        </div>
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="text-[15px] font-bold text-navy">Programme content</h2>
        <div className="mt-4 grid gap-4">
          <FieldShell label="Eligibility" required error={state.errors?.eligibility}>
            {(id) => (
              <TextArea
                id={id}
                name="eligibility"
                rows={3}
                defaultValue={values.eligibility}
                placeholder="10+2 with Physics, Chemistry and Mathematics, minimum 50% aggregate…"
                invalid={Boolean(state.errors?.eligibility)}
              />
            )}
          </FieldShell>
          <FieldShell
            label="Short overview"
            required
            error={state.errors?.overview}
            hint="Shown on listing cards and in the page header (20–900 characters)."
          >
            {(id) => (
              <TextArea
                id={id}
                name="overview"
                rows={3}
                defaultValue={values.overview}
                invalid={Boolean(state.errors?.overview)}
              />
            )}
          </FieldShell>
          <FieldShell label="Full description" error={state.errors?.description} hint="Optional long-form copy shown on the programme page.">
            {(id) => <TextArea id={id} name="description" rows={6} defaultValue={values.description} invalid={Boolean(state.errors?.description)} />}
          </FieldShell>
          <div className="grid gap-4 lg:grid-cols-2">
            <FieldShell label="Learning outcomes" error={state.errors?.learningOutcomes} hint={LINE_HINT}>
              {(id) => (
                <TextArea
                  id={id}
                  name="learningOutcomes"
                  rows={5}
                  defaultValue={values.learningOutcomes}
                  placeholder={"Design and implement software systems\nApply algorithms to real problems"}
                  invalid={Boolean(state.errors?.learningOutcomes)}
                />
              )}
            </FieldShell>
            <FieldShell label="Career paths" error={state.errors?.careers} hint={LINE_HINT}>
              {(id) => (
                <TextArea
                  id={id}
                  name="careers"
                  rows={5}
                  defaultValue={values.careers}
                  placeholder={"Software Engineer\nData Engineer\nTechnical Product Analyst"}
                  invalid={Boolean(state.errors?.careers)}
                />
              )}
            </FieldShell>
          </div>
          <FieldShell label="Curriculum" error={state.errors?.curriculum} hint={CURRICULUM_HINT}>
            {(id) => (
              <TextArea
                id={id}
                name="curriculum"
                rows={8}
                defaultValue={values.curriculum}
                placeholder={"# Semester I\nEngineering Mathematics I\nProgramming Fundamentals\n\n# Semester II\nData Structures\nObject Oriented Programming"}
                invalid={Boolean(state.errors?.curriculum)}
              />
            )}
          </FieldShell>
          <FieldShell label="Programme FAQs" error={state.errors?.faqs} hint={FAQ_HINT}>
            {(id) => (
              <TextArea
                id={id}
                name="faqs"
                rows={5}
                defaultValue={values.faqs}
                placeholder={"# Is there a compulsory internship?\nYes. A six-week industry internship is completed during Semester VI."}
                invalid={Boolean(state.errors?.faqs)}
              />
            )}
          </FieldShell>
        </div>
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="text-[15px] font-bold text-navy">Fees, media & sessions</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FieldShell label="Fee per semester (₹)" required error={state.errors?.feeAmount}>
            {(id) => (
              <TextInput
                id={id}
                name="feeAmount"
                type="number"
                min={0}
                step={500}
                defaultValue={values.feeAmount}
                invalid={Boolean(state.errors?.feeAmount)}
              />
            )}
          </FieldShell>
          <FieldShell label="Fee note" error={state.errors?.feeNote} hint="e.g. Per semester, inclusive of examination charges.">
            {(id) => <TextInput id={id} name="feeNote" defaultValue={values.feeNote} invalid={Boolean(state.errors?.feeNote)} />}
          </FieldShell>
          <div className="sm:col-span-2">
            <FieldShell label="Scholarship information" error={state.errors?.scholarshipInfo}>
              {(id) => (
                <TextArea
                  id={id}
                  name="scholarshipInfo"
                  rows={3}
                  defaultValue={values.scholarshipInfo}
                  invalid={Boolean(state.errors?.scholarshipInfo)}
                />
              )}
            </FieldShell>
          </div>
          <div className="sm:col-span-2">
            <ImageField
              name="image"
              label="Cover image"
              value={values.image}
              error={state.errors?.image}
              hint="Pick an image path from the suggestions — a live preview is shown next to the field."
            />
          </div>
        </div>

        <fieldset className="mt-5">
          <legend className="label">Admission sessions</legend>
          <div className="flex flex-wrap gap-2">
            {sessions.map((session) => (
              <label
                key={session.id}
                className="flex items-center gap-2 rounded-xl border border-line bg-paper px-3 py-2 text-xs font-semibold text-navy"
              >
                <input
                  type="checkbox"
                  name="sessionIds"
                  value={session.id}
                  defaultChecked={values.sessionIds.includes(session.id)}
                  className="h-4 w-4 accent-[#0b6b5c]"
                />
                {session.name}
              </label>
            ))}
          </div>
          <p className="hint mt-1">
            {sessions.length > 0
              ? "Selections are stored as a JSON array of session ids and drive the application form."
              : "No academic sessions exist yet — sessions are seeded with the demo database."}
          </p>
        </fieldset>
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="text-[15px] font-bold text-navy">Publishing & search</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FieldShell label="Status" required error={state.errors?.status}>
            {(id) => (
              <Select id={id} name="status" defaultValue={values.status} invalid={Boolean(state.errors?.status)}>
                <option value="draft">Draft — hidden from the website</option>
                <option value="published">Published — visible on the website</option>
              </Select>
            )}
          </FieldShell>
          <FieldShell label="Featured programme" hint="Pinned first in the public course catalogue.">
            {(id) => (
              <span className="flex h-[46px] items-center gap-2.5 rounded-xl border border-line bg-paper px-3.5">
                <input
                  id={id}
                  type="checkbox"
                  name="featured"
                  value="on"
                  defaultChecked={values.featured}
                  className="h-4 w-4 accent-[#0b6b5c]"
                />
                <span className="text-xs font-semibold text-navy">Show as a featured programme</span>
              </span>
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
            {pending ? "Saving…" : isEdit ? "Save changes" : "Create course"}
          </button>
          <Link href="/admin/courses" className="btn btn-ghost">
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
