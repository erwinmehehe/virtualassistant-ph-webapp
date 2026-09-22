import Link from "next/link";
import { AlertTriangle, ArrowRight, Bell, BriefcaseBusiness, CalendarDays, CheckCircle2, Clock3, ExternalLink, ImageOff, ListTodo, MessageSquare, RefreshCw, ShieldCheck, UserRound, UserRoundCheck } from "lucide-react";
import { requireRoleFast } from "@/lib/auth";
import { PublicAvatar } from "@/components/public-avatar";
import { APPROVAL_MIN_COMPLETION } from "@/lib/public-visibility";
import { createAdminClient } from "@/lib/supabase/admin";
import { completeRecruiterTaskAction, snoozeRecruiterTaskAction } from "@/app/actions/recruiter-ops";
import { recruiterCleanupLeadAction } from "@/app/actions/recruiter-cleanup";
import { closeLeadAction } from "@/app/actions/close-lead";
import { sendClientShortlistFollowupAction } from "@/app/actions/client-shortlist";
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
  const [
    { data, error },
    { data:cleanupData, error:cleanupError },
    { count: unreadNotifications },
    { count: openTasks },
    { data: dailyActionData, error: dailyActionError },
    { data: approvalReadyData, count: approvalReadyCount, error: approvalReadyError },
    { count: missingPhotoCount, error: missingPhotoError },
    { data: activeRoleData, error: activeRoleError },
    { count: approvalCleanupCount, error: approvalCleanupError },
    { count: workSetupReadyCount, error: workSetupReadyError },
    { count: recentZeroCount, error: recentZeroError },
    { data: noShowData, error: noShowError }
  ] = await Promise.all([
    admin.rpc("recruiter_today_queue", { p_user_id:userId, p_limit:20 }),
    admin.rpc("recruiter_lead_cleanup_queue", { p_user_id:userId, p_limit:40 }),
    admin.from("notifications").select("id",{count:"exact",head:true}).eq("user_id",userId).is("read_at",null).is("done_at",null).or(`snoozed_until.is.null,snoozed_until.lte.${new Date().toISOString()}`),
    admin.from("recruiter_tasks").select("id",{count:"exact",head:true}).eq("assignee_id",userId).eq("status","todo"),
    admin.rpc("recruiter_daily_action_queue", { p_user_id:userId }),
    admin
      .from("recruiter_va_directory")
      .select("user_id,full_name,avatar_url,primary_category,completion_score,stage,availability_status",{count:"exact"})
      .eq("account_status","active")
      .gte("completion_score",APPROVAL_MIN_COMPLETION)
      .or("stage.is.null,and(stage.neq.approved,stage.neq.bench,stage.neq.rejected)")
      .order("completion_score",{ascending:false})
      .order("last_activity_at",{ascending:false,nullsFirst:false})
      .limit(5),
    admin
      .from("recruiter_va_directory")
      .select("user_id",{count:"exact",head:true})
      .eq("account_status","active")
      .gte("completion_score",APPROVAL_MIN_COMPLETION)
      .is("avatar_url",null)
      .or("stage.is.null,and(stage.neq.approved,stage.neq.bench,stage.neq.rejected)"),
    admin
      .from("jobs")
      .select("id,title,company_name,status,hiring_stage,hiring_stage_entered_at,updated_at,created_at")
      .eq("recruiter_id",userId)
      .in("status",["pending","published"])
      .order("updated_at",{ascending:true})
      .limit(100),
    admin
      .from("recruiter_va_directory")
      .select("user_id",{count:"exact",head:true})
      .eq("account_status","active")
      .in("stage",["approved","bench"])
      .lt("completion_score",APPROVAL_MIN_COMPLETION),
    admin
      .from("va_profiles")
      .select("user_id",{count:"exact",head:true})
      .not("work_setup_submitted_at","is",null)
      .is("work_setup_verified_at",null)
      .not("work_setup_computer","is",null)
      .not("work_setup_os","is",null)
      .not("work_setup_ram_gb","is",null)
      .not("primary_internet","is",null)
      .not("backup_internet","is",null)
      .not("backup_power","is",null)
      .eq("headset_ready",true)
      .eq("webcam_ready",true)
      .eq("quiet_workspace",true),
    admin
      .from("recruiter_va_directory")
      .select("user_id",{count:"exact",head:true})
      .eq("account_status","active")
      .eq("completion_score",0)
      .gte("account_created_at",new Date(Date.now()-7*86400000).toISOString()),
    admin
      .from("lead_intake")
      .select("id,name,email,discovery_outcome,owner_id,discovery_rescheduled_at")
      .eq("lead_type","client_hiring")
      .eq("discovery_outcome","no_show")
      .or(`owner_id.eq.${userId},owner_id.is.null`)
      .order("discovery_scheduled_at",{ascending:false})
      .limit(100)
  ]);
  if (error) throw error;
  if (cleanupError) throw cleanupError;
  if (dailyActionError) throw dailyActionError;
  if (approvalReadyError) throw approvalReadyError;
  if (missingPhotoError) throw missingPhotoError;
  if (activeRoleError) throw activeRoleError;
  if (approvalCleanupError) throw approvalCleanupError;
  if (workSetupReadyError) throw workSetupReadyError;
  if (recentZeroError) throw recentZeroError;
  if (noShowError) throw noShowError;

  const nonLeadQueue = (Array.isArray(data) ? data as any[] : []).filter((item:any)=>!LEAD_QUEUE_KINDS.has(String(item.kind)));
  const queue = nonLeadQueue.filter((item:any)=>!FOLLOW_THROUGH_KINDS.has(String(item.kind)));
  const cleanupQueue = Array.isArray(cleanupData) ? cleanupData as any[] : [];
  const dailyActions = (Array.isArray(dailyActionData) ? dailyActionData : []) as DailyActionRow[];
  const clientWaitByJob = new Map<string,DailyActionRow>();
  for (const item of dailyActions) {
    if (!["client_shortlist_waiting","client_response_overdue"].includes(String(item.action_type)) || !item.subject_id) continue;
    const current = clientWaitByJob.get(item.subject_id);
    if (!current || item.action_type === "client_response_overdue") clientWaitByJob.set(item.subject_id,item);
  }
  const clientWaits = [...clientWaitByJob.values()].sort((a,b)=>Number(b.age_hours || 0)-Number(a.age_hours || 0));
  const approvalReady = (Array.isArray(approvalReadyData) ? approvalReadyData : []) as ApprovalReadyVa[];
  const waitingJobIds = new Set(clientWaits.map((item)=>String(item.subject_id || "")).filter(Boolean));
  const staleRoleCutoff = Date.now() - 72 * 60 * 60 * 1000;
  const staleRoles = ((Array.isArray(activeRoleData) ? activeRoleData : []) as ActiveRoleRow[])
    .filter((role)=>{
      if (waitingJobIds.has(role.id)) return false;
      const activityAt = role.hiring_stage_entered_at || role.updated_at || role.created_at;
      return new Date(activityAt).getTime() <= staleRoleCutoff;
    })
    .sort((a,b)=>new Date(a.hiring_stage_entered_at || a.updated_at || a.created_at).getTime()-new Date(b.hiring_stage_entered_at || b.updated_at || b.created_at).getTime());
  const staleRolePreview = staleRoles.slice(0,5);
  const noShows = Array.isArray(noShowData) ? noShowData as {id:string}[] : [];
  const noShowKeys = noShows.map((lead)=>`discovery-no-show-rebook-${lead.id}`);
  const { data: noShowEmailEvents, error: noShowEmailError } = noShowKeys.length
    ? await admin.from("outbound_email_events")
        .select("idempotency_key,status")
        .eq("event_type","discovery_no_show_rebook")
        .eq("status","sent")
        .in("idempotency_key",noShowKeys)
    : { data: [], error: null };
  if (noShowEmailError) throw noShowEmailError;
  const rebookSentIds = new Set((noShowEmailEvents || []).map((row:any)=>String(row.idempotency_key||"").replace(/^discovery-no-show-rebook-/,"")));
  const noShowNeedsEmail = noShows.filter((lead)=>!rebookSentIds.has(lead.id)).length;
  const noShowWaitingRebook = noShows.filter((lead)=>rebookSentIds.has(lead.id)).length;

  const actionCount=(...types:string[])=>dailyActions.filter((item)=>types.includes(String(item.action_type))).length;
  const roleNoCandidates = actionCount("role_without_shortlist");
  const replacementNeeded = actionCount("all_candidates_passed");
  const clientResponseOverdue = actionCount("client_response_overdue");
  const interviewsDue = actionCount("interview_today","interview_feedback_missing");
  const offersWaiting = actionCount("offer_waiting_va","offer_waiting_client");

  const actionLanes = [
    {label:"Approval-ready",count:Number(approvalReadyCount||0),hint:"Recruiter decision",href:"/workspace/recruiter/talent?view=approval_ready&sort=completion",icon:<UserRoundCheck size={16}/>},
    {label:"Approval cleanup",count:Number(approvalCleanupCount||0),hint:"Approved below 60%",href:"/workspace/recruiter/talent?view=approval_cleanup&sort=completion",icon:<AlertTriangle size={16}/>},
    {label:"Work setup ready",count:Number(workSetupReadyCount||0),hint:"Ready to verify",href:"/workspace/recruiter/work-readiness?view=ready",icon:<ShieldCheck size={16}/>},
    {label:"0% profiles",count:Number(recentZeroCount||0),hint:"New VA rescue · 7d",href:"/workspace/recruiter/talent?readiness=zero",icon:<UserRound size={16}/>},
    {label:"No-show email",count:noShowNeedsEmail,hint:"Rebooking email not sent",href:"/workspace/recruiter/leads?view=discovery",icon:<MessageSquare size={16}/>},
    {label:"Waiting to rebook",count:noShowWaitingRebook,hint:"Email sent, no new time",href:"/workspace/recruiter/leads?view=discovery",icon:<RefreshCw size={16}/>},
    {label:"Roles need candidates",count:roleNoCandidates,hint:"No usable shortlist",href:"/workspace/recruiter/roles?view=needs_candidates&sort=urgent",icon:<BriefcaseBusiness size={16}/>},
    {label:"Client response overdue",count:clientResponseOverdue,hint:"Shortlist decision late",href:"/workspace/recruiter/roles?view=waiting_client&sort=oldest",icon:<Clock3 size={16}/>},
    {label:"Interview action",count:interviewsDue,hint:"Today or feedback due",href:"/workspace/recruiter/roles?view=interviewing&sort=urgent",icon:<CalendarDays size={16}/>},
    {label:"Offers waiting",count:offersWaiting,hint:"VA or client decision",href:"/workspace/recruiter/roles?view=ready_offer&sort=urgent",icon:<CheckCircle2 size={16}/>},
    {label:"Need replacements",count:replacementNeeded,hint:"All released VAs passed",href:"/workspace/recruiter/roles?view=replacement&sort=urgent",icon:<RefreshCw size={16}/>},
    {label:"Stale roles",count:staleRoles.length,hint:"72h+ no movement",href:"/workspace/recruiter/roles?view=stale&sort=oldest",icon:<Clock3 size={16}/>}
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
    <div className="dash-header">
      <div><div className="dash-kicker">Agency daily workflow</div><h1>My Day</h1><p>This is the recruiter operating screen. Clear non-zero action lanes first, then work the detailed queue below.</p><span className="dash-freshness">One owner · one next action · one due time</span></div>
      <div className="row wrap">
        <Link className="btn" href="/workspace/recruiter/agenda"><CalendarDays size={16}/> Agenda</Link>
        <Link className="btn" href="/workspace/recruiter/tasks"><ListTodo size={16}/> Tasks {openTasks ? `(${openTasks})` : ""}</Link>
        <Link className="btn" href="/workspace/recruiter/notifications"><Bell size={16}/> Inbox {unreadNotifications ? `(${unreadNotifications})` : ""}</Link>
      </div>
    </div>

    <div className={styles.priorityStrip} aria-label="Recruiter today summary">
      <Link className={styles.priorityItem} href="/workspace/recruiter/today#sales-cleanup"><span>Sales cleanup</span><strong>{cleanupQueue.length}</strong><small>{cleanupQueue.length ? "Client leads need action" : "Clear"}</small></Link>
      <Link className={styles.priorityItem} href="/workspace/recruiter/today#action-lanes"><span>Talent actions</span><strong>{Number(approvalReadyCount||0)+Number(approvalCleanupCount||0)+Number(workSetupReadyCount||0)+Number(recentZeroCount||0)}</strong><small>Approval, setup, onboarding</small></Link>
      <Link className={styles.priorityItem} href="/workspace/recruiter/today#action-lanes"><span>Client follow-through</span><strong>{clientWaits.length+noShowNeedsEmail+noShowWaitingRebook}</strong><small>Shortlists and rebooking</small></Link>
      <Link className={styles.priorityItem} href="/workspace/recruiter/today#action-lanes"><span>Role delivery</span><strong>{roleNoCandidates+replacementNeeded+interviewsDue+offersWaiting+staleRoles.length}</strong><small>Roles that need movement</small></Link>
    </div>

    <section id="action-lanes" className={`card dashboard-section-card ${styles.actionLanesCard}`}>
      <div className="dashboard-section-head"><div><h2>Action lanes</h2><p>Every recurring recruiter queue in one place. Start with non-zero lanes and work left to right.</p></div><span className="badge">{actionLanes.reduce((sum,lane)=>sum+lane.count,0)} open signals</span></div>
      <div className={styles.actionLaneGrid}>
        {actionLanes.map((lane)=><Link className={`${styles.actionLane} ${lane.count ? styles.actionLaneOpen : styles.actionLaneClear}`} href={lane.href} key={lane.label}>
          <span className={styles.actionLaneIcon}>{lane.icon}</span>
          <span className={styles.actionLaneCopy}><strong>{lane.label}</strong><small>{lane.hint}</small></span>
          <b>{lane.count}</b>
        </Link>)}
      </div>
    </section>

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
                  <Link className="btn btn-sm" href={cleanupLeadHref(item)}>Open lead</Link>
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
      </> : <div className="dashboard-caught-up"><CheckCircle2 size={22}/><div><strong>Sales pipeline is clean.</strong><p>No active client-hiring lead currently needs cleanup.</p></div><Link className="btn btn-sm" href="/workspace/recruiter/leads">Open CRM</Link></div>}
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
                  {actionHref ? <Link className="btn btn-sm" href={actionHref}>{actionLabel(item)}</Link> : null}
                  {isTask ? <>
                    <form action={completeRecruiterTaskAction}><input type="hidden" name="task_id" value={item.id}/><input type="hidden" name="return_to" value="/workspace/recruiter/today"/><button className="btn btn-sm btn-primary" type="submit"><CheckCircle2 size={13}/> Done</button></form>
                    <form action={snoozeRecruiterTaskAction}><input type="hidden" name="task_id" value={item.id}/><input type="hidden" name="minutes" value="1440"/><button className="btn btn-sm" type="submit">Snooze 1 day</button></form>
                  </> : null}
                </div>
              </span>
            </article>;
          })}
        </div>
      </> : <div className="dashboard-caught-up"><CheckCircle2 size={22}/><div><strong>You’re caught up.</strong><p>No current Recruitment or Client Success work is waiting right now.</p></div><Link className="btn btn-sm" href="/workspace/recruiter/roles">Open roles</Link></div>}
    </section>

    <div className={styles.operationsGrid}>
      <section className="card dashboard-section-card">
        <div className="dashboard-section-head">
          <div><h2>Talent operations</h2><p>Profiles that are far enough along for a recruiter decision.</p></div>
          <Link className="btn btn-sm" href="/workspace/recruiter/talent?readiness=approval_ready">Open talent <ArrowRight size={13}/></Link>
        </div>

        <div className={styles.signalRow}>
          <Link href="/workspace/recruiter/talent?readiness=approval_ready"><UserRoundCheck size={16}/><span><strong>{Number(approvalReadyCount || 0)}</strong> approval-ready</span></Link>
          <Link href="/workspace/recruiter/talent?readiness=approval_ready&photo=no"><ImageOff size={16}/><span><strong>{Number(missingPhotoCount || 0)}</strong> need a photo</span></Link>
        </div>

        {approvalReady.length ? <div className={styles.compactPeople}>
          {approvalReady.map((va)=>(
            <Link className={styles.personRow} href={`/workspace/recruiter/candidates/${va.user_id}`} key={va.user_id}>
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
          <Link className="btn btn-sm" href="/workspace/recruiter/roles">Open roles <ArrowRight size={13}/></Link>
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
                {item.subject_id ? <Link className="btn btn-sm" href={`/workspace/recruiter/roles/${item.subject_id}`}>Open</Link> : null}
              </div>
            </div>
          ))}
        </div> : null}

        {staleRolePreview.length ? <div className={styles.followList}>
          <div className={styles.groupLabel}>No recent movement</div>
          {staleRolePreview.map((role)=>{
            const lastStageAt = role.hiring_stage_entered_at || role.updated_at || role.created_at;
            return <Link className={styles.followRow} href={`/workspace/recruiter/roles/${role.id}`} key={`stale-${role.id}`}>
              <span className={styles.followIcon}><BriefcaseBusiness size={15}/></span>
              <span className={styles.followCopy}>
                <strong>{role.title || "Client role"}</strong>
                <small>{role.company_name || "Client"} · {role.hiring_stage || role.status || "Open"}</small>
                <small>{stageAge(lastStageAt)}d in the same stage</small>
              </span>
              <ArrowRight size={15}/>
            </Link>;
          })}
          {staleRoles.length > staleRolePreview.length ? <Link className={styles.moreLink} href="/workspace/recruiter/roles">+{staleRoles.length - staleRolePreview.length} more stale roles</Link> : null}
        </div> : null}

        {!clientWaits.length && !staleRolePreview.length ? <div className="dashboard-caught-up"><CheckCircle2 size={22}/><div><strong>Role follow-through is clear.</strong><p>No client decisions are overdue and no owned role has been sitting in the same stage for 72+ hours.</p></div></div> : null}
      </section>
    </div>
  </div>;
}