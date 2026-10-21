"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Loader2,
  MapPin,
  Paperclip,
  Phone,
  Trash2,
  User,
} from "lucide-react";
import { submitApplication, type ActionState } from "@/app/actions/public";
import {
  applicationAcademicSchema,
  applicationAddressSchema,
  applicationPersonalSchema,
  applicationProgramSchema,
  fieldErrors,
} from "@/lib/validation";
import { ErrorSummary, FieldShell, Select, TextArea, TextInput } from "@/components/ui/fields";
import { cn } from "@/lib/cn";

type CourseOption = { id: number; name: string; department: string; duration: string; mode: string };
type SessionOption = { id: number; name: string; deadline: string };

type Personal = {
  fullName: string;
  dob: string;
  gender: string;
  email: string;
  phone: string;
  parentName: string;
  parentPhone: string;
};
type Academic = {
  qualification: string;
  institutionName: string;
  board: string;
  passingYear: string;
  marks: string;
};
type Program = { courseId: string; studyMode: string; sessionId: string; preference2: string };
type Address = {
  address: string;
  sameAsCurrent: boolean;
  permanentAddress: string;
  city: string;
  state: string;
  postalCode: string;
};
type Docs = Record<string, File | null>;

const EMPTY: ActionState = { ok: false, message: "" };

const STEPS = [
  { title: "Personal", icon: User, hint: "Who is applying" },
  { title: "Academic", icon: FileText, hint: "Qualifications" },
  { title: "Program", icon: GraduationCap, hint: "Course choice" },
  { title: "Address", icon: MapPin, hint: "Where you live" },
  { title: "Documents", icon: Paperclip, hint: "Uploads" },
  { title: "Review", icon: ClipboardCheck, hint: "Confirm & submit" },
];

const DOC_FIELDS = [
  { key: "photograph", label: "Photograph", required: true, accept: "image/jpeg,image/png,image/webp", hint: "JPEG/PNG, max 2 MB" },
  { key: "identity", label: "Identity proof", required: false, accept: "image/jpeg,image/png,image/webp,application/pdf", hint: "PDF/JPG, max 5 MB" },
  { key: "marksheet", label: "Last mark sheet", required: true, accept: "image/jpeg,image/png,image/webp,application/pdf", hint: "PDF/JPG, max 5 MB" },
  { key: "certificate", label: "Transfer / migration certificate", required: false, accept: "image/jpeg,image/png,image/webp,application/pdf", hint: "PDF/JPG, max 5 MB" },
  { key: "other", label: "Other document", required: false, accept: "image/jpeg,image/png,image/webp,application/pdf", hint: "PDF/JPG, max 5 MB" },
];

const MAX_BYTES = 5 * 1024 * 1024;

