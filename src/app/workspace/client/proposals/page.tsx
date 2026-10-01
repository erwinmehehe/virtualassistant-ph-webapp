import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";
import { requireRoleFast } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { proposalStatusLabel } from "@/lib/proposals";
import { dateShort } from "@/lib/format";

function money(value: number | null | undefined, currency = "PHP") {
  if (value == null) return "—";
  try {
    return new Intl.NumberFormat(currency === "PHP" ? "en-PH" : "en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(Number(value));
  } catch {
    return `${currency} ${Number(value).toLocaleString()}`;
  }
}

function commercialSummary(proposal: any) {
  if (proposal.service_model === "managed_service") {
    return proposal.managed_markup_percent != null
      ? `${Number(proposal.managed_markup_percent)}% managed-service margin`
      : "Managed service";
  }
  return proposal.placement_fee != null
    ? `${money(Number(proposal.placement_fee), "USD")} placement fee`
    : "Curated placement";
}

export default async function ClientProposalsPage() {
  const { userId } = await requireRoleFast("client");
  const admin = createAdminClient();

  const [{ data: ownedLeads, error: leadError }, { data: ownedJobs, error: jobError }] = await Promise.all([
    admin.from("lead_intake").select("id").eq("client_id", userId).limit(500),
    admin.from("jobs").select("id").eq("client_id", userId).limit(500),
  ]);
  if (leadError) throw leadError;
  if (jobError) throw jobError;

  const leadIds = (ownedLeads || []).map((row: any) => String(row.id));
  const jobIds = (ownedJobs || []).map((row: any) => String(row.id));
  const fields = "id,lead_id,job_id,public_token,status,role_title,summary,service_model,hours_per_week,salary_min,salary_max,salary_currency,placement_fee,managed_markup_percent,recommended_start_date,start_timing,sent_at,viewed_at,accepted_at,declined_at,created_at,updated_at";

  const [byLead, byJob] = await Promise.all([
    leadIds.length
      ? admin.from("lead_proposals").select(fields).in("lead_id", leadIds).order("created_at", { ascending: false }).limit(200)
      : Promise.resolve({ data: [] as any[], error: null }),
    jobIds.length
      ? admin.from("lead_proposals").select(fields).in("job_id", jobIds).order("created_at", { ascending: false }).limit(200)
      : Promise.resolve({ data: [] as any[], error: null }),
  ]);
  if (byLead.error) throw byLead.error;
  if (byJob.error) throw byJob.error;

  const map = new Map<string, any>();
  for (const row of [...(byLead.data || []), ...(byJob.data || [])]) map.set(String(row.id), row);
  const proposals = [...map.values()].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return <div className="client-proposals-page">
    <div className="page-head">
      <div>
        <div className="kicker">Hiring terms</div>
        <h1>Your proposals</h1>
        <p>Review the proposals attached to your hiring requests, including accepted terms and earlier revisions.</p>
      </div>
    </div>

    {proposals.length ? <div className="stack">
      {proposals.map((proposal) => {
        const status = String(proposal.status || "draft");
        const date = proposal.accepted_at || proposal.sent_at || proposal.updated_at || proposal.created_at;
        const salaryCurrency = String(proposal.salary_currency || "PHP");
        const salaryMin = proposal.salary_min == null ? null : Number(proposal.salary_min);
        const salaryMax = proposal.salary_max == null ? null : Number(proposal.salary_max);
        const compensation = salaryMin != null || salaryMax != null
          ? salaryMin === salaryMax && salaryMin != null
            ? `${money(salaryMin, salaryCurrency)}/month`
            : `${salaryMin != null ? money(salaryMin, salaryCurrency) : "—"}–${salaryMax != null ? money(salaryMax, salaryCurrency) : "—"}/month`
          : "Compensation in proposal";
        return <section className="card" key={proposal.id}>
          <div className="row-between wrap">
            <div className="stack" style={{ gap: 5 }}>
              <div className="row wrap">
                <FileText size={17}/>
                <strong>{proposal.role_title}</strong>
                <span className={`badge ${status === "accepted" ? "badge-success" : status === "changes_requested" ? "badge-warning" : ""}`}>
                  {proposalStatusLabel(status)}
                </span>
              </div>
              <span className="small muted">{date ? dateShort(date) : "—"} · {proposal.hours_per_week ? `${proposal.hours_per_week} hrs/week` : "Flexible hours"}</span>
            </div>
            <div className="row wrap">
              {proposal.job_id ? <Link className="btn btn-sm" href={`/workspace/client/jobs/${proposal.job_id}`}>Role progress</Link> : null}
              <Link className="btn btn-primary btn-sm" href={`/proposal/${proposal.public_token}`}>View proposal <ArrowRight size={14}/></Link>
            </div>
          </div>
          <div className="grid-3" style={{ marginTop: 14 }}>
            <div><span className="small muted">Compensation</span><strong style={{ display: "block", marginTop: 3 }}>{compensation}</strong></div>
            <div><span className="small muted">Service terms</span><strong style={{ display: "block", marginTop: 3 }}>{commercialSummary(proposal)}</strong></div>
            <div><span className="small muted">Start timing</span><strong style={{ display: "block", marginTop: 3 }}>{proposal.recommended_start_date || proposal.start_timing || "To be confirmed"}</strong></div>
          </div>
          {proposal.summary ? <p className="small muted" style={{ marginBottom: 0 }}>{proposal.summary}</p> : null}
        </section>;
      })}
    </div> : <div className="empty">
      <FileText size={24}/>
      <p>No hiring proposals are attached to your workspace yet.</p>
      <Link className="btn btn-primary" href="/workspace/client/jobs">View hiring requests</Link>
    </div>}
  </div>;
}
