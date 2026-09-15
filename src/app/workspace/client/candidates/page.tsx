import Link from "next/link";
import { ArrowRight, CalendarDays, Sparkles } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { clientMatchLabel } from "@/lib/matching";
import { clientShortlistDecisionAction } from "@/app/actions/client-shortlist";

export default async function ClientCandidatesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const query = await searchParams;
  const { user } = await requireRole("client");
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: jobs } = await supabase.from("jobs").select("id,title,status,created_at").eq("client_id", user.id).order("created_at", { ascending: false });
  const jobRows = jobs || [];
  const activeJobs = jobRows.filter((job: any) => job.status !== "closed");
  const selectedJob = activeJobs.find((job: any) => job.id === query.role) || activeJobs[0] || null;

  if (!jobRows.length) return <><div className="page-head"><div><h1>Your shortlist</h1><p>Your recruiting team screens and recommends vetted Virtual Assistants against an approved hiring request.</p></div></div><div className="card empty"><p>Start with a hiring request so the recruiting team can build a shortlist.</p><Link className="btn btn-primary" href="/workspace/client/jobs/new">Start a hiring request</Link></div></>;

  const jobIds = jobRows.map((job: any) => job.id);
  const [{ data: releasedRows }, { data: interviews }, { data: offers }] = await Promise.all([
    admin.from("job_shortlist_candidates").select("job_id,va_id,match_score,released_at,client_recommendation,client_decision,client_decision_note,client_decision_at").in("job_id", jobIds).eq("shortlist_status", "released").order("match_score", { ascending: false }),
    admin.from("candidate_interviews").select("id,job_id,va_id,status,scheduled_at,client_decision").in("job_id", jobIds).neq("status", "cancelled"),
    admin.from("placement_offers").select("id,job_id,va_id,status").in("job_id", jobIds).in("status", ["pending_va", "pending_client", "accepted"])
  ]);

  const selectedReleased = (releasedRows || []).filter((row: any) => row.job_id === selectedJob?.id);
  const selectedInterviews = (interviews || []).filter((row: any) => row.job_id === selectedJob?.id);
  const selectedOffers = (offers || []).filter((row: any) => row.job_id === selectedJob?.id);

  if (selectedJob && selectedReleased.length) {
    try {
      const cutoff = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
      const { count } = await admin.from("recruiter_activity").select("id", { count: "exact", head: true }).eq("subject_type", "job").eq("subject_id", selectedJob.id).eq("action", "client_shortlist_viewed").eq("actor_id", user.id).gte("created_at", cutoff);
      if (!count) await admin.from("recruiter_activity").insert({ subject_type: "job", subject_id: selectedJob.id, action: "client_shortlist_viewed", description: "Client viewed the curated shortlist", actor_id: user.id, metadata: { released_count: selectedReleased.length } });
    } catch {}
  }

  const releasedVaIds = [...new Set(selectedReleased.map((row: any) => row.va_id))];
  const [{ data: profiles }, { data: vas }] = releasedVaIds.length ? await Promise.all([
    admin.from("profiles").select("id,full_name").in("id", releasedVaIds),
    admin.from("va_profiles").select("user_id,slug,headline,primary_category,weekly_hours,hourly_rate,skills,availability_status").in("user_id", releasedVaIds)
  ]) : [{ data: [] }, { data: [] }];
  const profileMap = new Map((profiles || []).map((row: any) => [row.id, row]));
  const vaMap = new Map((vas || []).map((row: any) => [row.user_id, row]));

  const undecided = selectedReleased.filter((row: any) => !row.client_decision).length;
  const interviewOpen = selectedInterviews.filter((row: any) => ["requested", "scheduled", "completed"].includes(row.status) && !row.client_decision).length;
  const offerOpen = selectedOffers.filter((row: any) => ["pending_va", "pending_client"].includes(row.status)).length;
  const next = offerOpen
    ? { title: `${offerOpen} final offer${offerOpen === 1 ? "" : "s"} in progress`, copy: "The recruiting team has prepared final terms. Open Offers for the next confirmation step.", href: "/workspace/client/offers", label: "Review offers" }
    : interviewOpen
      ? { title: `${interviewOpen} interview${interviewOpen === 1 ? "" : "s"} need attention`, copy: "Schedule, join, or record a Proceed / Hold / Pass decision.", href: "/workspace/client/interviews", label: "Open interviews" }
      : undecided
        ? { title: `${undecided} shortlist decision${undecided === 1 ? "" : "s"} waiting`, copy: "Tell your recruiter who interests you, who you want to interview, or who to pass on.", href: selectedJob ? `/workspace/client/candidates?role=${selectedJob.id}#recruiter-shortlist` : "/workspace/client/candidates", label: "Review shortlist" }
        : { title: "Recruiting is in progress", copy: "Your recruiter is screening the vetted VA pool and will only send candidates ready for your review.", href: "/workspace/client/jobs", label: "View role progress" };

  return <>
    <div className="page-head"><div><h1>Your recruiter shortlist</h1><p>You only see vetted candidates selected by the recruiting team. Raw applicants and internal matching stay with your recruiter.</p></div><div className="row wrap"><Link className="btn" href="/workspace/client/interviews"><CalendarDays size={15}/> Interviews</Link><Link className="btn" href="/workspace/client/offers">Offers</Link></div></div>

    <section className="candidate-next-action"><div className="candidate-next-icon"><Sparkles size={21}/></div><div><span className="small">Your next action</span><h2>{next.title}</h2><p>{next.copy}</p></div><Link className="btn btn-primary" href={next.href}>{next.label}<ArrowRight size={16}/></Link></section>

    {activeJobs.length > 1 ? <div className="row wrap" style={{ marginBottom: 16 }}><span className="small muted">Role:</span>{activeJobs.slice(0, 8).map((job: any) => <Link key={job.id} className={`btn btn-sm ${selectedJob?.id === job.id ? "btn-primary" : ""}`} href={`/workspace/client/candidates?role=${encodeURIComponent(job.id)}`}>{job.title}</Link>)}</div> : null}

    <section className="card dashboard-section-card" id="recruiter-shortlist">
      <div className="dashboard-section-head"><div><h2>Recruiter shortlist{selectedJob ? ` for ${selectedJob.title}` : ""}</h2><p>Each person below was reviewed by your recruiting team before being presented to you.</p></div><span className="badge">{selectedReleased.length} presented</span></div>
      {selectedReleased.length ? <div className="grid-3 browse-va-grid">{selectedReleased.map((row: any) => {
        const profile = profileMap.get(row.va_id) as any;
        const va = vaMap.get(row.va_id) as any;
        const decision = String(row.client_decision || "");
        return <article className="card browse-va-card" key={row.va_id}>
          <div className="row-between wrap"><div><strong>{profile?.full_name || "Matched Virtual Assistant"}</strong><div className="small muted">{va?.headline || va?.primary_category || "Virtual Assistant"}</div></div><span className="badge">{clientMatchLabel(Number(row.match_score || 0))}</span></div>
          <div className="small muted browse-va-facts">{va?.weekly_hours ? `${va.weekly_hours} hrs/week` : "Hours not set"}{va?.hourly_rate ? ` · $${Number(va.hourly_rate).toFixed(2)}/hr` : ""}</div>
          <div className="pill-list">{(va?.skills || []).slice(0, 3).map((skill: string, index: number) => <span className="badge" key={`${skill}-${index}`}>{skill}</span>)}</div>
          {row.client_recommendation ? <div className="info-banner"><strong>Why we recommend this VA</strong><p style={{ margin: "6px 0 0" }}>{row.client_recommendation}</p></div> : null}
          <div className="row wrap browse-va-actions">{va?.slug ? <Link className="btn btn-sm" href={`/va/${va.slug}`} target="_blank">View profile</Link> : null}{decision ? <span className={`badge ${decision === "pass" ? "badge-warning" : "badge-success"}`}>{decision === "interested" ? "Interested" : decision === "interview" ? "Interview requested" : "Passed"}</span> : null}</div>
          {selectedJob ? <div className="stack" style={{ marginTop: 10 }}><div className="row wrap">
            <form action={clientShortlistDecisionAction}><input type="hidden" name="job_id" value={selectedJob.id}/><input type="hidden" name="va_id" value={row.va_id}/><input type="hidden" name="decision" value="interested"/><input type="hidden" name="return_to" value={`/workspace/client/candidates?role=${selectedJob.id}#recruiter-shortlist`}/><button className={`btn btn-sm ${decision === "interested" ? "btn-primary" : ""}`} type="submit">Interested</button></form>
            <form action={clientShortlistDecisionAction}><input type="hidden" name="job_id" value={selectedJob.id}/><input type="hidden" name="va_id" value={row.va_id}/><input type="hidden" name="decision" value="interview"/><input type="hidden" name="return_to" value={`/workspace/client/candidates?role=${selectedJob.id}#recruiter-shortlist`}/><button className={`btn btn-sm ${decision === "interview" ? "btn-primary" : ""}`} type="submit">Request interview</button></form>
            <details><summary className="btn btn-sm">Pass</summary><form action={clientShortlistDecisionAction} className="stack" style={{ marginTop: 8 }}><input type="hidden" name="job_id" value={selectedJob.id}/><input type="hidden" name="va_id" value={row.va_id}/><input type="hidden" name="decision" value="pass"/><input type="hidden" name="return_to" value={`/workspace/client/candidates?role=${selectedJob.id}#recruiter-shortlist`}/><select name="pass_reason" defaultValue=""><option value="">Reason optional</option><option value="skills">Skills</option><option value="rate">Rate</option><option value="schedule_timezone">Schedule / timezone</option><option value="experience">Experience</option><option value="communication_video">Communication</option><option value="industry_fit">Industry fit</option><option value="availability">Availability</option><option value="other">Other</option></select><input name="decision_note" maxLength={300} placeholder="Optional note for your recruiter"/><button className="btn btn-sm" type="submit">Confirm pass</button></form></details>
          </div>{row.client_decision_note ? <div className="small muted">Feedback: {row.client_decision_note}</div> : null}</div> : null}
        </article>;
      })}</div> : <div className="empty"><strong>No shortlist is waiting for you.</strong><p>Your recruiter is screening the vetted pool. Candidates only appear here after recruiter approval.</p></div>}
    </section>
  </>;
}
