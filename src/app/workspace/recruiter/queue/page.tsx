import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getVaCompletion } from "@/lib/profile-completeness";
import { dateShort } from "@/lib/format";
import { vettingStatusLabel } from "@/lib/vetting";

export default async function RecruiterQueue(){
  await requireRole("recruiter");const admin=createAdminClient();
  const {data:vetting}=await admin.from("va_vetting").select("*").eq("stage","recruiter_review").order("updated_at",{ascending:true}).limit(200);
  const ids=(vetting||[]).map((x:any)=>x.va_id);const [{data:profiles},{data:vas},{data:attempts}]=ids.length?await Promise.all([admin.from("profiles").select("id,full_name,avatar_url").in("id",ids),admin.from("va_profiles").select("*").in("user_id",ids),admin.from("va_test_attempts").select("va_id,final_score,auto_score,submitted_at").in("va_id",ids)]):[{data:[]},{data:[]},{data:[]} as any];
  const pm=new Map((profiles||[]).map((p:any)=>[p.id,p]));const vm=new Map((vas||[]).map((v:any)=>[v.user_id,v]));const am=new Map((attempts||[]).map((a:any)=>[a.va_id,a]));
  return <><div className="page-head"><div><h1>Vetting queue</h1><p>No claim step. Open any candidate that is ready for recruiter review, complete the scorecard, and move on.</p></div><Link className="btn" href="/workspace/recruiter/talent?stage=recruiter_review">Open in master directory</Link></div><div className="table-wrap responsive-table"><table><thead><tr><th>Candidate</th><th>Category</th><th>Profile</th><th>Test</th><th>Video</th><th>Stage</th><th></th></tr></thead><tbody>{(vetting||[]).length?(vetting||[]).map((row:any)=>{const p=pm.get(row.va_id) as any;const va=vm.get(row.va_id) as any;const a=am.get(row.va_id) as any;const completion=getVaCompletion(va,p?.avatar_url).score;return <tr key={row.va_id}><td data-label="Candidate"><strong>{p?.full_name||"VA candidate"}</strong><div className="small muted">Updated {dateShort(row.updated_at)}</div></td><td data-label="Category">{va?.primary_category||"Not set"}</td><td data-label="Profile"><span className={`badge ${completion===100?"badge-success":"badge-warning"}`}>{completion}%</span></td><td data-label="Test">{a?(a.final_score??a.auto_score??0)+"%":"Pending"}</td><td data-label="Video">{row.video_url?"Submitted":"Pending"}</td><td data-label="Stage"><span className="badge">{vettingStatusLabel(row.stage)}</span></td><td data-label="Action"><Link className="btn btn-sm btn-primary" href={`/workspace/recruiter/candidates/${row.va_id}`}>Review</Link></td></tr>}):<tr><td colSpan={7}><div className="empty">No candidates are waiting for recruiter review.</div></td></tr>}</tbody></table></div></>;
}
