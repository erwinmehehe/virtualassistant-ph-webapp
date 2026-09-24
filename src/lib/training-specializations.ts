export const AUSTRALIA_SPECIALIZATIONS = [
  {
    slug: "tradie-operations",
    title: "Tradie & home-service operations",
    bestFor: "Field-service businesses such as plumbing, electrical, HVAC, cleaning, pest control, and maintenance.",
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
