export type AcademicsState = {
  ok: boolean;
  message: string;
  errors?: Record<string, string>;
  id?: number;
};

export const EMPTY_STATE: AcademicsState = { ok: false, message: "" };

export type CourseFormValues = {
  id: number;
  name: string;
  code: string;
  degreeLevel: string;
  departmentId: number;
  durationMonths: number;
  durationLabel: string;
  studyMode: string;
  seats: number;
  eligibility: string;
  overview: string;
  description: string;
  feeAmount: number;
  feeNote: string;
  scholarshipInfo: string;
  image: string;
  status: string;
  featured: boolean;
  seoTitle: string;
  seoDescription: string;
  learningOutcomes: string;
  curriculum: string;
  careers: string;
  faqs: string;
  sessionIds: number[];
};

export type FacultyFormValues = {
  id: number;
  name: string;
  designation: string;
  departmentId: number;
  qualifications: string;
  experienceYears: number;
  email: string;
  phone: string;
  bio: string;
  researchInterests: string;
  photo: string;
  displayOrder: number;
  visibility: string;
};

export type DepartmentFormValues = {
  id: number;
  name: string;
  code: string;
  overview: string;
  image: string;
  visibility: string;
  sortOrder: number;
  seoTitle: string;
  seoDescription: string;
};

export const EMPTY_COURSE_VALUES: CourseFormValues = {
  id: 0,
  name: "",
  code: "",
  degreeLevel: "Undergraduate",
  departmentId: 0,
  durationMonths: 36,
  durationLabel: "3 Years",
  studyMode: "Full-time",
  seats: 60,
  eligibility: "",
  overview: "",
  description: "",
  feeAmount: 0,
  feeNote: "",
  scholarshipInfo: "",
  image: "/images/course-cs.jpg",
  status: "draft",
  featured: false,
  seoTitle: "",
  seoDescription: "",
  learningOutcomes: "",
  curriculum: "",
  careers: "",
  faqs: "",
  sessionIds: [],
};

export const EMPTY_FACULTY_VALUES: FacultyFormValues = {
  id: 0,
  name: "",
  designation: "",
  departmentId: 0,
  qualifications: "",
  experienceYears: 0,
  email: "",
  phone: "",
  bio: "",
  researchInterests: "",
  photo: "/images/p-01.jpg",
  displayOrder: 0,
  visibility: "published",
};

export const EMPTY_DEPARTMENT_VALUES: DepartmentFormValues = {
  id: 0,
  name: "",
  code: "",
  overview: "",
  image: "/images/gallery-1.jpg",
  visibility: "published",
  sortOrder: 0,
  seoTitle: "",
  seoDescription: "",
};

const IMAGE_NAMES = [
  "course-cs",
  "course-business",
  "course-engineering",
  "course-health",
  "course-design",
  "course-commerce",
  "course-hotel",
  "course-science",
  "computer-lab",
  "laboratory",
  "classroom",
  "library",
  "research",
  "placement",
  "about-campus",
  "gallery-1",
  "gallery-2",
  "gallery-3",
  "gallery-4",
  "director",
  "p-01",
  "p-02",
  "p-03",
  "p-04",
  "p-05",
  "p-06",
  "p-07",
  "p-08",
  "p-09",
  "p-10",
  "p-11",
  "p-12",
  "p-13",
  "p-14",
  "p-15",
  "p-16",
];

export const DEMO_IMAGES: string[] = IMAGE_NAMES.map((name) => `/images/${name}.jpg`);

export const LINE_HINT =
  'One entry per line. A line starting with "# " opens a heading; every non-empty line below it belongs to that heading.';

export const CURRICULUM_HINT =
  'One module per line. Start a line with "# Semester I" to open a semester — the lines below it are the modules of that semester.';

export const FAQ_HINT =
  'Start a line with "# " followed by the question; the following line(s) are the answer. Plain question / answer pairs on separate lines also work.';

export type LineGroup = { heading: string; items: string[] };

export function parseLineGroups(input: string): LineGroup[] {
  const groups: LineGroup[] = [];
  let current: LineGroup | null = null;
  for (const raw of input.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("# ")) {
      if (current) groups.push(current);
      current = { heading: line.slice(2).trim(), items: [] };
      continue;
    }
    if (!current) current = { heading: "", items: [] };
    current.items.push(line);
  }
  if (current) groups.push(current);
  return groups;
}

export function itemsFromText(input: string): string[] {
  const out: string[] = [];
  for (const group of parseLineGroups(input)) {
    if (group.items.length > 0) out.push(...group.items);
    else if (group.heading) out.push(group.heading);
  }
  return out;
}

export function curriculumFromText(input: string): { semester: string; subjects: string[] }[] {
  return parseLineGroups(input)
    .map((group) => ({ semester: group.heading || "Modules", subjects: group.items }))
    .filter((entry) => entry.subjects.length > 0);
}

export function faqsFromText(input: string): { q: string; a: string }[] {
  const out: { q: string; a: string }[] = [];
  for (const group of parseLineGroups(input)) {
    if (group.heading) {
      out.push({ q: group.heading, a: group.items.join(" ") });
      continue;
    }
    for (let index = 0; index < group.items.length; index += 2) {
      out.push({ q: group.items[index] ?? "", a: group.items[index + 1] ?? "" });
    }
  }
  return out.filter((entry) => entry.q);
}

export function textFromItems(items: string[]): string {
  return items.join("\n");
}

export function textFromCurriculum(entries: { semester: string; subjects: string[] }[]): string {
  return entries
    .map((entry) => [`# ${entry.semester}`, ...entry.subjects].join("\n"))
    .join("\n");
}

export function textFromFaqs(entries: { q: string; a: string }[]): string {
  return entries.map((entry) => [`# ${entry.q}`, entry.a].join("\n")).join("\n");
}

export function csvFromItems(items: string[]): string {
  return items.join(", ");
}

export function itemsFromCsv(input: string): string[] {
  return input
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
