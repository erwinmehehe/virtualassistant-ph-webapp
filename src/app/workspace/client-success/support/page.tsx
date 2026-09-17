import Link from "next/link";
import { AlertTriangle, CalendarClock, CheckCircle2, LifeBuoy } from "lucide-react";
import { requireAnyRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolvePlacementSupportRequestAction } from "@/app/actions/placement-support";
import type { AvatarProfileRow, JobSummaryRow, PlacementSupportRequestRow, WorkroomRow } from "@/lib/workspace-rows";

const TYPE_LABELS: Record<string,string> = { leave:"Leave", sick:"Sick leave", emergency:"Emergency", late:"Late / delayed", schedule_change:"Schedule change", concern:"Placement concern", replacement:"Replacement request" };
function priorityBadge(value:string){return value==="urgent"?"badge-danger":value==="high"?"badge-warning":"";}
function statusBadge(value:string){return value==="resolved"?"badge-success":value==="declined"?"badge-danger":value==="acknowledged"?"badge-warning":"";}

export default async function ClientSuccessSupportPage({ searchParams }: { searchParams: Promise<Record<string,string|undefined>> }) {
  const query=await searchParams;
  const {user,profile}=await requireAnyRole(["admin","recruiter"]);
  const admin=createAdminClient();
  const {data:requestData,error}=await admin.from("placement_support_requests").select("*").order("created_at",{ascending:false}).limit(300);
  if(error)throw error;
  const requests=(requestData||[]) as PlacementSupportRequestRow[];
  const roomIds=[...new Set(requests.map((r)=>r.workroom_id))];
  const {data:roomData}=roomIds.length?await admin.from("workrooms").select("id,job_id,client_id,va_id,client_success_owner_id,placement_stage,health_status,health_score").in("id",roomIds):{data:[]};
  const rooms=(roomData||[]) as WorkroomRow[];
  const roomMap=new Map(rooms.map((r)=>[r.id,r]));
  const jobIds=[...new Set(rooms.map((r)=>r.job_id))];
  const profileIds=[...new Set(rooms.flatMap((r)=>[r.client_id,r.va_id]).filter(Boolean))];
  const [{data:jobs},{data:people}]=await Promise.all([
    jobIds.length?admin.from("jobs").select("id,title,company_name,recruiter_id").in("id",jobIds):Promise.resolve({data:[]}),
    profileIds.length?admin.from("profiles").select("id,full_name").in("id",profileIds):Promise.resolve({data:[]})
  ]);
  const jobMap=new Map(((jobs||[]) as JobSummaryRow[]).map((j)=>[j.id,j]));const peopleMap=new Map(((people||[]) as AvatarProfileRow[]).map((p)=>[p.id,p]));
  const visible=requests.filter((request)=>{const room=roomMap.get(request.workroom_id);const job=room?jobMap.get(room.job_id):null;return profile.role==="admin"||room?.client_success_owner_id===user.id||job?.recruiter_id===user.id;});
  const rank=(r:PlacementSupportRequestRow)=>r.priority==="urgent"?0:r.priority==="high"?1:2;
  const active=visible.filter((r)=>["open","acknowledged"].includes(r.status)).sort((a,b)=>rank(a)-rank(b)||new Date(a.created_at).getTime()-new Date(b.created_at).getTime());
  const recentClosed=visible.filter((r)=>["resolved","declined"].includes(r.status)).slice(0,30);
  const requested=String(query.request||"");

  const render=(request:PlacementSupportRequestRow,closed=false)=>{const room:Partial<WorkroomRow>=roomMap.get(request.workroom_id)||{};const job:Partial<JobSummaryRow>=jobMap.get(room.job_id||"")||{};const requester=request.requester_role==="client"?peopleMap.get(room.client_id||"")?.full_name:peopleMap.get(room.va_id||"")?.full_name;return <article className={`card ${request.id===requested?"support-request-highlight":""}`} key={request.id}>
    <div className="row-between wrap"><div><div className="row wrap"><span className={`badge ${priorityBadge(request.priority)}`}>{request.priority}</span><span className={`badge ${statusBadge(request.status)}`}>{request.status}</span></div><h3 style={{margin:"8px 0 3px"}}>{TYPE_LABELS[request.request_type]||String(request.request_type).replaceAll("_"," ")}</h3><p className="small muted" style={{margin:0}}>{job.title||"Placement"} · {job.company_name||peopleMap.get(room.client_id||"")?.full_name||"Client"} · {requester||request.requester_role}</p></div><div style={{textAlign:"right"}}><span className="small muted">Health</span><strong style={{display:"block"}}>{room.health_score!=null?`${room.health_score} · ${String(room.health_status).replaceAll("_"," ")}`:String(room.health_status||"building").replaceAll("_"," ")}</strong></div></div>
    <p>{request.details}</p>
    <div className="row wrap small muted"><span><CalendarClock size={12}/>Submitted {new Date(request.created_at).toLocaleString("en-PH",{timeZone:"Asia/Manila"})}</span>{request.start_date?<span>From {request.start_date}{request.end_date?` to ${request.end_date}`:""}</span>:null}<Link href={`/workspace/client-success/${request.workroom_id}`}>Open placement</Link></div>
    {!closed?<form action={resolvePlacementSupportRequestAction} className="stack" style={{marginTop:14}}><input type="hidden" name="request_id" value={request.id}/><input type="hidden" name="workroom_id" value={request.workroom_id}/><div className="form-grid"><div className="field"><label>Status</label><select name="status" defaultValue={request.status==="open"?"acknowledged":request.status}><option value="acknowledged">Acknowledge</option><option value="resolved">Resolve</option><option value="declined">Decline</option></select></div><div className="field span-2"><label>Client Success note</label><textarea name="resolution" maxLength={4000} defaultValue={request.resolution||""} placeholder="What was agreed, what happens next, and who owns the follow-up?"/></div></div><button className="btn btn-primary" type="submit">Save support outcome</button></form>:request.resolution?<div className="info-banner" style={{marginTop:12}}><CheckCircle2 size={15}/><span>{request.resolution}</span></div>:null}
  </article>;};

  return <>
    {query.support_saved?<div className="success-banner" role="status">Support request updated and the requester was notified.</div>:null}
    <div className="page-head"><div><div className="kicker">Client Success</div><h1>Support queue</h1><p>Leave, schedule changes, concerns, emergencies, and replacement requests that need a human response.</p></div><Link className="btn" href="/workspace/client-success"><LifeBuoy size={16}/>Placement queue</Link></div>
    <div className="grid-3"><div className="card"><span className="small muted">Open</span><strong style={{display:"block",fontSize:28}}>{active.filter((r)=>r.status==="open").length}</strong></div><div className="card"><span className="small muted">Acknowledged</span><strong style={{display:"block",fontSize:28}}>{active.filter((r)=>r.status==="acknowledged").length}</strong></div><div className="card"><span className="small muted">Urgent</span><strong style={{display:"block",fontSize:28}}>{active.filter((r)=>r.priority==="urgent").length}</strong></div></div>
    <section className="card" style={{marginTop:18}}><div className="row-between wrap"><div><h2 style={{margin:0}}>Needs action</h2><p className="small muted" style={{margin:"5px 0 0"}}>Urgent and high-priority requests rise first. Acknowledging a request keeps it visible until it is resolved or declined.</p></div><AlertTriangle size={20}/></div>{active.length?<div className="stack" style={{marginTop:14}}>{active.map((r)=>render(r))}</div>:<div className="empty">No placement support requests need attention.</div>}</section>
    {recentClosed.length?<section className="card" style={{marginTop:18}}><h2 style={{marginTop:0}}>Recently closed</h2><div className="stack">{recentClosed.map((r)=>render(r,true))}</div></section>:null}
  </>;
}
