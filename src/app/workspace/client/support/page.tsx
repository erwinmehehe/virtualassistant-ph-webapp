import { AlertTriangle, CalendarClock, CheckCircle2, LifeBuoy } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { submitPlacementSupportRequestAction } from "@/app/actions/placement-support";

const TYPE_LABELS: Record<string,string> = { schedule_change:"Schedule change", concern:"Placement concern", replacement:"Replacement request" };
const STATUS_LABELS: Record<string,string> = { open:"Open", acknowledged:"Acknowledged", resolved:"Resolved", declined:"Declined" };
function badge(status:string){return status==="resolved"?"badge-success":status==="declined"?"badge-danger":status==="acknowledged"?"badge-warning":"";}

export default async function ClientSupportPage({ searchParams }: { searchParams: Promise<Record<string,string|undefined>> }) {
  const query = await searchParams;
  const { user } = await requireRole("client");
  const admin = createAdminClient();
  const { data: rooms, error } = await admin.from("workrooms").select("id,job_id,va_id,placement_stage,client_success_owner_id").eq("client_id", user.id).neq("placement_stage", "ended").order("created_at", { ascending:false });
  if (error) throw error;
  const roomIds=(rooms||[]).map((r:any)=>r.id);const jobIds=(rooms||[]).map((r:any)=>r.job_id);const vaIds=(rooms||[]).map((r:any)=>r.va_id).filter(Boolean);
  const [{data:jobs},{data:vas},{data:requests}]=await Promise.all([
    jobIds.length?admin.from("jobs").select("id,title").in("id",jobIds):Promise.resolve({data:[] as any[]}),
    vaIds.length?admin.from("profiles").select("id,full_name").in("id",vaIds):Promise.resolve({data:[] as any[]}),
    roomIds.length?admin.from("placement_support_requests").select("*").in("workroom_id",roomIds).order("created_at",{ascending:false}).limit(100):Promise.resolve({data:[] as any[]})
  ]);
  const jobMap=new Map((jobs||[]).map((x:any)=>[x.id,x]));const vaMap=new Map((vas||[]).map((x:any)=>[x.id,x]));

  return <>
    {query.support_sent?<div className="success-banner" role="status"><CheckCircle2 size={16}/>Your request was sent to Client Success.</div>:null}
    <div className="page-head"><div><div className="kicker">My team</div><h1>Placement support</h1><p>Report a concern, request a schedule change, or ask for replacement support without restarting the hiring process.</p></div></div>
    <div className="info-banner"><LifeBuoy size={17}/><div><strong>Use support before a small issue becomes a placement problem.</strong><p style={{margin:"4px 0 0"}}>A replacement request starts a Client Success review. It does not automatically end the current placement.</p></div></div>

    {(rooms||[]).length?<div className="stack" style={{marginTop:18}}>{(rooms||[]).map((room:any)=>{const job:any=jobMap.get(room.job_id)||{};const va:any=vaMap.get(room.va_id)||{};const recent=(requests||[]).filter((r:any)=>r.workroom_id===room.id);return <section className="card stack" key={room.id}>
      <div className="row-between wrap"><div><h2 style={{margin:"0 0 4px"}}>{va.full_name||"Virtual Assistant"}</h2><p className="small muted" style={{margin:0}}>{job.title||"Placement"}</p></div><span className="badge">{String(room.placement_stage).replaceAll("_"," ")}</span></div>
      <form action={submitPlacementSupportRequestAction} className="stack"><input type="hidden" name="workroom_id" value={room.id}/><div className="form-grid"><div className="field"><label>What do you need?</label><select name="request_type" required defaultValue="concern"><option value="concern">Report a placement concern</option><option value="schedule_change">Request a schedule change</option><option value="replacement">Request replacement support</option></select></div><div className="field"><label>Effective date <span className="muted">(required for schedule changes)</span></label><input type="date" name="start_date"/></div><div className="field span-2"><label>Details</label><textarea name="details" required minLength={5} maxLength={4000} placeholder="Tell Client Success what changed, what you have already tried, and what outcome you need."/></div></div><div className="row-between wrap"><span className="small muted">Urgent replacement requests are prioritized automatically.</span><button className="btn btn-primary" type="submit">Send to Client Success</button></div></form>
      {recent.length?<div><h3>Recent requests</h3><div className="stack">{recent.slice(0,8).map((request:any)=><div className="review-answer" key={request.id}><div className="row-between wrap"><strong>{TYPE_LABELS[request.request_type]||String(request.request_type).replaceAll("_"," ")}</strong><span className={`badge ${badge(request.status)}`}>{STATUS_LABELS[request.status]||request.status}</span></div><p className="small" style={{margin:"7px 0"}}>{request.details}</p><div className="row wrap small muted"><span><CalendarClock size={12}/>{new Date(request.created_at).toLocaleDateString("en-PH")}</span>{request.resolution?<span>Client Success: {request.resolution}</span>:null}</div></div>)}</div></div>:null}
    </section>})}</div>:<div className="card empty"><AlertTriangle size={22}/><h3>No active placement yet.</h3><p>Support becomes available after a Virtual Assistant placement is confirmed.</p></div>}
  </>;
}
