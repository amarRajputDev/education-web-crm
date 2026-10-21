export type BlockKey = "director_message" | "about_overview" | "why_choose" | "mission_vision" | "placements";

export const BLOCK_KEYS: BlockKey[] = [
  "director_message",
  "about_overview",
  "why_choose",
  "mission_vision",
  "placements",
];

export type BlockDefinition = {
  key: BlockKey;
  label: string;
  placement: string;
  defaultTitle: string;
  defaultBody: string;
  defaultImage: string;
  defaultMeta: Record<string, unknown>;
};

export const BLOCK_DEFINITIONS: BlockDefinition[] = [
  {
    key: "director_message",
    label: "Director's message",
    placement: "Homepage intro + About page",
    defaultTitle: "A message from the Director",
    defaultBody:
      "Education works when curiosity meets opportunity. At Aarohan we have tried to build an environment where students are challenged by their teachers, supported by their mentors and exposed to the world of work long before they graduate.\n\nWe do not ask students to fit a mould. We ask them to explore widely, work honestly and leave with the confidence to build something of their own. I look forward to welcoming you to our campus.",
    defaultImage: "/images/director.jpg",
    defaultMeta: {
      name: "Dr. Sunita Raghunath",
      role: "Director & Professor of Management",
      signature: "Sunita Raghunath",
    },
  },
  {
    key: "about_overview",
    label: "About overview",
    placement: "About page + Academics page",
    defaultTitle: "Building capable, curious graduates since 2004",
    defaultBody:
      "Aarohan Institute of Higher Education is a modern private institute offering undergraduate, postgraduate, diploma and professional programmes across six academic schools. Our teaching model combines classroom fundamentals with laboratory practice, studio work, industry projects and structured mentorship.\n\nThis website is a demonstration build by Agentiva — a software development agency that designs and builds websites, admission systems and business automation for educational institutes. Every institute, person, programme and statistic shown here is fictional sample content.",
    defaultImage: "/images/about-campus.jpg",
    defaultMeta: { founded: "2004", campuses: "1", schools: "6" },
  },
  {
    key: "why_choose",
    label: "Why choose us",
    placement: "Homepage feature grid",
    defaultTitle: "Why students choose Aarohan",
    defaultBody: "",
    defaultImage: "",
    defaultMeta: {
      items: [
        {
          icon: "Users",
          title: "Experienced faculty",
          text: "Teachers with academic depth and industry practice who remain accessible outside class hours.",
        },
        {
          icon: "FlaskConical",
          title: "Modern laboratories",
          text: "Networked computing, engineering, clinical and design studios equipped for real project work.",
        },
        {
          icon: "Briefcase",
          title: "Industry-oriented curriculum",
          text: "Programmes reviewed annually with partner organisations so coursework stays current.",
        },
        {
          icon: "TrendingUp",
          title: "Career & placement support",
          text: "Structured mentoring, aptitude training, internships and dedicated placement coordination.",
        },
        {
          icon: "BookOpen",
          title: "Library & research resources",
          text: "Print and digital collections, journal access and guided research methodology support.",
        },
        {
          icon: "HeartHandshake",
          title: "Student mentorship",
          text: "Every student is assigned a faculty mentor for academic progress and personal guidance.",
        },
        {
          icon: "Palette",
          title: "Clubs & activities",
          text: "Debate, coding, cultural, sports and social-service clubs run by the student council.",
        },
        {
          icon: "Wifi",
          title: "Campus facilities",
          text: "Wi-Fi enabled classrooms, seminar halls, sports complex, cafeteria and hostel accommodation.",
        },
      ],
    },
  },
  {
    key: "mission_vision",
    label: "Mission & vision",
    placement: "About page",
    defaultTitle: "Vision & mission",
    defaultBody: "",
    defaultImage: "",
    defaultMeta: {
      vision:
        "To be a learner-centred institute where academic rigour, practical skill and character are developed together.",
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
    },
  },
  {
    key: "placements",
    label: "Placements",
    placement: "Placements page",
    defaultTitle: "Placement & career services",
    defaultBody:
      "The career services team works with students from the first year on résumé building, aptitude readiness, mock interviews and internship applications. Partner organisations visit campus for talks, assessments and final placements.\n\nFigures published on this demo site are sample data and must be replaced with verified institute disclosures before public launch.",
    defaultImage: "/images/placement.jpg",
    defaultMeta: {
      stats: [
        { label: "Partner organisations", value: "75+" },
        { label: "Internship supports (sample)", value: "400+" },
        { label: "Career workshops per year", value: "30+" },
        { label: "Mock interview rounds", value: "3 rounds" },
      ],
      steps: [
        "Résumé and portfolio review",
        "Aptitude and communication workshops",
        "Mock interviews with faculty and alumni",
        "Placement drives and offer processing",
      ],
    },
  },
];

export function blockDefinition(key: string): BlockDefinition | undefined {
  return BLOCK_DEFINITIONS.find((definition) => definition.key === key);
}

const IMAGE_SLUGS: string[] = [
  "hero-campus",
  "about-campus",
  "director",
  "placement",
  "laboratory",
  "classroom",
  "library",
  "research",
  "seminar",
  "workshop",
  "graduation",
  "campus-event",
  "sports",
  "news-1",
  "news-2",
  "news-3",
  "gallery-1",
  "gallery-2",
  "gallery-3",
  "gallery-4",
  "course-cs",
  "course-business",
  "course-engineering",
  "course-health",
  "course-design",
  "course-science",
];

for (let index = 1; index <= 16; index += 1) {
  IMAGE_SLUGS.push(`p-${String(index).padStart(2, "0")}`);
}

export const DEMO_IMAGES: string[] = IMAGE_SLUGS.map((slug) => `/images/${slug}.jpg`);

export const DOCUMENT_SEEDS: { title: string; path: string }[] = [
  { title: "Prospectus 2027–28", path: "/documents/prospectus-2027-28.txt" },
  { title: "Fee structure 2027–28", path: "/documents/fee-structure-2027-28.txt" },
  { title: "Admission checklist", path: "/documents/admission-checklist.txt" },
  { title: "Academic calendar", path: "/documents/academic-calendar.txt" },
];
