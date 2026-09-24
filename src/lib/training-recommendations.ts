import { getAustraliaSpecialization } from "@/lib/training-specializations";

export type TrainingRecommendationCourse = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  category: string;
  country_focus: string | null;
  estimated_minutes: number;
  enrolled: boolean;
  completedAt: string | null;
};

type RecommendationRule = {
  title: string;
  reason: string;
  slugs: string[];
};

export const SPECIALTY_PATHS: Record<string, { title: string; slugs: string[] }> = {
  "Administrative Support": {
    title: "Administrative Support path",
    slugs: ["virtual-assistant-foundations", "operations-virtual-assistant", "project-management-for-virtual-assistants"],
  },
  "Bookkeeping & Finance": {
    title: "Bookkeeping & Finance path",
    slugs: ["virtual-assistant-foundations", "bookkeeping-administration", "xero-workflows-for-virtual-assistants", "payroll-administration"],
  },
  "Customer Service": {
    title: "Customer Service path",
    slugs: ["virtual-assistant-foundations", "customer-support-virtual-assistant", "operations-virtual-assistant"],
  },
  "Dental & Healthcare": {
    title: "Healthcare Administration path",
    slugs: ["virtual-assistant-foundations", "medical-healthcare-virtual-assistant", "cliniko-for-virtual-assistants"],
  },
  Ecommerce: {
    title: "Ecommerce path",
    slugs: ["virtual-assistant-foundations", "ecommerce-virtual-assistant", "customer-support-virtual-assistant", "marketing-virtual-assistant"],
  },
  "Executive Assistance": {
    title: "Executive VA path",
    slugs: ["virtual-assistant-foundations", "executive-virtual-assistant", "project-management-for-virtual-assistants"],
  },
  "Lead Generation & Sales": {
    title: "Lead Generation & Sales path",
    slugs: ["virtual-assistant-foundations", "sales-lead-generation-virtual-assistant", "customer-support-virtual-assistant"],
  },
  "Marketing & Social Media": {
    title: "Marketing & Social Media path",
    slugs: ["virtual-assistant-foundations", "marketing-virtual-assistant", "social-media-virtual-assistant"],
  },
  "Phone & Reception": {
    title: "Reception & Client Support path",
    slugs: ["virtual-assistant-foundations", "customer-support-virtual-assistant", "operations-virtual-assistant"],
  },
  "Real Estate": {
    title: "Real Estate VA path",
    slugs: ["virtual-assistant-foundations", "real-estate-virtual-assistant", "project-management-for-virtual-assistants"],
  },
  SEO: {
    title: "SEO Virtual Assistant path",
    slugs: ["virtual-assistant-foundations", "seo-virtual-assistant", "marketing-virtual-assistant"],
  },
  "Video Editing & Creative": {
    title: "Creative Operations path",
    slugs: ["virtual-assistant-foundations", "marketing-virtual-assistant", "social-media-virtual-assistant"],
  },
  "Web & WordPress": {
    title: "Web Operations path",
    slugs: ["virtual-assistant-foundations", "operations-virtual-assistant", "project-management-for-virtual-assistants"],
  },
};

export const DEFAULT_TRAINING_PATH = {
  title: "Core VA path",
  slugs: ["virtual-assistant-foundations", "operations-virtual-assistant", "project-management-for-virtual-assistants"],
};

