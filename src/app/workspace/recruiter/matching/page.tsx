import Link from "next/link";
import { Search } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { candidateAccessLabel } from "@/lib/candidate-access";
import { dateShort } from "@/lib/format";

function norm(value: unknown){return String(value||"").trim().toLowerCase().replace(/\s+/g," ")}

export default async function RecruiterMatchingPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
  await requireRole("recruiter");const params=await searchParams;const view=String(params.view||"needs_candidates");const q=norm(params.q);const admin=createAdminClient();
  const [{data:jobs},{data:shortlist},{data:apps},{data:access}]=await Promise.all([
    admin.from("jobs").select("id,title,company_name,status,categories,created_at,updated_at,client_id,closed_at").order("created_at",{ascending:false}).limit(400),
    admin.from("job_shortlist_candidates").select("job_id,shortlist_status"),
    admin.from("applications").select("job_id,status"),
    admin.from("job_candidate_access").select("job_id,access_status")
  ]);
  const sm=new Map<string,{proposed:number;released:number}>();for(const r of shortlist||[]){const c=sm.get(r.job_id)||{proposed:0,released:0};if(r.shortlist_status==="proposed")c.proposed++;if(r.shortlist_status==="released")c.released++;sm.set(r.job_id,c)}
  const am=new Map<string,Record<string,number>>();for(const r of apps||[]){const c=am.get(r.job_id)||{};c[r.status]=(c[r.status]||0)+1;am.set(r.job_id,c)}
  const accessMap=new Map((access||[]).map((r:any)=>[r.job_id,r.access_status]));
  const seen=new Set<string>();let duplicateCount=0;
  const deduped=(jobs||[]).filter((job:any)=>{const key=`${job.client_id||norm(job.company_name)||"lead"}::${norm(job.title)}`;if(seen.has(key)){duplicateCount++;return false}seen.add(key);return true});
  const staleCutoff=Date.now()-90*86400000;
  const rows=deduped.filter((job:any)=>{const s=sm.get(job.id)||{proposed:0,released:0};const a=am.get(job.id)||{};const totalApps=Object.values(a).reduce((x,y)=>x+y,0);const hired=(a.hired||0)>0;const active=["pending","published"].includes(job.status);const stale=active&&new Date(job.updated_at||job.created_at).getTime()<staleCutoff;let ok=true;
    if(view==="needs_candidates")ok=active&&!stale&&!hired&&s.proposed+s.released+totalApps===0;
    else if(view==="assigned")ok=active&&!hired&&(s.proposed+s.released)>0;
    else if(view==="waiting_client")ok=active&&!hired&&(s.released>0||(a.interview||0)>0||(a.offered||0)>0);
    else if(view==="applications")ok=active&&!hired&&totalApps>0;
    else if(view==="filled")ok=hired;
    else if(view==="closed")ok=job.status==="closed"||stale;
    else if(view==="all")ok=true;
    else ok=active&&!stale&&!hired;
    if(q){const hay=[job.title,job.company_name,...(job.categories||[])].map(norm).join(" ");ok=ok&&hay.includes(q)}return ok});
  const tabs=[["needs_candidates","Needs candidates"],["assigned","Candidates assigned"],["waiting_client","Waiting on client"],["applications","Applications"],["filled","Filled"],["closed","Closed / stale"],["all","All roles"]] as const;
  return <><div className="page-head"><div><div className="kicker">Recruiter role board</div><h1>Role matching</h1><p>Closed, stale, filled, and duplicate roles are out of the way by default. Work only the roles that need a decision.</p></div></div><section className="matching-board-guide"><span>1. Open a role</span><span>2. Review recommended Virtual Assistants</span><span>3. Release a shortlist</span><span>4. Follow up with the client</span></section>
    <form className="directory-filterbar recruiter-directory-filters" method="get"><div className="directory-filter-search"><Search size={16}/><input name="q" defaultValue={params.q} placeholder="Search role, company, category"/></div><select name="view" defaultValue={view}>{tabs.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select><button className="btn btn-primary" type="submit">Filter</button><Link className="btn" href="/workspace/recruiter/matching">Reset</Link></form>
    <div className="role-filter-tabs">{tabs.map(([v,l])=><Link key={v} href={`/workspace/recruiter/matching?view=${v}`} className={view===v?"active":""}>{l}</Link>)}</div>
    <div className="row-between wrap" style={{margin:"14px 0"}}><span className="small muted"><strong>{rows.length}</strong> role{rows.length===1?"":"s"} in this view</span>{duplicateCount?<span className="small muted">{duplicateCount} obvious duplicate role{duplicateCount===1?"":"s"} hidden</span>:null}</div>
    <div className="table-wrap responsive-table"><table><thead><tr><th>Role</th><th>Queue</th><th>Candidates</th><th>Applications</th><th>Client access</th><th>Submitted</th><th></th></tr></thead><tbody>{rows.length?rows.map((job:any)=>{const s=sm.get(job.id)||{proposed:0,released:0};const a=am.get(job.id)||{};const total=Object.values(a).reduce((x,y)=>x+y,0);const hired=(a.hired||0)>0;const label=job.status==="closed"?"Closed":hired?"Filled":s.released>0?"Waiting on client":s.proposed>0?"Candidates assigned":total>0?"Applications":"Needs candidates";return <tr key={job.id}><td data-label="Role"><Link className="text-link" href={`/workspace/recruiter/matching/${job.id}`}><strong>{job.title}</strong></Link><div className="small muted">{job.company_name|| (job.client_id?"Client role":"Lead awaiting signup")}</div></td><td data-label="Queue"><span className={`badge ${label==="Needs candidates"?"badge-warning":label==="Filled"?"badge-success":""}`}>{label}</span></td><td data-label="Candidates"><strong>{s.proposed+s.released}</strong><div className="small muted">{s.proposed} internal · {s.released} released</div></td><td data-label="Applications"><strong>{total}</strong><div className="small muted">{a.new||0} new · {a.interview||0} interview · {a.offered||0} offered</div></td><td data-label="Client access"><span className="small">{candidateAccessLabel(accessMap.get(job.id))}</span></td><td data-label="Submitted">{dateShort(job.created_at)}</td><td data-label="Action"><Link className="btn btn-sm btn-primary" href={`/workspace/recruiter/matching/${job.id}`}>{s.proposed+s.released+total?"Manage role":"Find Matching VAs"}</Link></td></tr>}):<tr><td colSpan={7}><div className="empty">No roles in this view.</div></td></tr>}</tbody></table></div>
  </>;
}
