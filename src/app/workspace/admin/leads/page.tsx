import Link from "next/link";
import { Mail } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateLeadStatusAction } from "@/app/actions/recruiter";
import { recruiterCleanupLeadAction } from "@/app/actions/recruiter-cleanup";
import { dateShort } from "@/lib/format";

const TYPE_LABEL:Record<string,string>={va_support:"VA support",client_support:"Client support",privacy:"Privacy / data",general:"General enquiry",client_hiring:"Client hiring"};
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CLOSED_HIRING_STAGES=new Set(["won","lost"]);

export default async function AdminLeadsPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
  const params=await searchParams;
  await requireRole("admin");
  const admin=createAdminClient();
  const showHiring=params.view==="hiring";
  const q=String(params.q||"").trim();

  let query=admin.from("lead_intake").select("*");
  query=showHiring?query.eq("lead_type","client_hiring"):query.neq("lead_type","client_hiring");
  if(q){
    if(UUID.test(q)) query=query.eq("id",q);
    else {
      const safe=q.replace(/[,%()]/g," ").trim();
      if(safe) query=query.or(`name.ilike.%${safe}%,email.ilike.%${safe}%,company.ilike.%${safe}%,service.ilike.%${safe}%`);
    }
  }
  const {data:leads,error}=await query.order("created_at",{ascending:false}).limit(100);
  if(error)throw error;
  const rows=leads||[];
  const hiringOpen=(lead:any)=>!CLOSED_HIRING_STAGES.has(String(lead.crm_stage||"new"));
  const open=rows.filter((lead:any)=>showHiring?hiringOpen(lead):lead.status!=="archived").length;
  const returnTo=(leadId:string)=>`/workspace/admin/leads?view=hiring&q=${encodeURIComponent(leadId)}`;

  return <>
    {params.cleanup_saved?<div className="success-banner">Lead follow-up updated and tracked.</div>:null}
    {params.cleanup_error?<div className="alert" role="alert">{params.cleanup_error}</div>:null}
    <div className="page-head"><div><div className="kicker">Agency inbox routing</div><h1>{showHiring?"Client hiring oversight":"Support & other enquiries"}</h1><p>{showHiring?"Owner-safe hiring oversight. Recruiters can run the normal CRM, while Admin can review an exact lead and send a tracked follow-up without entering recruiter-only routes.":"VA support, client-account support, privacy requests, and general contact messages stay out of recruiter My Day."}</p></div><div className="row wrap"><Link className={`btn ${!showHiring?"btn-primary":""}`} href="/workspace/admin/leads">Support inbox</Link><Link className={`btn ${showHiring?"btn-primary":""}`} href="/workspace/admin/leads?view=hiring">Hiring oversight</Link></div></div>

    <div className="grid-2" style={{marginBottom:18}}><div className="card"><span className="small muted">Items shown</span><strong style={{display:"block",fontSize:28,marginTop:4}}>{rows.length}</strong></div><div className="card"><span className="small muted">Open</span><strong style={{display:"block",fontSize:28,marginTop:4}}>{open}</strong></div></div>

    <form method="get" className="card row wrap" style={{marginBottom:18}}>
      {showHiring?<input type="hidden" name="view" value="hiring"/>:null}
      <input name="q" defaultValue={q} placeholder={showHiring?"Search name, company, email, service, or lead ID":"Search enquiries"} style={{flex:"1 1 320px"}}/>
      <button className="btn btn-primary" type="submit">Search</button>
      {q?<Link className="btn" href={showHiring?"/workspace/admin/leads?view=hiring":"/workspace/admin/leads"}>Clear</Link>:null}
    </form>

    {!showHiring?<div className="info-banner" style={{marginBottom:18}}><strong>Recruiters no longer receive these in their sales queue.</strong><p style={{margin:"6px 0 0"}}>Hiring forms route to recruiter CRM. Contact/support/privacy forms remain here for admin handling.</p></div>:null}

    <div className="stack">{rows.length?rows.map((lead:any)=><article className="card" key={lead.id}>
      <div className="row-between wrap"><div><div className="row wrap"><span className={`badge ${lead.lead_type==="client_hiring"?"badge-success":lead.lead_type==="privacy"?"badge-warning":""}`}>{TYPE_LABEL[lead.lead_type]||lead.lead_type}</span><span className="badge">{String(lead.crm_stage||lead.status||"new").replaceAll("_"," ")}</span><span className="small muted">{dateShort(lead.created_at)}</span></div><h3 style={{margin:"8px 0 3px"}}>{lead.service||"General enquiry"}</h3><div className="small muted">{lead.company||lead.name||lead.email}</div></div>
      <div className="row wrap">
        {showHiring?(hiringOpen(lead)?<><form action={recruiterCleanupLeadAction}><input type="hidden" name="lead_id" value={lead.id}/><input type="hidden" name="cleanup_action" value="send_followup"/><input type="hidden" name="return_to" value={returnTo(lead.id)}/><button className="btn btn-primary btn-sm" type="submit">Send tracked follow-up</button></form><form action={recruiterCleanupLeadAction}><input type="hidden" name="lead_id" value={lead.id}/><input type="hidden" name="cleanup_action" value="follow_up_later"/><input type="hidden" name="return_to" value={returnTo(lead.id)}/><button className="btn btn-sm" type="submit">Follow up in 3 days</button></form>{lead.job_id?<Link className="btn btn-sm" href={`/workspace/admin/jobs/${lead.job_id}`}>Open role</Link>:null}</>:<span className="small muted">Closed lead · no follow-up action</span>):<a className="btn btn-sm" href={`mailto:${lead.email}`}><Mail size={14}/> Email</a>}
      </div></div>
      <p style={{whiteSpace:"pre-wrap"}}>{lead.message||"No message provided."}</p>
      <div className="small muted"><strong>Contact:</strong> {lead.name||""}{lead.name?" · ":""}{lead.email}{lead.phone?` · ${lead.phone}`:""}{lead.source_page?` · source: ${lead.source_page}`:""}</div>
      {!showHiring?<form action={updateLeadStatusAction} style={{marginTop:12}}><input type="hidden" name="lead_id" value={lead.id}/><input type="hidden" name="status" value={lead.status==="archived"?"new":"archived"}/><button className="btn btn-sm" type="submit">{lead.status==="archived"?"Reopen":"Archive"}</button></form>:null}
    </article>):<div className="card empty">{showHiring?(q?"No hiring lead matches this search.":"No hiring leads found."):"No support enquiries waiting."}</div>}</div>
  </>;
}