export function ApplicationWizard({ courses, sessions }: { courses: CourseOption[]; sessions: SessionOption[] }) {
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [server, setServer] = useState<ActionState | null>(null);
  const [isPending, startTransition] = useTransition();

  const [personal, setPersonal] = useState<Personal>({
    fullName: "",
    dob: "",
    gender: "",
    email: "",
    phone: "",
    parentName: "",
    parentPhone: "",
  });
  const [academic, setAcademic] = useState<Academic>({
    qualification: "",
    institutionName: "",
    board: "",
    passingYear: "",
    marks: "",
  });
  const [program, setProgram] = useState<Program>({
    courseId: "",
    studyMode: "Full-time",
    sessionId: sessions[0] ? String(sessions[0].id) : "",
    preference2: "",
  });
  const [address, setAddress] = useState<Address>({
    address: "",
    sameAsCurrent: true,
    permanentAddress: "",
    city: "",
    state: "",
    postalCode: "",
  });
  const [docs, setDocs] = useState<Docs>({});
  const [declaration, setDeclaration] = useState(false);
  const [submitError, setSubmitError] = useState("");

  /* pre-select a programme when arriving from a course page */
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const courseId = params.get("course");
      if (courseId && courses.some((course) => String(course.id) === courseId)) {
        setProgram((current) => ({ ...current, courseId }));
      }
      const firstSession = sessions[0];
      if (firstSession && !program.sessionId) setProgram((current) => ({ ...current, sessionId: String(firstSession.id) }));
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courses, sessions]);

  const selectedCourse = useMemo(
    () => courses.find((course) => String(course.id) === program.courseId),
    [courses, program.courseId],
  );
  const selectedSession = useMemo(
    () => sessions.find((session) => String(session.id) === program.sessionId),
    [sessions, program.sessionId],
  );

  const validateStep = (index: number): Record<string, string> => {
    if (index === 0) {
      const result = applicationPersonalSchema.safeParse(personal);
      return result.success ? {} : fieldErrors(result.error);
    }
    if (index === 1) {
      const result = applicationAcademicSchema.safeParse(academic);
      return result.success ? {} : fieldErrors(result.error);
    }
    if (index === 2) {
      const result = applicationProgramSchema.safeParse(program);
      return result.success ? {} : fieldErrors(result.error);
    }
    if (index === 3) {
      const result = applicationAddressSchema.safeParse(address);
      return result.success ? {} : fieldErrors(result.error);
    }
    if (index === 4) {
      const docErrors: Record<string, string> = {};
      for (const field of DOC_FIELDS) {
        const file = docs[field.key];
        if (!file) {
          if (field.required) docErrors[`doc_${field.key}`] = `${field.label} is required`;
          continue;
        }
        if (!field.accept.includes(file.type)) {
          docErrors[`doc_${field.key}`] = "Unsupported file type — use JPEG, PNG or PDF";
        } else if (file.size > MAX_BYTES) {
          docErrors[`doc_${field.key}`] = "File is larger than 5 MB";
        }
      }
      return docErrors;
    }
    if (index === 5) {
      return declaration ? {} : { declaration: "Please accept the declaration to submit" };
    }
    return {};
  };

  const goNext = () => {
    const found = validateStep(step);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    setErrors({});
    setStep((current) => Math.max(current - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    for (let index = 0; index < STEPS.length; index++) {
      const found = validateStep(index);
      if (Object.keys(found).length > 0) {
        setErrors(found);
        setStep(index);
        setSubmitError("Please complete the highlighted fields before submitting.");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
    }
    setErrors({});
    setSubmitError("");
    setServer(null);

    const payload = new FormData();
    for (const [key, value] of Object.entries(personal)) payload.append(key, value ?? "");
    for (const [key, value] of Object.entries(academic)) payload.append(key, value ?? "");
    for (const [key, value] of Object.entries(program)) payload.append(key, value ?? "");
    for (const [key, value] of Object.entries(address)) {
      if (key === "sameAsCurrent") payload.append(key, value ? "on" : "");
      else payload.append(key, String(value ?? ""));
    }
    payload.append("declaration", declaration ? "on" : "");
    payload.append("sourcePage", "/admissions/apply");
    for (const [key, file] of Object.entries(docs)) {
      if (file) payload.append(`doc_${key}`, file);
    }

    startTransition(async () => {
      const result = await submitApplication(EMPTY, payload);
      setServer(result);
      if (!result.ok && result.errors) setErrors(result.errors);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  /* ------------------------- completion screen ------------------------- */
  if (server?.ok) {
    return (
      <div className="animate-rise-in overflow-hidden rounded-[2rem] border border-line bg-paper">
        <div className="bg-navy px-7 py-10 text-center text-white sm:px-10">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold text-navy">
            <CheckCircle2 className="h-8 w-8" aria-hidden />
          </span>
          <h2 className="mt-5 text-[clamp(1.6rem,3vw,2.3rem)] text-white">Application submitted</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/70">{server.message}</p>
          <p className="mx-auto mt-6 inline-flex items-center gap-2 rounded-2xl border border-gold/50 bg-gold/15 px-5 py-3">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold">Reference number</span>
            <span className="font-display text-xl font-semibold text-gold">{server.ref}</span>
          </p>
        </div>

        <div className="grid gap-8 px-6 py-8 sm:px-9 lg:grid-cols-2">
          <div>
            <h3 className="text-base font-bold text-navy">What happens next</h3>
            <ol className="mt-4 space-y-4">
              {[
                "The admissions team reviews your application and uploaded documents.",
                "You may be asked for missing documents or originals at the counselling desk.",
                "A counsellor contacts you to confirm programme fit and scholarship options.",
                "On approval, complete fee payment to confirm your enrolment.",
              ].map((item, index) => (
                <li key={item} className="flex gap-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-royal-100 font-display text-sm font-semibold text-royal">
                    {index + 1}
                  </span>
                  <p className="text-sm leading-relaxed text-slate-body">{item}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-3xl border border-line bg-offwhite/70 p-5">
            <h3 className="text-base font-bold text-navy">Keep this reference handy</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-body">
              Use <span className="font-mono font-semibold text-navy">{server.ref}</span> to check your application
              status at any time.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <Link href="/admissions/track" className="btn btn-primary w-full">
                Track application status
              </Link>
              <Link href="/" className="btn btn-outline w-full">
                Back to home
              </Link>
            </div>
            <div className="mt-5 space-y-1.5 border-t border-line pt-4 text-xs text-slate-body">
              <p className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-royal" aria-hidden />
                Admission helpline: +91 98200 41127
              </p>
              <p className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-royal" aria-hidden />
                admissions@aarohan-institute.edu
              </p>
              <p className="pt-1 text-[11px] text-slate-body">
                A confirmation email is dispatched only when an email provider is configured in the admin panel.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------ wizard ------------------------------ */
  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* progress */}
      <div className="rounded-[2rem] border border-line bg-paper p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-body">
              Step {step + 1} of {STEPS.length}
            </p>
            <p className="mt-1 font-display text-xl font-semibold text-navy">{STEPS[step].title}</p>
          </div>
          <p className="hidden text-xs text-slate-body sm:block">{STEPS[step].hint}</p>
        </div>

        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-offwhite">
          <div
            className="h-full rounded-full bg-gradient-to-r from-royal to-gold transition-all duration-500"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            role="progressbar"
            aria-valuenow={step + 1}
            aria-valuemin={1}
            aria-valuemax={STEPS.length}
            aria-label="Application progress"
          />
        </div>

        <ol className="mt-5 hidden grid-cols-6 gap-2 md:grid">
          {STEPS.map((item, index) => {
            const state = index < step ? "done" : index === step ? "current" : "todo";
            return (
              <li key={item.title}>
                <button
                  type="button"
                  onClick={() => index < step && setStep(index)}
                  disabled={index > step}
                  className={cn(
                    "flex w-full flex-col items-center gap-1.5 rounded-2xl px-2 py-2.5 text-center transition",
                    state === "current" && "bg-navy text-white",
                    state === "done" && "text-royal hover:bg-royal-100",
                    state === "todo" && "text-slate-body/60",
                    index < step ? "cursor-pointer" : "cursor-default",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-bold",
                      state === "current" && "border-gold bg-gold text-navy",
                      state === "done" && "border-royal bg-royal text-white",
                      state === "todo" && "border-line-strong",
                    )}
                  >
                    {state === "done" ? <Check className="h-3.5 w-3.5" aria-hidden /> : index + 1}
                  </span>
                  <span className="text-[11px] font-semibold">{item.title}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <ErrorSummary errors={{ ...errors, ...(submitError ? { _form: submitError } : {}) }} />

      <div className="mt-6 rounded-[2rem] border border-line bg-paper p-6 sm:p-8">
        {/* ---------------- STEP 1 — personal ---------------- */}
        {step === 0 ? (
          <section>
            <StepHeader title="Personal information" description="Details exactly as they appear on your identity documents." />
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldShell label="Full name" required error={errors.fullName}>
                {(id) => (
                  <TextInput
                    id={id}
                    name="fullName"
                    autoComplete="name"
                    value={personal.fullName}
                    onChange={(event) => setPersonal({ ...personal, fullName: event.target.value })}
                    invalid={Boolean(errors.fullName)}
                    placeholder="e.g. Ananya Krishnan"
                  />
                )}
              </FieldShell>
              <FieldShell label="Date of birth" required error={errors.dob}>
                {(id) => (
                  <TextInput
                    id={id}
                    name="dob"
                    type="date"
                    value={personal.dob}
                    onChange={(event) => setPersonal({ ...personal, dob: event.target.value })}
                    invalid={Boolean(errors.dob)}
                  />
                )}
              </FieldShell>
              <FieldShell label="Gender" hint="Optional">
                {(id) => (
                  <Select
                    id={id}
                    name="gender"
                    value={personal.gender}
                    onChange={(event) => setPersonal({ ...personal, gender: event.target.value })}
                  >
                    <option value="">Prefer not to say</option>
                    <option>Female</option>
                    <option>Male</option>
                    <option>Non-binary</option>
                  </Select>
                )}
              </FieldShell>
              <FieldShell label="Email address" required error={errors.email}>
                {(id) => (
                  <TextInput
                    id={id}
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={personal.email}
                    onChange={(event) => setPersonal({ ...personal, email: event.target.value })}
                    invalid={Boolean(errors.email)}
                    placeholder="student@example.com"
                  />
                )}
              </FieldShell>
              <FieldShell label="Mobile number" required error={errors.phone}>
                {(id) => (
                  <TextInput
                    id={id}
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={personal.phone}
                    onChange={(event) => setPersonal({ ...personal, phone: event.target.value })}
                    invalid={Boolean(errors.phone)}
                    placeholder="+91 98765 43210"
                  />
                )}
              </FieldShell>
              <FieldShell label="Parent / guardian name" error={errors.parentName}>
                {(id) => (
                  <TextInput
                    id={id}
                    name="parentName"
                    value={personal.parentName}
                    onChange={(event) => setPersonal({ ...personal, parentName: event.target.value })}
                    placeholder="e.g. Rajesh Krishnan"
                  />
                )}
              </FieldShell>
              <FieldShell label="Parent / guardian mobile" error={errors.parentPhone}>
                {(id) => (
                  <TextInput
                    id={id}
                    name="parentPhone"
                    type="tel"
                    inputMode="tel"
                    value={personal.parentPhone}
                    onChange={(event) => setPersonal({ ...personal, parentPhone: event.target.value })}
                    invalid={Boolean(errors.parentPhone)}
                    placeholder="+91 98123 45678"
                  />
                )}
              </FieldShell>
            </div>
          </section>
        ) : null}

        {/* ---------------- STEP 2 — academic ---------------- */}
        {step === 1 ? (
          <section>
            <StepHeader title="Academic information" description="Your most recent qualification — keep the mark sheet ready." />
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldShell label="Highest qualification" required error={errors.qualification}>
                {(id) => (
                  <Select
                    id={id}
                    name="qualification"
                    value={academic.qualification}
                    onChange={(event) => setAcademic({ ...academic, qualification: event.target.value })}
                    invalid={Boolean(errors.qualification)}
                  >
                    <option value="">Select qualification</option>
                    {[
                      "10+2 (Senior Secondary)",
                      "10+2 (Science)",
                      "10+2 (Commerce)",
                      "10+2 (Arts / Humanities)",
                      "Diploma",
                      "Bachelor's degree",
                      "Master's degree",
                    ].map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </Select>
                )}
              </FieldShell>
              <FieldShell label="School / college name" required error={errors.institutionName}>
                {(id) => (
                  <TextInput
                    id={id}
                    name="institutionName"
                    value={academic.institutionName}
                    onChange={(event) => setAcademic({ ...academic, institutionName: event.target.value })}
                    invalid={Boolean(errors.institutionName)}
                    placeholder="e.g. Delhi Public School"
                  />
                )}
              </FieldShell>
              <FieldShell label="Board / university" required error={errors.board}>
                {(id) => (
                  <TextInput
                    id={id}
                    name="board"
                    value={academic.board}
                    onChange={(event) => setAcademic({ ...academic, board: event.target.value })}
                    invalid={Boolean(errors.board)}
                    placeholder="e.g. CBSE / University of Delhi"
                  />
                )}
              </FieldShell>
              <FieldShell label="Passing year" required error={errors.passingYear}>
                {(id) => (
                  <TextInput
                    id={id}
                    name="passingYear"
                    inputMode="numeric"
                    maxLength={4}
                    value={academic.passingYear}
                    onChange={(event) => setAcademic({ ...academic, passingYear: event.target.value })}
                    invalid={Boolean(errors.passingYear)}
                    placeholder="2026"
                  />
                )}
              </FieldShell>
              <FieldShell label="Marks / percentage / grade" required error={errors.marks}>
                {(id) => (
                  <TextInput
                    id={id}
                    name="marks"
                    value={academic.marks}
                    onChange={(event) => setAcademic({ ...academic, marks: event.target.value })}
                    invalid={Boolean(errors.marks)}
                    placeholder="e.g. 88.4% or 8.6 CGPA"
                  />
                )}
              </FieldShell>
            </div>
            <p className="mt-4 rounded-xl bg-offwhite px-4 py-3 text-xs leading-relaxed text-slate-body">
              Uploads are verified against these details during document verification. Entering incorrect information can
              delay your admission.
            </p>
          </section>
        ) : null}

        {/* ---------------- STEP 3 — programme ---------------- */}
        {step === 2 ? (
          <section>
            <StepHeader title="Programme selection" description="Choose your first preference and an optional second choice." />
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldShell label="Desired course" required error={errors.courseId}>
                {(id) => (
                  <Select
                    id={id}
                    name="courseId"
                    value={program.courseId}
                    onChange={(event) => setProgram({ ...program, courseId: event.target.value })}
                    invalid={Boolean(errors.courseId)}
                  >
                    <option value="">Select a programme</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.name}
                      </option>
                    ))}
                  </Select>
                )}
              </FieldShell>
              <FieldShell label="Department" hint="Filled automatically">
                {() => <TextInput readOnly value={selectedCourse?.department ?? "—"} className="bg-offwhite" />}
              </FieldShell>
              <FieldShell label="Study mode" required error={errors.studyMode}>
                {(id) => (
                  <Select
                    id={id}
                    name="studyMode"
                    value={program.studyMode}
                    onChange={(event) => setProgram({ ...program, studyMode: event.target.value })}
                  >
                    {["Full-time", "Part-time", "Online", "Hybrid"].map((mode) => (
                      <option key={mode}>{mode}</option>
                    ))}
                  </Select>
                )}
              </FieldShell>
              <FieldShell label="Academic session" required error={errors.sessionId}>
                {(id) => (
                  <Select
                    id={id}
                    name="sessionId"
                    value={program.sessionId}
                    onChange={(event) => setProgram({ ...program, sessionId: event.target.value })}
                    invalid={Boolean(errors.sessionId)}
                  >
                    <option value="">Select session</option>
                    {sessions.map((session) => (
                      <option key={session.id} value={session.id}>
                        {session.name} (closes {session.deadline})
                      </option>
                    ))}
                  </Select>
                )}
              </FieldShell>
              <div className="sm:col-span-2">
                <FieldShell label="Second preference" hint="Optional — used if seats remain in your first choice">
                  {(id) => (
                    <Select
                      id={id}
                      name="preference2"
                      value={program.preference2}
                      onChange={(event) => setProgram({ ...program, preference2: event.target.value })}
                    >
                      <option value="">No second preference</option>
                      {courses
                        .filter((course) => String(course.id) !== program.courseId)
                        .map((course) => (
                          <option key={course.id}>{course.name}</option>
                        ))}
                    </Select>
                  )}
                </FieldShell>
              </div>
            </div>

            {selectedCourse ? (
              <div className="mt-5 grid gap-3 rounded-2xl border border-line bg-offwhite/70 p-4 sm:grid-cols-3">
                {[
                  ["Duration", selectedCourse.duration],
                  ["Mode", selectedCourse.mode],
                  ["Department", selectedCourse.department],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-body">{label}</p>
                    <p className="mt-0.5 text-sm font-semibold text-navy">{value}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}

        {/* ---------------- STEP 4 — address ---------------- */}
        {step === 3 ? (
          <section>
            <StepHeader title="Address information" description="Where we should send correspondence and counselling invitations." />
            <div className="grid gap-4">
              <FieldShell label="Current address" required error={errors.address}>
                {(id) => (
                  <TextArea
                    id={id}
                    name="address"
                    rows={3}
                    value={address.address}
                    onChange={(event) => setAddress({ ...address, address: event.target.value })}
                    invalid={Boolean(errors.address)}
                    placeholder="House / flat, street, landmark"
                  />
                )}
              </FieldShell>

              <label className="flex items-center gap-3 text-sm text-slate-body">
                <input
                  type="checkbox"
                  checked={address.sameAsCurrent}
                  onChange={(event) => setAddress({ ...address, sameAsCurrent: event.target.checked })}
                  className="h-4 w-4 rounded border-line-strong accent-[#0b6b5c]"
                />
                Permanent address is the same as current address
              </label>

              {!address.sameAsCurrent ? (
                <FieldShell label="Permanent address" error={errors.permanentAddress}>
                  {(id) => (
                    <TextArea
                      id={id}
                      name="permanentAddress"
                      rows={3}
                      value={address.permanentAddress}
                      onChange={(event) => setAddress({ ...address, permanentAddress: event.target.value })}
                      placeholder="Permanent residence details"
                    />
                  )}
                </FieldShell>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-3">
                <FieldShell label="City" required error={errors.city}>
                  {(id) => (
                    <TextInput
                      id={id}
                      name="city"
                      value={address.city}
                      onChange={(event) => setAddress({ ...address, city: event.target.value })}
                      invalid={Boolean(errors.city)}
                      placeholder="Noida"
                    />
                  )}
                </FieldShell>
                <FieldShell label="State" required error={errors.state}>
                  {(id) => (
                    <TextInput
                      id={id}
                      name="state"
                      value={address.state}
                      onChange={(event) => setAddress({ ...address, state: event.target.value })}
                      invalid={Boolean(errors.state)}
                      placeholder="Uttar Pradesh"
                    />
                  )}
                </FieldShell>
                <FieldShell label="PIN code" required error={errors.postalCode}>
                  {(id) => (
                    <TextInput
                      id={id}
                      name="postalCode"
                      inputMode="numeric"
                      maxLength={6}
                      value={address.postalCode}
                      onChange={(event) => setAddress({ ...address, postalCode: event.target.value })}
                      invalid={Boolean(errors.postalCode)}
                      placeholder="201310"
                    />
                  )}
                </FieldShell>
              </div>
            </div>
          </section>
        ) : null}

        {/* ---------------- STEP 5 — documents ---------------- */}
        {step === 4 ? (
          <section>
            <StepHeader
              title="Document upload"
              description="JPEG, PNG or PDF only. Files are stored privately and are never publicly accessible."
            />
            <div className="grid gap-4">
              {DOC_FIELDS.map((field) => {
                const file = docs[field.key];
                const error = errors[`doc_${field.key}`];
                return (
                  <div
                    key={field.key}
                    className={cn(
                      "rounded-2xl border p-4 transition",
                      error ? "border-danger bg-danger-100/40" : file ? "border-royal/40 bg-royal-100/40" : "border-line bg-offwhite/60",
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-navy">
                          {field.label}
                          {field.required ? <span className="ml-1 text-danger">*</span> : <span className="ml-1 text-slate-body">(optional)</span>}
                        </p>
                        <p className="text-xs text-slate-body">{field.hint}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="btn btn-outline btn-sm cursor-pointer">
                          {file ? "Replace" : "Choose file"}
                          <input
                            type="file"
                            accept={field.accept}
                            className="sr-only"
                            onChange={(event) => {
                              const chosen = event.target.files?.[0] ?? null;
                              setDocs((current) => ({ ...current, [field.key]: chosen }));
                            }}
                          />
                        </label>
                        {file ? (
                          <button
                            type="button"
                            onClick={() => setDocs((current) => ({ ...current, [field.key]: null }))}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-danger hover:bg-danger-100"
                            aria-label={`Remove ${field.label}`}
                          >
                            <Trash2 className="h-4 w-4" aria-hidden />
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {file ? (
                      <p className="mt-3 flex items-center gap-2 text-xs text-success">
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                        <span className="truncate">{file.name}</span>
                        <span className="text-slate-body">· {(file.size / 1024).toFixed(0)} KB</span>
                      </p>
                    ) : null}
                    {error ? (
                      <p className="error-text" role="alert">
                        {error}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
            <p className="mt-4 flex items-start gap-2 rounded-xl bg-offwhite px-4 py-3 text-xs leading-relaxed text-slate-body">
              <Paperclip className="mt-0.5 h-3.5 w-3.5 shrink-0 text-royal" aria-hidden />
              Maximum 5 MB per file. Documents are written to private storage and can only be downloaded by authorised
              administrators.
            </p>
          </section>
        ) : null}

        {/* ---------------- STEP 6 — review ---------------- */}
        {step === 5 ? (
          <section>
            <StepHeader title="Review & submit" description="Check every detail — you can still edit any step." />

            <div className="space-y-5">
              <ReviewBlock
                title="Personal information"
                stepIndex={0}
                onEdit={() => setStep(0)}
                rows={[
                  ["Full name", personal.fullName],
                  ["Date of birth", personal.dob],
                  ["Gender", personal.gender || "Not specified"],
                  ["Email", personal.email],
                  ["Mobile", personal.phone],
                  ["Guardian", personal.parentName ? `${personal.parentName} · ${personal.parentPhone || "—"}` : "—"],
                ]}
              />
              <ReviewBlock
                title="Academic information"
                stepIndex={1}
                onEdit={() => setStep(1)}
                rows={[
                  ["Qualification", academic.qualification],
                  ["Institution", academic.institutionName],
                  ["Board / university", academic.board],
                  ["Passing year", academic.passingYear],
                  ["Marks", academic.marks],
                ]}
              />
              <ReviewBlock
                title="Programme"
                stepIndex={2}
                onEdit={() => setStep(2)}
                rows={[
                  ["Course", selectedCourse?.name ?? "—"],
                  ["Study mode", program.studyMode],
                  ["Session", selectedSession?.name ?? "—"],
                  ["Second preference", program.preference2 || "None"],
                ]}
              />
              <ReviewBlock
                title="Address"
                stepIndex={3}
                onEdit={() => setStep(3)}
                rows={[
                  ["Current address", address.address],
                  [
                    "Permanent address",
                    address.sameAsCurrent ? "Same as current" : address.permanentAddress || "—",
                  ],
                  ["City / state / PIN", `${address.city}, ${address.state} — ${address.postalCode}`],
                ]}
              />
              <ReviewBlock
                title="Documents"
                stepIndex={4}
                onEdit={() => setStep(4)}
                rows={DOC_FIELDS.map((field) => [field.label, docs[field.key]?.name ?? (field.required ? "Missing" : "Not provided")])}
              />
            </div>

            <div className={cn("mt-6 rounded-2xl border p-4", errors.declaration ? "border-danger bg-danger-100/40" : "border-line bg-offwhite/60")}>
              <label className="flex items-start gap-3 text-sm leading-relaxed text-slate-body">
                <input
                  type="checkbox"
                  checked={declaration}
                  onChange={(event) => setDeclaration(event.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-line-strong accent-[#0b6b5c]"
                />
                <span>
                  I declare that the information provided is true and correct. I understand that admission is subject to
                  eligibility verification and seat availability, and I consent to the institute storing these details in
                  line with the <Link href="/privacy" className="font-semibold text-royal underline">privacy policy</Link>.
                </span>
              </label>
              {errors.declaration ? (
                <p className="error-text" role="alert">
                  {errors.declaration}
                </p>
              ) : null}
            </div>
          </section>
        ) : null}

        {/* navigation */}
        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 0}
            className="btn btn-outline disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back
          </button>

          {step < STEPS.length - 1 ? (
            <button type="button" onClick={goNext} className="btn btn-primary">
              Continue
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          ) : (
            <button type="submit" className="btn btn-gold btn-lg" disabled={isPending}>
              <Loader2 className={cn("h-4 w-4", isPending && "animate-spin")} aria-hidden />
              {isPending ? "Submitting…" : "Submit application"}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

function StepHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-6 border-b border-line pb-5">
      <h2 className="text-[clamp(1.3rem,2.4vw,1.75rem)] text-navy">{title}</h2>
      <p className="mt-2 text-sm text-slate-body">{description}</p>
    </div>
  );
}

function ReviewBlock({
  title,
  stepIndex,
  rows,
  onEdit,
}: {
  title: string;
  stepIndex: number;
  rows: string[][];
  onEdit: () => void;
}) {
  return (
    <div className="rounded-2xl border border-line bg-offwhite/50 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-navy">{title}</p>
        <button type="button" onClick={onEdit} className="text-xs font-bold text-royal hover:underline">
          Edit step {stepIndex + 1}
        </button>
      </div>
      <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex gap-3 border-b border-line/70 pb-1.5 last:border-0">
            <dt className="w-32 shrink-0 text-[11px] font-bold uppercase tracking-wide text-slate-body">{label}</dt>
            <dd className="min-w-0 flex-1 break-words text-[13px] text-navy">{value || "—"}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
