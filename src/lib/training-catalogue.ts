import { softwarePages } from "./software-pages";
import { INDUSTRIES } from "./industries";

/**
 * The public training catalogue.
 *
 * Software and industry courses are derived from the pages we already sell,
 * not invented: if a business hires a Salestrekker VA through us, that is
 * exactly the course a Filipino VA should be able to take for free. Each
 * course therefore links to its commercial page, and the two audiences meet
 * around the same body of knowledge.
 *
 * `status` is honest. One course exists; everything else says so plainly,
 * because a free course nobody can start is worse than no promise.
 */

export type CourseStatus = "open" | "writing" | "planned";

export type TrainingCourse = {
  title: string;
  blurb: string;
  status: CourseStatus;
  /** Commercial page covering the same subject, for cross-linking. */
  href?: string;
  lessons?: number;
  minutes?: number;
};

export type TrainingLevel = {
  id: string;
  level: string;
  title: string;
  intro: string;
  /** Long levels render as a compact grid; short ones keep a row per course. */
  display: "list" | "grid";
  courses: TrainingCourse[];
};

/** Strips the shared suffix so course titles read as subjects, not job ads. */
function subject(name: string) {
  return name.replace(/\s+Virtual Assistant$/i, "").trim();
}

const FOUNDATIONS: TrainingCourse[] = [
  {
    // Written, and being ported into the training system as a real course.
    title: "Get client-ready",
    blurb: "Turn the experience you already have into a profile a client can understand quickly: summary, skills, headline, rate, portfolio, and photo.",
    status: "writing"
  },
  {
    title: "Virtual Assistant Foundations",
    blurb: "Remote work habits, professional communication, inbox and calendar, file management, research, handling mistakes, and responsible use of AI.",
    status: "writing"
  }
];

const CORE_SKILLS: TrainingCourse[] = [
  { title: "Email and inbox management", blurb: "Triage, labels, templates, and clearing a busy inbox without losing anything that matters.", status: "writing" },
  { title: "Calendar and scheduling", blurb: "Timezone maths, booking across AEST and EST, protecting focus time, and handling clashes.", status: "planned" },
  { title: "Customer support", blurb: "Tone, macros, escalation, and what never to promise on the client's behalf.", status: "planned" },
  { title: "Research and reporting", blurb: "Finding sources you can defend, and writing up what you found so it can be acted on.", status: "planned" },
  { title: "Data entry and accuracy", blurb: "Checking your own work, spotting the errors that cost money, and keeping records clean.", status: "planned" },
  { title: "Written English for client work", blurb: "Updates, apologies, questions and bad news, written so a client trusts you with more.", status: "planned" },
  { title: "Working safely with client data", blurb: "Password managers, access hygiene, and what never leaves the client's systems.", status: "planned" }
];

/** Every software page we sell becomes a course a VA can take for free. */
const SOFTWARE: TrainingCourse[] = softwarePages.map((page) => ({
  title: `${subject(page.name)} fundamentals`,
  blurb: "",
  status: "planned" as const,
  href: `/software/${page.slug}`
}));

/**
 * Industry courses come from the specialised desks, where the workflow is the
 * hard part and nobody publishes decent training. General industry pages are
 * left out: "virtual assistant for small business" is not a curriculum.
 */
const INDUSTRY_SLUGS = [
  "ndis-providers",
  "trades-service-administration",
  "accounting-firms-month-end",
  "allied-health-referral-billing",
  "mortgage-broker-loan-processing",
  "smsf-production",
  "strata-management-administration",
  "property-management-maintenance-coordination",
  "construction-estimating-tender-desk",
  "recruitment-candidate-sourcing",
  "insurance-broker-renewal-desk",
  "bim-revit-production",
  "ecommerce-stores",
  "real-estate-agents"
];

const INDUSTRY: TrainingCourse[] = INDUSTRY_SLUGS
  .map((slug) => INDUSTRIES.find((industry) => industry.slug === slug))
  .filter((industry): industry is (typeof INDUSTRIES)[number] => Boolean(industry))
  .map((industry) => ({
    title: `${industry.label} administration`,
    blurb: "",
    status: "planned" as const,
    href: `/industries/${industry.slug}`
  }));

export const TRAINING_LEVELS: TrainingLevel[] = [
  {
    id: "foundations",
    display: "list",
    level: "Level 1",
    title: "Foundations",
    intro: "Start here. What every Virtual Assistant needs before specialising.",
    courses: FOUNDATIONS
  },
  {
    id: "skills",
    display: "list",
    level: "Level 2",
    title: "Core skills",
    intro: "The work itself — the tasks clients hand over first.",
    courses: CORE_SKILLS
  },
  {
    id: "software",
    display: "grid",
    level: "Level 3",
    title: "Software",
    intro: "The tools Australian businesses actually run on, including the niche ones no other course covers.",
    courses: SOFTWARE
  },
  {
    id: "industry",
    display: "grid",
    level: "Level 4",
    title: "Industry workflows",
    intro: "How a whole desk works, so you can be trusted with it rather than given tasks one at a time.",
    courses: INDUSTRY
  }
];

export const CATALOGUE_TOTALS = {
  courses: TRAINING_LEVELS.reduce((sum, level) => sum + level.courses.length, 0),
  open: TRAINING_LEVELS.reduce((sum, level) => sum + level.courses.filter((course) => course.status === "open").length, 0)
};

export const STATUS_LABEL: Record<CourseStatus, string> = {
  open: "Open now",
  writing: "Being written",
  planned: "Planned"
};
