import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ArrowRight, Bell, BriefcaseBusiness, CheckCircle2, Clock3, Eye, FileText, MessageSquare, ShieldCheck, Sparkles } from "lucide-react";
import { missingForPublic } from "@/lib/public-visibility";
import { requireRole } from "@/lib/auth";
import { OnboardingChecklist } from "@/components/onboarding-checklist";
import { VaDashboardMatches } from "@/components/va-dashboard-matches";
import { getVaCompletion } from "@/lib/profile-completeness";
import { getVettingReadiness, vettingStatusLabel } from "@/lib/vetting";
import { publishVaProfileAction } from "@/app/actions/profile";
import { collectQueryIssues } from "@/lib/query-health";
import { DashboardDegradedNotice } from "@/components/dashboard-degraded-notice";
import { VETTING_PROFILE_MIN } from "@/lib/constants";
import { getVaDashboardSummary } from "@/lib/va-dashboard";

type DashboardAction={title:string;copy:string;href:string;label:string;icon:typeof ArrowRight};

export default async function VaDashboardPage(){
  const {user}=await requireRole("va");
  const {data:summary,error:summaryError}=await getVaDashboardSummary(user.id);

  const va=summary?.profile||{};
  const avatarUrl=summary?.avatar_url||null;
  const vetting=summary?.vetting||{};
  const testScore=summary?.test_score??null;
  const scorecardTotal=summary?.scorecard_total??null;
  const pipeline=summary?.pipeline||{applied:0,shortlisted:0,interview:0,offered:0,hired:0,rejected:0};
  const applicationCount=Number(summary?.application_count||0);
  const pendingInvites=Number(summary?.pending_invites||0);
  const workroomCount=Number(summary?.workroom_count||0);
  const certificationCount=Number(summary?.certification_count||0);
  const unreadNotifications=Number(summary?.unread_notifications||0);
  const unreadMessages=Number(summary?.unread_messages||0);
  const recruiterRequests=Array.isArray(summary?.recruiter_requests)?summary!.recruiter_requests:[];

  const completion=getVaCompletion(va,avatarUrl);
  if(!summaryError&&completion.score===0) redirect("/workspace/va/onboarding");

  const issues=collectQueryIssues({"your dashboard summary":summaryError});
  const vettingReadiness=getVettingReadiness(va,vetting,testScore,scorecardTotal,avatarUrl);
  const vetted=["approved","bench"].includes(vetting?.stage||"");
  const missingPublic=missingForPublic(va,avatarUrl);
  const directoryVisible=Boolean(vetted&&va?.directory_visible&&!missingPublic.length);
  const readyToPublish=Boolean(vetted&&!missingPublic.length&&!va?.directory_visible);
  const visibilityLabel=directoryVisible?"Visible to clients":vetted?"Not public yet":"Waiting for vetting";
  const visibilityCopy=directoryVisible
    ? "Your approved profile is eligible for public discovery."
    : !vetted
      ? "Clients cannot find you yet. Finish vetting first, then you can switch your profile on."
      : missingPublic.length
        ? `Complete ${missingPublic.slice(0,3).join(", ")}${missingPublic.length>3?` +${missingPublic.length-3} more`:""}.`
        : "Clients cannot find you yet. Switch on \"Show my profile to clients\" in your profile.";

  let nextAction:DashboardAction;
  if(recruiterRequests.length){
    nextAction={title:"Your recruiter requested a profile update",copy:recruiterRequests[0]?.body||"Review the request and update your profile before the next matching round.",href:"/workspace/va/profile",label:"Update profile",icon:FileText};
  }else if(completion.score<VETTING_PROFILE_MIN&&completion.next){
    nextAction={title:"Get your profile ready for screening",copy:`Complete ${completion.next.label} to reach the ${VETTING_PROFILE_MIN}% profile threshold for vetting.`,href:completion.next.href,label:"Continue profile",icon:FileText};
  }else if(!vetted){
    nextAction={title:"Start or continue vetting",copy:`Your profile is ready enough for screening. Complete the skills test, video intro, recruiter review, and final approval. You are ${vettingReadiness.score}% through vetting.`,href:"/workspace/va/vetting",label:"Continue vetting",icon:ShieldCheck};
  }else if(completion.score<100&&completion.next){
    nextAction={title:"Polish your approved profile",copy:`You passed vetting. Complete ${completion.next.label} so clients and recruiters see the strongest version of your profile.`,href:completion.next.href,label:"Finish profile",icon:FileText};
  }else if(readyToPublish){
    nextAction={title:"Your profile is ready — switch it on",copy:"You are approved and your profile is complete, but it is still hidden from clients. Turning it on lists you in the public directory where clients search.",href:"/workspace/va/profile#visibility",label:"Go to profile",icon:Eye};
  }else if(pendingInvites){
    nextAction={title:`You have ${pendingInvites} client invitation${pendingInvites===1?"":"s"}`,copy:"Review the role details and accept only the opportunities that fit your schedule and experience.",href:"/workspace/va/applications",label:"Review invitations",icon:BriefcaseBusiness};
  }else if(pipeline.offered){
    nextAction={title:`You have ${pipeline.offered} active offer${pipeline.offered===1?"":"s"}`,copy:"Open Applications to review the latest hiring status and keep the conversation moving.",href:"/workspace/va/applications",label:"Review offers",icon:Sparkles};
  }else if(unreadMessages>0){
    nextAction={title:`You have ${unreadMessages} unread message${unreadMessages===1?"":"s"}`,copy:"Reply promptly so interviews, scope questions, and hiring decisions do not stall.",href:"/workspace/va/messages",label:"Open messages",icon:MessageSquare};
  }else if(pipeline.interview){
    nextAction={title:`Prepare for ${pipeline.interview} interview${pipeline.interview===1?"":"s"}`,copy:"Review the role requirements, your relevant examples, availability, and questions for the client.",href:"/workspace/va/applications",label:"View interviews",icon:BriefcaseBusiness};
  }else{
    nextAction={title:"Your profile is ready for matching",copy:"Review the latest roles and apply where your skills, tools, availability, and rate are a strong fit.",href:"/workspace/va/jobs",label:"Browse matching jobs",icon:Sparkles};
  }
  const NextIcon=nextAction.icon;

  const steps=[
    ...completion.items.slice(0,4).map((x)=>({label:x.label,done:x.done,href:x.href,description:undefined})),
    {label:"Complete VA vetting (about 45 minutes)",description:"Four steps: skills test, short video intro, recruiter review, then final approval. You cannot apply to roles until this is done.",done:vetted,href:"/workspace/va/vetting"},
    {label:"Apply to your first job",description:"Approved VAs can apply with their vetted profile.",done:Boolean(applicationCount),href:vetted?"/workspace/va/jobs":"/workspace/va/vetting"},
    {label:"Start your first workroom",description:"A workroom opens after a client hires you.",done:Boolean(workroomCount),href:"/workspace/va/workroom"}
  ];
  const onboardingDone=steps.every((step)=>step.done);

  return <div className="dash-page role-overview va-overview">
    <DashboardDegradedNotice issues={issues}/>
    <div className="dash-header"><div><div className="dash-kicker">VA workspace</div><h1>What should you do next?</h1><p>Keep your profile ready, respond to recruiter requests, and move promising applications forward.</p><span className="dash-freshness">Live data · refreshed when this page opened</span></div><Link className="btn btn-primary" href="/workspace/va/jobs">Browse jobs</Link></div>

    <section className="dashboard-next-action" aria-labelledby="va-next-action-title"><div className="dashboard-next-icon"><NextIcon size={24}/></div><div><span className="small">Next best action</span><h2 id="va-next-action-title">{nextAction.title}</h2><p>{nextAction.copy}</p></div><Link className="btn btn-primary" href={nextAction.href}>{nextAction.label}<ArrowRight size={16}/></Link></section>

    <div className="va-status-grid">
      <Link className="status-summary-card" href="/workspace/va/profile"><div className="row-between"><span>Your profile</span><strong>{completion.score}%</strong></div><div className="progress" aria-label={`Profile ${completion.score}% complete`}><span style={{width:`${completion.score}%`}}/></div><small>{completion.next?`Almost ready — add ${completion.next.label}. Recruiters usually shortlist profiles above 80%.`:"Ready for recruiter matching"}</small></Link>
      <Link className="status-summary-card" href="/workspace/va/vetting"><div className="row-between"><span>Vetting status</span><strong className="status-summary-text">{vettingStatusLabel(vetting?.stage)}</strong></div><div className="progress progress-green" aria-label={`Vetting ${vettingReadiness.score}% complete`}><span style={{width:`${vettingReadiness.score}%`}}/></div><small>{vettingReadiness.score}% of vetting requirements complete</small></Link>
      {readyToPublish
        ? <form action={publishVaProfileAction} className="status-summary-card status-summary-action"><div className="row-between"><span>Profile visibility</span><Eye size={18}/></div><strong className="status-summary-text">Hidden from clients</strong><small>You are approved and complete. One click lists you where clients search.</small><button className="btn btn-primary btn-sm" type="submit">Show my profile to clients</button></form>
        : <Link className="status-summary-card" href="/workspace/va/profile"><div className="row-between"><span>Profile visibility</span><Eye size={18}/></div><strong className="status-summary-text">{visibilityLabel}</strong><small>{visibilityCopy}</small></Link>}
      <Link className="status-summary-card" href="/workspace/va/notifications"><div className="row-between"><span>Updates</span><Bell size={18}/></div><strong>{unreadNotifications}</strong><small>{unreadNotifications?"Unread recruiter and hiring updates":"You are caught up"}</small></Link>
    </div>

    <section className="card dashboard-section-card">
      <div className="dashboard-section-head"><div><h2>Application pipeline</h2><p>Where each application stands. Clients usually reply within about 5 working days, so quiet first days are normal.</p></div><Link className="btn btn-sm" href="/workspace/va/applications">Open applications</Link></div>
      <div className="pipeline-summary" aria-label="Application pipeline">
        {[["Applied",pipeline.applied],["Shortlisted",pipeline.shortlisted],["Interview",pipeline.interview],["Offered",pipeline.offered],["Hired",pipeline.hired]].map(([label,count])=><div className="pipeline-step" key={String(label)}><span>{label}</span><strong>{count}</strong></div>)}
      </div>
      {pipeline.rejected?<div className="small muted pipeline-footnote">{pipeline.rejected} rejected application{pipeline.rejected===1?"":"s"} kept outside the active pipeline.</div>:null}
    </section>

    {recruiterRequests.length?<section className="card dashboard-section-card recruiter-request-card"><div className="dashboard-section-head"><div><h2>Recruiter requests</h2><p>These updates can affect whether you are matched to client roles.</p></div><Link className="btn btn-sm" href="/workspace/va/notifications">All notifications</Link></div><div className="compact-list">{recruiterRequests.map((request)=><Link href={request.href||"/workspace/va/profile"} key={request.id}><span><strong>{request.title}</strong><small>{request.body||"Open your profile to review the requested changes."}</small></span><ArrowRight size={15}/></Link>)}</div></section>:null}

    {!onboardingDone?<OnboardingChecklist title="Finish setting up your VA account" steps={steps}/>:null}

    <section className="dashboard-section-card">
      <Suspense fallback={<div className="dash-panel" aria-busy="true"><div className="workspace-skeleton-line wide"/><div className="workspace-skeleton-card"/></div>}>
        <VaDashboardMatches va={va} vetted={vetted}/>
      </Suspense>
    </section>
  </div>;
}
