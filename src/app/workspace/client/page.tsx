import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CalendarDays, LifeBuoy, Plus, Sparkles, UserRoundCheck } from "lucide-react";
import { requireRoleFast } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { OnboardingChecklist } from "@/components/onboarding-checklist";
import { collectQueryIssues } from "@/lib/query-health";
import { DashboardDegradedNotice } from "@/components/dashboard-degraded-notice";
import { getClientDashboardSummary } from "@/lib/client-dashboard";
import { createAdminClient } from "@/lib/supabase/admin";
import { openClientDiscoveryBookingAction } from "@/app/actions/booking";

type AttentionItem={title:string;copy:string;href:string;count:number;icon:typeof Sparkles};

export default async function ClientDashboardPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
  const params=await searchParams;
  const {userId}=await requireRoleFast("client");
  const supabase=await createClient();
  const admin=createAdminClient();
  const discoveryPromise=admin.from("lead_intake")
    .select("id,created_at,discovery_scheduled_at,discovery_outcome,discovery_cancelled_at,discovery_meeting_url")
    .eq("client_id",userId)
    .eq("lead_type","client_hiring")
    .order("created_at",{ascending:false})
    .limit(20);
  const requestedPromise=params.talent
    ? supabase.from("public_va_directory").select("slug,full_name,headline,primary_category").eq("slug",params.talent).maybeSingle()
    : Promise.resolve({data:null,error:null} as any);

  const [dashboardResult,{data:requested,error:requestedError},{data:discoveryRows,error:discoveryError}]=await Promise.all([getClientDashboardSummary(userId),requestedPromise,discoveryPromise]);
  const discoveryBooking=(discoveryRows||[]).find((row:any)=>Boolean(row.discovery_scheduled_at)||["no_show","cancelled","rescheduled"].includes(String(row.discovery_outcome||"")))||null;
  const dashboard=dashboardResult.data;
  const company=dashboard?.company||{};
  const hiringOwner=dashboard?.hiring_owner||null;
  const jobRows=dashboard?.jobs||[];
  const jobCount=Number(dashboard?.job_count||0);
  if(!dashboardResult.error&&!company?.onboarding_completed_at&&!jobCount&&!params.talent&&!discoveryBooking)redirect("/workspace/client/onboarding");

  const issues=collectQueryIssues({"your hiring workspace":dashboardResult.error,"your requested Virtual Assistant":params.talent?requestedError:null,"your discovery call":discoveryError});
  const hires=Number(dashboard?.hire_count||0);
  const shortlistCount=Number(dashboard?.application_count||0);
  const pipeline=dashboard?.pipeline||{applied:0,shortlisted:0,interview:0,offered:0,hired:0,rejected:0};

  const attention:AttentionItem[]=[];
  if(!jobCount) attention.push({title:"Start your first hiring request",copy:"Tell us the role, schedule, budget, and must-haves. Your recruiter will shape the brief and source the VA.",href:"/workspace/client/jobs/new",count:1,icon:Plus});
  if(pipeline.shortlisted) attention.push({title:"Recruiter shortlist waiting",copy:"Review only the vetted VAs your recruiter selected for you.",href:"/workspace/client/candidates",count:pipeline.shortlisted,icon:Sparkles});
  if(pipeline.interview) attention.push({title:"Interview action needed",copy:"Schedule, join, or record a Proceed / Hold / Pass decision.",href:"/workspace/client/interviews",count:pipeline.interview,icon:CalendarDays});
  if(pipeline.offered) attention.push({title:"Final offer in progress",copy:"Review the final placement terms once the VA has accepted or when confirmation is required.",href:"/workspace/client/offers",count:pipeline.offered,icon:Sparkles});

  const steps=[
    {label:"Complete your company profile",description:"Add company details and hiring context.",done:Boolean(company?.company_name&&company?.timezone),href:"/workspace/client/company"},
    {label:"Send your first hiring request",description:"Tell us what you need. Your recruiter will refine the role and manage the search.",done:Boolean(jobCount),href:"/workspace/client/jobs/new"},
    {label:"Review a recruiter shortlist",description:"You only review candidates already screened and selected by our recruiting team.",done:Boolean(shortlistCount),href:"/workspace/client/candidates"},
    {label:"Confirm a placement",description:"After interview and final terms, confirm the VA and start the managed workroom.",done:Boolean(hires),href:"/workspace/client/workroom"}
  ];
  const onboardingDone=steps.every((step)=>step.done);
  const currentAction=pipeline.offered
    ? {title:`${pipeline.offered} final offer${pipeline.offered===1?"":"s"} in progress`,copy:"Open the offer and complete the final confirmation step.",href:"/workspace/client/offers",label:"Review offers",step:4}
    : pipeline.interview
      ? {title:`${pipeline.interview} interview${pipeline.interview===1?"":"s"} need attention`,copy:"Schedule the interview or record your decision after the call.",href:"/workspace/client/interviews",label:"Open interviews",step:3}
      : pipeline.shortlisted
        ? {title:`${pipeline.shortlisted} recruiter-selected VA${pipeline.shortlisted===1?"":"s"} ready`,copy:"Review the shortlist and tell your recruiter who should move forward.",href:"/workspace/client/candidates",label:"Review shortlist",step:2}
        : jobCount
          ? {title:"Your recruiter is working the role",copy:"We are screening the vetted VA pool and will only send people ready for your review.",href:"/workspace/client/jobs",label:"View role progress",step:1}
          : {title:"Tell us who you need",copy:"Share the work in your own words. We will turn it into a clear hiring brief and manage the search.",href:"/workspace/client/jobs/new",label:"Start hiring",step:0};

  return <div className="dash-page role-overview client-overview">
    <DashboardDegradedNotice issues={issues}/>
    {requested?<div className="intent-banner"><div><strong>{requested.full_name}</strong><span className="small muted"> · {requested.headline||requested.primary_category||"Virtual Assistant"}</span><p className="small muted">This preference will be treated as a recruiter lead, not a direct marketplace hire.</p></div><Link className="btn btn-primary" href={`/workspace/client/jobs/new?talent=${encodeURIComponent(requested.slug)}`}>Create hiring request</Link></div>:null}

    <div className="dash-header"><div><div className="dash-kicker">Managed VA hiring</div><h1>Your hiring progress</h1><p>Your recruiter manages sourcing, vetting, matching, and follow-up. You step in only when a decision needs you.</p><span className="dash-freshness">Live data · refreshed when this page opened</span></div><Link className="btn btn-primary btn-lg" href="/workspace/client/jobs/new"><Plus size={17}/> Start a hiring request</Link></div>

    <section className="client-concierge-strip"><div><span className="small">Your recruiter</span><h2>{hiringOwner?.full_name||"VirtualAssistant.com.ph recruiting team"}</h2><p>One accountable hiring owner handles the role from brief to placement and post-hire follow-up.</p></div><Link className="btn" href="/workspace/client/support"><LifeBuoy size={16}/> Contact your recruiter</Link></section>

    {params.booking_error?<div className="alert" role="alert">We could not open your booking. Please try again or contact your recruiter.</div>:null}
    {discoveryBooking?<section className="card dashboard-section-card client-discovery-call">
      <div className="dashboard-section-head">
        <div>
          <div className="row wrap"><CalendarDays size={18}/><h2 style={{margin:0}}>Discovery call</h2></div>
          <p>{discoveryBooking.discovery_outcome==="no_show"?"You missed the previous call. Choose another time when you are ready.":discoveryBooking.discovery_cancelled_at||discoveryBooking.discovery_outcome==="cancelled"?"Your previous call was cancelled. You can book another time now.":discoveryBooking.discovery_scheduled_at?`Your call is scheduled for ${new Intl.DateTimeFormat("en-PH",{dateStyle:"medium",timeStyle:"short",timeZone:company?.timezone||"Asia/Manila"}).format(new Date(discoveryBooking.discovery_scheduled_at))}.`:"Manage your discovery call."}</p>
        </div>
        <span className={`badge ${discoveryBooking.discovery_outcome==="no_show"||discoveryBooking.discovery_cancelled_at?"badge-warning":"badge-success"}`}>
          {discoveryBooking.discovery_outcome==="no_show"?"Needs rebooking":discoveryBooking.discovery_cancelled_at||discoveryBooking.discovery_outcome==="cancelled"?"Cancelled":discoveryBooking.discovery_outcome==="rescheduled"?"Rescheduled":"Booked"}
        </span>
      </div>
      <div className="row wrap">
        <form action={openClientDiscoveryBookingAction}>
          <button className="btn btn-primary" type="submit">{discoveryBooking.discovery_outcome==="no_show"||discoveryBooking.discovery_cancelled_at||discoveryBooking.discovery_outcome==="cancelled"?"Rebook call":"Manage / reschedule call"}</button>
        </form>
        {discoveryBooking.discovery_meeting_url&&discoveryBooking.discovery_scheduled_at&&!discoveryBooking.discovery_cancelled_at&&discoveryBooking.discovery_outcome!=="no_show"?<a className="btn" href={discoveryBooking.discovery_meeting_url} target="_blank" rel="noreferrer">Join Google Meet</a>:null}
      </div>
    </section>:null}

    <section className="workflow-progress card" aria-label="Hiring progress"><div className="workflow-steps">{["Tell us what you need","We recruit & vet","Review shortlist","Interview","Confirm & start"].map((label,index)=><div className={`workflow-step ${index<currentAction.step?"done":index===currentAction.step?"current":""}`} key={label}><span>{index<currentAction.step?"✓":index+1}</span><strong>{label}</strong></div>)}</div><div className="workflow-current"><div><span className="small">Current action</span><h2>{currentAction.title}</h2><p>{currentAction.copy}</p><small className="muted">{currentAction.step===1?"Waiting on your recruiter":currentAction.step>=2?"Waiting on you":""}</small></div><Link className="btn btn-primary" href={currentAction.href}>{currentAction.label}<ArrowRight size={16}/></Link></div></section>

    <section className="card dashboard-section-card"><div className="dashboard-section-head"><div><h2>Needs your attention</h2><p>No raw applicants or internal recruiter tasks appear here. Only client decisions do.</p></div>{attention.length?<span className="badge badge-warning">{attention.length} action{attention.length===1?"":"s"}</span>:<span className="badge badge-success">All caught up</span>}</div>{attention.length?<div className="attention-grid">{attention.slice(0,6).map((item)=>{const Icon=item.icon;return <Link className="attention-card" href={item.href} key={item.title}><div className="attention-count">{item.count}</div><div><div className="row"><Icon size={16}/><strong>{item.title}</strong></div><p>{item.copy}</p></div><ArrowRight size={16}/></Link>})}</div>:<div className="dashboard-caught-up"><UserRoundCheck size={22}/><div><strong>No hiring decision is waiting on you.</strong><p>Your recruiter owns the next step until a shortlist, interview, offer, or placement issue needs your input.</p></div></div>}</section>

    <section className="card dashboard-section-card"><div className="dashboard-section-head"><div><h2>Managed hiring pipeline</h2><p>This is the part of the process you actually need to see.</p></div><Link className="btn btn-sm" href="/workspace/client/candidates">Open shortlist</Link></div><div className="pipeline-summary" aria-label="Client hiring pipeline">{[["Shortlist",pipeline.shortlisted],["Interview",pipeline.interview],["Offer",pipeline.offered],["Hired",pipeline.hired]].map(([label,count])=><div className="pipeline-step" key={String(label)}><span>{label}</span><strong>{count}</strong></div>)}</div>{pipeline.rejected?<div className="small muted pipeline-footnote">{pipeline.rejected} recruiter-presented candidate{pipeline.rejected===1?"":"s"} passed by clients and kept outside the active pipeline.</div>:null}</section>

    {!onboardingDone?<OnboardingChecklist title="Finish your hiring setup" steps={steps}/>:null}

    <div className="grid-2 dashboard-after-onboarding"><section className="card"><div className="dashboard-section-head"><div><h2>Your roles</h2><p>See where each managed search stands without managing raw applicants.</p></div><Link className="btn btn-sm" href="/workspace/client/jobs">View all</Link></div>{jobRows.length?<div className="role-dashboard-list">{jobRows.map((job)=><Link href={`/workspace/client/jobs/${job.id}`} key={job.id} className="role-dashboard-row"><div className="role-dashboard-main"><div className="row wrap"><strong>{job.title}</strong><span className={`badge ${job.status==="published"?"badge-success":job.status==="pending"?"badge-warning":""}`}>{job.status==="published"?"Recruiting":String(job.status).replaceAll("_"," ")}</span></div><div className="role-dashboard-pipeline"><span><b>{job.shortlisted}</b> shortlist</span><span><b>{job.interview}</b> interview</span><span><b>{job.offered}</b> offer</span><span><b>{job.hired}</b> hired</span></div></div><ArrowRight size={16}/></Link>)}</div>:<div className="empty"><p>You have not started a hiring request yet.</p><Link className="btn btn-primary" href="/workspace/client/jobs/new">Start hiring</Link></div>}</section>

      <section className="card"><div className="dashboard-section-head"><div><h2>What your recruiting team handles</h2><p>This is a managed hiring service, not a talent marketplace.</p></div><UserRoundCheck size={18}/></div><ol className="candidate-access-steps"><li>Qualify and improve the role brief</li><li>Screen the vetted VA pool and verify fit</li><li>Present only recruiter-approved VAs</li><li>Coordinate interviews, offer, placement, and follow-up</li></ol><Link className="btn btn-primary" href="/workspace/client/support" style={{width:"100%"}}>Contact your recruiter</Link></section></div>
  </div>;
}
