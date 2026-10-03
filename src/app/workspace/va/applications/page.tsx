import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3 } from "lucide-react";
import { requireRoleFast } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { dateShort } from "@/lib/format";
import { respondToInviteAction, withdrawApplicationAction } from "@/app/actions/applications";
import { jobPublicHref } from "@/lib/public-routing";

const ACTIVE_STAGES=["new","reviewing","shortlisted","interview","offered","hired"] as const;

function stageLabel(status: string) {
  const labels: Record<string, string> = {
    new: "Recruiter review",
    reviewing: "Recruiter review",
    shortlisted: "Presented to client",
    interview: "Interview",
    offered: "Offer",
    hired: "Placed",
    rejected: "Closed",
    withdrawn: "Withdrawn",
  };
  return labels[status] || String(status).replaceAll("_", " ");
}

function stageIndex(status:string){
  if(status==="reviewing")return 0;
  return Math.max(0,ACTIVE_STAGES.indexOf(status as any));
}

function nextStep(status:string){
  if(status==="new"||status==="reviewing")return {copy:"Your recruiter is reviewing fit before client presentation.",label:"No action needed",href:null};
  if(status==="shortlisted")return {copy:"You were presented to the client. Your recruiter will coordinate the next step.",label:"Waiting on client",href:null};
  if(status==="interview")return {copy:"Check your interview schedule and meeting details.",label:"Open interview",href:"/workspace/va/interviews"};
  if(status==="offered")return {copy:"Review the final placement terms before accepting.",label:"Review offer",href:"/workspace/va/offers"};
  if(status==="hired")return {copy:"Your placement is active. Continue in My Placement.",label:"Open placement",href:"/workspace/va/workroom"};
  if(status==="rejected")return {copy:"This opportunity closed without placement.",label:"Closed",href:null};
  if(status==="withdrawn")return {copy:"You withdrew from this opportunity.",label:"Withdrawn",href:null};
  return {copy:"Your recruiter will update the next step here.",label:"View role",href:null};
}

