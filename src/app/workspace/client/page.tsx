import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CalendarDays, LifeBuoy, Plus, Sparkles, UserRoundCheck, UsersRound } from "lucide-react";
import { requireRoleFast } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { OnboardingChecklist } from "@/components/onboarding-checklist";
import { DashHeader } from "@/components/dash-ui";
import { collectQueryIssues } from "@/lib/query-health";
import { DashboardDegradedNotice } from "@/components/dashboard-degraded-notice";
import { getClientDashboardSummary } from "@/lib/client-dashboard";
import { openClientDiscoveryBookingAction } from "@/app/actions/booking";

export default async function ClientDashboardPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
  const params=await searchParams;
  const {userId}=await requireRoleFast("client");
  const supabase=await createClient();
  const requestedPromise=params.talent
    ? supabase.from("public_va_directory").select("slug,full_name,headline,primary_category").eq("slug",params.talent).maybeSingle()
    : Promise.resolve({data:null,error:null} as any);

  const [dashboardResult,{data:requested,error:requestedError}]=await Promise.all([getClientDashboardSummary(userId),requestedPromise]);
  const dashboard=dashboardResult.data;
  const discoveryBooking=dashboard?.discovery_booking||null;
  const company=dashboard?.company||{};
  const hiringOwner=dashboard?.hiring_owner||null;
  const jobRows=dashboard?.jobs||[];
  const jobCount=Number(dashboard?.job_count||0);
  if(!dashboardResult.error&&!company?.onboarding_completed_at&&!jobCount&&!params.talent&&!discoveryBooking)redirect("/workspace/client/onboarding");

  const issues=collectQueryIssues({"your hiring workspace":dashboardResult.error,"your requested Virtual Assistant":params.talent?requestedError:null});
  const hires=Number(dashboard?.hire_count||0);
  const shortlistCount=Number(dashboard?.application_count||0);
  const pipeline=dashboard?.pipeline||{applied:0,shortlisted:0,interview:0,offered:0,hired:0,rejected:0};

  const steps=[
    {label:"Complete your company profile",description:"Add company details and hiring context.",done:Boolean(company?.company_name&&company?.timezone),href:"/workspace/client/company"},
    {label:"Send your first hiring request",description:"Create the role, set schedule and pay, preview it, then submit it for publication or recruiter review.",done:Boolean(jobCount),href:"/workspace/client/jobs/new"},
    {label:"Review a recruiter shortlist",description:"You only review candidates already screened and selected by our recruiting team.",done:Boolean(shortlistCount),href:"/workspace/client/candidates"},
    {label:"Confirm a placement",description:"After interview and final terms, confirm the VA and start the managed workroom.",done:Boolean(hires),href:"/workspace/client/workroom"}
  ];
  const onboardingDone=steps.every((step)=>step.done);
  const currentAction=pipeline.offered
    ? {title:`${pipeline.offered} final offer${pipeline.offered===1?"":"s"} in progress`,copy:"Review the final placement terms and complete the client confirmation step.",href:"/workspace/client/offers",label:"Review offers",tone:"decision"}
    : pipeline.interview
      ? {title:`${pipeline.interview} interview${pipeline.interview===1?"":"s"} need attention`,copy:"Schedule the call or record your decision after the interview.",href:"/workspace/client/interviews",label:"Open interviews",tone:"decision"}
      : pipeline.shortlisted
        ? {title:`${pipeline.shortlisted} recruiter-selected VA${pipeline.shortlisted===1?"":"s"} ready`,copy:"Review the shortlist and tell your recruiter who should move forward.",href:"/workspace/client/candidates",label:"Review shortlist",tone:"decision"}
        : jobCount
          ? {title:"Your recruiter is working the role",copy:"Screening and matching are in progress. You only need to step in when a candidate is ready for your review.",href:"/workspace/client/jobs",label:"View role progress",tone:"waiting"}
          : {title:"Post your first VA job",copy:"Describe the work in your own words. We will shape the brief, then you can preview the listing before submitting it.",href:"/workspace/client/jobs/new",label:"Post a job",tone:"decision"};

  return <div className="dash-page role-overview client-overview client-mobile-dashboard client-dashboard-simplified">
    <DashboardDegradedNotice issues={issues}/>

    {requested?<div className="intent-banner"><div><strong>{requested.full_name}</strong><span className="small muted"> · {requested.headline||requested.primary_category||"Virtual Assistant"}</span><p className="small muted">This preference will be treated as a recruiter lead, not a direct marketplace hire.</p></div><Link className="btn btn-primary" href={`/workspace/client/jobs/new?talent=${encodeURIComponent(requested.slug)}`}>Create hiring request</Link></div>:null}

    <div className="client-mobile-dashboard-head"><DashHeader kicker="Managed VA hiring" title="Your hiring workspace" subtitle={<>See the one thing that needs you, then let your recruiter handle the rest. <span className="dash-freshness">Live data · refreshed when this page opened</span></>} actions={<Link className="dash-btn dash-btn-dark" href="/workspace/client/jobs/new"><Plus size={17}/> Post a job</Link>}/></div>

    {params.booking_error?<div className="alert" role="alert">We could not open your booking. Please try again or contact your recruiter.</div>:null}
    {discoveryBooking?<section className="card dashboard-section-card client-discovery-call">
      <div className="dashboard-section-head">
        <div><div className="row wrap"><CalendarDays size={18}/><h2 style={{margin:0}}>Discovery call</h2></div><p>{discoveryBooking.discovery_outcome==="no_show"?"You missed the previous call. Choose another time when you are ready.":discoveryBooking.discovery_cancelled_at||discoveryBooking.discovery_outcome==="cancelled"?"Your previous call was cancelled. You can book another time now.":discoveryBooking.discovery_scheduled_at?`Scheduled for ${new Intl.DateTimeFormat("en-PH",{dateStyle:"medium",timeStyle:"short",timeZone:company?.timezone||"Asia/Manila"}).format(new Date(discoveryBooking.discovery_scheduled_at))}.`:"Manage your discovery call."}</p></div>
        <span className={`badge ${discoveryBooking.discovery_outcome==="no_show"||discoveryBooking.discovery_cancelled_at?"badge-warning":"badge-success"}`}>{discoveryBooking.discovery_outcome==="no_show"?"Needs rebooking":discoveryBooking.discovery_cancelled_at||discoveryBooking.discovery_outcome==="cancelled"?"Cancelled":discoveryBooking.discovery_outcome==="rescheduled"?"Rescheduled":"Booked"}</span>
      </div>
      <div className="row wrap"><form action={openClientDiscoveryBookingAction}><button className="btn btn-primary" type="submit">{discoveryBooking.discovery_outcome==="no_show"||discoveryBooking.discovery_cancelled_at||discoveryBooking.discovery_outcome==="cancelled"?"Rebook call":"Manage / reschedule call"}</button></form>{discoveryBooking.discovery_meeting_url&&discoveryBooking.discovery_scheduled_at&&!discoveryBooking.discovery_cancelled_at&&discoveryBooking.discovery_outcome!=="no_show"?<a className="btn" href={discoveryBooking.discovery_meeting_url} target="_blank" rel="noreferrer">Join Google Meet</a>:null}</div>
    </section>:null}

    <section className={`client-dashboard-next ${currentAction.tone}`}>
      <div className="client-dashboard-next-icon"><Sparkles size={22}/></div>
      <div><span className="small">{currentAction.tone==="waiting"?"Recruiter is handling the next step":"Needs your attention"}</span><h2>{currentAction.title}</h2><p>{currentAction.copy}</p></div>
      <Link className="btn btn-primary" href={currentAction.href}>{currentAction.label}<ArrowRight size={16}/></Link>
    </section>

    {!onboardingDone?<OnboardingChecklist title="Finish your hiring setup" steps={steps}/>:null}

    <section className="card client-dashboard-roles">
      <div className="dashboard-section-head"><div><h2>Active hiring roles</h2><p>One place to see where each search stands.</p></div><Link className="btn btn-sm" href="/workspace/client/jobs">View all roles</Link></div>
      {jobRows.length?<div className="role-dashboard-list">{jobRows.map((job)=><Link href={`/workspace/client/jobs/${job.id}`} key={job.id} className="role-dashboard-row"><div className="role-dashboard-main"><div className="row wrap"><strong>{job.title}</strong><span className={`badge ${job.status==="published"?"badge-success":job.status==="pending"?"badge-warning":""}`}>{job.status==="published"?"Recruiting":String(job.status).replaceAll("_"," ")}</span></div><div className="role-dashboard-pipeline"><span><b>{job.shortlisted}</b> shortlist</span><span><b>{job.interview}</b> interview</span><span><b>{job.offered}</b> offer</span><span><b>{job.hired}</b> hired</span></div></div><ArrowRight size={16}/></Link>)}</div>:<div className="empty"><p>You have not posted a job yet.</p><Link className="btn btn-primary" href="/workspace/client/jobs/new">Post a job</Link></div>}
    </section>

    {hires?<section className="client-dashboard-placement">
      <div><UserRoundCheck size={22}/><div><span className="small">Active team</span><h2>{hires} confirmed placement{hires===1?"":"s"}</h2><p>Open the workroom to handle onboarding, submitted work and time approvals.</p></div></div>
      <Link className="btn btn-primary" href="/workspace/client/workroom">Open workroom <ArrowRight size={16}/></Link>
    </section>:null}

    <section className="client-concierge-strip client-mobile-concierge client-dashboard-recruiter">
      <div><span className="small">Your recruiter</span><h2>{hiringOwner?.full_name||"VirtualAssistant.com.ph recruiting team"}</h2><p>Your recruiter owns sourcing, vetting, follow-up and coordination. Message them whenever the brief or priority changes.</p></div>
      <Link className="btn" href="/workspace/client/messages"><LifeBuoy size={16}/> Message recruiter</Link>
    </section>

    {!hires&&jobCount?<div className="client-dashboard-service-note"><UsersRound size={17}/><span>No raw applicant queue here. Your recruiter screens first and only releases candidates ready for your decision.</span></div>:null}
  </div>;
}
