import Link from "next/link";
import {
  Activity,
  Bot,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  CheckCircle2,
  Download,
  LayoutDashboard,
  ListTodo,
  Search,
  SlidersHorizontal,
  Table2,
  UserRound,
  UsersRound,
} from "lucide-react";
import { requireRoleFast } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isOpenLeadStage, leadStageLabel } from "@/lib/lead-crm";
import { scoreLead } from "@/lib/lead-scoring";
import { deleteCrmViewAction, saveCrmDashboardPreferencesAction, saveCrmViewAction } from "@/app/actions/crm";
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
type UserSavedView = { id:string; name:string; filters:Record<string,unknown>|null };
type DashboardPrefs = { widgets:unknown };

const BOARD_STAGES: PipelineStage[] = ["new", "contacted", "discovery_booked", "qualified", "terms_sent", "nurture", "won"];
const DEFAULT_WIDGETS=["active","needs_action","discovery","qualified","pipeline_value"];

const SYSTEM_VIEWS = [
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

function filterValue(paramsValue:string|undefined, stored:unknown, fallback:string) {
  return paramsValue !== undefined ? paramsValue : typeof stored === "string" ? stored : fallback;
}

export default async function RecruiterCrmPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const { userId } = await requireRoleFast("recruiter");
  const admin = createAdminClient();

  const [{data:savedViewRows,error:savedError},{data:prefs,error:prefsError},{data:ownerData,error:ownerError}] = await Promise.all([
    admin.from("crm_saved_views").select("id,name,filters").eq("user_id",userId).eq("object_type","lead").order("updated_at",{ascending:false}).limit(20),
    admin.from("crm_dashboard_preferences").select("widgets").eq("user_id",userId).maybeSingle(),
    admin.from("profiles").select("id,full_name,role,account_status").in("role", ["recruiter", "admin"]).eq("account_status", "active").order("full_name"),
  ]);
  if(savedError) throw savedError;
  if(prefsError) throw prefsError;
  if(ownerError) throw ownerError;

  const userViews=(savedViewRows||[]) as UserSavedView[];
  const selectedUserView=userViews.find(item=>item.id===params.saved);
  const stored=selectedUserView?.filters||{};
  const rawView=filterValue(params.view,stored.view,"active");
  const savedView = SYSTEM_VIEWS.some(([value]) => value === rawView) ? rawView : "active";
  const mode = filterValue(params.mode,stored.mode,"table") === "board" ? "board" : "table";
  const q = filterValue(params.q,stored.q,"").trim();
  const owner = filterValue(params.owner,stored.owner,"").trim();

  const prefWidgets=Array.isArray((prefs as DashboardPrefs|null)?.widgets) ? ((prefs as DashboardPrefs).widgets as unknown[]).map(String) : DEFAULT_WIDGETS;
  const widgets=prefWidgets.filter(item=>DEFAULT_WIDGETS.includes(item));
  const dashboardWidgets=widgets.length?widgets:DEFAULT_WIDGETS;

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

  const { data: leadData, error: leadError } = await leadQuery;
  if (leadError) throw leadError;

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
  const widgetData:Record<string,{label:string;value:string|number}> = {
    active:{label:"Active",value:active.length},
    needs_action:{label:"Needs action",value:needsAction.length},
    discovery:{label:"Discovery",value:discovery.length},
    qualified:{label:"Qualified",value:qualified.length},
    pipeline_value:{label:"Pipeline value",value:money(pipelineValue)},
  };

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
    const final = { view: savedView, mode, q: q || undefined, owner: owner || undefined, saved: selectedUserView?.id, ...next };
    Object.entries(final).forEach(([key, value]) => { if (value) query.set(key, value); });
    return `/workspace/recruiter/crm?${query.toString()}`;
  };

  return (
    <div className={styles.page}>
      {params.view_saved?<div className="success-banner">Saved view created.</div>:null}
      {params.view_deleted?<div className="success-banner">Saved view deleted.</div>:null}
      {params.dashboard_saved?<div className="success-banner">CRM dashboard updated.</div>:null}
      {params.view_error?<div className="alert" role="alert">{params.view_error}</div>:null}

      <header className={styles.header}>
        <div>
          <div className={styles.kicker}>Relationship workspace</div>
          <h1>Hiring CRM</h1>
          <p>Attio-style relationship clarity with VAPH hiring operations, tasks, automation, and role delivery connected underneath.</p>
        </div>
        <div className={styles.headerActions}>
          <a className={styles.secondaryButton} href="/workspace/recruiter/crm/export"><Download size={15}/> Export</a>
          <Link className={styles.secondaryButton} href="/workspace/recruiter/tasks"><ListTodo size={15}/> Tasks</Link>
          <Link className={styles.primaryButton} href="/workspace/recruiter/roles"><BriefcaseBusiness size={15}/> Active roles</Link>
        </div>
      </header>

      <nav className={styles.objectBar} aria-label="CRM objects">
        <Link className={styles.objectActive} href="/workspace/recruiter/crm"><UsersRound size={15}/> Leads</Link>
        <Link href="/workspace/recruiter/crm/companies"><Building2 size={15}/> Companies</Link>
        <Link href="/workspace/recruiter/crm/contacts"><UserRound size={15}/> Contacts</Link>
        <Link href="/workspace/recruiter/roles"><BriefcaseBusiness size={15}/> Roles</Link>
        <Link href="/workspace/recruiter/crm/automations"><Bot size={15}/> Automations</Link>
        <Link href="/workspace/recruiter/tasks"><ListTodo size={15}/> Tasks</Link>
        <Link href="/workspace/recruiter/agenda"><CalendarClock size={15}/> Calendar</Link>
      </nav>

      <section className={styles.summary} aria-label="CRM summary">
        {dashboardWidgets.map(key=><div key={key}><span>{widgetData[key]?.label||key}</span><strong>{widgetData[key]?.value??"—"}</strong></div>)}
      </section>
      <details className={styles.dashboardConfig}>
        <summary><SlidersHorizontal size={14}/> Customize dashboard</summary>
        <form action={saveCrmDashboardPreferencesAction}>
          {DEFAULT_WIDGETS.map(key=><label key={key}><input type="checkbox" name="widgets" value={key} defaultChecked={dashboardWidgets.includes(key)}/>{widgetData[key].label}</label>)}
          <button type="submit">Save widgets</button>
        </form>
      </details>

      <div className={styles.workspace}>
        <aside className={styles.views}>
          <div className={styles.viewsTitle}>Saved views</div>
          {SYSTEM_VIEWS.map(([value, label]) => (
            <Link key={value} className={!selectedUserView && savedView === value ? styles.viewActive : undefined} href={buildHref({ view: value, saved: undefined })}>
              <span>{label}</span><small>{allLeads.filter((lead) => viewMatch(value, lead, userId, now)).length}</small>
            </Link>
          ))}

          <div className={styles.viewsDivider}/>
          <div className={styles.viewsTitle}>My views</div>
          {userViews.map(item=><div className={styles.savedViewRow} key={item.id}>
            <Link className={selectedUserView?.id===item.id?styles.viewActive:undefined} href={`/workspace/recruiter/crm?saved=${item.id}`}><span>{item.name}</span></Link>
            <form action={deleteCrmViewAction}><input type="hidden" name="view_id" value={item.id}/><button type="submit" aria-label={`Delete ${item.name}`}>×</button></form>
          </div>)}
          <details className={styles.saveView}>
            <summary>+ Save current view</summary>
            <form action={saveCrmViewAction}>
              <input type="hidden" name="object_type" value="lead"/>
              <input type="hidden" name="view" value={savedView}/>
              <input type="hidden" name="owner" value={owner}/>
              <input type="hidden" name="q" value={q}/>
              <input type="hidden" name="mode" value={mode}/>
              <input type="hidden" name="return_to" value={buildHref({})}/>
              <input name="name" required minLength={2} maxLength={80} placeholder="View name"/>
              <button type="submit">Save</button>
            </form>
          </details>

          <div className={styles.viewsDivider} />
          <Link href="/workspace/recruiter/crm/import">Import / export</Link>
          <Link href="/workspace/recruiter/leads">Operations inbox</Link>
          <Link href="/workspace/recruiter/funnel"><Activity size={14}/> Funnel report</Link>
        </aside>

        <main className={styles.main}>
          <div className={styles.toolbar}>
            <form method="get" className={styles.searchForm}>
              <input type="hidden" name="view" value={savedView}/>
              <input type="hidden" name="mode" value={mode}/>
              {selectedUserView?<input type="hidden" name="saved" value={selectedUserView.id}/>:null}
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
              <h2>{selectedUserView?.name || SYSTEM_VIEWS.find(([value]) => value === savedView)?.[1] || "All active"}</h2>
              <span>{visible.length} record{visible.length === 1 ? "" : "s"}</span>
            </div>
            <span className={styles.liveHint}><CheckCircle2 size={13}/> Live VAPH data</span>
          </div>

          {mode === "board" ? (
            <div className={styles.boardWrap}><RecruiterLeadKanban initialLeads={pipelineLeads}/></div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead><tr><th>Record</th><th>Stage</th><th>Linked role</th><th>Owner</th><th>Next follow-up</th><th>Value</th><th>Last touch</th></tr></thead>
                <tbody>
                  {visible.map((lead) => {
                    const job = lead.job_id ? jobMap.get(lead.job_id) : null;
                    const scored = scoreLead(lead);
                    return <tr key={lead.id}>
                      <td><Link className={styles.recordLink} href={`/workspace/recruiter/crm/${lead.id}`}><span className={styles.avatar}>{(lead.name || lead.company || lead.email || "?").slice(0, 1).toUpperCase()}</span><span><strong>{lead.name || lead.company || lead.email || "Client lead"}</strong><small>{lead.company || lead.email || "No company"}</small></span></Link></td>
                      <td><span className={stageClass(lead.crm_stage)}>{leadStageLabel(lead.crm_stage)}</span><small className={styles.score}>{scored.temperature} · {scored.score}</small></td>
                      <td>{job ? <Link className={styles.inlineLink} href={`/workspace/recruiter/roles/${job.id}`}>{job.title || "Open role"}</Link> : <span className={styles.muted}>Not linked</span>}</td>
                      <td>{lead.owner_id ? ownerMap.get(lead.owner_id) || "Assigned" : <span className={styles.muted}>Unassigned</span>}</td>
                      <td className={lead.next_follow_up_at && new Date(lead.next_follow_up_at).getTime() < now ? styles.overdue : undefined}>{shortDate(lead.next_follow_up_at)}</td>
                      <td>{money(lead.estimated_value_usd)}</td>
                      <td>{relative(lead.last_contact_at || lead.first_contact_at || lead.created_at)}</td>
                    </tr>;
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
