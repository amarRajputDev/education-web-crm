import type { Database } from "better-sqlite3";
import bcrypt from "bcryptjs";
import { ALL_PERMISSIONS, ROLE_DEFINITIONS } from "./rbac";
import { SETTING_DEFINITIONS } from "./setting-defs";

/**
 * Demo seed for the Aarohan Institute platform.
 *
 * All people, programmes, statistics, testimonials and media below are
 * FICTIONAL demo content created for the Agentiva showcase. They must be
 * replaced with real institute data before any production use.
 *
 * The seed runs automatically the first time the database is opened and can be
 * re-run explicitly with `npm run seed -- --force`.
 */

type Db = Database;

const DEMO_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "Agentiva@2026";

/* ------------------------------------------------------------------ */
/* deterministic pseudo random helper so re-seeds always match         */
/* ------------------------------------------------------------------ */
let rngState = 20270118;
function rnd(): number {
  rngState = (rngState * 1664525 + 1013904223) >>> 0;
  return rngState / 4294967296;
}
function pick<T>(items: readonly T[]): T {
  return items[Math.floor(rnd() * items.length) % items.length];
}
function pickWeighted(entries: [string, number][]): string {
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = rnd() * total;
  for (const [value, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return value;
  }
  return entries[entries.length - 1][0];
}
function int(min: number, max: number): number {
  return Math.floor(rnd() * (max - min + 1)) + min;
}
function daysAgo(days: number, hour = 10, minute = 0): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  date.setUTCHours(hour, minute, 0, 0);
  return date.toISOString();
}
function daysFromNow(days: number, hour = 11, minute = 0): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  date.setUTCHours(hour, minute, 0, 0);
  return date.toISOString();
}
function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* ------------------------------------------------------------------ */
/* reference data                                                      */
/* ------------------------------------------------------------------ */

const ENQUIRY_STATUSES = [
  ["new", "New", "info", 10],
  ["contact_pending", "Contact Pending", "warning", 20],
  ["contacted", "Contacted", "gold", 30],
  ["interested", "Interested", "gold", 40],
  ["counselling_scheduled", "Counselling Scheduled", "gold", 50],
  ["application_started", "Application Started", "warning", 60],
  ["application_submitted", "Application Submitted", "warning", 70],
  ["converted", "Converted to Enrolment", "success", 80],
  ["not_interested", "Not Interested", "neutral", 90],
  ["invalid_lead", "Invalid Lead", "danger", 95],
] as const;

const APPLICATION_STATUSES = [
  ["draft", "Draft", "neutral", 10, 0],
  ["submitted", "Submitted", "info", 20, 0],
  ["under_review", "Under Review", "warning", 30, 0],
  ["documents_required", "Documents Required", "danger", 40, 0],
  ["documents_verified", "Documents Verified", "success", 50, 0],
  ["interview_scheduled", "Interview Scheduled", "gold", 60, 0],
  ["approved", "Approved", "success", 70, 1],
  ["rejected", "Rejected", "danger", 80, 1],
  ["waitlisted", "Waitlisted", "warning", 85, 1],
  ["enrolled", "Enrolled", "success", 90, 0],
] as const;

const DEPARTMENTS = [
  {
    name: "School of Computer Science & Information Technology",
    code: "SCS",
    image: "/images/course-cs.jpg",
    overview:
      "The School of Computer Science & IT prepares students for a fast-moving technology industry through project-based learning, modern laboratories and an industry-reviewed curriculum covering software engineering, data systems and intelligent applications.",
  },
  {
    name: "School of Management & Commerce",
    code: "SMC",
    image: "/images/course-business.jpg",
    overview:
      "The School of Management & Commerce blends rigorous business fundamentals with live case studies, internships and exposure to real decision-making environments across finance, marketing and operations.",
  },
  {
    name: "School of Engineering & Technology",
    code: "SET",
    image: "/images/course-engineering.jpg",
    overview:
      "The School of Engineering & Technology combines strong fundamentals in mathematics and applied science with design thinking, prototyping and hands-on workshop practice.",
  },
  {
    name: "School of Health & Allied Sciences",
    code: "SHA",
    image: "/images/course-health.jpg",
    overview:
      "The School of Health & Allied Sciences trains caring, competent professionals through simulation-based practice, hospital partnerships and a strong clinical ethics foundation.",
  },
  {
    name: "School of Design & Media",
    code: "SDM",
    image: "/images/course-design.jpg",
    overview:
      "The School of Design & Media is a studio-led community where students build portfolios through typography, interaction design, film and communication projects.",
  },
  {
    name: "School of Sciences & Humanities",
    code: "SSH",
    image: "/images/course-science.jpg",
    overview:
      "The School of Sciences & Humanities provides the analytical foundation for every discipline at Aarohan, with dedicated research tracks and a well-resourced central library.",
  },
] as const;

type CourseSeed = {
  name: string;
  code: string;
  degreeLevel: "Undergraduate" | "Postgraduate" | "Diploma" | "Certificate" | "Doctorate";
  department: number;
  durationMonths: number;
  durationLabel: string;
  studyMode: "Full-time" | "Part-time" | "Online" | "Hybrid";
  seats: number;
  eligibility: string;
  overview: string;
  description: string;
  outcomes: string[];
  curriculum: { semester: string; subjects: string[] }[];
  careers: string[];
  fee: number;
  feeNote: string;
  scholarship: string;
  image: string;
  featured: boolean;
  faqs: { q: string; a: string }[];
};