export default async function VaApplicationsPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
  const params=await searchParams;
  const {userId}=await requireRoleFast("va");
  const supabase=await createClient();

  const [{data:apps},{data:invites}]=await Promise.all([
    supabase.from("applications").select("*,jobs(id,slug,title,company_name,status)").eq("va_id",userId).order("applied_at",{ascending:false}),
    supabase.from("job_invites").select("*,jobs(id,slug,title,company_name,hours_per_week,min_hourly_rate)").eq("va_id",userId).order("created_at",{ascending:false}),
  ]);

  const pendingInvites=(invites||[]).filter((invite:any)=>invite.status==="pending");
  const activeApps=(apps||[]).filter((application:any)=>!["rejected","withdrawn","hired"].includes(application.status));
  const historyApps=(apps||[]).filter((application:any)=>["rejected","withdrawn","hired"].includes(application.status));

  return <div className="va-applications-page va-applications-hub">
    {params.applied === "1"?<div className="success-banner" role="status"><CheckCircle2 size={17}/> Application submitted. The job poster has been notified and your application is now in recruiter review.</div>:null}
    {params.applied === "already"?<div className="alert" role="status">You already applied to this role. You can track it below.</div>:null}
    {params.interest==="1"?<div className="success-banner" role="status"><CheckCircle2 size={17}/> Application submitted. Your application is now in recruiter review.</div>:null}
    {params.interest==="already"?<div className="alert" role="status">You already applied to this role.</div>:null}
    {params.invite?<div className="success-banner" role="status">Interview request {params.invite}.{params.invite==="accepted"?" The recruiting team can now coordinate the next step.":" The recruiting team has been updated."}</div>:null}

    <div className="va-jobs-head va-applications-head">
      <div><div className="kicker">Your hiring journey</div><h1>Applications</h1><p>Every role in one place, from recruiter review to interview, offer and placement.</p></div>
      <Link className="btn btn-primary btn-sm" href="/workspace/va/jobs">Find jobs</Link>
    </div>

    {pendingInvites.length?<section className="va-application-section va-application-invites" aria-labelledby="opportunities-title">
      <div className="va-application-section-head"><div><span className="badge badge-warning">{pendingInvites.length} waiting</span><h2 id="opportunities-title">Recruiter-approved opportunities</h2><p>Respond here before the recruiting team moves the role forward.</p></div></div>
      <div className="va-request-list">{pendingInvites.map((invite:any)=><article className="va-request-row" key={invite.id}>
        <div><strong>{invite.jobs?.title}</strong><span>{invite.jobs?.company_name||"Confidential client"}</span>{invite.note?<p>{invite.note}</p>:null}</div>
        <div className="va-request-actions">
          <form action={respondToInviteAction}><input type="hidden" name="invite_id" value={invite.id}/><button className="btn btn-primary btn-sm" name="decision" value="accepted">Continue</button></form>
          <form action={respondToInviteAction}><input type="hidden" name="invite_id" value={invite.id}/><button className="btn btn-sm" name="decision" value="declined">Decline</button></form>
        </div>
      </article>)}</div>
    </section>:null}

    <section className="va-application-section" aria-labelledby="active-applications-title">
      <div className="va-application-section-head"><div><h2 id="active-applications-title">Active applications</h2><p>Your current roles and the next step for each one.</p></div>{activeApps.length?<span className="badge">{activeApps.length} active</span>:null}</div>

      {activeApps.length?<div className="va-application-list va-application-timeline-list">{activeApps.map((application:any)=>{
        const current=stageIndex(application.status);
        const next=nextStep(application.status);
        return <article className="va-application-card" key={application.id}>
          <div className="va-application-card-head">
            <div><div className="row wrap"><span className={`badge ${application.status==="interview"||application.status==="offered"?"badge-warning":""}`}>{stageLabel(application.status)}</span><span className="small muted">Applied {dateShort(application.applied_at)}</span></div><h3>{application.jobs?.title}</h3><p>{application.jobs?.company_name||"Confidential client"}</p></div>
            <Link className="btn btn-sm" href={jobPublicHref(application.jobs||{id:application.job_id})}>View role</Link>
          </div>

          <div className="va-application-stage-track" aria-label={`Application stage: ${stageLabel(application.status)}`}>
            {["Recruiter review","Client review","Interview","Offer","Placed"].map((label,index)=>{
              const normalizedCurrent=Math.max(0,Math.min(4,current-(application.status==="new"||application.status==="reviewing"?0:1)));
              return <div className={index<normalizedCurrent?"done":index===normalizedCurrent?"current":""} key={label}><span>{index<normalizedCurrent?"✓":index+1}</span><small>{label}</small></div>;
            })}
          </div>

          <div className="va-application-next">
            <div><span className="small">What happens next</span><strong>{next.copy}</strong></div>
            {next.href?<Link className="btn btn-primary btn-sm" href={next.href}>{next.label}<ArrowRight size={14}/></Link>:<span className="va-application-waiting"><Clock3 size={14}/>{next.label}</span>}
          </div>

          {!["hired","rejected","withdrawn"].includes(application.status)?<details className="va-application-secondary-actions"><summary>More actions</summary><form action={withdrawApplicationAction}><input type="hidden" name="application_id" value={application.id}/><button className="btn btn-sm btn-danger" type="submit">Withdraw application</button></form></details>:null}
        </article>;
      })}</div>:<div className="workspace-empty-card"><h2>No active applications</h2><p>Browse open roles and apply when you find a strong fit.</p><div className="workspace-empty-actions row"><Link href="/workspace/va/jobs" className="btn btn-primary">Find jobs</Link></div></div>}
    </section>

    {historyApps.length?<details className="va-application-history">
      <summary>Past applications ({historyApps.length})</summary>
      <div className="va-application-list">{historyApps.map((application:any)=><article className="va-application-row" key={application.id}><div className="va-application-role"><strong>{application.jobs?.title}</strong><span>{application.jobs?.company_name||"Confidential client"}</span></div><div className="va-application-status"><span className={`badge ${application.status==="hired"?"badge-success":""}`}>{stageLabel(application.status)}</span><small>Since {dateShort(application.applied_at)}</small></div><div className="va-application-actions"><Link className="btn btn-sm" href={jobPublicHref(application.jobs||{id:application.job_id})}>View role</Link></div></article>)}</div>
    </details>:null}
  </div>;
}
