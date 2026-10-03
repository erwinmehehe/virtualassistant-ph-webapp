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
  // Candidate identity/review access is a paid entitlement. Legacy "comped"
  // rows must never unlock client-facing candidate access.
  return status === "paid";
}

export function candidateAccessLabel(status?: string | null) {
  switch (status) {
    case "requested": return "With hiring team";
    case "quoted": return "Access price ready";
    case "invoiced": return "Access being finalized";
    case "paid": return "Candidate access active";
    case "comped": return "Payment required";
    default: return "Candidate identity protected";
  }
}

export function protectedCandidateName(index = 0) {
  return `Vetted applicant ${index + 1}`;
}
