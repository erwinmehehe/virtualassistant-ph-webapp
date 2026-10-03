import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Sparkles } from "lucide-react";
import { requireRoleFast } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { acceptCommercialTermsAction, closeJobAction } from "@/app/actions/jobs";
import { dateShort, money } from "@/lib/format";
import { mergeUniqueStrings, uniqueStrings } from "@/lib/collections";
import { candidateAccessLabel } from "@/lib/candidate-access";

export default async function ClientJobDetail({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<Record<string,string|undefined>>}){
  const {id}=await params;const query=await searchParams;const {userId}=await requireRoleFast("client");const supabase=await createClient();const {data:job}=await supabase.from("jobs").select("*").eq("id",id).eq("client_id",userId).single();if(!job)notFound();
  const admin=createAdminClient();
  const [{data:commercial},{data:access},{data:releasedRows},{data:interviews},{data:offers},{data:workrooms}]=await Promise.all([
    supabase.from("job_commercials").select("*").eq("job_id",id).maybeSingle(),
    admin.from("job_candidate_access").select("access_status").eq("job_id",id).maybeSingle(),
    admin.from("job_shortlist_candidates").select("id,client_decision").eq("job_id",id).eq("shortlist_status","released"),
    admin.from("candidate_interviews").select("id,status,client_decision").eq("job_id",id).neq("status","cancelled"),
    admin.from("placement_offers").select("id,status").eq("job_id",id),
    admin.from("workrooms").select("id,status").eq("job_id",id)
  ]);
  const released=releasedRows||[];const waitingDecisions=released.filter((row:any)=>!row.client_decision).length;const interested=released.filter((row:any)=>row.client_decision==="interested").length;const interviewCount=(interviews||[]).filter((row:any)=>["requested","scheduled","completed"].includes(row.status)).length;const activeOfferCount=(offers||[]).filter((row:any)=>["pending_va","pending_client"].includes(row.status)).length;const hired=(workrooms||[]).some((row:any)=>row.status==="active");
  const roleApproved=job.status==="published"||commercial?.commercial_status==="accepted";
  const progress=hired?{title:"Placement active",copy:"The confirmed VA is now in the workroom for onboarding, tasks, approved time, and ongoing support.",href:"/workspace/client/workroom",label:"Open workroom"}:activeOfferCount?{title:"Final terms are in progress",copy:"Your recruiter prepared the placement terms. The VA accepts first, then you confirm the placement.",href:"/workspace/client/offers",label:"Review offer"}:interviewCount?{title:"Interview stage",copy:"Manage interview times and record a simple Proceed, Hold, or Pass decision so the recruiter can act.",href:"/workspace/client/interviews",label:"Open interviews"}:released.length?{title:`${released.length} recruiter-selected candidate${released.length===1?"":"s"}`,copy:waitingDecisions?`${waitingDecisions} shortlist decision${waitingDecisions===1?"":"s"} waiting on you.`:interested?"Your recruiter has your interest feedback and will coordinate the next step.":"Your recruiter is reviewing your feedback and replacement needs.",href:`/workspace/client/candidates?role=${job.id}`,label:"Open recruiter shortlist"}:roleApproved?{title:"Recruiting in progress",copy:"Your recruiter is screening the vetted pool against the approved brief before presenting anyone to you.",href:"/workspace/client/messages",label:"Message your recruiter"}:{title:"Hiring request under review",copy:"We are confirming the brief and service terms before client-facing recruiting begins.",href:"/workspace/client/messages",label:"Message your recruiter"};

  const stageIndex=hired?4:activeOfferCount?3:interviewCount?2:released.length?1:0;
  const stageLabels=["Brief","Shortlist","Interview","Offer","Start"];

  return <div className="client-role-detail-page">
    {query.saved?<div className="success-banner" role="status"><CheckCircle2 size={17}/> Hiring request saved.</div>:null}

    <header className="client-role-detail-hero">
      <div>
        <Link className="text-link small" href="/workspace/client/jobs">← Hiring requests</Link>
        <div className="row wrap client-role-detail-status"><span className={`badge ${job.status==="published"?"badge-success":job.status==="pending"?"badge-warning":""}`}>{job.status==="published"?"Recruiting":job.status==="pending"?"In review":String(job.status).replaceAll("_"," ")}</span><span className="small muted">Created {dateShort(job.created_at)}</span></div>
        <h1>{job.title}</h1>
        <p>{job.company_name||"Your company"} · {job.hours_per_week?`${job.hours_per_week} hrs/week`:"Flexible hours"} · VA compensation from {money(job.min_hourly_rate)}/hr</p>
      </div>
      <div className="client-role-detail-actions">{job.status!=="closed"?<Link className="btn" href={`/workspace/client/jobs/${job.id}/edit`}>Edit request</Link>:null}{job.status!=="closed"?<form action={closeJobAction}><input type="hidden" name="job_id" value={job.id}/><button className="text-button client-role-close" type="submit">Close role</button></form>:null}</div>
    </header>

    {job.status==="pending"?<div className="alert client-role-review-alert">{commercial?.commercial_status==="quoted"?"Your brief has been reviewed. Approve the service terms below to start recruiting.":"Your recruiter has the request. We can prepare the search while the brief and service terms are confirmed."}</div>:null}
    {job.rejection_note?<div className="alert"><strong>Review note:</strong> {job.rejection_note}</div>:null}

    <section className="client-role-stage-card">
      <div className="candidate-next-icon"><Sparkles size={21}/></div>
      <div className="client-role-stage-copy"><span className="small">What is happening now</span><h2>{progress.title}</h2><p>{progress.copy}</p></div>
      <Link className="btn btn-primary" href={progress.href}>{progress.label}</Link>
    </section>

    <section className="client-role-progress" aria-label="Hiring progress">
      {stageLabels.map((label,index)=><div className={`client-role-progress-step ${index<stageIndex?"done":index===stageIndex?"current":""}`} key={label}><span>{index<stageIndex?"✓":index+1}</span><strong>{label}</strong></div>)}
    </section>

    <div className="client-role-detail-layout">
      <main className="client-role-detail-main">
        <section className="card client-role-brief">
          <div className="dashboard-section-head"><div><h2>Role brief</h2><p>This is the brief your recruiter uses to screen and shortlist candidates.</p></div>{job.status!=="closed"?<Link className="text-link small" href={`/workspace/client/jobs/${job.id}/edit`}>Edit brief</Link>:null}</div>
          <div className="role-match-brief client-role-brief-grid">
            <div><strong>Timezone</strong><p className="muted">{job.timezone||"Not set"}</p></div>
            <div><strong>Hours</strong><p className="muted">{job.hours_per_week?`${job.hours_per_week} hrs/week`:"Flexible"}</p></div>
            <div><strong>Experience</strong><p className="muted">{job.experience_level||"Not set"}</p></div>
            <div><strong>Start</strong><p className="muted">{job.start_timing||"Flexible"}</p></div>
            <div><strong>Specialties</strong><p className="muted">{uniqueStrings(job.categories).join(", ")||"Not set"}</p></div>
            <div><strong>Skills & tools</strong><p className="muted">{mergeUniqueStrings(job.required_skills,job.required_tools).join(", ")||"Not set"}</p></div>
            {job.summary?<div className="span-2 client-role-brief-copy"><strong>What this VA will own</strong><p className="muted">{job.summary}</p></div>:null}
            {job.description?<div className="span-2 client-role-brief-copy"><strong>Role details</strong><p className="muted" style={{whiteSpace:"pre-wrap"}}>{job.description}</p></div>:null}
          </div>
        </section>

        <section className="card client-role-handling">
          <div className="dashboard-section-head"><div><h2>Your recruiter handles the search</h2><p>You only step in when there is a shortlist, interview or final decision.</p></div>{released.length?<Link className="btn btn-primary btn-sm" href={`/workspace/client/candidates?role=${job.id}`}>Review shortlist</Link>:null}</div>
          <div className="client-role-managed-steps">
            <div><span>1</span><p><strong>Screen</strong> We check role fit, evidence, schedule, rate and availability.</p></div>
            <div><span>2</span><p><strong>Shortlist</strong> You see only recruiter-selected VAs worth reviewing.</p></div>
            <div><span>3</span><p><strong>Coordinate</strong> We manage interviews, offer, placement and handoff.</p></div>
          </div>
        </section>
      </main>

      <aside className="client-role-detail-sidebar">
        <div className="client-role-stats">
          <div className="card"><div className="small muted">Shortlisted</div><strong>{released.length}</strong><div className="small muted">{waitingDecisions?"Waiting on your review":"Recruiter-selected VAs"}</div></div>
          <div className="card"><div className="small muted">Interviews</div><strong>{interviewCount}</strong><div className="small muted">{interviewCount?"In the interview stage":"None scheduled yet"}</div></div>
          <div className="card"><div className="small muted">Role status</div><strong className="client-role-stat-status">{job.status==="published"?"Recruiting":job.status==="pending"?"In review":String(job.status).replaceAll("_"," ")}</strong><div className="small muted">{candidateAccessLabel(access?.access_status)}</div></div>
        </div>

        <div className="card commercial-card client-role-commercial">
          <div className="client-role-commercial-head"><div><div className="small muted">Hiring service</div><strong>{job.service_model==="managed_service"?"Managed Virtual Assistant service":"Vetted recruiting placement"}</strong></div><span className={`badge ${commercial?.commercial_status==="accepted"?"badge-success":commercial?.commercial_status==="quoted"?"badge-warning":""}`}>{commercial?.commercial_status?String(commercial.commercial_status).replaceAll("_"," "):"Reviewing"}</span></div>
          <div className="client-role-fee"><span>Service fee</span><strong>{commercial?commercial.service_model==="managed_service"?`${commercial.managed_markup_percent||0}% managed-service margin`:`USD ${commercial.placement_fee||0} placement fee`:"Confirmed during role review"}</strong><small>VA compensation is separate.</small></div>
          {commercial?.commercial_status==="quoted"?<form action={acceptCommercialTermsAction}><input type="hidden" name="job_id" value={job.id}/><label className="confirmation-check"><input type="checkbox" name="fee_ack" required/><span>I understand the service fee is separate from the VA&apos;s compensation.</span></label><button className="btn btn-primary" type="submit">Approve terms and start recruiting</button></form>:null}
        </div>
      </aside>
    </div>
  </div>;
}
