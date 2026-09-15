import Link from "next/link";
import { Bell, CalendarDays, CheckCircle2, Clock3, ExternalLink, ListTodo } from "lucide-react";
import { requireRoleFast } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { RecruiterTemplateComposer } from "@/components/recruiter-template-composer";
import { completeRecruiterTaskAction, snoozeRecruiterTaskAction } from "@/app/actions/recruiter-ops";
import styles from "./today.module.css";

const PRIORITY_CLASS: Record<string,string> = { urgent:"badge-warning", high:"badge-warning", normal:"", low:"" };

function manilaTime(value?: string | null) {
  if (!value) return "No due time";
  return new Intl.DateTimeFormat("en-PH", { dateStyle:"medium", timeStyle:"short", timeZone:"Asia/Manila" }).format(new Date(value));
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
    <div className="dash-header">
      <div><div className="dash-kicker">Recruiter daily workflow</div><h1>My Day</h1><p>Work the highest-priority client and hiring actions from top to bottom.</p><span className="dash-freshness">Live queue · only current work is loaded</span></div>
      <div className="row wrap">
        <Link className="btn" href="/workspace/recruiter/agenda"><CalendarDays size={16}/> Agenda</Link>
        <Link className="btn" href="/workspace/recruiter/tasks"><ListTodo size={16}/> Tasks {openTasks ? `(${openTasks})` : ""}</Link>
        <Link className="btn" href="/workspace/recruiter/notifications"><Bell size={16}/> Inbox {unreadNotifications ? `(${unreadNotifications})` : ""}</Link>
      </div>
    </div>

    <section className={`card dashboard-section-card ${styles.queueCard}`}>
      <div className="dashboard-section-head"><div><h2>Today’s work queue</h2><p>Finish an item, return here, and the next priority moves up automatically.</p></div><span className={`badge ${queue.length ? "badge-warning" : "badge-success"}`}>{queue.length} item{queue.length===1?"":"s"}</span></div>
      {queue.length ? <>
        {queue.length > 2 ? <div className={styles.scrollHint}>All {queue.length} items are below. Scroll this queue to review every item.</div> : null}
        <div className={`dash-actions ${styles.queue}`} tabIndex={0} aria-label={`Today's work queue, ${queue.length} items`}>
          {queue.map((item:any) => {
            const leadId = String(item.metadata?.lead_id || "");
            const firstName = String(item.metadata?.name || "").trim().split(/\s+/)[0] || null;
            const isLead = ["lead_first_contact","lead_followup"].includes(item.kind);
            const isDiscovery = item.kind === "discovery";
            const isTask = item.kind === "task";
            return <article className="dash-action" key={`${item.kind}-${item.id}`}>
              <span className="dash-action-count"><Clock3 size={16}/></span>
              <span className="dash-action-copy">
                <span className="dash-action-title"><strong>{item.title}</strong><span className={`badge ${PRIORITY_CLASS[item.priority] || ""}`}>{item.priority}</span></span>
                <small>{item.subtitle}</small>
                <small className="muted">{manilaTime(item.due_at)} · Manila</small>
                <div className="row wrap" style={{marginTop:8}}>
                  {isLead && leadId ? <RecruiterTemplateComposer leadId={leadId} firstName={firstName} defaultTemplateId={item.kind === "lead_first_contact" ? "first_response" : "proposal_followup"} returnTo="/workspace/recruiter/today"/> : null}
                  {isDiscovery && item.action_url ? <a className="btn btn-sm btn-primary" href={item.action_url} target="_blank" rel="noreferrer">Join Zoom <ExternalLink size={13}/></a> : null}
                  {item.href ? <Link className="btn btn-sm" href={item.href}>{isDiscovery ? "View brief" : isTask ? "Open" : "Review"}</Link> : null}
                  {isTask ? <>
                    <form action={completeRecruiterTaskAction}><input type="hidden" name="task_id" value={item.id}/><input type="hidden" name="return_to" value="/workspace/recruiter/today"/><button className="btn btn-sm btn-primary" type="submit"><CheckCircle2 size={13}/> Done</button></form>
                    <form action={snoozeRecruiterTaskAction}><input type="hidden" name="task_id" value={item.id}/><input type="hidden" name="minutes" value="1440"/><button className="btn btn-sm" type="submit">Snooze 1 day</button></form>
                  </> : null}
                </div>
              </span>
            </article>;
          })}
        </div>
      </> : <div className="dashboard-caught-up"><CheckCircle2 size={22}/><div><strong>You’re caught up.</strong><p>No urgent recruiter work is waiting right now.</p></div><Link className="btn btn-sm" href="/workspace/recruiter/leads">Open CRM</Link></div>}
    </section>
  </div>;
}