const COURSES: CourseSeed[] = [
  {
    name: "B.Tech Computer Science & Engineering",
    code: "BT-CSE",
    degreeLevel: "Undergraduate",
    department: 1,
    durationMonths: 48,
    durationLabel: "4 Years",
    studyMode: "Full-time",
    seats: 120,
    eligibility:
      "10+2 with Physics, Chemistry and Mathematics, minimum 50% aggregate (45% for reserved categories as per institute norms).",
    overview:
      "A four-year undergraduate engineering programme built around software foundations, systems thinking and industry-scale project work across all eight semesters.",
    description:
      "The B.Tech Computer Science & Engineering programme develops strong fundamentals in programming, data structures, operating systems and databases in the early semesters, then opens into specialisation tracks in cloud systems, artificial intelligence and full-stack engineering. Students ship working software every semester through studio-style labs, a compulsory internship and a capstone project evaluated by an external panel.",
    outcomes: [
      "Design and implement software systems using modern engineering practices",
      "Apply algorithms, data structures and database theory to real problems",
      "Work effectively in version-controlled, agile project teams",
      "Communicate technical decisions through design documents and presentations",
    ],
    curriculum: [
      { semester: "Semester I", subjects: ["Engineering Mathematics I", "Programming Fundamentals", "Physics for Engineers", "Digital Logic", "Communication Skills"] },
      { semester: "Semester II", subjects: ["Engineering Mathematics II", "Data Structures", "Object Oriented Programming", "Basic Electronics", "Engineering Graphics"] },
      { semester: "Semester III", subjects: ["Discrete Mathematics", "Database Systems", "Computer Networks", "Software Engineering", "Operating Systems"] },
      { semester: "Semester IV", subjects: ["Design & Analysis of Algorithms", "Web Technologies", "Automata Theory", "Microprocessors", "Professional Elective I"] },
      { semester: "Semester V", subjects: ["Artificial Intelligence", "Cloud Computing", "Information Security", "Minor Project", "Professional Elective II"] },
      { semester: "Semester VI", subjects: ["Distributed Systems", "Machine Learning", "Elective III", "Summer Internship", "Software Studio"] },
      { semester: "Semester VII", subjects: ["Major Project I", "Elective IV", "Entrepreneurship", "Industry Seminar"] },
      { semester: "Semester VIII", subjects: ["Major Project II", "Ethics in Technology", "Comprehensive Viva"] },
    ],
    careers: ["Software Engineer", "Full-Stack Developer", "Data Engineer", "Cloud Engineer", "QA Automation Engineer", "Technical Product Analyst"],
    fee: 148000,
    feeNote: "Per semester, inclusive of examination and laboratory charges.",
    scholarship:
      "Merit scholarship up to 25% of tuition for students scoring 85%+ in 10+2; sibling and defence-ward concessions available.",
    image: "/images/course-cs.jpg",
    featured: true,
    faqs: [
      { q: "Is the programme approved?", a: "The institute is a demo brand. Approval and affiliation placeholders are shown on the About page and must be replaced with real documentation." },
      { q: "Is there a compulsory internship?", a: "Yes. A six-week industry internship is completed during Semester VI with mentor reporting." },
    ],
  },
  {
    name: "Bachelor of Computer Applications (BCA)",
    code: "UG-BCA",
    degreeLevel: "Undergraduate",
    department: 1,
    durationMonths: 36,
    durationLabel: "3 Years",
    studyMode: "Full-time",
    seats: 80,
    eligibility: "10+2 in any stream with a minimum of 50% aggregate. Mathematics at 10+2 is desirable.",
    overview:
      "A three-year application development programme covering programming, web platforms, databases and mobile technologies with a portfolio-first approach.",
    description:
      "BCA at Aarohan is structured around building things. Students begin with programming fundamentals and progress through web engineering, database design, mobile development and cloud deployment. Every semester includes a graded build, and the final year is devoted to an industry-linked capstone.",
    outcomes: [
      "Build responsive web and mobile applications end to end",
      "Model and query relational data with confidence",
      "Deploy projects to a cloud environment with version control",
      "Translate business requirements into technical solutions",
    ],
    curriculum: [
      { semester: "Semester I", subjects: ["Fundamentals of IT", "Programming in C", "Digital Electronics", "Communication Skills", "Mathematics"] },
      { semester: "Semester II", subjects: ["Data Structures in C", "Operating Systems Basics", "Financial Accounting", "Web Basics", "Software Tools"] },
      { semester: "Semester III", subjects: ["Object Oriented Programming", "Database Management", "Computer Networks", "Web Programming", "Business Statistics"] },
      { semester: "Semester IV", subjects: ["Java Programming", "Software Engineering", "Mobile App Development", "E-Commerce", "Mini Project"] },
      { semester: "Semester V", subjects: ["Cloud Fundamentals", "Python for Data", "Information Security", "Elective I", "Internship"] },
      { semester: "Semester VI", subjects: ["Capstone Project", "Professional Elective II", "Portfolio Review", "Comprehensive Viva"] },
    ],
    careers: ["Web Developer", "Software Support Engineer", "Database Administrator", "Mobile Developer", "IT Analyst"],
    fee: 96000,
    feeNote: "Per semester.",
    scholarship: "Early-bird concession of 10% for applications submitted before the first counselling window.",
    image: "/images/computer-lab.jpg",
    featured: true,
    faqs: [
      { q: "Can students from non-mathematics streams apply?", a: "Yes. A bridge module in mathematics and logic is offered during Semester I." },
    ],
  },
  {
    name: "BBA — Bachelor of Business Administration",
    code: "UG-BBA",
    degreeLevel: "Undergraduate",
    department: 2,
    durationMonths: 36,
    durationLabel: "3 Years",
    studyMode: "Full-time",
    seats: 90,
    eligibility: "10+2 in any stream with a minimum of 50% aggregate.",
    overview:
      "A management degree combining core business fundamentals with live projects, summer internships and dedicated career mentoring from the first year.",
    description:
      "The BBA programme introduces students to the language of business — accounting, marketing, operations and organisational behaviour — and quickly moves into applied work. Students run market research projects, consult with local enterprises and present findings to a panel of faculty and industry mentors.",
    outcomes: [
      "Analyse business situations using structured frameworks",
      "Prepare financial statements and interpret key ratios",
      "Design a marketing plan with measurable objectives",
      "Present and defend recommendations to senior stakeholders",
    ],
    curriculum: [
      { semester: "Semester I", subjects: ["Principles of Management", "Financial Accounting", "Business Economics", "Business Communication", "Computer Applications"] },
      { semester: "Semester II", subjects: ["Organisational Behaviour", "Business Mathematics", "Marketing Fundamentals", "Environmental Studies", "Legal Systems"] },
      { semester: "Semester III", subjects: ["Cost Accounting", "Human Resource Management", "Business Research Methods", "Operations Management", "Elective I"] },
      { semester: "Semester IV", subjects: ["Financial Management", "Digital Marketing", "Entrepreneurship", "Summer Internship Report", "Elective II"] },
      { semester: "Semester V", subjects: ["Strategic Management", "Business Analytics", "Leadership Skills", "Elective III", "Live Project"] },
      { semester: "Semester VI", subjects: ["Major Project", "Governance & Ethics", "Industry Seminar", "Comprehensive Viva"] },
    ],
    careers: ["Business Analyst", "Marketing Executive", "HR Executive", "Operations Coordinator", "Entrepreneur"],
    fee: 88000,
    feeNote: "Per semester.",
    scholarship: "Need-based aid covering up to 30% of tuition for verified family income below the institute threshold.",
    image: "/images/placement.jpg",
    featured: true,
    faqs: [],
  },
  {
    name: "B.Com (Honours)",
    code: "UG-BCOM",
    degreeLevel: "Undergraduate",
    department: 2,
    durationMonths: 36,
    durationLabel: "3 Years",
    studyMode: "Full-time",
    seats: 100,
    eligibility: "10+2 with Commerce or equivalent with a minimum of 50% aggregate. Students from other streams may apply with a bridging course.",
    overview:
      "An honours commerce degree with deep coverage of accounting, taxation and auditing, plus practical training in financial software.",
    description:
      "B.Com (Hons.) is designed for students aiming at accounting, finance and assurance careers. The curriculum follows a rigorous progression from financial accounting to advanced corporate reporting, direct and indirect taxation, auditing standards and financial analytics, supported by Tally and spreadsheet-based practical labs.",
    outcomes: [
      "Prepare and interpret financial statements under current standards",
      "Apply income tax and GST provisions to common scenarios",
      "Use accounting software for end-cycle processing",
      "Evaluate investment and financing decisions",
    ],
    curriculum: [
      { semester: "Semester I", subjects: ["Financial Accounting I", "Business Economics", "Business Law", "Financial Literacy", "English"] },
      { semester: "Semester II", subjects: ["Financial Accounting II", "Corporate Law", "Business Statistics", "Cost Accounting I", "Digital Skills"] },
      { semester: "Semester III", subjects: ["Advanced Accounting", "Income Tax Law", "Management Accounting", "Business Research", "Elective I"] },
      { semester: "Semester IV", subjects: ["Corporate Accounting", "Indirect Taxation", "Auditing", "Elective II", "Software Lab"] },
      { semester: "Semester V", subjects: ["Financial Management", "Financial Analytics", "Banking & Insurance", "Elective III", "Internship"] },
      { semester: "Semester VI", subjects: ["International Business", "Project Work", "Professional Ethics", "Comprehensive Viva"] },
    ],
    careers: ["Accountant", "Tax Analyst", "Audit Assistant", "Financial Analyst", "Banking Operations Executive"],
    fee: 76000,
    feeNote: "Per semester.",
    scholarship: "Merit scholarship of 15% for students scoring 80%+ in 10+2 Commerce.",
    image: "/images/course-commerce.jpg",
    featured: false,
    faqs: [],
  },
  {
    name: "MBA — Master of Business Administration",
    code: "PG-MBA",
    degreeLevel: "Postgraduate",
    department: 2,
    durationMonths: 24,
    durationLabel: "2 Years",
    studyMode: "Full-time",
    seats: 60,
    eligibility: "Bachelor's degree in any discipline with 50% aggregate (45% for reserved categories) and a valid entrance test score or institute aptitude test.",
    overview:
      "A two-year management programme with specialisations in finance, marketing, operations and people management, anchored by a live consulting project.",
    description:
      "The MBA at Aarohan places students in the driver's seat from day one. The first year builds functional literacy across all business disciplines; the second year combines specialisation electives with a paid summer internship and a capstone consulting project delivered to a real organisation.",
    outcomes: [
      "Lead cross-functional teams through ambiguous decisions",
      "Build financial models that inform strategy",
      "Design data-informed marketing and growth plans",
      "Deliver a client-ready consulting recommendation",
    ],
    curriculum: [
      { semester: "Trimester I", subjects: ["Managerial Economics", "Accounting for Managers", "Organisational Behaviour", "Quantitative Methods", "Business Communication"] },
      { semester: "Trimester II", subjects: ["Financial Management", "Marketing Management", "Operations Research", "Human Resource Management", "Business Analytics"] },
      { semester: "Trimester III", subjects: ["Strategic Management", "Elective Sprint", "Summer Internship", "Legal Environment"] },
      { semester: "Trimester IV", subjects: ["Specialisation Electives I", "Design Thinking", "Corporate Governance", "Research Methods"] },
      { semester: "Trimester V", subjects: ["Specialisation Electives II", "Consulting Practicum", "Global Business", "Leadership Lab"] },
      { semester: "Trimester VI", subjects: ["Dissertation", "Viva Voce", "Placement Preparation"] },
    ],
    careers: ["Business Manager", "Financial Analyst", "Marketing Manager", "Operations Manager", "HR Business Partner", "Management Consultant"],
    fee: 185000,
    feeNote: "Per semester, inclusive of placement support charges.",
    scholarship: "GMAT/CAT merit scholarships up to 50% of tuition; early-decision concession for applications before 31 January.",
    image: "/images/course-business.jpg",
    featured: true,
    faqs: [
      { q: "Are specialisations fixed at admission?", a: "No. Students choose specialisation electives at the end of Trimester III after a mandatory orientation module." },
    ],
  },
  {
    name: "M.Sc Data Science",
    code: "PG-MSCDS",
    degreeLevel: "Postgraduate",
    department: 1,
    durationMonths: 24,
    durationLabel: "2 Years",
    studyMode: "Full-time",
    seats: 40,
    eligibility: "Bachelor's degree in computer science, statistics, mathematics, economics or engineering with 55% aggregate and working knowledge of statistics.",
    overview:
      "A postgraduate programme in statistical modelling, machine learning and data engineering with a capstone built on real industry datasets.",
    description:
      "M.Sc Data Science takes students from statistical foundations to production machine learning. Coursework covers probability, regression, deep learning, data engineering and the ethics of automated decision-making, culminating in a capstone partnership with a participating organisation.",
    outcomes: [
      "Build and validate predictive models responsibly",
      "Engineer reliable data pipelines and reproducible analyses",
      "Communicate findings to non-technical stakeholders",
      "Evaluate model fairness, privacy and risk",
    ],
    curriculum: [
      { semester: "Semester I", subjects: ["Probability & Statistics", "Programming for Data Science", "Linear Algebra", "Data Visualisation", "Research Ethics"] },
      { semester: "Semester II", subjects: ["Regression Analysis", "Machine Learning I", "Database Systems", "Experimental Design", "Elective I"] },
      { semester: "Semester III", subjects: ["Deep Learning", "Data Engineering", "Time Series Analysis", "Elective II", "Industry Lab"] },
      { semester: "Semester IV", subjects: ["Capstone Project", "MLOps Fundamentals", "Dissertation & Viva"] },
    ],
    careers: ["Data Scientist", "Machine Learning Engineer", "Data Analyst", "BI Analyst", "Analytics Consultant"],
    fee: 132000,
    feeNote: "Per semester.",
    scholarship: "Merit scholarship of 25% for candidates with demonstrable research or industry experience in analytics.",
    image: "/images/research.jpg",
    featured: true,
    faqs: [],
  },
  {
    name: "Diploma in Medical Laboratory Technology",
    code: "DIP-MLT",
    degreeLevel: "Diploma",
    department: 4,
    durationMonths: 24,
    durationLabel: "2 Years",
    studyMode: "Full-time",
    seats: 45,
    eligibility: "10+2 with Biology or Chemistry with a minimum of 45% aggregate. Minimum age 17 years at admission.",
    overview:
      "A two-year laboratory technician programme with hospital-based clinical postings and competency-based assessment in diagnostic techniques.",
    description:
      "The Diploma in Medical Laboratory Technology prepares students for diagnostic laboratory roles through structured practical training in haematology, clinical biochemistry, microbiology and histopathology, supported by postings at partner hospitals.",
    outcomes: [
      "Perform routine diagnostic tests accurately and safely",
      "Maintain laboratory quality control and biosafety standards",
      "Prepare and report specimen results under supervision",
      "Apply medical ethics and patient confidentiality practices",
    ],
    curriculum: [
      { semester: "Year I — Semester I", subjects: ["Anatomy & Physiology", "Clinical Biochemistry I", "Haematology I", "Lab Safety & Quality", "Medical Terminology"] },
      { semester: "Year I — Semester II", subjects: ["Clinical Biochemistry II", "Haematology II", "Microbiology I", "Pathology Basics", "Practical Postings"] },
      { semester: "Year II — Semester III", subjects: ["Microbiology II", "Histopathology", "Immunology & Serology", "Diagnostic Techniques", "Hospital Posting"] },
      { semester: "Year II — Semester IV", subjects: ["Advanced Diagnostics", "Lab Management", "Internship", "Capstone & Viva"] },
    ],
    careers: ["Lab Technician", "Phlebotomist", "Quality Control Assistant", "Hospital Laboratory Assistant"],
    fee: 72000,
    feeNote: "Per semester, including kit and posting charges.",
    scholarship: "Concession of 10% for candidates from government hospital internship tie-ups.",
    image: "/images/course-health.jpg",
    featured: false,
    faqs: [],
  },
  {
    name: "B.Des Interaction Design",
    code: "UG-BDES",
    degreeLevel: "Undergraduate",
    department: 5,
    durationMonths: 48,
    durationLabel: "4 Years",
    studyMode: "Full-time",
    seats: 40,
    eligibility: "10+2 in any stream with a minimum of 50% aggregate, plus a portfolio review or studio aptitude exercise.",
    overview:
      "A studio-based design degree covering research, visual systems, interaction design and product prototyping with an industry portfolio at graduation.",
    description:
      "The B.Des Interaction Design programme runs as a sequence of studios. Students learn design research, typography, information architecture and prototyping, then apply them to digital products, service experiences and physical-digital systems, graduating with a defended portfolio.",
    outcomes: [
      "Conduct design research and translate insight into concepts",
      "Create coherent visual and interaction systems",
      "Prototype and usability-test digital products",
      "Present and defend design decisions professionally",
    ],
    curriculum: [
      { semester: "Year I", subjects: ["Design Fundamentals", "Drawing & Form", "Typography I", "History of Design", "Material Practice"] },
      { semester: "Year II", subjects: ["User Research", "Interaction Studio I", "Typography II", "Photography", "Creative Coding"] },
      { semester: "Year III", subjects: ["Service Design", "Interaction Studio II", "Motion & Sound", "Internship", "Elective Studio"] },
      { semester: "Year IV", subjects: ["Capstone Studio", "Portfolio & Practice", "Design Thesis", "Portfolio Defence"] },
    ],
    careers: ["UX Designer", "Product Designer", "Interaction Designer", "Design Researcher", "Visual Designer"],
    fee: 155000,
    feeNote: "Per semester, including studio materials.",
    scholarship: "Portfolio merit scholarship up to 20% of tuition awarded at the studio aptitude review.",
    image: "/images/course-design.jpg",
    featured: true,
    faqs: [],
  },
];

