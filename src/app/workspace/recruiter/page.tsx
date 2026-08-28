import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function RecruiterDashboard(){
  const {user}=await requireRole("recruiter");
  const admin=createAdminClient();
  const [{count:ready},{count:mine},{count:finalists},{count:bench},{count:pendingJobs}]=await Promise.all([
    admin.from("va_vetting").select("va_id",{count:"exact",head:true}).eq("stage","recruiter_review"),
    admin.from("va_vetting").select("va_id",{count:"exact",head:true}).eq("stage","recruiter_review").eq("recruiter_id",user.id),
    admin.from("va_vetting").select("va_id",{count:"exact",head:true}).eq("stage","finalist"),
    admin.from("bench_memberships").select("id",{count:"exact",head:true}).eq("status","active"),
    admin.from("jobs").select("id",{count:"exact",head:true}).eq("status","pending")
  ]);
  return <><div className="page-head"><div><h1>Recruiting operations</h1><p>Handle first-pass screening consistently, escalate only finalists, and keep an approved talent pool ahead of client demand.</p></div><Link className="btn btn-primary" href="/workspace/recruiter/queue">Open vetting queue</Link></div><div className="stats"><div className="stat-card"><span className="small muted">Ready for review</span><strong>{ready||0}</strong></div><div className="stat-card"><span className="small muted">Assigned to you</span><strong>{mine||0}</strong></div><div className="stat-card"><span className="small muted">Pending roles to match</span><strong>{pendingJobs||0}</strong></div><div className="stat-card"><span className="small muted">Active talent pool</span><strong>{bench||0}</strong></div></div><div className="grid-3"><Link className="card card-hover" href="/workspace/recruiter/talent"><h3>VA directory</h3><p className="muted">Open any VA account, including profiles outside the current vetting queue, and review recruiter-only contact and profile evidence.</p></Link><Link className="card card-hover" href="/workspace/recruiter/queue"><h3>Vetting queue</h3><p className="muted">Review structured profiles, test results, video introductions, and score candidates on one standard rubric.</p></Link><Link className="card card-hover" href="/workspace/recruiter/matching"><h3>Role matching</h3><p className="muted">Rank the full vetted VA pool against pending client roles before anyone applies, then release a curated shortlist.</p></Link><Link className="card card-hover" href="/workspace/recruiter/bench"><h3>Talent pool</h3><p className="muted">Maintain enough approved, currently available VAs in common categories so matching starts from known talent.</p></Link></div></>;
}
