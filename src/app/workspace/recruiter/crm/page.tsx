import Link from "next/link";
import {
  BriefcaseBusiness,
  CheckCircle2,
  LayoutDashboard,
  Search,
  Table2,
} from "lucide-react";
import { requireRoleFast } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isOpenLeadStage, leadStageLabel } from "@/lib/lead-crm";
import { scoreLead } from "@/lib/lead-scoring";
import { clientReplyNeedsAction, clientReplyStatusLabel } from "@/lib/client-reply-state";
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

type ClientActivitySnapshot = {
  lead_id: string;
  last_login_at: string | null;
  last_va_view_at: string | null;
  va_views: number | string | null;
  shortlist_opened_at: string | null;
  last_shortlist_activity_at: string | null;
  latest_decision: string | null;
  latest_decision_at: string | null;
  last_client_reply_at: string | null;
  last_client_chat_at: string | null;
  last_client_contact_at: string | null;
  reply_status: string | null;
  unread_chat: number | string | null;
};

const BOARD_STAGES: PipelineStage[] = ["new", "contacted", "discovery_booked", "qualified", "terms_sent", "nurture", "won"];

const SYSTEM_VIEWS = [
  ["active", "Active"],
  ["mine", "Mine"],
  ["attention", "Needs action"],
  ["discovery", "Discovery"],
  ["qualified", "Qualified"],
  ["won", "Won"],
  ["lost", "Closed"],
] as const;

function shortDate(value?: string | null, fallback = "No activity") {
  if (!value) return fallback;
  return new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", timeZone: "Asia/Manila" }).format(new Date(value));
}

