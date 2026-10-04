import { CheckCircle2, Clock3, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { acceptLeadProposalAction, respondToLeadProposalAction } from "@/app/actions/proposals";
import { createAdminClient } from "@/lib/supabase/admin";
import { proposalClientMonthlyTotal, proposalMonthlyVaCost, proposalStatusLabel } from "@/lib/proposals";
import { ProposalViewTracker } from "@/components/proposal-view-tracker";
import { PublicAvatar } from "@/components/public-avatar";

export const metadata = {
  title: "Hiring Proposal | VirtualAssistant.com.ph",
  robots: { index: false, follow: false }
};

function usd(value?: number | null) {
  if (value == null) return "Not set";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(value));
}

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

  const { data: publicTalentRows } = await admin
    .from("public_va_directory")
    .select("user_id,full_name,headline,primary_category,categories,avatar_url,years_experience,weekly_hours")
    .limit(120);
  const publicTalent = (publicTalentRows || []).filter((candidate: any) => (
    candidate?.user_id &&
    candidate?.full_name &&
    (
      !lead?.service ||
      candidate.primary_category === lead.service ||
      (Array.isArray(candidate.categories) && candidate.categories.includes(lead.service))
    )
  ));
  const talentPool = (publicTalent.length >= 3 ? publicTalent : (publicTalentRows || []).filter((candidate: any) => candidate?.user_id && candidate?.full_name))
    .sort((a: any, b: any) => Number(b.years_experience || 0) - Number(a.years_experience || 0))
    .slice(0, 3);

  const expired = proposal.status === "sent" && proposal.expires_at && new Date(proposal.expires_at).getTime() < Date.now();
  const status = expired ? "expired" : proposal.status;
  const hours = Number(proposal.hours_per_week || 0);
  const lowRate = Number(proposal.va_rate_min || 0);
  const highRate = Number(proposal.va_rate_max || proposal.va_rate_min || 0);
  const lowVaMonthly = proposalMonthlyVaCost(hours, lowRate);
  const highVaMonthly = proposalMonthlyVaCost(hours, highRate);
  const lowClientMonthly = proposalClientMonthlyTotal({ hoursPerWeek: hours, vaRate: lowRate, serviceModel: proposal.service_model, managedMarkupPercent: proposal.managed_markup_percent });
  const highClientMonthly = proposalClientMonthlyTotal({ hoursPerWeek: hours, vaRate: highRate, serviceModel: proposal.service_model, managedMarkupPercent: proposal.managed_markup_percent });
  const salaryCurrency = proposal.salary_currency || "PHP";
  const salaryMin = proposal.salary_min == null ? null : Number(proposal.salary_min);
  const salaryMax = proposal.salary_max == null ? null : Number(proposal.salary_max);
  const hasSalaryRange = salaryMin != null || salaryMax != null;
  const responsibilities = Array.isArray(proposal.responsibilities) ? proposal.responsibilities : [];
  const requiredSkills = Array.isArray(proposal.required_skills) ? proposal.required_skills : [];
  const requiredTools = Array.isArray(proposal.required_tools) ? proposal.required_tools : [];
  const expiresLabel = proposal.expires_at
    ? new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeZone: "Asia/Manila" }).format(new Date(proposal.expires_at))
    : null;

  return <main className="proposal-page">
    {status === "sent" ? <ProposalViewTracker token={token}/> : null}
    <section className="proposal-shell">
      <div className="proposal-brand">VirtualAssistant.com.ph</div>

      {query.accepted || status === "accepted" ? <div className="proposal-success">
        <CheckCircle2 size={34}/>
        <div>
          <span className="small">Proposal accepted</span>
          <h1>Your hiring request is confirmed.</h1>
          <p>{job?.status === "published"
            ? "Your role is active and our recruiting team can begin preparing your shortlist. Check your email for a secure link to your client workspace."
            : "Your recruiter has your approval and will complete any remaining workspace handoff."}</p>
          {job?.id && lead?.client_id ? <a className="btn btn-primary" href={`/workspace/client/jobs/${job.id}?proposal_accepted=1`}>Open client workspace</a> : null}
        </div>
      </div> : query.changes_requested || status === "changes_requested" ? <div className="proposal-success proposal-revision-state">
        <CheckCircle2 size={34}/>
        <div>
          <span className="small">Changes requested</span>
          <h1>Your recruiter has your feedback.</h1>
          <p>We will revise the proposal and send a new version. You do not need to submit another hiring request.</p>
        </div>
      </div> : query.declined || status === "declined" ? <div className="proposal-success proposal-declined-state">
        <CheckCircle2 size={34}/>
        <div>
          <span className="small">Response received</span>
          <h1>We have recorded your decision.</h1>
          <p>Your recruiter has the reason you provided. If your hiring plans change, reply to the original email and we can reopen the conversation.</p>
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
            <div><span>Recommended compensation</span><strong>{hasSalaryRange
              ? salaryMin === salaryMax && salaryMin != null
                ? `${money(salaryMin, salaryCurrency)}/month`
                : `${salaryMin != null ? money(salaryMin, salaryCurrency) : "—"}–${salaryMax != null ? money(salaryMax, salaryCurrency) : "—"}/month`
              : lowRate
                ? lowRate === highRate ? `${usd(lowRate)}/hr` : `${usd(lowRate)}–${usd(highRate)}/hr`
                : "To be confirmed"}</strong></div>
            <div><span>Start timing</span><strong>{proposal.recommended_start_date || proposal.start_timing || "To be confirmed"}</strong></div>
          </div>
        </section>

        {responsibilities.length ? <section className="proposal-summary-card">
          <div>
            <span className="small muted">What this person will own</span>
            <ul>{responsibilities.map((item: string) => <li key={item}>{item}</li>)}</ul>
          </div>
        </section> : null}

        {requiredSkills.length || requiredTools.length ? <section className="proposal-summary-card">
          <div>
            <span className="small muted">Fit requirements</span>
            {requiredSkills.length ? <p><strong>Skills:</strong> {requiredSkills.join(", ")}</p> : null}
            {requiredTools.length ? <p><strong>Tools:</strong> {requiredTools.join(", ")}</p> : null}
          </div>
        </section> : null}

        <section className="proposal-price-card">
          <div className="proposal-price-head">
            <div>
              <span className="small muted">Commercial terms</span>
              <h2>{proposal.service_model === "managed_service" ? "Managed Virtual Assistant service" : "Curated placement"}</h2>
            </div>
            <ShieldCheck size={22}/>
          </div>

          {proposal.service_model === "managed_service" ? <div className="proposal-price-grid">
            <div><span>Recommended VA compensation</span><strong>{hasSalaryRange
              ? salaryMin === salaryMax && salaryMin != null
                ? `${money(salaryMin, salaryCurrency)}/month`
                : `${salaryMin != null ? money(salaryMin, salaryCurrency) : "—"}–${salaryMax != null ? money(salaryMax, salaryCurrency) : "—"}/month`
              : lowVaMonthly
                ? lowVaMonthly === highVaMonthly ? `${usd(lowVaMonthly)}/mo` : `${usd(lowVaMonthly)}–${usd(highVaMonthly)}/mo`
                : "To confirm"}</strong></div>
            <div><span>Managed-service margin</span><strong>{Number(proposal.managed_markup_percent || 0)}%</strong></div>
            <div className="primary"><span>Estimated monthly total</span><strong>{lowClientMonthly
              ? lowClientMonthly === highClientMonthly ? `${usd(lowClientMonthly)}/mo` : `${usd(lowClientMonthly)}–${usd(highClientMonthly)}/mo`
              : "Confirmed after final VA compensation"}</strong></div>
          </div> : <div className="proposal-price-grid">
            <div><span>Recommended VA compensation</span><strong>{hasSalaryRange
              ? salaryMin === salaryMax && salaryMin != null
                ? `${money(salaryMin, salaryCurrency)}/month`
                : `${salaryMin != null ? money(salaryMin, salaryCurrency) : "—"}–${salaryMax != null ? money(salaryMax, salaryCurrency) : "—"}/month`
              : lowVaMonthly
                ? lowVaMonthly === highVaMonthly ? `${usd(lowVaMonthly)}/mo` : `${usd(lowVaMonthly)}–${usd(highVaMonthly)}/mo`
                : "To confirm"}</strong></div>
            <div><span>One-time placement fee</span><strong>{usd(proposal.placement_fee)}</strong></div>
            <div className="primary"><span>Ongoing service fee</span><strong>None</strong></div>
          </div>}

          <p className="small muted proposal-price-note">
            {proposal.service_model === "managed_service"
              ? "The estimate changes with the final VA rate and approved working hours."
              : "The placement fee is separate from the Virtual Assistant’s ongoing compensation."}
          </p>
          {proposal.commercial_note ? <p className="proposal-price-note"><strong>Commercial note:</strong> {proposal.commercial_note}</p> : null}
        </section>

        {talentPool.length ? <section className="proposal-summary-card">
          <div>
            <span className="small muted">Examples from our approved talent pool</span>
            <h2>People your recruiter can evaluate against this brief</h2>
            <p>These are public-profile examples, not a reserved shortlist. Your recruiter still verifies role fit, availability, compensation, and evidence before releasing candidates to you.</p>
            <div className="proposal-talent-preview">
              {talentPool.map((candidate: any) => (
                <div className="proposal-talent-preview-row" key={candidate.user_id}>
                  <PublicAvatar name={candidate.full_name} src={candidate.avatar_url} size="sm" />
                  <div>
                    <strong>{candidate.full_name}</strong>
                    <span>{candidate.headline || candidate.primary_category || "Virtual Assistant"}</span>
                    <small>{Number(candidate.years_experience || 0)} years experience{candidate.weekly_hours ? ` · ${Number(candidate.weekly_hours)} hrs/week available` : ""}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section> : null}

        <section className="proposal-summary-card">
          <div>
            <span className="small muted">What happens next</span>
            <ol>
              <li>Approve this recommendation or request changes.</li>
              <li>Your recruiter reviews the strongest matching Virtual Assistants.</li>
              <li>You receive a curated shortlist and choose who to interview.</li>
              <li>VAPH coordinates the offer and onboarding handoff.</li>
            </ol>
          </div>
        </section>

        {status === "sent" ? <>
          <section className="proposal-accept-card">
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
          </section>

          <section className="proposal-change-card">
            <div>
              <h2>Need something changed?</h2>
              <p>Send one clear note. Your recruiter can revise the scope, hours, rate range, fee, or timing without making you start over.</p>
            </div>
            <form action={respondToLeadProposalAction} className="stack">
              <input type="hidden" name="token" value={token}/>
              <div className="field"><label>What should change?</label><textarea name="reason" required minLength={5} maxLength={2000} placeholder="Example: We need 20 hours instead of 40, and the role should start next month."/></div>
              <div className="row wrap">
                <button className="btn" type="submit" name="decision" value="changes">Request changes</button>
                <button className="btn btn-danger" type="submit" name="decision" value="decline">Decline proposal</button>
              </div>
            </form>
          </section>
        </> : status === "expired" ? <div className="alert">This proposal has expired. Reply to your recruiter for an updated version.</div> : null}
      </>}

      <div className="proposal-footer">
        <span>Questions? Reply directly to the email that brought you here.</span>
        <span>This page is private and is not indexed by search engines.</span>
      </div>
    </section>
  </main>;
}
