import Link from "next/link";
import { AlertCircle, ArrowRight, BriefcaseBusiness, CalendarClock, CheckCircle2, CirclePlay, CircleX, Clock3, Mail, MessageSquare, Sparkles, Star, TrendingUp, UserRoundCheck } from "lucide-react";
import { bulkRecruiterVaAction } from "@/app/actions/recruiter";
import { BarChart, DashHeader, Empty, Notice, Panel, Pill, ProgressRing, SignalList, StatCard, type Tone } from "@/components/dash-ui";
import { requireRole } from "@/lib/auth";
import { isOpenLeadStage } from "@/lib/lead-crm";
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

// Monday-anchored week starts in UTC, oldest first, ending with this week.
function mondayWeekStarts(weeks: number) {
  const now = new Date();
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
  return Array.from({ length: weeks }, (_, i) => {
    const start = new Date(monday);
    start.setUTCDate(monday.getUTCDate() - (weeks - 1 - i) * 7);
    return start;
  });
}

function bucketByWeek(dates: string[], weekStarts: Date[]) {
  const counts = weekStarts.map(() => 0);
  for (const raw of dates) {
    const t = new Date(raw).getTime();
    for (let i = weekStarts.length - 1; i >= 0; i--) {
      if (t >= weekStarts[i].getTime()) { counts[i] += 1; break; }
    }
  }
  return weekStarts.map((start, i) => ({ label: `${start.getUTCMonth() + 1}/${start.getUTCDate()}`, value: counts[i], highlight: i === weekStarts.length - 1 }));
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export default async function RecruiterDashboard({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireRole("recruiter");
  const params = await searchParams;
  const admin = createAdminClient();
  const weekStarts = mondayWeekStarts(SIGNUP_WEEKS);
  const directoryCount = () => admin.from("recruiter_va_directory").select("user_id", { count: "exact", head: true }).eq("account_status", "active");

  const [
    unreviewedRes, incompleteRes, readyRes, vettedHiddenRes, activeJobsRes, newAppsRes, unreadMessagesRes, leadsRes, jobsRes, releasedRes,
    queueRes, totalRes, startedRes, approvedRes, publicRes, signupsRes
  ] = await Promise.all([
    admin.from("va_vetting").select("va_id", { count: "exact", head: true }).eq("stage", "recruiter_review"),
    directoryCount().lt("completion_score", 100).neq("stage", "rejected"),
    directoryCount().gte("completion_score", PUBLIC_VA_MIN_COMPLETION).not("avatar_url", "is", null).not("stage", "in", "(approved,bench,rejected)"),
    directoryCount().in("stage", ["approved", "bench"]).lt("completion_score", 100),
    admin.from("jobs").select("id", { count: "exact", head: true }).in("status", ["pending", "published"]),
    admin.from("applications").select("id", { count: "exact", head: true }).eq("status", "new"),
    admin.from("messages").select("id", { count: "exact", head: true }).is("read_at", null),
    admin.from("lead_intake").select("id,created_at,crm_stage,first_contact_at,next_follow_up_at,estimated_value_usd,discovery_scheduled_at,discovery_completed_at", { count: "exact" }).not("crm_stage", "in", "(won,lost)").order("created_at", { ascending: false }).limit(500),
    admin.from("jobs").select("id,title,company_name,status,created_at").in("status", ["pending", "published"]).order("created_at", { ascending: false }).limit(100),
    admin.from("job_shortlist_candidates").select("id", { count: "exact", head: true }).eq("shortlist_status", "released"),
    // Oldest first: whoever has waited longest is who to review next.
    admin.from("va_vetting").select("va_id,updated_at,video_url").eq("stage", "recruiter_review").order("updated_at", { ascending: true }).limit(QUEUE_PREVIEW),
    directoryCount().neq("stage", "rejected"),
    directoryCount().neq("stage", "rejected").gt("completion_score", 0),
    directoryCount().in("stage", ["approved", "bench"]),
    admin.from("public_va_directory").select("user_id", { count: "exact", head: true }),
    admin.from("recruiter_va_directory").select("account_created_at").gte("account_created_at", weekStarts[0].toISOString()).limit(5000)
  ]);

  // Scoped to the listed roles rather than scanning every shortlist row and
  // every application ever created.
  const activeJobIds = (jobsRes.data || []).map((job: any) => job.id);
  const queueRows = queueRes.data || [];
  const queueIds = queueRows.map((row: any) => row.va_id);
  const [jobSignals, queueDetails]: any[] = await Promise.all([
    activeJobIds.length
      ? Promise.all([
          admin.from("job_shortlist_candidates").select("job_id").in("job_id", activeJobIds).in("shortlist_status", ["proposed", "released"]),
          admin.from("applications").select("job_id").in("job_id", activeJobIds)
        ])
      : Promise.resolve([{ data: [] }, { data: [] }]),
    queueIds.length
      ? Promise.all([
          admin.from("profiles").select("id,full_name,avatar_url").in("id", queueIds),
          admin.from("va_profiles").select("*").in("user_id", queueIds),
          admin.from("va_test_attempts").select("va_id,final_score,auto_score,submitted_at").in("va_id", queueIds).order("submitted_at", { ascending: false })
        ])
      : Promise.resolve([{ data: [] }, { data: [] }, { data: [] }])
  ]);
  const [shortlistRes, appsByJobRes] = jobSignals;
  const [queueProfilesRes, queueVasRes, queueTestsRes] = queueDetails;

  const candidateJobIds = new Set([...(shortlistRes.data || []).map((r: any) => r.job_id), ...(appsByJobRes.data || []).map((r: any) => r.job_id)]);
  const noCandidates = (jobsRes.data || []).filter((job: any) => !candidateJobIds.has(job.id));
  const profileMap = new Map((queueProfilesRes.data || []).map((p: any) => [p.id, p]));
  const vaMap = new Map((queueVasRes.data || []).map((v: any) => [v.user_id, v]));
  const testMap = new Map<string, any>();
  for (const attempt of queueTestsRes.data || []) if (!testMap.has(attempt.va_id)) testMap.set(attempt.va_id, attempt);

  // Sales CRM.
  const openLeads = (leadsRes.data || []).filter((lead: any) => isOpenLeadStage(lead.crm_stage));
  const untouchedLeadCount = openLeads.filter((lead: any) => (lead.crm_stage || "new") === "new" && !lead.first_contact_at).length;
  const followUpsDue = openLeads.filter((lead: any) => lead.next_follow_up_at && new Date(lead.next_follow_up_at).getTime() <= Date.now()).length;
  const openPipelineValue = openLeads.reduce((sum: number, lead: any) => sum + Number(lead.estimated_value_usd || 0), 0);
  // "Today / tomorrow" is counted in Manila time (UTC+8).
  const manilaShift = 8 * 60 * 60 * 1000;
  const manilaNow = new Date(Date.now() + manilaShift);
  const todayStart = Date.UTC(manilaNow.getUTCFullYear(), manilaNow.getUTCMonth(), manilaNow.getUTCDate()) - manilaShift;
  const dayAfterTomorrow = todayStart + 2 * 86400000;
  const discoveryNextTwoDays = openLeads.filter((lead: any) => {
    if (!lead.discovery_scheduled_at || lead.discovery_completed_at) return false;
    const at = new Date(lead.discovery_scheduled_at).getTime();
    return at >= Date.now() - 60 * 60000 && at < dayAfterTomorrow;
  }).length;

  const unreviewed = unreviewedRes.count || 0;
  const signups = bucketByWeek((signupsRes.data || []).map((row: any) => row.account_created_at).filter(Boolean), weekStarts);
  const signupTotal = signups.reduce((sum, week) => sum + week.value, 0);

  const funnel: { label: string; value: number; tone: Tone }[] = [
    { label: "VA accounts", value: totalRes.count || 0, tone: "slate" },
    { label: "Started a profile", value: startedRes.count || 0, tone: "indigo" },
    { label: "Approved", value: approvedRes.count || 0, tone: "amber" },
    { label: "Public in the directory", value: publicRes.count || 0, tone: "emerald" }
  ];
  const funnelTop = Math.max(funnel[0].value, 1);

  const today = [
    { priority: "urgent", title: "Client leads need first contact", count: untouchedLeadCount, copy: "Reply first. The CRM tracks a 30-minute first-response target.", href: "/workspace/recruiter/leads?view=attention" },
    { priority: "urgent", title: "Client follow-ups are due", count: followUpsDue, copy: "Open overdue follow-ups before working lower-value queues.", href: "/workspace/recruiter/leads?view=attention" },
    { priority: "high", title: "Discovery calls today / tomorrow", count: discoveryNextTwoDays, copy: "Review the brief before the call, qualify the client, then send the proposal while intent is high.", href: "/workspace/recruiter/leads?view=discovery" },
    { priority: "urgent", title: "New client roles", count: (jobsRes.data || []).filter((job: any) => job.status === "pending").length, copy: "Review submitted hiring briefs, confirm terms, and begin matching.", href: "/workspace/recruiter/matching" },
    { priority: "high", title: "Roles waiting for candidates", count: noCandidates.length, copy: "Open the role and work from the recommended candidate list.", href: "/workspace/recruiter/matching?view=needs_candidates" },
    { priority: "medium", title: "Vetted VAs not yet listed", count: vettedHiddenRes.count || 0, copy: "Screening is done but the profile is incomplete. Send a reminder naming what is missing.", href: "/workspace/recruiter/talent?readiness=vetted_hidden" },
    { priority: "medium", title: "VAs waiting for review", count: unreviewed, copy: "Complete screening so strong talent can become matchable.", href: "/workspace/recruiter/queue" },
    { priority: "low", title: "Client decisions to follow up", count: releasedRes.count || 0, copy: "Check released shortlists and unblock the next hiring step.", href: "/workspace/recruiter/matching" }
  ];
  const openActions = today.reduce((total, item) => total + item.count, 0);

  return (
    <div className="dash-page">
      <DashHeader
        kicker="Recruiter control center"
        title="Today’s work"
        subtitle="Revenue first: respond to new clients, unblock active roles, then work the talent pipeline."
        actions={<>
          <Link className="dash-btn dash-btn-light" href="/workspace/recruiter/leads?view=attention"><Mail size={15} aria-hidden="true" /> Open sales CRM</Link>
          <Link className="dash-btn dash-btn-dark" href="/workspace/recruiter/matching"><Sparkles size={15} aria-hidden="true" /> Match active roles</Link>
        </>}
      />

      {params.bulk_done ? <Notice tone="success">{RESULT_WORD[params.bulk_done] ? `${params.affected || 0} ${RESULT_WORD[params.bulk_done]}` : "Done"}{params.published !== undefined ? ` · ${params.published} now live in the public directory` : ""}.</Notice> : null}
      {params.skipped ? <Notice tone="warn">Skipped, not directory-ready: {params.skipped}. Approval needs a photo and a profile at {PUBLIC_VA_MIN_COMPLETION}% or better.</Notice> : null}
      {params.bulk_error ? <Notice tone="error">{params.bulk_error}</Notice> : null}

      <div className="dash-stats">
        <StatCard label="Leads needing first contact" value={untouchedLeadCount} icon={<Mail size={20} />} tone="rose" href="/workspace/recruiter/leads?view=attention" sub="Reply before the prospect keeps shopping" chip={untouchedLeadCount ? { label: "Reply first", tone: "warn" } : { label: "All contacted", tone: "good" }} />
        <StatCard label="Follow-ups due" value={followUpsDue} icon={<Clock3 size={20} />} tone="amber" href="/workspace/recruiter/leads?view=attention" sub="Scheduled follow-ups now due" chip={followUpsDue ? { label: "Overdue", tone: "warn" } : { label: "On schedule", tone: "good" }} />
        <StatCard label="Discovery calls" value={discoveryNextTwoDays} icon={<CalendarClock size={20} />} tone="violet" href="/workspace/recruiter/leads?view=discovery" sub="Today and tomorrow, Manila time" chip={{ label: discoveryNextTwoDays ? "Prep the brief" : "None booked", tone: "neutral" }} />
        <StatCard label="Open client pipeline" value={openLeads.length} icon={<TrendingUp size={20} />} tone="emerald" href="/workspace/recruiter/leads?view=open" sub={`USD ${openPipelineValue.toLocaleString()} estimated value`} />
      </div>

      <div className="dash-grid">
        <div className="dash-col">
          <Panel
            title="Vetting queue"
            subtitle={unreviewed > QUEUE_PREVIEW ? `Longest-waiting ${QUEUE_PREVIEW} of ${unreviewed} · ring shows profile completion` : `${plural(unreviewed, "candidate")} waiting · ring shows profile completion`}
            action={<Link className="dash-link" href="/workspace/recruiter/queue">Open queue <ArrowRight size={14} aria-hidden="true" /></Link>}
          >
            {queueRows.length ? (
              <div className="dash-queue">
                {queueRows.map((row: any) => {
                  const profile = profileMap.get(row.va_id) as any;
                  const va = vaMap.get(row.va_id) as any;
                  const test = testMap.get(row.va_id);
                  const testScore = test ? (test.final_score ?? test.auto_score) : null;
                  const completion = getVaCompletion(va, profile?.avatar_url).score;
                  const name = profile?.full_name || "VA candidate";
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
          </Panel>

          <Panel title="Action queue" subtitle="Ordered by what is blocking a client, a candidate, or an open role" action={<Pill tone={openActions ? "amber" : "emerald"}>{plural(openActions, "open action")}</Pill>}>
            <div className="dash-actions">
              {today.map((item) => (
                <Link key={item.title} href={item.href} className={`dash-action${item.count ? "" : " clear"}`}>
                  <span className="dash-action-count">{item.count}</span>
                  <span className="dash-action-copy">
                    <span className="dash-action-title"><strong>{item.title}</strong><Pill tone={PRIORITY_TONE[item.priority]} dot={false}>{item.priority}</Pill></span>
                    <small>{item.copy}</small>
                  </span>
                  <span className="dash-action-go">{item.count ? <ArrowRight size={16} aria-label="Open" /> : "Clear"}</span>
                </Link>
              ))}
            </div>
          </Panel>

          <Panel title="Talent funnel" subtitle="Where VA accounts are right now, excluding rejected">
            <div className="dash-funnel">
              {funnel.map((step) => (
                <div className="dash-funnel-row" key={step.label}>
                  <span className="dash-funnel-label">{step.label}</span>
                  <div className="dash-funnel-track">
                    <div className={`dash-funnel-fill tone-${step.tone}`} style={{ width: `${Math.max((step.value / funnelTop) * 100, 9)}%` }}>{step.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="dash-col">
          <Panel title="Roles that need matching" subtitle="No applications or shortlist yet" action={noCandidates.length ? <Link className="dash-link" href="/workspace/recruiter/matching?view=needs_candidates">View all <ArrowRight size={14} aria-hidden="true" /></Link> : undefined}>
            {noCandidates.length ? (
              <div className="dash-list">
                {noCandidates.slice(0, 5).map((job: any) => (
                  <Link className="dash-list-row" href={`/workspace/recruiter/matching/${job.id}`} key={job.id}>
                    <span><strong>{job.title}</strong><small>{job.company_name || "Client role"}</small></span>
                    <Pill tone="amber">needs candidates</Pill>
                  </Link>
                ))}
              </div>
            ) : <Empty title="Every role has candidates" desc="Each active role has at least one application or shortlisted VA." />}
          </Panel>

          <Panel title="Other signals">
            <SignalList items={[
              { label: "Ready to approve", count: readyRes.count || 0, href: "/workspace/recruiter/talent?readiness=ready", icon: <UserRoundCheck size={16} />, hint: `${PUBLIC_VA_MIN_COMPLETION}%+ profile with a photo` },
              { label: "Active client roles", count: activeJobsRes.count || 0, href: "/workspace/recruiter/matching", icon: <BriefcaseBusiness size={16} />, hint: `${noCandidates.length} with no candidates yet` },
              { label: "Incomplete profiles", count: incompleteRes.count || 0, href: "/workspace/recruiter/talent?readiness=incomplete", icon: <AlertCircle size={16} />, hint: "Missing details clients need" },
              { label: "Vetted but not listed", count: vettedHiddenRes.count || 0, href: "/workspace/recruiter/talent?readiness=vetted_hidden", icon: <UserRoundCheck size={16} />, hint: "Screened, profile still short" },
              { label: "New applications", count: newAppsRes.count || 0, href: "/workspace/recruiter/matching?view=applications", icon: <CheckCircle2 size={16} />, hint: "Across all roles" },
              { label: "Unread messages", count: unreadMessagesRes.count || 0, href: "/workspace/recruiter/activity?type=messages", icon: <MessageSquare size={16} />, hint: "Marketplace-wide, not your inbox" }
            ]} />
          </Panel>

          <Panel title="New VA signups" subtitle={`${plural(signupTotal, "account")} in the last ${SIGNUP_WEEKS} weeks · this week highlighted`}>
            <BarChart data={signups} label="New VA signups per week" height={110} />
          </Panel>

          <Panel title="Fast cleanup" subtitle="Filter the master directory, then apply one bulk action">
            <div className="dash-button-stack">
              <Link className="dash-btn dash-btn-dark" href="/workspace/recruiter/talent?readiness=incomplete">Clean incomplete profiles</Link>
              <Link className="dash-btn dash-btn-light" href="/workspace/recruiter/talent?stale=60">Review stale VAs</Link>
              <Link className="dash-btn dash-btn-light" href="/workspace/recruiter/talent?readiness=zero">Email 0% profiles</Link>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
