import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, ExternalLink, FileText, Send, Sparkles } from "lucide-react";
import { requireAnyRoleFast } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { saveProposalDraftAction, sendProposalToClientAction } from "@/app/actions/proposals";
import styles from "./proposal.module.css";

type ProposalRow = {
  id:string;
  public_token:string;
  status:string;
  role_title:string;
  summary:string|null;
  responsibilities:string[]|null;
  required_skills:string[]|null;
  required_tools:string[]|null;
  hours_per_week:number|null;
  salary_min:number|null;
  salary_max:number|null;
  salary_currency:string|null;
  service_model:string;
  placement_fee:number|null;
  managed_markup_percent:number|null;
  commercial_note:string|null;
  recommended_start_date:string|null;
  created_at:string;
  sent_at:string|null;
  viewed_at:string|null;
  changes_requested_at:string|null;
  accepted_at:string|null;
  declined_at:string|null;
  decline_reason:string|null;
  expires_at:string|null;
  send_count:number|null;
};

function proposalStage(proposal: ProposalRow) {
  if (proposal.status === "accepted") return "Accepted";
  if (proposal.status === "changes_requested") return "Changes requested";
  if (proposal.status === "declined") return "Lost";
  if (proposal.status === "sent" && proposal.viewed_at) return "Viewed";
  if (proposal.status === "sent") return "Sent";
  return "Draft";
}

function csv(values?: string[] | null) {
  return (values || []).join(", ");
}

function fmt(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-PH", { dateStyle:"medium", timeStyle:"short", timeZone:"Asia/Manila" }).format(new Date(value));
}

