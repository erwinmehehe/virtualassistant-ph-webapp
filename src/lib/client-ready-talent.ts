export const CLIENT_READY_MIN_COMPLETION = 80;

export type ClientReadyTalentHealth = {
  account_status?: string | null;
  stage?: string | null;
  registration_health?: string | null;
  email_confirmed?: boolean | null;
  has_resume?: boolean | null;
  completion_score?: number | string | null;
  availability_status?: string | null;
};

export function isClientReadyTalent(row: ClientReadyTalentHealth) {
  return row.account_status === "active"
    && ["approved", "bench"].includes(String(row.stage || ""))
    && row.registration_health === "ready"
    && row.email_confirmed === true
    && row.has_resume === true
    && Number(row.completion_score || 0) >= CLIENT_READY_MIN_COMPLETION
    && row.availability_status === "available";
}

export function clientReadyTalentMissing(row: ClientReadyTalentHealth) {
  const missing: string[] = [];
  if (row.account_status !== "active") missing.push("active account");
  if (!["approved", "bench"].includes(String(row.stage || ""))) missing.push("recruiter approval");
  if (row.registration_health === "email_unconfirmed" || row.email_confirmed !== true) missing.push("confirmed email");
  if (row.registration_health === "never_started") missing.push("started profile");
  else if (row.registration_health === "profile_incomplete" || Number(row.completion_score || 0) < CLIENT_READY_MIN_COMPLETION) missing.push(`${CLIENT_READY_MIN_COMPLETION}% profile completion`);
  if (row.has_resume !== true) missing.push("resume");
  if (row.availability_status !== "available") missing.push("available status");
  return [...new Set(missing)];
}
