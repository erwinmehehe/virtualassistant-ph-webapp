import { requireRoleFast } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculatePlacementFinance, financeStatusLabel } from "@/lib/agency-finance";
import { requestMarginExceptionAction } from "@/app/actions/agency-finance";
import type { PlacementFinanceProfileRow } from "@/lib/workspace-rows";

type MarginWorkroomRow = { id: string; job_id: string; placement_stage: string | null; status: string | null; client: { full_name: string | null } | null; va: { full_name: string | null } | null };
type MarginProfileRow = Omit<PlacementFinanceProfileRow, "reconciled_at" | "updated_at"> & { exception_reason: string | null; exception_review_note: string | null };

export default async function RecruiterFinancePage(){
  const {userId}=await requireRoleFast("recruiter");
  const admin=createAdminClient();
  const [{data:jobs},{data:settings}]=await Promise.all([
    admin.from("jobs").select("id,title").eq("recruiter_id",userId).order("created_at",{ascending:false}),
    admin.from("admin_settings").select("finance_min_margin_percent,finance_target_margin_percent").eq("id",1).single()
  ]);
  const jobRows=(jobs||[]) as {id:string;title:string|null}[];
  const jobIds=jobRows.map((job)=>job.id);
  const jobMap=new Map(jobRows.map((job)=>[job.id,job]));
  const {data:roomData}=jobIds.length?await admin.from("workrooms").select("id,job_id,placement_stage,status,client:profiles!workrooms_client_id_fkey(full_name),va:profiles!workrooms_va_id_fkey(full_name)").in("job_id",jobIds).neq("placement_stage","ended").order("created_at",{ascending:false}):{data:[]};
  const rooms=(roomData||[]) as unknown as MarginWorkroomRow[];
  const roomIds=rooms.map((room)=>room.id);
  const {data:profiles}=roomIds.length?await admin.from("placement_finance_profiles").select("workroom_id,expected_monthly_client_revenue,expected_monthly_va_compensation,payment_cost_percent,monthly_ops_cost,other_monthly_cost,exception_status,exception_reason,exception_review_note").in("workroom_id",roomIds):{data:[]};
  const profileMap=new Map(((profiles||[]) as MarginProfileRow[]).map((profile)=>[profile.workroom_id,profile]));
  const minMargin=Number(settings?.finance_min_margin_percent??15);
  const targetMargin=Number(settings?.finance_target_margin_percent??25);

  const rows=rooms.map((room)=>{
    const profile=profileMap.get(room.id);
    const result=profile?calculatePlacementFinance({expectedMonthlyClientRevenue:Number(profile.expected_monthly_client_revenue||0),expectedMonthlyVaCompensation:Number(profile.expected_monthly_va_compensation||0),paymentCostPercent:Number(profile.payment_cost_percent||0),monthlyOpsCost:Number(profile.monthly_ops_cost||0),otherMonthlyCost:Number(profile.other_monthly_cost||0),minMarginPercent:minMargin,targetMarginPercent:targetMargin,exceptionStatus:profile.exception_status}):calculatePlacementFinance({expectedMonthlyClientRevenue:0,expectedMonthlyVaCompensation:0,paymentCostPercent:0,monthlyOpsCost:0,otherMonthlyCost:0,minMarginPercent:minMargin,targetMarginPercent:targetMargin});
    return{room,profile,result,job:jobMap.get(room.job_id)};
  }).sort((a,b)=>{
    const rank:Record<string,number>={approval_required:0,watch:1,needs_setup:2,approved_exception:3,healthy:4};
    return(rank[a.result.status]??9)-(rank[b.result.status]??9);
  });

  return <>
    <div className="page-head"><div><h1>Margin review</h1><p>See whether your placements meet the agency margin guardrail. Detailed agency costs stay private to finance/admin.</p></div></div>
    <div className="card" style={{marginBottom:24}}><div className="row-between wrap"><div><strong>Guardrail</strong><p className="small muted" style={{margin:"4px 0 0"}}>Minimum acceptable margin {minMargin.toFixed(1)}% · target {targetMargin.toFixed(1)}%. If the client or role economics force the placement below the floor, request an owner exception instead of quietly discounting it.</p></div><span className="badge">{rows.length} placement{rows.length===1?"":"s"}</span></div></div>
    {rows.length?<div className="stack">{rows.map(({room,profile,result,job})=><section className="card" key={room.id}><div className="row-between wrap" style={{gap:16}}><div><strong>{job?.title||"Managed placement"}</strong><p className="small muted" style={{margin:"4px 0"}}>{room.client?.full_name||"Client"} → {room.va?.full_name||"VA"}</p><span className={`badge ${result.status==="healthy"?"badge-success":result.status==="approval_required"?"badge-danger":"badge-warning"}`}>{financeStatusLabel(result.status,result.marginPercent)}</span></div><div style={{textAlign:"right"}}><span className="small muted">Projected margin</span><strong style={{display:"block",fontSize:24}}>{profile?`${result.marginPercent.toFixed(1)}%`:"Not set"}</strong></div></div>
      {result.status==="approval_required"&&profile?.exception_status!=="pending"?<form action={requestMarginExceptionAction} className="stack" style={{marginTop:16}}><input type="hidden" name="workroom_id" value={room.id}/><div className="field"><label>Why should the owner approve this low-margin placement?</label><textarea name="reason" minLength={10} maxLength={3000} required placeholder="Client commitment, strategic account, temporary ramp period, rate increase already agreed..."/></div><button className="btn btn-primary btn-sm" type="submit">Request owner exception</button></form>:null}
      {profile?.exception_status==="pending"?<div className="alert" style={{marginTop:14}}><strong>Owner review pending.</strong>{profile.exception_reason?` ${profile.exception_reason}`:""}</div>:null}
      {profile?.exception_status==="approved"?<div className="success-banner" style={{marginTop:14}}><strong>Exception approved.</strong>{profile.exception_review_note?` ${profile.exception_review_note}`:""}</div>:null}
      {profile?.exception_status==="rejected"?<div className="alert" style={{marginTop:14}}><strong>Exception rejected.</strong>{profile.exception_review_note?` ${profile.exception_review_note}`:" Adjust the role or commercial terms before proceeding."}</div>:null}
      {result.status==="needs_setup"?<p className="small muted" style={{marginBottom:0}}>Finance/admin has not configured the placement economics yet.</p>:null}
    </section>)}</div>:<div className="card empty">No active managed placements are assigned to you yet.</div>}
  </>;
}