const FACULTY = [
  { name: "Dr. Ananya Krishnan", designation: "Dean, School of Computer Science & IT", dept: 1, quals: "Ph.D. Computer Science (IIT Madras), M.Tech, B.E.", exp: 18, research: ["Distributed Systems", "Cloud Reliability"], photo: "/images/p-01.jpg" },
  { name: "Dr. Rajeev Malhotra", designation: "Professor & Head, Data Systems", dept: 1, quals: "Ph.D. Data Engineering (IISc), M.Tech", exp: 16, research: ["Stream Processing", "Data Quality"], photo: "/images/p-02.jpg" },
  { name: "Prof. Sneha Raghavan", designation: "Associate Professor", dept: 1, quals: "M.Tech Computer Science, B.Tech (Gold Medallist)", exp: 11, research: ["Machine Learning", "Computer Vision"], photo: "/images/p-03.jpg" },
  { name: "Dr. Imran Qureshi", designation: "Professor, Software Engineering", dept: 1, quals: "Ph.D. Software Reliability (NIT Trichy), M.S.", exp: 14, research: ["Software Quality", "Testing Strategies"], photo: "/images/p-04.jpg" },
  { name: "Dr. Meera Chatterjee", designation: "Dean, School of Management & Commerce", dept: 2, quals: "Ph.D. Finance (IIM Calcutta), MBA, B.Com (Hons.)", exp: 19, research: ["Corporate Governance", "Financial Behaviour"], photo: "/images/p-05.jpg" },
  { name: "Prof. Vikram Sethi", designation: "Professor, Marketing", dept: 2, quals: "MBA (IIM Lucknow), B.Tech", exp: 15, research: ["Consumer Analytics", "Brand Strategy"], photo: "/images/p-06.jpg" },
  { name: "Dr. Kavita Nair", designation: "Associate Professor, Human Resources", dept: 2, quals: "Ph.D. Organisational Behaviour, MBA", exp: 12, research: ["Workplace Culture", "Leadership Development"], photo: "/images/p-07.jpg" },
  { name: "Prof. Arjun Deshpande", designation: "Assistant Professor, Economics", dept: 2, quals: "M.Phil. Economics (JNU), M.A.", exp: 9, research: ["Public Finance", "Development Economics"], photo: "/images/p-08.jpg" },
  { name: "Dr. Sanjay Bhargava", designation: "Dean, School of Engineering & Technology", dept: 3, quals: "Ph.D. Mechanical Engineering (IIT Kanpur), M.E.", exp: 20, research: ["Composite Materials", "Design for Manufacture"], photo: "/images/p-09.jpg" },
  { name: "Dr. Farida Contractor", designation: "Dean, School of Health & Allied Sciences", dept: 4, quals: "Ph.D. Clinical Biochemistry, M.Sc. Medical Lab Technology", exp: 17, research: ["Diagnostic Markers", "Lab Quality Systems"], photo: "/images/p-10.jpg" },
  { name: "Prof. Nikhil Rao", designation: "Dean, School of Design & Media", dept: 5, quals: "M.Des (NID Ahmedabad), B.F.A.", exp: 13, research: ["Interaction Design", "Design Education"], photo: "/images/p-11.jpg" },
  { name: "Dr. Lalita Sharma", designation: "Professor, Sciences & Humanities", dept: 6, quals: "Ph.D. Organic Chemistry (DU), M.Sc.", exp: 16, research: ["Green Chemistry", "Science Communication"], photo: "/images/p-12.jpg" },
];

