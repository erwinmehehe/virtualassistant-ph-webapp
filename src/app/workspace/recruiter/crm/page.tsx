import Link from "next/link";
import {
  Activity,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  LayoutDashboard,
  ListTodo,
  Search,
  Table2,
  UserRound,
  UsersRound,
} from "lucide-react";
import { requireRoleFast } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isOpenLeadStage, leadStageLabel } from "@/lib/lead-crm";
import { scoreLead } from "@/lib/lead-scoring";
import { RecruiterLeadKanban, type PipelineLead, type PipelineStage } from "@/components/recruiter-lead-kanban";
import styles from "./crm.module.css";

type LeadRow = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  service: string | null;
  hours: string | null;
  budget: string | null;
  timezone: string | null;
  message: string | null;
  crm_stage: string | null;
  owner_id: string | null;
  client_id: string | null;
  job_id: string | null;
  first_contact_at: string | null;
  last_contact_at: string | null;
  next_follow_up_at: string | null;
  discovery_scheduled_at: string | null;
  discovery_completed_at: string | null;
  estimated_value_usd: number | string | null;
  stage_updated_at: string | null;
  created_at: string;
};

type Owner = { id: string; full_name: string | null; role: string | null };
type Job = { id: string; title: string | null; status: string | null; hiring_stage: string | null };

const BOARD_STAGES: PipelineStage[] = ["new", "contacted", "discovery_booked", "qualified", "terms_sent", "nurture", "won"];

const SAVED_VIEWS = [
  ["active", "All active"],
  ["mine", "My leads"],
  ["attention", "Needs action"],
  ["discovery", "Discovery"],
  ["qualified", "Qualified"],
  ["won", "Won"],
  ["lost", "Lost"],
  ["all", "All records"],
] as const;

