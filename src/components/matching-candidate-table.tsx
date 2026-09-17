"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { generateClientRecommendationAction } from "@/app/actions/ai-client-recommendation";
import { mergeUniqueStrings } from "@/lib/collections";
import { matchLabel } from "@/lib/matching";

function availabilityLabel(value?: string | null) {
  if (!value) return "Not set";
  return String(value).replaceAll("_", " ");
}

type Row = {
  va: any;
  account: any;
  shortlist: any;
  job: any;
  score: number;
  confidence: number;
  eligible?: boolean;
  hardFailures?: string[];
  evidenceGaps?: string[];
  otherClientReviews?: number;
  activeProcessCount?: number;
  potentialCommittedHours?: number;
};

type FormAction = (formData: FormData) => void | Promise<void>;

function matchReasons(row: Row) {
  const job = row.job;
  if (!job) return [];
  const values = (items: string[] | null | undefined) => new Set((items || []).map((item) => item.toLowerCase()));
  const skills = values(row.va.skills); const tools = values(row.va.tools);
  const reasons: string[] = [];
  if (([row.va.primary_category, ...(row.va.categories || [])].filter(Boolean) as string[]).some((item) => values(job.categories).has(item.toLowerCase()))) reasons.push("Relevant specialty");
  const matchingSkills=(job.required_skills || []).filter((item:string)=>skills.has(item.toLowerCase())); if(matchingSkills.length) reasons.push(`${matchingSkills.slice(0,2).join(", ")} skill${matchingSkills.length>1?"s":""}`);
  const matchingTools=(job.required_tools || []).filter((item:string)=>tools.has(item.toLowerCase())); if(matchingTools.length) reasons.push(`${matchingTools.slice(0,2).join(", ")} experience`);
  if(row.va.availability_status==="available") reasons.push("Available now");
  if(job.hours_per_week&&row.va.weekly_hours>=job.hours_per_week) reasons.push(`${row.va.weekly_hours} hrs/week available`);
  if(job.overlap_hours&&row.va.overlap_hours>=job.overlap_hours) reasons.push("Required overlap covered");
  return reasons.slice(0,4);
}

function decisionLabel(value?: string | null) {
  if (value === "interested") return "Client interested";
  if (value === "interview") return "Interview requested";
  if (value === "pass") return "Client passed";
  return null;
}

