import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { dateShort } from "@/lib/format";

export default async function RecruiterActivityPage(){
  await requireRole("recruiter");
  const admin=createAdminClient();
  const [{data:activity},{data:messages}]=await Promise.all([
    admin.from("recruiter_activity").select("id,subject_type,subject_id,action,description,created_at").order("created_at",{ascending:false}).limit(100),
    admin.from("messages").select("id,conversation_id,created_at,read_at").is("read_at",null).order("created_at",{ascending:false}).limit(50)
  ]);
  return <><div className="page-head"><div><h1>Recruiting activity</h1><p>Private operational timeline plus unread conversation activity. Message contents stay inside the client/VA conversation workflow.</p></div></div><div className="grid-2"><section className="card"><h2 style={{marginTop:0}}>Recent recruiter activity</h2><div className="timeline-list">{(activity||[]).length?(activity||[]).map((row:any)=><div className="timeline-item" key={row.id}><span className="timeline-dot"/><div><strong>{String(row.action).replaceAll("_"," ")}</strong><p>{row.description||`${row.subject_type} updated`}</p><small>{dateShort(row.created_at)}</small></div></div>):<div className="empty">Activity will appear as you review and assign candidates.</div>}</div></section><section className="card"><div className="row-between"><div><h2 style={{margin:0}}>Unread conversation activity</h2><p className="small muted">Count only; private message content is not surfaced to recruiters.</p></div><span className="stat-inline">{messages?.length||0}</span></div>{messages?.length?<div className="compact-list">{messages.slice(0,20).map((row:any)=><div className="compact-static" key={row.id}><span><strong>Unread message</strong><small>{dateShort(row.created_at)}</small></span><span className="badge">Conversation</span></div>)}</div>:<div className="empty">No unread conversation activity.</div>}<div style={{marginTop:12}}><Link className="btn btn-sm" href="/workspace/recruiter/matching">Review active roles</Link></div></section></div></>;
}
