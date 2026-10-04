export const LEAD_LOSS_REASONS = [
  { code: "too_expensive", label: "Price too high", recoverable: true, winBackDays: 60 },
  { code: "budget_too_low", label: "Budget too low", recoverable: true, winBackDays: 60 },
  { code: "hiring_postponed", label: "Hiring postponed", recoverable: true, winBackDays: 30 },
  { code: "competitor", label: "Chose a competitor", recoverable: true, winBackDays: 90 },
  { code: "hired_independently", label: "Hired independently", recoverable: true, winBackDays: 90 },
  { code: "couldnt_reach", label: "Could not reach / no response", recoverable: true, winBackDays: 14 },
  { code: "no_show", label: "Discovery no-show", recoverable: true, winBackDays: 14 },
  { code: "wrong_service", label: "Wrong service / scope", recoverable: false, winBackDays: null },
  { code: "offshore_concern", label: "Trust / offshore concern", recoverable: true, winBackDays: 30 },
  { code: "expertise_gap", label: "Different expertise needed", recoverable: true, winBackDays: 45 },
  { code: "not_a_fit", label: "Not a fit", recoverable: false, winBackDays: null },
  { code: "duplicate", label: "Duplicate inquiry", recoverable: false, winBackDays: null },
  { code: "spam", label: "Spam", recoverable: false, winBackDays: null },
  { code: "other", label: "Other", recoverable: false, winBackDays: null },
] as const;

export type LeadLossReasonCode = (typeof LEAD_LOSS_REASONS)[number]["code"];

const LOSS_REASON_MAP = new Map<string, (typeof LEAD_LOSS_REASONS)[number]>(
  LEAD_LOSS_REASONS.map((reason) => [reason.code, reason]),
);

export function isLeadLossReasonCode(value: unknown): value is LeadLossReasonCode {
  return typeof value === "string" && LOSS_REASON_MAP.has(value);
}

export function getLeadLossReason(value?: string | null) {
  return value ? LOSS_REASON_MAP.get(value) || null : null;
}

export function leadLossReasonLabel(value?: string | null) {
  return getLeadLossReason(value)?.label || "Unclassified";
}

export function isRecoverableLeadLoss(value?: string | null) {
  return Boolean(getLeadLossReason(value)?.recoverable);
}

export function winBackAtForLoss(value: string | null | undefined, now = new Date()) {
  const days = getLeadLossReason(value)?.winBackDays;
  if (!days) return null;
  return new Date(now.getTime() + days * 86400000).toISOString();
}

export function inferLegacyLossReasonCode(value?: string | null): LeadLossReasonCode | null {
  const text = String(value || "").trim().toLowerCase();
  if (!text) return null;
  if (text.includes("spam") || text.includes("smoke test") || text.includes("test booking") || text.includes("production smoke")) return "spam";
  if (text.includes("duplicate")) return "duplicate";
  if (text.includes("no response") || text.includes("could not reach") || text.includes("couldn't reach") || text.includes("stale")) return "couldnt_reach";
  if (text.includes("no-show") || text.includes("no show")) return "no_show";
  if (text.includes("too expensive") || text.includes("price")) return "too_expensive";
  if (text.includes("budget")) return "budget_too_low";
  if (text.includes("postpon") || text.includes("timing") || text.includes("not ready")) return "hiring_postponed";
  if (text.includes("competitor")) return "competitor";
  if (text.includes("hired elsewhere") || text.includes("hired independently") || text.includes("hired someone")) return "hired_independently";
  if (text.includes("offshore") || text.includes("trust")) return "offshore_concern";
  if (text.includes("expertise") || text.includes("different skill")) return "expertise_gap";
  if (text.includes("wrong service") || text.includes("wrong scope")) return "wrong_service";
  if (text.includes("not a fit")) return "not_a_fit";
  if (text === "other") return "other";
  return "other";
}

export function lossReasonDisplay({
  code,
  detail,
  competitor,
}: {
  code?: string | null;
  detail?: string | null;
  competitor?: string | null;
}) {
  const label = leadLossReasonLabel(code);
  const cleanDetail = String(detail || "").trim();
  const cleanCompetitor = String(competitor || "").trim();
  if (code === "competitor" && cleanCompetitor) return cleanDetail ? `${label}: ${cleanCompetitor} · ${cleanDetail}` : `${label}: ${cleanCompetitor}`;
  return cleanDetail ? `${label}: ${cleanDetail}` : label;
}
