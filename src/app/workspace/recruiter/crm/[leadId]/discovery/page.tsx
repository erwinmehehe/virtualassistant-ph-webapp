import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Circle,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { requireAnyRoleFast } from "@/lib/auth";
import { formatDateTimeInTimeZone, isValidTimeZone } from "@/lib/timezone";
import { createAdminClient } from "@/lib/supabase/admin";
import { saveDiscoveryWorkspaceAction } from "@/app/actions/discovery-workspace";
import styles from "./discovery.module.css";

type DiscoveryBrief = {
  current_pain: string | null;
  why_now: string | null;
  ownership_needed: string | null;
  previous_attempts: string | null;
  success_90_days: string | null;
  failure_risks: string | null;
  decision_process: string | null;
  additional_notes: string | null;
  recommended_role: string | null;
  recommended_hours: number | null;
  recommended_skills: string[];
  recommended_tools: string[];
  recommended_salary_min: number | null;
  recommended_salary_max: number | null;
  salary_currency: string | null;
  vaph_fee_note: string | null;
  recommended_start_date: string | null;
  qualification_status: string | null;
  updated_at: string | null;
};

function cleanInitialPain(message?: string | null) {
  return String(message || "")
    .split(/\n\n+/)
    .filter((part) => !/^(Requested talent profile|Client-selected shortlist|Virtual Assistant budget|Tools \/ systems):/i.test(part.trim()))
    .join("\n\n")
    .trim();
}

function leadAge(createdAt: string) {
  const ms = Math.max(0, Date.now() - new Date(createdAt).getTime());
  const hours = Math.floor(ms / 3600000);
  if (hours < 1) return "Less than 1 hour";
  if (hours < 48) return `${hours} hours`;
  return `${Math.floor(hours / 24)} days`;
}

function known(value?: string | null) {
  const clean = String(value || "").trim().toLowerCase();
  return Boolean(clean && clean !== "not sure yet" && !clean.startsWith("to confirm"));
}

