import Link from "next/link";
import { Suspense } from "react";
import { AlertCircle, ArrowRight, BriefcaseBusiness, CalendarClock, CheckCircle2, CirclePlay, CircleX, Clock3, Eye, Mail, MessageSquare, Sparkles, Star, TrendingUp, UserRoundCheck } from "lucide-react";
import { bulkRecruiterVaAction, sendDiscoveryNoShowRebookAction } from "@/app/actions/recruiter";
import { BarChart, DashHeader, Empty, Notice, Panel, Pill, ProgressRing, SignalList, StatCard, type Tone } from "@/components/dash-ui";
import { requireRoleFast } from "@/lib/auth";
import { getVaCompletion } from "@/lib/profile-completeness";
import { APPROVAL_MIN_COMPLETION, PUBLIC_VA_MIN_COMPLETION } from "@/lib/public-visibility";
import { createAdminClient } from "@/lib/supabase/admin";
import type { VaProfile } from "@/lib/types";

const SIGNUP_WEEKS = 10;
const QUEUE_PREVIEW = 5;
const PRIORITY_TONE: Record<string, Tone> = { urgent: "rose", high: "amber", medium: "indigo", normal: "slate", low: "slate" };
const RESULT_WORD: Record<string, string> = {
  approve: "approved", approve_publish: "approved", reject: "rejected", bench: "moved to bench",
  request_changes: "sent back for changes", hide: "hidden", remind: "reminded", assign: "assigned", mark_reviewed: "marked reviewed"
};

type RecruiterDashboardMetrics = {
  total: number;
  started: number;
  approved: number;
  public: number;
  incomplete: number;
  ready: number;
  vetted_hidden: number;
  unreviewed: number;
  active_jobs: number;
  pending_jobs: number;
  roles_without_candidates: number;
  new_apps: number;
  unread_messages: number;
  released_shortlists: number;
  open_leads: number;
  untouched_leads: number;
  followups_due: number;
  open_pipeline_value: number;
  discovery_next_two_days: number;
};

/** Row from recruiter_dashboard_overview().vetting_queue: VA profile fields plus review context. */
type VettingQueueRow = Partial<VaProfile> & {
  va_id: string;
  full_name?: string | null;
  avatar_url?: string | null;
  test_score?: number | null;
  video_url?: string | null;
};

/** Row from recruiter_dashboard_overview().roles_needing_matching. */
type RoleNeedingMatching = { id: string; title: string | null; company_name: string | null };

/** Item from recruiter_today_queue(). */
type TodayQueueItem = {
  id?: string | null;
  kind?: string | null;
  title?: string | null;
  subtitle?: string | null;
  priority?: string | null;
  due_at?: string | null;
  href?: string | null;
  metadata?: { subject_type?: string | null; subject_id?: string | null } | null;
};

/** Row from recruiter_dashboard_signups(). */
type SignupWeek = { week_start: string; count: number | string | null };

type UpcomingDiscovery = {
  id: string;
  name: string | null;
  company: string | null;
  service: string | null;
  job_id: string | null;
  discovery_scheduled_at: string;
  discovery_duration_minutes: number | null;
  discovery_meeting_url: string | null;
};

type RecruiterDashboardOverview = {
  metrics?: Partial<RecruiterDashboardMetrics>;
  vetting_queue?: VettingQueueRow[];
  roles_needing_matching?: RoleNeedingMatching[];
};

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

function exactActionHref(item: TodayQueueItem) {
  const meta = item?.metadata || {};
  if (meta.subject_type === "job" && meta.subject_id) return `/workspace/recruiter/matching/${meta.subject_id}`;
  if (meta.subject_type === "va" && meta.subject_id) return `/workspace/recruiter/candidates/${meta.subject_id}`;
  if (["role_review", "role_without_shortlist", "client_shortlist_waiting", "all_candidates_passed", "client_response_overdue", "interview_today", "interview_feedback_missing", "offer_waiting_va", "offer_waiting_client"].includes(String(item?.kind)) && item?.id) return `/workspace/recruiter/matching/${item.id}`;
  if (item?.kind === "candidate_capacity_conflict" && item?.id) return `/workspace/recruiter/candidates/${item.id}`;
  return item?.href || "/workspace/recruiter/today";
}

function queueTimeLabel(value?: string | null) {
  if (!value) return "Needs action";
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" }).format(new Date(value));
}

