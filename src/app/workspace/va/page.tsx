import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ArrowRight, Bell, BriefcaseBusiness, CheckCircle2, Eye, FileText, ShieldCheck, Wrench } from "lucide-react";
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
import { getTrainingCredentialsForUser } from "@/lib/training-credentials";
import { TrainingCredentials } from "@/components/training-credentials";

type DashboardAction={title:string;copy:string;href:string;label:string;icon:typeof ArrowRight};

export default async function VaDashboardPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
  const params=await searchParams;
  const {userId}=await requireRoleFast("va");
  const [{data:summary,error:summaryError},trainingCredentials]=await Promise.all([getVaDashboardSummary(userId),getTrainingCredentialsForUser(userId)]);
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

  let nextAction:DashboardAction;
  if(recruiterRequests.length){
    nextAction={title:"Your recruiter requested an update",copy:recruiterRequests[0]?.body||"Review the request and update your profile before the next matching round.",href:"/workspace/va/profile",label:"Update profile",icon:FileText};
  }else if(completion.score<VETTING_PROFILE_MIN&&completion.next){
    nextAction={title:"Get your profile ready for screening",copy:`Complete ${completion.next.label} so your profile is ready for vetting.`,href:completion.next.href,label:"Continue profile",icon:FileText};
  }else if(!vetted){
    nextAction={title:"Continue recruiter vetting",copy:"Finish the remaining vetting steps so recruiters can present you to clients.",href:"/workspace/va/vetting",label:"Continue vetting",icon:ShieldCheck};
  }else if(pipeline.offered){
    nextAction={title:`You have ${pipeline.offered} placement offer${pipeline.offered===1?"":"s"}`,copy:"Review the final rate, hours, schedule and start date before you accept.",href:"/workspace/va/offers",label:"Review offers",icon:BriefcaseBusiness};
  }else if(pipeline.interview){
    nextAction={title:`Prepare for ${pipeline.interview} interview${pipeline.interview===1?"":"s"}`,copy:"Check the schedule, meeting link, and role details.",href:"/workspace/va/interviews",label:"Open interviews",icon:BriefcaseBusiness};
  }else if(pendingInvites){
    nextAction={title:`You have ${pendingInvites} recruiter-approved opportunit${pendingInvites===1?"y":"ies"}`,copy:"Review the role and confirm whether you want to continue.",href:"/workspace/va/applications",label:"Review opportunities",icon:BriefcaseBusiness};
  }else if(workroomCount){
    nextAction={title:"Your placement is active",copy:"Open My Placement to manage onboarding, tasks, time and Client Success check-ins.",href:"/workspace/va/workroom",label:"Open placement",icon:Wrench};
  }else{
    nextAction={title:"Your profile is ready for opportunities",copy:"Keep availability and rate current, then browse roles that fit your experience.",href:"/workspace/va/jobs",label:"Find jobs",icon:BriefcaseBusiness};
  }
  const NextIcon=nextAction.icon;

  const steps=[
    ...completion.items.slice(0,4).map((x)=>({label:x.label,done:x.done,href:x.href,description:undefined})),
    {label:"Complete VA vetting",description:"Skills test, video intro, recruiter review, and final approval are required before client presentation.",done:vetted,href:"/workspace/va/vetting"},
    {label:"Express interest in a role",description:"Your recruiter reviews your fit before anything is sent to a client.",done:Boolean(applicationCount),href:vetted?"/workspace/va/jobs":"/workspace/va/vetting"},
    {label:"Start your first managed placement",description:"A workroom opens after final terms are accepted and the client confirms the placement.",done:Boolean(workroomCount),href:"/workspace/va/workroom"}
  ];
  const onboardingDone=steps.every((step)=>step.done);

  return <div className="dash-page role-overview va-overview va-dashboard-simplified">
    <DashboardDegradedNotice issues={issues}/>
    {params.setup==="complete"?<div className="success-banner" role="status"><strong>Quick setup saved.</strong> Your profile is now {completion.score}% complete.</div>:null}

    <div className="va-dashboard-head"><DashHeader kicker="Your VA workspace" title="What needs you next" subtitle="Keep one clear next step in front of you. Everything else can wait." actions={<Link className="dash-btn dash-btn-dark va-dashboard-find-jobs" href="/workspace/va/jobs">Find jobs</Link>}/></div>

    <section className="dashboard-next-action va-dashboard-next" aria-labelledby="va-next-action-title">
      <div className="dashboard-next-icon"><NextIcon size={24}/></div>
      <div><span className="small">Next action</span><h2 id="va-next-action-title">{nextAction.title}</h2><p>{nextAction.copy}</p></div>
      <Link className="btn btn-primary" href={nextAction.href}>{nextAction.label}<ArrowRight size={16}/></Link>
    </section>

    <section className="card va-readiness-card">
      <div className="dashboard-section-head">
        <div><h2>VA readiness</h2><p>Profile, vetting and recruiter visibility in one place.</p></div>
        {vetted?<span className="badge badge-success"><CheckCircle2 size={13}/> {vettingStatusLabel(vetting?.stage)}</span>:<span className="badge badge-warning">{vettingStatusLabel(vetting?.stage)}</span>}
      </div>
      <div className="va-readiness-grid">
        <Link href="/workspace/va/profile"><span>Profile</span><strong>{completion.score}%</strong><div className="progress" aria-label={`Profile ${completion.score}% complete`}><span style={{width:`${completion.score}%`}}/></div><small>{completion.next?`${completion.next.label} is still incomplete.`:"Profile complete"}</small></Link>
        <Link href="/workspace/va/vetting"><span>Vetting</span><strong>{vettingReadiness.score}%</strong><div className="progress progress-green" aria-label={`Vetting ${vettingReadiness.score}% complete`}><span style={{width:`${vettingReadiness.score}%`}}/></div><small>{vetted?"Approved for recruiter matching":"Complete the remaining screening steps"}</small></Link>
        <div className="va-readiness-visibility"><span>Recruiter visibility</span><strong>{directoryVisible?"Active":readyToPublish?"Ready":"Not ready"}</strong><small>{directoryVisible?"Recruiters can use your approved profile in managed searches.":readyToPublish?"Activate your approved profile for recruiter matching.":"Finish profile and vetting first."}</small>{readyToPublish?<form action={publishVaProfileAction}><button className="btn btn-sm btn-primary" type="submit"><Eye size={14}/> Activate profile</button></form>:<Link className="text-link small" href="/workspace/va/profile">Review profile</Link>}</div>
      </div>
    </section>

    <section className="card va-dashboard-opportunities">
      <div className="dashboard-section-head"><div><h2>Your hiring activity</h2><p>Applications are the main hub. Interviews and offers are stages inside that journey.</p></div><Link className="btn btn-sm" href="/workspace/va/applications">Open applications</Link></div>
      <div className="pipeline-summary" aria-label="Recruiting pipeline">{[["Applied",pipeline.applied],["Recruiter review",pipeline.shortlisted],["Interview",pipeline.interview],["Offer",pipeline.offered],["Placed",pipeline.hired]].map(([label,count])=><div className="pipeline-step" key={String(label)}><span>{label}</span><strong>{count}</strong></div>)}</div>
      <div className="va-dashboard-activity-links">
        {pendingInvites?<Link href="/workspace/va/applications"><strong>{pendingInvites}</strong><span>opportunit{pendingInvites===1?"y":"ies"} waiting for your response</span><ArrowRight size={15}/></Link>:null}
        {pipeline.interview?<Link href="/workspace/va/interviews"><strong>{pipeline.interview}</strong><span>interview{pipeline.interview===1?"":"s"} in progress</span><ArrowRight size={15}/></Link>:null}
        {pipeline.offered?<Link href="/workspace/va/offers"><strong>{pipeline.offered}</strong><span>offer{pipeline.offered===1?"":"s"} awaiting a decision</span><ArrowRight size={15}/></Link>:null}
        {workroomCount?<Link href="/workspace/va/workroom"><strong>{workroomCount}</strong><span>active placement{workroomCount===1?"":"s"}</span><ArrowRight size={15}/></Link>:null}
      </div>
    </section>

    {recruiterRequests.length?<section className="card dashboard-section-card recruiter-request-card va-dashboard-requests"><div className="dashboard-section-head"><div><h2>Recruiter requests</h2><p>Only requests that can affect matching or client presentation appear here.</p></div><Link className="btn btn-sm" href="/workspace/va/notifications"><Bell size={14}/> All updates</Link></div><div className="compact-list">{recruiterRequests.map((request)=><Link href={request.href||"/workspace/va/profile"} key={request.id}><span><strong>{request.title}</strong><small>{request.body||"Open your profile to review the requested change."}</small></span><ArrowRight size={15}/></Link>)}</div></section>:null}

    {!onboardingDone?<OnboardingChecklist title="Finish your VA setup" steps={steps} compact/>:null}

    <section className="dashboard-section-card va-dashboard-matches-section">
      <div className="dashboard-section-head"><div><h2>Recommended roles</h2><p>Use these as a starting point. Your applications page tracks what happens after you express interest.</p></div><Link className="btn btn-sm" href="/workspace/va/jobs">Browse all jobs</Link></div>
      <Suspense fallback={<div className="dash-panel" aria-busy="true"><div className="workspace-skeleton-line wide"/><div className="workspace-skeleton-card"/></div>}><VaDashboardMatches va={va} vetted={vetted}/></Suspense>
    </section>

    {trainingCredentials.length?<section className="va-dashboard-training"><TrainingCredentials credentials={trainingCredentials} heading="Training completed" selfService/></section>:null}

    {unreadNotifications?<Link className="va-dashboard-notification-link" href="/workspace/va/notifications"><Bell size={16}/><span><strong>{unreadNotifications} unread update{unreadNotifications===1?"":"s"}</strong><small>Recruiter and hiring notifications</small></span><ArrowRight size={15}/></Link>:null}
  </div>;
}