export default async function DiscoveryWorkspacePage({
  params,
  searchParams,
}: {
  params: Promise<{ leadId: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { leadId } = await params;
  const query = await searchParams;
  await requireAnyRoleFast(["recruiter", "admin"]);
  const admin = createAdminClient();

  const { data: lead, error: leadError } = await admin
    .from("lead_intake")
    .select("id,name,email,company,service,hours,budget,timezone,start_time,message,source_page,page_url,created_at,job_id,crm_company_id,crm_stage,discovery_scheduled_at,discovery_meeting_url,discovery_completed_at")
    .eq("id", leadId)
    .eq("lead_type", "client_hiring")
    .maybeSingle();
  if (leadError) throw leadError;
  if (!lead) notFound();

  const [briefResult, jobResult, companyResult] = await Promise.all([
    admin.from("lead_discovery_briefs")
      .select("current_pain,why_now,ownership_needed,previous_attempts,success_90_days,failure_risks,decision_process,additional_notes,recommended_role,recommended_hours,recommended_skills,recommended_tools,recommended_salary_min,recommended_salary_max,salary_currency,vaph_fee_note,recommended_start_date,qualification_status,updated_at")
      .eq("lead_id", leadId)
      .maybeSingle(),
    lead.job_id
      ? admin.from("jobs").select("id,title,hours_per_week,min_hourly_rate,max_hourly_rate,timezone,start_timing,required_skills,required_tools,status").eq("id", lead.job_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    lead.crm_company_id
      ? admin.from("crm_companies").select("name,website,industry,location").eq("id", lead.crm_company_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);
  if (briefResult.error) throw briefResult.error;
  if (jobResult.error) throw jobResult.error;
  if (companyResult.error) throw companyResult.error;

  const brief = briefResult.data as DiscoveryBrief | null;
  const job = jobResult.data as {
    id: string;
    title: string | null;
    hours_per_week: number | null;
    min_hourly_rate: number | null;
    max_hourly_rate: number | null;
    timezone: string | null;
    start_timing: string | null;
    required_skills: string[] | null;
    required_tools: string[] | null;
    status: string | null;
  } | null;
  const company = companyResult.data as { name?: string | null; website?: string | null; industry?: string | null; location?: string | null } | null;

  const initialPain = brief?.current_pain || cleanInitialPain(lead.message);
  const skills = brief?.recommended_skills?.length ? brief.recommended_skills : (job?.required_skills || []);
  const tools = brief?.recommended_tools?.length ? brief.recommended_tools : (job?.required_tools || []);
  const recommendedHours = brief?.recommended_hours || job?.hours_per_week || null;
  const clientTimeZone = isValidTimeZone(lead.timezone)
    ? String(lead.timezone)
    : isValidTimeZone(job?.timezone)
      ? String(job?.timezone)
      : "";

  const qualification = [
    ["Business problem understood", Boolean(initialPain)],
    ["Responsibilities defined", Boolean(brief?.ownership_needed)],
    ["Hours known", Boolean(recommendedHours || known(lead.hours))],
    ["Budget discussed", known(lead.budget) || Boolean(brief?.recommended_salary_min || brief?.recommended_salary_max)],
    ["Start timeframe known", known(lead.start_time) || Boolean(brief?.recommended_start_date)],
    ["Decision process known", Boolean(brief?.decision_process)],
  ] as const;
  const missing = qualification.filter(([, complete]) => !complete).map(([label]) => label);

  return (
    <main className={styles.page}>
      {query.saved ? <div className={styles.success}>Discovery workspace saved.</div> : null}
      {query.error ? <div className={styles.error} role="alert">{query.error}</div> : null}

      <div className={styles.topbar}>
        <Link href={`/workspace/recruiter/crm/${lead.id}`} className={styles.back}><ArrowLeft size={15}/> Client record</Link>
        <div className={styles.topActions}>
          {lead.discovery_meeting_url && !lead.discovery_completed_at ? (
            <a className={styles.secondaryButton} href={lead.discovery_meeting_url} target="_blank" rel="noreferrer">
              <CalendarDays size={15}/> Join Google Meet <ExternalLink size={13}/>
            </a>
          ) : null}
          {job ? <Link className={styles.secondaryButton} href={`/workspace/recruiter/roles/${job.id}`}><BriefcaseBusiness size={15}/> Open role</Link> : null}
        </div>
      </div>

      <header className={styles.header}>
        <div>
          <span className={styles.kicker}>Discovery Workspace</span>
          <h1>{lead.company || lead.name || "Client"} <em>· {lead.service || job?.title || "Hiring brief"}</em></h1>
          <p>Use one screen for call preparation, discovery notes, the hiring recommendation, and recruiter handoff.</p>
        </div>
        <div className={styles.callMeta}>
          <span>Discovery</span>
          <strong>{lead.discovery_scheduled_at ? formatDateTimeInTimeZone(lead.discovery_scheduled_at, clientTimeZone) : "Not booked"}</strong>
          <small>{clientTimeZone || "Client timezone not confirmed"}</small>
        </div>
      </header>

      <form action={saveDiscoveryWorkspaceAction}>
        <input type="hidden" name="lead_id" value={lead.id} />

        <section className={styles.preCall}>
          <div className={styles.sectionHead}>
            <div><span className={styles.kicker}>Pre-call brief</span><h2>Know the client before the call starts.</h2></div>
            <span className={styles.stage}>{String(lead.crm_stage || "new").replaceAll("_", " ")}</span>
          </div>
          <div className={styles.factGrid}>
            <div><span>Company</span><strong>{lead.company || company?.name || "—"}</strong></div>
            <div><span>Location</span><strong>{company?.location || lead.timezone || "—"}</strong></div>
            <div><span>Source</span><strong>{String(lead.source_page || "Direct").replaceAll("_", " ")}</strong></div>
            <div><span>Lead age</span><strong>{leadAge(lead.created_at)}</strong></div>
            <div><span>Initial need</span><strong>{lead.service || job?.title || "—"}</strong></div>
            <div><span>Hours</span><strong>{lead.hours || (job?.hours_per_week ? `${job.hours_per_week}/week` : "—")}</strong></div>
            <div><span>Budget</span><strong>{lead.budget || (job?.min_hourly_rate ? `USD ${job.min_hourly_rate}${job.max_hourly_rate ? `–${job.max_hourly_rate}` : ""}/hr` : "—")}</strong></div>
            <div><span>Preferred start</span><strong>{lead.start_time || job?.start_timing || "—"}</strong></div>
          </div>
          <div className={styles.originalBrief}>
            <span>Original enquiry</span>
            <p>{initialPain || "No detailed workload was supplied yet."}</p>
          </div>
        </section>

        <div className={styles.workspace}>
          <section className={styles.discovery}>
            <div className={styles.sectionHead}>
              <div><span className={styles.kicker}>Discover</span><h2>Diagnose before recommending.</h2></div>
            </div>

            <label>Why are you hiring now?
              <textarea name="why_now" defaultValue={brief?.why_now || ""} placeholder="What changed or triggered the search for help?" />
            </label>
            <label>What is taking up your time right now?
              <textarea name="current_pain" defaultValue={initialPain} placeholder="Where is the operational pressure or repeated manual work?" />
            </label>
            <label>What should this person own?
              <textarea name="ownership_needed" defaultValue={brief?.ownership_needed || ""} placeholder="Responsibilities that should move fully off the owner or team." />
            </label>
            <label>What have you tried before?
              <textarea name="previous_attempts" defaultValue={brief?.previous_attempts || ""} placeholder="Previous VA, local hire, freelancer, software, or nothing yet." />
            </label>
            <label>What would success look like in 90 days?
              <textarea name="success_90_days" defaultValue={brief?.success_90_days || ""} placeholder="The outcome that would make the client call this hire successful." />
            </label>
            <label>What could make this hire fail?
              <textarea name="failure_risks" defaultValue={brief?.failure_risks || ""} placeholder="Communication gaps, schedule, tool fluency, pace, supervision, etc." />
            </label>
            <label>Who decides and what happens next?
              <textarea name="decision_process" defaultValue={brief?.decision_process || ""} placeholder="Decision maker, other stakeholders, approval timing, interview process." />
            </label>
            <label>Additional call notes
              <textarea name="additional_notes" defaultValue={brief?.additional_notes || ""} placeholder="Anything useful that does not fit the structured questions above." />
            </label>
          </section>

          <aside className={styles.recommendation}>
            <div className={styles.recommendationCard}>
              <div className={styles.sectionHead}>
                <div><span className={styles.kicker}>Recommendation</span><h2>Prescribe the hire.</h2></div>
                <Sparkles size={18}/>
              </div>

              <label>Suggested role
                <input name="recommended_role" defaultValue={brief?.recommended_role || job?.title || ""} placeholder="e.g. Trades Administration VA" />
              </label>
              <label>Hours per week
                <input name="recommended_hours" type="number" min="1" max="80" step="1" defaultValue={recommendedHours || ""} placeholder="40" />
              </label>
              <label>Required skills
                <textarea name="recommended_skills" rows={3} defaultValue={skills.join(", ")} placeholder="Scheduling, customer service, invoice follow-up" />
                <small>Comma-separated. These feed the linked role and matching.</small>
              </label>
              <label>Required tools
                <textarea name="recommended_tools" rows={3} defaultValue={tools.join(", ")} placeholder="ServiceM8, Xero" />
                <small>Comma-separated. Keep only tools that materially affect fit.</small>
              </label>

              <div className={styles.twoCol}>
                <label>Salary from
                  <input name="recommended_salary_min" type="number" min="0" step="1000" defaultValue={brief?.recommended_salary_min ?? ""} placeholder="45000" />
                </label>
                <label>Salary to
                  <input name="recommended_salary_max" type="number" min="0" step="1000" defaultValue={brief?.recommended_salary_max ?? ""} placeholder="55000" />
                </label>
              </div>
              <label>Salary currency
                <select name="salary_currency" defaultValue={brief?.salary_currency || "PHP"}>
                  <option value="PHP">PHP</option>
                  <option value="AUD">AUD</option>
                  <option value="USD">USD</option>
                </select>
              </label>
              <label>VAPH fee / commercial note
                <input name="vaph_fee_note" defaultValue={brief?.vaph_fee_note || ""} placeholder="Add the agreed service fee or pricing note" />
              </label>
              <label>Recommended start date
                <input name="recommended_start_date" type="date" defaultValue={brief?.recommended_start_date || ""} />
              </label>

              <div className={styles.qualification}>
                <div className={styles.qualificationHead}>
                  <strong>{missing.length ? `${missing.length} item${missing.length === 1 ? "" : "s"} still needed` : "Ready to proceed"}</strong>
                  <span>{brief?.qualification_status === "ready" ? "Qualified" : "Call checklist"}</span>
                </div>
                {qualification.map(([label, complete]) => (
                  <div key={label} className={complete ? styles.complete : styles.incomplete}>
                    {complete ? <CheckCircle2 size={15}/> : <Circle size={15}/>}
                    <span>{label}</span>
                  </div>
                ))}
              </div>

              <div className={styles.actions}>
                <button type="submit" name="intent" value="proposal" className={styles.primaryButton}>
                  Generate recommendation <ArrowRight size={15}/>
                </button>
                <button type="submit" name="intent" value="save" className={styles.secondaryButton}>Save workspace</button>
                <div className={styles.secondaryActions}>
                  <button type="submit" name="intent" value="qualified">Qualified · Open matching</button>
                  <button type="submit" name="intent" value="follow_up">Follow up</button>
                  <button type="submit" name="intent" value="nurture">Nurture</button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </form>
    </main>
  );
}
