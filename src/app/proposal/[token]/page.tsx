import { CheckCircle2, Clock3, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { acceptLeadProposalAction } from "@/app/actions/proposals";
import { createAdminClient } from "@/lib/supabase/admin";
import { proposalClientMonthlyTotal, proposalMonthlyVaCost, proposalStatusLabel } from "@/lib/proposals";

export const metadata = {
  title: "Hiring Proposal | VirtualAssistant.com.ph",
  robots: { index: false, follow: false }
};

function usd(value?: number | null) {
  if (value == null) return "Not set";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(value));
}

export default async function ProposalPage({
  params,
  searchParams
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<Record<string,string|undefined>>;
}) {
  const { token } = await params;
  const query = await searchParams;
  const admin = createAdminClient();
  const { data: proposal } = await admin.from("lead_proposals").select("*").eq("public_token", token).maybeSingle();
  if (!proposal) notFound();

  const [{ data: lead }, { data: job }] = await Promise.all([
    admin.from("lead_intake").select("name,email,company,service,client_id").eq("id", proposal.lead_id).maybeSingle(),
    proposal.job_id ? admin.from("jobs").select("id,status").eq("id", proposal.job_id).maybeSingle() : Promise.resolve({ data: null } as any)
  ]);

  const expired = proposal.status === "sent" && proposal.expires_at && new Date(proposal.expires_at).getTime() < Date.now();
  const status = expired ? "expired" : proposal.status;
  const hours = Number(proposal.hours_per_week || 0);
  const lowRate = Number(proposal.va_rate_min || 0);
  const highRate = Number(proposal.va_rate_max || proposal.va_rate_min || 0);
  const lowVaMonthly = proposalMonthlyVaCost(hours, lowRate);
  const highVaMonthly = proposalMonthlyVaCost(hours, highRate);
  const lowClientMonthly = proposalClientMonthlyTotal({ hoursPerWeek: hours, vaRate: lowRate, serviceModel: proposal.service_model, managedMarkupPercent: proposal.managed_markup_percent });
  const highClientMonthly = proposalClientMonthlyTotal({ hoursPerWeek: hours, vaRate: highRate, serviceModel: proposal.service_model, managedMarkupPercent: proposal.managed_markup_percent });
  const expiresLabel = proposal.expires_at
    ? new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeZone: "Asia/Manila" }).format(new Date(proposal.expires_at))
    : null;

  return <main className="proposal-page">
    <section className="proposal-shell">
      <div className="proposal-brand">VirtualAssistant.com.ph</div>

      {query.accepted || status === "accepted" ? <div className="proposal-success">
        <CheckCircle2 size={34}/>
        <div>
          <span className="small">Proposal accepted</span>
          <h1>Your hiring request is confirmed.</h1>
          <p>{job?.status === "published"
            ? "Our recruiting team can now begin preparing your shortlist. You can follow progress from your client workspace."
            : "Your recruiter has your approval and will connect this request to your client workspace before the shortlist is released."}</p>
        </div>
      </div> : <>
        <div className="proposal-head">
          <div>
            <span className="badge">{proposalStatusLabel(status)}</span>
            <h1>{proposal.role_title}</h1>
            <p>{lead?.company || lead?.name || "Your business"} · Virtual Assistant hiring proposal</p>
          </div>
          {expiresLabel ? <div className="proposal-expiry"><Clock3 size={16}/><span>Valid until <strong>{expiresLabel}</strong></span></div> : null}
        </div>

        <section className="proposal-summary-card">
          <div>
            <span className="small muted">What we are hiring for</span>
            <p>{proposal.summary || lead?.service || "Virtual Assistant support"}</p>
          </div>
          <div className="proposal-facts">
            <div><span>Hours</span><strong>{hours ? `${hours}/week` : "Flexible"}</strong></div>
            <div><span>VA compensation</span><strong>{lowRate === highRate ? `${usd(lowRate)}/hr` : `${usd(lowRate)}–${usd(highRate)}/hr`}</strong></div>
            <div><span>Start timing</span><strong>{proposal.start_timing || "To be confirmed"}</strong></div>
          </div>
        </section>

        <section className="proposal-price-card">
          <div className="proposal-price-head">
            <div>
              <span className="small muted">Commercial terms</span>
              <h2>{proposal.service_model === "managed_service" ? "Managed Virtual Assistant service" : "Curated placement"}</h2>
            </div>
            <ShieldCheck size={22}/>
          </div>

          {proposal.service_model === "managed_service" ? <div className="proposal-price-grid">
            <div><span>Estimated VA pay</span><strong>{lowVaMonthly === highVaMonthly ? `${usd(lowVaMonthly)}/mo` : `${usd(lowVaMonthly)}–${usd(highVaMonthly)}/mo`}</strong></div>
            <div><span>Managed-service margin</span><strong>{Number(proposal.managed_markup_percent || 0)}%</strong></div>
            <div className="primary"><span>Estimated monthly total</span><strong>{lowClientMonthly === highClientMonthly ? `${usd(lowClientMonthly)}/mo` : `${usd(lowClientMonthly)}–${usd(highClientMonthly)}/mo`}</strong></div>
          </div> : <div className="proposal-price-grid">
            <div><span>Estimated VA compensation</span><strong>{lowVaMonthly === highVaMonthly ? `${usd(lowVaMonthly)}/mo` : `${usd(lowVaMonthly)}–${usd(highVaMonthly)}/mo`}</strong></div>
            <div><span>One-time placement fee</span><strong>{usd(proposal.placement_fee)}</strong></div>
            <div className="primary"><span>Ongoing service fee</span><strong>None</strong></div>
          </div>}

          <p className="small muted proposal-price-note">
            {proposal.service_model === "managed_service"
              ? "The estimate changes with the final VA rate and approved working hours."
              : "The placement fee is separate from the Virtual Assistant’s ongoing compensation."}
          </p>
        </section>

        {status === "sent" ? <section className="proposal-accept-card">
          <div>
            <h2>Approve and start recruiting</h2>
            <p>Accepting confirms the hiring brief and service terms. No payment is taken on this page.</p>
          </div>
          {query.error ? <div className="alert" role="alert">{query.error}</div> : null}
          <form action={acceptLeadProposalAction} className="stack">
            <input type="hidden" name="token" value={token}/>
            <div className="field"><label>Your name</label><input name="acceptance_name" required minLength={2} maxLength={160} defaultValue={lead?.name || ""}/></div>
            <label className="confirmation-check">
              <input type="checkbox" name="fee_ack" required/>
              <span>I approve this hiring proposal and understand the service fee is separate from Virtual Assistant compensation unless this is a managed-service plan.</span>
            </label>
            <button className="btn btn-primary btn-lg" type="submit">Accept proposal and start recruiting</button>
          </form>
        </section> : status === "expired" ? <div className="alert">This proposal has expired. Reply to your recruiter for an updated version.</div> : status === "declined" ? <div className="alert">This proposal is no longer active. Contact your recruiter if you want to reopen the hiring request.</div> : null}
      </>}

      <div className="proposal-footer">
        <span>Questions? Reply directly to the email that brought you here.</span>
        <span>This page is private and is not indexed by search engines.</span>
      </div>
    </section>
  </main>;
}
