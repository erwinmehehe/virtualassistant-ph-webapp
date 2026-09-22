import Link from "next/link";
import { AlertTriangle, ArrowRight, Bell, BriefcaseBusiness, CalendarDays, CheckCircle2, Clock3, ExternalLink, ImageOff, ListTodo, MessageSquare, RefreshCw, ShieldCheck, UserRound, UserRoundCheck } from "lucide-react";
import { requireRoleFast } from "@/lib/auth";
import { PublicAvatar } from "@/components/public-avatar";
import { createAdminClient } from "@/lib/supabase/admin";
import { withServerTiming } from "@/lib/server-timing";
import { completeRecruiterTaskAction, snoozeRecruiterTaskAction } from "@/app/actions/recruiter-ops";
import { recruiterCleanupLeadAction } from "@/app/actions/recruiter-cleanup";
import { closeLeadAction } from "@/app/actions/close-lead";
import { sendClientShortlistFollowupAction } from "@/app/actions/client-shortlist";
import { sendDiscoveryNoShowRebookAction } from "@/app/actions/recruiter";
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

function overdueAge(value?: string | null) {
  if (!value) return null;
  const diff = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(diff) || diff <= 0) return null;
  const hours = Math.max(1, Math.floor(diff / 3600000));
  return hours < 24 ? `${hours}h` : `${Math.floor(hours / 24)}d`;
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
  const email=String(meta.email||"").trim();
  if(item.kind==="discovery"&&email) return `/workspace/recruiter/leads?view=discovery&q=${encodeURIComponent(email)}`;
  if(["placement_checkin","placement_risk","placement_handoff"].includes(String(item.kind))&&item.href) return item.href;
  if(meta.subject_type==="job"&&meta.subject_id) return `/workspace/recruiter/roles/${meta.subject_id}`;
  if(meta.subject_type==="va"&&meta.subject_id) return `/workspace/recruiter/candidates/${meta.subject_id}`;
  if(["role_review","role_without_shortlist","role_needs_terms","client_terms_waiting","client_account_missing","client_shortlist_waiting","all_candidates_passed","client_response_overdue","interview_today","interview_feedback_missing","offer_waiting_va","offer_waiting_client"].includes(String(item.kind))&&item.id) return `/workspace/recruiter/roles/${item.id}`;
  if(item.kind==="candidate_capacity_conflict"&&item.id) return `/workspace/recruiter/candidates/${item.id}`;
  return item.href||null;
}

function actionLabel(item:any) {
  if(item.kind==="discovery") return "View booking";
  if(item.kind==="all_candidates_passed") return "Find replacements";
  if(["client_shortlist_waiting","client_response_overdue"].includes(String(item.kind))) return "Open role";
  if(["interview_today","interview_feedback_missing"].includes(String(item.kind))) return "Open interview";
  if(["offer_waiting_va","offer_waiting_client"].includes(String(item.kind))) return "Open offer";
  if(item.kind==="placement_checkin") return "Complete check-in";
  if(item.kind==="placement_risk") return "Open placement";
  if(item.kind==="placement_handoff") return "Complete handoff";
  if(item.kind==="candidate_capacity_conflict") return "Review VA";
  if(item.kind==="task") return "Act now";
  return "Review role";
}

function cleanupLeadHref(item:any) {
  const email=String(item?.email||"").trim();
  return email ? `/workspace/recruiter/leads?view=attention&q=${encodeURIComponent(email)}` : "/workspace/recruiter/leads?view=attention";
}

