import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { dateShort } from "@/lib/format";
import { markAllNotificationsReadAction, markNotificationReadAction } from "@/app/actions/messages";

export default async function VaNotificationsPage(){
  const {user}=await requireRole("va");
  const supabase=await createClient();
  const {data:notifications}=await supabase.from("notifications").select("*").eq("user_id",user.id).order("created_at",{ascending:false}).limit(100);
  const unread=(notifications||[]).filter((x:any)=>!x.read_at).length;
  return <>
    <div className="page-head"><div><h1>Notifications</h1><p>Recruiter requests, application updates, interviews, offers, and hiring activity.</p></div>{unread?<form action={markAllNotificationsReadAction}><button className="btn" type="submit">Mark all read</button></form>:null}</div>
    <div className="stack">{notifications?.length?notifications.map((n:any)=><article className={`card notification-card ${n.read_at?"":"unread"}`} key={n.id}><div className="row-between wrap"><div><div className="row wrap"><strong>{n.title}</strong>{!n.read_at?<span className="badge badge-warning">New</span>:null}</div><p className="muted" style={{margin:"6px 0"}}>{n.body||"Open the linked item for more detail."}</p><span className="small muted">{dateShort(n.created_at)}</span></div><div className="row wrap">{n.href?<Link className="btn btn-sm" href={n.href}>Open</Link>:null}{!n.read_at?<form action={markNotificationReadAction}><input type="hidden" name="notification_id" value={n.id}/><button className="btn btn-sm" type="submit">Mark read</button></form>:null}</div></div></article>):<div className="card empty">You are all caught up.</div>}</div>
  </>;
}
