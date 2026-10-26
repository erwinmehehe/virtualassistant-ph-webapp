import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Sparkles } from "lucide-react";
import { requireRoleFast } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { acceptCommercialTermsAction, closeJobAction } from "@/app/actions/jobs";
import { dateShort, money } from "@/lib/format";
import { mergeUniqueStrings, uniqueStrings } from "@/lib/collections";
import { candidateAccessLabel, candidateAccessUnlocked } from "@/lib/candidate-access";

export default async function ClientJobDetail({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<Record<string,string|undefined>>}){
  const {id}=await params;const query=await searchParams;const {userId}=await requireRoleFast("client");
  // The server has verified the client role and account. Read only the
  // caller-owned job through an explicit owner filter, including immediately
  // after an atomic recruiter-to-client proposal acceptance handoff. The
  // nullable RLS browser query previously returned a misleading 404 here.
  // Never fetch an unscoped job with the service-role client.
  const admin=createAdminClient();
  const {data:job,error:jobError}=await admin.from("jobs").select("*").eq("id",id).eq("client_id",userId).maybeSingle();
  if(jobError||!job)notFound();
  const supabase=await createClient();
  const [{data:commercial},{data:access},{data:releasedRows},{data:interviews},{data:offers},{data:workrooms}]=await Promise.all([
    supabase.from("job_commercials").select("*").eq("job_id",id).maybeSingle(),
    admin.from("job_candidate_access").select("access_status").eq("job_id",id).maybeSingle(),
    admin.from("job_shortlist_candidates").select("id,client_decision").eq("job_id",id).eq("shortlist_status","released"),
    admin.from("candidate_interviews").select("id,status,client_decision").eq("job_id",id).neq("status","cancelled"),
    admin.from("placement_offers").select("id,status").eq("job_id",id),
    admin.from("workrooms").select("id,status").eq("job_id",id)
  ]);
  const released = releasedRows || [];
  const waitingDecisions = released.filter((row: any) => !row.client_decision).length;
  const interested = released.filter((row: any) => row.client_decision === "interested").length;
  const interviewCount = (interviews || []).filter((row: any) => ["requested", "scheduled", "completed"].includes(row.status)).length;
  const pendingClientOffers = (offers || []).filter((row: any) => row.status === "pending_client");
  const pendingVaOffers = (offers || []).filter((row: any) => row.status === "pending_va");
  const activeOfferCount = pendingClientOffers.length + pendingVaOffers.length;
  const hired = (workrooms || []).some((row: any) => row.status === "active");
  const accessReady = candidateAccessUnlocked(access?.access_status);
  const interviewToSchedule = (interviews || []).find((row: any) => row.status === "requested" && !row.client_decision);
  const interviewToReview = (interviews || []).find((row: any) =>
    row.status === "scheduled" && !row.client_decision && Boolean(row.scheduled_at) &&
    Date.parse(row.scheduled_at) + Number(row.duration_minutes || 30) * 60_000 <= Date.now()
  );
  const roleApproved = commercial?.commercial_status === "accepted";
  const progress = hired
    ? { title: "Your placement is active", copy: "Review tasks, time and onboarding in the workroom.", href: "/workspace/client/workroom", label: "Open workroom" }
    : pendingClientOffers.length
      ? { title: "Confirm your VA offer", copy: "The VA accepted the final terms. Check the rate, hours and start date before confirming.", href: `/workspace/client/offers#offer-${pendingClientOffers[0].id}`, label: "Review offer" }
      : interviewToSchedule
        ? { title: "Choose an interview time", copy: "Your requested interview is waiting for a date and time.", href: `/workspace/client/interviews#interview-${interviewToSchedule.id}`, label: "Schedule interview" }
        : interviewToReview
          ? { title: "Share your interview decision", copy: "Tell the recruiter whether to proceed, hold or pass.", href: `/workspace/client/interviews#interview-${interviewToReview.id}`, label: "Record decision" }
          : commercial?.commercial_status === "quoted"
            ? { title: "Review the hiring service terms", copy: "Check the service fee and approve only if you agree. Job publication and candidate review are separate steps.", href: "#service-terms", label: "Review terms" }
            : released.length && accessReady
              ? { title: waitingDecisions ? `Review ${waitingDecisions} candidate decision${waitingDecisions === 1 ? "" : "s"}` : "Your candidate feedback is saved", copy: waitingDecisions ? "Your recruiter has screened these VAs. Choose who to interview or ask for more options." : interested ? "Your recruiter is coordinating your preferred candidate's next step." : "Your recruiter is reviewing your feedback.", href: `/workspace/client/candidates?role=${job.id}`, label: waitingDecisions ? "Review candidates" : "View shortlist" }
              : job.moderation_status === "review"
                ? { title: "Your job is waiting for review", copy: "Your recruiter needs to check this post before it can appear in public search.", href: "/workspace/client/messages", label: "Ask your recruiter" }
                : pendingVaOffers.length
                  ? { title: "Waiting for the VA to accept", copy: "The VA is reviewing the offer. You do not need to take any action yet.", href: `/workspace/client/offers#offer-${pendingVaOffers[0].id}`, label: "See offer status" }
                  : job.status === "published"
                    ? { title: roleApproved ? "Your recruiter is finding candidates" : "Your job is live", copy: roleApproved ? "Your recruiter is screening applicants and preparing a shortlist." : "The role is public. Your recruiter will coordinate the remaining service setup before candidates are released.", href: "/workspace/client/messages", label: "Message recruiter" }
                    : { title: "Your hiring request is being reviewed", copy: "The recruiter is checking the role before publication or shortlist release.", href: "/workspace/client/messages", label: "Message recruiter" };

  const stageIndex=hired?4:activeOfferCount?3:interviewCount?2:released.length?1:0;
  const stageLabels=["Brief","Shortlist","Interview","Offer","Start"];

  return <div className="client-role-detail-page">
    {query.saved?<div className="success-banner" role="status"><CheckCircle2 size={17}/> Hiring request saved.</div>:null}
    {query.claimed?<div className="success-banner" role="status"><CheckCircle2 size={17}/> Your hiring request is linked to this client account. Your recruiter will complete the service terms and candidate access steps before the selected VA profiles appear.</div>:null}

    <header className="client-role-detail-hero">
      <div>
        <Link className="text-link small" href="/workspace/client/jobs">← Hiring requests</Link>
        <div className="row wrap client-role-detail-status"><span className={`badge ${job.status==="published"?"badge-success":job.status==="pending"?"badge-warning":""}`}>{job.status==="published"?"Job live":job.status==="pending"?"In review":String(job.status).replaceAll("_"," ")}</span><span className="small muted">Created {dateShort(job.created_at)}</span></div>
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
          <div className="dashboard-section-head"><div><h2>Your recruiter handles the search</h2><p>You do not need to manage raw applicants. You only step in when there is a shortlist, interview or final decision.</p></div>{released.length?<Link className="btn btn-primary btn-sm" href={`/workspace/client/candidates?role=${job.id}`}>Review shortlist</Link>:null}</div>
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
          <div className="card"><div className="small muted">Role status</div><strong className="client-role-stat-status">{job.status==="published"?"Job live":job.status==="pending"?"In review":String(job.status).replaceAll("_"," ")}</strong><div className="small muted">{candidateAccessLabel(access?.access_status)}</div></div>
        </div>

        <div id="service-terms" className="card commercial-card client-role-commercial">
          <div className="client-role-commercial-head"><div><div className="small muted">Hiring service</div><strong>{job.service_model==="managed_service"?"Managed Virtual Assistant service":"Vetted recruiting placement"}</strong></div><span className={`badge ${commercial?.commercial_status==="accepted"?"badge-success":commercial?.commercial_status==="quoted"?"badge-warning":""}`}>{commercial?.commercial_status?String(commercial.commercial_status).replaceAll("_"," "):"Reviewing"}</span></div>
          <div className="client-role-fee"><span>Service fee</span><strong>{commercial?commercial.service_model==="managed_service"?`${commercial.managed_markup_percent||0}% managed-service margin`:`USD ${commercial.placement_fee||0} placement fee`:"Confirmed during role review"}</strong><small>VA compensation is separate.</small></div>
          {commercial?.commercial_status==="quoted"?<form action={acceptCommercialTermsAction}><input type="hidden" name="job_id" value={job.id}/><label className="confirmation-check"><input type="checkbox" name="fee_ack" required/><span>I understand the service fee is separate from the VA&apos;s compensation.</span></label><button className="btn btn-primary" type="submit">{job.status==="published"?"Approve terms for candidate review":"Approve terms and start recruiting"}</button></form>:null}
        </div>
      </aside>
    </div>
  </div>;
}