export default async function ProposalEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ leadId:string }>;
  searchParams: Promise<Record<string,string|undefined>>;
}) {
  const { leadId } = await params;
  const query = await searchParams;
  await requireAnyRoleFast(["recruiter","admin"]);
  const admin = createAdminClient();

  const [{ data: lead, error: leadError }, { data: proposals, error: proposalError }] = await Promise.all([
    admin.from("lead_intake")
      .select("id,name,email,company,service,job_id,crm_stage,discovery_completed_at")
      .eq("id", leadId)
      .eq("lead_type","client_hiring")
      .maybeSingle(),
    admin.from("lead_proposals")
      .select("id,public_token,status,role_title,summary,responsibilities,required_skills,required_tools,hours_per_week,salary_min,salary_max,salary_currency,service_model,placement_fee,managed_markup_percent,commercial_note,recommended_start_date,created_at,sent_at,viewed_at,changes_requested_at,accepted_at,declined_at,decline_reason,expires_at,send_count")
      .eq("lead_id", leadId)
      .order("created_at",{ascending:false})
      .limit(10),
  ]);
  if (leadError) throw leadError;
  if (proposalError) throw proposalError;
  if (!lead) notFound();

  const rows = (proposals || []) as ProposalRow[];
  const proposal = rows[0] || null;
  if (!proposal) {
    return <main className={styles.page}>
      <Link className={styles.back} href={`/workspace/recruiter/crm/${leadId}/discovery`}><ArrowLeft size={14}/> Discovery Workspace</Link>
      <section className={styles.empty}>
        <Sparkles size={24}/>
        <h1>Generate the recommendation from Discovery Workspace.</h1>
        <p>Complete the discovery notes and recommendation first. VAPH will turn that information into an editable client proposal without re-entering the role.</p>
        <Link className={styles.primaryLink} href={`/workspace/recruiter/crm/${leadId}/discovery`}>Open Discovery Workspace</Link>
      </section>
    </main>;
  }

  const stage = proposalStage(proposal);
  const editable = ["draft","changes_requested"].includes(proposal.status);

  return <main className={styles.page}>
    {query.generated ? <div className={styles.success}>Recommendation generated from the Discovery Workspace. Review it before sending.</div> : null}
    {query.saved ? <div className={styles.success}>Proposal draft saved.</div> : null}
    {query.sent ? <div className={styles.success}>Proposal sent to {lead.email}.</div> : null}
    {query.error ? <div className={styles.error} role="alert">{query.error}</div> : null}

    <div className={styles.topbar}>
      <Link className={styles.back} href={`/workspace/recruiter/crm/${leadId}`}><ArrowLeft size={14}/> Client record</Link>
      <div className={styles.topActions}>
        <Link className={styles.secondaryLink} href={`/workspace/recruiter/crm/${leadId}/discovery`}>Discovery Workspace</Link>
        <a className={styles.secondaryLink} href={`/proposal/${proposal.public_token}`} target="_blank" rel="noreferrer">Client preview <ExternalLink size={13}/></a>
      </div>
    </div>

    <header className={styles.header}>
      <div>
        <span className={styles.kicker}>Recommendation / Proposal</span>
        <h1>{lead.company || lead.name || "Client"} <em>· {proposal.role_title}</em></h1>
        <p>Edit the discovery recommendation into a client-ready proposal, then send it from the same screen.</p>
      </div>
      <div className={styles.stageCard}>
        <span>Proposal status</span>
        <strong>{stage}</strong>
        <small>{proposal.viewed_at ? `Viewed ${fmt(proposal.viewed_at)}` : proposal.sent_at ? `Sent ${fmt(proposal.sent_at)}` : "Not sent yet"}</small>
      </div>
    </header>

    <div className={styles.statusFlow} aria-label="Proposal lifecycle">
      {["Draft","Sent","Viewed","Changes requested","Accepted","Lost"].map((label)=>{
        const active = label === stage;
        const doneOrder = ["Draft","Sent","Viewed","Changes requested","Accepted","Lost"];
        const currentIndex = doneOrder.indexOf(stage);
        const index = doneOrder.indexOf(label);
        const done = !["Changes requested","Lost"].includes(stage) && index < currentIndex;
        return <span key={label} className={active ? styles.current : done ? styles.done : undefined}><i>{done ? "✓" : index + 1}</i>{label}</span>;
      })}
    </div>

    <form className={styles.workspace}>
      <input type="hidden" name="proposal_id" value={proposal.id}/>
      <input type="hidden" name="lead_id" value={lead.id}/>

      <section className={styles.editor}>
        <div className={styles.sectionHead}>
          <div><span className={styles.kicker}>Client-ready recommendation</span><h2>What we recommend</h2></div>
          <FileText size={18}/>
        </div>

        <label>Recommended role
          <input name="role_title" required minLength={3} maxLength={160} defaultValue={proposal.role_title} disabled={!editable}/>
        </label>

        <label>What we heard / recommendation summary
          <textarea name="summary" required rows={5} maxLength={5000} defaultValue={proposal.summary || ""} disabled={!editable} placeholder="Summarize the client's problem and why this role is the recommended solution."/>
        </label>

        <label>Responsibilities
          <textarea name="responsibilities" rows={4} defaultValue={csv(proposal.responsibilities)} disabled={!editable} placeholder="Scheduling, inbox ownership, invoice follow-up, CRM updates"/>
          <small>Comma, semicolon, or line separated.</small>
        </label>

        <div className={styles.twoCol}>
          <label>Hours per week
            <input name="hours_per_week" type="number" min="1" max="80" step="1" required defaultValue={proposal.hours_per_week || ""} disabled={!editable}/>
          </label>
          <label>Recommended start
            <input name="recommended_start_date" type="date" defaultValue={proposal.recommended_start_date || ""} disabled={!editable}/>
          </label>
        </div>

        <div className={styles.twoCol}>
          <label>Required skills
            <textarea name="required_skills" rows={3} defaultValue={csv(proposal.required_skills)} disabled={!editable} placeholder="Customer service, scheduling, bookkeeping"/>
          </label>
          <label>Required tools
            <textarea name="required_tools" rows={3} defaultValue={csv(proposal.required_tools)} disabled={!editable} placeholder="ServiceM8, Xero, HubSpot"/>
          </label>
        </div>

        <div className={styles.salaryGrid}>
          <label>Salary from
            <input name="salary_min" type="number" min="0" step="100" defaultValue={proposal.salary_min ?? ""} disabled={!editable}/>
          </label>
          <label>Salary to
            <input name="salary_max" type="number" min="0" step="100" defaultValue={proposal.salary_max ?? ""} disabled={!editable}/>
          </label>
          <label>Currency
            <select name="salary_currency" defaultValue={proposal.salary_currency || "PHP"} disabled={!editable}>
              <option value="PHP">PHP</option>
              <option value="AUD">AUD</option>
              <option value="USD">USD</option>
            </select>
          </label>
        </div>

        <div className={styles.commercial}>
          <div className={styles.sectionHead}>
            <div><span className={styles.kicker}>Commercial terms</span><h2>VAPH fee</h2></div>
          </div>
          <label>Service model
            <select name="service_model" defaultValue={proposal.service_model || "curated_placement"} disabled={!editable}>
              <option value="curated_placement">Curated placement</option>
              <option value="managed_service">Managed service</option>
            </select>
          </label>
          <div className={styles.twoCol}>
            <label>One-time placement fee (USD)
              <input name="placement_fee" type="number" min="0" step="1" defaultValue={proposal.placement_fee ?? ""} disabled={!editable}/>
              <small>Required when Curated placement is selected.</small>
            </label>
            <label>Managed-service margin (%)
              <input name="managed_markup_percent" type="number" min="0" step="0.1" defaultValue={proposal.managed_markup_percent ?? ""} disabled={!editable}/>
              <small>Required only for Managed service.</small>
            </label>
          </div>
          <label>Commercial note
            <textarea name="commercial_note" rows={3} maxLength={1000} defaultValue={proposal.commercial_note || ""} disabled={!editable} placeholder="Any agreed fee context, inclusions, or commercial note the client should see."/>
          </label>
        </div>

        {editable ? <div className={styles.formActions}>
          <label className={styles.expiry}>Proposal valid for
            <select name="expires_days" defaultValue="7"><option value="3">3 days</option><option value="7">7 days</option><option value="14">14 days</option><option value="30">30 days</option></select>
          </label>
          <div>
            <button className={styles.secondaryButton} formAction={saveProposalDraftAction} type="submit">Save draft</button>
            <button className={styles.primaryButton} formAction={sendProposalToClientAction} type="submit"><Send size={15}/> Send to client</button>
          </div>
        </div> : <div className={styles.locked}>
          <CheckCircle2 size={18}/>
          <div><strong>{stage}</strong><p>{stage === "Accepted" ? "The proposal is accepted. The linked role should now move into matching." : stage === "Lost" ? "The client declined this proposal." : "This version is waiting on the client. Editing is disabled until they request changes."}</p></div>
        </div>}
      </section>

      <aside className={styles.preview}>
        <div className={styles.previewCard}>
          <span className={styles.kicker}>Client preview</span>
          <h2>{proposal.role_title}</h2>
          <p>{proposal.summary || "Add the client-facing recommendation summary."}</p>

          <div className={styles.previewFacts}>
            <div><span>Hours</span><strong>{proposal.hours_per_week ? `${proposal.hours_per_week}/week` : "—"}</strong></div>
            <div><span>Salary</span><strong>{proposal.salary_min || proposal.salary_max ? `${proposal.salary_currency || "PHP"} ${proposal.salary_min || "—"}${proposal.salary_max ? `–${proposal.salary_max}` : ""}` : "To confirm"}</strong></div>
            <div><span>Start</span><strong>{proposal.recommended_start_date || "To confirm"}</strong></div>
          </div>

          {(proposal.responsibilities || []).length ? <div className={styles.previewBlock}><span>What this person will own</span><ul>{(proposal.responsibilities || []).slice(0,8).map(item=><li key={item}>{item}</li>)}</ul></div> : null}
          {(proposal.required_skills || []).length || (proposal.required_tools || []).length ? <div className={styles.previewBlock}><span>Fit requirements</span><div className={styles.pills}>{[...(proposal.required_skills || []),...(proposal.required_tools || [])].slice(0,10).map(item=><b key={item}>{item}</b>)}</div></div> : null}

          <div className={styles.previewBlock}>
            <span>What happens next</span>
            <ol>
              <li>Client approves the recommendation or requests changes.</li>
              <li>Recruiter reviews the strongest matching VAs.</li>
              <li>Client receives a curated shortlist and chooses who to interview.</li>
              <li>VAPH coordinates the offer and onboarding handoff.</li>
            </ol>
          </div>

          <a className={styles.clientPreviewLink} href={`/proposal/${proposal.public_token}`} target="_blank" rel="noreferrer">Open full client preview <ExternalLink size={13}/></a>
        </div>

        {rows.length > 1 ? <div className={styles.history}>
          <span className={styles.kicker}>Proposal history</span>
          {rows.slice(0,6).map(row=><div key={row.id}><strong>{proposalStage(row)}</strong><span>{row.role_title}</span><small>{fmt(row.created_at)}</small></div>)}
        </div> : null}
      </aside>
    </form>
  </main>;
}
