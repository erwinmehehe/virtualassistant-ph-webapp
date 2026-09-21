import type { ReactNode } from "react";
import { clientMatchLabel } from "@/lib/matching";
import { maskVaName } from "@/lib/va-identity";

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
    {recommendation
      ? <div className="info-banner"><strong>Why we recommend this VA</strong><p style={{margin:"6px 0 0"}}>{recommendation}</p></div>
      : <div className="info-banner"><strong>Recruiter reviewed</strong><p style={{margin:"6px 0 0"}}>This VA passed our internal screening for this role. Ask your recruiter if you want more context before deciding.</p></div>}
    {status ? <div className="row wrap browse-va-actions">{status}</div> : null}
    {actions}
    {feedback}
  </article>;
}