const NEWS = [
  {
    title: "Admissions open for the 2027–28 academic session",
    category: "Announcement" as const,
    excerpt: "Applications for undergraduate, postgraduate and diploma programmes are now being accepted through the online admission portal.",
    body: "Aarohan Institute of Higher Education has opened applications for the 2027–28 academic session across all six schools. Prospective students can submit an online application, upload documents and track their status through the admission reference number.\n\nThe admissions desk is available Monday to Saturday for counselling appointments. Applicants are advised to review programme eligibility before submitting, and to keep scanned copies of mark sheets ready for the document verification stage.",
    image: "/images/news-1.jpg",
    daysAgo: 6,
  },
  {
    title: "Industry collaboration programme expands to 75 partner organisations",
    category: "News" as const,
    excerpt: "Live project briefs, internships and guest lectures will now be available to students across every school.",
    body: "The institute's industry interface cell has added new partner organisations across technology, healthcare, media and financial services. Students will have access to live project briefs, summer internships and a regular guest-lecture series.\n\nPartner panels will also participate in final-year reviews, giving students direct feedback from practising professionals.",
    image: "/images/news-2.jpg",
    daysAgo: 14,
  },
  {
    title: "Central library extends digital access to 24,000 titles",
    category: "News" as const,
    excerpt: "Students can now borrow e-books and journal packages from off campus using their institute credentials.",
    body: "The central library has expanded its digital collection, adding journal packages and reference titles that can be accessed off campus. Orientation sessions for first-year students run through the opening week of the semester.",
    image: "/images/library.jpg",
    daysAgo: 25,
  },
  {
    title: "Placement cell reports strong internship season for 2026 cohort",
    category: "Achievement" as const,
    excerpt: "Over 400 students completed industry internships across more than 60 organisations this summer.",
    body: "The career services team supported more than 400 internship placements this season, with students working on software engineering, analytics, marketing, clinical and design assignments.\n\nNote: figures shown on this demo website are sample data and are not verified claims.",
    image: "/images/placement.jpg",
    daysAgo: 38,
  },
  {
    title: "Semester registration and fee schedule published",
    category: "Notice" as const,
    excerpt: "Students must complete course registration before the published deadline to avoid a late fee.",
    body: "The examination cell has published the semester registration window and the revised fee schedule. Students should complete registration through the student portal and confirm their course selections with their academic mentor.",
    image: "/images/news-3.jpg",
    daysAgo: 47,
  },
  {
    title: "Research symposium to be held on campus next month",
    category: "Announcement" as const,
    excerpt: "Faculty and postgraduate students will present ongoing work across data science, health sciences and management.",
    body: "The annual research symposium brings together postgraduate students and faculty for a day of presentations, poster sessions and panel discussions. Abstract submissions are open until the end of the month.",
    image: "/images/seminar.jpg",
    daysAgo: 60,
  },
];

const EVENTS = [
  { title: "Open House & Campus Tour", category: "Admission" as const, days: 9, location: "Main Auditorium", summary: "Meet faculty, tour laboratories and get one-to-one admission counselling for the 2027–28 session.", body: "The open house includes a guided campus tour, department presentations and scheduled one-to-one counselling slots. Registration is recommended as seating is limited." },
  { title: "Industry Mentorship Workshop", category: "Workshop" as const, days: 16, location: "Seminar Hall B", summary: "A hands-on session on product thinking led by practising engineering managers.", body: "Students work in teams on a live product brief, from problem framing to a clickable prototype, with feedback from industry mentors." },
  { title: "Inter-school Cultural Fest — Rangmanch", category: "Cultural" as const, days: 27, location: "Campus Quad & Auditorium", summary: "Three days of music, theatre, literary and fine-arts competitions across all schools.", body: "Rangmanch is the institute's annual cultural festival, organised by the student council with participation from every school. Events include debate, street play, dance and a live gallery walk." },
  { title: "Research Methodology Seminar", category: "Seminar" as const, days: 34, location: "Conference Centre", summary: "Postgraduate students and faculty discuss research design, ethics and publication practice.", body: "The seminar covers qualitative and quantitative design choices, ethics review and preparing a manuscript for conference submission." },
  { title: "Annual Sports Meet", category: "Sports" as const, days: 45, location: "Outdoor Sports Complex", summary: "Inter-school athletics, team finals and the closing ceremony.", body: "The annual sports meet features track and field events, team finals and a closing ceremony hosted by the student welfare committee." },
  { title: "Admission Counselling Week", category: "Admission" as const, days: 3, location: "Admissions Office", summary: "Walk-in counselling with programme advisors and document verification support.", body: "Extended counselling hours for applicants and parents, with on-the-spot eligibility checks and application support." },
  { title: "Alumni Career Panel", category: "Academic" as const, days: 56, location: "Main Auditorium", summary: "Graduates share pathways across technology, finance, healthcare and design.", body: "An interactive panel followed by small-group networking. Open to all students with a valid institute ID." },
];

const GALLERY = [
  { title: "Main Academic Block", category: "Campus" as const, image: "/images/about-campus.jpg", caption: "The main academic block houses lecture theatres and faculty offices." },
  { title: "Central Library Reading Hall", category: "Library" as const, image: "/images/library.jpg", caption: "Silent study zones and collaborative tables across three floors." },
  { title: "Computing Laboratory", category: "Laboratory" as const, image: "/images/computer-lab.jpg", caption: "Networked workstations available till 8 PM on working days." },
  { title: "Clinical Skills Laboratory", category: "Laboratory" as const, image: "/images/laboratory.jpg", caption: "Simulation equipment for health sciences practical training." },
  { title: "Lecture Theatre", category: "Campus" as const, image: "/images/classroom.jpg", caption: "Tiered lecture theatres with lecture capture in every room." },
  { title: "Sports Complex", category: "Sports" as const, image: "/images/sports.jpg", caption: "Athletics track, courts and a fitness centre for students." },
  { title: "Rangmanch Cultural Fest", category: "Cultural" as const, image: "/images/campus-event.jpg", caption: "The annual student-led cultural festival." },
  { title: "Convocation Day", category: "Events" as const, image: "/images/graduation.jpg", caption: "Graduating cohorts at the annual convocation ceremony." },
];

const TESTIMONIALS = [
  { name: "Aarav Khanna", role: "B.Tech Computer Science, Class of 2025", program: "B.Tech CSE", year: "2025", quote: "The project studios pushed me to build things I had only read about. By the final year I had four shipped projects in my portfolio, which made interviews far less intimidating." },
  { name: "Ishita Bose", role: "MBA, Class of 2024", program: "MBA", year: "2024", quote: "The consulting practicum was the highlight of my two years. Our team presented to a real client, and the feedback session changed how I think about recommendations." },
  { name: "Rohan Iyer", role: "BCA, Class of 2025", program: "BCA", year: "2025", quote: "Faculty were genuinely available outside class. I moved from struggling with basics to leading my capstone team in three semesters." },
  { name: "Sunita Patel", role: "Parent of B.Com student", program: "B.Com (Hons.)", year: "2026", quote: "What convinced me was the transparency — clear fee structure, regular mentor updates and a counselling team that answered questions without pressure." },
  { name: "Meher Gill", role: "B.Des Interaction Design, Class of 2024", program: "B.Des", year: "2024", quote: "Studio reviews with industry mentors were honest and specific. My graduation portfolio got me two interview calls before I even applied." },
  { name: "Dr. S. Ramanathan", role: "Parent of M.Sc Data Science student", program: "M.Sc Data Science", year: "2026", quote: "The institute kept us informed through the admission process, from document verification to counselling. The weekly progress notes were reassuring." },
];

