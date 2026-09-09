import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { convertLeadToJobAction } from "@/app/actions/admin";
import { dateShort } from "@/lib/format";

export default async function AdminLeadsPage(){
  await requireRole("admin");
  const admin=createAdminClient();
  const [{data:leads},{data:clients}]=await Promise.all([
    admin.from("lead_intake").select("*").order("created_at",{ascending:false}).limit(100),
    admin.from("profiles").select("id,full_name,client_profiles(company_name)").eq("role","client").order("full_name")
  ]);
  return <><div className="page-head"><div><h1>Lead inbox</h1><p>Contact new enquiries directly, then move the hiring request into a private job draft when the client is ready.</p></div></div><div className="stack">{leads?.length?leads.map((lead:any)=><div className="card" key={lead.id}><div className="row-between wrap"><div><div className="row wrap"><span className="badge">{lead.status}</span><span className="small muted">{dateShort(lead.created_at)}</span>{lead.job_id?<span className="badge badge-success">Job draft created</span>:null}</div><h3 style={{margin:"8px 0 3px"}}>{lead.service||"VA request"}</h3><div className="small muted">{lead.company||lead.name||"Lead"} · {lead.hours||"Hours not set"} · {lead.timezone||"Timezone not set"}</div></div><div className="row wrap"><a className="btn btn-sm" href={`mailto:${lead.email}?subject=${encodeURIComponent(`Your VirtualAssistant.com.ph enquiry${lead.service?` - ${lead.service}`:""}`)}`}><Mail size={14}/> Email client</a>{lead.phone?<a className="btn btn-sm" href={`tel:${String(lead.phone).replace(/[^+\d]/g,"")}`}><Phone size={14}/> Call</a>:null}{lead.job_id?<Link className="btn btn-sm" href={`/workspace/admin/jobs/${lead.job_id}`}>Open job draft</Link>:lead.status==="new"?<form action={convertLeadToJobAction} className="row wrap"><input type="hidden" name="lead_id" value={lead.id}/><select name="client_id" style={{border:"1px solid var(--line)",borderRadius:8,padding:"8px 9px"}}><option value="">No client account yet</option>{(clients||[]).map((c:any)=><option key={c.id} value={c.id}>{c.client_profiles?.company_name||c.full_name||c.id}</option>)}</select><button className="btn btn-primary btn-sm" type="submit">Create pending job</button></form>:null}</div></div><p>{lead.message||"No message provided."}</p><div className="small muted"><strong>Private contact:</strong> {lead.name||""} · <a className="text-link" href={`mailto:${lead.email}`}>{lead.email}</a>{lead.phone?<> · <a className="text-link" href={`tel:${String(lead.phone).replace(/[^+\d]/g,"")}`}>{lead.phone}</a></>:null}</div></div>):<div className="card empty">No leads received yet.</div>}</div></>;
}
