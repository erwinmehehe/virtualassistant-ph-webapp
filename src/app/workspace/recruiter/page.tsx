import Link from "next/link";
import { AlertCircle, BriefcaseBusiness, CheckCircle2, ClipboardList, Mail, MessageSquare, Sparkles, UserRoundCheck } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { PUBLIC_VA_MIN_COMPLETION } from "@/lib/public-visibility";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function RecruiterDashboard(){
  await requireRole("recruiter");
  const admin=createAdminClient();
  const since=new Date(Date.now()-7*86400000).toISOString();
  const [unreviewedRes,incompleteRes,readyRes,vettedHiddenRes,activeJobsRes,newAppsRes,unreadMessagesRes,recentLeadsRes,jobsRes,releasedRes]=await Promise.all([
    admin.from("va_vetting").select("va_id",{count:"exact",head:true}).eq("stage","recruiter_review"),
    admin.from("recruiter_va_directory").select("user_id",{count:"exact",head:true}).lt("completion_score",100).neq("stage","rejected").eq("account_status","active"),
    admin.from("recruiter_va_directory").select("user_id",{count:"exact",head:true}).gte("completion_score",PUBLIC_VA_MIN_COMPLETION).not("avatar_url","is",null).not("stage","in","(approved,bench,rejected)").eq("account_status","active"),
    admin.from("recruiter_va_directory").select("user_id",{count:"exact",head:true}).in("stage",["approved","bench"]).lt("completion_score",100).eq("account_status","active"),
    admin.from("jobs").select("id",{count:"exact",head:true}).in("status",["pending","published"]),
    admin.from("applications").select("id",{count:"exact",head:true}).eq("status","new"),
    admin.from("messages").select("id",{count:"exact",head:true}).is("read_at",null),
    admin.from("lead_intake").select("id",{count:"exact",head:true}).eq("status","new").gte("created_at",since),
    admin.from("jobs").select("id,title,company_name,status,created_at").in("status",["pending","published"]).order("created_at",{ascending:false}).limit(100),
    admin.from("job_shortlist_candidates").select("id",{count:"exact",head:true}).eq("shortlist_status","released")
  ]);

  // Both of these previously scanned their whole table -- every shortlist row
  // and every application ever created -- purely to work out which of the
  // hundred listed roles have no candidate yet. Scope them to those roles.
  const activeJobIds=(jobsRes.data||[]).map((job:any)=>job.id);
  const [shortlistRes,appsByJobRes]=activeJobIds.length
    ? await Promise.all([
        admin.from("job_shortlist_candidates").select("job_id").in("job_id",activeJobIds).in("shortlist_status",["proposed","released"]),
        admin.from("applications").select("job_id").in("job_id",activeJobIds)
      ])
    : [{data:[]} as any,{data:[]} as any];
  const candidateJobIds=new Set([...(shortlistRes.data||[]).map((r:any)=>r.job_id),...(appsByJobRes.data||[]).map((r:any)=>r.job_id)]);
  const noCandidates=(jobsRes.data||[]).filter((j:any)=>!candidateJobIds.has(j.id));
  const cards=[
    ["VAs waiting for your review",unreviewedRes.count||0,"/workspace/recruiter/queue",ClipboardList,"Candidates waiting for screening"],
    ["Incomplete profiles",incompleteRes.count||0,"/workspace/recruiter/talent?readiness=incomplete",AlertCircle,"Missing details clients need before hiring"],
    ["Waiting for your approval",readyRes.count||0,"/workspace/recruiter/talent?readiness=ready",UserRoundCheck,"Profile 80%+ complete, with a photo"],
    ["Vetted but not listed",vettedHiddenRes.count||0,"/workspace/recruiter/talent?readiness=vetted_hidden",UserRoundCheck,"Screened VAs still missing profile items"],
    ["Active client roles",activeJobsRes.count||0,"/workspace/recruiter/matching",BriefcaseBusiness,"Pending and published roles"],
    ["Roles with no candidates",noCandidates.length,"/workspace/recruiter/matching?view=needs_candidates",Sparkles,"Roles that need matching first"],
    ["New applications",newAppsRes.count||0,"/workspace/recruiter/matching?view=applications",CheckCircle2,"Fresh VA applications across roles"],
    ["Unread across all conversations",unreadMessagesRes.count||0,"/workspace/recruiter/activity?type=messages",MessageSquare,"Marketplace-wide signal, not your own inbox"],
    ["Recent client leads",recentLeadsRes.count||0,"/workspace/recruiter/leads",Mail,"New enquiries from the last 7 days"]
  ] as const;
  const today=[
    {priority:"urgent",title:"New client roles",count:(jobsRes.data||[]).filter((job:any)=>job.status==="pending").length,copy:"Review new hiring requests and begin matching.",href:"/workspace/recruiter/matching"},
    {priority:"high",title:"Roles waiting for candidates",count:noCandidates.length,copy:"Open the role and work from the recommended candidate list.",href:"/workspace/recruiter/matching?view=needs_candidates"},
    {priority:"medium",title:"Vetted VAs not yet listed",count:vettedHiddenRes.count||0,copy:"Screening is done but the profile is incomplete. Send a reminder naming what is missing.",href:"/workspace/recruiter/talent?readiness=vetted_hidden"},
    {priority:"medium",title:"VAs waiting for review",count:unreviewedRes.count||0,copy:"Complete screening so strong talent can become matchable.",href:"/workspace/recruiter/queue"},
    {priority:"low",title:"Client decisions to follow up",count:releasedRes.count||0,copy:"Check released shortlists and unblock the next hiring step.",href:"/workspace/recruiter/matching"}
  ];
  return <>
    <div className="page-head"><div><div className="kicker">Recruiter control center</div><h1>Today’s work</h1><p>Start at the top of the action queue. Each item is blocking a client, a candidate, or an open role.</p></div><div className="row wrap"><Link className="btn" href="/workspace/recruiter/talent">Open VA directory</Link><Link className="btn btn-primary" href="/workspace/recruiter/matching">Match active roles</Link></div></div>
    <section className="card today-work-queue"><div className="dashboard-section-head"><div><h2>Action queue</h2><p>Prioritized by what is blocking a client, candidate, or active role.</p></div><span className="badge badge-warning">{today.reduce((total,item)=>total+item.count,0)} open actions</span></div><div className="today-work-list">{today.map((item)=><Link key={item.title} href={item.href} className={`today-work-item ${item.priority}`}><span className="today-work-count">{item.count}</span><div><div className="row wrap"><strong>{item.title}</strong><span className={`badge priority-badge ${item.priority}`}>{item.priority}</span></div><small>{item.copy}</small></div><span className="small muted">{item.count?"Open queue →":"Clear"}</span></Link>)}</div></section>
    <div className="recruiter-control-grid">{cards.map(([label,count,href,Icon,copy])=><Link className="control-card" href={href} key={label}><div className="control-card-icon"><Icon size={19}/></div><div><span>{label}</span><strong>{count}</strong><small>{copy}</small></div></Link>)}</div>
    <div className="grid-2 dashboard-ops-grid">
      <section className="card"><div className="row-between wrap"><div><h2 style={{margin:0}}>Roles that need matching</h2><p className="small muted">No applications or assigned shortlist yet.</p></div><Link className="btn btn-sm" href="/workspace/recruiter/matching?view=needs_candidates">View all</Link></div>{noCandidates.slice(0,6).length?<div className="compact-list">{noCandidates.slice(0,6).map((job:any)=><Link href={`/workspace/recruiter/matching/${job.id}`} key={job.id}><span><strong>{job.title}</strong><small>{job.company_name||"Client role"}</small></span><span className="badge badge-warning">Needs candidates</span></Link>)}</div>:<div className="empty">Every active role has at least one candidate signal.</div>}</section>
      <section className="card"><h2 style={{marginTop:0}}>Fast cleanup</h2><p className="muted">Use the master directory to filter by readiness, stale activity, photo, resume, stage, experience, and rate. Then apply one bulk action to the filtered set.</p><div className="row wrap"><Link className="btn btn-primary" href="/workspace/recruiter/talent?readiness=incomplete">Clean incomplete profiles</Link><Link className="btn" href="/workspace/recruiter/talent?stale=60">Review stale VAs</Link><Link className="btn" href="/workspace/recruiter/talent?readiness=zero">Email 0% profiles</Link></div></section>
    </div>
  </>;
}
