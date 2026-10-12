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
import { getVaHomeSignals } from "@/lib/dashboard-attention";
import { resolveVaHomeAction } from "@/lib/beginner-dashboard-actions";
import { getTrainingCredentialsForUser } from "@/lib/training-credentials";
import { TrainingCredentials } from "@/components/training-credentials";

async function VaDashboardCredentials({ userId }: { userId: string }) {
  try {
    const credentials = await getTrainingCredentialsForUser(userId);
    return credentials.length
      ? <section className="va-dashboard-training"><TrainingCredentials credentials={credentials} heading="Training completed" selfService/></section>
      : null;
  } catch {
    return <p className="small muted" role="status">Training credentials could not be loaded right now. Open Training to review your courses.</p>;
  }
}

export default async function VaDashboardPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
  const params=await searchParams;
  const {userId}=await requireRoleFast("va");
  // Keep the main dashboard independent of slow training credential lookups.
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

  const actionSignals = await getVaHomeSignals(userId);
  const nextAction = actionSignals
    ? resolveVaHomeAction({
        offers: actionSignals.offers,
        interviews: actionSignals.interviews,
        pendingInvites,
        workroomCount,
        recruiterRequests,
        completionScore: completion.score,
        completionNext: completion.next,
        minimumProfileScore: VETTING_PROFILE_MIN,
        vetted,
        unreadMessages: Number(summary?.unread_messages || 0),
      })
    : {
        title: "Check your latest hiring updates",
        copy: "We couldn't confirm your latest offers and interviews just now. You can still review all applications.",
        href: "/workspace/va/applications",
        label: "Open applications",
        tone: "waiting" as const,
      };
  const NextIcon = nextAction.href.includes("/offers") || nextAction.href.includes("/applications") ? BriefcaseBusiness
    : nextAction.href.includes("/workroom") ? Wrench
    : nextAction.href.includes("/vetting") ? ShieldCheck
    : nextAction.href.includes("/profile") ? FileText : Bell;

  // Profile and vetting are setup; being hired is not a condition for
  // finishing onboarding or hiding the setup checklist.
  const steps = [
    {
      label: "Build your screening-ready profile",
      description: "Add your work history, skills and availability.",
      done: completion.score >= VETTING_PROFILE_MIN,
      href: "/workspace/va/profile",
    },
    {
      label: "Complete recruiter screening",
      description: "Finish the requested assessment and wait for your recruiter to approve it.",
      done: vetted,
      href: "/workspace/va/vetting",
    },
  ];
  const onboardingDone = steps.every((step) => step.done);
  const offersNeedingReply = actionSignals?.offers.filter((offer) => offer.status === "pending_va").length || 0;

  return <div className="dash-page role-overview va-overview va-dashboard-simplified">
    <DashboardDegradedNotice issues={issues}/>
    {params.setup==="complete"?<div className="success-banner" role="status"><strong>Quick setup saved.</strong> Your profile is now {completion.score}% complete.</div>:null}

    <div className="va-dashboard-head"><DashHeader kicker="Your VA workspace" title="Your VA dashboard" subtitle="Find your next step, track applications and keep your work organized." actions={<div className="row wrap">{workroomCount?<Link className="btn btn-primary" href="/workspace/va/workroom">My Work</Link>:null}<Link className="dash-btn dash-btn-dark va-dashboard-find-jobs" href="/workspace/va/jobs">Find jobs</Link></div>}/></div>

    <section className="dashboard-next-action va-dashboard-next" aria-labelledby="va-next-action-title">
      <div className="dashboard-next-icon"><NextIcon size={24}/></div>
      <div><span className="small">{nextAction.tone === "decision" ? "Needs your attention" : "Your current update"}</span><h2 id="va-next-action-title">{nextAction.title}</h2><p>{nextAction.copy}</p></div>
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
        {pipeline.offered?<Link href="/workspace/va/offers"><strong>{pipeline.offered}</strong><span>{offersNeedingReply?`${offersNeedingReply} offer${offersNeedingReply===1?"":"s"} awaiting your response`:`offer${pipeline.offered===1?"":"s"} in progress`}</span><ArrowRight size={15}/></Link>:null}
        {workroomCount?<Link href="/workspace/va/workroom"><strong>{workroomCount}</strong><span>active placement{workroomCount===1?"":"s"}</span><ArrowRight size={15}/></Link>:null}
      </div>
    </section>

    {recruiterRequests.length?<section className="card dashboard-section-card recruiter-request-card va-dashboard-requests"><div className="dashboard-section-head"><div><h2>Recruiter requests</h2><p>Only requests that can affect matching or client presentation appear here.</p></div><Link className="btn btn-sm" href="/workspace/va/notifications"><Bell size={14}/> All updates</Link></div><div className="compact-list">{recruiterRequests.map((request)=><Link href={request.href||"/workspace/va/profile"} key={request.id}><span><strong>{request.title}</strong><small>{request.body||"Open your profile to review the requested change."}</small></span><ArrowRight size={15}/></Link>)}</div></section>:null}

    {!onboardingDone?<OnboardingChecklist title="Finish setting up your account" steps={steps} compact/>:null}

    <section className="dashboard-section-card va-dashboard-matches-section">
      <div className="dashboard-section-head"><div><h2>Recommended roles</h2><p>Use these as a starting point. Your applications page tracks what happens after you express interest.</p></div><Link className="btn btn-sm" href="/workspace/va/jobs">Browse all jobs</Link></div>
      <Suspense fallback={<div className="dash-panel" aria-busy="true"><div className="workspace-skeleton-line wide"/><div className="workspace-skeleton-card"/></div>}><VaDashboardMatches va={va} vetted={vetted}/></Suspense>
    </section>

    <Suspense fallback={null}><VaDashboardCredentials userId={userId}/></Suspense>

    {unreadNotifications?<Link className="va-dashboard-notification-link" href="/workspace/va/notifications"><Bell size={16}/><span><strong>{unreadNotifications} unread update{unreadNotifications===1?"":"s"}</strong><small>Recruiter and hiring notifications</small></span><ArrowRight size={15}/></Link>:null}
  </div>;
}