function RecruiterVettingQueue({ unreviewed, queueRows }: { unreviewed: number; queueRows: VettingQueueRow[] }) {
  return <Panel
    title="Vetting queue"
    subtitle={unreviewed > QUEUE_PREVIEW ? `Longest-waiting ${QUEUE_PREVIEW} of ${unreviewed} · ring shows profile completion` : `${plural(unreviewed, "candidate")} waiting · ring shows profile completion`}
    action={<Link prefetch={false} className="dash-link" href="/workspace/recruiter/queue">Open queue <ArrowRight size={14} aria-hidden="true" /></Link>}
  >
    {queueRows.length ? (
      <div className="dash-queue">
        {queueRows.map((row) => {
          const va = row;
          const testScore = row.test_score ?? null;
          const completion = getVaCompletion(va, row.avatar_url).score;
          const name = row.full_name || "VA candidate";
          const ringTone: Tone = completion >= 90 ? "emerald" : completion >= PUBLIC_VA_MIN_COMPLETION ? "amber" : "indigo";
          return (
            <div className="dash-queue-item" key={row.va_id}>
              <div className="dash-queue-main">
                <ProgressRing pct={completion} size={52} stroke={6} tone={ringTone} label={`Profile ${completion}% complete`} />
                <div className="dash-queue-copy">
                  <p className="dash-queue-name">{name}</p>
                  <p className="dash-queue-sub">{va?.primary_category || "Category not set"}</p>
                  <div className="dash-chip-row">
                    <span className="dash-chip"><CirclePlay size={12} aria-hidden="true" /> Video {row.video_url ? "submitted" : "pending"}</span>
                    <span className="dash-chip"><Star size={12} aria-hidden="true" /> Test {testScore != null ? `${testScore}%` : "pending"}</span>
                    {completion < APPROVAL_MIN_COMPLETION ? <Pill tone="amber">under {APPROVAL_MIN_COMPLETION}%</Pill> : <Pill tone="emerald">approval-ready</Pill>}
                  </div>
                </div>
              </div>
              <div className="dash-queue-actions">
                <form action={bulkRecruiterVaAction}>
                  <input type="hidden" name="va_id" value={row.va_id} />
                  <input type="hidden" name="bulk_action" value="approve" />
                  <input type="hidden" name="return_to" value="/workspace/recruiter" />
                  <button className="dash-btn dash-btn-success" type="submit"><CheckCircle2 size={15} aria-hidden="true" /> Approve</button>
                </form>
                <Link prefetch={false} className="dash-btn dash-btn-light" href={`/workspace/recruiter/candidates/${row.va_id}`}>Review</Link>
                <form action={bulkRecruiterVaAction}>
                  <input type="hidden" name="va_id" value={row.va_id} />
                  <input type="hidden" name="bulk_action" value="reject" />
                  <input type="hidden" name="return_to" value="/workspace/recruiter" />
                  <button className="dash-icon-btn" type="submit" aria-label={`Reject ${name}`} title="Reject (reversible from the directory)"><CircleX size={17} aria-hidden="true" /></button>
                </form>
              </div>
            </div>
          );
        })}
      </div>
    ) : <Empty title="Queue is clear" desc="No candidates are waiting for recruiter review." />}
  </Panel>;
}

function RecruiterRolesNeedingMatching({ count, jobs }: { count: number; jobs: RoleNeedingMatching[] }) {
  return <Panel title="Roles that need matching" subtitle="No applications or shortlist yet" action={count ? <Link prefetch={false} className="dash-link" href="/workspace/recruiter/matching?view=needs_candidates">View all <ArrowRight size={14} aria-hidden="true" /></Link> : undefined}>
    {jobs.length ? (
      <div className="dash-list">
        {jobs.map((job) => (
          <Link prefetch={false} className="dash-list-row" href={`/workspace/recruiter/matching/${job.id}`} key={job.id}>
            <span><strong>{job.title}</strong><small>{job.company_name || "Client role"}</small></span>
            <Pill tone="amber">needs candidates</Pill>
          </Link>
        ))}
      </div>
    ) : <Empty title="Every role has candidates" desc="Each active role has at least one application or shortlisted VA." />}
  </Panel>;
}

