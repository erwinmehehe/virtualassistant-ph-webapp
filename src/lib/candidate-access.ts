export type CandidateAccessStatus = "locked" | "requested" | "quoted" | "invoiced" | "paid" | "comped";

export type CandidateAccessRecord = {
  job_id: string;
  access_status: CandidateAccessStatus;
  access_fee: number | null;
  currency: string;
  requested_at?: string | null;
  unlocked_at?: string | null;
  payment_reference?: string | null;
  notes?: string | null;
};

export function candidateAccessUnlocked(status?: string | null) {
  return status === "paid" || status === "comped";
}

/**
 * Paid access is the only candidate-access state that may expose private
 * evidence capable of identifying a VA outside the recruiter-managed flow.
 * Comped access is intentionally limited to sanitized shortlist evidence.
 */
export function candidatePrivateEvidencePaid(status?: string | null) {
  return status === "paid";
}

export function candidateAccessLabel(status?: string | null) {
  switch (status) {
    case "requested": return "With hiring team";
    case "quoted": return "Access price ready";
    case "invoiced": return "Access being finalized";
    case "paid": return "Candidate access active";
    case "comped": return "Sanitized candidate review active";
    default: return "Candidate identity protected";
  }
}

export function protectedCandidateName(index = 0) {
  return `Vetted applicant ${index + 1}`;
}
