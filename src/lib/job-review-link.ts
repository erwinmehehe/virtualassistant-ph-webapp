const JOB_ID_RE = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;

/** A staff-neutral destination for a job review notification email. */
export function jobReviewLink(jobId: string): string | null {
  return JOB_ID_RE.test(jobId) ? "/job-review/" + jobId : null;
}

/** Resolve only to existing role-protected staff pages. Never expose job data here. */
export function jobReviewDestination(role: string | null | undefined, jobId: string): string | null {
  if (!jobReviewLink(jobId)) return null;
  if (role === "admin") return "/workspace/admin/jobs/" + jobId;
  if (role === "recruiter") return "/workspace/recruiter/roles/" + jobId + "#overview";
  return null;
}
