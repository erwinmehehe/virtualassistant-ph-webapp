export const AUSTRALIA_SPECIALIZATIONS = [
  {
    slug: "tradie-operations",
    title: "Tradie & home-service operations",
    bestFor: "Field-service businesses such as plumbing, electrical, HVAC, cleaning, pest control, and maintenance.",
    outcomes: [
      "Manage job intake, scheduling, follow-up, and admin handoffs.",
      "Work inside ServiceM8-style field-service workflows with cleaner records.",
      "Support invoicing and bookkeeping handoffs without crossing approval boundaries.",
    ],
    startSignals: ["australian-trades-administration", "servicem8-for-virtual-assistants"],
    courses: [
      "virtual-assistant-foundations",
      "australian-va-fundamentals",
      "australian-trades-administration",
      "servicem8-for-virtual-assistants",
      "xero-workflows-for-virtual-assistants",
    ],
  },
  {
    slug: "property-management",
    title: "Property management administration",
    bestFor: "Property managers, real-estate teams, maintenance coordinators, and residential portfolio support.",
    outcomes: [
      "Handle tenancy and maintenance administration with clear escalation rules.",
      "Keep property records, follow-ups, and routine client communication organised.",
      "Support finance and reconciliation handoffs without making approval decisions.",
    ],
    startSignals: ["property-management-administration-australia"],
    courses: [
      "virtual-assistant-foundations",
      "australian-va-fundamentals",
      "property-management-administration-australia",
      "xero-workflows-for-virtual-assistants",
    ],
  },
  {
    slug: "ndis-allied-health",
    title: "NDIS & allied health administration",
    bestFor: "NDIS providers, allied-health clinics, therapy practices, and non-clinical healthcare administration.",
    outcomes: [
      "Support participant, referral, appointment, and non-clinical admin workflows.",
      "Maintain accurate records while respecting privacy and clinical boundaries.",
      "Work confidently across NDIS, allied-health, and Cliniko-style administration.",
    ],
    startSignals: ["ndis-administration-fundamentals", "australian-allied-health-administration"],
    courses: [
      "virtual-assistant-foundations",
      "australian-va-fundamentals",
      "ndis-administration-fundamentals",
      "australian-allied-health-administration",
      "cliniko-for-virtual-assistants",
    ],
  },
  {
    slug: "mortgage-broking",
    title: "Mortgage broking administration",
    bestFor: "Mortgage brokers and finance teams needing organised document, CRM, milestone, and client administration.",
    outcomes: [
      "Prepare and track client documents through defined loan-administration stages.",
      "Keep CRM milestones, follow-ups, and document requests current.",
      "Support brokers without giving credit advice or making lending decisions.",
    ],
    startSignals: ["mortgage-broking-administration-australia"],
    courses: [
      "virtual-assistant-foundations",
      "australian-va-fundamentals",
      "mortgage-broking-administration-australia",
    ],
  },
] as const;

export type AustraliaSpecializationSlug = (typeof AUSTRALIA_SPECIALIZATIONS)[number]["slug"];

export const SHARED_AUSTRALIA_COURSES = new Set([
  "virtual-assistant-foundations",
  "australian-va-fundamentals",
]);

export function getAustraliaSpecialization(slug: string) {
  return AUSTRALIA_SPECIALIZATIONS.find((item) => item.slug === slug) || null;
}

export function isAustraliaSpecializationSlug(value: string): value is AustraliaSpecializationSlug {
  return AUSTRALIA_SPECIALIZATIONS.some((item) => item.slug === value);
}


export function getAustraliaSpecializationsForCourse(courseSlug: string) {
  return AUSTRALIA_SPECIALIZATIONS.filter((item) =>
    item.courses.some((slug) => slug === courseSlug)
  );
}
