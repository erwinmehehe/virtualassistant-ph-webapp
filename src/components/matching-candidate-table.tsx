"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertTriangle, ArrowDown, ArrowUp, CheckCircle2, Compass, ShieldAlert } from "lucide-react";
import { mergeUniqueStrings } from "@/lib/collections";
import { matchLabel } from "@/lib/matching";
import { ClientShortlistCandidateCard } from "@/components/client-shortlist-candidate-card";

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
  clientReady?: boolean;
  readinessGaps?: string[];
  hardFailures?: string[];
  evidenceGaps?: string[];
  roleMatch?: { assessed?: boolean; pointsRatio?: number; matchedKeywords?: string[] };
  categoryMatched?: boolean;
  matchedSkills?: string[];
  matchedTools?: string[];
  otherClientReviews?: number;
  activeProcessCount?: number;
  potentialCommittedHours?: number;
  trainingCredentials?: Array<{
    credentialCode: string;
    courseTitle: string;
    courseSlug: string;
  }>;
  trainingPaths?: Array<{
    slug: string;
    title: string;
    courseCount: number;
    completedAt: string;
  }>;
};

type FormAction = (formData: FormData) => void | Promise<void>;

function matchReasons(row: Row) {
  const job = row.job;
  if (!job) return [];

  const reasons: string[] = [];
  if (row.roleMatch?.assessed && Number(row.roleMatch.pointsRatio || 0) >= 0.7) {
    const keywords = (row.roleMatch.matchedKeywords || []).slice(0, 3);
    reasons.push(keywords.length ? `Role/title match: ${keywords.join(", ")}` : "Strong role/title match");
  }
  if (row.categoryMatched) reasons.push("Exact/relevant specialty match");
  if ((row.matchedSkills || []).length) reasons.push(`${(row.matchedSkills || []).slice(0, 2).join(", ")} skill${(row.matchedSkills || []).length > 1 ? "s" : ""}`);
  if ((row.matchedTools || []).length) reasons.push(`${(row.matchedTools || []).slice(0, 2).join(", ")} tool experience`);

  const trainingTitles=(row.trainingCredentials || []).map((credential)=>credential.courseTitle.toLowerCase());
  const trainedTools=(job.required_tools || []).filter((tool:string)=>trainingTitles.some((title)=>title.includes(tool.toLowerCase())));
  if(trainedTools.length) reasons.push(`${trainedTools.slice(0,2).join(", ")} training completed`);
  if(row.va.availability_status==="available") reasons.push("Available now");
  if(job.hours_per_week&&row.va.weekly_hours>=job.hours_per_week) reasons.push(`${row.va.weekly_hours} hrs/week available`);
  if(job.overlap_hours&&row.va.overlap_hours>=job.overlap_hours) reasons.push("Schedule overlap available");
  return reasons.slice(0,4);
}

function trainingBadgeLabel(title: string) {
  return title
    .replace(/ Workflows for Virtual Assistants$/i, "")
    .replace(/ for Virtual Assistants$/i, "")
    .replace(/ Virtual Assistant(s)?$/i, "")
    .trim();
}

function decisionLabel(value?: string | null) {
  if (value === "interested") return "Client interested";
  if (value === "interview") return "Interview requested";
  if (value === "pass") return "Client passed";
  return null;
}