export function MatchingCandidateTable({ pool, hideShortlistCandidateAction, saveClientRecommendationAction }: { pool: Row[]; hideShortlistCandidateAction: FormAction; saveClientRecommendationAction: FormAction }) {
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [recommendations, setRecommendations] = useState<Record<string, string>>(() => Object.fromEntries(pool.map((row) => [row.va.user_id, row.shortlist?.client_recommendation || ""])));
  const [generating, setGenerating] = useState<Record<string, boolean>>({});
  const [generationErrors, setGenerationErrors] = useState<Record<string, string>>({});
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pool;
    return pool.filter((row) => {
      const haystack = [row.account?.full_name,row.va.headline,row.va.primary_category,...(row.va.categories || []),...(row.va.skills || []),...(row.hardFailures||[]),...(row.evidenceGaps||[])].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [pool, query]);

  const visible = query || showAll ? filtered : filtered.slice(0, 20);

  function generateRecommendation(row: Row) {
    const vaId = String(row.va.user_id || "");
    const jobId = String(row.job?.id || "");
    if (!vaId || !jobId || generating[vaId]) return;
    setGenerating((current) => ({ ...current, [vaId]: true }));
    setGenerationErrors((current) => ({ ...current, [vaId]: "" }));
    const formData = new FormData();
    formData.set("job_id", jobId);
    formData.set("va_id", vaId);
    startTransition(async () => {
      try {
        const result = await generateClientRecommendationAction(formData);
        if (result.ok) setRecommendations((current) => ({ ...current, [vaId]: result.recommendation }));
        else setGenerationErrors((current) => ({ ...current, [vaId]: result.error }));
      } catch {
        setGenerationErrors((current) => ({ ...current, [vaId]: "Could not generate the recommendation. Try again or write it manually." }));
      } finally {
        setGenerating((current) => ({ ...current, [vaId]: false }));
      }
    });
  }

  return <>
    <div className="row-between wrap" style={{ margin: "0 0 12px", gap: 10 }}>
      <div className="field" style={{ margin: 0, flex: "1 1 340px" }}>
        <input type="search" placeholder={`Search ${pool.length} candidates by name, category, or skill...`} value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search candidates" />
        {query ? <div className="small muted" style={{ marginTop: 6 }}>{filtered.length} of {pool.length} candidates match.</div> : <div className="small muted" style={{ marginTop: 6 }}>Showing the top {Math.min(20, pool.length)} ranked candidates first.</div>}
      </div>
      {!query && pool.length > 20 ? <button className="btn btn-sm" type="button" onClick={() => setShowAll((v) => !v)}>{showAll ? "Show top 20" : `Show all ${pool.length}`}</button> : null}
    </div>
    <div className="table-wrap responsive-table matching-table" style={{maxHeight:"none",overflowX:"auto",overflowY:"visible"}}><table>
      <thead><tr><th><span className="sr-only">Select</span></th><th>Rank</th><th>VA</th><th>Match</th><th>Availability</th><th>Hours</th><th>Rate</th><th>Client recommendation</th><th>Client review</th></tr></thead>
      <tbody>{visible.map((row) => {
        const index = pool.indexOf(row);
        const selected = row.shortlist && ["proposed", "released"].includes(row.shortlist.shortlist_status);
        const alreadyReleased = row.shortlist?.shortlist_status === "released";
        const decision = decisionLabel(row.shortlist?.client_decision);
        const hasConflict = Boolean(row.otherClientReviews || row.activeProcessCount || row.potentialCommittedHours);
        const hardBlocked = row.eligible === false;
        const vaId = String(row.va.user_id);
        const isGenerating = Boolean(generating[vaId]);
        return <tr key={vaId} className={alreadyReleased ? "released-match-row" : undefined}>
          <td data-label="Select"><label className="compare-check"><input type="checkbox" name="va_id" value={vaId} defaultChecked={selected} disabled={hardBlocked&&!alreadyReleased} onChange={(event) => { if (event.currentTarget.checked && !String(recommendations[vaId] || "").trim()) generateRecommendation(row); }}/><span className="sr-only">Select {row.account?.full_name || "VA"}</span></label></td>
          <td data-label="Rank"><strong>#{index + 1}</strong></td>
          <td data-label="VA"><strong>{row.account?.full_name || "VA candidate"}</strong><div className="small muted">{row.va.headline || row.va.primary_category || "Virtual Assistant"}</div><div className="pill-list compact-pills">{mergeUniqueStrings(row.va.primary_category, row.va.categories).slice(0, 2).map((x: string, i: number) => <span className="badge" key={`${x}-${i}`}>{x}</span>)}</div>
            {hardBlocked?<div className="alert" style={{marginTop:8,padding:10}}><div className="row"><ShieldAlert size={15}/><strong>Hard requirement failed</strong></div>{(row.hardFailures||[]).map((failure)=><small key={failure} style={{display:"block",marginTop:4}}>• {failure}</small>)}</div>:<div className="match-reasons"><span>Why this VA matches:</span>{matchReasons(row).length?matchReasons(row).map((reason)=><small key={reason}>✓ {reason}</small>):<small>Review profile evidence</small>}</div>}
            {(row.evidenceGaps||[]).length?<div className="small" style={{marginTop:8}}><strong><AlertTriangle size={13}/> Verify before sending:</strong>{(row.evidenceGaps||[]).map((gap)=><span key={gap} style={{display:"block"}}>• {gap}</span>)}</div>:null}
            {hasConflict?<div className="small" style={{marginTop:8}}><strong><AlertTriangle size={13}/> Placement risk:</strong>{row.otherClientReviews ? ` also with ${row.otherClientReviews} client role${row.otherClientReviews===1?"":"s"}.` : ""}{row.activeProcessCount ? ` ${row.activeProcessCount} active interview/offer process${row.activeProcessCount===1?"":"es"}.` : ""}{row.potentialCommittedHours ? ` ${row.potentialCommittedHours} hrs/week potentially committed.` : ""}</div>:null}
            <div style={{marginTop:8}}><Link className="text-link small" href={`/workspace/recruiter/candidates/${vaId}/screening`}>Open recruiter scorecard</Link></div>
          </td>
          <td data-label="Match">{hardBlocked?<><span className="badge badge-warning">Not eligible</span><div className="small muted" style={{marginTop:5}}>Fails a true must-have</div></>:<><div className="match-percent"><strong>{row.score}%</strong><span>{matchLabel(row.score)}</span></div><div className="match-meter" aria-label={`${row.score}% match`}><span style={{ width: `${row.score}%` }}/></div><div className="small muted">{row.confidence}% confidence</div></>}</td>
          <td data-label="Availability"><span className={`badge ${row.va.availability_status === "available" ? "badge-success" : ""}`}>{availabilityLabel(row.va.availability_status)}</span><div className="small muted">From the VA's current profile</div></td>
          <td data-label="Hours">{row.va.weekly_hours != null ? `${row.va.weekly_hours}/week` : "Not set"}</td>
          <td data-label="Rate">{row.va.hourly_rate != null ? `USD ${Number(row.va.hourly_rate).toFixed(2)}/hr` : "Not set"}</td>
          <td data-label="Client recommendation"><textarea name={`recommendation_${vaId}`} value={recommendations[vaId] || ""} onChange={(event) => setRecommendations((current) => ({ ...current, [vaId]: event.target.value }))} maxLength={500} rows={3} placeholder="Why this VA is a strong fit for this client... Select this VA to generate a client-ready recommendation with AI." disabled={hardBlocked&&!alreadyReleased} readOnly={isGenerating}/>{isGenerating?<div className="small muted" style={{marginTop:5}}>Generating recommendation...</div>:null}{generationErrors[vaId]?<div className="small" style={{marginTop:5}}>{generationErrors[vaId]}</div>:null}{!hardBlocked||alreadyReleased?<div className="row wrap" style={{marginTop:6}}><button className="text-button" type="submit" formAction={saveClientRecommendationAction} name="recommendation_va_id" value={vaId}>Save client note</button><button className="text-button" type="button" onClick={() => generateRecommendation(row)} disabled={isGenerating}>{isGenerating?"Generating…":"Regenerate with AI"}</button></div>:<span className="small muted">Change the hard requirement before recommending.</span>}{!hardBlocked||alreadyReleased?<div className="small muted" style={{marginTop:4}}>AI-generated, recruiter editable.</div>:null}</td>
          <td data-label="Client review">{alreadyReleased ? <div className="stack-inline"><span className="badge badge-success"><CheckCircle2 size={13}/> Sent to client</span>{hardBlocked?<span className="badge badge-warning">Review requirement change</span>:null}{decision?<span className={`badge ${row.shortlist?.client_decision === "pass" ? "badge-warning" : "badge-success"}`}>{decision}</span>:<span className="small muted">Waiting for decision</span>}<button className="text-button" type="submit" formAction={hideShortlistCandidateAction} name="remove_va_id" value={vaId}>Remove</button></div> : row.shortlist?.shortlist_status === "proposed" ? <div className="stack-inline"><span className="badge">Internal only</span><button className="text-button" type="submit" formAction={hideShortlistCandidateAction} name="remove_va_id" value={vaId}>Remove</button></div> : <span className="small muted">—</span>}</td>
        </tr>;
      })}</tbody>
    </table></div>
  </>;
}
