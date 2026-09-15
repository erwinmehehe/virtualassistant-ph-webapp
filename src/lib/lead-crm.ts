export const LEAD_CRM_STAGES = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "discovery_booked", label: "Discovery booked" },
  { value: "qualified", label: "Qualified" },
  { value: "terms_sent", label: "Terms sent" },
  // Kept only for compatibility with records written by an older deployment.
  // New proposal sends use terms_sent; client shortlist state belongs to jobs.
  { value: "shortlist_sent", label: "Legacy proposal sent" },
  { value: "nurture", label: "Nurture" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" }
] as const;

export type LeadCrmStage = (typeof LEAD_CRM_STAGES)[number]["value"];

export const OPEN_LEAD_STAGES: LeadCrmStage[] = [
  "new",
  "contacted",
  "discovery_booked",
  "qualified",
  "terms_sent",
  "shortlist_sent",
  "nurture"
];

export function isLeadCrmStage(value: string): value is LeadCrmStage {
  return LEAD_CRM_STAGES.some((stage) => stage.value === value);
}

export function leadStageLabel(value?: string | null) {
  return LEAD_CRM_STAGES.find((stage) => stage.value === value)?.label || "New";
}

export function legacyLeadStatus(stage: LeadCrmStage) {
  if (stage === "lost") return "archived";
  if (["qualified", "terms_sent", "shortlist_sent", "won"].includes(stage)) return "converted";
  return "new";
}

export function isOpenLeadStage(stage?: string | null) {
  return OPEN_LEAD_STAGES.includes((stage || "new") as LeadCrmStage);
}