const FAQS = [
  { category: "Admissions", q: "How do I apply for a programme?", a: "Use the Apply Now button to open the six-step online application. You will receive a unique reference number after submission which you can use to track your application status." },
  { category: "Admissions", q: "Is there an entrance examination?", a: "Most programmes admit on the basis of 10+2 or graduation merit. Where an entrance test or aptitude exercise is required (for example the B.Des portfolio review), it is mentioned on the programme page." },
  { category: "Admissions", q: "What documents are required?", a: "Photograph, identity proof, last qualifying mark sheet, transfer certificate and category certificate where applicable. The document upload step lists the exact requirements for your programme." },
  { category: "Admissions", q: "Can I edit my application after submitting?", a: "You can request corrections from the admissions office using your reference number. Fields that affect eligibility are corrected during document verification." },
  { category: "Fees & Scholarships", q: "Are scholarships available?", a: "Yes. Merit, need-based and early-bird concessions are listed on each programme page and on the Scholarships page. Awards are confirmed after document verification." },
  { category: "Fees & Scholarships", q: "Are fees payable in instalments?", a: "Tuition fees are payable semester-wise. Education loan assistance and staged payment plans are available on request from the accounts office." },
  { category: "Academics", q: "What is the typical class schedule?", a: "Programmes run on working days between 9:00 AM and 4:30 PM with laboratory and studio sessions extending to 6:00 PM on selected days." },
  { category: "Academics", q: "Is there an internship requirement?", a: "All undergraduate and postgraduate programmes include a compulsory internship or industry project, supported by the career services team." },
  { category: "Campus Life", q: "Is hostel accommodation available?", a: "Separate hostel facilities are available on a first-come basis with mess, Wi-Fi and 24×7 wardens. Applications open alongside the admission cycle." },
  { category: "Campus Life", q: "What sports and clubs are available?", a: "Students can join cricket, football, basketball, table tennis, debating, coding, photography, cultural and social-service clubs, among others." },
  { category: "General", q: "Who do I contact for admission queries?", a: "Call the admission helpline at +91 98200 41127 or write to admissions@aarohan-institute.edu. The counselling desk operates Monday to Saturday." },
  { category: "General", q: "How do I check my application status?", a: "Open the Track Application page and enter the reference number issued at submission. The status shown is updated by the admissions review team." },
];

const DOWNLOADS = [
  { title: "Institute Prospectus 2027–28", category: "Prospectus", description: "Programmes, campuses, facilities, admission process and fee overview in one document.", file: "/documents/prospectus-2027-28.txt" },
  { title: "Fee Structure & Scholarships", category: "Fees", description: "Programme-wise fee table with scholarship categories and payment schedule.", file: "/documents/fee-structure-2027-28.txt" },
  { title: "Admission Checklist", category: "Admissions", description: "Documents and steps required before submitting an application.", file: "/documents/admission-checklist.txt" },
  { title: "Academic Calendar (Draft)", category: "Academic", description: "Indicative semester dates, examinations and holiday schedule.", file: "/documents/academic-calendar.txt" },
];

/* ------------------------------------------------------------------ */
/* enquiry & application generators                                    */
/* ------------------------------------------------------------------ */

const STUDENT_NAMES = [
  "Aadhya Sharma", "Kabir Malhotra", "Tanvi Desai", "Aditya Rane", "Nikita Joshi",
  "Samar Roy", "Diya Menon", "Yash Thakur", "Ananya Pillai", "Rehan Sheikh",
  "Pooja Ramesh", "Devansh Gupta", "Simran Kaur", "Manav Trivedi", "Riya Chawla",
  "Arnav Bose", "Fatima Ansari", "Karthik Nair", "Ira Kulkarni", "Varun Saxena",
  "Zoya Mirza", "Harsh Vardhan", "Ayesha Khan", "Parth Bhatt", "Sneha Gaikwad",
  "Naveen Reddy", "Tanya Kapoor", "Imran Shaikh", "Gaurav Pandey", "Rhea Fernandes",
  "Siddharth Jain", "Mitali Sen", "Aryan Chadha", "Neha Vyas", "Rudra Pratap",
  "Sanya Grover", "Tejas Kolte", "Anushka Banerjee", "Karan Gill", "Preeti Sathe",
  "Om Prakash", "Laila Siddiqui", "Joshua D'Souza", "Charu Mahajan", "Abhinav Tiwari",
];

const SOURCES: [string, number][] = [
  ["Website", 38],
  ["Phone", 20],
  ["Referral", 12],
  ["Social Media", 12],
  ["Walk-in", 8],
  ["Campaign", 6],
  ["Event", 4],
];

const STATUSES_WEIGHTED: [string, number][] = [
  ["new", 14],
  ["contact_pending", 8],
  ["contacted", 14],
  ["interested", 14],
  ["counselling_scheduled", 10],
  ["application_started", 10],
  ["application_submitted", 10],
  ["converted", 8],
  ["not_interested", 6],
  ["invalid_lead", 4],
];

const MESSAGE_POOL = [
  "Please share the fee structure and eligibility for this programme.",
  "I want to understand the admission timeline and counselling dates.",
  "Is hostel accommodation available with this course?",
  "Looking for information on scholarships based on 10+2 marks.",
  "Could someone call me after 5 PM to discuss course options?",
  "What are the placement outcomes for recent graduates of this programme?",
  "I need details on the document checklist before applying.",
  "Is this programme offered in part-time mode as well?",
  "",
  "",
];

const OUTCOMES = ["Connected", "Voicemail", "Requested callback", "Sent brochure on WhatsApp", "Counselling booked", "Not reachable"];

function ensureReferenceTables(db: Db) {
  const insertRole = db.prepare(
    `INSERT OR IGNORE INTO roles (key, name, description) VALUES (?, ?, ?)`,
  );
  for (const [key, role] of Object.entries(ROLE_DEFINITIONS)) {
    insertRole.run(key, role.name, role.description);
  }

  const insertPermission = db.prepare(
    `INSERT OR IGNORE INTO permissions (key, name, category) VALUES (?, ?, ?)`,
  );
  const categories: Record<string, string> = {
    dashboard: "Dashboard",
    enquiries: "Enquiries",
    applications: "Admissions",
    courses: "Academics",
    faculty: "Academics",
    departments: "Academics",
    content: "Content",
    media: "Content",
    students: "Students",
    reports: "Reports",
    users: "Users",
    settings: "Settings",
    audit: "Security",
    notifications: "Notifications",
  };
  for (const permission of ALL_PERMISSIONS) {
    const [group, action] = permission.split(".");
    insertPermission.run(
      permission,
      `${action.charAt(0).toUpperCase() + action.slice(1)} — ${group}`,
      categories[group] ?? "General",
    );
  }

  const insertRolePermission = db.prepare(
    `INSERT OR IGNORE INTO role_permissions (role_key, permission_key) VALUES (?, ?)`,
  );
  for (const [key, role] of Object.entries(ROLE_DEFINITIONS)) {
    for (const permission of role.permissions) insertRolePermission.run(key, permission);
  }

  const insertSetting = db.prepare(
    `INSERT OR IGNORE INTO site_settings (setting_key, setting_value, group_name, label, type, help)
     VALUES (?, ?, ?, ?, ?, ?)`,
  );
  for (const [key, meta] of Object.entries(SETTING_DEFINITIONS)) {
    insertSetting.run(key, meta.value, meta.group, meta.label, meta.type, meta.help ?? "");
  }

  const insertEnquiryStatus = db.prepare(
    `INSERT OR IGNORE INTO enquiry_statuses (key, name, color, sort_order) VALUES (?, ?, ?, ?)`,
  );
  for (const [key, name, color, sort] of ENQUIRY_STATUSES) insertEnquiryStatus.run(key, name, color, sort);

  const insertAppStatus = db.prepare(
    `INSERT OR IGNORE INTO application_statuses (key, name, color, sort_order, requires_reason) VALUES (?, ?, ?, ?, ?)`,
  );
  for (const [key, name, color, sort, reason] of APPLICATION_STATUSES)
    insertAppStatus.run(key, name, color, sort, reason);
}

