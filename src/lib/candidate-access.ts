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

export function candidateAccessLabel(status?: string | null) {
  switch (status) {
    case "requested": return "Access requested";
    case "quoted": return "Access quoted";
    case "invoiced": return "Awaiting payment";
    case "paid": return "Candidate access active";
    case "comped": return "Candidate access active";
    default: return "Candidate details locked";
  }
}

export function protectedCandidateName(index = 0) {
  return `Vetted applicant ${index + 1}`;
}