export function MatchingCandidateTable({
  pool,
  hideShortlistCandidateAction,
  saveClientRecommendationAction,
  canSendClient,
  canInviteClient
}: {
  pool: Row[];
  hideShortlistCandidateAction: FormAction;
  saveClientRecommendationAction: FormAction;
  canSendClient: boolean;
  canInviteClient: boolean;
}) {
  const [query, setQuery] = useState("");
  const [trainingFilter, setTrainingFilter] = useState<"all" | "verified" | "path">("all");
  const [showAll, setShowAll] = useState(false);
  const [showClientPreview, setShowClientPreview] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<string[]>(
    () => pool
      .filter((row) => row.shortlist?.shortlist_status === "proposed" && Boolean(row.shortlist?.created_by) && row.clientReady)
      .sort((a, b) => Number(a.shortlist?.shortlist_order ?? 999) - Number(b.shortlist?.shortlist_order ?? 999))
      .map((row) => String(row.va.user_id))
  );
  const selected = useMemo(() => new Set(selectedOrder), [selectedOrder]);
  const [recommendations, setRecommendations] = useState<Record<string, string>>(
    () => Object.fromEntries(pool.map((row) => [row.va.user_id, row.shortlist?.client_recommendation || ""]))
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return pool.filter((row) => {
      if (trainingFilter === "verified" && !(row.trainingCredentials || []).length) return false;
      if (trainingFilter === "path" && !(row.trainingPaths || []).length) return false;
      if (!q) return true;

      const haystack = [
        row.account?.full_name,
        row.va.headline,
        row.va.primary_category,
        ...(row.va.categories || []),
        ...(row.va.skills || []),
        ...(row.trainingCredentials || []).map((credential) => credential.courseTitle),
        ...(row.trainingPaths || []).map((path) => path.title),
        ...(row.hardFailures || []),
        ...(row.evidenceGaps || []),
      ].filter(Boolean).join(" ").toLowerCase();

      return haystack.includes(q);
    });
  }, [pool, query, trainingFilter]);

  const defaultRows = filtered.filter((row) => row.clientReady || ["proposed", "released"].includes(String(row.shortlist?.shortlist_status || "")));
  const visible = query || showAll ? filtered : defaultRows.slice(0, 20);
  const clientReadyCount = pool.filter((row) => row.clientReady).length;
  const verifiedTrainingCount = pool.filter((row) => (row.trainingCredentials || []).length > 0).length;
  const completedPathCount = pool.filter((row) => (row.trainingPaths || []).length > 0).length;
  const selectedRows = selectedOrder.map((id) => pool.find((row) => String(row.va.user_id) === id)).filter(Boolean) as Row[];
  const selectedCount = selectedOrder.length;

  function toggleSelected(vaId: string, checked: boolean) {
    setSelectedOrder((current) => {
      if (checked) {
        if (current.includes(vaId) || current.length >= 5) return current;
        return [...current, vaId];
      }
      return current.filter((id) => id !== vaId);
    });
  }

  function moveSelected(vaId: string, direction: -1 | 1) {
    setSelectedOrder((current) => {
      const index = current.indexOf(vaId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  }

  return <>
    <input type="hidden" name="shortlist_order" value={selectedOrder.join(",")} />
    <div className="row-between wrap" style={{margin:"12px 0",gap:10}}>
      <div>
        <strong>{selectedCount} selected · {clientReadyCount} client-ready</strong>
        <div className="small muted">Only checked candidates are included in Save or Send. Aim for 3–5 client-ready candidates; five is the maximum. The default list surfaces client-ready candidates first. Near-ready or pipeline VAs remain searchable for development, but cannot be selected until readiness is complete.</div>
      </div>
      <div className="row wrap">
        <button className="btn" type="button" disabled={!selectedCount} aria-expanded={showClientPreview} onClick={() => setShowClientPreview((value) => !value)}>
          {showClientPreview ? "Hide client preview" : "Preview client view"}
        </button>
        <button className="btn" type="submit" name="mode" value="save" disabled={!selectedCount}>Save {selectedCount || ""} internally</button>
        {canSendClient
          ? <button className="btn btn-primary" type="submit" name="mode" value="release" disabled={!selectedCount || selectedCount > 5}>Send {selectedCount || 0} to client</button>
          : canInviteClient
            ? <button className="btn btn-primary" type="submit" name="mode" value="invite" disabled={!selectedCount || selectedCount > 5}>Save {selectedCount || 0} + invite client</button>
            : null}
      </div>
    </div>


    {showClientPreview && selectedRows.length ? <section className="card" style={{margin:"0 0 16px",background:"#f8fafc"}} aria-label="Client shortlist preview">
      <div className="row-between wrap" style={{marginBottom:12}}>
        <div>
          <div className="small muted">Client view preview</div>
          <h3 style={{margin:"2px 0 4px"}}>{selectedRows.length} candidate{selectedRows.length===1?"":"s"} selected</h3>
          <p className="small muted" style={{margin:0}}>This mirrors the client shortlist card. Full names, internal match percentages, confidence, recruiter-only risks, and private notes are not shown.</p>
        </div>
        <span className="badge">Preview only</span>
      </div>
      <div className="grid-3 browse-va-grid">
        {selectedRows.map((row, selectedIndex) => {
          const vaId = String(row.va.user_id);
          return <div className="shortlist-preview-item" key={vaId}>
            <div className="shortlist-preview-order">
              <span>Client position #{selectedIndex + 1}</span>
              <div className="row">
                <button className="btn btn-sm" type="button" onClick={() => moveSelected(vaId, -1)} disabled={selectedIndex === 0} aria-label={`Move ${row.account?.full_name || "candidate"} up`}><ArrowUp size={13}/></button>
                <button className="btn btn-sm" type="button" onClick={() => moveSelected(vaId, 1)} disabled={selectedIndex === selectedRows.length - 1} aria-label={`Move ${row.account?.full_name || "candidate"} down`}><ArrowDown size={13}/></button>
              </div>
            </div>
            <ClientShortlistCandidateCard
            fullName={row.account?.full_name}
            headline={row.va.headline}
            primaryCategory={row.va.primary_category}
            matchScore={row.score}
            yearsExperience={row.va.years_experience}
            weeklyHours={row.va.weekly_hours}
            hourlyRate={row.va.hourly_rate}
            skills={row.va.skills}
            tools={row.va.tools}
            recommendation={recommendations[vaId] || null}
            actions={<div className="stack" style={{marginTop:10}}>
              <div className="row wrap">
                <button className="btn btn-sm" type="button" disabled>Interested</button>
                <button className="btn btn-sm" type="button" disabled>Request interview</button>
                <button className="btn btn-sm" type="button" disabled>Hold</button>
                <button className="btn btn-sm" type="button" disabled>Pass</button>
              </div>
            </div>}
          />
          </div>;
        })}
      </div>
    </section> : null}

    <div className="matching-evidence-controls">
      <div className="field matching-evidence-search">
        <input type="search" placeholder={`Search ${pool.length} candidates by name, role, skill, course, or path...`} value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search candidates" />
        {query || trainingFilter !== "all"
          ? <div className="small muted">{filtered.length} of {pool.length} candidates match the current search and evidence filter.</div>
          : <div className="small muted">Showing the strongest client-ready candidates first. Training is supporting evidence only and does not change the match score or client-readiness gate.</div>}
      </div>
      <label className="matching-evidence-filter">
        <span>Training evidence</span>
        <select value={trainingFilter} onChange={(event) => setTrainingFilter(event.target.value as "all" | "verified" | "path")}>
          <option value="all">All candidates</option>
          <option value="verified">Verified training ({verifiedTrainingCount})</option>
          <option value="path">Completed learning path ({completedPathCount})</option>
        </select>
      </label>
      {!query && trainingFilter === "all" && pool.length > 20 ? <button className="btn btn-sm" type="button" onClick={() => setShowAll((v) => !v)}>{showAll ? "Show top 20" : `Show all ${pool.length}`}</button> : null}
    </div>

    <div className="table-wrap responsive-table matching-table" style={{maxHeight:"none",overflowX:"auto",overflowY:"visible"}}><table>
      <thead><tr><th><span className="sr-only">Select</span></th><th>Candidate</th><th>Fit</th><th>Availability & rate</th><th>Client note</th><th>Status</th></tr></thead>
      <tbody>{visible.map((row) => {
        const index = pool.indexOf(row);
        const alreadyReleased = row.shortlist?.shortlist_status === "released";
        const decision = decisionLabel(row.shortlist?.client_decision);
        const hasConflict = Boolean(row.otherClientReviews || row.activeProcessCount || row.potentialCommittedHours);
        const hardBlocked = row.eligible === false;
        const readinessBlocked = row.clientReady === false;
        const selectionBlocked = hardBlocked || readinessBlocked;
        const vaId = String(row.va.user_id);
        const checked = alreadyReleased || selected.has(vaId);
        return <tr key={vaId} className={alreadyReleased ? "released-match-row" : undefined}>
          <td data-label="Select"><label className="compare-check"><input type="checkbox" name="va_id" value={vaId} checked={checked} disabled={alreadyReleased || selectionBlocked || (!checked && selectedCount >= 5)} onChange={(event) => toggleSelected(vaId,event.currentTarget.checked)}/><span className="sr-only">{alreadyReleased ? "Already sent" : "Select"} {row.account?.full_name || "VA"}</span></label></td>
          <td data-label="Candidate"><div className="matching-candidate-heading"><span className="matching-rank">#{index + 1}</span><strong>{row.account?.full_name || "VA candidate"}</strong></div><div className="small muted">{row.va.headline || row.va.primary_category || "Virtual Assistant"}</div><div className="pill-list compact-pills">{mergeUniqueStrings(row.va.primary_category, row.va.categories).slice(0, 2).map((x: string, i: number) => <span className="badge" key={`${x}-${i}`}>{x}</span>)}</div>
            {(row.trainingPaths || []).length ? <div className="matching-path-evidence" aria-label="Completed learning paths"><span><Compass size={12}/> Completed path:</span>{(row.trainingPaths || []).slice(0,2).map((path) => <Link key={path.slug} href={`/workspace/training/paths/${path.slug}`}>{path.title}</Link>)}</div> : null}
            {(row.trainingCredentials || []).length ? <div className="pill-list compact-pills" style={{marginTop:6}} aria-label="Verified training"><span className="small muted" style={{marginRight:2}}>Training:</span>{(row.trainingCredentials || []).slice(0,3).map((credential) => <span className="badge badge-success" key={credential.credentialCode}>✓ {trainingBadgeLabel(credential.courseTitle)}</span>)}{(row.trainingCredentials || []).length > 3 ? <span className="badge">+{(row.trainingCredentials || []).length - 3}</span> : null}</div> : null}
            {hardBlocked?<div className="alert" style={{marginTop:8,padding:10}}><div className="row"><ShieldAlert size={15}/><strong>Hard requirement failed</strong></div>{(row.hardFailures||[]).map((failure)=><small key={failure} style={{display:"block",marginTop:4}}>• {failure}</small>)}</div>:readinessBlocked?<div className="matching-readiness-note"><AlertTriangle size={15}/><div><strong>Not client-ready</strong><span>{(row.readinessGaps||["Confirm availability"]).join(" · ")}</span></div></div>:<div className="match-reasons"><span>Why this VA matches:</span>{matchReasons(row).length?matchReasons(row).map((reason)=><small key={reason}>✓ {reason}</small>):<small>Review profile evidence</small>}</div>}
            {(row.evidenceGaps||[]).length?<div className="small" style={{marginTop:8}}><strong><AlertTriangle size={13}/> Verify before sending:</strong>{(row.evidenceGaps||[]).map((gap)=><span key={gap} style={{display:"block"}}>• {gap}</span>)}</div>:null}
            {hasConflict?<div className="small" style={{marginTop:8}}><strong><AlertTriangle size={13}/> Placement risk:</strong>{row.otherClientReviews ? ` also with ${row.otherClientReviews} client role${row.otherClientReviews===1?"":"s"}.` : ""}{row.activeProcessCount ? ` ${row.activeProcessCount} active interview/offer process${row.activeProcessCount===1?"":"es"}.` : ""}{row.potentialCommittedHours ? ` ${row.potentialCommittedHours} hrs/week potentially committed.` : ""}</div>:null}
            <div style={{marginTop:8}}><Link className="text-link small" href={`/workspace/recruiter/candidates/${vaId}/screening`}>Open recruiter scorecard</Link></div>
          </td>
          <td data-label="Fit">{hardBlocked?<><span className="badge badge-warning">Not eligible</span><div className="small muted" style={{marginTop:5}}>Fails a true must-have</div></>:<><div className="match-percent"><strong>{row.score}%</strong><span>{matchLabel(row.score)}</span></div><div className="match-meter" aria-label={`${row.score}% match`}><span style={{ width: `${row.score}%` }}/></div><div className="small muted">{row.confidence}% confidence</div></>}</td>
          <td data-label="Availability & rate" className="matching-availability-cell">
            <span className={`badge ${row.clientReady ? "badge-success" : ""}`}>{row.clientReady ? "Client-ready" : availabilityLabel(row.va.availability_status)}</span>
            <span className="matching-availability-meta">{row.va.weekly_hours != null ? `${row.va.weekly_hours} hrs/week` : "Hours not set"}</span>
            <span className="matching-availability-meta">{row.va.hourly_rate != null ? `USD ${Number(row.va.hourly_rate).toFixed(2)}/hr` : "Rate not set"}</span>
          </td>
          <td data-label="Client note" className="matching-recommendation-cell">
            {checked || alreadyReleased ? (
              <div className="matching-client-note">
                <textarea name={`recommendation_${vaId}`} value={recommendations[vaId] || ""} onChange={(event) => setRecommendations((current) => ({ ...current, [vaId]: event.target.value }))} maxLength={500} rows={2} placeholder="Add a short client-facing reason (optional)" disabled={selectionBlocked&&!alreadyReleased}/>
                {!selectionBlocked||alreadyReleased?<button className="text-button matching-note-save" type="submit" formAction={saveClientRecommendationAction} name="recommendation_va_id" value={vaId}>Save note</button>:null}
              </div>
            ) : (
              <div className="matching-note-placeholder">
                {hardBlocked ? "Not eligible" : readinessBlocked ? "Confirm availability first" : "Select this VA to add a client note"}
              </div>
            )}
          </td>
          <td data-label="Status">{alreadyReleased ? <div className="stack-inline"><span className="badge badge-success"><CheckCircle2 size={13}/> Sent to client</span>{hardBlocked?<span className="badge badge-warning">Review requirement change</span>:null}{decision?<span className={`badge ${row.shortlist?.client_decision === "pass" ? "badge-warning" : "badge-success"}`}>{decision}</span>:<span className="small muted">Waiting for decision</span>}<button className="text-button" type="submit" formAction={hideShortlistCandidateAction} name="remove_va_id" value={vaId}>Remove</button></div> : row.shortlist?.shortlist_status === "proposed" ? <div className="stack-inline"><span className="badge">{row.shortlist?.created_by ? "Internal shortlist" : "Match suggestion"}</span><button className="text-button" type="submit" formAction={hideShortlistCandidateAction} name="remove_va_id" value={vaId}>Remove</button></div> : <span className="small muted">Not sent</span>}</td>
        </tr>;
      })}</tbody>
    </table></div>
  </>;
}
