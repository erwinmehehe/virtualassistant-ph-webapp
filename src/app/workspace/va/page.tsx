import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ProfileCompleteness } from "@/components/profile-completeness";
import { OnboardingChecklist } from "@/components/onboarding-checklist";
import { JobCard } from "@/components/job-card";
import { getVaCompletion } from "@/lib/profile-completeness";
import { getVettingReadiness, vettingStatusLabel } from "@/lib/vetting";
import { matchScore } from "@/lib/matching";

export default async function VaDashboardPage(){
  const {user}=await requireRole("va");const supabase=await createClient();const admin=createAdminClient();
  const [{data:va},{data:accountProfile},{data:apps},{data:jobs},{data:invites},{data:workrooms},{data:vetting},{data:attempt},{data:scorecard},{data:certifications}]=await Promise.all([
    supabase.from("va_profiles").select("*").eq("user_id",user.id).single(),
    supabase.from("profiles").select("avatar_url").eq("id",user.id).single(),
    supabase.from("applications").select("id,status").eq("va_id",user.id),
    supabase.from("jobs").select("*").eq("status","published").order("published_at",{ascending:false}).limit(20),
    supabase.from("job_invites").select("id,status").eq("va_id",user.id),
    supabase.from("workrooms").select("id").eq("va_id",user.id),
    admin.from("va_vetting").select("*").eq("va_id",user.id).single(),
    admin.from("va_test_attempts").select("final_score,auto_score").eq("va_id",user.id).order("submitted_at",{ascending:false}).limit(1).maybeSingle(),
    admin.from("vetting_scorecards").select("total_score").eq("va_id",user.id).order("created_at",{ascending:false}).limit(1).maybeSingle(),
    supabase.from("public_va_certifications").select("category").eq("va_id",user.id)
  ]);
  const completion=getVaCompletion(va,accountProfile?.avatar_url);const testScore=attempt?.final_score??attempt?.auto_score??null;const vettingReadiness=getVettingReadiness(va,vetting,testScore,scorecard?.total_score??null,accountProfile?.avatar_url);const vetted=["approved","bench"].includes(vetting?.stage||"");
  const matches=(jobs||[]).map((job:any)=>({job,score:matchScore(job,va||{})})).sort((a,b)=>b.score-a.score).slice(0,3);
  const steps=[...completion.items.slice(0,4).map((x)=>({label:x.label,done:x.done,href:x.href,description:undefined})),{label:"Complete VA vetting",description:"Pass your skills test, video intro, recruiter review, and final approval.",done:vetted,href:"/workspace/va/vetting"},{label:"Apply to your first job",description:"Approved VAs can apply with their vetted profile.",done:Boolean(apps?.length),href:vetted?"/workspace/va/jobs":"/workspace/va/vetting"},{label:"Start your first workroom",description:"A workroom opens after a client hires you.",done:Boolean(workrooms?.length),href:"/workspace/va/workroom"}];
  return <><div className="page-head"><div><h1>Your VA workspace</h1><p>Build your profile, complete vetting, find matching roles, and keep every application in one place.</p></div><Link className="btn btn-primary" href={vetted?"/workspace/va/jobs":"/workspace/va/vetting"}>{vetted?"Find jobs":"Continue vetting"}</Link></div><div className="stats"><div className="stat-card"><span className="small muted">Profile strength</span><strong>{completion.score}%</strong></div><div className="stat-card"><span className="small muted">Vetting status</span><strong style={{fontSize:18}}>{vettingStatusLabel(vetting?.stage)}</strong></div><div className="stat-card"><span className="small muted">Applications</span><strong>{apps?.length||0}</strong></div><div className="stat-card"><span className="small muted">Active workrooms</span><strong>{workrooms?.length||0}</strong></div><div className="stat-card"><span className="small muted">Certifications</span><strong>{certifications?.length||0}</strong></div></div><OnboardingChecklist title="Your VA onboarding" steps={steps}/><div className="dashboard-grid dashboard-after-onboarding"><div className="stack"><div className="card"><div className="row-between" style={{marginBottom:14}}><div><h3 style={{margin:0}}>Best job matches</h3><span className="small muted">Matching starts from your categories, skills, tools, hours, and overlap. Applications to client roles require completed vetting.</span></div><Link className="btn btn-sm" href="/workspace/va/jobs">View all</Link></div>{vetted?<div className="stack">{matches.length?matches.map(({job,score}:any)=><JobCard key={job.id} job={job} match={score}/>):<div className="empty">Complete your profile to improve job matching.</div>}</div>:<div className="empty"><p>Your job matches are ready, but applications stay locked until you pass vetting.</p><Link className="btn btn-primary" href="/workspace/va/vetting">Complete vetting</Link></div>}</div></div><div className="stack"><ProfileCompleteness profile={va} avatarUrl={accountProfile?.avatar_url}/><div className="card"><div className="row-between"><div><h3 style={{margin:0}}>Vetting readiness</h3><span className="small muted">{vettingReadiness.score}% complete</span></div><span className={`badge ${vetted?"badge-success":"badge-warning"}`}>{vettingStatusLabel(vetting?.stage)}</span></div><div className="progress progress-green" style={{margin:"14px 0"}}><span style={{width:`${vettingReadiness.score}%`}}/></div><Link className="btn" href="/workspace/va/vetting" style={{width:"100%"}}>Open vetting</Link></div></div></div></>;
}
