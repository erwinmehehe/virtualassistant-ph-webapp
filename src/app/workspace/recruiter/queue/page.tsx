import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getVaCompletion } from "@/lib/profile-completeness";
import { dateShort } from "@/lib/format";
import { vettingStatusLabel } from "@/lib/vetting";
import { bulkRecruiterVaAction } from "@/app/actions/recruiter";

export default async function RecruiterQueue({ searchParams }:{ searchParams: Promise<Record<string,string|undefined>> }){
  await requireRole("recruiter");const admin=createAdminClient();const params=await searchParams;
  const {data:vetting}=await admin.from("va_vetting").select("*").eq("stage","recruiter_review").order("updated_at",{ascending:true}).limit(200);
  const ids=(vetting||[]).map((x:any)=>x.va_id);const [{data:profiles},{data:vas},{data:attempts}]=ids.length?await Promise.all([admin.from("profiles").select("id,full_name,avatar_url").in("id",ids),admin.from("va_profiles").select("*").in("user_id",ids),admin.from("va_test_attempts").select("va_id,final_score,auto_score,submitted_at").in("va_id",ids)]):[{data:[]},{data:[]},{data:[]} as any];
  const pm=new Map((profiles||[]).map((p:any)=>[p.id,p]));const vm=new Map((vas||[]).map((v:any)=>[v.user_id,v]));const am=new Map((attempts||[]).map((a:any)=>[a.va_id,a]));
  const total=(vetting||[]).length;

  return <><div className="page-head"><div><h1>Vetting queue</h1><p>No claim step. Open any candidate that is ready for recruiter review, complete the scorecard, and move on. Or select candidates below and act on them together.</p></div><Link className="btn" href="/workspace/recruiter/talent?stage=recruiter_review">Open in master directory</Link></div>

    {params.bulk_done?<div className="success-banner">Bulk action complete: {String(params.bulk_done).replaceAll("_"," ")} &middot; {params.affected||0} approved{params.published!==undefined?` · ${params.published} now live in the public directory`:""}.</div>:null}
    {params.skipped?<div className="alert">Skipped as not directory-ready: {params.skipped}. Approval needs a 90%+ profile with nothing missing except portfolio or tools.</div>:null}
    {params.bulk_error?<div className="alert" role="alert">{params.bulk_error}</div>:null}

    <form action={bulkRecruiterVaAction} className="stack">
      <input type="hidden" name="return_to" value="/workspace/recruiter/queue"/>
      <input type="hidden" name="filter_stage" value="recruiter_review"/>
      <div className="bulk-action-bar bulk-action-bar-compact">
        <label className="bulk-scope"><input type="checkbox" name="selection_scope" value="filtered"/><span><strong>Select all {total} in the queue</strong><small>Unchecked = only the rows you tick below</small></span></label>
        <select name="bulk_action" required defaultValue="">
          <option value="" disabled>Bulk action&hellip;</option>
          <option value="approve_publish">Approve and publish to directory</option>
          <option value="approve">Approve only (stays hidden)</option>
          <option value="request_changes">Request profile changes</option>
          <option value="reject">Reject</option>
        </select>
        <button className="btn btn-primary" type="submit">Apply</button>
      </div>

      <div className="table-wrap responsive-table"><table><thead><tr><th></th><th>Candidate</th><th>Category</th><th>Profile</th><th>Test</th><th>Video</th><th>Stage</th><th></th></tr></thead><tbody>{total?(vetting||[]).map((row:any)=>{const p=pm.get(row.va_id) as any;const va=vm.get(row.va_id) as any;const a=am.get(row.va_id) as any;const completion=getVaCompletion(va,p?.avatar_url).score;return <tr key={row.va_id}><td data-label="Select"><input type="checkbox" name="va_id" value={row.va_id} aria-label={`Select ${p?.full_name||"VA candidate"}`}/></td><td data-label="Candidate"><strong>{p?.full_name||"VA candidate"}</strong><div className="small muted">Updated {dateShort(row.updated_at)}</div></td><td data-label="Category">{va?.primary_category||"Not set"}</td><td data-label="Profile"><span className={`badge ${completion===100?"badge-success":"badge-warning"}`}>{completion}%</span></td><td data-label="Test">{a?(a.final_score??a.auto_score??0)+"%":"Pending"}</td><td data-label="Video">{row.video_url?"Submitted":"Pending"}</td><td data-label="Stage"><span className="badge">{vettingStatusLabel(row.stage)}</span></td><td data-label="Action"><Link className="btn btn-sm btn-primary" href={`/workspace/recruiter/candidates/${row.va_id}`}>Review</Link></td></tr>}):<tr><td colSpan={8}><div className="empty">No candidates are waiting for recruiter review.</div></td></tr>}</tbody></table></div>
    </form>
  </>;
}
