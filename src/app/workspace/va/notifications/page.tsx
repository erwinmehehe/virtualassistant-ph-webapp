import { ArrowRight } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { dateShort } from "@/lib/format";
import { markAllNotificationsReadAction, markNotificationReadAction } from "@/app/actions/notifications";
import { openWorkspaceNotificationAction } from "@/app/actions/notification-open";

export default async function VaNotificationsPage(){
  const {user}=await requireRole("va");
  const supabase=await createClient();
  const {data:notifications}=await supabase.from("notifications").select("*").eq("user_id",user.id).order("created_at",{ascending:false}).limit(100);
  const unread=(notifications||[]).filter((x:any)=>!x.read_at).length;
  return <>
    <div className="page-head"><div><h1>Notifications</h1><p>Recruiter requests, interviews, offers, and managed-placement updates. Click an update to go straight to the next step.</p></div>{unread?<form action={markAllNotificationsReadAction}><button className="btn" type="submit">Mark all read</button></form>:null}</div>
    <div className="stack">{notifications?.length?notifications.map((n:any)=><article className={`card notification-card ${n.read_at?"":"unread"}`} key={n.id}>
      <div className="row-between wrap" style={{gap:16}}>
        {n.href?<form action={openWorkspaceNotificationAction} style={{minWidth:0,flex:"1 1 520px"}}><input type="hidden" name="notification_id" value={n.id}/><button type="submit" aria-label={`Open ${n.title}`} style={{display:"block",width:"100%",border:0,background:"transparent",padding:0,textAlign:"left",color:"inherit",cursor:"pointer"}}><div className="row wrap"><strong>{n.title}</strong>{!n.read_at?<span className="badge badge-warning">New</span>:null}</div><p className="muted" style={{margin:"6px 0"}}>{n.body||"Open the linked item for more detail."}</p><span className="small muted">{dateShort(n.created_at)} · Click to act <ArrowRight size={12}/></span></button></form>:<div style={{minWidth:0,flex:"1 1 520px"}}><div className="row wrap"><strong>{n.title}</strong>{!n.read_at?<span className="badge badge-warning">New</span>:null}</div><p className="muted" style={{margin:"6px 0"}}>{n.body||"No linked action was supplied."}</p><span className="small muted">{dateShort(n.created_at)}</span></div>}
        <div className="row wrap">{n.href?<form action={openWorkspaceNotificationAction}><input type="hidden" name="notification_id" value={n.id}/><button className="btn btn-sm btn-primary" type="submit">Act now <ArrowRight size={13}/></button></form>:null}{!n.read_at?<form action={markNotificationReadAction}><input type="hidden" name="notification_id" value={n.id}/><button className="btn btn-sm" type="submit">Mark read</button></form>:null}</div>
      </div>
    </article>):<div className="card empty">You are all caught up.</div>}</div>
  </>;
}
