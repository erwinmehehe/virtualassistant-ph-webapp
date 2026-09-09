import { FOLLOW_UP_VIEWS, followUpView, philippineDate, leadQueueHref, followUpLabel } from "@/lib/lead-follow-ups";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { convertLeadToJobAction } from "@/app/actions/admin";
import { updateLeadPipelineAction } from "@/app/actions/agency-leads";
import { LEAD_STAGES, isLeadStage } from "@/lib/agency-pipeline";
import { dateShort } from "@/lib/format";

export default async function AdminLeadsPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}) {
  await requireRole("admin");
  const params=await searchParams;
  const stage=isLeadStage(params.stage||"")?params.stage:"";
  const follow=followUpView(params.follow);
  const today=philippineDate();
  const page=Math.max(1,Math.min(10000,Math.floor(Number(params.page)||1)));
  let query=createAdminClient().from("lead_intake").select("*",{count:"exact"}).neq("status","archived");
  if(stage) query=query.eq("sales_stage",stage);
  if(follow) {
    query=query.not("sales_stage","in","(won,lost)");
    if(follow==="due") query=query.lte("follow_up_on",today);
    if(follow==="today") query=query.eq("follow_up_on",today);
    if(follow==="overdue") query=query.lt("follow_up_on",today);
    if(follow==="unscheduled") query=query.is("follow_up_on",null);
    query=query.order("follow_up_on",{ascending:true,nullsFirst:false});
  }
  if(params.lead&&/^[0-9a-f-]{36}$/i.test(params.lead)) query=query.eq("id",params.lead);
  const {data:leads,count,error}=await query.order("created_at",{ascending:false}).order("id").range((page-1)*30,page*30-1);
  const hasPipeline=leads?.every(lead=>"sales_stage" in lead)??true;
  const pageHref=(next:number)=>leadQueueHref(stage,follow,next);
  return <>
    <div className="page-head agency-page-head"><div><div className="kicker">Employer relationships</div><h1>Lead inbox</h1><p>Qualify the work, agree the next step, and keep the conversation moving.</p></div><Link className="btn" href="/workspace/admin">Agency overview</Link></div>
    {params.saved?<div className="success-banner" role="status">Lead updated. Your next step is saved.</div>:null}
    {params.error?<div className="alert" role="alert">{params.error}</div>:null}
    {!hasPipeline?<div className="alert" role="alert">Sales tracking is not available yet. Complete the agency lead pipeline database migration before editing stages or follow-ups.</div>:null}
    <nav className="agency-filter-tabs" aria-label="Filter lead stage"><Link href={leadQueueHref("",follow)} aria-current={!stage?"page":undefined}>All enquiries</Link>{LEAD_STAGES.map(([value,label])=><Link key={value} href={leadQueueHref(value,follow)} aria-current={stage===value?"page":undefined}>{label}</Link>)}</nav>
    <nav className="agency-filter-tabs" aria-label="Filter follow-ups"><Link href={leadQueueHref(stage)} aria-current={!follow?"page":undefined}>Any follow-up date</Link>{FOLLOW_UP_VIEWS.map(([value,label])=><Link key={value} href={leadQueueHref(stage,value)} aria-current={follow===value?"page":undefined}>{label}</Link>)}</nav>
    {follow?<p className="small muted">Open conversations only; won and lost leads are excluded. Earliest follow-ups appear first.</p>:null}
    <p className="small muted">{error?"Could not load enquiries.":`${count||0} enquiries${stage?" in this stage":""}`} · Follow-up dates use Philippine time</p>
    <div className="stack">{error?<div className="card empty" role="alert">The lead pipeline could not be loaded. Refresh the page or check database setup.</div>:leads?.length?leads.map(lead=><article className="card agency-lead" id={`lead-${lead.id}`} key={lead.id}>
      <div className="agency-lead-brief"><div className="row wrap"><span className="badge">{LEAD_STAGES.find(([value])=>value===lead.sales_stage)?.[1]||"New enquiry"}</span><span className="small muted">Received {dateShort(lead.created_at)}</span></div><span className="small muted">{followUpLabel(lead.follow_up_on,lead.sales_stage,today)}</span><h2>{lead.company||lead.name||"Employer enquiry"}</h2><strong>{lead.service||"VA hiring request"}</strong><p className="small muted">{lead.hours||"Hours to confirm"} · {lead.timezone||"Timezone to confirm"}</p><p className="lead-message">{lead.message||"Discuss the workload with this employer."}</p><div className="lead-contact"><span>{lead.name}</span><a className="text-link" href={`mailto:${lead.email}`}>{lead.email}</a>{lead.phone?<span>{lead.phone}</span>:null}</div><div className="row wrap" style={{marginTop:18}}>{lead.job_id?<Link className="btn" href={`/workspace/admin/jobs/${lead.job_id}`}>Open hiring brief →</Link>:lead.status==="new"?<form action={convertLeadToJobAction}><input type="hidden" name="lead_id" value={lead.id}/><button className="btn" type="submit">Create hiring brief</button></form>:null}</div></div>
      <form action={updateLeadPipelineAction} className="agency-lead-next stack"><strong>Next step</strong><input type="hidden" name="lead_id" value={lead.id}/><input type="hidden" name="return_stage" value={stage}/><input type="hidden" name="return_follow" value={follow}/><div className="field"><label htmlFor={`stage-${lead.id}`}>Sales stage</label><select id={`stage-${lead.id}`} name="sales_stage" defaultValue={lead.sales_stage||"new"}>{LEAD_STAGES.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></div><div className="field"><label htmlFor={`follow-${lead.id}`}>Next follow-up date</label><input id={`follow-${lead.id}`} type="date" name="follow_up_on" defaultValue={lead.follow_up_on||""}/><span className="small muted">Cleared when marked won or lost.</span></div><div className="field"><label htmlFor={`notes-${lead.id}`}>Private sales notes</label><textarea id={`notes-${lead.id}`} name="sales_notes" rows={3} maxLength={4000} defaultValue={lead.sales_notes||""} placeholder="Budget confirmed? Who decides? What happens next?"/></div><button className="btn btn-primary" type="submit" disabled={!hasPipeline}>Save next step</button></form>
    </article>):<div className="card agency-empty"><h2>No enquiries in this view</h2><p>New employer requests will appear here. Check the other stages for existing conversations.</p><Link className="btn" href="/workspace/admin/leads">View all enquiries</Link></div>}</div>
    {(count||0)>30?<div className="row-between" style={{marginTop:24}}>{page>1?<Link className="btn" href={pageHref(page-1)}>Previous</Link>:<span/>}<span className="small">Page {page} of {Math.ceil((count||0)/30)}</span>{page*30<(count||0)?<Link className="btn" href={pageHref(page+1)}>Next</Link>:<span/>}</div>:null}
  </>;
}
