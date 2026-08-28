import { CreditCard, LockKeyhole, ShieldCheck } from "lucide-react";
import { candidateAccessLabel, candidateAccessUnlocked } from "@/lib/candidate-access";
import { requestCandidateAccessAction } from "@/app/actions/matching";

export function CandidateAccessGate({ jobId, access, applicantCount = 0, releasedCount = 0, returnTo }: { jobId: string; access: any; applicantCount?: number; releasedCount?: number; returnTo: string }) {
  if (candidateAccessUnlocked(access?.access_status)) return <div className="candidate-access-active"><ShieldCheck size={17}/><div><strong>Candidate access active</strong><span>Applicant identities, private profiles, resumes, comparison, messaging, and hiring actions are available for this role.</span></div></div>;
  const status = access?.access_status || "locked";
  return <section className="candidate-access-gate">
    <div className="candidate-access-gate-icon"><LockKeyhole size={22}/></div>
    <div className="candidate-access-gate-copy"><span className="badge">{candidateAccessLabel(status)}</span><h3>Candidate identity stays protected until access is activated.</h3><p>You can see demand and fit signals now, but names, profile details, resumes, contact links, messages, comparison, and hiring controls remain hidden.</p><div className="row wrap candidate-access-counts"><span><strong>{applicantCount}</strong> applicant{applicantCount === 1 ? "" : "s"}</span><span><strong>{releasedCount}</strong> curated match{releasedCount === 1 ? "" : "es"}</span></div></div>
    <div className="candidate-access-gate-action">{access?.access_fee != null ? <div className="candidate-access-price"><CreditCard size={16}/><span>Candidate access</span><strong>USD {Number(access.access_fee).toFixed(2)}</strong></div> : null}{status === "invoiced" ? <div className="small muted">Payment is pending. Access unlocks after the hiring team records payment.</div> : status === "quoted" ? <div className="small muted">A candidate-access quote is ready. Contact the hiring team to complete payment.</div> : status === "requested" ? <div className="small muted">Request received. The hiring team will confirm access pricing or activation.</div> : <form action={requestCandidateAccessAction}><input type="hidden" name="job_id" value={jobId}/><input type="hidden" name="return_to" value={returnTo}/><button className="btn btn-primary" type="submit">Request candidate access</button></form>}</div>
  </section>;
}
