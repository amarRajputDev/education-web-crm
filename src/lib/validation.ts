import { z } from "zod";

/** Converts a ZodError into a flat `{ field: message }` map for form rendering. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

const phoneSchema = z
  .string()
  .trim()
  .min(1, "Mobile number is required")
  .regex(/^[+\d][\d\s-]{7,16}$/, "Enter a valid mobile number");

const emailSchema = z
  .string()
  .trim()
  .min(1, "Email address is required")
  .email("Enter a valid email address");

const consentSchema = z
  .union([z.boolean(), z.literal("true"), z.literal("on"), z.literal(1), z.literal("1")])
  .refine((value) => value === true || value === "true" || value === "on" || value === 1 || value === "1", {
    message: "Please accept the consent declaration to continue",
  });

export const enquirySchema = z.object({
  name: z.string().trim().min(2, "Please enter the student's full name").max(120),
  phone: phoneSchema,
  email: z
    .string()
    .trim()
    .email("Enter a valid email address")
    .or(z.literal(""))
    .optional()
    .transform((value) => value ?? ""),
  courseId: z.coerce.number().optional(),
  courseInterest: z.string().trim().max(160).optional().default(""),
  preferredContact: z.enum(["Phone", "Email", "WhatsApp"]).default("Phone"),
  source: z.enum(["Website", "Phone", "Walk-in", "Social Media", "Referral", "Campaign", "Event", "Other"]).default("Website"),
  message: z.string().trim().max(1200).optional().default(""),
  consent: consentSchema,
});

export type EnquiryInput = z.infer<typeof enquirySchema>;

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(120),
  phone: phoneSchema,
  email: emailSchema,
  subject: z.string().trim().min(3, "Please add a subject").max(180),
  message: z.string().trim().min(10, "Tell us a little more (at least 10 characters)").max(2000),
  consent: consentSchema,
});

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const applicationPersonalSchema = z.object({
  fullName: z.string().trim().min(3, "Enter the applicant's full name").max(120),
  dob: z.string().min(1, "Date of birth is required"),
  gender: z.string().optional().default(""),
  email: emailSchema,
  phone: phoneSchema,
  parentName: z.string().trim().max(120).optional().default(""),
  parentPhone: z
    .string()
    .trim()
    .optional()
    .default("")
    .refine((value) => !value || /^[+\d][\d\s-]{7,16}$/.test(value), "Enter a valid guardian phone number"),
});

export const applicationAcademicSchema = z.object({
  qualification: z.string().min(1, "Select your highest qualification"),
  institutionName: z.string().trim().min(2, "Enter your school / college name").max(180),
  board: z.string().trim().min(2, "Enter the board or university").max(180),
  passingYear: z
    .string()
    .min(4, "Enter the passing year")
    .regex(/^\d{4}$/, "Passing year must be a 4-digit year"),
  marks: z.string().trim().min(1, "Enter your marks, percentage or grade").max(60),
});

export const applicationProgramSchema = z.object({
  courseId: z.coerce.number({ message: "Select the programme you want to apply for" }).min(1, "Select a programme"),
  studyMode: z.enum(["Full-time", "Part-time", "Online", "Hybrid"]).default("Full-time"),
  sessionId: z.coerce.number({ message: "Select an academic session" }).min(1, "Select an academic session"),
  preference2: z.string().trim().max(160).optional().default(""),
});

export const applicationAddressSchema = z.object({
  address: z.string().trim().min(5, "Enter your current address").max(400),
  sameAsCurrent: z.boolean().default(true),
  permanentAddress: z.string().trim().max(400).optional().default(""),
  city: z.string().trim().min(2, "Enter your city").max(100),
  state: z.string().trim().min(2, "Enter your state").max(100),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "PIN code must be 6 digits"),
});

export const applicationReviewSchema = z.object({
  declaration: consentSchema,
});

export const adminCourseSchema = z.object({
  name: z.string().trim().min(3, "Programme name is required").max(160),
  code: z.string().trim().max(40).optional().default(""),
  degreeLevel: z.enum(["Undergraduate", "Postgraduate", "Diploma", "Certificate", "Doctorate"]),
  departmentId: z.coerce.number({ message: "Select a department" }).min(1, "Select a department"),
  durationMonths: z.coerce.number().min(1, "Duration is required").max(120),
  durationLabel: z.string().trim().min(1, "Add a human readable duration").max(60),
  studyMode: z.enum(["Full-time", "Part-time", "Online", "Hybrid"]),
  seats: z.coerce.number().min(1).max(2000),
  eligibility: z.string().trim().min(5, "Add eligibility criteria").max(600),
  overview: z.string().trim().min(20, "Add a short overview (min 20 characters)").max(900),
  description: z.string().trim().max(6000).optional().default(""),
  feeAmount: z.coerce.number().min(0).max(100000000),
  feeNote: z.string().trim().max(400).optional().default(""),
  scholarshipInfo: z.string().trim().max(1200).optional().default(""),
  image: z.string().trim().max(300).optional().default(""),
  status: z.enum(["published", "draft"]),
  featured: z.boolean().default(false),
  seoTitle: z.string().trim().max(180).optional().default(""),
  seoDescription: z.string().trim().max(320).optional().default(""),
});

export const adminFacultySchema = z.object({
  name: z.string().trim().min(3, "Name is required").max(120),
  designation: z.string().trim().min(2, "Designation is required").max(120),
  departmentId: z.coerce.number({ message: "Select a department" }).min(1, "Select a department"),
  qualifications: z.string().trim().min(2, "Add qualifications").max(240),
  experienceYears: z.coerce.number().min(0).max(60),
  email: z.string().trim().email("Enter a valid email").or(z.literal("")),
  phone: z.string().trim().max(30).optional().default(""),
  bio: z.string().trim().max(2000).optional().default(""),
  researchInterests: z.string().trim().max(600).optional().default(""),
  photo: z.string().trim().max(300).optional().default(""),
  displayOrder: z.coerce.number().min(0).max(9999),
  visibility: z.enum(["published", "draft"]),
});

export const adminDepartmentSchema = z.object({
  name: z.string().trim().min(3, "Department name is required").max(140),
  code: z.string().trim().max(30).optional().default(""),
  overview: z.string().trim().max(3000).optional().default(""),
  image: z.string().trim().max(300).optional().default(""),
  visibility: z.enum(["published", "draft"]),
  sortOrder: z.coerce.number().min(0).max(9999),
  seoTitle: z.string().trim().max(180).optional().default(""),
  seoDescription: z.string().trim().max(320).optional().default(""),
});

export const adminNewsSchema = z.object({
  title: z.string().trim().min(4, "Title is required").max(180),
  category: z.enum(["News", "Notice", "Achievement", "Announcement"]),
  excerpt: z.string().trim().max(400).optional().default(""),
  body: z.string().trim().min(20, "Article body is required").max(20000),
  coverImage: z.string().trim().max(300).optional().default(""),
  author: z.string().trim().max(120).optional().default(""),
  status: z.enum(["published", "draft"]),
});

export const adminEventSchema = z.object({
  title: z.string().trim().min(4, "Title is required").max(180),
  category: z.enum(["Academic", "Workshop", "Seminar", "Cultural", "Sports", "Admission", "Other"]),
  summary: z.string().trim().max(400).optional().default(""),
  body: z.string().trim().max(12000).optional().default(""),
  location: z.string().trim().max(180).optional().default(""),
  startsAt: z.string().min(1, "Start date and time are required"),
  endsAt: z.string().optional().default(""),
  image: z.string().trim().max(300).optional().default(""),
  registrationUrl: z.string().trim().max(400).optional().default(""),
  status: z.enum(["published", "draft"]),
});

export const adminUserSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().max(30).optional().default(""),
  roleKey: z.enum(["super_admin", "admission_manager", "counsellor", "editor"]),
  designation: z.string().trim().max(120).optional().default(""),
  status: z.enum(["active", "invited", "inactive"]),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72)
    .optional()
    .or(z.literal("")),
});

export const followUpSchema = z.object({
  enquiryId: z.coerce.number().min(1),
  dueAt: z.string().min(1, "Pick a date and time"),
  counsellorId: z.coerce.number({ message: "Assign a counsellor" }).min(1, "Assign a counsellor"),
  note: z.string().trim().max(600).optional().default(""),
});

export const enquiryUpdateSchema = z.object({
  status: z.string().min(1),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  counsellorId: z.coerce.number().optional().nullable(),
  nextFollowupAt: z.string().optional().nullable(),
});

export const noteSchema = z.object({
  enquiryId: z.coerce.number().min(1),
  noteType: z.enum(["note", "call", "email", "whatsapp", "meeting"]).default("note"),
  body: z.string().trim().min(3, "Write a short note").max(1200),
  outcome: z.string().trim().max(180).optional().default(""),
});

export const applicationStatusSchema = z.object({
  applicationId: z.coerce.number().min(1),
  status: z.string().min(1),
  notes: z.string().trim().max(1500).optional().default(""),
  decisionReason: z
    .string()
    .trim()
    .max(600)
    .optional()
    .default("")
    .refine((value) => value.length <= 600, "Reason is too long"),
  reviewerId: z.coerce.number().optional().nullable(),
});

export type AdminCourseInput = z.infer<typeof adminCourseSchema>;
export type AdminFacultyInput = z.infer<typeof adminFacultySchema>;
export type AdminDepartmentInput = z.infer<typeof adminDepartmentSchema>;
export type AdminNewsInput = z.infer<typeof adminNewsSchema>;
export type AdminEventInput = z.infer<typeof adminEventSchema>;
export type AdminUserInput = z.infer<typeof adminUserSchema>;
