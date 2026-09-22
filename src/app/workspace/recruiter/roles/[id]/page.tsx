import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CalendarClock, CheckCircle2, Clock3, Eye, MessageSquare, UsersRound } from "lucide-react";
import { requireRoleFast } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { leadStageLabel } from "@/lib/lead-crm";
import { elapsedLabel, hoursSince } from "@/lib/format";
import { publicationBlocker } from "@/lib/job-publication";
import { prepareStandardPlacementTermsAction, sendClientAccountClaimAction } from "@/app/actions/agency-role";
import { sendClientShortlistFollowupAction } from "@/app/actions/client-shortlist";
import { StaffJobMatching } from "@/components/staff-job-matching";
import type { CandidateInterviewRow, PlacementOfferRow, ProfileSummaryRow, RecruiterActivityRow, ShortlistCandidateRow, StaffProfileRow } from "@/lib/workspace-rows";

const STAGES: Record<string, string> = {
  intake: "Intake",
  ready_to_recruit: "Ready to Recruit",
  sourcing: "Sourcing",
  internal_review: "Internal Review",
  client_review: "Client Review",
  interviewing: "Interviewing",
  selected: "Selected",
  offer: "Offer",
  pre_start: "Pre-start",
  filled: "Filled",
  closed: "Closed",
};
const NEXT: Record<string, string> = {
  intake: "Finish client activation and role requirements",
  ready_to_recruit: "Start sourcing and review the vetted bench",
  sourcing: "Find qualified candidates and build the internal shortlist",
  internal_review: "Recruiter QA: verify evidence and choose the client shortlist",
  client_review: "Get client Interested / Interview / Pass decisions",
  interviewing: "Schedule interviews and capture Proceed / Hold / Pass feedback",
  selected: "Prepare final placement terms",
  offer: "Get VA acceptance, then client confirmation",
  pre_start: "Complete recruiter → Client Success handoff and placement readiness",
  filled: "Client Success owns onboarding and retention",
  closed: "No active recruiting action",
};
const SLA: Record<string, number> = {
  intake: 8,
  ready_to_recruit: 2,
  sourcing: 24,
  internal_review: 24,
  client_review: 48,
  interviewing: 72,
  selected: 2,
  offer: 24,
  pre_start: 72,
};
const ageHours = hoursSince;
const ageLabel = (value?: string | null) => elapsedLabel(value, { empty: "0h in stage", suffix: " in stage" });
const eventAgeLabel = (value?: string | null) => elapsedLabel(value, { empty: "Not recorded", underHour: "less than 1 hour ago" });
function slaLabel(stage: string, entered?: string | null) {
  const target = SLA[stage];
  if (!target || !entered) return null;
  const left = target - ageHours(entered);
  return { late: left < 0, text: left < 0 ? `${Math.ceil(Math.abs(left))}h past target` : `${Math.ceil(left)}h remaining` };
}

