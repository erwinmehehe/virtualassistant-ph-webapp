import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { DashboardDegradedNotice } from "@/components/dashboard-degraded-notice";
import { philippineDate } from "@/lib/lead-follow-ups";
import { money } from "@/lib/format";

const views = [["active", "Active"], ["paused", "Paused"], ["completed", "Completed"]] as const;

export default async function AdminPlacementsPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}) {
  await requireRole("admin");
  const params=await searchParams;
  const status=views.some(([value])=>value===params.status)?params.status!:"active";
  const page=Math.max(1,Math.min(10000,Math.floor(Number(params.page)||1)));
  const admin=createAdminClient();
  const {data:rooms,count,error}=await admin.from("workrooms")
    .select("id,job_id,status,start_date,agreed_hourly_rate,agreed_schedule,jobs(title),client:profiles!workrooms_client_id_fkey(full_name),va:profiles!workrooms_va_id_fkey(full_name)",{count:"exact"})
    .eq("status",status).order("start_date",{ascending:true,nullsFirst:true}).order("id").range((page-1)*20,page*20-1);
  const ids=(rooms||[]).map(room=>room.id);
  const checks=ids.length?await admin.from("workroom_checklist").select("workroom_id,title,completed_at").in("workroom_id",ids).order("sort_order"): {data:[],error:null};
  const issues=[...(error?["placements"]:[]),...(checks.error?["onboarding checklists"]:[])];
  const today=philippineDate();
  const href=(next:number)=>`/workspace/admin/placements?status=${status}&page=${next}`;
  return <>
    <DashboardDegradedNotice issues={issues}/>
    <div className="page-head"><div><div className="kicker">Placement support</div><h1>Placements</h1><p>See agreed start dates and onboarding progress for each hire.</p></div><Link className="btn" href="/workspace/admin">Agency overview</Link></div>
    <nav className="agency-filter-tabs" aria-label="Filter placement status">{views.map(([value,label])=><Link key={value} href={`/workspace/admin/placements?status=${value}`} aria-current={status===value?"page":undefined}>{label}</Link>)}</nav>
    <p className="small muted">{error?"Placement count unavailable":`${count||0} ${status} placements`} · Dates use Philippine time. Checklist updates are made by the client and VA in their workroom.</p>
    <div className="stack">{error?<div className="card empty" role="alert">Placements could not be loaded. Refresh to try again.</div>:rooms?.length?rooms.map(room=>{
      const checklist=(checks.data||[]).filter(item=>item.workroom_id===room.id);
      const remaining=checklist.filter(item=>!item.completed_at);
      const complete=checklist.length-remaining.length;
      const job=Array.isArray(room.jobs)?room.jobs[0]:room.jobs;
      const client=Array.isArray(room.client)?room.client[0]:room.client;
      const va=Array.isArray(room.va)?room.va[0]:room.va;
      const needsSupport=status==="active"&&!checks.error&&(!checklist.length||remaining.length>0);
      const next=status==="paused"?"Review the pause with the client and VA before agreeing the next step.":status==="completed"?"Placement completed. Review the hiring record or any remaining payment administration.":checks.error?"Onboarding progress is unavailable. Refresh before deciding whether follow-up is needed.":!checklist.length?"No onboarding checklist is recorded. Confirm the start plan with the client and VA.":remaining.length?"Follow up with the client and VA on the remaining onboarding items.":"Onboarding is complete. Continue regular placement support.";
      return <article className="card stack" key={room.id} id={`placement-${room.id}`}>
        <div className="row-between wrap"><div><h2>{job?.title||"Hired role"}</h2><p className="small muted">Client: {client?.full_name||"Not available"} · VA: {va?.full_name||"Not available"}</p></div><span className={`badge ${needsSupport?"badge-warning":""}`}>{needsSupport?"Onboarding follow-up":status}</span></div>
        <div className="grid-3"><div><span className="small muted">Agreed start</span><strong style={{display:"block"}}>{room.start_date||"Not recorded"}</strong>{status==="active"&&room.start_date&&room.start_date<=today&&needsSupport?<small className="muted">Start date reached; onboarding remains open.</small>:null}</div><div><span className="small muted">Agreed VA rate</span><strong style={{display:"block"}}>{room.agreed_hourly_rate==null?"Not recorded":`${money(room.agreed_hourly_rate)}/hr`}</strong></div><div><span className="small muted">Agreed schedule</span><strong style={{display:"block"}}>{room.agreed_schedule||"Not recorded"}</strong></div></div>
        <section><h3>Onboarding</h3><p>{checks.error?"Progress unavailable":checklist.length?`${complete} of ${checklist.length} items complete`:"No checklist recorded"}</p>{!checks.error&&remaining.length?<ul>{remaining.map((item,index)=><li key={`${item.title}-${index}`}>{item.title}</li>)}</ul>:null}<p className="small muted">{next}</p></section>
        <div className="row wrap"><Link className="btn" href={`/workspace/admin/jobs/${room.job_id}`}>Review hiring brief</Link><Link className="btn" href="/workspace/admin/payments">Payment administration</Link></div>
      </article>;
    }):<div className="card empty">No {status} placements in this view.</div>}</div>
    {!error&&(count||0)>20?<div className="row-between" style={{marginTop:24}}>{page>1?<Link className="btn" href={href(page-1)}>Previous</Link>:<span/>}<span>Page {page} of {Math.ceil((count||0)/20)}</span>{page*20<(count||0)?<Link className="btn" href={href(page+1)}>Next</Link>:<span/>}</div>:null}
  </>;
}
