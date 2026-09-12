import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertCircle, ArrowRight, BriefcaseBusiness, MessageSquare, Plus, Sparkles, UserRoundCheck, UsersRound } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { OnboardingChecklist } from "@/components/onboarding-checklist";
import { collectQueryIssues } from "@/lib/query-health";
import { DashboardDegradedNotice } from "@/components/dashboard-degraded-notice";
import { getWorkspaceBadgeResult } from "@/lib/workspace-badges";

type AttentionItem={title:string;copy:string;href:string;count:number;icon:typeof AlertCircle};

function countStatuses(rows:any[], statuses:string[]){return rows.filter((row)=>statuses.includes(row.status)).length;}

export default async function ClientDashboardPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
  const params=await searchParams;
  const {user}=await requireRole("client");
  const supabase=await createClient();
  const admin=createAdminClient();

  const [
    {data:company,error:companyError},
    {data:jobs,error:jobsError},
    {data:workrooms,error:workroomsError},
    {data:requested},
    {data:recentOwnedLead,error:hiringOwnerError},
    {data:applications,error:applicationsError},
    badgeResult
  ]=await Promise.all([
    supabase.from("client_profiles").select("*").eq("user_id",user.id).single(),
    supabase.from("jobs").select("id,title,status,created_at,published_at").eq("client_id",user.id).order("created_at",{ascending:false}),
    supabase.from("workrooms").select("id,status,job_id").eq("client_id",user.id),
    params.talent?supabase.from("public_va_directory").select("slug,full_name,headline,primary_category").eq("slug",params.talent).maybeSingle():Promise.resolve({data:null} as any),
    admin.from("lead_intake")
      .select("owner_id,owner:profiles!lead_intake_owner_id_fkey(full_name)")
      .eq("client_id",user.id)
      .not("owner_id","is",null)
      .order("created_at",{ascending:false})
      .limit(1)
      .maybeSingle(),
    admin.from("applications")
      .select("id,job_id,status,applied_at,match_score,jobs!applications_job_id_fkey!inner(client_id)")
      .eq("jobs.client_id",user.id)
      .order("applied_at",{ascending:false}),
    getWorkspaceBadgeResult("client",user.id)
  ]);

  if(!company?.onboarding_completed_at&&!(jobs||[]).length&&!params.talent)redirect("/workspace/client/onboarding");

  const hiringOwner=(recentOwnedLead as any)?.owner||null;
  const jobRows=jobs||[];
  const unreadMessages=badgeResult.badges["/workspace/client/messages"]||0;

  // Surfaced above the dashboard: a failed query would otherwise render as a
  // zero, and "All caught up" is the most dangerous thing this page can say to
  // a client who actually has offers waiting.
  const issues=collectQueryIssues({
    "your company profile":companyError,
    "your roles":jobsError,
    "your hires":workroomsError,
    "your hiring owner":hiringOwnerError,
    "applicant data":applicationsError,
    "your messages":badgeResult.error
  });

  const appRows=applications||[];
  const active=jobRows.filter((job:any)=>job.status==="published").length;
  const hires=(workrooms||[]).length;
  const applicants=appRows.length;
  const pipeline={
    applied:countStatuses(appRows,["new","reviewing"]),
    shortlisted:countStatuses(appRows,["shortlisted"]),
    interview:countStatuses(appRows,["interview"]),
    offered:countStatuses(appRows,["offered"]),
    hired:countStatuses(appRows,["hired"]),
    rejected:countStatuses(appRows,["rejected"])
  };

  const appsByJob=new Map<string,any[]>();
  for(const app of appRows){const list=appsByJob.get(app.job_id)||[];list.push(app);appsByJob.set(app.job_id,list);}

  const attention:AttentionItem[]=[];
  if(!jobRows.length) attention.push({title:"Post your first job",copy:"Tell us the role, budget, schedule, and skills. We can start recruiting from the brief.",href:"/workspace/client/jobs/new",count:1,icon:Plus});
  if(pipeline.applied) attention.push({title:"New applicants to review",copy:"Review the newest applicants and move strong candidates into your shortlist.",href:"/workspace/client/candidates",count:pipeline.applied,icon:UsersRound});
  if(pipeline.interview) attention.push({title:"Interviews in progress",copy:"Review interview-stage candidates and keep decisions moving.",href:"/workspace/client/candidates",count:pipeline.interview,icon:BriefcaseBusiness});
  if(pipeline.offered) attention.push({title:"Offers awaiting a hiring decision",copy:"Open the candidate pipeline to confirm the final hire when terms are agreed.",href:"/workspace/client/candidates",count:pipeline.offered,icon:Sparkles});
  if(unreadMessages>0) attention.push({title:"Unread candidate messages",copy:"Reply to candidate questions, interview follow-ups, and hiring conversations.",href:"/workspace/client/messages",count:unreadMessages,icon:MessageSquare});

  const steps=[
    {label:"Complete your company profile",description:"Add company details and hiring context.",done:Boolean(company?.company_name&&company?.timezone),href:"/workspace/client/company"},
    {label:"Send your first hiring request",description:"Tell us what you need and we will shape the brief, recruit, and match for the role.",done:Boolean(jobRows.length),href:"/workspace/client/jobs/new"},
    {label:"Review your shortlist",description:"Review the candidates our recruiting team puts in front of you.",done:Boolean(applicants),href:"/workspace/client/candidates"},
    {label:"Confirm a hire",description:"Choose the strongest fit once interviews and terms are complete.",done:Boolean(hires),href:"/workspace/client/workroom"}
  ];
  const onboardingDone=steps.every((step)=>step.done);
  const currentAction=pipeline.offered
    ? {title:`${pipeline.offered} hiring decision${pipeline.offered===1?"":"s"} waiting`,copy:"Review the final candidates and confirm who you want to hire.",href:"/workspace/client/candidates",label:"Review decisions",step:4}
    : pipeline.interview
      ? {title:`${pipeline.interview} interview${pipeline.interview===1?"":"s"} in progress`,copy:"Keep the process moving by reviewing interview-stage candidates.",href:"/workspace/client/candidates",label:"Review interviews",step:3}
      : pipeline.shortlisted
        ? {title:`${pipeline.shortlisted} candidate${pipeline.shortlisted===1?"":"s"} ready for review`,copy:"Your recruiter has prepared a shortlist for you.",href:"/workspace/client/candidates",label:"Review shortlist",step:2}
        : pipeline.applied
          ? {title:`${pipeline.applied} new candidate${pipeline.applied===1?"":"s"} ready to review`,copy:"New applicants are waiting. Review them now so promising candidates do not sit idle.",href:"/workspace/client/candidates",label:"Review candidates",step:2}
          : jobRows.length
          ? {title:"We’re finding candidates",copy:"Your recruiting team is reviewing the role and preparing the strongest matches.",href:"/workspace/client/jobs",label:"View role progress",step:1}
          : {title:"Tell us who you need",copy:"Share the work in your own words. We’ll turn it into a clear hiring brief.",href:"/workspace/client/jobs/new",label:"Start hiring",step:0};

  return <div className="dash-page role-overview client-overview">
    <DashboardDegradedNotice issues={issues}/>
    {requested?<div className="intent-banner"><div><strong>{requested.full_name}</strong><span className="small muted"> · {requested.headline||requested.primary_category||"Virtual Assistant"}</span><p className="small muted">Create a role and this Virtual Assistant preference will stay attached to it.</p></div><Link className="btn btn-primary" href={`/workspace/client/jobs/new?talent=${encodeURIComponent(requested.slug)}`}>Create role for this Virtual Assistant</Link></div>:null}

    <div className="dash-header"><div><div className="dash-kicker">Client hiring workspace</div><h1>Your hiring progress</h1><p>Follow one clear path from your hiring request to a successful start.</p><span className="dash-freshness">Live data · refreshed when this page opened</span></div><Link className="btn btn-primary btn-lg" href="/workspace/client/jobs/new"><Plus size={17}/> Start a hiring request</Link></div>

    <section className="client-concierge-strip">
      <div><span className="small">Your hiring team</span><h2>{hiringOwner?.full_name||"VirtualAssistant.com.ph recruiting team"}</h2><p>We handle screening, matching, and shortlist preparation. You step in when a decision needs your attention.</p></div>
      <Link className="btn" href="/workspace/client/messages"><MessageSquare size={16}/> Message hiring team</Link>
    </section>

    <section className="workflow-progress card" aria-label="Hiring progress"><div className="workflow-steps">{["Tell us what you need","We find candidates","Review shortlist","Interview","Hire & start"].map((label,index)=><div className={`workflow-step ${index<currentAction.step?"done":index===currentAction.step?"current":""}`} key={label}><span>{index<currentAction.step?"✓":index+1}</span><strong>{label}</strong></div>)}</div><div className="workflow-current"><div><span className="small">Current action</span><h2>{currentAction.title}</h2><p>{currentAction.copy}</p><small className="muted">{currentAction.step===1?"Waiting on our recruiting team":currentAction.step>=2?"Waiting on you":""}</small></div><Link className="btn btn-primary" href={currentAction.href}>{currentAction.label}<ArrowRight size={16}/></Link></div></section>

    {!jobRows.length?<section className="client-primary-action"><div><span className="small">Start or expand your team</span><h2>Tell us who you need. We will recruit for the role.</h2><p>You do not need to write a perfect job description. Start with the work you want off your plate, then refine the brief with our guidance.</p></div><Link className="btn btn-primary btn-lg" href="/workspace/client/jobs/new">Create hiring brief <ArrowRight size={17}/></Link></section>:null}


    <section className="card dashboard-section-card">
      <div className="dashboard-section-head"><div><h2>Needs your attention</h2><p>Only items that require a hiring decision or response appear here.</p></div>{attention.length?<span className="badge badge-warning">{attention.length} action{attention.length===1?"":"s"}</span>:<span className="badge badge-success">All caught up</span>}</div>
      {attention.length?<div className="attention-grid">{attention.slice(0,6).map((item)=>{const Icon=item.icon;return <Link className="attention-card" href={item.href} key={item.title}><div className="attention-count">{item.count}</div><div><div className="row"><Icon size={16}/><strong>{item.title}</strong></div><p>{item.copy}</p></div><ArrowRight size={16}/></Link>})}</div>:<div className="dashboard-caught-up"><UserRoundCheck size={22}/><div><strong>No urgent hiring actions right now.</strong><p>Keep an eye on new applicants and messages, or post another role when you are ready.</p></div><Link className="btn btn-sm" href="/workspace/client/jobs/new">Post another job</Link></div>}
    </section>

    <section className="card dashboard-section-card">
      <div className="dashboard-section-head"><div><h2>Hiring pipeline</h2><p>Combined status across all of your current and past applications.</p></div><Link className="btn btn-sm" href="/workspace/client/candidates">Open candidates</Link></div>
      <div className="pipeline-summary" aria-label="Client hiring pipeline">{[["Applied",pipeline.applied],["Shortlisted",pipeline.shortlisted],["Interview",pipeline.interview],["Offered",pipeline.offered],["Hired",pipeline.hired]].map(([label,count])=><div className="pipeline-step" key={String(label)}><span>{label}</span><strong>{count}</strong></div>)}</div>
      {pipeline.rejected?<div className="small muted pipeline-footnote">{pipeline.rejected} rejected candidate{pipeline.rejected===1?"":"s"} kept outside the active pipeline.</div>:null}
    </section>

    {!onboardingDone?<OnboardingChecklist title="Finish your hiring setup" steps={steps}/>:null}

    <div className="grid-2 dashboard-after-onboarding">
      <section className="card"><div className="dashboard-section-head"><div><h2>Your roles</h2><p>Applicant counts and pipeline stages are visible without opening every job.</p></div><Link className="btn btn-sm" href="/workspace/client/jobs">View all</Link></div>
        {jobRows.length?<div className="role-dashboard-list">{jobRows.slice(0,6).map((job:any)=>{const rows=appsByJob.get(job.id)||[];const counts={applied:countStatuses(rows,["new","reviewing"]),shortlisted:countStatuses(rows,["shortlisted"]),interview:countStatuses(rows,["interview"]),offered:countStatuses(rows,["offered"]),hired:countStatuses(rows,["hired"])};return <Link href={`/workspace/client/jobs/${job.id}`} key={job.id} className="role-dashboard-row"><div className="role-dashboard-main"><div className="row wrap"><strong>{job.title}</strong><span className={`badge ${job.status==="published"?"badge-success":job.status==="pending"?"badge-warning":""}`}>{String(job.status).replaceAll("_"," ")}</span></div><div className="role-dashboard-pipeline"><span><b>{rows.length}</b> applicants</span><span><b>{counts.shortlisted}</b> shortlisted</span><span><b>{counts.interview}</b> interview</span><span><b>{counts.offered}</b> offered</span><span><b>{counts.hired}</b> hired</span></div></div><ArrowRight size={16}/></Link>})}</div>:<div className="empty"><p>You have not posted a job yet.</p><Link className="btn btn-primary" href="/workspace/client/jobs/new">Post your first job</Link></div>}
      </section>

      <section className="card"><div className="dashboard-section-head"><div><h2>We handle the recruiting work</h2><p>Your team should not have to manage a marketplace. We review the brief, screen the pool, and bring the strongest candidates forward.</p></div><UserRoundCheck size={18}/></div><ol className="candidate-access-steps"><li>Tell us what you need</li><li>We screen and shortlist vetted Virtual Assistants</li><li>You review, interview, and choose</li></ol><div className="unlock-benefits"><span>Full candidate profiles appear once your role is approved</span><span>Recruiter-led shortlist instead of profile hunting</span><span>Direct messaging when candidates are ready</span><span>One clear path from request to hire</span></div><Link className="btn btn-primary" href="/workspace/client/messages" style={{width:"100%"}}>Message your hiring team</Link></section>
    </div>
  </div>;
}