function RecruiterDashboardFallback() {
  return (
    <>
      <div className="dash-stats" aria-busy="true" aria-label="Loading recruiter metrics">
        <div className="workspace-skeleton-card" />
        <div className="workspace-skeleton-card" />
        <div className="workspace-skeleton-card" />
        <div className="workspace-skeleton-card" />
      </div>
      <div className="dash-grid recruiter-priority-grid">
        <Panel title="Next actions" subtitle="Loading your exact current work">
          <div className="workspace-skeleton-card" />
        </Panel>
        <Panel title="Hiring and talent signals" subtitle="Loading live workspace data">
          <div className="workspace-skeleton-card" />
        </Panel>
      </div>
    </>
  );
}

function RecruiterAnalyticsFallback() {
  return <details className="dash-secondary"><summary>Analytics and maintenance</summary><div className="workspace-skeleton-card" aria-busy="true" /></details>;
}

async function RecruiterAnalytics({ metrics }: { metrics: Partial<RecruiterDashboardMetrics> }) {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("recruiter_dashboard_signups", { p_signup_weeks: SIGNUP_WEEKS });
  if (error) throw error;

  const value = (key: keyof RecruiterDashboardMetrics) => Number(metrics[key] || 0);
  const signupRows: SignupWeek[] = Array.isArray(data) ? data : [];
  const signups = signupRows.map((week, index) => {
    const start = new Date(week.week_start);
    return { label: `${start.getUTCMonth() + 1}/${start.getUTCDate()}`, value: Number(week.count || 0), highlight: index === signupRows.length - 1 };
  });
  const signupTotal = signups.reduce((sum: number, week: { value: number }) => sum + week.value, 0);
  const funnel: { label: string; value: number; tone: Tone }[] = [
    { label: "VA accounts", value: value("total"), tone: "slate" },
    { label: "Started a profile", value: value("started"), tone: "indigo" },
    { label: "Approved", value: value("approved"), tone: "amber" },
    { label: "Public in the directory", value: value("public"), tone: "emerald" }
  ];
  const funnelTop = Math.max(funnel[0].value, 1);

  return <details className="dash-secondary">
    <summary>Analytics and maintenance</summary>
    <div className="dash-grid">
      <div className="dash-col">
        <Panel title="Talent funnel" subtitle="Where VA accounts are right now, excluding rejected">
          <div className="dash-funnel">{funnel.map((step) => <div className="dash-funnel-row" key={step.label}><span className="dash-funnel-label">{step.label}</span><div className="dash-funnel-track"><div className={`dash-funnel-fill tone-${step.tone}`} style={{ width: `${Math.max((step.value / funnelTop) * 100, 9)}%` }}>{step.value}</div></div></div>)}</div>
        </Panel>
        <Panel title="New VA signups" subtitle={`${plural(signupTotal, "account")} in the last ${SIGNUP_WEEKS} weeks · this week highlighted`}>
          <BarChart data={signups} label="New VA signups per week" height={110} />
        </Panel>
      </div>
      <div className="dash-col">
        <Panel title="Directory maintenance">
          <SignalList items={[
            { label: "Vetted but not listed", count: value("vetted_hidden"), href: "/workspace/recruiter/talent?readiness=vetted_hidden", icon: <UserRoundCheck size={16} />, hint: "Screened, profile still short" },
            { label: "Incomplete profiles", count: value("incomplete"), href: "/workspace/recruiter/talent?readiness=incomplete", icon: <AlertCircle size={16} />, hint: "Missing details clients need" }
          ]}/>
        </Panel>
        <Panel title="Fast cleanup" subtitle="Open a filtered directory before applying any bulk action">
          <div className="dash-button-stack">
            <Link prefetch={false} className="dash-btn dash-btn-dark" href="/workspace/recruiter/talent?readiness=incomplete">Clean incomplete profiles</Link>
            <Link prefetch={false} className="dash-btn dash-btn-light" href="/workspace/recruiter/talent?stale=60">Review stale VAs</Link>
            <Link prefetch={false} className="dash-btn dash-btn-light" href="/workspace/recruiter/talent?readiness=zero">Email 0% profiles</Link>
          </div>
        </Panel>
      </div>
    </div>
  </details>;
}

