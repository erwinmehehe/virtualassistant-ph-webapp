export type TalentReadiness = "client_ready" | "near_ready" | "unavailable" | "pipeline";
export type TalentCoverageStatus = "source" | "develop" | "covered" | "surplus";

export const TALENT_AVAILABILITY_FRESH_DAYS = 30;

export type TalentReadinessInput = {
  stage?: string | null;
  activePool: boolean;
  availabilityStatus?: string | null;
  availabilityConfirmedAt?: string | null;
  workSetupVerifiedAt?: string | null;
};

export type TalentCoverageInput = {
  ready: number;
  nearReady: number;
  demand: number;
  target: number;
};

function freshSince(value: string | null | undefined, days: number, nowMs: number) {
  if (!value) return false;
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return false;
  return timestamp >= nowMs - days * 86_400_000;
}

export function talentReadiness(
  input: TalentReadinessInput,
  nowMs = Date.now(),
  freshnessDays = TALENT_AVAILABILITY_FRESH_DAYS,
): TalentReadiness {
  const stage = String(input.stage || "profile");
  const approved = stage === "approved" || stage === "bench";
  const finalistOrApproved = approved || stage === "finalist";
  const available = input.availabilityStatus === "available";
  const explicitlyUnavailable = input.availabilityStatus === "unavailable";
  const freshAvailability = freshSince(input.availabilityConfirmedAt, freshnessDays, nowMs);
  const setupVerified = Boolean(input.workSetupVerifiedAt);

  if (approved && input.activePool && available && freshAvailability && setupVerified) return "client_ready";
  if (explicitlyUnavailable && finalistOrApproved) return "unavailable";
  if (finalistOrApproved) return "near_ready";
  return "pipeline";
}

export function talentReadinessActions(
  input: TalentReadinessInput,
  nowMs = Date.now(),
  freshnessDays = TALENT_AVAILABILITY_FRESH_DAYS,
) {
  const actions: string[] = [];
  const stage = String(input.stage || "profile");
  if (stage === "finalist") actions.push("Complete final approval");
  if ((stage === "approved" || stage === "bench") && !input.activePool) actions.push("Add to talent pool");
  if (input.availabilityStatus !== "available") actions.push("Confirm availability");
  else if (!freshSince(input.availabilityConfirmedAt, freshnessDays, nowMs)) actions.push("Refresh availability");
  if (!input.workSetupVerifiedAt) actions.push("Verify work setup");
  return actions;
}

export function talentCoverage(input: TalentCoverageInput) {
  const ready = Math.max(0, input.ready || 0);
  const nearReady = Math.max(0, input.nearReady || 0);
  const demand = Math.max(0, input.demand || 0);
  const target = Math.max(0, input.target || 0);
  const coverageNeed = Math.max(demand, target);
  const readyGap = Math.max(0, coverageNeed - ready);
  const sourcingGap = Math.max(0, coverageNeed - ready - nearReady);
  const surplus = Math.max(0, ready - coverageNeed);

  let status: TalentCoverageStatus = "covered";
  if (sourcingGap > 0) status = "source";
  else if (readyGap > 0) status = "develop";
  else if (surplus >= 3) status = "surplus";

  return { coverageNeed, readyGap, sourcingGap, surplus, status };
}

export function talentCoverageLabel(status: TalentCoverageStatus) {
  if (status === "source") return "Source now";
  if (status === "develop") return "Develop near-ready";
  if (status === "surplus") return "Surplus capacity";
  return "Covered";
}
