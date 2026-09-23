import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ArrowRight, Bell, BriefcaseBusiness, Eye, FileText, ShieldCheck } from "lucide-react";
import { missingForPublic } from "@/lib/public-visibility";
import { requireRoleFast } from "@/lib/auth";
import { OnboardingChecklist } from "@/components/onboarding-checklist";
import { VaDashboardMatches } from "@/components/va-dashboard-matches";
import { getVaCompletion } from "@/lib/profile-completeness";
import { getVettingReadiness, vettingStatusLabel } from "@/lib/vetting";
import { publishVaProfileAction } from "@/app/actions/profile";
import { collectQueryIssues } from "@/lib/query-health";
import { DashboardDegradedNotice } from "@/components/dashboard-degraded-notice";
import { DashHeader } from "@/components/dash-ui";
import { VETTING_PROFILE_MIN } from "@/lib/constants";
import { getVaDashboardSummary } from "@/lib/va-dashboard";

type DashboardAction={title:string;copy:string;href:string;label:string;icon:typeof ArrowRight};

export default async function VaDashboardPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
  const params=await searchParams;
  const {userId}=await requireRoleFast("va");
  const {data:summary,error:summaryError}=await getVaDashboardSummary(userId);
  const va=summary?.profile||{};
  const avatarUrl=summary?.avatar_url||null;
  const vetting=summary?.vetting||{};
  const testScore=summary?.test_score??null;
  const scorecardTotal=summary?.scorecard_total??null;
  const pipeline=summary?.pipeline||{applied:0,shortlisted:0,interview:0,offered:0,hired:0,rejected:0};
  const applicationCount=Number(summary?.application_count||0);
  const pendingInvites=Number(summary?.pending_invites||0);
  const workroomCount=Number(summary?.workroom_count||0);
  const unreadNotifications=Number(summary?.unread_notifications||0);
  const recruiterRequests=Array.isArray(summary?.recruiter_requests)?summary!.recruiter_requests:[];

  const completion=getVaCompletion(va,avatarUrl);
  if(!summaryError&&completion.score===0) redirect("/workspace/va/onboarding");
  const issues=collectQueryIssues({"your dashboard summary":summaryError});
  const vettingReadiness=getVettingReadiness(va,vetting,testScore,scorecardTotal,avatarUrl);
  const vetted=["approved","bench"].includes(vetting?.stage||"");
  const missingPublic=missingForPublic(va,avatarUrl);
  const directoryVisible=Boolean(vetted&&va?.directory_visible&&!missingPublic.length);
  const readyToPublish=Boolean(vetted&&!missingPublic.length&&!va?.directory_visible);
  const visibilityLabel=directoryVisible?"Recruiter profile active":vetted?"Recruiter profile ready":"Waiting for vetting";
  const visibilityCopy=directoryVisible?"Your approved profile can be used by recruiters for managed client searches.":!vetted?"Finish vetting before recruiters can present you to clients.":missingPublic.length?`Complete ${missingPublic.slice(0,3).join(", ")}${missingPublic.length>3?` +${missingPublic.length-3} more`:""}.`:"Your profile is approved and ready for recruiter matching.";

  let nextAction:DashboardAction;
  if(recruiterRequests.length){
    nextAction={title:"Your recruiter requested an update",copy:recruiterRequests[0]?.body||"Review the request and update your profile before the next matching round.",href:"/workspace/va/profile",label:"Update profile",icon:FileText};
  }else if(completion.score<VETTING_PROFILE_MIN&&completion.next){
    nextAction={title:"Get your profile ready for screening",copy:`Complete ${completion.next.label} so your profile is ready for vetting.`,href:completion.next.href,label:"Continue profile",icon:FileText};
  }else if(!vetted){
    nextAction={title:"Continue recruiter vetting",copy:"Finish the remaining vetting steps so recruiters can present you to clients.",href:"/workspace/va/vetting",label:"Continue vetting",icon:ShieldCheck};
  }else if(pipeline.offered){
    nextAction={title:`You have ${pipeline.offered} placement offer${pipeline.offered===1?"":"s"}`,copy:"Review the offer details before you accept.",href:"/workspace/va/offers",label:"Review offers",icon:BriefcaseBusiness};
  }else if(pipeline.interview){
    nextAction={title:`Prepare for ${pipeline.interview} interview${pipeline.interview===1?"":"s"}`,copy:"Check the schedule, meeting link, and role details.",href:"/workspace/va/interviews",label:"Open interviews",icon:BriefcaseBusiness};
  }else if(pendingInvites){
    nextAction={title:`You have ${pendingInvites} recruiter-approved opportunit${pendingInvites===1?"y":"ies"}`,copy:"Review the role and confirm if you want to continue.",href:"/workspace/va/applications",label:"Review opportunities",icon:BriefcaseBusiness};
    }else if(completion.score<100&&completion.next){
    nextAction={title:"Keep your vetted profile current",copy:`Complete ${completion.next.label} to keep your profile current.`,href:completion.next.href,label:"Update profile",icon:FileText};
  }else{
    nextAction={title:"Your vetted profile is ready",copy:"Your profile is ready. Keep your availability and rate current while you browse roles.",href:"/workspace/va/jobs",label:"Browse roles",icon:BriefcaseBusiness};
  }
  const NextIcon=nextAction.icon;

  const steps=[
    ...completion.items.slice(0,4).map((x)=>({label:x.label,done:x.done,href:x.href,description:undefined})),
    {label:"Complete VA vetting",description:"Skills test, video intro, recruiter review, and final approval are required before client presentation.",done:vetted,href:"/workspace/va/vetting"},
    {label:"Express interest in a role",description:"Your recruiter reviews your fit before anything is sent to a client.",done:Boolean(applicationCount),href:vetted?"/workspace/va/jobs":"/workspace/va/vetting"},
    {label:"Start your first managed placement",description:"A workroom opens after the VA accepts final terms and the client confirms the placement.",done:Boolean(workroomCount),href:"/workspace/va/workroom"}
  ];
  const onboardingDone=steps.every((step)=>step.done);

  return <div className="dash-page role-overview va-overview">
    <DashboardDegradedNotice issues={issues}/>
    {params.setup==="complete"?<div className="success-banner" role="status"><strong>Quick setup saved.</strong> Your profile is now {completion.score}% complete. Follow the next action below and finish the remaining items in smaller steps.</div>:null}
    <DashHeader title="VA dashboard" subtitle="Keep your profile current and manage applications, interviews, offers, and placements." actions={<Link className="dash-btn dash-btn-dark" href="/workspace/va/jobs">Find jobs</Link>}/>

    <section className="dashboard-next-action" aria-labelledby="va-next-action-title"><div className="dashboard-next-icon"><NextIcon size={24}/></div><div><span className="small">Next step</span><h2 id="va-next-action-title">{nextAction.title}</h2><p>{nextAction.copy}</p></div><Link className="btn btn-primary" href={nextAction.href}>{nextAction.label}<ArrowRight size={16}/></Link></section>

    <div className="va-status-strip">
      <Link className="status-summary-item" href="/workspace/va/profile"><div className="row-between"><span>Your profile</span><strong>{completion.score}%</strong></div><div className="progress" aria-label={`Profile ${completion.score}% complete`}><span style={{width:`${completion.score}%`}}/></div><small>{completion.next?`${completion.next.label} to strengthen recruiter evidence.`:"Ready for recruiter matching"}</small></Link>
      <Link className="status-summary-card" href="/workspace/va/vetting"><div className="row-between"><span>Vetting status</span><strong className="status-summary-text">{vettingStatusLabel(vetting?.stage)}</strong></div><div className="progress progress-green" aria-label={`Vetting ${vettingReadiness.score}% complete`}><span style={{width:`${vettingReadiness.score}%`}}/></div><small>{vettingReadiness.score}% of vetting requirements complete</small></Link>
      {readyToPublish?<form action={publishVaProfileAction} className="status-summary-item status-summary-action"><div className="row-between"><span>Recruiter visibility</span><Eye size={18}/></div><strong className="status-summary-text">Ready to activate</strong><small>Make your approved profile available for recruiter-managed searches.</small><button className="btn btn-primary btn-sm" type="submit">Activate profile</button></form>:<Link className="status-summary-card" href="/workspace/va/profile"><div className="row-between"><span>Recruiter visibility</span><Eye size={18}/></div><strong className="status-summary-text">{visibilityLabel}</strong><small>{visibilityCopy}</small></Link>}
      <Link className="status-summary-card" href="/workspace/va/notifications"><div className="row-between"><span>Updates</span><Bell size={18}/></div><strong>{unreadNotifications}</strong><small>{unreadNotifications?"Unread recruiter and hiring updates":"You are caught up"}</small></Link>
    </div>

    <section className="card dashboard-section-card"><div className="dashboard-section-head"><div><h2>Application progress</h2><p>Your current activity across recruiter review, interviews, offers, and placements.</p></div><Link className="btn btn-sm" href="/workspace/va/applications">View applications</Link></div><div className="pipeline-summary" aria-label="Recruiting pipeline">{[["Interest sent",pipeline.applied],["Recruiter shortlist",pipeline.shortlisted],["Interview",pipeline.interview],["Offer",pipeline.offered],["Placed",pipeline.hired]].map(([label,count])=><div className="pipeline-step" key={String(label)}><span>{label}</span><strong>{count}</strong></div>)}</div>{pipeline.rejected?<div className="small muted pipeline-footnote">{pipeline.rejected} opportunity{pipeline.rejected===1?" was":"ies were"} closed without placement.</div>:null}</section>

    {recruiterRequests.length?<section className="card dashboard-section-card recruiter-request-card"><div className="dashboard-section-head"><div><h2>Recruiter requests</h2><p>These are operational requests that can affect whether you are ready for client presentation.</p></div><Link className="btn btn-sm" href="/workspace/va/notifications">All updates</Link></div><div className="compact-list">{recruiterRequests.map((request)=><Link href={request.href||"/workspace/va/profile"} key={request.id}><span><strong>{request.title}</strong><small>{request.body||"Open your profile to review the requested change."}</small></span><ArrowRight size={15}/></Link>)}</div></section>:null}

    {!onboardingDone?<OnboardingChecklist title="Finish your VA setup" steps={steps} compact/>:null}
    <section className="dashboard-section-card"><Suspense fallback={<div className="dash-panel" aria-busy="true"><div className="workspace-skeleton-line wide"/><div className="workspace-skeleton-card"/></div>}><VaDashboardMatches va={va} vetted={vetted}/></Suspense></section>
  </div>;
}