async function RecruiterDashboardContent({ userId }: { userId: string }) {
  const admin = createAdminClient();
  const nowIso = new Date().toISOString();
  const nextWeekIso = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const [{ data, error }, { data: myDayData, error: myDayError }, { data: discoveryData, error: discoveryError }, { count: approvalReadyCount, error: approvalReadyError }] = await Promise.all([
    admin.rpc("recruiter_dashboard_overview", { p_queue_limit: QUEUE_PREVIEW }),
    admin.rpc("recruiter_today_queue", { p_user_id: userId, p_limit: 5 }),
    admin
      .from("lead_intake")
      .select("id,name,company,service,job_id,discovery_scheduled_at,discovery_duration_minutes,discovery_meeting_url")
      .not("discovery_scheduled_at", "is", null)
      .is("discovery_completed_at", null)
      .is("discovery_cancelled_at", null)
      .gte("discovery_scheduled_at", nowIso)
      .lt("discovery_scheduled_at", nextWeekIso)
      .order("discovery_scheduled_at")
      .limit(8),
    admin
      .from("recruiter_va_directory")
      .select("user_id", { count: "exact", head: true })
      .eq("account_status", "active")
      .gte("completion_score", APPROVAL_MIN_COMPLETION)
      .not("stage", "in", "(approved,bench,rejected)")
  ]);
  if (error) throw error;
  if (myDayError) throw myDayError;
  if (discoveryError) throw discoveryError;
  if (approvalReadyError) throw approvalReadyError;

  const { data: noShowData, error: noShowError } = await admin
    .from("lead_intake")
    .select("id,name,email,company,discovery_outcome,owner_id,discovery_scheduled_at")
    .eq("lead_type", "client_hiring")
    .eq("discovery_outcome", "no_show")
    .or(`owner_id.eq.${userId},owner_id.is.null`)
    .order("discovery_scheduled_at", { ascending: false })
    .limit(8);
  if (noShowError) throw noShowError;

  const noShows = Array.isArray(noShowData) ? noShowData : [];
  const noShowKeys = noShows.map((lead: any) => `discovery-no-show-rebook-${lead.id}`);
  const { data: rebookEvents, error: rebookEventError } = noShowKeys.length
    ? await admin
        .from("outbound_email_events")
        .select("idempotency_key,status")
        .eq("event_type", "discovery_no_show_rebook")
        .eq("status", "sent")
        .in("idempotency_key", noShowKeys)
    : { data: [], error: null };
  if (rebookEventError) throw rebookEventError;
  const rebookSentIds = new Set((rebookEvents || []).map((row: any) =>
    String(row.idempotency_key || "").replace(/^discovery-no-show-rebook-/, "")
  ));

  const overview = (data || {}) as RecruiterDashboardOverview;
  const metrics = overview.metrics || {};
  const queueRows = Array.isArray(overview.vetting_queue) ? overview.vetting_queue : [];
  const jobs = Array.isArray(overview.roles_needing_matching) ? overview.roles_needing_matching : [];
  const nextActions: TodayQueueItem[] = Array.isArray(myDayData) ? myDayData.slice(0, 5) : [];
  const upcomingDiscoveries = (Array.isArray(discoveryData) ? discoveryData : []) as UpcomingDiscovery[];
  const value = (key: keyof RecruiterDashboardMetrics) => Number(metrics[key] || 0);
  const unreviewed = value("unreviewed");
  const rolesWithoutCandidates = value("roles_without_candidates");

  return (
    <>
      <div className="dash-stats">
        <StatCard label="Leads needing first contact" value={value("untouched_leads")} icon={<Mail size={20} />} tone="rose" href="/workspace/recruiter/leads?view=attention" sub="Reply before the prospect keeps shopping" chip={value("untouched_leads") ? { label: "Reply first", tone: "warn" } : { label: "All contacted", tone: "good" }} />
        <StatCard label="Follow-ups due" value={value("followups_due")} icon={<Clock3 size={20} />} tone="amber" href="/workspace/recruiter/leads?view=attention" sub="Scheduled follow-ups now due" chip={value("followups_due") ? { label: "Overdue", tone: "warn" } : { label: "On schedule", tone: "good" }} />
        <StatCard label="Discovery calls" value={value("discovery_next_two_days")} icon={<CalendarClock size={20} />} tone="violet" href="/workspace/recruiter/leads?view=discovery" sub="Today and tomorrow, Manila time" chip={{ label: value("discovery_next_two_days") ? "Prep the brief" : "None booked", tone: "neutral" }} />
        <StatCard label="Open client pipeline" value={value("open_leads")} icon={<TrendingUp size={20} />} tone="emerald" href="/workspace/recruiter/leads?view=open" sub={`USD ${value("open_pipeline_value").toLocaleString()} estimated value`} />
      </div>

      <Panel
        title="Upcoming discovery calls"
        subtitle="All active client discovery bookings in the next 7 days, across recruiters"
        action={<Link prefetch={false} className="dash-link" href="/workspace/recruiter/agenda">Open agenda <ArrowRight size={14} aria-hidden="true" /></Link>}
      >
        {upcomingDiscoveries.length ? <div className="dash-list">
          {upcomingDiscoveries.map((meeting) => {
            const href = meeting.job_id ? `/workspace/recruiter/matching/${meeting.job_id}` : `/workspace/recruiter/leads?view=discovery&q=${encodeURIComponent(meeting.company || meeting.name || "")}`;
            return <div className="dash-list-row" key={meeting.id}>
              <Link prefetch={false} href={href} style={{minWidth:0,flex:1}}>
                <span><strong>{meeting.company || meeting.name || "Client discovery"}</strong><small>{meeting.service || "Hiring discovery"} · {queueTimeLabel(meeting.discovery_scheduled_at)} · {meeting.discovery_duration_minutes || 30} min</small></span>
              </Link>
              <div className="row wrap">
                {meeting.discovery_meeting_url ? <a className="dash-btn dash-btn-light" href={meeting.discovery_meeting_url} target="_blank" rel="noreferrer">Join Meet</a> : <Pill tone="amber">Meet pending</Pill>}
              </div>
            </div>;
          })}
        </div> : <Empty title="No upcoming discovery calls" desc="There are no active discovery bookings in the next 7 days." />}
      </Panel>

      <Panel
        title="Call rebooking"
        subtitle="No-show discovery calls stay here until the client chooses another time"
        action={<Link prefetch={false} className="dash-link" href="/workspace/recruiter/today#call-rebooking">Open full rebooking queue <ArrowRight size={14} aria-hidden="true" /></Link>}
      >
        {noShows.length ? <div className="dash-list">
          {noShows.map((lead: any) => {
            const sent = rebookSentIds.has(lead.id);
            const leadHref = lead.email
              ? `/workspace/recruiter/leads?view=discovery&q=${encodeURIComponent(lead.email)}`
              : "/workspace/recruiter/leads?view=discovery";
            return <div className="dash-list-row" key={lead.id}>
              <Link prefetch={false} href={leadHref} style={{minWidth:0,flex:1}}>
                <span>
                  <strong>{lead.company || lead.name || lead.email || "Client discovery"}</strong>
                  <small>{lead.email || "No email on file"} · {sent ? "Rebooking link sent, waiting for a new time" : "No-show recorded, rebooking link not sent"}</small>
                </span>
              </Link>
              <div className="row wrap">
                {sent
                  ? <Pill tone="emerald">Link sent</Pill>
                  : <form action={sendDiscoveryNoShowRebookAction}>
                      <input type="hidden" name="lead_id" value={lead.id} />
                      <input type="hidden" name="return_to" value="/workspace/recruiter" />
                      <button className="dash-btn dash-btn-dark" type="submit"><MessageSquare size={14} aria-hidden="true" /> Send rebooking link</button>
                    </form>}
              </div>
            </div>;
          })}
        </div> : <Empty title="No clients waiting to rebook" desc="No discovery-call no-shows currently need a new time." />}
      </Panel>

      <div className="dash-grid recruiter-priority-grid">
        <div className="dash-col">
          <Panel title="Next actions" subtitle="Your highest-priority current work. Click any item to open the exact record." action={<Link prefetch={false} className="dash-link" href="/workspace/recruiter/today">View all My Day <ArrowRight size={14}/></Link>}>
            {nextActions.length ? <div className="dash-actions">
              {nextActions.map((item) => {
                const href = exactActionHref(item);
                return <Link prefetch={false} key={`${item.kind}-${item.id}`} href={href} className="dash-action">
                  <span className="dash-action-count"><Clock3 size={15}/></span>
                  <span className="dash-action-copy">
                    <span className="dash-action-title"><strong>{item.title}</strong><Pill tone={PRIORITY_TONE[item.priority ?? ""] || "slate"} dot={false}>{item.priority || "normal"}</Pill></span>
                    <small>{item.subtitle || "Open this item and complete the next step."}</small>
                    <small className="muted">{queueTimeLabel(item.due_at)}</small>
                  </span>
                  <span className="dash-action-go"><ArrowRight size={16} aria-label="Act now" /></span>
                </Link>;
              })}
            </div> : <Empty title="You’re caught up" desc="No current recruiter action is waiting right now." />}
          </Panel>
          <RecruiterVettingQueue unreviewed={unreviewed} queueRows={queueRows}/>
        </div>

        <div className="dash-col">
          <RecruiterRolesNeedingMatching count={rolesWithoutCandidates} jobs={jobs}/>
          <Panel title="Hiring and talent signals">
            <SignalList items={[
              { label: "Approval-ready profiles", count: Number(approvalReadyCount || 0), href: "/workspace/recruiter/talent?readiness=approval_ready", icon: <UserRoundCheck size={16} />, hint: `${APPROVAL_MIN_COMPLETION}%+ complete; photo not required for recruiter approval` },
              { label: "Public-ready profiles", count: value("ready"), href: "/workspace/recruiter/talent?readiness=ready", icon: <Eye size={16} />, hint: `${PUBLIC_VA_MIN_COMPLETION}%+ profile with a photo` },
              { label: "Active client roles", count: value("active_jobs"), href: "/workspace/recruiter/matching", icon: <BriefcaseBusiness size={16} />, hint: `${rolesWithoutCandidates} with no candidates yet` },
              { label: "Incomplete profiles", count: value("incomplete"), href: "/workspace/recruiter/talent?readiness=incomplete", icon: <AlertCircle size={16} />, hint: "Missing details clients need" },
              { label: "New applications", count: value("new_apps"), href: "/workspace/recruiter/matching?view=applications", icon: <CheckCircle2 size={16} />, hint: "Across all roles" },
              { label: "Unread messages", count: value("unread_messages"), href: "/workspace/recruiter/activity?type=messages", icon: <MessageSquare size={16} />, hint: "Managed-agency activity" }
            ]} />
          </Panel>
        </div>
      </div>

      <Suspense fallback={<RecruiterAnalyticsFallback/>}>
        <RecruiterAnalytics metrics={metrics}/>
      </Suspense>
    </>
  );
}

