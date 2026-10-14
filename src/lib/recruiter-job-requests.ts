/** Submitted hiring requests, not employer drafts or public job listings.
 * Pure selection logic shared by Recruiter Today and the Roles queue.
 * Visibility is already restricted to recruiter accounts by the summary RPC.
 */
export type JobRequestRole = {
  id: string;
  status: string;
  hiring_stage: string;
  created_at: string;
  recruiter_id: string | null;
  client_id: string | null;
};

function createdTimestamp(value: string) {
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : 0;
}

export function pendingJobRequests<T extends JobRequestRole>(roles: readonly T[]): T[] {
  return roles
    .filter((role) => role.status === "pending" && !["filled", "closed"].includes(role.hiring_stage))
    .sort((a, b) => createdTimestamp(a.created_at) - createdTimestamp(b.created_at) || a.id.localeCompare(b.id));
}

export function jobRequestOwnerLabel(role: Pick<JobRequestRole, "recruiter_id">, currentRecruiterId: string) {
  return !role.recruiter_id ? "Unassigned" : role.recruiter_id === currentRecruiterId ? "My request" : "Team request";
}

export function jobRequestAccountLabel(role: Pick<JobRequestRole, "client_id">) {
  return role.client_id ? "Client account linked" : "Client account needed";
}
