import Link from "next/link";
import { Bell, CalendarDays, CheckCircle2, Clock3, ExternalLink, ListTodo, MessageSquare, UserRound } from "lucide-react";
import { requireRoleFast } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { completeRecruiterTaskAction, snoozeRecruiterTaskAction } from "@/app/actions/recruiter-ops";
import { recruiterCleanupLeadAction } from "@/app/actions/recruiter-cleanup";
import { closeLeadAction } from "@/app/actions/close-lead";
import { sendClientShortlistFollowupAction } from "@/app/actions/client-shortlist";
import styles from "./today.module.css";

const PRIORITY_CLASS: Record<string,string> = { urgent:"badge-warning", high:"badge-warning", normal:"", low:"" };
const LEAD_QUEUE_KINDS = new Set(["lead_first_contact", "lead_followup"]);

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
  const [{ data, error }, { data:cleanupData, error:cleanupError }, { count: unreadNotifications }, { count: openTasks }] = await Promise.all([
    admin.rpc("recruiter_today_queue", { p_user_id:userId, p_limit:20 }),
    admin.rpc("recruiter_lead_cleanup_queue", { p_user_id:userId, p_limit:40 }),
    admin.from("notifications").select("id",{count:"exact",head:true}).eq("user_id",userId).is("read_at",null).is("done_at",null).or(`snoozed_until.is.null,snoozed_until.lte.${new Date().toISOString()}`),
    admin.from("recruiter_tasks").select("id",{count:"exact",head:true}).eq("assignee_id",userId).eq("status","todo")
  ]);
  if (error) throw error;
  if (cleanupError) throw cleanupError;
  const queue = (Array.isArray(data) ? data as any[] : []).filter((item:any)=>!LEAD_QUEUE_KINDS.has(String(item.kind)));
  const cleanupQueue = Array.isArray(cleanupData) ? cleanupData as any[] : [];

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
      <div><div className="dash-kicker">Agency daily workflow</div><h1>My Day</h1><p>Clear neglected leads first, then work the highest-priority Recruitment and Client Success actions.</p><span className="dash-freshness">One owner · one next action · one due time</span></div>
      <div className="row wrap">
        <Link className="btn" href="/workspace/recruiter/agenda"><CalendarDays size={16}/> Agenda</Link>
        <Link className="btn" href="/workspace/recruiter/tasks"><ListTodo size={16}/> Tasks {openTasks ? `(${openTasks})` : ""}</Link>
        <Link className="btn" href="/workspace/recruiter/notifications"><Bell size={16}/> Inbox {unreadNotifications ? `(${unreadNotifications})` : ""}</Link>
      </div>
    </div>

    <section className={`card dashboard-section-card ${styles.queueCard}`}>
      <div className="dashboard-section-head"><div><h2>Sales cleanup</h2><p>Missed responses, overdue follow-ups, leads without a next step, stale leads, and records ready for a close decision.</p></div><span className={`badge ${cleanupQueue.length ? "badge-warning" : "badge-success"}`}>{cleanupQueue.length} to clean up</span></div>
      {cleanupQueue.length ? <>
        {cleanupQueue.length > 3 ? <div className={styles.scrollHint}>Resolve the oldest and highest-risk items first. Closed leads leave this queue automatically.</div> : null}
        <div className={`dash-actions ${styles.queue}`} tabIndex={0} aria-label={`Sales cleanup queue, ${cleanupQueue.length} leads`}>
          {cleanupQueue.map((item:any)=>{
            const labels=Array.isArray(item.cleanup_labels)?item.cleanup_labels:[];
            const attempts=Number(item.contact_count||0);
            return <article className="dash-action" key={`cleanup-${item.id}`}>
              <span className="dash-action-count"><Clock3 size={16}/></span>
              <span className="dash-action-copy">
                <span className="dash-action-title"><strong>{item.company||item.name||item.email||"Client lead"}</strong><span className="badge badge-warning">{item.primary_reason||"Needs cleanup"}</span></span>
                <small>{[item.name,item.service,item.email].filter(Boolean).join(" · ")}</small>
                <div className="row wrap" style={{marginTop:6}}>{labels.map((label:string)=><span className={`badge ${["Missed first response","Follow-up overdue","Ready to close"].includes(label)?"badge-warning":""}`} key={label}>{label}</span>)}</div>
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
  </div>;
}