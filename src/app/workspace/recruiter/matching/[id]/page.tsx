import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { StaffJobMatching } from "@/components/staff-job-matching";
import { dateShort, money } from "@/lib/format";

export default async function RecruiterJobMatchingDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { id } = await params;
  const query = await searchParams;
  await requireRole("recruiter");
  const admin = createAdminClient();
  const { data: job } = await admin.from("jobs").select("*").eq("id", id).single();
  if (!job) notFound();
  const { data: client } = job.client_id ? await admin.from("profiles").select("full_name").eq("id", job.client_id).maybeSingle() : { data: null };

  return <>
    {query.shortlist_saved ? <div className="success-banner" role="status">Internal shortlist saved.</div> : null}
    {query.shortlist_released ? <div className="success-banner" role="status">Selected VAs released to the client shortlist. Identity remains protected until candidate access is active.</div> : null}
    {query.shortlist_error ? <div className="alert" role="alert">{query.shortlist_error}</div> : null}
    <div className="page-head"><div><Link className="text-link small" href="/workspace/recruiter/matching">← Role matching</Link><h1 style={{ marginTop: 8 }}>{job.title}</h1><p>{job.company_name || "Client role"} · {job.hours_per_week ? `${job.hours_per_week} hrs/week` : "Flexible hours"} · from {money(job.min_hourly_rate)}/hr · submitted {dateShort(job.created_at)}</p></div><div className="row wrap"><span className={`badge ${job.status === "pending" ? "badge-warning" : job.status === "published" ? "badge-success" : ""}`}>{job.status}</span></div></div>
    <section className="card role-match-brief">
      <div><strong>Client</strong><p className="muted">{client?.full_name || (job.client_id ? "Client account" : "No account yet, from a lead")}</p></div>
      <div><strong>Timezone</strong><p className="muted">{job.timezone || "Not set"}</p></div>
      <div><strong>Pay range</strong><p className="muted">{money(job.min_hourly_rate)}{job.max_hourly_rate ? ` to ${money(job.max_hourly_rate)}` : "+"}/hr</p></div>
      <div><strong>Engagement length</strong><p className="muted">{job.engagement_length || "Not set"}</p></div>
      <div><strong>Start timing</strong><p className="muted">{job.start_timing || "Not set"}</p></div>
      <div><strong>Categories</strong><p className="muted">{(job.categories || []).join(", ") || "Not set"}</p></div>
      <div><strong>Required skills</strong><p className="muted">{(job.required_skills || []).join(", ") || "Not set"}</p></div>
      <div><strong>Required tools</strong><p className="muted">{(job.required_tools || []).join(", ") || "Not set"}</p></div>
      <div><strong>Overlap</strong><p className="muted">{job.overlap_hours != null ? `${job.overlap_hours} hrs/day` : "Not set"}</p></div>
      {job.summary ? <div className="span-2"><strong>Summary</strong><p className="muted">{job.summary}</p></div> : null}
      {job.description ? <div className="span-2"><strong>Description</strong><p className="muted" style={{whiteSpace:"pre-wrap"}}>{job.description}</p></div> : null}
    </section>
    <StaffJobMatching job={job} viewerRole="recruiter" returnTo={`/workspace/recruiter/matching/${job.id}`}/>
  </>;
}