export function seedDatabase(db: Db, options: { force?: boolean } = {}): void {
  const existingUsers = (db.prepare("SELECT COUNT(*) AS c FROM users").get() as { c: number }).c;
  if (existingUsers > 0 && !options.force) return;

  if (options.force) {
    const tables = [
      "audit_logs", "notifications", "downloads", "content_blocks", "site_settings", "faqs",
      "testimonials", "gallery_items", "news_posts", "events", "application_reviews",
      "application_documents", "admission_applications", "follow_up_tasks", "enquiry_activities",
      "enquiry_notes", "enquiries", "faculty", "courses", "departments", "academic_sessions",
      "sessions", "users", "role_permissions", "permissions", "roles", "application_statuses",
      "enquiry_statuses",
    ];
    db.pragma("foreign_keys = OFF");
    for (const table of tables) {
      try {
        db.exec(`DELETE FROM ${table}`);
      } catch {
        // table may not exist yet
      }
    }
    db.pragma("foreign_keys = ON");
  }

  rngState = 20270118;

  const run = db.transaction(() => {
    ensureReferenceTables(db);

    /* users ------------------------------------------------------------ */
    const passwordHash = bcrypt.hashSync(DEMO_PASSWORD, 10);
    const insertUser = db.prepare(
      `INSERT INTO users (name, email, phone, password_hash, role_key, status, designation, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?)`,
    );
    const users: { id: number; name: string; role: string }[] = [];
    const seedUsers: [string, string, string, string, string][] = [
      ["Arun Prabhu", "admin@agentiva.demo", "+91 98200 41100", "super_admin", "Director — Institute Administration"],
      ["Priya Menon", "priya.menon@aarohan.demo", "+91 98200 41101", "admission_manager", "Head of Admissions"],
      ["Rahul Verma", "rahul.verma@aarohan.demo", "+91 98200 41102", "counsellor", "Admission Counsellor"],
      ["Neha Iyer", "neha.iyer@aarohan.demo", "+91 98200 41103", "counsellor", "Admission Counsellor"],
      ["Amit Singh", "amit.singh@aarohan.demo", "+91 98200 41104", "counsellor", "Senior Counsellor"],
      ["Kavya Reddy", "editor@aarohan.demo", "+91 98200 41105", "editor", "Web Content Editor"],
    ];
    for (const [name, email, phone, role, designation] of seedUsers) {
      const info = insertUser.run(name, email, phone, passwordHash, role, designation, daysAgo(int(120, 300)), daysAgo(int(1, 30)));
      users.push({ id: Number(info.lastInsertRowid), name, role });
    }
    const counsellors = users.filter((user) => user.role === "counsellor");
    const manager = users.find((user) => user.role === "admission_manager");

    /* academic sessions ------------------------------------------------- */
    const insertSession = db.prepare(
      `INSERT INTO academic_sessions (name, slug, start_date, end_date, application_deadline, is_current, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    );
    insertSession.run("2026–27", "2026-27", "2026-08-01", "2027-05-31", "2026-12-31", 0, "closed");
    const currentSessionId = Number(
      insertSession.run("2027–28", "2027-28", "2027-08-01", "2028-05-31", "2027-07-31", 1, "open").lastInsertRowid,
    );
    insertSession.run("2028–29", "2028-29", "2028-08-01", "2029-05-31", "2028-07-31", 0, "upcoming");

    /* departments -------------------------------------------------------- */
    const insertDepartment = db.prepare(
      `INSERT INTO departments (name, slug, code, overview, image, visibility, sort_order, seo_title, seo_description, created_at)
       VALUES (?, ?, ?, ?, ?, 'published', ?, ?, ?, ?)`,
    );
    const departmentIds: number[] = [];
    DEPARTMENTS.forEach((department, index) => {
      const id = Number(
        insertDepartment
          .run(
            department.name,
            slugify(department.name),
            department.code,
            department.overview,
            department.image,
            index + 1,
            `${department.name} | Aarohan Institute`,
            department.overview.slice(0, 155),
            daysAgo(int(200, 400)),
          ).lastInsertRowid,
      );
      departmentIds.push(id);
    });

    /* courses ------------------------------------------------------------ */
    const insertCourse = db.prepare(
      `INSERT INTO courses (name, slug, code, degree_level, department_id, duration_months, duration_label,
         study_mode, seats, eligibility, overview, description, learning_outcomes, curriculum, careers,
         fee_amount, fee_note, scholarship_info, image, status, featured, session_ids, faqs, seo_title,
         seo_description, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    const courseIds: number[] = [];
    for (const course of COURSES) {
      const id = Number(
        insertCourse.run(
          course.name,
          slugify(course.name),
          course.code,
          course.degreeLevel,
          departmentIds[course.department - 1],
          course.durationMonths,
          course.durationLabel,
          course.studyMode,
          course.seats,
          course.eligibility,
          course.overview,
          course.description,
          JSON.stringify(course.outcomes),
          JSON.stringify(course.curriculum),
          JSON.stringify(course.careers),
          course.fee,
          course.feeNote,
          course.scholarship,
          course.image,
          "published",
          course.featured ? 1 : 0,
          JSON.stringify([currentSessionId]),
          JSON.stringify(course.faqs),
          `${course.name} | Aarohan Institute`,
          course.overview.slice(0, 155),
          daysAgo(int(120, 300)),
          daysAgo(int(1, 40)),
        ).lastInsertRowid,
      );
      courseIds.push(id);
    }

    /* faculty ------------------------------------------------------------ */
    const insertFaculty = db.prepare(
      `INSERT INTO faculty (name, slug, designation, department_id, qualifications, experience_years,
         research_interests, expertise, bio, email, photo, display_order, visibility, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', ?)`,
    );
    FACULTY.forEach((member, index) => {
      const email = `${member.name.split(" ").slice(-1)[0].toLowerCase()}.${member.name.split(" ")[0].toLowerCase()}@aarohan.demo`;
      insertFaculty.run(
        member.name,
        slugify(member.name),
        member.designation,
        departmentIds[member.dept - 1],
        member.quals,
        member.exp,
        JSON.stringify(member.research),
        JSON.stringify(member.research),
        `${member.name} leads teaching and research at Aarohan with ${member.exp} years of academic and industry experience. ${member.designation}.`,
        email,
        member.photo,
        index + 1,
        daysAgo(int(90, 260)),
      );
    });

    /* news --------------------------------------------------------------- */
    const insertNews = db.prepare(
      `INSERT INTO news_posts (title, slug, category, excerpt, body, cover_image, author, status, published_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'published', ?, ?)`,
    );
    for (const item of NEWS) {
      insertNews.run(
        item.title,
        slugify(item.title),
        item.category,
        item.excerpt,
        item.body,
        item.image,
        "Editorial Team",
        daysAgo(item.daysAgo, 9),
        daysAgo(item.daysAgo, 9),
      );
    }

    /* events -------------------------------------------------------------- */
    const insertEvent = db.prepare(
      `INSERT INTO events (title, slug, category, summary, body, location, starts_at, image, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'published', ?)`,
    );
    for (const item of EVENTS) {
      insertEvent.run(
        item.title,
        slugify(item.title),
        item.category,
        item.summary,
        item.body,
        item.location,
        daysFromNow(item.days, 10),
        item.category === "Admission" ? "/images/news-1.jpg" : item.category === "Sports" ? "/images/sports.jpg" : "/images/seminar.jpg",
        daysAgo(int(10, 60)),
      );
    }

    /* gallery ------------------------------------------------------------- */
    const insertGallery = db.prepare(
      `INSERT INTO gallery_items (title, category, image, alt, caption, sort_order, status)
       VALUES (?, ?, ?, ?, ?, ?, 'published')`,
    );
    GALLERY.forEach((item, index) => {
      insertGallery.run(item.title, item.category, item.image, item.title, item.caption, index + 1);
    });

    /* testimonials --------------------------------------------------------- */
    const insertTestimonial = db.prepare(
      `INSERT INTO testimonials (name, role, program, grad_year, quote, photo, rating, is_demo, status, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, 5, 1, 'published', ?)`,
    );
    TESTIMONIALS.forEach((item, index) => {
      insertTestimonial.run(
        item.name,
        item.role,
        item.program,
        item.year,
        item.quote,
        `/images/p-${String((index % 16) + 1).padStart(2, "0")}.jpg`,
        index + 1,
      );
    });

    /* faqs ---------------------------------------------------------------- */
    const insertFaq = db.prepare(
      `INSERT INTO faqs (category, question, answer, sort_order, status) VALUES (?, ?, ?, ?, 'published')`,
    );
    FAQS.forEach((item, index) => insertFaq.run(item.category, item.q, item.a, index + 1));

    /* downloads ----------------------------------------------------------- */
    const insertDownload = db.prepare(
      `INSERT INTO downloads (title, category, description, file_path, status) VALUES (?, ?, ?, ?, 'published')`,
    );
    for (const item of DOWNLOADS) insertDownload.run(item.title, item.category, item.description, item.file);

    /* content blocks ------------------------------------------------------- */
    const insertBlock = db.prepare(
      `INSERT INTO content_blocks (block_key, title, body, image, meta, status, updated_at)
       VALUES (?, ?, ?, ?, ?, 'published', ?)`,
    );
    insertBlock.run(
      "director_message",
      "A message from the Director",
      "Education works when curiosity meets opportunity. At Aarohan we have tried to build an environment where students are challenged by their teachers, supported by their mentors and exposed to the world of work long before they graduate.\n\nWe do not ask students to fit a mould. We ask them to explore widely, work honestly and leave with the confidence to build something of their own. I look forward to welcoming you to our campus.",
      "/images/director.jpg",
      JSON.stringify({ name: "Dr. Sunita Raghunath", role: "Director & Professor of Management", signature: "Sunita Raghunath" }),
      daysAgo(30),
    );
    insertBlock.run(
      "about_overview",
      "Building capable, curious graduates since 2004",
      "Aarohan Institute of Higher Education is a modern private institute offering undergraduate, postgraduate, diploma and professional programmes across six academic schools. Our teaching model combines classroom fundamentals with laboratory practice, studio work, industry projects and structured mentorship.\n\nThis website is a demonstration build by Agentiva — a software development agency that designs and builds websites, admission systems and business automation for educational institutes. Every institute, person, programme and statistic shown here is fictional sample content.",
      "/images/about-campus.jpg",
      JSON.stringify({ founded: "2004", campuses: "1", schools: "6" }),
      daysAgo(45),
    );
    insertBlock.run(
      "why_choose",
      "Why students choose Aarohan",
      "",
      "",
      JSON.stringify({
        items: [
          { icon: "Users", title: "Experienced faculty", text: "Teachers with academic depth and industry practice who remain accessible outside class hours." },
          { icon: "FlaskConical", title: "Modern laboratories", text: "Networked computing, engineering, clinical and design studios equipped for real project work." },
          { icon: "Briefcase", title: "Industry-oriented curriculum", text: "Programmes reviewed annually with partner organisations so coursework stays current." },
          { icon: "TrendingUp", title: "Career & placement support", text: "Structured mentoring, aptitude training, internships and dedicated placement coordination." },
          { icon: "BookOpen", title: "Library & research resources", text: "Print and digital collections, journal access and guided research methodology support." },
          { icon: "HeartHandshake", title: "Student mentorship", text: "Every student is assigned a faculty mentor for academic progress and personal guidance." },
          { icon: "Palette", title: "Clubs & activities", text: "Debate, coding, cultural, sports and social-service clubs run by the student council." },
          { icon: "Wifi", title: "Campus facilities", text: "Wi-Fi enabled classrooms, seminar halls, sports complex, cafeteria and hostel accommodation." },
        ],
      }),
      daysAgo(45),
    );
    insertBlock.run(
      "mission_vision",
      "Vision & mission",
      "",
      "",
      JSON.stringify({
        vision: "To be a learner-centred institute where academic rigour, practical skill and character are developed together.",
        mission: [
          "Deliver programmes that combine strong fundamentals with applied practice.",
          "Maintain faculty who teach with currency, care and accountability.",
          "Build industry exposure into every programme through projects and internships.",
          "Support each student with structured mentoring and career guidance.",
          "Practise transparent, ethical and responsive administration.",
        ],
        values: [
          { title: "Integrity", text: "Honest assessment, transparent fees and responsible communication." },
          { title: "Curiosity", text: "Learning that continues well beyond the syllabus." },
          { title: "Craft", text: "Taking pride in well-made work, whether code, research or design." },
          { title: "Community", text: "A campus where every student is known and supported." },
        ],
      }),
      daysAgo(60),
    );
    insertBlock.run(
      "placements",
      "Placement & career services",
      "The career services team works with students from the first year on résumé building, aptitude readiness, mock interviews and internship applications. Partner organisations visit campus for talks, assessments and final placements.\n\nFigures published on this demo site are sample data and must be replaced with verified institute disclosures before public launch.",
      "/images/placement.jpg",
      JSON.stringify({
        stats: [
          { label: "Partner organisations", value: "75+" },
          { label: "Internship supports (sample)", value: "400+" },
          { label: "Career workshops per year", value: "30+" },
          { label: "Mock interview rounds", value: "3 rounds" },
        ],
        steps: ["Résumé and portfolio review", "Aptitude and communication workshops", "Mock interviews with faculty and alumni", "Placement drives and offer processing"],
      }),
      daysAgo(35),
    );

    /* enquiries ------------------------------------------------------------ */
    const insertEnquiry = db.prepare(
      `INSERT INTO enquiries (ref, name, phone, email, course_id, course_interest, source, source_page,
         utm_campaign, preferred_contact, message, consent, status, priority, counsellor_id, tags,
         last_contacted_at, next_followup_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    const insertNote = db.prepare(
      `INSERT INTO enquiry_notes (enquiry_id, author_id, note_type, body, outcome, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    );
    const insertActivity = db.prepare(
      `INSERT INTO enquiry_activities (enquiry_id, actor_id, action, detail, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    );
    const insertFollowUp = db.prepare(
      `INSERT INTO follow_up_tasks (enquiry_id, counsellor_id, due_at, note, status, outcome, completed_at, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );

    const enquiryIds: number[] = [];
    for (let index = 0; index < COURSES.length; index++) {
      enquiryIds.push(0);
    }
    const courseWeights: [string, number][] = courseIds.map((id, i) => [String(id), i < 5 ? 3 : 2]);

    for (let i = 0; i < STUDENT_NAMES.length; i++) {
      const name = STUDENT_NAMES[i];
      const source = pickWeighted(SOURCES);
      const status = pickWeighted(STATUSES_WEIGHTED);
      const priority = pickWeighted([["low", 12], ["medium", 55], ["high", 25], ["urgent", 8]]);
      const courseIndex = Math.min(COURSES.length - 1, Math.floor(rnd() * COURSES.length));
      const courseId = courseIds[courseIndex];
      void courseWeights;
      const phone = `+91 9${int(100000000, 999999999)}`.slice(0, 14);
      const email = `${slugify(name).replace(/-/g, ".")}@example.com`;
      const assigned = ["converted", "application_submitted", "application_started", "counselling_scheduled"].includes(status)
        ? pick(counsellors)
        : rnd() > 0.35
          ? pick(counsellors)
          : undefined;
      const createdDays = int(2, 130);
      const createdAt = daysAgo(createdDays, int(9, 19), int(0, 59));
      const isFollowed = !["new", "invalid_lead", "not_interested"].includes(status);
      const lastContacted = isFollowed ? daysAgo(Math.max(0, createdDays - int(0, Math.min(createdDays, 30))), int(10, 18)) : null;
      const nextFollowup =
        ["contact_pending", "contacted", "interested", "counselling_scheduled"].includes(status) && rnd() > 0.35
          ? rnd() > 0.5
            ? daysFromNow(int(1, 12), int(10, 17))
            : daysAgo(int(1, 6), int(10, 17))
          : null;

      const ref = `ENQ-2026-${String(i + 1).padStart(4, "0")}`;
      const info = insertEnquiry.run(
        ref,
        name,
        phone,
        email,
        courseId,
        COURSES[courseIndex].name,
        source,
        source === "Website" ? pick(["/courses", "/admissions", `/courses/${slugify(COURSES[courseIndex].name)}`, "/"]) : "",
        source === "Campaign" ? pick(["google-search-2027", "meta-openhouse", "campus-tour-q3"]) : "",
        pick(["Phone", "Phone", "WhatsApp", "Email"]),
        pick(MESSAGE_POOL),
        status,
        priority,
        assigned?.id ?? manager?.id ?? null,
        JSON.stringify(pick([["hot-lead"], ["scholarship"], ["hostel-query"], ["evening-callback"], []])),
        lastContacted,
        nextFollowup,
        createdAt,
        daysAgo(Math.max(0, createdDays - int(0, Math.min(createdDays, 10))), int(10, 18)),
      );
      const enquiryId = Number(info.lastInsertRowid);

      insertActivity.run(enquiryId, null, "created", `Enquiry received via ${source}`, createdAt);
      if (assigned) insertActivity.run(enquiryId, manager?.id ?? null, "assigned", `Assigned to ${assigned.name}`, daysAgo(Math.max(0, createdDays - 1), 11));

      const noteCount = isFollowed ? int(1, 3) : rnd() > 0.65 ? 1 : 0;
      for (let n = 0; n < noteCount; n++) {
        const author = assigned ?? pick(counsellors);
        insertNote.run(
          enquiryId,
          author.id,
          pick(["call", "call", "whatsapp", "note", "email"]),
          pick([
            "Discussed programme options, shared fee structure on WhatsApp.",
            "Spoke with parent about eligibility and counselling dates.",
            "Student requested details about scholarship criteria.",
            "Follow-up call scheduled after campus visit.",
            "Explained document checklist and application steps.",
            "Number not reachable — will retry in the evening.",
          ]),
          pick(OUTCOMES),
          daysAgo(Math.max(0, createdDays - int(0, createdDays)), int(10, 18)),
        );
      }

      if (["contact_pending", "contacted", "interested", "counselling_scheduled", "application_started"].includes(status) || rnd() > 0.6) {
        const dueFuture = rnd() > 0.5;
        const dueAt = dueFuture ? daysFromNow(int(1, 14), int(10, 17)) : daysAgo(int(1, 10), int(10, 17));
        const completed = dueFuture ? rnd() > 0.6 : rnd() > 0.45;
        insertFollowUp.run(
          enquiryId,
          (assigned ?? pick(counsellors)).id,
          dueAt,
          pick([
            "Confirm counselling slot",
            "Share fee structure and scholarship details",
            "Check whether application has been started",
            "Reminder call about document checklist",
            "Follow up after campus visit",
          ]),
          completed ? "completed" : "pending",
          completed ? pick(OUTCOMES) : "",
          completed ? daysAgo(int(0, 3), int(11, 18)) : null,
          manager?.id ?? null,
          daysAgo(Math.max(0, createdDays - 2), 12),
        );
      }
    }

    /* admission applications ---------------------------------------------- */
    const insertApplication = db.prepare(
      `INSERT INTO admission_applications (ref, enquiry_id, full_name, dob, gender, email, phone, parent_name,
         parent_phone, qualification, institution_name, board, passing_year, marks, course_id, course_name,
         department_id, study_mode, session_id, session_name, preference2, address, permanent_address,
         same_as_current, city, state, postal_code, status, document_status, reviewer_id, consent,
         source_page, submitted_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
    );
    const insertDocument = db.prepare(
      `INSERT INTO application_documents (application_id, doc_type, original_name, stored_name, mime_type, size_bytes, status, uploaded_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    const insertReview = db.prepare(
      `INSERT INTO application_reviews (application_id, actor_id, from_status, to_status, notes, decision_reason, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    );

    const APP_STATUS_PLAN: [string, number][] = [
      ["submitted", 3],
      ["under_review", 3],
      ["documents_required", 2],
      ["documents_verified", 2],
      ["interview_scheduled", 1],
      ["approved", 1],
      ["rejected", 1],
      ["waitlisted", 1],
      ["enrolled", 1],
    ];

    const qualificationPool = ["10+2 (Senior Secondary)", "10+2 (Science)", "B.Sc. / Bachelor's degree", "B.Com / Bachelor's degree", "Diploma"];
    let appIndex = 0;
    const applicationRefs: string[] = [];

    for (const [status, count] of APP_STATUS_PLAN) {
      for (let n = 0; n < count; n++) {
        appIndex += 1;
        const studentIndex = (appIndex * 3) % STUDENT_NAMES.length;
        const name = STUDENT_NAMES[studentIndex];
        const courseIndex = (appIndex * 2) % COURSES.length;
        const course = COURSES[courseIndex];
        const courseId = courseIds[courseIndex];
        const deptId = departmentIds[course.department - 1];
        const submittedDays = int(3, 75);
        const ref = `APP-2027-${String(appIndex).padStart(4, "0")}`;
        const linkedEnquiryRow = db
          .prepare(
            `SELECT id FROM enquiries WHERE course_id = ? AND status IN ('application_started','application_submitted','converted') ORDER BY id LIMIT 1`,
          )
          .get(courseId) as { id: number } | undefined;

        const docStatus =
          status === "documents_required" ? "partial" : ["documents_verified", "approved", "enrolled"].includes(status) ? "verified" : "pending";

        const info = insertApplication.run(
          ref,
          linkedEnquiryRow?.id ?? null,
          name,
          `${1998 + (appIndex % 6)}-0${(appIndex % 9) + 1}-1${appIndex % 9}`,
          pick(["Female", "Male", "Prefer not to say"]),
          `${slugify(name).replace(/-/g, ".")}@example.com`,
          `+91 9${int(100000000, 999999999)}`.slice(0, 14),
          pick(["Rajesh", "Sunita", "Mahesh", "Farah", "Vijay"]) + " " + name.split(" ").slice(-1)[0],
          `+91 9${int(100000000, 999999999)}`.slice(0, 14),
          pick(qualificationPool),
          pick(["St. Xavier's Senior Secondary School", "Delhi Public School", "Kendriya Vidyalaya", "Mount Carmel College", "Ryan International School", "City Government College"]),
          pick(["CBSE", "ISC", "State Board", "University of Delhi", "Mumbai University"]),
          String(2024 + (appIndex % 3)),
          pick(["88.4%", "92.1%", "76.5%", "8.2 CGPA", "81.0%", "CGPA 8.6"]),
          courseId,
          course.name,
          deptId,
          course.studyMode,
          currentSessionId,
          "2027–28",
          appIndex % 4 === 0 ? COURSES[(courseIndex + 1) % COURSES.length].name : "",
          `H.No. ${int(1, 999)}, ${pick(["Sector 15", "Green Park", "Model Town", "Ashok Vihar", "Indira Nagar"])}`,
          `H.No. ${int(1, 999)}, ${pick(["Sector 15", "Green Park", "Model Town", "Ashok Vihar", "Indira Nagar"])}`,
          1,
          pick(["Noida", "Ghaziabad", "Gurugram", "Delhi", "Meerut", "Jaipur"]),
          pick(["Uttar Pradesh", "Delhi", "Haryana", "Rajasthan"]),
          String(int(110001, 285099)),
          status,
          docStatus,
          status === "draft" ? null : pick(users.filter((user) => user.role !== "counsellor")).id,
          pick(["/admissions/apply", "/admissions", "/courses", "/contact"]),
          daysAgo(submittedDays, int(9, 20)),
          daysAgo(Math.max(0, submittedDays - int(0, 12)), int(10, 18)),
        );
        const applicationId = Number(info.lastInsertRowid);
        applicationRefs.push(ref);

        const docTypes =
          docStatus === "partial"
            ? ["Photograph", "Identity Proof", "Mark Sheet"]
            : ["Photograph", "Identity Proof", "Mark Sheet", "Transfer Certificate"];
        for (const docType of docTypes) {
          insertDocument.run(
            applicationId,
            docType,
            `${slugify(docType)}-2026.jpg`,
            `seed-${applicationId}-${slugify(docType)}.jpg`,
            "image/jpeg",
            int(48000, 480000),
            docStatus === "verified" ? "verified" : "pending",
            daysAgo(submittedDays, int(9, 20)),
          );
        }

        if (status !== "submitted") {
          insertReview.run(
            applicationId,
            pick(users.filter((user) => user.role !== "counsellor")).id,
            "submitted",
            status,
            pick([
              "Documents checked against the checklist; pending final approval.",
              "Called the applicant to confirm original document verification date.",
              "Academic record verified; moved to the next review stage.",
              "Awaiting one pending document from the applicant.",
            ]),
            status === "rejected" ? "Marks below the programme cut-off for this session." : "",
            daysAgo(Math.max(0, submittedDays - int(0, 10)), int(11, 18)),
          );
        }
      }
    }

    /* notifications --------------------------------------------------------- */
    const insertNotification = db.prepare(
      `INSERT INTO notifications (user_id, type, title, body, link, entity, entity_id, read_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    insertNotification.run(null, "info", "Demo dataset ready", "Seeded enquiries, applications and website content for the Agentiva presentation.", "/admin/dashboard", "", null, null, daysAgo(2, 9));
    insertNotification.run(null, "warning", "Email integration not configured", "Set an email provider in Settings → Integrations to enable confirmation emails.", "/admin/settings", "settings", null, null, daysAgo(2, 9));
    insertNotification.run(manager?.id ?? null, "urgent", "Follow-ups overdue", "Several follow-up tasks are past their due time in your team's queue.", "/admin/enquiries?followup=overdue", "enquiries", null, null, daysAgo(1, 8));
    insertNotification.run(manager?.id ?? null, "info", "Applications awaiting review", "Submitted applications are waiting in the review queue.", "/admin/admissions?status=submitted", "applications", null, null, daysAgo(1, 8));

    /* audit trail ------------------------------------------------------------ */
    const insertAudit = db.prepare(
      `INSERT INTO audit_logs (user_id, action, entity, entity_id, detail, ip, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    );
    insertAudit.run(users[0]?.id ?? null, "system.seed", "system", "1", "Initial demo dataset created", "local", daysAgo(2, 9));
    insertAudit.run(manager?.id ?? null, "application.status_change", "application", "4", "Status changed to Under Review", "local", daysAgo(1, 15));
    insertAudit.run(users[0]?.id ?? null, "settings.update", "settings", "announcement_text", "Updated announcement strip text", "local", daysAgo(1, 16));
  });

  run();
}