export default async function RoleControlCenter({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  await requireRoleFast("recruiter");
  const admin = createAdminClient();
  const { data: job, error } = await admin.from("jobs").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!job) notFound();
  const [
    { data: lead },
    { data: commercial },
    { data: shortlistData },
    { data: interviewData },
    { data: offerData },
    { data: room },
    { data: activityData },
  ] = await Promise.all([
    job.lead_id
      ? admin
          .from("lead_intake")
          .select("id,name,email,company,crm_stage,owner_id,first_contact_at,discovery_completed_at")
          .eq("id", job.lead_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    admin.from("job_commercials").select("*").eq("job_id", id).maybeSingle(),
    admin.from("job_shortlist_candidates").select("*").eq("job_id", id).order("shortlist_order", { ascending: true, nullsFirst: false }).order("created_at"),
    admin.from("candidate_interviews").select("*").eq("job_id", id).order("created_at"),
    admin.from("placement_offers").select("*").eq("job_id", id).order("created_at", { ascending: false }),
    admin
      .from("workrooms")
      .select("id,placement_stage,client_success_owner_id,placement_ready_at,handoff_completed_at,start_date")
      .eq("job_id", id)
      .maybeSingle(),
    admin
      .from("recruiter_activity")
      .select("action,description,created_at,metadata")
      .eq("subject_type", "job")
      .eq("subject_id", id)
      .order("created_at", { ascending: false })
      .limit(40),
  ]);
  const shortlist = (shortlistData || []) as ShortlistCandidateRow[];
  const interviews = (interviewData || []) as CandidateInterviewRow[];
  const offers = (offerData || []) as PlacementOfferRow[];
  const activity = (activityData || []) as RecruiterActivityRow[];
  const vaIds = [
    ...new Set(
      shortlist
        .map((x) => x.va_id)
        .concat(interviews.map((x) => x.va_id))
        .filter(Boolean),
    ),
  ];
  const staffIds = [job.client_id, job.recruiter_id, room?.client_success_owner_id].filter(Boolean);
  const [{ data: vaData }, { data: staffData }] = await Promise.all([
    vaIds.length ? admin.from("profiles").select("id,full_name").in("id", vaIds) : Promise.resolve({ data: [] }),
    staffIds.length ? admin.from("profiles").select("id,full_name,role").in("id", staffIds) : Promise.resolve({ data: [] }),
  ]);
  const vaMap = new Map(((vaData || []) as ProfileSummaryRow[]).map((v) => [v.id, v.full_name || "VA"]));
  const staffMap = new Map(((staffData || []) as StaffProfileRow[]).map((v) => [v.id, v.full_name || v.role]));
  const proposed = shortlist.filter((x) => x.shortlist_status === "proposed");
  const released = shortlist.filter((x) => x.shortlist_status === "released");
  const waiting = released.filter((x) => !x.client_decision);
  const activeInterviews = interviews.filter((x) => x.status !== "cancelled");
  const currentOffer = offers.find((x) => !["declined", "cancelled"].includes(x.status));
  const sla = slaLabel(job.hiring_stage, job.hiring_stage_entered_at);
  const requirementCount =
    (job.must_have_skills?.length || 0) +
    (job.must_have_tools?.length || 0) +
    (job.required_industries?.length || 0) +
    (job.dealbreakers?.length || 0);
  const publication = publicationBlocker(job, commercial);
  const clientViewedAt = activity.find((row) => row.action === "client_shortlist_viewed")?.created_at || null;
  const lastClientFollowupAt = activity.find((row) => row.action === "client_shortlist_followup")?.created_at || null;
  const oldestReleasedAt = released.map((row) => row.released_at).filter(Boolean).sort()[0] || null;
  const hoursWaiting = oldestReleasedAt ? Math.max(0, (Date.now() - new Date(oldestReleasedAt).getTime()) / 3600000) : 0;
  const followupRecent = Boolean(lastClientFollowupAt && Date.now() - new Date(lastClientFollowupAt).getTime() < 20 * 3600000);
  const feedbackCount = released.filter((row) => row.client_decision && row.client_decision !== "hold").length;
  const heldCount = released.filter((row) => row.client_decision === "hold").length;
  const clientStatus = !released.length
    ? "Not sent"
    : feedbackCount === released.length
      ? "Feedback complete"
      : clientViewedAt
        ? "Viewed, waiting on decisions"
        : "Sent, not viewed";

  return (
    <>
      {query.client_claim_sent ? (
        <div className="success-banner" role="status">
          Client account link sent. The role will attach automatically when the client signs up or logs in with the same email.
        </div>
      ) : null}
      {query.client_already_linked ? (
        <div className="success-banner" role="status">The client account is already linked to this role.</div>
      ) : null}
      {query.shortlist_saved ? <div className="success-banner">Internal shortlist saved.</div> : null}
      {query.shortlist_released ? <div className="success-banner">Shortlist released to the client.</div> : null}
      {query.client_invited ? <div className="success-banner">Shortlist saved and the client account invitation was sent.</div> : null}
      {query.recommendation_saved ? <div className="success-banner">Client recommendation saved.</div> : null}
      {query.followup_sent ? <div className="success-banner">Client shortlist follow-up sent.</div> : null}
      {query.shortlist_error ? <div className="alert" role="alert">{query.shortlist_error}</div> : null}
      <div className="page-head">
        <div>
          <div className="kicker">Role Control Center</div>
          <h1>{job.title}</h1>
          <p>
            {job.company_name || lead?.company || staffMap.get(job.client_id) || "Client"} · one source of truth from signed client to
            successful handoff.
          </p>
        </div>
        <div className="row wrap">
          <a className="btn btn-primary" href="#matching">
            Match & shortlist
          </a>
          {room ? (
            <Link className="btn" href={`/workspace/recruiter/placements/${room.id}`}>
              Open placement
            </Link>
          ) : null}
          <Link className="btn" href="/workspace/recruiter/roles">
            All roles
          </Link>
        </div>
      </div>

      <nav className="role-workflow-nav" aria-label="Role workflow">
        <a href="#overview">1. Role overview</a>
        <a href="#matching">2. Match & shortlist</a>
        <a href="#client-handoff">3. Client handoff</a>
        <a href="#interviews">4. Interview & offer</a>
      </nav>

      <div id="overview" className="grid-4">
        <div className="card">
          <span className="small muted">Sales</span>
          <strong style={{ display: "block", marginTop: 5 }}>{lead ? leadStageLabel(lead.crm_stage) : "Client account"}</strong>
        </div>
        <div className="card">
          <span className="small muted">Hiring stage</span>
          <strong style={{ display: "block", marginTop: 5 }}>{STAGES[job.hiring_stage] || job.hiring_stage}</strong>
          <span className="small muted">{ageLabel(job.hiring_stage_entered_at)}</span>
        </div>
        <div className="card">
          <span className="small muted">Stage SLA</span>
          <strong style={{ display: "block", marginTop: 5 }}>{sla ? sla.text : "No active timer"}</strong>
          {sla?.late ? (
            <span className="badge badge-danger" style={{ marginTop: 6 }}>
              Needs action
            </span>
          ) : null}
        </div>
        <div className="card">
          <span className="small muted">Target start</span>
          <strong style={{ display: "block", marginTop: 5 }}>{job.target_start_date || job.start_timing || "Not set"}</strong>
        </div>
      </div>

      <section className="card" style={{ marginTop: 18 }}>
        <div className="row-between wrap">
          <div>
            <h2 style={{ margin: 0 }}>Publication status</h2>
            <div className="row wrap" style={{ marginTop: 8 }}>
              <span className={`badge ${publication.key === "published" ? "badge-success" : publication.key === "waiting_client_approval" ? "badge-warning" : ""}`}>
                {publication.label}
              </span>
            </div>
            <p className="small muted" style={{ margin: "8px 0 0" }}>{publication.detail}</p>
          </div>
          <Clock3 size={20} />
        </div>
        <div className="row wrap" style={{ marginTop: 14 }}>
          {publication.key === "needs_client_account" && lead?.email ? (
            <form action={sendClientAccountClaimAction}>
              <input type="hidden" name="job_id" value={job.id} />
              <button className="btn btn-primary" type="submit">Send client account link</button>
            </form>
          ) : null}
          {publication.key === "needs_terms" ? (
            <form action={prepareStandardPlacementTermsAction}>
              <input type="hidden" name="job_id" value={job.id} />
              <button className="btn btn-primary" type="submit">Prepare standard terms</button>
            </form>
          ) : null}
          {publication.key === "needs_role_details" || publication.key === "needs_role_review" ? (
            <a className="btn btn-primary" href="#matching">Complete role review</a>
          ) : null}
          {publication.key === "waiting_client_approval" ? (
            <Link className="btn" href={lead?.email ? `/workspace/recruiter/leads?q=${encodeURIComponent(lead.email)}` : "/workspace/recruiter/leads"}>
              Follow up with client
            </Link>
          ) : null}
        </div>
      </section>

      <section className="card" style={{ marginTop: 18 }}>
        <div className="row-between wrap">
          <div>
            <h2 style={{ margin: 0 }}>Next operational action</h2>
            <p style={{ margin: "7px 0 0" }}>{NEXT[job.hiring_stage] || "Review the role."}</p>
          </div>
          <Clock3 size={20} />
        </div>
      </section>

      <div className="grid-2" style={{ marginTop: 18 }}>
        <section className="card">
          <h2 style={{ marginTop: 0 }}>Role brief</h2>
          <div className="grid-2">
            <div>
              <span className="small muted">Hours</span>
              <strong style={{ display: "block" }}>{job.hours_per_week ? `${job.hours_per_week}/week` : "Not set"}</strong>
            </div>
            <div>
              <span className="small muted">Timezone</span>
              <strong style={{ display: "block" }}>{job.timezone || "Not set"}</strong>
            </div>
            <div>
              <span className="small muted">Budget</span>
              <strong style={{ display: "block" }}>
                {job.min_hourly_rate ? `USD ${job.min_hourly_rate}${job.max_hourly_rate ? `–${job.max_hourly_rate}` : "+"}/hr` : "Not set"}
              </strong>
            </div>
            <div>
              <span className="small muted">Requirements</span>
              <strong style={{ display: "block" }}>{requirementCount} hard guardrails</strong>
            </div>
          </div>
          {job.communication_requirement ? (
            <p className="small">
              <strong>Communication:</strong> {job.communication_requirement}
            </p>
          ) : null}
          {job.summary ? <p className="small muted">{job.summary}</p> : null}
          <a className="btn btn-sm" href="#matching">
            Review requirements and candidates
          </a>
        </section>
        <section className="card">
          <h2 style={{ marginTop: 0 }}>Ownership & commercial</h2>
          <div className="stack">
            <div className="row-between">
              <span>Recruiter</span>
              <strong>{staffMap.get(job.recruiter_id) || "Unassigned"}</strong>
            </div>
            <div className="row-between">
              <span>Client</span>
              <strong>{staffMap.get(job.client_id) || lead?.name || "Not linked"}</strong>
            </div>
            <div className="row-between">
              <span>Service model</span>
              <strong>{job.service_model?.replaceAll("_", " ")}</strong>
            </div>
            <div className="row-between">
              <span>Terms</span>
              <strong>{commercial?.commercial_status || "Not prepared"}</strong>
            </div>
            {room ? (
              <div className="row-between">
                <span>Client Success</span>
                <strong>{staffMap.get(room.client_success_owner_id) || "Unassigned"}</strong>
              </div>
            ) : null}
          </div>
          {lead?.email ? (
            <Link className="btn btn-sm" style={{ marginTop: 14 }} href={`/workspace/recruiter/leads?q=${encodeURIComponent(lead.email)}`}>
              Open client CRM record
            </Link>
          ) : null}
        </section>
      </div>

      <section id="matching" className="role-workspace-section">
        <div className="role-workspace-section-head">
          <div>
            <span className="small muted">Step 2</span>
            <h2>Match, shortlist & preview</h2>
            <p>Review fit, choose the candidates you will stand behind, preview the client experience, then release from this page.</p>
          </div>
          <ArrowRight size={20} />
        </div>
        <StaffJobMatching job={job} viewerRole="recruiter" returnTo={`/workspace/recruiter/roles/${id}`} />
      </section>

      <section id="client-handoff" className="card role-client-handoff" style={{ marginTop: 18 }}>
        <div className="row-between wrap">
          <div>
            <span className="small muted">Step 3</span>
            <h2 style={{ margin: "3px 0 0" }}>Client handoff</h2>
            <p className="small muted" style={{ margin: "5px 0 0" }}>Track whether the shortlist was viewed, what the client decided, and whether follow-up is due.</p>
          </div>
          <span className={`badge ${clientStatus === "Feedback complete" ? "badge-success" : released.length && hoursWaiting >= 24 ? "badge-warning" : ""}`}>{clientStatus}</span>
        </div>

        <div className="role-handoff-stats">
          <div><span>Sent</span><strong>{released.length}</strong></div>
          <div><span>Waiting</span><strong>{waiting.length}</strong></div>
          <div><span>On hold</span><strong>{heldCount}</strong></div>
          <div><span>Decided</span><strong>{feedbackCount}</strong></div>
        </div>

        {released.length ? (
          <>
            <div className="role-client-state-line">
              <span><Eye size={14}/> {clientViewedAt ? `Viewed ${eventAgeLabel(clientViewedAt)}` : "Client has not viewed the shortlist yet"}</span>
              <span><Clock3 size={14}/> {oldestReleasedAt ? `Sent ${eventAgeLabel(oldestReleasedAt)}` : "Send time not recorded"}</span>
              {lastClientFollowupAt ? <span><MessageSquare size={14}/> Followed up {eventAgeLabel(lastClientFollowupAt)}</span> : null}
            </div>
            <div className="stack" style={{ marginTop: 14 }}>
              {released.map((x) => (
                <div className="role-client-candidate" key={x.id}>
                  <div>
                    <strong>{vaMap.get(x.va_id) || "VA"}</strong>
                    <div className="small muted">{x.client_recommendation || "Recruiter-curated candidate"}</div>
                  </div>
                  <span className={`badge ${x.client_decision === "pass" || x.client_decision === "hold" ? "badge-warning" : x.client_decision ? "badge-success" : ""}`}>
                    {x.client_decision ? x.client_decision.replaceAll("_", " ") : "Waiting"}
                  </span>
                </div>
              ))}
            </div>
            {waiting.length ? (
              <form action={sendClientShortlistFollowupAction} className="role-client-followup">
                <input type="hidden" name="job_id" value={job.id}/>
                <input type="hidden" name="return_to" value={`/workspace/recruiter/roles/${id}`}/>
                <button className={`btn ${hoursWaiting >= 24 && !followupRecent ? "btn-primary" : ""}`} type="submit" disabled={followupRecent}>
                  <MessageSquare size={14}/>
                  {followupRecent ? "Follow-up sent recently" : hoursWaiting >= 24 ? "Send client follow-up" : "Follow up with client"}
                </button>
              </form>
            ) : null}
          </>
        ) : (
          <div className="empty">No shortlist has been released yet. Build and preview it above.</div>
        )}
      </section>

      <section className="card" style={{ marginTop: 18 }}>
        <div className="row-between wrap">
          <div>
            <h2 style={{ margin: 0 }}>Hiring progress</h2>
            <p className="small muted" style={{ margin: "5px 0 0" }}>
              Internal candidates stay internal until the recruiter releases the curated shortlist.
            </p>
          </div>
          <UsersRound size={20} />
        </div>
        <div className="grid-4" style={{ marginTop: 14 }}>
          <div>
            <span className="small muted">Internal review</span>
            <strong style={{ display: "block", fontSize: 22 }}>{proposed.length}</strong>
          </div>
          <div>
            <span className="small muted">Sent to client</span>
            <strong style={{ display: "block", fontSize: 22 }}>{released.length}</strong>
          </div>
          <div>
            <span className="small muted">Waiting on client</span>
            <strong style={{ display: "block", fontSize: 22 }}>{waiting.length}</strong>
          </div>
          <div>
            <span className="small muted">Interviews</span>
            <strong style={{ display: "block", fontSize: 22 }}>{activeInterviews.length}</strong>
          </div>
        </div>
        <div className="row wrap" style={{ marginTop: 14 }}>
          <a className="btn btn-primary" href="#matching">Manage shortlist</a>
          {released.length ? <a className="btn" href="#client-handoff">Review client status</a> : null}
        </div>
      </section>

      <div id="interviews" className="grid-2" style={{ marginTop: 18 }}>
        <section className="card">
          <h2 style={{ marginTop: 0 }}>Interviews</h2>
          {activeInterviews.length ? (
            <div className="stack">
              {activeInterviews.map((x) => (
                <div key={x.id} className="row-between">
                  <div>
                    <strong>{vaMap.get(x.va_id) || "VA"}</strong>
                    <div className="small muted">
                      {x.scheduled_at
                        ? new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" }).format(
                            new Date(x.scheduled_at),
                          )
                        : "Scheduling pending"}
                    </div>
                  </div>
                  <span className="badge">{x.client_decision || x.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty">No interviews yet.</div>
          )}
        </section>
        <section className="card">
          <h2 style={{ marginTop: 0 }}>Offer & placement</h2>
          {currentOffer ? (
            <div className="info-banner">
              <strong>{vaMap.get(currentOffer.va_id) || "VA"}</strong>
              <p style={{ margin: "5px 0 0" }}>
                Offer: {currentOffer.status.replaceAll("_", " ")} · USD {currentOffer.hourly_rate}/hr · {currentOffer.weekly_hours} hrs/week
              </p>
            </div>
          ) : (
            <p className="small muted">No active placement offer.</p>
          )}
          {room ? (
            <div className="info-banner" style={{ marginTop: 12 }}>
              <CheckCircle2 size={17} />
              <div>
                <strong>Placement created</strong>
                <p style={{ margin: "4px 0 0" }}>
                  Client Success state: {room.placement_stage?.replaceAll("_", " ")}.{" "}
                  {room.placement_ready_at ? "Placement Ready." : "Readiness is still in progress."}
                </p>
              </div>
            </div>
          ) : null}
        </section>
      </div>

      <section className="card" style={{ marginTop: 18 }}>
        <div className="row-between wrap">
          <div>
            <h2 style={{ margin: 0 }}>Recent operating history</h2>
            <p className="small muted" style={{ margin: "5px 0 0" }}>
              A compact audit trail for handoffs and decisions.
            </p>
          </div>
          <CalendarClock size={20} />
        </div>
        {activity.length ? (
          <div className="stack" style={{ marginTop: 14 }}>
            {activity.map((a, index) => (
              <div className="row-between" key={`${a.created_at}-${index}`}>
                <div>
                  <strong className="small">{a.description || a.action.replaceAll("_", " ")}</strong>
                  <div className="small muted">{a.action.replaceAll("_", " ")}</div>
                </div>
                <span className="small muted">
                  {new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" }).format(
                    new Date(a.created_at),
                  )}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty">No role activity recorded yet.</div>
        )}
      </section>
    </>
  );
}
