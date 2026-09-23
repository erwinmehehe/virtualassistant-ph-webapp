import type { ReactNode } from "react";
import { clientMatchLabel } from "@/lib/matching";
import { maskVaName } from "@/lib/va-identity";
import { GraduationCap } from "lucide-react";
import type { TrainingCredential } from "@/lib/training-credentials";

export function ClientShortlistCandidateCard({
  fullName,
  headline,
  primaryCategory,
  matchScore,
  yearsExperience,
  weeklyHours,
  hourlyRate,
  skills,
  tools,
  recommendation,
  trainingCredentials,
  status,
  actions,
  feedback,
}: {
  fullName?: string | null;
  headline?: string | null;
  primaryCategory?: string | null;
  matchScore?: number | null;
  yearsExperience?: number | null;
  weeklyHours?: number | null;
  hourlyRate?: number | null;
  skills?: string[] | null;
  tools?: string[] | null;
  recommendation?: string | null;
  trainingCredentials?: TrainingCredential[];
  status?: ReactNode;
  actions?: ReactNode;
  feedback?: ReactNode;
}) {
  const evidence = [...(skills || []), ...(tools || [])].slice(0, 4);

  return <article className="card browse-va-card">
    <div className="row-between wrap">
      <div>
        <strong>{fullName ? maskVaName(fullName) : "Matched Virtual Assistant"}</strong>
        <div className="small muted">{headline || primaryCategory || "Virtual Assistant"}</div>
      </div>
      <span className="badge">{clientMatchLabel(Number(matchScore || 0))}</span>
    </div>
    <div className="small muted browse-va-facts">
      {yearsExperience != null ? `${yearsExperience}+ yrs experience · ` : ""}
      {weeklyHours ? `${weeklyHours} hrs/week` : "Flexible hours"}
      {hourlyRate ? ` · $${Number(hourlyRate).toFixed(2)}/hr` : ""}
    </div>
    <div className="pill-list">
      {evidence.map((item, index) => <span className="badge" key={`${item}-${index}`}>{item}</span>)}
    </div>
    {trainingCredentials?.length ? (
      <div className="shortlist-training-evidence">
        <span><GraduationCap size={14}/> Training completed</span>
        <div className="pill-list">
          {trainingCredentials.slice(0, 2).map((credential) => <span className="badge badge-success" key={credential.id}>{credential.courseTitle}</span>)}
          {trainingCredentials.length > 2 ? <span className="badge">+{trainingCredentials.length - 2}</span> : null}
        </div>
      </div>
    ) : null}
    {recommendation
      ? <div className="info-banner"><strong>Why we recommend this VA</strong><p style={{margin:"6px 0 0"}}>{recommendation}</p></div>
      : <div className="info-banner"><strong>Recruiter reviewed</strong><p style={{margin:"6px 0 0"}}>This VA passed our internal screening for this role. Ask your recruiter if you want more context before deciding.</p></div>}
    {status ? <div className="row wrap browse-va-actions">{status}</div> : null}
    {actions}
    {feedback}
  </article>;
}
