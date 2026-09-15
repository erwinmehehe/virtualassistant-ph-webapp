import Link from "next/link";
import { Mail } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateLeadStatusAction } from "@/app/actions/recruiter";
import { dateShort } from "@/lib/format";

const TYPE_LABEL:Record<string,string>={va_support:"VA support",client_support:"Client support",privacy:"Privacy / data",general:"General enquiry",client_hiring:"Client hiring"};

export default async function AdminLeadsPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
  const params=await searchParams;
  await requireRole("admin");
  const admin=createAdminClient();
  const showHiring=params.view==="hiring";
  const {data:leads,error}=showHiring
    ? await admin.from("lead_intake").select("*").eq("lead_type","client_hiring").order("created_at",{ascending:false}).limit(100)
    : await admin.from("lead_intake").select("*").neq("lead_type","client_hiring").order("created_at",{ascending:false}).limit(100);
  if(error)throw error;
  const rows=leads||[];
  const open=rows.filter((lead:any)=>!['archived','lost','won'].includes(String(lead.status||lead.crm_stage||''))).length;

  return <>
    <div className="page-head"><div><div className="kicker">Agency inbox routing</div><h1>{showHiring?"Client hiring audit":"Support & other enquiries"}</h1><p>{showHiring?"Read-only operational oversight of hiring leads. Recruiters own follow-up, discovery, qualification, and conversion.":"VA support, client-account support, privacy requests, and general contact messages stay out of recruiter My Day."}</p></div><div className="row wrap"><Link className={`btn ${!showHiring?"btn-primary":""}`} href="/workspace/admin/leads">Support inbox</Link><Link className={`btn ${showHiring?"btn-primary":""}`} href="/workspace/admin/leads?view=hiring">Hiring audit</Link></div></div>

    <div className="grid-2" style={{marginBottom:18}}><div className="card"><span className="small muted">Items shown</span><strong style={{display:"block",fontSize:28,marginTop:4}}>{rows.length}</strong></div><div className="card"><span className="small muted">Open</span><strong style={{display:"block",fontSize:28,marginTop:4}}>{open}</strong></div></div>

    {!showHiring?<div className="info-banner" style={{marginBottom:18}}><strong>Recruiters no longer receive these in their sales queue.</strong><p style={{margin:"6px 0 0"}}>Hiring forms route to recruiter CRM. Contact/support/privacy forms remain here for admin handling.</p></div>:null}

    <div className="stack">{rows.length?rows.map((lead:any)=><article className="card" key={lead.id}>
      <div className="row-between wrap"><div><div className="row wrap"><span className={`badge ${lead.lead_type==="client_hiring"?"badge-success":lead.lead_type==="privacy"?"badge-warning":""}`}>{TYPE_LABEL[lead.lead_type]||lead.lead_type}</span><span className="badge">{String(lead.crm_stage||lead.status||"new").replaceAll("_"," ")}</span><span className="small muted">{dateShort(lead.created_at)}</span></div><h3 style={{margin:"8px 0 3px"}}>{lead.service||"General enquiry"}</h3><div className="small muted">{lead.company||lead.name||lead.email}</div></div><div className="row wrap"><a className="btn btn-sm" href={`mailto:${lead.email}`}><Mail size={14}/> Email</a>{showHiring&&lead.job_id?<Link className="btn btn-sm" href={`/workspace/recruiter/matching/${lead.job_id}`}>Open recruiter role</Link>:null}</div></div>
      <p style={{whiteSpace:"pre-wrap"}}>{lead.message||"No message provided."}</p>
      <div className="small muted"><strong>Contact:</strong> {lead.name||""}{lead.name?" · ":""}<a className="text-link" href={`mailto:${lead.email}`}>{lead.email}</a>{lead.phone?` · ${lead.phone}`:""}{lead.source_page?` · source: ${lead.source_page}`:""}</div>
      {!showHiring?<form action={updateLeadStatusAction} style={{marginTop:12}}><input type="hidden" name="lead_id" value={lead.id}/><input type="hidden" name="status" value={lead.status==="archived"?"new":"archived"}/><button className="btn btn-sm" type="submit">{lead.status==="archived"?"Reopen":"Archive"}</button></form>:null}
    </article>):<div className="card empty">{showHiring?"No hiring leads found.":"No support enquiries waiting."}</div>}</div>
  </>;
}
