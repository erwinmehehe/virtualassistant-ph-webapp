import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  MessageCircle,
  UserRoundCheck,
} from "lucide-react";
import { requireRoleFast } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { OnboardingChecklist } from "@/components/onboarding-checklist";
import { DashHeader } from "@/components/dash-ui";
import { KiroClientMascot } from "@/components/kiro-client-mascot";
import { KiroClientAssistant } from "@/components/kiro-client-assistant";
import { collectQueryIssues } from "@/lib/query-health";
import { DashboardDegradedNotice } from "@/components/dashboard-degraded-notice";
import { getClientDashboardSummary } from "@/lib/client-dashboard";
import { getClientHiringRoomSummary } from "@/lib/client-hiring-room";
import { candidateAccessUnlocked } from "@/lib/candidate-access";
import { maskVaName } from "@/lib/va-identity";
import { openClientDiscoveryBookingAction } from "@/app/actions/booking";

type AttentionItem={title:string;copy:string;href:string;count:number};

function initials(value?: string | null) {
  return String(value || "VA")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0] || "")
    .join("")
    .toUpperCase() || "VA";
}

function moneyRange(min?: number | null, max?: number | null) {
  if (!min && !max) return "Budget not set";
  if (min && max && min !== max) return "USD $" + Number(min).toFixed(0) + "–$" + Number(max).toFixed(0) + "/hr";
  return "USD $" + Number(min || max).toFixed(0) + "/hr";
}

