import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { dateShort } from "@/lib/format";

export default async function RecruiterLeadsPage(){
  await requireRole("recruiter");
  const {data:leads}=await createAdminClient().from("lead_intake").select("id,name,email,company,service,status,job_id,created_at,message").order("created_at",{ascending:false}).limit(100);
  return <><div className="page-head"><div><h1>Client leads</h1><p>Recent hiring enquiries. Converted leads can be matched through their linked role.</p></div></div><div className="table-wrap responsive-table"><table><thead><tr><th>Lead</th><th>Need</th><th>Status</th><th>Received</th><th></th></tr></thead><tbody>{(leads||[]).map((lead:any)=><tr key={lead.id}><td data-label="Lead"><strong>{lead.name||lead.email}</strong><div className="small muted">{lead.company||lead.email}</div></td><td data-label="Need">{lead.service||"VA support"}<div className="small muted clamp-2">{lead.message||""}</div></td><td data-label="Status"><span className={`badge ${lead.status==="new"?"badge-warning":lead.status==="converted"?"badge-success":""}`}>{lead.status}</span></td><td data-label="Received">{dateShort(lead.created_at)}</td><td data-label="Action">{lead.job_id?<Link className="btn btn-sm btn-primary" href={`/workspace/recruiter/matching/${lead.job_id}`}>Match role</Link>:<span className="small muted">Awaiting job conversion</span>}</td></tr>)}</tbody></table></div></>;
}
