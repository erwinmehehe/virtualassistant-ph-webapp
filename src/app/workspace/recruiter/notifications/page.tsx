import Link from "next/link";
import { Bell, CheckCircle2, Clock3 } from "lucide-react";
import { requireRoleFast } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { dateShort } from "@/lib/format";
import { completeRecruiterNotificationAction, markAllRecruiterNotificationsReadAction, markRecruiterNotificationReadAction, setRecruiterNotificationPriorityAction, snoozeRecruiterNotificationAction } from "@/app/actions/recruiter-ops";

const PRIORITY_ORDER:Record<string,number>={urgent:0,high:1,normal:2,low:3};

export default async function RecruiterNotificationsPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}) {
  const params=await searchParams;
  const {userId}=await requireRoleFast("recruiter");
  const admin=createAdminClient();
  const view=["inbox","all","snoozed","done"].includes(String(params.view))?String(params.view):"inbox";
  const now=new Date().toISOString();

  let query:any=admin.from("notifications").select("id,title,body,href,read_at,created_at,type,priority,snoozed_until,done_at").eq("user_id",userId).order("created_at",{ascending:false}).limit(100);
  if(view==="inbox") query=query.is("done_at",null).or(`snoozed_until.is.null,snoozed_until.lte.${now}`);
  if(view==="snoozed") query=query.is("done_at",null).gt("snoozed_until",now);
  if(view==="done") query=query.not("done_at","is",null);
  const {data,error}=await query;
  if(error) throw error;
  const rows=[...(data||[])].sort((a:any,b:any)=>(PRIORITY_ORDER[a.priority]??2)-(PRIORITY_ORDER[b.priority]??2)||new Date(b.created_at).getTime()-new Date(a.created_at).getTime());
  const unread=rows.filter((row:any)=>!row.read_at&&!row.done_at).length;

  return <div className="dash-page">
    <div className="dash-header"><div><div className="dash-kicker">Recruiter operations</div><h1>Notification Inbox</h1><p>Client, proposal, booking, SLA, application, talent, and delivery alerts in one place.</p></div>{unread?<form action={markAllRecruiterNotificationsReadAction}><button className="btn" type="submit">Mark all read</button></form>:null}</div>

    <div className="role-filter-tabs" aria-label="Notification views">
      {[['inbox','Inbox'],['all','All'],['snoozed','Snoozed'],['done','Done']].map(([value,label])=><Link className={view===value?"active":""} aria-current={view===value?"page":undefined} href={`/workspace/recruiter/notifications?view=${value}`} key={value}>{label}</Link>)}
    </div>

    <div className="stack">
      {rows.length?rows.map((n:any)=><article className={`card notification-card ${n.read_at?"":"unread"}`} key={n.id}>
        <div className="row-between wrap">
          <div style={{minWidth:0}}>
            <div className="row wrap"><Bell size={15}/><strong>{n.title}</strong>{!n.read_at?<span className="badge badge-warning">New</span>:null}<span className={`badge ${n.priority==="urgent"||n.priority==="high"?"badge-warning":""}`}>{n.priority}</span>{n.snoozed_until&&new Date(n.snoozed_until)>new Date()?<span className="badge"><Clock3 size={12}/> Snoozed</span>:null}{n.done_at?<span className="badge badge-success"><CheckCircle2 size={12}/> Done</span>:null}</div>
            <p className="muted" style={{margin:"6px 0"}}>{n.body||"Open the linked item for more detail."}</p>
            <span className="small muted">{dateShort(n.created_at)}</span>
          </div>
          <div className="row wrap">
            {n.href?<Link className="btn btn-sm" href={n.href}>Open</Link>:null}
            {!n.read_at&&!n.done_at?<form action={markRecruiterNotificationReadAction}><input type="hidden" name="notification_id" value={n.id}/><button className="btn btn-sm" type="submit">Mark read</button></form>:null}
            {!n.done_at?<form action={setRecruiterNotificationPriorityAction} className="row"><input type="hidden" name="notification_id" value={n.id}/><select name="priority" defaultValue={n.priority||"normal"} aria-label="Priority"><option value="urgent">Urgent</option><option value="high">High</option><option value="normal">Normal</option><option value="low">Low</option></select><button className="btn btn-sm" type="submit">Set</button></form>:null}
            {!n.done_at?<form action={snoozeRecruiterNotificationAction} className="row"><input type="hidden" name="notification_id" value={n.id}/><select name="minutes" defaultValue="1440" aria-label="Snooze notification"><option value="60">1 hour</option><option value="1440">1 day</option><option value="4320">3 days</option></select><button className="btn btn-sm" type="submit">Snooze</button></form>:null}
            {!n.done_at?<form action={completeRecruiterNotificationAction}><input type="hidden" name="notification_id" value={n.id}/><button className="btn btn-sm btn-primary" type="submit">Done</button></form>:null}
          </div>
        </div>
      </article>):<div className="card empty">No notifications in this view.</div>}
    </div>
  </div>;
}
