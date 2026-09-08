export const LEAD_STAGES = [
  ["new", "New enquiry"], ["contacted", "Contacted"], ["qualified", "Qualified"],
  ["proposal", "Proposal sent"], ["won", "Won"], ["lost", "Lost"]
] as const;

export type LeadStage = typeof LEAD_STAGES[number][0];
export const isLeadStage = (value: string): value is LeadStage => LEAD_STAGES.some(([stage]) => stage === value);

export function validateLeadUpdate(form: FormData) {
  const id = String(form.get("lead_id") || "");
  const stage = String(form.get("sales_stage") || "");
  const followUp = String(form.get("follow_up_on") || "");
  const notes = String(form.get("sales_notes") || "").trim();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) throw new Error("Invalid lead.");
  if (!isLeadStage(stage)) throw new Error("Choose a valid sales stage.");
  if (followUp && (!/^\d{4}-\d{2}-\d{2}$/.test(followUp) || !Number.isFinite(Date.parse(followUp)) || new Date(followUp).toISOString().slice(0, 10) !== followUp)) throw new Error("Choose a valid follow-up date.");
  if (notes.length > 4000) throw new Error("Keep notes under 4,000 characters.");
  return { id, sales_stage: stage, follow_up_on: stage === "won" || stage === "lost" ? null : followUp || null, sales_notes: notes || null };
}

type Candidate = { job_id: string; va_id: string; status?: string };
/** A released match that already has an application is represented by that application's stage. */
export function pendingReleasedMatches<T extends Candidate>(released: T[], applications: Candidate[]): T[] {
  const applied = new Set(applications.map(row => `${row.job_id}:${row.va_id}`));
  const seen = new Set<string>();
  return released.filter(row => {
    const key = `${row.job_id}:${row.va_id}`;
    if (applied.has(key) || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
