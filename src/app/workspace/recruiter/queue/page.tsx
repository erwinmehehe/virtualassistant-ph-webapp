import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getVaCompletion } from "@/lib/profile-completeness";
import { dateShort } from "@/lib/format";
import { vettingStatusLabel } from "@/lib/vetting";
import { claimCandidateAction } from "@/app/actions/vetting";

export default async function RecruiterQueue(){
  const {user}=await requireRole("recruiter");
  const admin=createAdminClient();
  const {data:vetting}=await admin.from("va_vetting").select("*").eq("stage","recruiter_review").order("updated_at",{ascending:true}).limit(200);
  const ids=(vetting||[]).map((x:any)=>x.va_id);
  const [{data:profiles},{data:vas},{data:attempts}]=ids.length?await Promise.all([
    admin.from("profiles").select("id,full_name").in("id",ids),
    admin.from("va_profiles").select("*").in("user_id",ids),
    admin.from("va_test_attempts").select("va_id,final_score,auto_score,submitted_at").in("va_id",ids)
  ]):[{data:[]},{data:[]},{data:[]} as any];
  const pm=new Map((profiles||[]).map((p:any)=>[p.id,p]));
  const vm=new Map((vas||[]).map((v:any)=>[v.user_id,v]));
  const am=new Map((attempts||[]).map((a:any)=>[a.va_id,a]));
  return <><div className="page-head"><div><h1>Vetting queue</h1><p>Work the candidates who have progressed far enough for screening. Finalists are escalated to the admin for approval.</p></div></div><div className="table-wrap responsive-table"><table><thead><tr><th>Candidate</th><th>Category</th><th>Profile</th><th>Test</th><th>Video</th><th>Stage</th><th>Owner</th><th></th></tr></thead><tbody>{(vetting||[]).length?(vetting||[]).map((row:any)=>{const p=pm.get(row.va_id) as any;const va=vm.get(row.va_id) as any;const a=am.get(row.va_id) as any;const completion=getVaCompletion(va).score;return <tr key={row.va_id}><td data-label="Candidate"><strong>{p?.full_name||"VA candidate"}</strong><div className="small muted">Updated {dateShort(row.updated_at)}</div></td><td data-label="Category">{va?.primary_category||"Not set"}</td><td data-label="Profile">{completion}%</td><td data-label="Test">{a?(a.final_score??a.auto_score??0)+"%":"Pending"}</td><td data-label="Video">{row.video_url?"Submitted":"Pending"}</td><td data-label="Stage"><span className="badge">{vettingStatusLabel(row.stage)}</span></td><td data-label="Owner">{row.recruiter_id===user.id?"You":row.recruiter_id?"Another recruiter":"Unassigned"}</td><td data-label="Action"><div className="row wrap">{!row.recruiter_id?<form action={claimCandidateAction}><input type="hidden" name="va_id" value={row.va_id}/><button className="btn btn-sm" type="submit">Claim</button></form>:null}{!row.recruiter_id||row.recruiter_id===user.id?<Link className="btn btn-sm btn-primary" href={`/workspace/recruiter/candidates/${row.va_id}`}>Review</Link>:<span className="small muted">In review</span>}</div></td></tr>}):<tr><td colSpan={8}><div className="empty">No candidates are ready for recruiter review yet.</div></td></tr>}</tbody></table></div></>;
}
