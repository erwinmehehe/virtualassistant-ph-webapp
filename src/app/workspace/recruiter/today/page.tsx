import Link from "next/link";
import { Bell, CalendarDays, CheckCircle2, Clock3, ExternalLink, ListTodo, MessageSquare, UserRound } from "lucide-react";
import { requireRoleFast } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { RecruiterTemplateComposer } from "@/components/recruiter-template-composer";
import { completeRecruiterTaskAction, snoozeRecruiterTaskAction } from "@/app/actions/recruiter-ops";
import { sendClientShortlistFollowupAction } from "@/app/actions/client-shortlist";
import styles from "./today.module.css";

const PRIORITY_CLASS: Record<string,string> = { urgent:"badge-warning", high:"badge-warning", normal:"", low:"" };

function manilaTime(value?: string | null) {
  if (!value) return "No due time";
  return new Intl.DateTimeFormat("en-PH", { dateStyle:"medium", timeStyle:"short", timeZone:"Asia/Manila" }).format(new Date(value));
}

function exactActionHref(item:any) {
  const meta=item?.metadata||{};
  const email=String(meta.email||"").trim();
  if(["lead_first_contact","lead_followup"].includes(String(item.kind))&&email) return `/workspace/recruiter/leads?view=attention&q=${encodeURIComponent(email)}`;
  if(item.kind==="discovery"&&email) return `/workspace/recruiter/leads?view=discovery&q=${encodeURIComponent(email)}`;
  if(["placement_checkin","placement_risk","placement_handoff"].includes(String(item.kind))&&item.href) return item.href;
  if(meta.subject_type==="job"&&meta.subject_id) return `/workspace/recruiter/roles/${meta.subject_id}`;
  if(meta.subject_type==="va"&&meta.subject_id) return `/workspace/recruiter/candidates/${meta.subject_id}`;
  if(["role_review","role_without_shortlist","role_needs_terms","client_terms_waiting","client_account_missing","client_shortlist_waiting","all_candidates_passed","client_response_overdue","interview_today","interview_feedback_missing","offer_waiting_va","offer_waiting_client"].includes(String(item.kind))&&item.id) return `/workspace/recruiter/roles/${item.id}`;
  if(item.kind==="candidate_capacity_conflict"&&item.id) return `/workspace/recruiter/candidates/${item.id}`;
  return item.href||null;
}

function actionLabel(item:any) {
  if(["lead_first_contact","lead_followup"].includes(String(item.kind))) return "View lead";
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

export default async function RecruiterTodayPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}) {
  const params = await searchParams;
  const { userId } = await requireRoleFast("recruiter");
  const admin = createAdminClient();
  const [{ data, error }, { count: unreadNotifications }, { count: openTasks }] = await Promise.all([
    admin.rpc("recruiter_today_queue", { p_user_id:userId, p_limit:20 }),
    admin.from("notifications").select("id",{count:"exact",head:true}).eq("user_id",userId).is("read_at",null).is("done_at",null).or(`snoozed_until.is.null,snoozed_until.lte.${new Date().toISOString()}`),
    admin.from("recruiter_tasks").select("id",{count:"exact",head:true}).eq("assignee_id",userId).eq("status","todo")
  ]);
  if (error) throw error;
  const queue = Array.isArray(data) ? data as any[] : [];

  return <div className="dash-page">
    {params.contact_sent ? <div className="success-banner">Email sent and the next follow-up was scheduled.</div> : null}
    {params.contact_error ? <div className="alert" role="alert">{params.contact_error}</div> : null}
    {params.followup_sent ? <div className="success-banner">Client shortlist follow-up sent.</div> : null}
    {params.followup_error ? <div className="alert" role="alert">{params.followup_error}</div> : null}
    <div className="dash-header">
      <div><div className="dash-kicker">Agency daily workflow</div><h1>My Day</h1><p>Work the highest-priority Sales, Recruitment, and Client Success actions from top to bottom.</p><span className="dash-freshness">One owner · one next action · one due time</span></div>
      <div className="row wrap">
        <Link className="btn" href="/workspace/recruiter/agenda"><CalendarDays size={16}/> Agenda</Link>
        <Link className="btn" href="/workspace/recruiter/tasks"><ListTodo size={16}/> Tasks {openTasks ? `(${openTasks})` : ""}</Link>
        <Link className="btn" href="/workspace/recruiter/notifications"><Bell size={16}/> Inbox {unreadNotifications ? `(${unreadNotifications})` : ""}</Link>
      </div>
    </div>

    <section className={`card dashboard-section-card ${styles.queueCard}`}>
      <div className="dashboard-section-head"><div><h2>Today’s work queue</h2><p>Do the action here when possible. Otherwise, one click opens the exact lead, role, placement, interview, offer, or VA.</p></div><span className={`badge ${queue.length ? "badge-warning" : "badge-success"}`}>{queue.length} item{queue.length===1?"":"s"}</span></div>
      {queue.length ? <>
        {queue.length > 2 ? <div className={styles.scrollHint}>All {queue.length} items are below. Scroll this queue to review every item.</div> : null}
        <div className={`dash-actions ${styles.queue}`} tabIndex={0} aria-label={`Today's work queue, ${queue.length} items`}>
          {queue.map((item:any) => {
            const leadId = String(item.metadata?.lead_id || "");
            const firstName = String(item.metadata?.name || "").trim().split(/\s+/)[0] || null;
            const isLead = ["lead_first_contact","lead_followup"].includes(item.kind);
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
                  {isLead && leadId ? <RecruiterTemplateComposer leadId={leadId} firstName={firstName} defaultTemplateId={item.kind === "lead_first_contact" ? "first_response" : "proposal_followup"} returnTo="/workspace/recruiter/today"/> : null}
                  {isDiscovery && item.action_url ? <a className="btn btn-sm btn-primary" href={item.action_url} target="_blank" rel="noreferrer">Join Zoom <ExternalLink size={13}/></a> : null}
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
      </> : <div className="dashboard-caught-up"><CheckCircle2 size={22}/><div><strong>You’re caught up.</strong><p>No current agency work is waiting right now.</p></div><Link className="btn btn-sm" href="/workspace/recruiter/leads">Open CRM</Link></div>}
    </section>
  </div>;
}
