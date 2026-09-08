import Link from "next/link";
import { ReleasedShortlists } from "@/components/released-shortlists";
import { pendingReleasedMatches } from "@/lib/agency-pipeline";
import { redirect } from "next/navigation";
import { AlertCircle, ArrowRight, BriefcaseBusiness, Heart, LockKeyhole, MessageSquare, Plus, Sparkles, UserRoundCheck, UsersRound } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { OnboardingChecklist } from "@/components/onboarding-checklist";
import { candidateAccessUnlocked } from "@/lib/candidate-access";
import { collectQueryIssues } from "@/lib/query-health";
import { DashboardDegradedNotice } from "@/components/dashboard-degraded-notice";

type AttentionItem={title:string;copy:string;href:string;count:number;icon:typeof AlertCircle};

function countStatuses(rows:any[], statuses:string[]){return rows.filter((row)=>statuses.includes(row.status)).length;}

export default async function ClientDashboardPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
  const params=await searchParams;
  const {user}=await requireRole("client");
  const supabase=await createClient();
  const admin=createAdminClient();

  const [{data:company,error:companyError},{data:jobs,error:jobsError},{data:workrooms,error:workroomsError},{count:savedCount},{data:requested},{data:conversations,error:conversationsError}]=await Promise.all([
    supabase.from("client_profiles").select("*").eq("user_id",user.id).single(),
    supabase.from("jobs").select("id,title,status,created_at,published_at").eq("client_id",user.id).order("created_at",{ascending:false}),
    supabase.from("workrooms").select("id,status,job_id").eq("client_id",user.id),
    supabase.from("saved_vas").select("va_id",{count:"exact",head:true}).eq("client_id",user.id),
    params.talent?supabase.from("public_va_directory").select("slug,full_name,headline,primary_category").eq("slug",params.talent).maybeSingle():Promise.resolve({data:null} as any),
    admin.from("conversations").select("id").eq("client_id",user.id)
  ]);

  if(!company?.onboarding_completed_at&&!(jobs||[]).length&&!params.talent)redirect("/workspace/client/onboarding");

  const jobRows=jobs||[];
  const jobIds=jobRows.map((job:any)=>job.id);
  const conversationIds=(conversations||[]).map((row:any)=>row.id);

  const [{data:applications,error:applicationsError},{data:accessRows,error:accessError},{count:unreadMessages,error:messagesError},{data:released,error:shortlistError}]=await Promise.all([
    jobIds.length?admin.from("applications").select("id,job_id,va_id,status,applied_at,match_score").in("job_id",jobIds).order("applied_at",{ascending:false}):Promise.resolve({data:[]} as any),
    jobIds.length?admin.from("job_candidate_access").select("job_id,access_status").in("job_id",jobIds):Promise.resolve({data:[]} as any),
    conversationIds.length?admin.from("messages").select("id",{count:"exact",head:true}).in("conversation_id",conversationIds).neq("sender_id",user.id).is("read_at",null):Promise.resolve({count:0} as any),
    jobIds.length?admin.from("job_shortlist_candidates").select("job_id,va_id").in("job_id",jobIds).eq("shortlist_status","released"):Promise.resolve({data:[],error:null})
  ]);

  // Surfaced above the dashboard: a failed query would otherwise render as a
  // zero, and "All caught up" is the most dangerous thing this page can say to
  // a client who actually has offers waiting.
  const issues=collectQueryIssues({
    "your company profile":companyError,
    "your roles":jobsError,
    "your hires":workroomsError,
    "applicant data":applicationsError,
    "candidate access status":accessError,
    "your messages":conversationsError||messagesError
  });

  if (shortlistError) issues.push("your curated shortlists");
  const appRows=applications||[];
  const pendingMatches=pendingReleasedMatches(released||[],appRows);
  const activeJobIds=new Set(jobRows.filter((job:any)=>["pending","published"].includes(job.status)).map((job:any)=>job.id));
  const activeMatches=pendingMatches.filter(row=>activeJobIds.has(row.job_id));
  const accessMap=new Map<string,string|null>((accessRows||[]).map((row:any)=>[String(row.job_id),row.access_status?String(row.access_status):null]));
  const active=jobRows.filter((job:any)=>["pending","published"].includes(job.status)).length;
  const hires=(workrooms||[]).length;
  const applicants=appRows.length;
  const pipeline={
    applied:countStatuses(appRows,["new","reviewing"]),
    shortlisted:countStatuses(appRows,["shortlisted"])+activeMatches.length,
    interview:countStatuses(appRows,["interview"]),
    offered:countStatuses(appRows,["offered"]),
    hired:countStatuses(appRows,["hired"]),
    rejected:countStatuses(appRows,["rejected"])
  };

  const appsByJob=new Map<string,any[]>();
  for(const app of appRows){const list=appsByJob.get(app.job_id)||[];list.push(app);appsByJob.set(app.job_id,list);}
  const lockedJobsWithApplicants=jobRows.filter((job:any)=>{
    const count=(appsByJob.get(job.id)||[]).length;
    return count>0&&!candidateAccessUnlocked(accessMap.get(job.id));
  });

  const attention:AttentionItem[]=[];
  if(activeMatches.length) attention.push({title:"Your curated shortlist is ready",copy:"Review the candidates selected by your recruiting team.",href:"/workspace/client/candidates#curated-matches",count:activeMatches.length,icon:Sparkles});
  if(!jobRows.length) attention.push({title:"Post your first job",copy:"Tell us the role, budget, schedule, and skills. We can start recruiting from the brief.",href:"/workspace/client/jobs/new",count:1,icon:Plus});
  if(pipeline.applied) attention.push({title:"New applicants to review",copy:"Review the newest applicants and move strong candidates into your shortlist.",href:"/workspace/client/candidates",count:pipeline.applied,icon:UsersRound});
  if(pipeline.interview) attention.push({title:"Interviews in progress",copy:"Review interview-stage candidates and keep decisions moving.",href:"/workspace/client/candidates",count:pipeline.interview,icon:BriefcaseBusiness});
  if(pipeline.offered) attention.push({title:"Offers awaiting a hiring decision",copy:"Open the candidate pipeline to confirm the final hire when terms are agreed.",href:"/workspace/client/candidates",count:pipeline.offered,icon:Sparkles});
  if((unreadMessages||0)>0) attention.push({title:"Unread candidate messages",copy:"Reply to candidate questions, interview follow-ups, and hiring conversations.",href:"/workspace/client/messages",count:unreadMessages||0,icon:MessageSquare});
  if(lockedJobsWithApplicants.length) attention.push({title:"Candidate details are still locked",copy:"People have applied, but their details stay private until you request access for the role. Nothing is charged when you ask.",href:"/workspace/client/jobs",count:lockedJobsWithApplicants.length,icon:LockKeyhole});

  const steps=[
    {label:"Complete your company profile",description:"Add company details and hiring context.",done:Boolean(company?.company_name&&company?.timezone),href:"/workspace/client/company"},
    {label:"Post your first job",description:"Tell us what you need and we will recruit and match for the role.",done:Boolean(jobRows.length),href:"/workspace/client/jobs/new"},
    {label:"Review applicants and matches",description:"Use the applicant pipeline and curated shortlist.",done:Boolean(applicants || pendingMatches.length),href:"/workspace/client/candidates"},
    {label:"Activate candidate access",description:"Unlock identity, resume, contact details and direct messaging.",done:Boolean((accessRows||[]).some((a:any)=>candidateAccessUnlocked(a.access_status))),href:"/workspace/client/jobs"},
    {label:"Confirm a hire",description:"Create the workroom after final rate, schedule and start date are agreed.",done:Boolean(hires),href:"/workspace/client/workroom"}
  ];
  const onboardingDone=steps.every((step)=>step.done);
  const currentAction=pipeline.offered
    ? {title:`${pipeline.offered} hiring decision${pipeline.offered===1?"":"s"} waiting`,copy:"Review the final candidates and confirm who you want to hire.",href:"/workspace/client/candidates",label:"Review decisions",step:4}
    : pipeline.interview
      ? {title:`${pipeline.interview} interview${pipeline.interview===1?"":"s"} in progress`,copy:"Keep the process moving by reviewing interview-stage candidates.",href:"/workspace/client/candidates",label:"Review interviews",step:3}
      : pipeline.shortlisted
        ? {title:`${pipeline.shortlisted} candidate${pipeline.shortlisted===1?"":"s"} ready for review`,copy:"Your recruiter has prepared a shortlist for you.",href:"/workspace/client/candidates",label:"Review shortlist",step:2}
        : pipeline.applied
          ? {title:`${pipeline.applied} applicant${pipeline.applied===1?"":"s"} ready for review`,copy:"Review the latest candidates for your role.",href:"/workspace/client/candidates",label:"Review candidates",step:2}
        : jobRows.length
          ? {title:"We’re finding candidates",copy:"Your recruiting team is reviewing the role and preparing the strongest matches.",href:"/workspace/client/jobs",label:"View role progress",step:1}
          : {title:"Tell us who you need",copy:"Share the work in your own words. We’ll turn it into a clear hiring brief.",href:"/workspace/client/jobs/new",label:"Start hiring",step:0};

  const quick=[
    ["Hiring brief","Start a new hiring request","/workspace/client/jobs/new",Plus,true],
    ["Active roles",`${active} active role${active===1?"":"s"}`,"/workspace/client/jobs",BriefcaseBusiness,false],
    ["Applicants",`${applicants} applicant${applicants===1?"":"s"}`,"/workspace/client/candidates",UsersRound,false],
    ["Saved VAs",`${savedCount||0} saved profile${savedCount===1?"":"s"}`,"/workspace/client/saved",Heart,false],
    ["Messages",`${unreadMessages||0} unread message${unreadMessages===1?"":"s"}`,"/workspace/client/messages",MessageSquare,false],
    ["Hires",`${hires} placement${hires===1?"":"s"}`,"/workspace/client/workroom",UserRoundCheck,false]
  ] as const;

  return <>
    <DashboardDegradedNotice issues={issues}/>
    {requested?<div className="intent-banner"><div><strong>{requested.full_name}</strong><span className="small muted"> · {requested.headline||requested.primary_category||"Virtual Assistant"}</span><p className="small muted">Create a role and this VA preference will stay attached to it.</p></div><Link className="btn btn-primary" href={`/workspace/client/jobs/new?talent=${encodeURIComponent(requested.slug)}`}>Create role for this VA</Link></div>:null}

    <div className="page-head"><div><div className="kicker">Client hiring workspace</div><h1>Your hiring progress</h1><p>Follow one clear path from your hiring request to a successful start.</p></div><Link className="btn btn-primary btn-lg" href="/workspace/client/jobs/new"><Plus size={17}/> Start a hiring request</Link></div>

    <section className="workflow-progress card" aria-label="Hiring progress"><div className="workflow-steps">{["Tell us what you need","We find candidates","Review shortlist","Interview","Hire & start"].map((label,index)=><div className={`workflow-step ${index<currentAction.step?"done":index===currentAction.step?"current":""}`} key={label}><span>{index<currentAction.step?"✓":index+1}</span><strong>{label}</strong></div>)}</div><div className="workflow-current"><div><span className="small">Current action</span><h2>{currentAction.title}</h2><p>{currentAction.copy}</p><small className="muted">{currentAction.step===1?"Waiting on our recruiting team":currentAction.step>=2?"Waiting on you":""}</small></div><Link className="btn btn-primary" href={currentAction.href}>{currentAction.label}<ArrowRight size={16}/></Link></div></section>

    {!jobRows.length?<section className="client-primary-action"><div><span className="small">Start or expand your team</span><h2>Tell us who you need. We will recruit for the role.</h2><p>You do not need to write a perfect job description. Start with the work you want off your plate, then refine the brief with our guidance.</p></div><Link className="btn btn-primary btn-lg" href="/workspace/client/jobs/new">Create hiring brief <ArrowRight size={17}/></Link></section>:null}

    <ReleasedShortlists jobs={jobRows} matches={activeMatches}/>
    <div className="client-hiring-grid">{quick.map(([label,copy,href,Icon,primary])=><Link key={label} href={href} className={`client-hiring-card ${primary?"primary":""}`}><Icon size={20}/><span><strong>{label}</strong><small>{copy}</small></span></Link>)}</div>

    <section className="card dashboard-section-card">
      <div className="dashboard-section-head"><div><h2>Needs your attention</h2><p>Only items that require a hiring decision or response appear here.</p></div>{attention.length?<span className="badge badge-warning">{attention.length} action{attention.length===1?"":"s"}</span>:<span className="badge">{issues.length ? "Some data unavailable" : "All caught up"}</span>}</div>
      {attention.length?<div className="attention-grid">{attention.slice(0,6).map((item)=>{const Icon=item.icon;return <Link className="attention-card" href={item.href} key={item.title}><div className="attention-count">{item.count}</div><div><div className="row"><Icon size={16}/><strong>{item.title}</strong></div><p>{item.copy}</p></div><ArrowRight size={16}/></Link>})}</div>:<div className="dashboard-caught-up"><UserRoundCheck size={22}/><div><strong>{issues.length ? "Some hiring information could not be loaded." : "No urgent hiring actions right now."}</strong><p>Keep an eye on new applicants and messages, or post another role when you are ready.</p></div><Link className="btn btn-sm" href="/workspace/client/jobs/new">Post another job</Link></div>}
    </section>

    <section className="card dashboard-section-card">
      <div className="dashboard-section-head"><div><h2>Hiring pipeline</h2><p>Combined status across all of your current and past applications.</p></div><Link className="btn btn-sm" href="/workspace/client/candidates">Open candidates</Link></div>
      <div className="pipeline-summary" aria-label="Client hiring pipeline">{[['Applied',pipeline.applied],['Shortlisted',pipeline.shortlisted],['Interview',pipeline.interview],['Offered',pipeline.offered],['Hired',pipeline.hired]].map(([label,count])=><div className="pipeline-step" key={String(label)}><span>{label}</span><strong>{count}</strong></div>)}</div>
      {pipeline.rejected?<div className="small muted pipeline-footnote">{pipeline.rejected} rejected candidate{pipeline.rejected===1?"":"s"} kept outside the active pipeline.</div>:null}
    </section>

    {!onboardingDone?<OnboardingChecklist title="Finish your hiring setup" steps={steps}/>:null}

    <div className="grid-2 dashboard-after-onboarding">
      <section className="card"><div className="dashboard-section-head"><div><h2>Your roles</h2><p>Applicant counts and pipeline stages are visible without opening every job.</p></div><Link className="btn btn-sm" href="/workspace/client/jobs">View all</Link></div>
        {jobRows.length?<div className="role-dashboard-list">{jobRows.slice(0,6).map((job:any)=>{const rows=appsByJob.get(job.id)||[];const locked=rows.length>0&&!candidateAccessUnlocked(accessMap.get(job.id));const counts={applied:countStatuses(rows,["new","reviewing"]),shortlisted:countStatuses(rows,["shortlisted"])+activeMatches.filter(match=>match.job_id===job.id).length,interview:countStatuses(rows,["interview"]),offered:countStatuses(rows,["offered"]),hired:countStatuses(rows,["hired"])};return <Link href={`/workspace/client/jobs/${job.id}`} key={job.id} className="role-dashboard-row"><div className="role-dashboard-main"><div className="row wrap"><strong>{job.title}</strong><span className={`badge ${job.status==="published"?"badge-success":job.status==="pending"?"badge-warning":""}`}>{String(job.status).replaceAll("_"," ")}</span>{locked?<span className="protected-inline"><LockKeyhole size={13}/> Contact locked</span>:null}</div><div className="role-dashboard-pipeline"><span><b>{rows.length}</b> applicants</span><span><b>{counts.shortlisted}</b> shortlisted</span><span><b>{counts.interview}</b> interview</span><span><b>{counts.offered}</b> offered</span><span><b>{counts.hired}</b> hired</span></div></div><ArrowRight size={16}/></Link>})}</div>:<div className="empty"><p>You have not posted a job yet.</p><Link className="btn btn-primary" href="/workspace/client/jobs/new">Post your first job</Link></div>}
      </section>

      <section className="card"><div className="dashboard-section-head"><div><h2>Candidate access</h2><p>You can always see how many people applied. Their names and contact details stay private until access is active for that role — this is by design, not an error.</p></div><LockKeyhole size={18}/></div><ol className="candidate-access-steps"><li>Open a role and request access</li><li>We send you the price for that role</li><li>Access turns on and you can contact candidates</li></ol><div className="unlock-benefits"><span>Full permitted VA identity and contact details</span><span>Private resume access</span><span>Direct candidate messaging</span><span>Comparison and hiring controls</span></div><Link className="btn btn-primary" href={lockedJobsWithApplicants[0]?`/workspace/client/jobs/${lockedJobsWithApplicants[0].id}`:"/workspace/client/jobs"} style={{width:"100%"}}>{lockedJobsWithApplicants.length?"Request access for your role":"Review role access"}</Link></section>
    </div>
  </>;
}
