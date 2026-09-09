import Link from "next/link";
import { ArrowRight, LockKeyhole, Sparkles } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { dateShort } from "@/lib/format";
import { candidateAccessUnlocked, protectedCandidateName } from "@/lib/candidate-access";
import { matchAssessment, matchLabel } from "@/lib/matching";
import { inviteVaAction } from "@/app/actions/applications";

export default async function ClientCandidatesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const query = await searchParams;
  const { user } = await requireRole("client");
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: jobs } = await supabase
    .from("jobs")
    .select("id,title,status,categories,required_skills,required_tools,hours_per_week,overlap_hours,created_at")
    .eq("client_id", user.id)
    .order("created_at", { ascending: false });

  const jobIds = (jobs || []).map((j: any) => j.id);
  const jobMap = new Map((jobs || []).map((j: any) => [j.id, j.title]));
  if (!jobIds.length) {
    return <>
      <div className="page-head"><div><h1>Candidates</h1><p>Your recruiting team uses the role brief to screen and recommend relevant Virtual Assistants.</p></div></div>
      <div className="card empty"><p>Start with a hiring request so we have a real role to recruit against.</p><Link className="btn btn-primary" href="/hire">Start a hiring request</Link></div>
    </>;
  }

  const activeJobs = (jobs || []).filter((j: any) => j.status !== "closed");
  const publishedJobs = activeJobs.filter((j: any) => j.status === "published");
  const selectedJob = activeJobs.find((j: any) => j.id === query.role)
    || publishedJobs[0]
    || activeJobs.find((j: any) => j.status === "pending")
    || activeJobs[0]
    || null;

  const [{ data: accessRows }, { data: applicationRows }] = await Promise.all([
    admin.from("job_candidate_access").select("job_id,access_status,access_fee").in("job_id", jobIds),
    admin.from("applications").select("id,job_id,status,match_score,applied_at").in("job_id", jobIds).order("applied_at", { ascending: false })
  ]);
  const accessMap = new Map((accessRows || []).map((a: any) => [a.job_id, a]));
  const applications = applicationRows || [];
  const unlockedApplications = applications.filter((a: any) => candidateAccessUnlocked((accessMap.get(a.job_id) as any)?.access_status));
  const unlockedIds = unlockedApplications.map((a: any) => a.id);
  const { data: detailRows } = unlockedIds.length
    ? await admin.from("applications").select("id,profile_snapshot").in("id", unlockedIds)
    : { data: [] };
  const detailMap = new Map((detailRows || []).map((row: any) => [row.id, row.profile_snapshot || {}]));
  const readyToReview = applications.filter((a: any) => ["new", "reviewing", "shortlisted"].includes(a.status)).length;
  const interviews = applications.filter((a: any) => a.status === "interview").length;
  const offers = applications.filter((a: any) => a.status === "offered").length;

  const [{ data: availableRows }, { data: existingInvites }] = await Promise.all([
    supabase
      .from("public_va_directory")
      .select("user_id,slug,full_name,headline,primary_category,categories,skills,tools,years_experience,weekly_hours,hourly_rate,preferred_timezone,overlap_hours")
      .limit(250),
    admin.from("job_invites").select("job_id,va_id,status").in("job_id", jobIds)
  ]);

  const availableVas = (availableRows || [])
    .map((va: any) => {
      const assessment = selectedJob ? matchAssessment(selectedJob, va) : { score: 0, confidence: 0, assessedWeight: 0 };
      return { ...va, _match: assessment };
    })
    .sort((a: any, b: any) =>
      Number(b._match.score || 0) - Number(a._match.score || 0)
      || Number(b._match.confidence || 0) - Number(a._match.confidence || 0)
      || Number(b.years_experience || 0) - Number(a.years_experience || 0)
    )
    .slice(0, 24);

  const inviteMap = new Map<string, string>((existingInvites || []).map((row: any) => [`${row.job_id}:${row.va_id}`, String(row.status)]));
  const next = offers
    ? { title: `${offers} decision${offers === 1 ? "" : "s"} ready`, copy: "A candidate is waiting for your final hiring decision.", label: "Review decisions" }
    : interviews
      ? { title: `${interviews} interview${interviews === 1 ? "" : "s"} in progress`, copy: "Review candidates and keep the interview process moving.", label: "Review interviews" }
      : readyToReview
        ? { title: `${readyToReview} candidate${readyToReview === 1 ? "" : "s"} ready for review`, copy: "Compare role fit and decide who should move forward.", label: "Review candidates" }
        : { title: "We’re looking for candidates", copy: "Your recruiting team is matching approved Virtual Assistants to your role.", label: "View roles" };

  return <>
    <div className="page-head"><div><h1>Review candidates</h1><p>See recruiter-selected candidates first, with additional approved Virtual Assistants ranked against your actual role.</p></div></div>

    <section className="candidate-next-action">
      <div className="candidate-next-icon"><Sparkles size={21}/></div>
      <div><span className="small">Your next action</span><h2>{next.title}</h2><p>{next.copy}</p><small className="muted">{offers || interviews || readyToReview ? "Waiting on you" : "Waiting on our recruiting team"}</small></div>
      <a className="btn btn-primary" href="#candidate-list">{next.label}<ArrowRight size={16}/></a>
    </section>

    <section className="card dashboard-section-card" id="browse-vas">
      <div className="dashboard-section-head">
        <div>
          <h2>{selectedJob ? `Recommended for ${selectedJob.title}` : "Recommended Virtual Assistants"}</h2>
          <p>These approved profiles are ranked against the selected role’s category, skills, tools, hours, and overlap requirements. Your recruiter shortlist remains the primary recommendation.</p>
        </div>
        <Link className="btn btn-sm" href="/find-talent">Open full directory</Link>
      </div>

      {activeJobs.length > 1 ? <div className="row wrap" style={{ marginBottom: 16 }}>
        <span className="small muted">Rank for role:</span>
        {activeJobs.slice(0, 6).map((job: any) =>
          <Link key={job.id} className={`btn btn-sm ${selectedJob?.id === job.id ? "btn-primary" : ""}`} href={`/workspace/client/candidates?role=${encodeURIComponent(job.id)}`}>{job.title}</Link>
        )}
      </div> : null}

      {availableVas.length ? <div className="grid-3 browse-va-grid">{availableVas.map((va: any) => {
        const invited = selectedJob ? inviteMap.get(`${selectedJob.id}:${va.user_id}`) : null;
        const canInvite = selectedJob?.status === "published";
        return <article className="card browse-va-card" key={va.user_id}>
          <div className="row-between wrap">
            <div><strong>{String(va.full_name || "Vetted Virtual Assistant")}</strong><div className="small muted">{va.headline || va.primary_category || "Virtual Assistant"}</div></div>
            {selectedJob ? <span className="badge">{va._match.score}% · {matchLabel(Number(va._match.score || 0))}</span> : null}
          </div>
          {selectedJob ? <div className="small muted">Match confidence: {va._match.confidence}% of role criteria assessed</div> : null}
          <div className="small muted browse-va-facts">{va.years_experience ? `${va.years_experience}+ yrs` : "Experience not set"}{va.weekly_hours ? ` · ${va.weekly_hours} hrs/week` : ""}{va.hourly_rate ? ` · $${Number(va.hourly_rate).toFixed(2)}/hr` : ""}</div>
          <div className="pill-list">{(va.skills || []).slice(0, 3).map((skill: string, index: number) => <span className="badge" key={`${skill}-${index}`}>{skill}</span>)}</div>
          <div className="row wrap browse-va-actions">
            {va.slug ? <Link className="btn btn-sm" href={`/va/${va.slug}`} target="_blank">View profile</Link> : null}
            {invited
              ? <span className="badge">Invited to this role · {invited}</span>
              : canInvite && selectedJob
                ? <details className="invite-details"><summary className="btn btn-sm btn-primary">Invite to this role</summary>
                    <form action={inviteVaAction} className="invite-popover stack">
                      <input type="hidden" name="va_id" value={va.user_id}/>
                      <input type="hidden" name="job_id" value={selectedJob.id}/>
                      <div className="small muted">Invite to <strong>{selectedJob.title}</strong></div>
                      <div className="field"><label htmlFor={`note-${va.user_id}`}>Personal note</label><textarea id={`note-${va.user_id}`} name="note" maxLength={500} placeholder="Your background looks relevant to this role. Would you like to review it?"/></div>
                      <button className="btn btn-primary btn-sm" type="submit">Send invitation</button>
                    </form>
                  </details>
                : <Link className="btn btn-sm" href={selectedJob ? `/workspace/client/jobs/${selectedJob.id}` : "/workspace/client/jobs"}>{selectedJob ? "Open role" : "View roles"}</Link>}
          </div>
        </article>;
      })}</div> : <div className="empty">No approved Virtual Assistants are publicly listed yet. Our recruiting team can still match candidates to your role.</div>}
    </section>

    {applications.length ? <form id="candidate-list" action="/workspace/client/compare" method="get">
      <div className="row-between wrap" style={{ marginBottom: 12 }}>
        <p className="small muted" style={{ margin: 0 }}>{unlockedApplications.length >= 2 ? "Select 2 to 4 candidates with access active to compare their role fit side by side." : "Comparison becomes available after candidate access is active for at least two applicants."}</p>
        {unlockedApplications.length >= 2 ? <button className="btn btn-sm" type="submit">Compare selected</button> : null}
      </div>
      <div className="table-wrap responsive-table candidate-review-table">
        <table>
          <thead><tr><th><span className="sr-only">Compare</span></th><th>Candidate</th><th>Job</th><th>Fit</th><th>Status</th><th>Applied</th><th></th></tr></thead>
          <tbody>{applications.map((a: any, index: number) => {
            const access = accessMap.get(a.job_id) as any;
            const unlocked = candidateAccessUnlocked(access?.access_status);
            const p = detailMap.get(a.id) as any || {};
            const score = Number(a.match_score || 0);
            return <tr key={a.id}>
              <td data-label="Compare">{unlocked ? <label className="compare-check"><input type="checkbox" name="ids" value={a.id}/><span className="sr-only">Compare {p.full_name || "candidate"}</span></label> : <LockKeyhole size={14} aria-label="Candidate identity protected"/>}</td>
              <td data-label="Candidate"><strong>{unlocked ? (p.full_name || "Virtual Assistant applicant") : protectedCandidateName(index)}</strong><div className="small muted">{unlocked ? (p.primary_category || "Virtual Assistant") : "Identity protected"}</div></td>
              <td data-label="Job"><Link className="text-link" href={`/workspace/client/jobs/${a.job_id}`}>{jobMap.get(a.job_id) || "Role"}</Link></td>
              <td data-label="Fit"><div className="candidate-fit"><strong>{score}%</strong><span>{matchLabel(score)}</span></div></td>
              <td data-label="Status"><span className={`badge ${a.status === "hired" ? "badge-success" : ""}`}>{String(a.status).replaceAll("_", " ")}</span></td>
              <td data-label="Applied">{dateShort(a.applied_at)}</td>
              <td>{unlocked ? <Link className="btn btn-sm" href={`/workspace/client/candidates/${a.id}`}>{a.status === "hired" ? "View hire" : "Review candidate"}</Link> : <Link className="btn btn-sm" href={`/workspace/client/jobs/${a.job_id}`}>Review access options</Link>}</td>
            </tr>;
          })}</tbody>
        </table>
      </div>
    </form> : <div className="card empty" id="candidate-list">Candidates will appear here after your recruiter releases a shortlist or a Virtual Assistant applies to a published role.</div>}
  </>;
}
