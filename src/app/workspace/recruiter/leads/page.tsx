import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { dateShort } from "@/lib/format";

export default async function RecruiterLeadsPage(){
  await requireRole("recruiter");
  const {data:leads}=await createAdminClient().from("lead_intake").select("id,name,email,phone,company,service,status,job_id,created_at,message").order("created_at",{ascending:false}).limit(100);
  return <><div className="page-head"><div><h1>Client leads</h1><p>Recent hiring enquiries. Contact the client directly, then move converted leads into matching through their linked role.</p></div></div><div className="table-wrap responsive-table"><table><thead><tr><th>Lead</th><th>Need</th><th>Status</th><th>Received</th><th>Contact</th><th></th></tr></thead><tbody>{(leads||[]).map((lead:any)=><tr key={lead.id}><td data-label="Lead"><strong>{lead.name||lead.email}</strong><div className="small muted">{lead.company||lead.email}</div></td><td data-label="Need">{lead.service||"Virtual Assistant support"}<div className="small muted clamp-2">{lead.message||""}</div></td><td data-label="Status"><span className={`badge ${lead.status==="new"?"badge-warning":lead.status==="converted"?"badge-success":""}`}>{lead.status}</span></td><td data-label="Received">{dateShort(lead.created_at)}</td><td data-label="Contact"><div className="row wrap"><a className="btn btn-sm" href={`mailto:${lead.email}?subject=${encodeURIComponent(`Your VirtualAssistant.com.ph enquiry${lead.service?` - ${lead.service}`:""}`)}`}><Mail size={14}/> Email</a>{lead.phone?<a className="btn btn-sm" href={`tel:${String(lead.phone).replace(/[^+\d]/g,"")}`}><Phone size={14}/> Call</a>:null}</div></td><td data-label="Action">{lead.job_id?<Link className="btn btn-sm btn-primary" href={`/workspace/recruiter/matching/${lead.job_id}`}>Match role</Link>:<span className="small muted">Awaiting job conversion</span>}</td></tr>)}</tbody></table></div></>;
}
