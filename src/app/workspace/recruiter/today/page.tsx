import Link from "next/link";
import { ArrowRight, Bell, BriefcaseBusiness, CalendarDays, CheckCircle2, Clock3, ExternalLink, ImageOff, ListTodo, MessageSquare, RefreshCw, UserRound, UserRoundCheck } from "lucide-react";
import { requireRoleFast } from "@/lib/auth";
import { PublicAvatar } from "@/components/public-avatar";
import { DashHeader } from "@/components/dash-ui";
import { createAdminClient } from "@/lib/supabase/admin";
import { withServerTiming } from "@/lib/server-timing";
import { completeRecruiterTaskAction, snoozeRecruiterTaskAction } from "@/app/actions/recruiter-ops";
import { sendClientShortlistFollowupAction } from "@/app/actions/client-shortlist";
import { prepareTopMatchesForReviewAction } from "@/app/actions/matching";
import styles from "./today.module.css";

const PRIORITY_CLASS: Record<string,string> = { urgent:"badge-warning", high:"badge-warning", normal:"", low:"" };
const LEAD_QUEUE_KINDS = new Set(["lead_first_contact", "lead_followup"]);
const FOLLOW_THROUGH_KINDS = new Set(["client_shortlist_waiting", "client_response_overdue"]);

type ApprovalReadyVa = {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  primary_category: string | null;
  completion_score: number | null;
  stage: string | null;
  availability_status: string | null;
};

type DailyActionRow = {
  priority: string | null;
  action_type: string | null;
  title: string | null;
  description: string | null;
  href: string | null;
  subject_type: string | null;
  subject_id: string | null;
  age_hours: number | null;
};

type ActiveRoleRow = {
  id: string;
  title: string | null;
  company_name: string | null;
  status: string | null;
  hiring_stage: string | null;
  hiring_stage_entered_at: string | null;
  updated_at: string | null;
  created_at: string;
};

type NewHiringRoleRow = {
  id: string;
  title: string | null;
  company_name: string | null;
  lead_id: string | null;
  recruiter_id: string | null;
  status: string | null;
  hiring_stage: string | null;
  created_at: string;
};

function ageLabel(hours: number | null | undefined) {
  const value = Math.max(0, Number(hours || 0));
  if (value < 24) return `${Math.max(1, Math.round(value))}h`;
  return `${Math.max(1, Math.floor(value / 24))}d`;
}

function stageAge(value?: string | null) {
  if (!value) return null;
  const diff = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(diff) || diff <= 0) return null;
  return Math.max(1, Math.floor(diff / 86400000));
}

function manilaTime(value?: string | null) {
  if (!value) return "No due time";
  return new Intl.DateTimeFormat("en-PH", { dateStyle:"medium", timeStyle:"short", timeZone:"Asia/Manila" }).format(new Date(value));
}

function meetingActionLabel(value: unknown) {
  const raw = String(value || "").trim();
  try {
    const host = new URL(raw).hostname.toLowerCase();
    if (host === "meet.google.com") return "Join Google Meet";
    if (host === "zoom.us" || host.endsWith(".zoom.us")) return "Join Zoom";
    if (host === "teams.microsoft.com" || host.endsWith(".teams.microsoft.com") || host === "teams.live.com") return "Join Microsoft Teams";
    if (host === "calendar.google.com") return "Open Google Calendar";
  } catch {
    // Unknown or malformed URLs get a provider-neutral label below.
  }
  return "Join call";
}

function exactActionHref(item:any) {
  const meta=item?.metadata||{};
  if(item.kind==="discovery"&&item.id) return `/workspace/recruiter/crm/${item.id}`;
  if(["placement_checkin","placement_risk","placement_handoff"].includes(String(item.kind))&&item.href) return item.href;
  if(meta.subject_type==="job"&&meta.subject_id) return `/workspace/recruiter/roles/${meta.subject_id}`;
  if(meta.subject_type==="va"&&meta.subject_id) return `/workspace/recruiter/candidates/${meta.subject_id}`;
  if(["role_review","role_without_shortlist","role_needs_terms","client_terms_waiting","client_account_missing","client_shortlist_waiting","all_candidates_passed","client_response_overdue","interview_requested","interview_today","interview_feedback_missing","offer_waiting_va","offer_waiting_client"].includes(String(item.kind))&&item.id) return `/workspace/recruiter/roles/${item.id}`;
  if(item.kind==="candidate_capacity_conflict"&&item.id) return `/workspace/recruiter/candidates/${item.id}`;
  return item.href||null;
}