export default async function ClientDashboardPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
  const params=await searchParams;
  const {userId,profile}=await requireRoleFast("client");
  const supabase=await createClient();

  const requestedPromise=params.talent
    ? supabase.from("public_va_directory").select("slug,full_name,headline,primary_category").eq("slug",params.talent).maybeSingle()
    : Promise.resolve({data:null,error:null} as any);

  const latestRolePromise=supabase
    .from("jobs")
    .select("id,title,status,hours_per_week,min_hourly_rate,max_hourly_rate,start_timing,required_skills,required_tools,timezone,overlap_hours,created_at,published_at")
    .eq("client_id",userId)
    .neq("status","closed")
    .order("created_at",{ascending:false})
    .limit(1)
    .maybeSingle();

  const [dashboardResult,hiringRoomResult,{data:requested,error:requestedError},{data:latestRole}]=await Promise.all([
    getClientDashboardSummary(userId),
    getClientHiringRoomSummary(userId,null),
    requestedPromise,
    latestRolePromise,
  ]);

  const dashboard=dashboardResult.data;
  const discoveryBooking=dashboard?.discovery_booking||null;
  const company=dashboard?.company||{};
  const hiringOwner=dashboard?.hiring_owner||null;
  const jobCount=Number(dashboard?.job_count||0);
  if(!dashboardResult.error&&!company?.onboarding_completed_at&&!jobCount&&!params.talent&&!discoveryBooking)redirect("/workspace/client/onboarding");

  const issues=collectQueryIssues({
    "your hiring workspace":dashboardResult.error,
    "your requested Virtual Assistant":params.talent?requestedError:null,
    "your current shortlist":hiringRoomResult.error,
  });
  const hires=Number(dashboard?.hire_count||0);
  const shortlistCount=Number(dashboard?.application_count||0);
  const pipeline=dashboard?.pipeline||{applied:0,shortlisted:0,interview:0,offered:0,hired:0,rejected:0};

  const attention:AttentionItem[]=[];
  if(!jobCount) attention.push({title:"Start your first hiring request",copy:"Tell us the role, schedule, budget, and must-haves.",href:"/workspace/client/jobs/new",count:1});
  if(pipeline.shortlisted) attention.push({title:"Review shortlisted candidates",copy:"Review only the vetted VAs your recruiter selected for you.",href:"/workspace/client/candidates",count:pipeline.shortlisted});
  if(pipeline.interview) attention.push({title:"Schedule interviews",copy:"Choose times or record your decision after the call.",href:"/workspace/client/interviews",count:pipeline.interview});
  if(pipeline.offered) attention.push({title:"Review final terms",copy:"Open the recruiter-prepared offer and complete the final confirmation step.",href:"/workspace/client/offers",count:pipeline.offered});

  const steps=[
    {label:"Complete your company profile",description:"Add company details and hiring context.",done:Boolean(company?.company_name&&company?.timezone),href:"/workspace/client/company"},
    {label:"Send your first hiring request",description:"Tell us what you need. Your recruiter will refine the role and manage the search.",done:Boolean(jobCount),href:"/workspace/client/jobs/new"},
    {label:"Review a recruiter shortlist",description:"You only review candidates already screened and selected by our recruiting team.",done:Boolean(shortlistCount),href:"/workspace/client/candidates"},
    {label:"Confirm a placement",description:"After interview and final terms, confirm the VA and start the managed workroom.",done:Boolean(hires),href:"/workspace/client/workroom"}
  ];
  const onboardingDone=steps.every((step)=>step.done);

  const currentAction=pipeline.offered
    ? {title:String(pipeline.offered)+" final offer"+(pipeline.offered===1?"":"s")+" in progress",copy:"Open the offer and complete the final confirmation step.",href:"/workspace/client/offers",label:"Review offers",step:4}
    : pipeline.interview
      ? {title:String(pipeline.interview)+" interview"+(pipeline.interview===1?"":"s")+" need attention",copy:"Schedule the interview or record your decision after the call.",href:"/workspace/client/interviews",label:"Open interviews",step:3}
      : pipeline.shortlisted
        ? {title:String(pipeline.shortlisted)+" VA"+(pipeline.shortlisted===1?" is":"s are")+" ready for your review",copy:"Your recruiter has shortlisted candidates that match your role, schedule, and requirements.",href:"/workspace/client/candidates",label:"Review candidates",step:2}
        : jobCount
          ? {title:"Your recruiter is sourcing candidates",copy:"We are screening the vetted VA pool and will only send people ready for your review.",href:"/workspace/client/jobs",label:"View role progress",step:1}
          : {title:"Tell us who you need",copy:"Share the work in your own words. We will turn it into a clear hiring brief and manage the search.",href:"/workspace/client/jobs/new",label:"Start hiring",step:0};

  const kiroState = pipeline.offered ? "attention" : pipeline.interview ? "reminder" : pipeline.shortlisted ? "success" : jobCount ? "thinking" : "welcome";

  const room=hiringRoomResult.data;
  const released=room?.released||[];
  const profileMap=new Map((room?.profiles||[]).map((row)=>[row.id,row]));
  const vaMap=new Map((room?.vas||[]).map((row)=>[row.user_id,row]));
  const candidateDetailsVisible=Boolean(room?.selected_job?.status==="published"&&candidateAccessUnlocked(room?.access_status||null));
  const featuredCandidates=candidateDetailsVisible?released.slice(0,3):[];

  const timeZone=company?.timezone||latestRole?.timezone||"Asia/Manila";
  const now=new Date();
  let localHour=12;
  try {
    localHour=Number(new Intl.DateTimeFormat("en-US",{hour:"2-digit",hour12:false,timeZone}).format(now));
  } catch {}
  const greeting=localHour<12?"Good morning":localHour<18?"Good afternoon":"Good evening";
  const firstName=String(profile.full_name||"there").trim().split(/\s+/)[0]||"there";
  let localDate="";
  try {
    localDate=new Intl.DateTimeFormat("en-PH",{weekday:"long",month:"short",day:"numeric",year:"numeric",timeZone}).format(now);
  } catch {
    localDate=new Intl.DateTimeFormat("en-PH",{weekday:"long",month:"short",day:"numeric",year:"numeric"}).format(now);
  }

  const progressLabels=["Role created","Recruiter sourcing","Client review","Interviews","Offer & hire"];
  const nextSteps=[
    {label:"Review shortlisted candidates",copy:pipeline.shortlisted?String(pipeline.shortlisted)+" candidate"+(pipeline.shortlisted===1?"":"s")+" ready for your review":"Your recruiter will add vetted matches here.",done:currentAction.step>2,active:currentAction.step===2},
    {label:"Schedule interviews",copy:"Choose your preferred interview times.",done:currentAction.step>3,active:currentAction.step===3},
    {label:"Give feedback",copy:"Share your decision after each interview.",done:currentAction.step>3,active:false},
    {label:"Receive final recommendation",copy:"Your recruiter will guide you through final fit.",done:currentAction.step>4,active:false},
    {label:"Make an offer",copy:"Confirm the placement once you have found the right fit.",done:Boolean(hires),active:currentAction.step===4},
  ];

  const recruiterName=hiringOwner?.full_name||"VAPH recruiting team";

  const latestUpdates=[
    pipeline.shortlisted?{title:String(pipeline.shortlisted)+" candidate"+(pipeline.shortlisted===1?"":"s")+" shortlisted",copy:"Your recruiter has prepared candidates for your review.",tone:"done"}:null,
    jobCount?{title:"Recruiter sourcing active",copy:"Your role is in the managed hiring workflow.",tone:currentAction.step>=2?"done":"active"}:null,
    latestRole?.status==="published"?{title:"Role posted",copy:(latestRole.title||"Your role")+" is active.",tone:"active"}:null,
    {title:"Hiring brief confirmed",copy:"Your requirements stay attached to this hiring workflow.",tone:"done"},
  ].filter(Boolean) as Array<{title:string;copy:string;tone:string}>;

  return <div className="dash-page role-overview client-overview client-mobile-dashboard client-kiro-dashboard">
    <DashboardDegradedNotice issues={issues}/>
    <div className="client-kiro-legacy-header client-mobile-attention client-mobile-pipeline"><DashHeader kicker="Managed VA hiring" title="Your hiring progress" subtitle={<>Your recruiter manages sourcing, vetting, matching, and follow-up. <span className="dash-freshness">Live data · refreshed when this page opened</span></>} /></div>

    {requested?<div className="intent-banner"><div><strong>{requested.full_name}</strong><span className="small muted"> · {requested.headline||requested.primary_category||"Virtual Assistant"}</span><p className="small muted">This preference will be treated as a recruiter lead, not a direct marketplace hire.</p></div><Link className="btn btn-primary" href={"/workspace/client/jobs/new?talent="+encodeURIComponent(requested.slug)}>Create hiring request</Link></div>:null}

    <header className="client-kiro-greeting">
      <div>
        <h1>{greeting}, {firstName}!</h1>
        <p>Here’s what’s happening with your hire.</p>
      </div>
      <div className="client-kiro-date">
        <span className="client-kiro-date-icon"><CalendarDays size={17}/></span>
        <div><strong>{localDate}</strong><span>{timeZone.replaceAll("_"," ")}</span></div>
      </div>
    </header>

    <div className="client-kiro-layout">
      <main className="client-kiro-main">
        <section className="client-kiro-hero" aria-labelledby="client-kiro-current-action">
          <div className="client-kiro-hero-visual" aria-hidden="true">
            <KiroClientMascot state={kiroState} className="client-kiro-hero-mascot"/>
          </div>
          <div className="client-kiro-hero-copy">
            <span className="client-kiro-eyebrow">Kiro · Your VAPH Guide</span>
            <h2 id="client-kiro-current-action">{currentAction.title}</h2>
            <p>{currentAction.copy} {pipeline.shortlisted?"Review their profiles and choose who you’d like to interview.":""}</p>
            <div className="client-kiro-hero-actions">
              <Link className="btn btn-primary" href={currentAction.href}>{currentAction.label}<ArrowRight size={16}/></Link>
              <KiroClientAssistant state={kiroState} currentTitle={currentAction.title} currentCopy={currentAction.copy} currentHref={currentAction.href} currentLabel={currentAction.label} recruiterName={recruiterName}/>
            </div>
          </div>
        </section>

        {params.booking_error?<div className="alert" role="alert">We could not open your booking. Please try again or contact your recruiter.</div>:null}
        {discoveryBooking?<section className="client-kiro-discovery">
          <div>
            <span className="small">Discovery call</span>
            <strong>{discoveryBooking.discovery_outcome==="no_show"?"Rebook your discovery call":discoveryBooking.discovery_cancelled_at||discoveryBooking.discovery_outcome==="cancelled"?"Your previous call was cancelled":discoveryBooking.discovery_scheduled_at?"Scheduled for "+new Intl.DateTimeFormat("en-PH",{dateStyle:"medium",timeStyle:"short",timeZone}).format(new Date(discoveryBooking.discovery_scheduled_at)):"Manage your discovery call"}</strong>
          </div>
          <div className="row wrap">
            <form action={openClientDiscoveryBookingAction}><button className="btn btn-primary" type="submit">{discoveryBooking.discovery_outcome==="no_show"||discoveryBooking.discovery_cancelled_at||discoveryBooking.discovery_outcome==="cancelled"?"Rebook call":"Manage / reschedule call"}</button></form>
            {discoveryBooking.discovery_meeting_url&&discoveryBooking.discovery_scheduled_at&&!discoveryBooking.discovery_cancelled_at&&discoveryBooking.discovery_outcome!=="no_show"?<a className="btn" href={discoveryBooking.discovery_meeting_url} target="_blank" rel="noreferrer">Join Google Meet</a>:null}
          </div>
        </section>:null}

        <section className="client-kiro-progress client-mobile-workflow" aria-label="Hiring progress">
          {progressLabels.map((label,index)=>{
            const done=index<currentAction.step;
            const active=index===currentAction.step;
            return <div className={"client-kiro-progress-step "+(done?"is-done ":"")+(active?"is-active":"")} key={label}>
              <div className="client-kiro-progress-marker">{done?<Check size={14}/>:index+1}</div>
              <div><strong>{label}</strong><span>{done?"Completed":active?"In progress":"Upcoming"}</span></div>
            </div>;
          })}
        </section>

        <section className="client-kiro-panel client-kiro-shortlist">
          <div className="client-kiro-panel-head">
            <div><span className="small">Recruiter selected</span><h2>Shortlisted candidates</h2></div>
            <Link href="/workspace/client/candidates">View all candidates <ArrowRight size={14}/></Link>
          </div>

          {featuredCandidates.length?<div className="client-kiro-candidate-grid">
            {featuredCandidates.map((row)=>{
              const candidateProfile=profileMap.get(row.va_id);
              const va=vaMap.get(row.va_id);
              const visibleName=candidateProfile?.full_name?maskVaName(candidateProfile.full_name):"Matched VA";
              const evidence=[...(va?.skills||[]),...(va?.tools||[])].slice(0,4);
              return <article className="client-kiro-candidate-card" key={row.va_id}>
                <div className="client-kiro-candidate-top">
                  <span className="client-kiro-avatar">{initials(visibleName)}</span>
                  <div><strong>{visibleName}</strong><span>{va?.headline||va?.primary_category||"Virtual Assistant"}</span></div>
                  {row.match_score!=null?<span className="client-kiro-match">{Math.round(Number(row.match_score))}% match</span>:null}
                </div>
                <div className="client-kiro-candidate-meta">
                  {va?.years_experience!=null?<span>{va.years_experience}+ years</span>:null}
                  {va?.weekly_hours?<span>{va.weekly_hours} hrs/week</span>:null}
                  {va?.overlap_hours?<span>{va.overlap_hours}h overlap</span>:null}
                </div>
                <div className="client-kiro-evidence">
                  {evidence.length?evidence.map((item,index)=><span key={String(item)+"-"+index}><CheckCircle2 size={13}/>{item}</span>):<span><CheckCircle2 size={13}/>Recruiter reviewed</span>}
                </div>
                <div className="client-kiro-candidate-actions">
                  <Link className="btn btn-sm" href="/workspace/client/candidates">View profile</Link>
                  <Link className="btn btn-sm" href="/workspace/client/interviews">Schedule interview</Link>
                </div>
              </article>;
            })}
          </div>:<div className="client-kiro-empty">
            <KiroClientMascot state={jobCount?"thinking":"welcome"} className="client-kiro-empty-mascot"/>
            <div><strong>{candidateDetailsVisible?"Your recruiter is preparing the shortlist.":"Candidate profiles will appear here when they are ready for client review."}</strong><p>{jobCount?"We are screening for fit, evidence, rate, schedule, and availability.":"Start a hiring request and Kiro will guide you through the next step."}</p></div>
            <Link className="btn btn-primary" href={jobCount?"/workspace/client/jobs":"/workspace/client/jobs/new"}>{jobCount?"View role":"Start hiring"}</Link>
          </div>}
        </section>

        <div className="client-kiro-bottom-grid">
          <section className="client-kiro-panel client-kiro-details">
            <div className="client-kiro-panel-head">
              <div><span className="small">Current search</span><h2>Hiring details</h2></div>
              {latestRole?<Link href={"/workspace/client/jobs/"+latestRole.id}>Edit</Link>:null}
            </div>
            <dl>
              <div><dt>Role</dt><dd>{latestRole?.title||"No active role yet"}</dd></div>
              <div><dt>Weekly hours</dt><dd>{latestRole?.hours_per_week?String(latestRole.hours_per_week)+" hours/week":"Flexible"}</dd></div>
              <div><dt>Start timing</dt><dd>{latestRole?.start_timing||"As soon as possible"}</dd></div>
              <div><dt>Budget</dt><dd>{moneyRange(latestRole?.min_hourly_rate,latestRole?.max_hourly_rate)}</dd></div>
              <div className="client-kiro-detail-skills"><dt>Key skills</dt><dd>{(latestRole?.required_skills||[]).slice(0,4).length?(latestRole?.required_skills||[]).slice(0,4).map((skill:string)=><span key={skill}>{skill}</span>):<span>Set in your hiring brief</span>}</dd></div>
            </dl>
          </section>

          <section className="client-kiro-panel client-kiro-updates">
            <div className="client-kiro-panel-head"><div><span className="small">Activity</span><h2>Latest updates</h2></div><Link href="/workspace/client/notifications">View all <ArrowRight size={14}/></Link></div>
            <div className="client-kiro-update-list">
              {latestUpdates.map((update,index)=><div className="client-kiro-update" key={update.title+"-"+index}>
                <span className={"client-kiro-update-dot "+update.tone}>{update.tone==="done"?<Check size={12}/>:null}</span>
                <div><strong>{update.title}</strong><p>{update.copy}</p></div>
              </div>)}
            </div>
          </section>
        </div>

        {!onboardingDone?<OnboardingChecklist title="Finish your hiring setup" steps={steps}/>:null}
      </main>

      <aside className="client-kiro-rail">
        <section className="client-kiro-rail-card client-kiro-recruiter-card">
          <span className="small">Your recruiter</span>
          <div className="client-kiro-recruiter">
            <span className="client-kiro-recruiter-avatar">{initials(hiringOwner?.full_name||"VAPH")}</span>
            <div><strong>{recruiterName}</strong><span>Recruiter</span></div>
            <em>Online</em>
          </div>
          <p>Your main point of contact for this hire. Message them whenever you need context or a decision explained.</p>
          <div className="client-kiro-rail-actions">
            <Link className="btn" href="/workspace/client/messages"><MessageCircle size={15}/> Message your recruiter</Link>
            <Link className="btn" href="/workspace/client/interviews"><CalendarDays size={15}/> Interviews</Link>
          </div>
        </section>

        <section className="client-kiro-rail-card">
          <div className="client-kiro-panel-head"><div><span className="small">Current action</span><h2>Next steps</h2></div></div>
          <div className="client-kiro-next-list">
            {nextSteps.map((item,index)=><div className={"client-kiro-next "+(item.done?"is-done ":"")+(item.active?"is-active":"")} key={item.label}>
              <span>{item.done?<Check size={12}/>:index+1}</span>
              <div><strong>{item.label}</strong><p>{item.copy}</p></div>
            </div>)}
          </div>
        </section>

        <section className="client-kiro-rail-card client-kiro-help">
          <div className="client-kiro-help-art" aria-hidden="true"><KiroClientMascot state="training" className="client-kiro-help-mascot"/></div>
          <h2>Need help understanding the process?</h2>
          <p>Ask Kiro anything about hiring, timelines, or what happens next.</p>
          <KiroClientAssistant state={kiroState} currentTitle={currentAction.title} currentCopy={currentAction.copy} currentHref={currentAction.href} currentLabel={currentAction.label} recruiterName={recruiterName} fullWidth className="btn-primary"/>
        </section>

        {attention.length?<section className="client-kiro-rail-card client-kiro-attention">
          <span className="small">Needs your attention</span>
          {attention.slice(0,3).map((item)=><Link href={item.href} key={item.title}><span>{item.count}</span><div><strong>{item.title}</strong><p>{item.copy}</p></div><ArrowRight size={14}/></Link>)}
        </section>:null}

        <section className="client-kiro-rail-card client-kiro-managed">
          <UserRoundCheck size={20}/>
          <div><strong>Managed hiring</strong><p>Your recruiter owns sourcing, vetting, matching, and follow-up. You step in when a client decision is required.</p></div>
        </section>
      </aside>
    </div>
  </div>;
}