function decisionLabel(value?: string | null) {
  if (!value) return "No decision";
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function stageClass(stage?: string | null) {
  const value = String(stage || "new").replace(/[^a-z0-9_-]/gi, "");
  return `${styles.stage} ${styles[`stage_${value}`] || ""}`;
}

function viewMatch(view: string, lead: LeadRow, userId: string, now: number, activity?: ClientActivitySnapshot | null) {
  const stage = lead.crm_stage || "new";
  const followDue = Boolean(lead.next_follow_up_at && new Date(lead.next_follow_up_at).getTime() < now && isOpenLeadStage(stage));
  const firstResponseDue = !lead.first_contact_at && now - new Date(lead.created_at).getTime() > 30 * 60 * 1000 && stage === "new";
  const unreadChat = Number(activity?.unread_chat || 0);
  if (view === "mine") return lead.owner_id === userId && isOpenLeadStage(stage);
  if (view === "attention") return (isOpenLeadStage(stage) && (unreadChat > 0 || activity?.latest_decision === "need_more_options" || clientReplyNeedsAction(activity?.reply_status))) || followDue || firstResponseDue;
  if (view === "discovery") return stage === "discovery_booked";
  if (view === "qualified") return ["qualified", "terms_sent", "shortlist_sent"].includes(stage);
  if (view === "won") return stage === "won";
  if (view === "lost") return stage === "lost";
  return isOpenLeadStage(stage);
}

export default async function RecruiterCrmPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const { userId } = await requireRoleFast("recruiter");
  const admin = createAdminClient();

  const requestedView = String(params.view || "active");
  const view = SYSTEM_VIEWS.some(([value]) => value === requestedView) ? requestedView : "active";
  const mode = params.mode === "board" ? "board" : "table";
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

  const [{ data: ownerData, error: ownerError }, leadResult] = await Promise.all([
    admin.from("profiles").select("id,full_name,role,account_status").in("role", ["recruiter", "admin"]).eq("account_status", "active").order("full_name"),
    leadQuery,
  ]);

  if (ownerError) throw ownerError;
  if (leadResult.error) throw leadResult.error;

  const allLeads = (leadResult.data || []) as LeadRow[];
  const owners = (ownerData || []) as Owner[];
  const ownerMap = new Map(owners.map((item) => [item.id, item.full_name || item.role || "Owner"]));

  const leadIds = allLeads.map((lead) => lead.id);
  const { data: activityData, error: activityError } = leadIds.length
    ? await admin.rpc("recruiter_client_activity_snapshot", { lead_ids: leadIds })
    : { data: [] as ClientActivitySnapshot[], error: null };
  if (activityError) throw activityError;
  const activityMap = new Map(((activityData || []) as ClientActivitySnapshot[]).map((row) => [row.lead_id, row]));

  const jobIds = [...new Set(allLeads.map((lead) => lead.job_id).filter((id): id is string => Boolean(id)))];
  const { data: jobs, error: jobsError } = jobIds.length
    ? await admin.from("jobs").select("id,title,status,hiring_stage").in("id", jobIds)
    : { data: [] as Job[], error: null };
  if (jobsError) throw jobsError;
  const jobMap = new Map(((jobs || []) as Job[]).map((job) => [job.id, job]));

  const { data: moreOptionsData, error: moreOptionsError } = jobIds.length
    ? await admin
        .from("recruiter_activity")
        .select("subject_id,created_at")
        .eq("subject_type", "job")
        .eq("action", "client_more_options_requested")
        .in("subject_id", jobIds)
        .order("created_at", { ascending: false })
    : { data: [] as Array<{ subject_id: string; created_at: string }>, error: null };
  if (moreOptionsError) throw moreOptionsError;
  const moreOptionsByJob = new Map<string, string>();
  for (const row of moreOptionsData || []) {
    if (!moreOptionsByJob.has(row.subject_id)) moreOptionsByJob.set(row.subject_id, row.created_at);
  }
  for (const lead of allLeads) {
    if (!lead.job_id) continue;
    const job = jobMap.get(lead.job_id);
    const requestedAt = moreOptionsByJob.get(lead.job_id);
    if (!requestedAt || job?.hiring_stage !== "sourcing") continue;
    const current = activityMap.get(lead.id);
    if (current) {
      current.latest_decision = "need_more_options";
      current.latest_decision_at = requestedAt;
    }
  }

  const now = Date.now();
  const visible = allLeads
    .filter((lead) => viewMatch(view, lead, userId, now, activityMap.get(lead.id)))
    .sort((a, b) => {
      if (view === "attention") {
        const aActivity = activityMap.get(a.id);
        const bActivity = activityMap.get(b.id);
        const aPriority = Number(aActivity?.unread_chat || 0) > 0 ? 0 : aActivity?.latest_decision === "need_more_options" ? 1 : clientReplyNeedsAction(aActivity?.reply_status) ? 2 : 3;
        const bPriority = Number(bActivity?.unread_chat || 0) > 0 ? 0 : bActivity?.latest_decision === "need_more_options" ? 1 : clientReplyNeedsAction(bActivity?.reply_status) ? 2 : 3;
        if (aPriority !== bPriority) return aPriority - bPriority;
        const aDue = a.next_follow_up_at ? new Date(a.next_follow_up_at).getTime() : Number.MAX_SAFE_INTEGER;
        const bDue = b.next_follow_up_at ? new Date(b.next_follow_up_at).getTime() : Number.MAX_SAFE_INTEGER;
        if (aDue !== bDue) return aDue - bDue;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const active = allLeads.filter((lead) => isOpenLeadStage(lead.crm_stage || "new"));
  const needsAction = allLeads.filter((lead) => viewMatch("attention", lead, userId, now, activityMap.get(lead.id)));
  const discovery = allLeads.filter((lead) => lead.crm_stage === "discovery_booked");
  const qualified = allLeads.filter((lead) => ["qualified", "terms_sent", "shortlist_sent"].includes(String(lead.crm_stage || "")));

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
    const final = { view, mode, q: q || undefined, owner: owner || undefined, ...next };
    Object.entries(final).forEach(([key, value]) => { if (value) query.set(key, value); });
    return `/workspace/recruiter/crm?${query.toString()}`;
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <div className={styles.kicker}>Recruiter workspace</div>
          <h1>Client pipeline</h1>
          <p>One client record per hiring request. Move it from enquiry to call, then work the linked role through shortlist, interview, and hire.</p>
        </div>
        <div className={styles.headerActions}>
          <Link className={styles.primaryButton} href="/workspace/recruiter/roles"><BriefcaseBusiness size={15}/> Open roles</Link>
        </div>
      </header>

      <section className={styles.summary} aria-label="Client pipeline summary">
        <div><span>Needs action</span><strong>{needsAction.length}</strong></div>
        <div><span>Calls booked</span><strong>{discovery.length}</strong></div>
        <div><span>Ready to recruit</span><strong>{qualified.length}</strong></div>
        <div><span>Active</span><strong>{active.length}</strong></div>
      </section>

      <main className={styles.pipelineWorkspace}>
        <nav className={styles.pipelineViews} aria-label="Pipeline views">
          {SYSTEM_VIEWS.map(([value, label]) => (
            <Link key={value} className={view === value ? styles.viewActive : undefined} href={buildHref({ view: value })}>
              <span>{label}</span>
              <small>{allLeads.filter((lead) => viewMatch(value, lead, userId, now, activityMap.get(lead.id))).length}</small>
            </Link>
          ))}
        </nav>

        <div className={styles.toolbar}>
          <form method="get" className={styles.searchForm}>
            <input type="hidden" name="view" value={view}/>
            <input type="hidden" name="mode" value={mode}/>
            <div className={styles.searchBox}><Search size={15}/><input name="q" defaultValue={q} placeholder="Search client, company, email, or role"/></div>
            <select name="owner" defaultValue={owner} aria-label="Filter by owner">
              <option value="">All owners</option>
              {owners.map((item) => <option key={item.id} value={item.id}>{item.full_name || item.role}</option>)}
            </select>
            <button type="submit">Filter</button>
            {(q || owner) ? <Link href={buildHref({ q: undefined, owner: undefined })}>Clear</Link> : null}
          </form>
          <div className={styles.modeSwitch} aria-label="Pipeline view type">
            <Link className={mode === "table" ? styles.modeActive : undefined} href={buildHref({ mode: "table" })}><Table2 size={14}/> List</Link>
            <Link className={mode === "board" ? styles.modeActive : undefined} href={buildHref({ mode: "board" })}><LayoutDashboard size={14}/> Board</Link>
          </div>
        </div>

        <div className={styles.viewHeader}>
          <div>
            <h2>{SYSTEM_VIEWS.find(([value]) => value === view)?.[1] || "Active"}</h2>
            <span>{visible.length} record{visible.length === 1 ? "" : "s"}</span>
          </div>
          <span className={styles.liveHint}><CheckCircle2 size={13}/> Live</span>
        </div>

        {mode === "board" ? (
          <div className={styles.boardWrap}><RecruiterLeadKanban initialLeads={pipelineLeads}/></div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>Client</th><th>Stage</th><th>Role</th><th>Client activity</th><th>Owner</th><th>Next step</th></tr></thead>
              <tbody>
                {visible.map((lead) => {
                  const job = lead.job_id ? jobMap.get(lead.job_id) : null;
                  const overdue = Boolean(lead.next_follow_up_at && new Date(lead.next_follow_up_at).getTime() < now && isOpenLeadStage(lead.crm_stage || "new"));
                  const activity = activityMap.get(lead.id);
                  const replyStatus = String(activity?.reply_status || (lead.first_contact_at ? "awaiting_reply" : "not_contacted"));
                  const unreadChat = Number(activity?.unread_chat || 0);
                  const vaViews = Number(activity?.va_views || 0);
                  const needsMoreOptions = activity?.latest_decision === "need_more_options";
                  const nextStepLabel = job?.status === "filled" || job?.hiring_stage === "filled"
                    ? "Close role"
                    : activity?.latest_decision === "interview"
                      ? "Schedule interview"
                      : activity?.latest_decision
                        ? "Review decision"
                        : "Follow up";
                  const nextStepHref = nextStepLabel === "Schedule interview" && job
                    ? `/workspace/recruiter/roles/${job.id}#interviews`
                    : nextStepLabel === "Review decision" && job
                      ? `/workspace/recruiter/roles/${job.id}#client-handoff`
                      : nextStepLabel === "Close role" && job
                        ? `/workspace/recruiter/roles/${job.id}`
                        : `/workspace/recruiter/crm/${lead.id}`;
                  return <tr key={lead.id}>
                    <td><Link className={styles.recordLink} href={`/workspace/recruiter/crm/${lead.id}`}><span className={styles.avatar}>{(lead.name || lead.company || lead.email || "?").slice(0, 1).toUpperCase()}</span><span><strong>{lead.name || lead.company || lead.email || "Client lead"}</strong><small>{lead.company || lead.email || "No company"}</small></span></Link></td>
                    <td><span className={stageClass(lead.crm_stage)}>{leadStageLabel(lead.crm_stage)}</span></td>
                    <td>{job ? <Link className={styles.inlineLink} href={`/workspace/recruiter/roles/${job.id}`}>{job.title || "Open role"}</Link> : <span className={styles.muted}>Not linked</span>}</td>
                    <td>
                      <div className={styles.clientSignals}>
                        <span><b>Login</b>{shortDate(activity?.last_login_at, "Never")}</span>
                        <span title="Distinct VAs viewed by this client for this hiring role"><b>VA views</b>{vaViews ? `${vaViews} · ${shortDate(activity?.last_va_view_at)}` : "None"}</span>
                        <span><b>Shortlist</b>{shortDate(activity?.last_shortlist_activity_at)}</span>
                        {activity?.latest_decision ? <span className={styles.signalDecision}><b>Decision</b>{decisionLabel(activity.latest_decision)}</span> : null}
                        <span><b>Contact</b>{shortDate(activity?.last_client_contact_at, "No reply")}</span>
                        {unreadChat ? <span className={styles.signalUnread}><b>Chat</b>{unreadChat} unread</span> : null}
                      </div>
                    </td>
                    <td>{lead.owner_id ? ownerMap.get(lead.owner_id) || "Assigned" : <span className={styles.muted}>Unassigned</span>}</td>
                    <td className={overdue || unreadChat > 0 || needsMoreOptions ? styles.overdue : undefined}>
                      <span className={unreadChat > 0 || needsMoreOptions || replyStatus === "needs_action" ? `${styles.replyState} ${styles.replyNeedsAction}` : replyStatus === "awaiting_reply" ? `${styles.replyState} ${styles.replyAwaiting}` : replyStatus === "handled" ? `${styles.replyState} ${styles.replyHandled}` : styles.replyState}>
                        {unreadChat > 0 || needsMoreOptions || replyStatus === "needs_action" ? <span className={styles.replyDot} aria-hidden="true"/> : null}
                        <Link className={styles.inlineLink} href={nextStepHref}>{nextStepLabel}</Link>
                      </span>
                      <small className={styles.nextStepDate}>{unreadChat > 0 ? `${unreadChat} unread client message${unreadChat === 1 ? "" : "s"}` : needsMoreOptions ? `Requested ${shortDate(activity?.latest_decision_at)}` : activity?.last_client_contact_at ? `Client activity ${shortDate(activity.last_client_contact_at)}` : shortDate(lead.next_follow_up_at, "No follow-up")}</small>
                    </td>
                  </tr>;
                })}
              </tbody>
            </table>
            {!visible.length ? <div className={styles.empty}>Nothing needs attention in this view.</div> : null}
          </div>
        )}
      </main>
    </div>
  );
}