function actionLabel(item:any) {
  if(item.kind==="discovery") return "View booking";
  if(item.kind==="all_candidates_passed") return "Find replacements";
  if(["client_shortlist_waiting","client_response_overdue"].includes(String(item.kind))) return "Open role";
  if(item.kind==="interview_requested") return "Schedule interview";
  if(["interview_today","interview_feedback_missing"].includes(String(item.kind))) return "Open interview";
  if(["offer_waiting_va","offer_waiting_client"].includes(String(item.kind))) return "Open offer";
  if(item.kind==="placement_checkin") return "Complete check-in";
  if(item.kind==="placement_risk") return "Open placement";
  if(item.kind==="placement_handoff") return "Complete handoff";
  if(item.kind==="candidate_capacity_conflict") return "Review VA";
  if(item.kind==="task") return "Act now";
  return "Review role";
}

export default async function RecruiterTodayPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}) {
  const params = await searchParams;
  const { userId } = await requireRoleFast("recruiter");
  const admin = createAdminClient();
  const { data: summaryData, error: summaryError } = await withServerTiming("recruiter.today_summary", () => admin.rpc("recruiter_today_summary", { p_user_id:userId }));
  if (summaryError) throw summaryError;

  const summary = (summaryData || {}) as Record<string,any>;
  const newHiringRoles = (Array.isArray(summary.new_hiring_roles) ? summary.new_hiring_roles : []) as NewHiringRoleRow[];
  const rawQueue = Array.isArray(summary.today_queue) ? summary.today_queue as any[] : [];
  const nonLeadQueue = rawQueue.filter((item:any)=>!LEAD_QUEUE_KINDS.has(String(item.kind)));
  const queue = nonLeadQueue.filter((item:any)=>!FOLLOW_THROUGH_KINDS.has(String(item.kind)));
  const cleanupQueue = Array.isArray(summary.cleanup_queue) ? summary.cleanup_queue as any[] : [];
  const dailyActions = (Array.isArray(summary.daily_actions) ? summary.daily_actions : []) as DailyActionRow[];
  const clientWaitByJob = new Map<string,DailyActionRow>();
  for (const item of dailyActions) {
    if (!["client_shortlist_waiting","client_response_overdue"].includes(String(item.action_type)) || !item.subject_id) continue;
    const current = clientWaitByJob.get(item.subject_id);
    if (!current || item.action_type === "client_response_overdue") clientWaitByJob.set(item.subject_id,item);
  }
  const clientWaits = [...clientWaitByJob.values()].sort((a,b)=>Number(b.age_hours || 0)-Number(a.age_hours || 0));
  const interviewRequests = dailyActions
    .filter((item)=>item.action_type==="interview_requested" && item.subject_id)
    .sort((a,b)=>Number(b.age_hours || 0)-Number(a.age_hours || 0));
  const approvalReady = (Array.isArray(summary.approval_ready_preview) ? summary.approval_ready_preview : []) as ApprovalReadyVa[];
  const staleRolePreview = (Array.isArray(summary.stale_roles_preview) ? summary.stale_roles_preview : []) as ActiveRoleRow[];
  const staleRolesCount = Number(summary.stale_roles_count || 0);
  const unreadNotifications = Number(summary.unread_notifications || 0);
  const openTasks = Number(summary.open_tasks || 0);
  const approvalReadyCount = Number(summary.approval_ready_count || 0);
  const missingPhotoCount = Number(summary.missing_photo_count || 0);
  const approvalCleanupCount = Number(summary.approval_cleanup_count || 0);
  const workSetupReadyCount = Number(summary.work_setup_ready_count || 0);
  const recentZeroCount = Number(summary.recent_zero_count || 0);
  const noShows = (Array.isArray(summary.no_show_preview) ? summary.no_show_preview : []) as Array<{id:string;name?:string|null;email?:string|null;sent?:boolean}>;
  const roleNoCandidates = Number(summary.role_no_candidates || 0);
  const replacementNeeded = Number(summary.replacement_needed || 0);
  const clientResponseOverdue = Number(summary.client_response_overdue || 0);
  const interviewsDue = Number(summary.interviews_due || 0);
  const offersWaiting = Number(summary.offers_waiting || 0);

  const nextActionCandidates = [
    {count:newHiringRoles.length,title:"Build the first shortlist",copy:"Fresh hiring enquiries already have linked roles. Claim one, prepare the strongest internal matches, and review them before anything reaches the client.",href:"#new-hiring-enquiries",cta:"Open new enquiries",icon:<BriefcaseBusiness size={20}/>},
    {count:cleanupQueue.length,title:"Review client follow-ups",copy:"Client leads need a decision, follow-up, or close action.",href:"/workspace/recruiter/crm?view=attention",cta:"Open needs action",icon:<MessageSquare size={20}/>},
    {count:noShows.length,title:"Review discovery no-shows",copy:"Keep missed calls visible without sending automatic client email. Resume when the client returns.",href:"/workspace/recruiter/today#call-rebooking",cta:"Open no-shows",icon:<RefreshCw size={20}/>},
    {count:interviewRequests.length,title:"Schedule requested interviews",copy:"Clients have explicitly requested interviews. Lock in the time from the role so the request cannot get lost.",href:interviewRequests[0]?.subject_id?`/workspace/recruiter/roles/${interviewRequests[0].subject_id}#interviews`:"/workspace/recruiter/roles?view=interviewing&sort=urgent",cta:"Schedule interview",icon:<CalendarDays size={20}/>},
    {count:clientResponseOverdue,title:"Chase overdue client decisions",copy:"Shortlists are waiting on client feedback. Follow up before active roles lose momentum.",href:"/workspace/recruiter/roles?view=waiting_client&sort=oldest",cta:"Open client waits",icon:<Clock3 size={20}/>},
    {count:roleNoCandidates,title:"Fill roles without candidates",copy:"These active roles do not have a usable shortlist yet.",href:"/workspace/recruiter/roles?view=needs_candidates&sort=urgent",cta:"Open roles",icon:<BriefcaseBusiness size={20}/>},
    {count:approvalReadyCount,title:"Review approval-ready VAs",copy:"These profiles have reached the readiness threshold and are waiting for a recruiter decision.",href:"/workspace/recruiter/talent?view=approval_ready&sort=completion",cta:"Review talent",icon:<UserRoundCheck size={20}/>},
    {count:interviewsDue,title:"Handle interview actions",copy:"Interviews or interview feedback need attention today.",href:"/workspace/recruiter/roles?view=interviewing&sort=urgent",cta:"Open interviews",icon:<CalendarDays size={20}/>}
  ];
  const primaryAction = nextActionCandidates.find((item)=>item.count>0) || {
    count:0,
    title:"You are caught up",
    copy:"No urgent recruiter queue needs attention right now. Use the workstreams below for routine review.",
    href:"/workspace/recruiter/roles",
    cta:"Review roles",
    icon:<CheckCircle2 size={20}/>
  };

  return <div className="dash-page recruiter-today-page">
    {params.contact_sent ? <div className="success-banner">Email sent and the next follow-up was scheduled.</div> : null}
    {params.contact_error ? <div className="alert" role="alert">{params.contact_error}</div> : null}
    {params.cleanup_saved ? <div className="success-banner">Lead updated. The cleanup queue has been refreshed.</div> : null}
    {params.cleanup_error ? <div className="alert" role="alert">{params.cleanup_error}</div> : null}
    {params.lead_closed ? <div className="success-banner">Lead closed and removed from the active cleanup queue.</div> : null}
    {params.crm_error ? <div className="alert" role="alert">{params.crm_error}</div> : null}
    {params.role_close_warning ? <div className="alert" role="alert">The lead closed, but its linked role could not be closed automatically. Review the role before continuing.</div> : null}
    {params.followup_sent ? <div className="success-banner">Client shortlist follow-up sent.</div> : null}
    {params.followup_error ? <div className="alert" role="alert">{params.followup_error}</div> : null}

    <DashHeader
      kicker="Agency daily workflow"
      title="My Day"
      subtitle={<>Start with the next action. Everything else only appears when it needs attention. <span className="dash-freshness">One owner · one next step</span></>}
      actions={<>
        <Link prefetch={false} className="dash-btn dash-btn-light" href="/workspace/recruiter/agenda"><CalendarDays size={16}/> Agenda</Link>
        <Link prefetch={false} className="dash-btn dash-btn-light" href="/workspace/recruiter/tasks"><ListTodo size={16}/> Tasks {openTasks ? `(${openTasks})` : ""}</Link>
        <Link prefetch={false} className="dash-btn dash-btn-light" href="/workspace/recruiter/notifications"><Bell size={16}/> Inbox {unreadNotifications ? `(${unreadNotifications})` : ""}</Link>
      </>}
    />

    <section className={`${styles.nextAction} ${primaryAction.count ? styles.nextActionOpen : styles.nextActionClear}`} aria-labelledby="recruiter-next-action">
      <span className={styles.nextActionIcon}>{primaryAction.icon}</span>
      <div className={styles.nextActionCopy}>
        <span>Next up{primaryAction.count ? ` · ${primaryAction.count} waiting` : ""}</span>
        <h2 id="recruiter-next-action">{primaryAction.title}</h2>
        <p>{primaryAction.copy}</p>
      </div>
      <Link prefetch={false} className="btn btn-primary" href={primaryAction.href}>{primaryAction.cta}<ArrowRight size={15}/></Link>
    </section>

    {newHiringRoles.length ? <section id="new-hiring-enquiries" className="card dashboard-section-card" style={{marginTop:18}}>
      <div className="dashboard-section-head">
        <div><h2>New hiring enquiries</h2><p>Each enquiry should already have one CRM record and one linked recruiting role. Work the handoff in order: review the brief, match VAs, then release the shortlist.</p></div>
        <span className="badge badge-warning">{newHiringRoles.length} waiting</span>
      </div>
      <div className="stack" style={{marginTop:12}}>
        {newHiringRoles.map((job)=><div className="card" key={job.id} style={{padding:14}}>
          <div className="row-between wrap">
            <div>
              <div className="row wrap"><span className="badge">{job.recruiter_id===userId?"My role":"Unassigned"}</span><span className="small muted">{ageLabel((Date.now()-new Date(job.created_at).getTime())/3600000)} old</span></div>
              <h3 style={{margin:"7px 0 3px"}}>{job.title||"Virtual Assistant role"}</h3>
              <p className="small muted" style={{margin:0}}>{job.company_name||"New client"} · {String(job.hiring_stage||"intake").replaceAll("_"," ")}</p>
              <div className={styles.handoffSteps} aria-label="Booking to shortlist handoff"><span className={styles.stepDone}>Booked</span><span className={styles.stepCurrent}>Review brief</span><span>Match VAs</span><span>Shortlist</span></div>
            </div>
            <div className="row wrap">
              {job.lead_id?<Link className="btn" href={`/workspace/recruiter/crm/${job.lead_id}`}>Review booking</Link>:null}
              <Link className="btn" href={`/workspace/recruiter/roles/${job.id}#overview`}>Review brief</Link>
              <form action={prepareTopMatchesForReviewAction}>
                <input type="hidden" name="job_id" value={job.id}/>
                <input type="hidden" name="return_to" value={`/workspace/recruiter/roles/${job.id}`}/>
                <button className="btn btn-primary" type="submit">Prepare top matches</button>
              </form>
            </div>
          </div>
        </div>)}
      </div>
    </section> : null}

    {interviewRequests.length ? <section id="interview-requests" className="card dashboard-section-card" style={{marginTop:18}}>
      <div className="dashboard-section-head">
        <div><h2>Interview requests</h2><p>Clients have asked to meet these candidates. Schedule directly from the role; no separate client email is required.</p></div>
        <span className="badge badge-warning">{interviewRequests.length} waiting</span>
      </div>
      <div className="stack" style={{marginTop:12}}>
        {interviewRequests.slice(0,6).map((item)=><div className="row-between wrap review-answer" key={item.subject_id || item.title}>
          <div>
            <strong>{item.title || "Client requested an interview"}</strong>
            <div className="small muted">{item.description || "Interview time has not been scheduled yet."}</div>
          </div>
          {item.subject_id?<Link className="btn btn-primary btn-sm" href={`/workspace/recruiter/roles/${item.subject_id}#interviews`}>Schedule interview</Link>:null}
        </div>)}
      </div>
    </section> : null}



    <section className={`card dashboard-section-card ${styles.queueCard}`}>
      <div className="dashboard-section-head"><div><h2>Today’s work queue</h2><p>Recruitment, interviews, offers, placements, and client decisions that need action now.</p></div><span className={`badge ${queue.length ? "badge-warning" : "badge-success"}`}>{queue.length} item{queue.length===1?"":"s"}</span></div>
      {queue.length ? <>
        {queue.length > 2 ? <div className={styles.scrollHint}>All {queue.length} items are below. Scroll this queue to review every item.</div> : null}
        <div className={`dash-actions ${styles.queue}`} tabIndex={0} aria-label={`Today's work queue, ${queue.length} items`}>
          {queue.map((item:any) => {
            const isDiscovery = item.kind === "discovery";
            const isTask = item.kind === "task";
            const isClientFollowup=["client_shortlist_waiting","client_response_overdue"].includes(item.kind);
            const actionHref=exactActionHref(item);
            return <article className="dash-action" key={`${item.kind}-${item.id}`}>
              <span className="dash-action-count"><Clock3 size={16}/></span>
              <span className="dash-action-copy">
                <span className="dash-action-title"><strong>{item.title}</strong><span className={`badge ${PRIORITY_CLASS[item.priority] || ""}`}>{item.priority}</span></span>
                <small>{item.subtitle}</small>
                {isDiscovery && item.metadata?.name ? <small className="muted"><UserRound size={12}/> Booked by {item.metadata.name}{item.metadata.email ? ` · ${item.metadata.email}` : ""}</small> : null}
                <small className="muted">{manilaTime(item.due_at)} · Manila</small>
                <div className="row wrap" style={{marginTop:8}}>
                  {isDiscovery && item.action_url ? <a className="btn btn-sm btn-primary" href={item.action_url} target="_blank" rel="noreferrer">{meetingActionLabel(item.action_url)} <ExternalLink size={13}/></a> : null}
                  {isClientFollowup&&item.id?<form action={sendClientShortlistFollowupAction}><input type="hidden" name="job_id" value={item.id}/><input type="hidden" name="return_to" value="/workspace/recruiter/today"/><button className="btn btn-sm btn-primary" type="submit"><MessageSquare size={13}/> Send client follow-up</button></form>:null}
                  {actionHref ? <Link prefetch={false} className="btn btn-sm" href={actionHref}>{actionLabel(item)}</Link> : null}
                  {isTask ? <>
                    <form action={completeRecruiterTaskAction}><input type="hidden" name="task_id" value={item.id}/><input type="hidden" name="return_to" value="/workspace/recruiter/today"/><button className="btn btn-sm btn-primary" type="submit"><CheckCircle2 size={13}/> Done</button></form>
                    <form action={snoozeRecruiterTaskAction}><input type="hidden" name="task_id" value={item.id}/><input type="hidden" name="minutes" value="1440"/><button className="btn btn-sm" type="submit">Snooze 1 day</button></form>
                  </> : null}
                </div>
              </span>
            </article>;
          })}
        </div>
      </> : <div className="dashboard-caught-up"><CheckCircle2 size={22}/><div><strong>You’re caught up.</strong><p>No current Recruitment or Client Success work is waiting right now.</p></div><Link prefetch={false} className="btn btn-sm" href="/workspace/recruiter/roles">Open roles</Link></div>}
    </section>

    <div className={styles.operationsGrid}>
      <section className="card dashboard-section-card">
        <div className="dashboard-section-head">
          <div><h2>Talent operations</h2><p>Profiles that are far enough along for a recruiter decision.</p></div>
          <Link prefetch={false} className="btn btn-sm" href="/workspace/recruiter/talent?readiness=approval_ready">Open talent <ArrowRight size={13}/></Link>
        </div>

        <div className={styles.signalRow}>
          <Link href="/workspace/recruiter/talent?readiness=approval_ready"><UserRoundCheck size={16}/><span><strong>{Number(approvalReadyCount || 0)}</strong> approval-ready</span></Link>
          <Link href="/workspace/recruiter/talent?readiness=approval_ready&photo=no"><ImageOff size={16}/><span><strong>{Number(missingPhotoCount || 0)}</strong> need a photo</span></Link>
        </div>

        {approvalReady.length ? <div className={styles.compactPeople}>
          {approvalReady.map((va)=>(
            <Link prefetch={false} className={styles.personRow} href={`/workspace/recruiter/candidates/${va.user_id}`} key={va.user_id}>
              <PublicAvatar name={va.full_name || "VA"} src={va.avatar_url} size="sm"/>
              <span className={styles.personCopy}>
                <strong>{va.full_name || "VA candidate"}</strong>
                <small>{va.primary_category || "Category not set"} · {va.completion_score || 0}% complete</small>
                <small>{va.avatar_url ? (va.availability_status || "Availability not set") : "Photo missing"}</small>
              </span>
              <ArrowRight size={15}/>
            </Link>
          ))}
        </div> : <div className="dashboard-caught-up"><CheckCircle2 size={22}/><div><strong>No approval-ready profiles waiting.</strong><p>The current talent queue is caught up.</p></div></div>}
      </section>

      <section id="role-follow-through" className="card dashboard-section-card">
        <div className="dashboard-section-head">
          <div><h2>Role follow-through</h2><p>Client decisions and roles that have stopped moving.</p></div>
          <Link prefetch={false} className="btn btn-sm" href="/workspace/recruiter/roles">Open roles <ArrowRight size={13}/></Link>
        </div>

        {noShows.length ? <div className={styles.followList}>
          <div className={styles.groupLabel}>Discovery no-shows</div>
          {noShows.slice(0,5).map((lead)=>(
            <div className={styles.followRow} key={`no-show-${lead.id}`}>
              <span className={styles.followIcon}><RefreshCw size={15}/></span>
              <span className={styles.followCopy}>
                <strong>{lead.name||lead.email||"Client discovery call"}</strong>
                <small>{lead.email||"No email on file"} · No-show recorded</small>
              </span>
              <div className={styles.followActions}>
                <Link prefetch={false} className="btn btn-sm" href={`/workspace/recruiter/crm/${lead.id}`}>Open</Link>
              </div>
            </div>
          ))}
        </div> : null}

        {clientWaits.length ? <div className={styles.followList}>
          <div className={styles.groupLabel}>Waiting on client</div>
          {clientWaits.slice(0,5).map((item)=>(
            <div className={styles.followRow} key={`wait-${item.action_type}-${item.subject_id}`}>
              <span className={styles.followIcon}><MessageSquare size={15}/></span>
              <span className={styles.followCopy}>
                <strong>{item.title || "Client decision pending"}</strong>
                <small>{item.description || "Shortlist feedback is still pending."}</small>
                <small>{ageLabel(item.age_hours)} waiting</small>
              </span>
              <div className={styles.followActions}>
                {item.subject_id ? <form action={sendClientShortlistFollowupAction}><input type="hidden" name="job_id" value={item.subject_id}/><input type="hidden" name="return_to" value="/workspace/recruiter/today"/><button className="btn btn-sm btn-primary" type="submit">Follow up</button></form> : null}
                {item.subject_id ? <Link prefetch={false} className="btn btn-sm" href={`/workspace/recruiter/roles/${item.subject_id}`}>Open</Link> : null}
              </div>
            </div>
          ))}
        </div> : null}

        {staleRolePreview.length ? <div className={styles.followList}>
          <div className={styles.groupLabel}>No recent movement</div>
          {staleRolePreview.map((role)=>{
            const lastStageAt = role.hiring_stage_entered_at || role.updated_at || role.created_at;
            return <Link prefetch={false} className={styles.followRow} href={`/workspace/recruiter/roles/${role.id}`} key={`stale-${role.id}`}>
              <span className={styles.followIcon}><BriefcaseBusiness size={15}/></span>
              <span className={styles.followCopy}>
                <strong>{role.title || "Client role"}</strong>
                <small>{role.company_name || "Client"} · {role.hiring_stage || role.status || "Open"}</small>
                <small>{stageAge(lastStageAt)}d in the same stage</small>
              </span>
              <ArrowRight size={15}/>
            </Link>;
          })}
          {staleRolesCount > staleRolePreview.length ? <Link prefetch={false} className={styles.moreLink} href="/workspace/recruiter/roles">+{staleRolesCount - staleRolePreview.length} more stale roles</Link> : null}
        </div> : null}

        {!noShows.length && !clientWaits.length && !staleRolePreview.length ? <div className="dashboard-caught-up"><CheckCircle2 size={22}/><div><strong>Role follow-through is clear.</strong><p>No client decisions are overdue and no owned role has been sitting in the same stage for 72+ hours.</p></div></div> : null}
      </section>
    </div>
  </div>;
}