function money(value: number | string | null | undefined) {
  const n = Number(value || 0);
  if (!n) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function shortDate(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Manila" }).format(new Date(value));
}

function relative(value?: string | null) {
  if (!value) return "Never";
  const diff = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${Math.max(1, minutes)}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function stageClass(stage?: string | null) {
  const value = String(stage || "new").replace(/[^a-z0-9_-]/gi, "");
  return `${styles.stage} ${styles[`stage_${value}`] || ""}`;
}

function viewMatch(view: string, lead: LeadRow, userId: string, now: number) {
  const stage = lead.crm_stage || "new";
  const followDue = Boolean(lead.next_follow_up_at && new Date(lead.next_follow_up_at).getTime() < now && isOpenLeadStage(stage));
  const firstResponseDue = !lead.first_contact_at && now - new Date(lead.created_at).getTime() > 30 * 60 * 1000 && stage === "new";
  if (view === "mine") return lead.owner_id === userId && isOpenLeadStage(stage);
  if (view === "attention") return followDue || firstResponseDue;
  if (view === "discovery") return stage === "discovery_booked";
  if (view === "qualified") return ["qualified", "terms_sent", "shortlist_sent"].includes(stage);
  if (view === "won") return stage === "won";
  if (view === "lost") return stage === "lost";
  if (view === "all") return true;
  return isOpenLeadStage(stage);
}

export default async function RecruiterCrmPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const { userId } = await requireRoleFast("recruiter");
  const admin = createAdminClient();

  const mode = params.mode === "board" ? "board" : "table";
  const savedView = SAVED_VIEWS.some(([value]) => value === params.view) ? String(params.view) : "active";
  const q = String(params.q || "").trim();
  const owner = String(params.owner || "").trim();

  let leadQuery = admin
    .from("lead_intake")
    .select("id,name,email,phone,company,service,hours,budget,timezone,message,crm_stage,owner_id,client_id,job_id,first_contact_at,last_contact_at,next_follow_up_at,discovery_scheduled_at,discovery_completed_at,estimated_value_usd,stage_updated_at,created_at")
    .eq("lead_type", "client_hiring")
    .order("created_at", { ascending: false })
    .limit(500);

  if (owner) leadQuery = leadQuery.eq("owner_id", owner);
  if (q) {
    const safe = q.replace(/[,%()]/g, " ").trim();
    if (safe) leadQuery = leadQuery.or(`name.ilike.%${safe}%,email.ilike.%${safe}%,company.ilike.%${safe}%,service.ilike.%${safe}%`);
  }

  const [{ data: leadData, error: leadError }, { data: ownerData, error: ownerError }] = await Promise.all([
    leadQuery,
    admin
      .from("profiles")
      .select("id,full_name,role,account_status")
      .in("role", ["recruiter", "admin"])
      .eq("account_status", "active")
      .order("full_name"),
  ]);
  if (leadError) throw leadError;
  if (ownerError) throw ownerError;

  const allLeads = (leadData || []) as LeadRow[];
  const owners = (ownerData || []) as Owner[];
  const ownerMap = new Map(owners.map((item) => [item.id, item.full_name || item.role || "Owner"]));
  const jobIds = [...new Set(allLeads.map((lead) => lead.job_id).filter((id): id is string => Boolean(id)))];
  const { data: jobs, error: jobsError } = jobIds.length
    ? await admin.from("jobs").select("id,title,status,hiring_stage").in("id", jobIds)
    : { data: [] as Job[], error: null };
  if (jobsError) throw jobsError;
  const jobMap = new Map(((jobs || []) as Job[]).map((job) => [job.id, job]));

  const now = Date.now();
  const visible = allLeads
    .filter((lead) => viewMatch(savedView, lead, userId, now))
    .sort((a, b) => {
      if (savedView === "attention") {
        const aDue = a.next_follow_up_at ? new Date(a.next_follow_up_at).getTime() : Number.MAX_SAFE_INTEGER;
        const bDue = b.next_follow_up_at ? new Date(b.next_follow_up_at).getTime() : Number.MAX_SAFE_INTEGER;
        if (aDue !== bDue) return aDue - bDue;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const active = allLeads.filter((lead) => isOpenLeadStage(lead.crm_stage || "new"));
  const needsAction = allLeads.filter((lead) => viewMatch("attention", lead, userId, now));
  const discovery = allLeads.filter((lead) => lead.crm_stage === "discovery_booked");
  const qualified = allLeads.filter((lead) => ["qualified", "terms_sent", "shortlist_sent"].includes(String(lead.crm_stage || "")));
  const pipelineValue = active.reduce((sum, lead) => sum + Number(lead.estimated_value_usd || 0), 0);

  const pipelineLeads: PipelineLead[] = visible
    .filter((lead) => BOARD_STAGES.includes(String(lead.crm_stage || "new") as PipelineStage))
    .map((lead) => {
      const scored = scoreLead(lead);
      return {
        id: lead.id,
        name: lead.name || lead.email || "Client lead",
        email: lead.email,
        company: lead.company,
        service: lead.service,
        crm_stage: (lead.crm_stage || "new") as PipelineStage,
        score: scored.score,
        temperature: scored.temperature,
        reasons: scored.reasons,
        daysSinceTouch: scored.daysSinceTouch,
        daysOverdue: scored.daysOverdue,
        estimatedMonthlyBudget: scored.estimatedMonthlyBudget,
        estimatedAgencyValue: Number(lead.estimated_value_usd || 0),
      };
    });

  const buildHref = (next: Record<string, string | undefined>) => {
    const query = new URLSearchParams();
    const final = { view: savedView, mode, q: q || undefined, owner: owner || undefined, ...next };
    Object.entries(final).forEach(([key, value]) => {
      if (value) query.set(key, value);
    });
    return `/workspace/recruiter/crm?${query.toString()}`;
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <div className={styles.kicker}>Relationship workspace</div>
          <h1>Hiring CRM</h1>
          <p>A clean record-first workspace for employer relationships, follow-ups, linked roles, and hiring progress.</p>
        </div>
        <div className={styles.headerActions}>
          <Link className={styles.secondaryButton} href="/workspace/recruiter/tasks"><ListTodo size={15}/> Tasks</Link>
          <Link className={styles.primaryButton} href="/workspace/recruiter/roles"><BriefcaseBusiness size={15}/> Active roles</Link>
        </div>
      </header>

      <nav className={styles.objectBar} aria-label="CRM objects">
        <Link className={styles.objectActive} href="/workspace/recruiter/crm"><UsersRound size={15}/> Leads</Link>
        <Link href="/workspace/recruiter/roles"><BriefcaseBusiness size={15}/> Roles</Link>
        <Link href="/workspace/recruiter/talent"><UserRound size={15}/> Talent</Link>
        <Link href="/workspace/recruiter/tasks"><ListTodo size={15}/> Tasks</Link>
        <Link href="/workspace/recruiter/agenda"><CalendarClock size={15}/> Calendar</Link>
      </nav>

      <section className={styles.summary} aria-label="CRM summary">
        <div><span>Active</span><strong>{active.length}</strong></div>
        <div><span>Needs action</span><strong>{needsAction.length}</strong></div>
        <div><span>Discovery</span><strong>{discovery.length}</strong></div>
        <div><span>Qualified</span><strong>{qualified.length}</strong></div>
        <div><span>Pipeline value</span><strong>{money(pipelineValue)}</strong></div>
      </section>

      <div className={styles.workspace}>
        <aside className={styles.views}>
          <div className={styles.viewsTitle}>Saved views</div>
          {SAVED_VIEWS.map(([value, label]) => (
            <Link
              key={value}
              className={savedView === value ? styles.viewActive : undefined}
              href={buildHref({ view: value })}
              aria-current={savedView === value ? "page" : undefined}
            >
              <span>{label}</span>
              <small>{allLeads.filter((lead) => viewMatch(value, lead, userId, now)).length}</small>
            </Link>
          ))}
          <div className={styles.viewsDivider} />
          <Link href="/workspace/recruiter/leads">Operations inbox</Link>
          <Link href="/workspace/recruiter/funnel"><Activity size={14}/> Funnel report</Link>
        </aside>

        <main className={styles.main}>
          <div className={styles.toolbar}>
            <form method="get" className={styles.searchForm}>
              <input type="hidden" name="view" value={savedView}/>
              <input type="hidden" name="mode" value={mode}/>
              <div className={styles.searchBox}><Search size={15}/><input name="q" defaultValue={q} placeholder="Search people, company, email, or role"/></div>
              <select name="owner" defaultValue={owner} aria-label="Filter by owner">
                <option value="">All owners</option>
                {owners.map((item) => <option key={item.id} value={item.id}>{item.full_name || item.role}</option>)}
              </select>
              <button type="submit">Filter</button>
              {(q || owner) ? <Link href={buildHref({ q: undefined, owner: undefined })}>Clear</Link> : null}
            </form>
            <div className={styles.modeSwitch} aria-label="CRM view type">
              <Link className={mode === "table" ? styles.modeActive : undefined} href={buildHref({ mode: "table" })}><Table2 size={14}/> Table</Link>
              <Link className={mode === "board" ? styles.modeActive : undefined} href={buildHref({ mode: "board" })}><LayoutDashboard size={14}/> Board</Link>
            </div>
          </div>

          <div className={styles.viewHeader}>
            <div>
              <h2>{SAVED_VIEWS.find(([value]) => value === savedView)?.[1] || "All active"}</h2>
              <span>{visible.length} record{visible.length === 1 ? "" : "s"}</span>
            </div>
            <span className={styles.liveHint}><CheckCircle2 size={13}/> Live VAPH data</span>
          </div>

          {mode === "board" ? (
            <div className={styles.boardWrap}>
              <RecruiterLeadKanban initialLeads={pipelineLeads}/>
            </div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Record</th>
                    <th>Stage</th>
                    <th>Linked role</th>
                    <th>Owner</th>
                    <th>Next follow-up</th>
                    <th>Value</th>
                    <th>Last touch</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((lead) => {
                    const job = lead.job_id ? jobMap.get(lead.job_id) : null;
                    const scored = scoreLead(lead);
                    return (
                      <tr key={lead.id}>
                        <td>
                          <Link className={styles.recordLink} href={`/workspace/recruiter/crm/${lead.id}`}>
                            <span className={styles.avatar}>{(lead.name || lead.company || lead.email || "?").slice(0, 1).toUpperCase()}</span>
                            <span>
                              <strong>{lead.name || lead.company || lead.email || "Client lead"}</strong>
                              <small>{lead.company || lead.email || "No company"}</small>
                            </span>
                          </Link>
                        </td>
                        <td>
                          <span className={stageClass(lead.crm_stage)}>{leadStageLabel(lead.crm_stage)}</span>
                          <small className={styles.score}>{scored.temperature} · {scored.score}</small>
                        </td>
                        <td>{job ? <Link className={styles.inlineLink} href={`/workspace/recruiter/roles/${job.id}`}>{job.title || "Open role"}</Link> : <span className={styles.muted}>Not linked</span>}</td>
                        <td>{lead.owner_id ? ownerMap.get(lead.owner_id) || "Assigned" : <span className={styles.muted}>Unassigned</span>}</td>
                        <td className={lead.next_follow_up_at && new Date(lead.next_follow_up_at).getTime() < now ? styles.overdue : undefined}>{shortDate(lead.next_follow_up_at)}</td>
                        <td>{money(lead.estimated_value_usd)}</td>
                        <td>{relative(lead.last_contact_at || lead.first_contact_at || lead.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!visible.length ? <div className={styles.empty}>No records match this view.</div> : null}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