export default async function RecruiterTodayPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}) {
  const params = await searchParams;
  const { userId } = await requireRoleFast("recruiter");
  const admin = createAdminClient();
  const { data: summaryData, error: summaryError } = await withServerTiming("recruiter.today_summary", () => admin.rpc("recruiter_today_summary", { p_user_id:userId }));
  if (summaryError) throw summaryError;

  const summary = (summaryData || {}) as Record<string,any>;
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
  const noShowNeedsEmail = Number(summary.no_show_needs_email || 0);
  const noShowWaitingRebook = Number(summary.no_show_waiting_rebook || 0);
  const noShows = (Array.isArray(summary.no_show_preview) ? summary.no_show_preview : []) as Array<{id:string;name?:string|null;email?:string|null;sent?:boolean}>;
  const rebookSentIds = new Set(noShows.filter((lead)=>lead.sent).map((lead)=>lead.id));
  const roleNoCandidates = Number(summary.role_no_candidates || 0);
  const replacementNeeded = Number(summary.replacement_needed || 0);
  const clientResponseOverdue = Number(summary.client_response_overdue || 0);
  const interviewsDue = Number(summary.interviews_due || 0);
  const offersWaiting = Number(summary.offers_waiting || 0);

  const actionLanes = [
    {label:"Approval-ready",count:approvalReadyCount,hint:"Recruiter decision",href:"/workspace/recruiter/talent?view=approval_ready&sort=completion",icon:<UserRoundCheck size={16}/>},
    {label:"Approval cleanup",count:approvalCleanupCount,hint:"Approved below 60%",href:"/workspace/recruiter/talent?view=approval_cleanup&sort=completion",icon:<AlertTriangle size={16}/>},
    {label:"Work setup ready",count:workSetupReadyCount,hint:"Ready to verify",href:"/workspace/recruiter/work-readiness?view=ready",icon:<ShieldCheck size={16}/>},
    {label:"0% profiles",count:recentZeroCount,hint:"New VA rescue · 7d",href:"/workspace/recruiter/talent?readiness=zero",icon:<UserRound size={16}/>},
    {label:"No-show email",count:noShowNeedsEmail,hint:"Rebooking email not sent",href:"/workspace/recruiter/leads?view=discovery",icon:<MessageSquare size={16}/>},
    {label:"Waiting to rebook",count:noShowWaitingRebook,hint:"Email sent, no new time",href:"/workspace/recruiter/leads?view=discovery",icon:<RefreshCw size={16}/>},
    {label:"Roles need candidates",count:roleNoCandidates,hint:"No usable shortlist",href:"/workspace/recruiter/roles?view=needs_candidates&sort=urgent",icon:<BriefcaseBusiness size={16}/>},
    {label:"Client response overdue",count:clientResponseOverdue,hint:"Shortlist decision late",href:"/workspace/recruiter/roles?view=waiting_client&sort=oldest",icon:<Clock3 size={16}/>},
    {label:"Interview action",count:interviewsDue,hint:"Today or feedback due",href:"/workspace/recruiter/roles?view=interviewing&sort=urgent",icon:<CalendarDays size={16}/>},
    {label:"Offers waiting",count:offersWaiting,hint:"VA or client decision",href:"/workspace/recruiter/roles?view=ready_offer&sort=urgent",icon:<CheckCircle2 size={16}/>},
    {label:"Need replacements",count:replacementNeeded,hint:"All released VAs passed",href:"/workspace/recruiter/roles?view=replacement&sort=urgent",icon:<RefreshCw size={16}/>},
    {label:"Stale roles",count:staleRolesCount,hint:"72h+ no movement",href:"/workspace/recruiter/roles?view=stale&sort=oldest",icon:<Clock3 size={16}/>}
  ];

  return <div className="dash-page">
    {params.contact_sent ? <div className="success-banner">Email sent and the next follow-up was scheduled.</div> : null}
    {params.contact_error ? <div className="alert" role="alert">{params.contact_error}</div> : null}
    {params.cleanup_saved ? <div className="success-banner">Lead updated. The cleanup queue has been refreshed.</div> : null}
    {params.cleanup_error ? <div className="alert" role="alert">{params.cleanup_error}</div> : null}
    {params.lead_closed ? <div className="success-banner">Lead closed and removed from the active cleanup queue.</div> : null}
    {params.crm_error ? <div className="alert" role="alert">{params.crm_error}</div> : null}
    {params.role_close_warning ? <div className="alert" role="alert">The lead closed, but its linked role could not be closed automatically. Review the role before continuing.</div> : null}
    {params.followup_sent ? <div className="success-banner">Client shortlist follow-up sent.</div> : null}
    {params.followup_error ? <div className="alert" role="alert">{params.followup_error}</div> : null}
    {params.rebook_email_sent ? <div className="success-banner">Rebooking link sent to the client.</div> : null}
    {params.rebook_email_already_sent ? <div className="info-banner">A rebooking link was already sent. No duplicate email was sent.</div> : null}
    {params.rebook_email_error ? <div className="alert" role="alert">{params.rebook_email_error}</div> : null}
    <div className="dash-header">
      <div><div className="dash-kicker">Agency daily workflow</div><h1>My Day</h1><p>This is the recruiter operating screen. Clear non-zero action lanes first, then work the detailed queue below.</p><span className="dash-freshness">One owner · one next action · one due time</span></div>
      <div className="row wrap">
        <Link prefetch={false} className="btn" href="/workspace/recruiter/agenda"><CalendarDays size={16}/> Agenda</Link>
        <Link prefetch={false} className="btn" href="/workspace/recruiter/tasks"><ListTodo size={16}/> Tasks {openTasks ? `(${openTasks})` : ""}</Link>
        <Link prefetch={false} className="btn" href="/workspace/recruiter/notifications"><Bell size={16}/> Inbox {unreadNotifications ? `(${unreadNotifications})` : ""}</Link>
      </div>
    </div>

    <div className={styles.priorityStrip} aria-label="Recruiter today summary">
      <Link prefetch={false} className={styles.priorityItem} href="/workspace/recruiter/today#sales-cleanup"><span>Sales cleanup</span><strong>{cleanupQueue.length}</strong><small>{cleanupQueue.length ? "Client leads need action" : "Clear"}</small></Link>
      <Link prefetch={false} className={styles.priorityItem} href="/workspace/recruiter/today#action-lanes"><span>Talent actions</span><strong>{Number(approvalReadyCount||0)+Number(approvalCleanupCount||0)+Number(workSetupReadyCount||0)+Number(recentZeroCount||0)}</strong><small>Approval, setup, onboarding</small></Link>
      <Link prefetch={false} className={styles.priorityItem} href="/workspace/recruiter/today#action-lanes"><span>Client follow-through</span><strong>{clientWaits.length+noShowNeedsEmail+noShowWaitingRebook}</strong><small>Shortlists and rebooking</small></Link>
      <Link prefetch={false} className={styles.priorityItem} href="/workspace/recruiter/today#action-lanes"><span>Role delivery</span><strong>{roleNoCandidates+replacementNeeded+interviewsDue+offersWaiting+staleRolesCount}</strong><small>Roles that need movement</small></Link>
    </div>

    <section id="action-lanes" className={`card dashboard-section-card ${styles.actionLanesCard}`}>
      <div className="dashboard-section-head"><div><h2>Action lanes</h2><p>Every recurring recruiter queue in one place. Start with non-zero lanes and work left to right.</p></div><span className="badge">{actionLanes.reduce((sum,lane)=>sum+lane.count,0)} open signals</span></div>
      <div className={styles.actionLaneGrid}>
        {actionLanes.map((lane)=><Link prefetch={false} className={`${styles.actionLane} ${lane.count ? styles.actionLaneOpen : styles.actionLaneClear}`} href={lane.href} key={lane.label}>
          <span className={styles.actionLaneIcon}>{lane.icon}</span>
          <span className={styles.actionLaneCopy}><strong>{lane.label}</strong><small>{lane.hint}</small></span>
          <b>{lane.count}</b>
        </Link>)}
      </div>
    </section>

    {noShows.length?<section id="call-rebooking" className={`card dashboard-section-card ${styles.queueCard}`}>
      <div className="dashboard-section-head">
        <div><h2>Call rebooking</h2><p>Clients who missed a discovery call stay here until they choose another time.</p></div>
        <span className={`badge ${noShowNeedsEmail?"badge-warning":""}`}>{noShows.length} waiting</span>
      </div>
      <div className={styles.followList}>
        {noShows.slice(0,8).map((lead)=>{
          const sent=rebookSentIds.has(lead.id);
          return <div className={styles.followRow} key={`rebook-${lead.id}`}>
            <span className={styles.followIcon}><RefreshCw size={15}/></span>
            <span className={styles.followCopy}>
              <strong>{lead.name||lead.email||"Client discovery call"}</strong>
              <small>{lead.email||"No email on file"}</small>
              <small>{sent?"Rebooking link sent. Waiting for the client to choose a new time.":"No-show recorded. Send the client a secure link to choose another time."}</small>
            </span>
            <div className={styles.followActions}>
              {!sent?<form action={sendDiscoveryNoShowRebookAction}>
                <input type="hidden" name="lead_id" value={lead.id}/>
                <input type="hidden" name="return_to" value="/workspace/recruiter/today"/>
                <button className="btn btn-sm btn-primary" type="submit"><MessageSquare size={13}/> Send rebooking link</button>
              </form>:<span className="badge badge-success">Link sent</span>}
              <Link prefetch={false} className="btn btn-sm" href={lead.email?`/workspace/recruiter/leads?view=discovery&q=${encodeURIComponent(lead.email)}`:"/workspace/recruiter/leads?view=discovery"}>Open lead</Link>
            </div>
          </div>;
        })}
      </div>
      {noShows.length>8?<Link prefetch={false} className={styles.moreLink} href="/workspace/recruiter/leads?view=discovery">+{noShows.length-8} more no-show clients</Link>:null}
    </section>:null}

    <section id="sales-cleanup" className={`card dashboard-section-card ${styles.queueCard}`}>
      <div className="dashboard-section-head"><div><h2>Sales cleanup</h2><p>Missed responses, overdue follow-ups, leads without a next step, stale leads, and records ready for a close decision.</p></div><span className={`badge ${cleanupQueue.length ? "badge-warning" : "badge-success"}`}>{cleanupQueue.length} to clean up</span></div>
      {cleanupQueue.length ? <>
        {cleanupQueue.length > 3 ? <div className={styles.scrollHint}>Resolve the oldest and highest-risk items first. Closed leads leave this queue automatically.</div> : null}
        <div className={`dash-actions ${styles.queue}`} tabIndex={0} aria-label={`Sales cleanup queue, ${cleanupQueue.length} leads`}>
          {cleanupQueue.map((item:any)=>{
            const labels=Array.isArray(item.cleanup_labels)?item.cleanup_labels:[];
            const attempts=Number(item.contact_count||0);
            const overdue=overdueAge(item.due_at);
            const overdueCopy=overdue ? (String(item.primary_reason||"").startsWith("Stale") || item.primary_reason === "No next step" ? `${overdue} stale` : `${overdue} overdue`) : null;
            return <article className="dash-action" key={`cleanup-${item.id}`}>
              <span className="dash-action-count"><Clock3 size={16}/></span>
              <span className="dash-action-copy">
                <span className="dash-action-title"><strong>{item.company||item.name||item.email||"Client lead"}</strong><span className="badge badge-warning">{item.primary_reason||"Needs cleanup"}</span></span>
                <small>{[item.name,item.service,item.email].filter(Boolean).join(" · ")}</small>
                <div className="row wrap" style={{marginTop:6}}>{labels.map((label:string)=><span className={`badge ${["Missed first response","Follow-up overdue","Ready to close"].includes(label)?"badge-warning":""}`} key={label}>{label}</span>)}{overdueCopy ? <span className="badge badge-warning days-overdue">{overdueCopy}</span> : null}</div>
                <small className="muted">Last activity {manilaTime(item.last_touch_at)} · {attempts} recorded contact attempt{attempts===1?"":"s"}</small>
                {item.next_follow_up_at ? <small className="muted">Current follow-up: {manilaTime(item.next_follow_up_at)}</small> : null}
                <div className="row wrap" style={{marginTop:8}}>
                  <form action={recruiterCleanupLeadAction}><input type="hidden" name="lead_id" value={item.id}/><input type="hidden" name="cleanup_action" value="send_followup"/><input type="hidden" name="return_to" value="/workspace/recruiter/today"/><button className="btn btn-sm btn-primary" type="submit"><MessageSquare size={13}/> Send follow-up</button></form>
                  <form action={recruiterCleanupLeadAction}><input type="hidden" name="lead_id" value={item.id}/><input type="hidden" name="cleanup_action" value="follow_up_later"/><input type="hidden" name="return_to" value="/workspace/recruiter/today"/><button className="btn btn-sm" type="submit">Follow up in 3 days</button></form>
                  <Link prefetch={false} className="btn btn-sm" href={cleanupLeadHref(item)}>Open lead</Link>
                </div>
                <div className="row wrap" style={{marginTop:6}}>
                  <span className="small muted">Close:</span>
                  <form action={closeLeadAction}><input type="hidden" name="lead_id" value={item.id}/><input type="hidden" name="reason" value="No response"/><input type="hidden" name="close_linked_role" value="1"/><input type="hidden" name="return_to" value="/workspace/recruiter/today"/><button className="btn btn-sm" type="submit">No response</button></form>
                  <form action={closeLeadAction}><input type="hidden" name="lead_id" value={item.id}/><input type="hidden" name="reason" value="Spam"/><input type="hidden" name="close_linked_role" value="1"/><input type="hidden" name="return_to" value="/workspace/recruiter/today"/><button className="btn btn-sm" type="submit">Spam</button></form>
                  <form action={closeLeadAction}><input type="hidden" name="lead_id" value={item.id}/><input type="hidden" name="reason" value="Not a fit"/><input type="hidden" name="close_linked_role" value="1"/><input type="hidden" name="return_to" value="/workspace/recruiter/today"/><button className="btn btn-sm" type="submit">Not a fit</button></form>
                </div>
              </span>
            </article>;
          })}
        </div>
      </> : <div className="dashboard-caught-up"><CheckCircle2 size={22}/><div><strong>Sales pipeline is clean.</strong><p>No active client-hiring lead currently needs cleanup.</p></div><Link prefetch={false} className="btn btn-sm" href="/workspace/recruiter/leads">Open CRM</Link></div>}
    </section>

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

        {!clientWaits.length && !staleRolePreview.length ? <div className="dashboard-caught-up"><CheckCircle2 size={22}/><div><strong>Role follow-through is clear.</strong><p>No client decisions are overdue and no owned role has been sitting in the same stage for 72+ hours.</p></div></div> : null}
      </section>
    </div>
  </div>;
}