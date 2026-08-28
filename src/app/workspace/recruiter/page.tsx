import Link from "next/link";
import { AlertCircle, BriefcaseBusiness, CheckCircle2, ClipboardList, Mail, MessageSquare, Sparkles, UserRoundCheck } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function RecruiterDashboard(){
  await requireRole("recruiter");
  const admin=createAdminClient();
  const since=new Date(Date.now()-7*86400000).toISOString();
  const [unreviewedRes,incompleteRes,readyRes,activeJobsRes,newAppsRes,unreadMessagesRes,recentLeadsRes,jobsRes,shortlistRes,appsByJobRes]=await Promise.all([
    admin.from("va_vetting").select("va_id",{count:"exact",head:true}).eq("stage","recruiter_review"),
    admin.from("recruiter_va_directory").select("user_id",{count:"exact",head:true}).lt("completion_score",100),
    admin.from("recruiter_va_directory").select("user_id",{count:"exact",head:true}).gte("completion_score",90).not("avatar_url","is",null).not("resume_path","is",null).not("stage","in","(approved,bench,rejected)"),
    admin.from("jobs").select("id",{count:"exact",head:true}).in("status",["pending","published"]),
    admin.from("applications").select("id",{count:"exact",head:true}).eq("status","new"),
    admin.from("messages").select("id",{count:"exact",head:true}).is("read_at",null),
    admin.from("lead_intake").select("id",{count:"exact",head:true}).eq("status","new").gte("created_at",since),
    admin.from("jobs").select("id,title,company_name,status,created_at").in("status",["pending","published"]).order("created_at",{ascending:false}).limit(100),
    admin.from("job_shortlist_candidates").select("job_id").in("shortlist_status",["proposed","released"]),
    admin.from("applications").select("job_id")
  ]);
  const candidateJobIds=new Set([...(shortlistRes.data||[]).map((r:any)=>r.job_id),...(appsByJobRes.data||[]).map((r:any)=>r.job_id)]);
  const noCandidates=(jobsRes.data||[]).filter((j:any)=>!candidateJobIds.has(j.id));
  const cards=[
    ["Unreviewed VAs",unreviewedRes.count||0,"/workspace/recruiter/queue",ClipboardList,"Candidates waiting for screening"],
    ["Incomplete profiles",incompleteRes.count||0,"/workspace/recruiter/talent?readiness=incomplete",AlertCircle,"Profiles missing required hiring details"],
    ["Ready to approve",readyRes.count||0,"/workspace/recruiter/talent?readiness=ready",UserRoundCheck,"90%+ profiles with required evidence"],
    ["Active client roles",activeJobsRes.count||0,"/workspace/recruiter/matching",BriefcaseBusiness,"Pending and published roles"],
    ["Roles with no candidates",noCandidates.length,"/workspace/recruiter/matching?view=needs_candidates",Sparkles,"Roles that need matching first"],
    ["New applications",newAppsRes.count||0,"/workspace/recruiter/matching?view=applications",CheckCircle2,"Fresh VA applications across roles"],
    ["Unread messages",unreadMessagesRes.count||0,"/workspace/recruiter/activity?type=messages",MessageSquare,"Unread client / VA conversation activity"],
    ["Recent client leads",recentLeadsRes.count||0,"/workspace/recruiter/leads",Mail,"New enquiries from the last 7 days"]
  ] as const;
  return <>
    <div className="page-head"><div><div className="kicker">Recruiter control center</div><h1>What needs attention</h1><p>Work the exceptions first: incomplete talent, roles without candidates, new applications, and fresh client demand.</p></div><div className="row wrap"><Link className="btn" href="/workspace/recruiter/talent">Open VA directory</Link><Link className="btn btn-primary" href="/workspace/recruiter/matching">Match active roles</Link></div></div>
    <div className="recruiter-control-grid">{cards.map(([label,count,href,Icon,copy])=><Link className="control-card" href={href} key={label}><div className="control-card-icon"><Icon size={19}/></div><div><span>{label}</span><strong>{count}</strong><small>{copy}</small></div></Link>)}</div>
    <div className="grid-2 dashboard-ops-grid">
      <section className="card"><div className="row-between wrap"><div><h2 style={{margin:0}}>Roles that need matching</h2><p className="small muted">No applications or assigned shortlist yet.</p></div><Link className="btn btn-sm" href="/workspace/recruiter/matching?view=needs_candidates">View all</Link></div>{noCandidates.slice(0,6).length?<div className="compact-list">{noCandidates.slice(0,6).map((job:any)=><Link href={`/workspace/recruiter/matching/${job.id}`} key={job.id}><span><strong>{job.title}</strong><small>{job.company_name||"Client role"}</small></span><span className="badge badge-warning">Needs candidates</span></Link>)}</div>:<div className="empty">Every active role has at least one candidate signal.</div>}</section>
      <section className="card"><h2 style={{marginTop:0}}>Fast cleanup</h2><p className="muted">Use the master directory to filter by readiness, stale activity, photo, resume, stage, experience, and rate. Then apply one bulk action to the filtered set.</p><div className="row wrap"><Link className="btn btn-primary" href="/workspace/recruiter/talent?readiness=incomplete">Clean incomplete profiles</Link><Link className="btn" href="/workspace/recruiter/talent?stale=60">Review stale VAs</Link><Link className="btn" href="/workspace/recruiter/talent?readiness=zero">Email 0% profiles</Link></div></section>
    </div>
  </>;
}
