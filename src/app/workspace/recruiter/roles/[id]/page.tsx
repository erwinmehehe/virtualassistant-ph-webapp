import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarClock, CheckCircle2, Clock3, UsersRound } from "lucide-react";
import { requireRoleFast } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { leadStageLabel } from "@/lib/lead-crm";
import { elapsedLabel, hoursSince } from "@/lib/format";
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
function slaLabel(stage: string, entered?: string | null) {
  const target = SLA[stage];
  if (!target || !entered) return null;
  const left = target - ageHours(entered);
  return { late: left < 0, text: left < 0 ? `${Math.ceil(Math.abs(left))}h past target` : `${Math.ceil(left)}h remaining` };
}

export default async function RoleControlCenter({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, { userId }] = await Promise.all([params, requireRoleFast("recruiter")]);
  const admin = createAdminClient();
  const { data: job, error } = await admin.from("jobs").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!job || job.recruiter_id !== userId) notFound();
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
    admin.from("job_shortlist_candidates").select("*").eq("job_id", id).order("created_at"),
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
      .limit(12),
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

  return (
    <>
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
          <Link className="btn btn-primary" href={`/workspace/recruiter/matching/${id}`}>
            Open matching workspace
          </Link>
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

      <div className="grid-4">
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
          <Link className="btn btn-sm" href={`/workspace/recruiter/matching/${id}`}>
            Review requirements and candidates
          </Link>
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
        {released.length ? (
          <div className="stack" style={{ marginTop: 14 }}>
            {released.map((x) => (
              <div className="row-between card" key={x.id}>
                <div>
                  <strong>{vaMap.get(x.va_id) || "VA"}</strong>
                  <div className="small muted">{x.client_recommendation || "Recruiter-curated candidate"}</div>
                </div>
                <span className="badge">{x.client_decision ? x.client_decision.replaceAll("_", " ") : "Waiting"}</span>
              </div>
            ))}
          </div>
        ) : null}
        <div className="row wrap" style={{ marginTop: 14 }}>
          <Link className="btn btn-primary" href={`/workspace/recruiter/matching/${id}`}>
            Work this role
          </Link>
          {released.length ? (
            <Link className="btn" href="/workspace/recruiter/client-review">
              Client review queue
            </Link>
          ) : null}
        </div>
      </section>

      <div className="grid-2" style={{ marginTop: 18 }}>
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
