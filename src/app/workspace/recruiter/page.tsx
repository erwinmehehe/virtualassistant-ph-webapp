import Link from "next/link";
import { Suspense } from "react";
import { AlertCircle, ArrowRight, BriefcaseBusiness, CalendarClock, CheckCircle2, CirclePlay, CircleX, Clock3, Mail, MessageSquare, Sparkles, Star, TrendingUp, UserRoundCheck } from "lucide-react";
import { bulkRecruiterVaAction } from "@/app/actions/recruiter";
import { BarChart, DashHeader, Empty, Notice, Panel, Pill, ProgressRing, SignalList, StatCard, type Tone } from "@/components/dash-ui";
import { requireRole } from "@/lib/auth";
import { getVaCompletion } from "@/lib/profile-completeness";
import { PUBLIC_VA_MIN_COMPLETION } from "@/lib/public-visibility";
import { createAdminClient } from "@/lib/supabase/admin";

const SIGNUP_WEEKS = 10;
const QUEUE_PREVIEW = 5;
const PRIORITY_TONE: Record<string, Tone> = { urgent: "rose", high: "amber", medium: "indigo", low: "slate" };
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
  signups: { week_start: string; count: number }[];
};

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

async function RecruiterVettingQueue({ unreviewed }: { unreviewed: number }) {
  const admin = createAdminClient();
  const { data: queueData, error } = await admin.rpc("recruiter_dashboard_vetting_queue", { p_limit: QUEUE_PREVIEW });
  if (error) throw error;
  const queueRows = Array.isArray(queueData) ? queueData : [];

  return <Panel
    title="Vetting queue"
    subtitle={unreviewed > QUEUE_PREVIEW ? `Longest-waiting ${QUEUE_PREVIEW} of ${unreviewed} · ring shows profile completion` : `${plural(unreviewed, "candidate")} waiting · ring shows profile completion`}
    action={<Link className="dash-link" href="/workspace/recruiter/queue">Open queue <ArrowRight size={14} aria-hidden="true" /></Link>}
  >
    {(queueRows || []).length ? (
      <div className="dash-queue">
        {(queueRows || []).map((row: any) => {
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
                    {completion < PUBLIC_VA_MIN_COMPLETION ? <Pill tone="amber">under {PUBLIC_VA_MIN_COMPLETION}%</Pill> : null}
                  </div>
                </div>
              </div>
              <div className="dash-queue-actions">
                <form action={bulkRecruiterVaAction}>
                  <input type="hidden" name="va_id" value={row.va_id} />
                  <input type="hidden" name="bulk_action" value="approve_publish" />
                  <input type="hidden" name="return_to" value="/workspace/recruiter" />
                  <button className="dash-btn dash-btn-success" type="submit"><CheckCircle2 size={15} aria-hidden="true" /> Approve</button>
                </form>
                <Link className="dash-btn dash-btn-light" href={`/workspace/recruiter/candidates/${row.va_id}`}>Review</Link>
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

async function RecruiterRolesNeedingMatching({ count }: { count: number }) {
  const admin = createAdminClient();
  const { data: roleData, error } = await admin.rpc("recruiter_dashboard_roles_needing_matching", { p_limit: QUEUE_PREVIEW });
  if (error) throw error;
  const jobs = Array.isArray(roleData) ? roleData : [];

  return <Panel title="Roles that need matching" subtitle="No applications or shortlist yet" action={count ? <Link className="dash-link" href="/workspace/recruiter/matching?view=needs_candidates">View all <ArrowRight size={14} aria-hidden="true" /></Link> : undefined}>
    {jobs.length ? (
      <div className="dash-list">
        {jobs.map((job: any) => (
          <Link className="dash-list-row" href={`/workspace/recruiter/matching/${job.id}`} key={job.id}>
            <span><strong>{job.title}</strong><small>{job.company_name || "Client role"}</small></span>
            <Pill tone="amber">needs candidates</Pill>
          </Link>
        ))}
      </div>
    ) : <Empty title="Every role has candidates" desc="Each active role has at least one application or shortlisted VA." />}
  </Panel>;
}

export default async function RecruiterDashboard({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireRole("recruiter");
  const params = await searchParams;
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("recruiter_dashboard_metrics", { p_signup_weeks: SIGNUP_WEEKS });
  if (error) throw error;

  const metrics = (data || {}) as Partial<RecruiterDashboardMetrics>;
  const value = (key: keyof RecruiterDashboardMetrics) => Number(metrics[key] || 0);
  const unreviewed = value("unreviewed");
  const rolesWithoutCandidates = value("roles_without_candidates");
  const signupRows = Array.isArray(metrics.signups) ? metrics.signups : [];
  const signups = signupRows.map((week, index) => {
    const start = new Date(week.week_start);
    return { label: `${start.getUTCMonth() + 1}/${start.getUTCDate()}`, value: Number(week.count || 0), highlight: index === signupRows.length - 1 };
  });
  const signupTotal = signups.reduce((sum, week) => sum + week.value, 0);

  const funnel: { label: string; value: number; tone: Tone }[] = [
    { label: "VA accounts", value: value("total"), tone: "slate" },
    { label: "Started a profile", value: value("started"), tone: "indigo" },
    { label: "Approved", value: value("approved"), tone: "amber" },
    { label: "Public in the directory", value: value("public"), tone: "emerald" }
  ];
  const funnelTop = Math.max(funnel[0].value, 1);

  const today = [
    { priority: "urgent", title: "Client leads need first contact", count: value("untouched_leads"), copy: "Reply first. The CRM tracks a 30-minute first-response target.", href: "/workspace/recruiter/leads?view=attention" },
    { priority: "urgent", title: "Client follow-ups are due", count: value("followups_due"), copy: "Open overdue follow-ups before working lower-value queues.", href: "/workspace/recruiter/leads?view=attention" },
    { priority: "high", title: "Discovery calls today / tomorrow", count: value("discovery_next_two_days"), copy: "Review the brief before the call, qualify the client, then send the proposal while intent is high.", href: "/workspace/recruiter/leads?view=discovery" },
    { priority: "urgent", title: "New client roles", count: value("pending_jobs"), copy: "Review submitted hiring briefs, confirm terms, and begin matching.", href: "/workspace/recruiter/matching" },
    { priority: "high", title: "Roles waiting for candidates", count: rolesWithoutCandidates, copy: "Open the role and work from the recommended candidate list.", href: "/workspace/recruiter/matching?view=needs_candidates" },
    { priority: "medium", title: "Vetted VAs not yet listed", count: value("vetted_hidden"), copy: "Screening is done but the profile is incomplete. Send a reminder naming what is missing.", href: "/workspace/recruiter/talent?readiness=vetted_hidden" },
    { priority: "medium", title: "VAs waiting for review", count: unreviewed, copy: "Complete screening so strong talent can become matchable.", href: "/workspace/recruiter/queue" },
    { priority: "low", title: "Client decisions to follow up", count: value("released_shortlists"), copy: "Check released shortlists and unblock the next hiring step.", href: "/workspace/recruiter/matching" }
  ];
  const openActions = today.reduce((total, item) => total + item.count, 0);

  return (
    <div className="dash-page">
      <DashHeader
        kicker="Recruiter control center"
        title="Today’s work"
        subtitle={<>Revenue first: respond to new clients, unblock active roles, then work the talent pipeline. <span className="dash-freshness">Live data · refreshed when this page opened</span></>}
        actions={<>
          <Link className="dash-btn dash-btn-light" href="/workspace/recruiter/leads?view=attention"><Mail size={15} aria-hidden="true" /> Open sales CRM</Link>
          <Link className="dash-btn dash-btn-dark" href="/workspace/recruiter/matching"><Sparkles size={15} aria-hidden="true" /> Match active roles</Link>
        </>}
      />

      {params.bulk_done ? <Notice tone="success">{RESULT_WORD[params.bulk_done] ? `${params.affected || 0} ${RESULT_WORD[params.bulk_done]}` : "Done"}{params.published !== undefined ? ` · ${params.published} now live in the public directory` : ""}.</Notice> : null}
      {params.skipped ? <Notice tone="warn">Skipped, not directory-ready: {params.skipped}. Approval needs a photo and a profile at {PUBLIC_VA_MIN_COMPLETION}% or better.</Notice> : null}
      {params.bulk_error ? <Notice tone="error">{params.bulk_error}</Notice> : null}

      <div className="dash-stats">
        <StatCard label="Leads needing first contact" value={value("untouched_leads")} icon={<Mail size={20} />} tone="rose" href="/workspace/recruiter/leads?view=attention" sub="Reply before the prospect keeps shopping" chip={value("untouched_leads") ? { label: "Reply first", tone: "warn" } : { label: "All contacted", tone: "good" }} />
        <StatCard label="Follow-ups due" value={value("followups_due")} icon={<Clock3 size={20} />} tone="amber" href="/workspace/recruiter/leads?view=attention" sub="Scheduled follow-ups now due" chip={value("followups_due") ? { label: "Overdue", tone: "warn" } : { label: "On schedule", tone: "good" }} />
        <StatCard label="Discovery calls" value={value("discovery_next_two_days")} icon={<CalendarClock size={20} />} tone="violet" href="/workspace/recruiter/leads?view=discovery" sub="Today and tomorrow, Manila time" chip={{ label: value("discovery_next_two_days") ? "Prep the brief" : "None booked", tone: "neutral" }} />
        <StatCard label="Open client pipeline" value={value("open_leads")} icon={<TrendingUp size={20} />} tone="emerald" href="/workspace/recruiter/leads?view=open" sub={`USD ${value("open_pipeline_value").toLocaleString()} estimated value`} />
      </div>

      <div className="dash-grid recruiter-priority-grid">
        <div className="dash-col">
          <Panel title="Today’s priority actions" subtitle="Ordered by what is blocking a client, candidate, or active role" action={<Pill tone={openActions ? "amber" : "emerald"}>{plural(openActions, "open action")}</Pill>}>
            <div className="dash-actions">
              {today.map((item) => (
                <Link key={item.title} href={item.href} className={`dash-action${item.count ? "" : " clear"}`}>
                  <span className="dash-action-count">{item.count}</span>
                  <span className="dash-action-copy"><span className="dash-action-title"><strong>{item.title}</strong><Pill tone={PRIORITY_TONE[item.priority]} dot={false}>{item.priority}</Pill></span><small>{item.copy}</small></span>
                  <span className="dash-action-go">{item.count ? <ArrowRight size={16} aria-label="Open" /> : "Clear"}</span>
                </Link>
              ))}
            </div>
          </Panel>
          <Suspense fallback={<Panel title="Vetting queue" subtitle="Loading candidate details"><div className="workspace-skeleton-card" aria-busy="true"/></Panel>}>
            <RecruiterVettingQueue unreviewed={unreviewed}/>
          </Suspense>
        </div>

        <div className="dash-col">
          <Suspense fallback={<Panel title="Roles that need matching" subtitle="Loading candidate status"><div className="workspace-skeleton-card" aria-busy="true"/></Panel>}>
            <RecruiterRolesNeedingMatching count={rolesWithoutCandidates}/>
          </Suspense>
          <Panel title="Hiring and talent signals">
            <SignalList items={[
              { label: "Ready to approve", count: value("ready"), href: "/workspace/recruiter/talent?readiness=ready", icon: <UserRoundCheck size={16} />, hint: `${PUBLIC_VA_MIN_COMPLETION}%+ profile with a photo` },
              { label: "Active client roles", count: value("active_jobs"), href: "/workspace/recruiter/matching", icon: <BriefcaseBusiness size={16} />, hint: `${rolesWithoutCandidates} with no candidates yet` },
              { label: "Incomplete profiles", count: value("incomplete"), href: "/workspace/recruiter/talent?readiness=incomplete", icon: <AlertCircle size={16} />, hint: "Missing details clients need" },
              { label: "New applications", count: value("new_apps"), href: "/workspace/recruiter/matching?view=applications", icon: <CheckCircle2 size={16} />, hint: "Across all roles" },
              { label: "Unread messages", count: value("unread_messages"), href: "/workspace/recruiter/activity?type=messages", icon: <MessageSquare size={16} />, hint: "Marketplace-wide activity" }
            ]} />
          </Panel>
        </div>
      </div>

      <details className="dash-secondary">
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
                <Link className="dash-btn dash-btn-dark" href="/workspace/recruiter/talent?readiness=incomplete">Clean incomplete profiles</Link>
                <Link className="dash-btn dash-btn-light" href="/workspace/recruiter/talent?stale=60">Review stale VAs</Link>
                <Link className="dash-btn dash-btn-light" href="/workspace/recruiter/talent?readiness=zero">Email 0% profiles</Link>
              </div>
            </Panel>
          </div>
        </div>
      </details>
    </div>
  );
}