export default async function RecruiterDashboard({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { userId } = await requireRoleFast("recruiter");
  const params = await searchParams;

  return (
    <div className="dash-page">
      <DashHeader
        kicker="Recruiter control center"
        title="Today’s work"
        subtitle={<>Open this page and work top to bottom. The first item is the next thing that needs you. <span className="dash-freshness">Live data · refreshed when this page opened</span></>}
        actions={<>
          <Link prefetch={false} className="dash-btn dash-btn-light" href="/workspace/recruiter/leads?view=attention"><Mail size={15} aria-hidden="true" /> Open sales CRM</Link>
          <Link prefetch={false} className="dash-btn dash-btn-dark" href="/workspace/recruiter/today"><Sparkles size={15} aria-hidden="true" /> Open My Day</Link>
        </>}
      />

      {params.bulk_done ? <Notice tone="success">{RESULT_WORD[params.bulk_done] ? `${params.affected || 0} ${RESULT_WORD[params.bulk_done]}` : "Done"}{params.published !== undefined ? ` · ${params.published} now live in the public directory` : ""}.</Notice> : null}
      {params.skipped ? <Notice tone="warn">Skipped, too little profile to judge: {params.skipped}. Approval needs a profile at {APPROVAL_MIN_COMPLETION}% or better. Approved VAs stay off the public directory until they add a photo, reach {PUBLIC_VA_MIN_COMPLETION}% and opt in.</Notice> : null}
      {params.bulk_error ? <Notice tone="error">{params.bulk_error}</Notice> : null}
      {params.rebook_email_sent ? <Notice tone="success">Rebooking link sent to the client.</Notice> : null}
      {params.rebook_email_already_sent ? <Notice tone="warn">A rebooking link was already sent. No duplicate email was sent.</Notice> : null}
      {params.rebook_email_error ? <Notice tone="error">{params.rebook_email_error}</Notice> : null}

      <Suspense fallback={<RecruiterDashboardFallback />}>
        <RecruiterDashboardContent userId={userId} />
      </Suspense>
    </div>
  );
}