const NEXT_STEPS: Record<string, RecommendationRule> = {
  "virtual-assistant-foundations": {
    title: "Choose the work you want to get good at",
    reason: "You have the core VA habits. The next useful step is a role-specific workflow.",
    slugs: ["operations-virtual-assistant", "executive-virtual-assistant", "customer-support-virtual-assistant"],
  },
  "seo-virtual-assistant": {
    title: "Build a broader organic-growth stack",
    reason: "SEO work becomes more useful when you can connect search intent to content distribution and campaign execution.",
    slugs: ["marketing-virtual-assistant", "social-media-virtual-assistant", "ecommerce-virtual-assistant"],
  },
  "marketing-virtual-assistant": {
    title: "Add a channel or revenue workflow",
    reason: "Your marketing foundation can now branch into social publishing, lead generation, or ecommerce execution.",
    slugs: ["social-media-virtual-assistant", "sales-lead-generation-virtual-assistant", "ecommerce-virtual-assistant"],
  },
  "social-media-virtual-assistant": {
    title: "Connect social work to the wider funnel",
    reason: "Move from channel execution into campaign planning, ecommerce support, or lead generation.",
    slugs: ["marketing-virtual-assistant", "ecommerce-virtual-assistant", "sales-lead-generation-virtual-assistant"],
  },
  "ecommerce-virtual-assistant": {
    title: "Strengthen the customer and growth side",
    reason: "Ecommerce operations pair naturally with customer support, marketing, and process control.",
    slugs: ["customer-support-virtual-assistant", "marketing-virtual-assistant", "operations-virtual-assistant"],
  },
  "customer-support-virtual-assistant": {
    title: "Turn support skill into stronger operations",
    reason: "Customer support becomes more valuable when you can control queues, escalations, sales handoffs, and recurring workflows.",
    slugs: ["operations-virtual-assistant", "sales-lead-generation-virtual-assistant", "ecommerce-virtual-assistant"],
  },
  "executive-virtual-assistant": {
    title: "Move from executive support into delivery control",
    reason: "Project and operations skills are the natural next layer after high-trust executive support.",
    slugs: ["project-management-for-virtual-assistants", "operations-virtual-assistant", "customer-support-virtual-assistant"],
  },
  "operations-virtual-assistant": {
    title: "Deepen your delivery and coordination skills",
    reason: "Operations work grows naturally into project control, executive coordination, and service workflows.",
    slugs: ["project-management-for-virtual-assistants", "executive-virtual-assistant", "customer-support-virtual-assistant"],
  },
  "project-management-for-virtual-assistants": {
    title: "Apply project control to recurring operations",
    reason: "Use your planning and dependency skills in day-to-day operations, executive work, or property workflows.",
    slugs: ["operations-virtual-assistant", "executive-virtual-assistant", "real-estate-virtual-assistant"],
  },
  "sales-lead-generation-virtual-assistant": {
    title: "Strengthen the handoff around the sales funnel",
    reason: "Lead generation pairs well with reply handling, marketing execution, and operational follow-through.",
    slugs: ["customer-support-virtual-assistant", "marketing-virtual-assistant", "operations-virtual-assistant"],
  },
  "bookkeeping-administration": {
    title: "Build a stronger finance-admin stack",
    reason: "After bookkeeping administration, payroll and accounting-software workflows are the most practical next layer.",
    slugs: ["payroll-administration", "xero-workflows-for-virtual-assistants", "australian-bookkeeping-administration", "myob-workflows-for-virtual-assistants"],
  },
  "payroll-administration": {
    title: "Broaden your finance administration",
    reason: "Payroll fits naturally with bookkeeping controls and the accounting tools many clients use.",
    slugs: ["bookkeeping-administration", "xero-workflows-for-virtual-assistants", "myob-workflows-for-virtual-assistants"],
  },
  "medical-healthcare-virtual-assistant": {
    title: "Deepen healthcare administration",
    reason: "Move from general healthcare admin into allied-health workflows, Cliniko, or NDIS administration.",
    slugs: ["australian-allied-health-administration", "cliniko-for-virtual-assistants", "ndis-administration-fundamentals"],
  },
  "real-estate-virtual-assistant": {
    title: "Extend your property administration skills",
    reason: "Property management, short-term rentals, and project coordination build directly on real-estate administration.",
    slugs: ["property-management-administration-australia", "airbnb-short-term-rental-virtual-assistant", "project-management-for-virtual-assistants"],
  },
  "airbnb-short-term-rental-virtual-assistant": {
    title: "Move from stays into broader property operations",
    reason: "Short-term rental workflows connect naturally to property management, customer support, and recurring operations.",
    slugs: ["property-management-administration-australia", "customer-support-virtual-assistant", "operations-virtual-assistant"],
  },
  "australian-va-fundamentals": {
    title: "Choose an Australian workflow specialisation",
    reason: "You have the Australian client context. The next step is a specific administration workflow.",
    slugs: ["australian-trades-administration", "australian-allied-health-administration", "australian-bookkeeping-administration", "property-management-administration-australia"],
  },
  "australian-trades-administration": {
    title: "Add the tools behind trades administration",
    reason: "ServiceM8 and finance workflows are the natural tools layer for Australian trades operations.",
    slugs: ["servicem8-for-virtual-assistants", "xero-workflows-for-virtual-assistants", "operations-virtual-assistant"],
  },
  "servicem8-for-virtual-assistants": {
    title: "Connect ServiceM8 to the wider operations workflow",
    reason: "Use your ServiceM8 knowledge alongside trades administration, finance handoff, and operations control.",
    slugs: ["australian-trades-administration", "xero-workflows-for-virtual-assistants", "operations-virtual-assistant"],
  },
  "australian-bookkeeping-administration": {
    title: "Deepen the Australian finance toolset",
    reason: "Xero and MYOB workflows are the most direct next step after Australian bookkeeping administration.",
    slugs: ["xero-workflows-for-virtual-assistants", "myob-workflows-for-virtual-assistants", "payroll-administration", "bookkeeping-administration"],
  },
  "xero-workflows-for-virtual-assistants": {
    title: "Add another layer to your finance workflows",
    reason: "Pair Xero with Australian bookkeeping, MYOB, or payroll administration to broaden the work you can support.",
    slugs: ["australian-bookkeeping-administration", "myob-workflows-for-virtual-assistants", "payroll-administration"],
  },
  "myob-workflows-for-virtual-assistants": {
    title: "Round out your accounting-software workflows",
    reason: "Combine MYOB with Australian bookkeeping, Xero, or payroll administration for a stronger finance-admin stack.",
    slugs: ["australian-bookkeeping-administration", "xero-workflows-for-virtual-assistants", "payroll-administration"],
  },
  "australian-allied-health-administration": {
    title: "Move deeper into allied-health operations",
    reason: "Cliniko and NDIS administration build directly on allied-health coordination and privacy-aware admin.",
    slugs: ["cliniko-for-virtual-assistants", "ndis-administration-fundamentals", "medical-healthcare-virtual-assistant"],
  },
  "cliniko-for-virtual-assistants": {
    title: "Use Cliniko inside a broader healthcare workflow",
    reason: "Pair the software workflow with allied-health and NDIS administration so the tool knowledge has operating context.",
    slugs: ["australian-allied-health-administration", "ndis-administration-fundamentals", "medical-healthcare-virtual-assistant"],
  },
  "ndis-administration-fundamentals": {
    title: "Add allied-health and practice workflows",
    reason: "Allied-health administration and Cliniko complement the non-clinical NDIS administration skills you just completed.",
    slugs: ["australian-allied-health-administration", "cliniko-for-virtual-assistants", "medical-healthcare-virtual-assistant"],
  },
  "property-management-administration-australia": {
    title: "Broaden your property operations",
    reason: "Real-estate administration, finance handoff, and short-term rentals are useful adjacent property workflows.",
    slugs: ["real-estate-virtual-assistant", "xero-workflows-for-virtual-assistants", "airbnb-short-term-rental-virtual-assistant"],
  },
  "mortgage-broking-administration-australia": {
    title: "Add sales and finance workflow depth",
    reason: "Mortgage administration connects closely to lead handling, document-heavy finance support, and Australian client workflows.",
    slugs: ["sales-lead-generation-virtual-assistant", "bookkeeping-administration", "australian-va-fundamentals"],
  },
};

