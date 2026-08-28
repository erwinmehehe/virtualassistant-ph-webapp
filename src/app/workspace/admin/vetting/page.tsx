import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { addBenchMemberAction } from "@/app/actions/vetting";
import { bulkApproveExperiencedVAsFormAction, bulkAddApprovedToBenchFormAction, sendProfileStageNudgesAction } from "@/app/actions/admin";
import { VA_CATEGORIES } from "@/lib/constants";
import { dateShort } from "@/lib/format";

export default async function AdminVettingPage({ searchParams }: { searchParams: Promise<Record<string,string|undefined>> }){
  const params = await searchParams;
  await requireRole("admin"); const admin=createAdminClient();
  const {data:pendingStages}=await admin.from("va_vetting").select("va_id,stage").not("stage","in","(approved,bench,rejected)");
  const pendingIds=(pendingStages||[]).map((x:any)=>x.va_id);
  const {data:pendingVaProfiles}=pendingIds.length?await admin.from("va_profiles").select("user_id,years_experience").in("user_id",pendingIds):{data:[]};
  const experiencedCount=(pendingVaProfiles||[]).filter((x:any)=>Number(x.years_experience||0)>=2).length;
  const profileStageCount=(pendingStages||[]).filter((x:any)=>x.stage==="profile").length;
  const {data:rows}=await admin.from("va_vetting").select("*").in("stage",["finalist","approved","bench"]).order("updated_at",{ascending:false}).limit(200);
  const ids=(rows||[]).map((x:any)=>x.va_id);
  const [{data:profiles},{data:vas},{data:scores}]=ids.length?await Promise.all([
    admin.from("profiles").select("id,full_name").in("id",ids),
    admin.from("va_profiles").select("user_id,headline,primary_category,weekly_hours,hourly_rate").in("user_id",ids),
    admin.from("vetting_scorecards").select("va_id,total_score,recommendation,created_at").in("va_id",ids).order("created_at",{ascending:false})
  ]):[{data:[]},{data:[]},{data:[]}];
  const pm=new Map((profiles||[]).map((x:any)=>[x.id,x])); const vm=new Map((vas||[]).map((x:any)=>[x.user_id,x])); const sm=new Map<string,any>(); for(const x of scores||[]) if(!sm.has(x.va_id)) sm.set(x.va_id,x);
  const finalists=(rows||[]).filter((x:any)=>x.stage==="finalist"); const approved=(rows||[]).filter((x:any)=>["approved","bench"].includes(x.stage));
  const approvedNotBenchCount=(rows||[]).filter((x:any)=>x.stage==="approved").length;
  return <>
    <div className="page-head"><div><h1>Final vetting review</h1><p>Review the complete evidence package before approving a recruiter finalist for client matching.</p></div></div>
    {params.bulk_approved?<div className="alert alert-success" style={{marginBottom:18}}>Bulk-approved {params.bulk_approved} VA{params.bulk_approved==="1"?"":"s"} with 2+ years of experience.</div>:null}
    {params.nudges_sent!=null?<div className="alert alert-success" style={{marginBottom:18}}>Sent {params.nudges_sent} reminder email{params.nudges_sent==="1"?"":"s"} to VAs stuck at the profile stage.</div>:null}
    {params.bulk_benched?<div className="alert alert-success" style={{marginBottom:18}}>Added {params.bulk_benched} VA{params.bulk_benched==="1"?"":"s"} to their category talent pool.</div>:null}
    <div className="card" style={{marginBottom:18}}>
      <h3 style={{marginTop:0}}>Backlog shortcuts</h3>
      <p className="small muted" style={{marginBottom:14}}>These skip or nudge the normal pipeline &mdash; use them to clear a real backlog quickly, not as a permanent replacement for recruiter review.</p>
      <div className="row wrap" style={{gap:14}}>
        <form action={bulkApproveExperiencedVAsFormAction}>
          <button className="btn btn-primary btn-sm" type="submit" disabled={!experiencedCount}>Bulk-approve {experiencedCount} VA{experiencedCount===1?"":"s"} with 2+ years experience</button>
          <div className="small muted" style={{marginTop:4}}>Skips the remaining skills test, video, and recruiter review steps for these candidates only.</div>
        </form>
        <form action={sendProfileStageNudgesAction}>
          <button className="btn btn-sm" type="submit" disabled={!profileStageCount}>Email {profileStageCount} VA{profileStageCount===1?"":"s"} stuck at profile stage</button>
          <div className="small muted" style={{marginTop:4}}>Reminds candidates who signed up but never finished their profile.</div>
        </form>
        <form action={bulkAddApprovedToBenchFormAction}>
          <button className="btn btn-sm" type="submit" disabled={!approvedNotBenchCount}>Add {approvedNotBenchCount} approved VA{approvedNotBenchCount===1?"":"s"} to talent pool</button>
          <div className="small muted" style={{marginTop:4}}>Files each into their own primary category&apos;s talent pool at default priority.</div>
        </form>
      </div>
    </div>
    <div className="card" style={{marginBottom:18}}><div className="row-between wrap"><div><h3 style={{margin:0}}>Final review queue</h3><p className="small muted" style={{margin:"5px 0 0"}}>Final decisions are intentionally separated from this summary table so evidence is reviewed first.</p></div><span className="badge">{finalists.length} waiting</span></div>{finalists.length?<div className="table-wrap responsive-table" style={{marginTop:14}}><table><thead><tr><th>Candidate</th><th>Category</th><th>Recruiter score</th><th>Interview</th><th></th></tr></thead><tbody>{finalists.map((row:any)=>{const p=pm.get(row.va_id) as any;const va=vm.get(row.va_id) as any;const score=sm.get(row.va_id);return <tr key={row.va_id}><td data-label="Candidate"><strong>{p?.full_name||"VA candidate"}</strong><div className="small muted">{va?.headline||"Virtual Assistant"}</div></td><td data-label="Category">{va?.primary_category||"Not set"}</td><td data-label="Recruiter score"><strong>{score?.total_score??"Not set"}{score?"%":""}</strong><div className="small muted">{score?dateShort(score.created_at):"No scorecard"}</div></td><td data-label="Interview">{row.recruiter_interview_at?<span className="badge badge-success">Completed</span>:<span className="badge badge-warning">Not recorded</span>}</td><td><Link className="btn btn-sm btn-primary" href={`/workspace/admin/vetting/${row.va_id}`}>Review evidence</Link></td></tr>})}</tbody></table></div>:<div className="empty">No finalists are waiting for your decision.</div>}</div>
    <div className="card"><h3>Approved talent</h3><p className="small muted">Add approved VAs to category talent pools when they are available for fast matching.</p>{approved.length?<div className="table-wrap responsive-table"><table><thead><tr><th>VA</th><th>Primary category</th><th>Stage</th><th>Add to talent pool</th></tr></thead><tbody>{approved.map((row:any)=>{const p=pm.get(row.va_id) as any;const va=vm.get(row.va_id) as any;return <tr key={row.va_id}><td data-label="VA"><strong>{p?.full_name||"VA"}</strong><div className="small muted">{va?.headline||"Virtual Assistant"}</div></td><td data-label="Primary category">{va?.primary_category||"Not set"}</td><td data-label="Stage"><span className="badge badge-success">{row.stage}</span></td><td><form action={addBenchMemberAction} className="row wrap"><input type="hidden" name="va_id" value={row.va_id}/><label className="sr-only" htmlFor={`pool-category-${row.va_id}`}>Talent pool category</label><select id={`pool-category-${row.va_id}`} name="category" defaultValue={va?.primary_category||""} className="compact-select">{VA_CATEGORIES.map((x,index)=><option key={`${String(x)}-${index}`}>{x}</option>)}</select><label className="sr-only" htmlFor={`pool-priority-${row.va_id}`}>Priority</label><select id={`pool-priority-${row.va_id}`} name="priority" defaultValue="3" className="compact-select"><option value="5">Priority 5</option><option value="4">Priority 4</option><option value="3">Priority 3</option><option value="2">Priority 2</option><option value="1">Priority 1</option></select><button className="btn btn-sm" type="submit">Add</button></form></td></tr>})}</tbody></table></div>:<div className="empty">Approved candidates will appear here.</div>}</div>
  </>;
}
