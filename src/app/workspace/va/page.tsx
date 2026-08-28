import Link from "next/link";
import { ArrowRight, Bell, BriefcaseBusiness, CheckCircle2, Clock3, Eye, FileText, MessageSquare, ShieldCheck, Sparkles } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { OnboardingChecklist } from "@/components/onboarding-checklist";
import { JobCard } from "@/components/job-card";
import { getVaCompletion } from "@/lib/profile-completeness";
import { getVettingReadiness, vettingStatusLabel } from "@/lib/vetting";
import { matchScore } from "@/lib/matching";

type DashboardAction={title:string;copy:string;href:string;label:string;icon:typeof ArrowRight};

function statusCount(rows:any[], statuses:string[]){return rows.filter((row)=>statuses.includes(row.status)).length;}

export default async function VaDashboardPage(){
  const {user}=await requireRole("va");
  const supabase=await createClient();
  const admin=createAdminClient();

  const [
    {data:va},
    {data:accountProfile},
    {data:apps},
    {data:jobs},
    {data:invites},
    {data:workrooms},
    {data:vetting},
    {data:attempt},
    {data:scorecard},
    {data:certifications},
    {data:notifications},
    {data:conversations}
  ]=await Promise.all([
    supabase.from("va_profiles").select("*").eq("user_id",user.id).single(),
    supabase.from("profiles").select("avatar_url").eq("id",user.id).single(),
    supabase.from("applications").select("id,status,job_id,applied_at,jobs(id,slug,title,company_name)").eq("va_id",user.id).order("applied_at",{ascending:false}),
    supabase.from("jobs").select("*").eq("status","published").order("published_at",{ascending:false}).limit(20),
    supabase.from("job_invites").select("id,status,created_at,jobs(id,slug,title,company_name)").eq("va_id",user.id).order("created_at",{ascending:false}),
    supabase.from("workrooms").select("id,status").eq("va_id",user.id),
    admin.from("va_vetting").select("*").eq("va_id",user.id).single(),
    admin.from("va_test_attempts").select("final_score,auto_score").eq("va_id",user.id).order("submitted_at",{ascending:false}).limit(1).maybeSingle(),
    admin.from("vetting_scorecards").select("total_score").eq("va_id",user.id).order("created_at",{ascending:false}).limit(1).maybeSingle(),
    supabase.from("public_va_certifications").select("category").eq("va_id",user.id),
    supabase.from("notifications").select("id,title,body,href,read_at,created_at").eq("user_id",user.id).order("created_at",{ascending:false}).limit(40),
    supabase.from("conversations").select("id").eq("va_id",user.id)
  ]);

  const conversationIds=(conversations||[]).map((row:any)=>row.id);
  const {count:unreadMessages}=conversationIds.length
    ? await supabase.from("messages").select("id",{count:"exact",head:true}).in("conversation_id",conversationIds).neq("sender_id",user.id).is("read_at",null)
    : {count:0};

  const completion=getVaCompletion(va,accountProfile?.avatar_url);
  const testScore=attempt?.final_score??attempt?.auto_score??null;
  const vettingReadiness=getVettingReadiness(va,vetting,testScore,scorecard?.total_score??null,accountProfile?.avatar_url);
  const vetted=["approved","bench"].includes(vetting?.stage||"");
  const applicationRows=apps||[];
  const pendingInvites=(invites||[]).filter((row:any)=>row.status==="pending");
  const unreadNotifications=(notifications||[]).filter((row:any)=>!row.read_at);
  const recruiterRequests=unreadNotifications.filter((row:any)=>String(row.href||"").startsWith("/workspace/va/profile")||/update|profile|recruiter/i.test(`${row.title||""} ${row.body||""}`));

  const pipeline={
    applied:statusCount(applicationRows,["new","reviewing"]),
    shortlisted:statusCount(applicationRows,["shortlisted"]),
    interview:statusCount(applicationRows,["interview"]),
    offered:statusCount(applicationRows,["offered"]),
    hired:statusCount(applicationRows,["hired"]),
    rejected:statusCount(applicationRows,["rejected"])
  };

  const publicRequirements=[
    {label:"photo",done:Boolean(accountProfile?.avatar_url)},
    {label:"headline",done:Boolean(va?.headline&&va.headline.length>=8)},
    {label:"summary",done:Boolean(va?.bio&&va.bio.length>=80)},
    {label:"5 skills",done:Boolean(va?.skills&&va.skills.length>=5)},
    {label:"2+ years experience",done:Number(va?.years_experience||0)>=2},
    {label:"availability",done:Number(va?.weekly_hours||0)>=1},
    {label:"rate",done:Number(va?.hourly_rate||0)>=5},
    {label:"resume",done:Boolean(va?.resume_path)}
  ];
  const missingPublic=publicRequirements.filter((item)=>!item.done).map((item)=>item.label);
  const directoryVisible=Boolean(vetted&&va?.directory_visible&&!missingPublic.length);
  const visibilityLabel=directoryVisible?"Visible to clients":vetted?"Not public yet":"Waiting for vetting";
  const visibilityCopy=directoryVisible
    ? "Your approved profile is eligible for public discovery."
    : !vetted
      ? "Complete vetting before your profile can be published."
      : missingPublic.length
        ? `Complete ${missingPublic.slice(0,3).join(", ")}${missingPublic.length>3?` +${missingPublic.length-3} more`:""}.`
        : "Turn on directory visibility from your profile when you are ready.";

  const matches=(jobs||[]).map((job:any)=>({job,score:matchScore(job,va||{})})).sort((a,b)=>b.score-a.score).slice(0,3);

  let nextAction:DashboardAction;
  if(recruiterRequests.length){
    nextAction={title:"Your recruiter requested a profile update",copy:recruiterRequests[0]?.body||"Review the request and update your profile before the next matching round.",href:"/workspace/va/profile",label:"Update profile",icon:FileText};
  }else if(completion.score<100&&completion.next){
    nextAction={title:`Your profile is ${completion.score}% complete`,copy:`Next: ${completion.next.label}. A stronger profile improves recruiter matching and public eligibility.`,href:completion.next.href,label:"Continue profile",icon:FileText};
  }else if(!vetted){
    nextAction={title:"Finish vetting to unlock applications",copy:`Your vetting readiness is ${vettingReadiness.score}%. Complete the remaining evidence so recruiters can approve you for roles.`,href:"/workspace/va/vetting",label:"Continue vetting",icon:ShieldCheck};
  }else if(pendingInvites.length){
    nextAction={title:`You have ${pendingInvites.length} client invitation${pendingInvites.length===1?"":"s"}`,copy:"Review the role details and accept only the opportunities that fit your schedule and experience.",href:"/workspace/va/applications",label:"Review invitations",icon:BriefcaseBusiness};
  }else if(pipeline.offered){
    nextAction={title:`You have ${pipeline.offered} active offer${pipeline.offered===1?"":"s"}`,copy:"Open Applications to review the latest hiring status and keep the conversation moving.",href:"/workspace/va/applications",label:"Review offers",icon:Sparkles};
  }else if((unreadMessages||0)>0){
    nextAction={title:`You have ${unreadMessages} unread message${unreadMessages===1?"":"s"}`,copy:"Reply promptly so interviews, scope questions, and hiring decisions do not stall.",href:"/workspace/va/messages",label:"Open messages",icon:MessageSquare};
  }else if(pipeline.interview){
    nextAction={title:`Prepare for ${pipeline.interview} interview${pipeline.interview===1?"":"s"}`,copy:"Review the role requirements, your relevant examples, availability, and questions for the client.",href:"/workspace/va/applications",label:"View interviews",icon:BriefcaseBusiness};
  }else{
    nextAction={title:"Your profile is ready for matching",copy:matches[0]?`Your strongest current match is ${matches[0].score}% fit. Review the role before applying.`:"Keep your availability current and check back as new client roles are published.",href:"/workspace/va/jobs",label:"Browse matching jobs",icon:Sparkles};
  }
  const NextIcon=nextAction.icon;

  const steps=[
    ...completion.items.slice(0,4).map((x)=>({label:x.label,done:x.done,href:x.href,description:undefined})),
    {label:"Complete VA vetting",description:"Pass your skills test, video intro, recruiter review, and final approval.",done:vetted,href:"/workspace/va/vetting"},
    {label:"Apply to your first job",description:"Approved VAs can apply with their vetted profile.",done:Boolean(applicationRows.length),href:vetted?"/workspace/va/jobs":"/workspace/va/vetting"},
    {label:"Start your first workroom",description:"A workroom opens after a client hires you.",done:Boolean(workrooms?.length),href:"/workspace/va/workroom"}
  ];
  const onboardingDone=steps.every((step)=>step.done);

  return <>
    <div className="page-head"><div><div className="kicker">VA workspace</div><h1>What should you do next?</h1><p>Keep your profile ready, respond to recruiter requests, and move promising applications forward.</p></div><Link className="btn btn-primary" href="/workspace/va/jobs">Browse jobs</Link></div>

    <section className="dashboard-next-action" aria-labelledby="va-next-action-title"><div className="dashboard-next-icon"><NextIcon size={24}/></div><div><span className="small">Next best action</span><h2 id="va-next-action-title">{nextAction.title}</h2><p>{nextAction.copy}</p></div><Link className="btn btn-primary" href={nextAction.href}>{nextAction.label}<ArrowRight size={16}/></Link></section>

    <div className="va-status-grid">
      <Link className="status-summary-card" href="/workspace/va/profile"><div className="row-between"><span>Profile readiness</span><strong>{completion.score}%</strong></div><div className="progress" aria-label={`Profile ${completion.score}% complete`}><span style={{width:`${completion.score}%`}}/></div><small>{completion.next?`Next: ${completion.next.label}`:"Profile essentials complete"}</small></Link>
      <Link className="status-summary-card" href="/workspace/va/vetting"><div className="row-between"><span>Vetting status</span><strong className="status-summary-text">{vettingStatusLabel(vetting?.stage)}</strong></div><div className="progress progress-green" aria-label={`Vetting ${vettingReadiness.score}% complete`}><span style={{width:`${vettingReadiness.score}%`}}/></div><small>{vettingReadiness.score}% of vetting requirements complete</small></Link>
      <Link className="status-summary-card" href="/workspace/va/profile"><div className="row-between"><span>Profile visibility</span><Eye size={18}/></div><strong className="status-summary-text">{visibilityLabel}</strong><small>{visibilityCopy}</small></Link>
      <Link className="status-summary-card" href="/workspace/va/notifications"><div className="row-between"><span>Updates</span><Bell size={18}/></div><strong>{unreadNotifications.length}</strong><small>{unreadNotifications.length?"Unread recruiter and hiring updates":"You are caught up"}</small></Link>
    </div>

    <section className="card dashboard-section-card">
      <div className="dashboard-section-head"><div><h2>Application pipeline</h2><p>See where your active applications stand without opening every role.</p></div><Link className="btn btn-sm" href="/workspace/va/applications">Open applications</Link></div>
      <div className="pipeline-summary" aria-label="Application pipeline">
        {[['Applied',pipeline.applied],['Shortlisted',pipeline.shortlisted],['Interview',pipeline.interview],['Offered',pipeline.offered],['Hired',pipeline.hired]].map(([label,count])=><div className="pipeline-step" key={String(label)}><span>{label}</span><strong>{count}</strong></div>)}
      </div>
      {pipeline.rejected?<div className="small muted pipeline-footnote">{pipeline.rejected} rejected application{pipeline.rejected===1?"":"s"} kept outside the active pipeline.</div>:null}
    </section>

    {recruiterRequests.length?<section className="card dashboard-section-card recruiter-request-card"><div className="dashboard-section-head"><div><h2>Recruiter requests</h2><p>These updates can affect whether you are matched to client roles.</p></div><Link className="btn btn-sm" href="/workspace/va/notifications">All notifications</Link></div><div className="compact-list">{recruiterRequests.slice(0,3).map((request:any)=><Link href={request.href||"/workspace/va/profile"} key={request.id}><span><strong>{request.title}</strong><small>{request.body||"Open your profile to review the requested changes."}</small></span><ArrowRight size={15}/></Link>)}</div></section>:null}

    {!onboardingDone?<OnboardingChecklist title="Finish setting up your VA account" steps={steps}/>:null}

    <div className="dashboard-grid dashboard-after-onboarding">
      <div className="stack">
        <div className="card"><div className="dashboard-section-head"><div><h2>Best job matches</h2><p>Ranked from your skills, categories, tools, schedule, availability, and role requirements.</p></div><Link className="btn btn-sm" href="/workspace/va/jobs">View all</Link></div>{vetted?<div className="stack">{matches.length?matches.map(({job,score}:any)=><JobCard key={job.id} job={job} match={score}/>):<div className="empty">No strong matches are available right now. Keep your profile and availability current.</div>}</div>:<div className="empty"><p>Your job matches will unlock after vetting.</p><Link className="btn btn-primary" href="/workspace/va/vetting">Complete vetting</Link></div>}</div>
      </div>
      <div className="stack">
        <div className="card"><div className="dashboard-section-head"><div><h3>Availability</h3><p>Keep this current so recruiters do not match you to roles you cannot take.</p></div><Clock3 size={18}/></div><div className="availability-summary"><strong>{String(va?.availability_status||"available").replaceAll("_"," ")}</strong><span>{va?.weekly_hours?`${va.weekly_hours} hrs/week`:"Weekly hours not set"}</span><span>{(va as any)?.preferred_timezone||va?.schedule||"Timezone/schedule not set"}</span></div><Link className="btn" href="/workspace/va/profile#availability" style={{width:"100%"}}>Update availability</Link></div>
        <div className="card"><div className="dashboard-section-head"><div><h3>Account signals</h3><p>Recruiters use these alongside your profile and vetting evidence.</p></div><CheckCircle2 size={18}/></div><div className="compact-metrics"><span><strong>{certifications?.length||0}</strong><small>Certifications</small></span><span><strong>{pendingInvites.length}</strong><small>Pending invites</small></span><span><strong>{unreadMessages||0}</strong><small>Unread messages</small></span></div></div>
      </div>
    </div>
  </>;
}