function uniqueSlugs(slugs: string[]) {
  return [...new Set(slugs)];
}

export function getSpecialtyTrainingPath(primaryCategory?: string | null) {
  return primaryCategory
    ? SPECIALTY_PATHS[primaryCategory] || DEFAULT_TRAINING_PATH
    : DEFAULT_TRAINING_PATH;
}

export function recommendNextTrainingCourses(args: {
  courses: TrainingRecommendationCourse[];
  currentSlug?: string | null;
  primaryCategory?: string | null;
  australiaSpecialization?: string | null;
  limit?: number;
}) {
  const limit = Math.max(1, Math.min(3, args.limit || 3));
  const rule = args.currentSlug ? NEXT_STEPS[args.currentSlug] || null : null;
  const specialty = getSpecialtyTrainingPath(args.primaryCategory);
  const australiaPath = args.australiaSpecialization
    ? getAustraliaSpecialization(args.australiaSpecialization)
    : null;
  const current = args.currentSlug
    ? args.courses.find((course) => course.slug === args.currentSlug) || null
    : null;
  const allowAustralia = Boolean(australiaPath || current?.country_focus === "Australia");

  const priority: string[] = [];

  if (args.currentSlug === "virtual-assistant-foundations" && args.primaryCategory) {
    priority.push(...specialty.slugs);
  }

  if (
    australiaPath &&
    (args.currentSlug === "virtual-assistant-foundations" ||
      args.currentSlug === "australian-va-fundamentals" ||
      current?.country_focus === "Australia")
  ) {
    priority.push(...australiaPath.courses);
  }

  if (rule) priority.push(...rule.slugs);
  if (args.primaryCategory) priority.push(...specialty.slugs);
  priority.push(...DEFAULT_TRAINING_PATH.slugs);

  const bySlug = new Map(args.courses.map((course) => [course.slug, course]));
  const recommendations = uniqueSlugs(priority)
    .filter((slug) => slug !== args.currentSlug)
    .map((slug) => bySlug.get(slug) || null)
    .filter((course): course is TrainingRecommendationCourse => Boolean(course))
    .filter((course) => !course.completedAt)
    .filter((course) => allowAustralia || course.country_focus !== "Australia")
    .slice(0, limit);

  if (recommendations.length < limit) {
    for (const course of args.courses) {
      if (
        recommendations.length >= limit ||
        course.slug === args.currentSlug ||
        course.completedAt ||
        (!allowAustralia && course.country_focus === "Australia") ||
        recommendations.some((item) => item.slug === course.slug)
      ) {
        continue;
      }
      recommendations.push(course);
    }
  }

  return {
    title: rule?.title || specialty.title,
    reason:
      rule?.reason ||
      (args.primaryCategory
        ? `This continues your ${args.primaryCategory} learning path without making training a hiring requirement.`
        : "These courses build naturally on the work you have already completed."),
    courses: recommendations,
  };
}
