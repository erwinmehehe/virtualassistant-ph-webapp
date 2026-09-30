import Link from "next/link";
import { CalendarDays, Clock3, ExternalLink, MessageSquareText, UserRound, UsersRound } from "lucide-react";
import { requireRoleFast } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDateTimeInTimeZone, isValidTimeZone } from "@/lib/timezone";
import styles from "./discovery.module.css";

type DiscoveryLead = {
  id: string;
  name: string | null;
  email: string | null;
  company: string | null;
  service: string | null;
  timezone: string | null;
  message: string | null;
  owner_id: string | null;
  job_id: string | null;
  crm_stage: string | null;
  next_follow_up_at: string | null;
  discovery_scheduled_at: string | null;
  discovery_completed_at: string | null;
  discovery_cancelled_at: string | null;
  discovery_outcome: string | null;
  discovery_meeting_url: string | null;
  created_at: string;
};

type Owner = { id: string; full_name: string | null };
type Job = { id: string; title: string | null };

const VIEWS = [
  ["upcoming", "Upcoming"],
  ["action", "Needs action"],
  ["completed", "Completed"],
  ["all", "All discovery"],
] as const;

function ageLabel(createdAt: string) {
  const hours = Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 3600000));
  if (hours < 24) return `${Math.max(1, hours)}h old`;
  return `${Math.max(1, Math.floor(hours / 24))}d old`;
}

function cleanPain(message?: string | null) {
  const clean = String(message || "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^(Requested talent profile|Client-selected shortlist|Virtual Assistant budget|Tools \/ systems):/i.test(line))
    .join(" ");
  return clean ? clean.slice(0, 220) : "No workload note captured yet.";
}

function outcomeLabel(value?: string | null) {
  return value ? value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase()) : "Not completed";
}

function callState(lead: DiscoveryLead, now: number) {
  const scheduled = lead.discovery_scheduled_at ? new Date(lead.discovery_scheduled_at).getTime() : 0;
  if (lead.discovery_cancelled_at) return "cancelled";
  if (lead.discovery_completed_at) return "completed";
  if (scheduled && scheduled < now) return "overdue";
  if (scheduled) return "upcoming";
  return "not_booked";
}

function needsAction(lead: DiscoveryLead, now: number) {
  const state = callState(lead, now);
  if (state === "overdue") return true;
  if (!lead.discovery_completed_at) return false;
  const outcome = String(lead.discovery_outcome || "");
  const followDue = Boolean(lead.next_follow_up_at && new Date(lead.next_follow_up_at).getTime() <= now);
  return ["no_show", "attended", "nurture"].includes(outcome) && followDue;
}

export default async function RecruiterDiscoveryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { userId } = await requireRoleFast("recruiter");
  const admin = createAdminClient();
  const requested = String(params.view || "upcoming");
  const view = VIEWS.some(([value]) => value === requested) ? requested : "upcoming";

  const [{ data: leadData, error: leadError }, { data: ownerData, error: ownerError }] = await Promise.all([
    admin
      .from("lead_intake")
      .select("id,name,email,company,service,timezone,message,owner_id,job_id,crm_stage,next_follow_up_at,discovery_scheduled_at,discovery_completed_at,discovery_cancelled_at,discovery_outcome,discovery_meeting_url,created_at")
      .eq("lead_type", "client_hiring")
      .order("created_at", { ascending: false })
      .limit(500),
    admin
      .from("profiles")
      .select("id,full_name")
      .in("role", ["recruiter", "admin"])
      .eq("account_status", "active")
      .order("full_name"),
  ]);
  if (leadError) throw leadError;
  if (ownerError) throw ownerError;

  const all = ((leadData || []) as DiscoveryLead[]).filter((lead) =>
    Boolean(lead.discovery_scheduled_at || lead.discovery_completed_at || lead.discovery_cancelled_at || lead.crm_stage === "discovery_booked"),
  );
  const owners = new Map(((ownerData || []) as Owner[]).map((owner) => [owner.id, owner.full_name || "Recruiter"]));
  const jobIds = [...new Set(all.map((lead) => lead.job_id).filter((id): id is string => Boolean(id)))];
  const { data: jobData, error: jobError } = jobIds.length
    ? await admin.from("jobs").select("id,title").in("id", jobIds)
    : { data: [] as Job[], error: null };
  if (jobError) throw jobError;
  const jobs = new Map(((jobData || []) as Job[]).map((job) => [job.id, job.title || "Virtual Assistant role"]));

  const now = Date.now();
  const upcoming = all.filter((lead) => callState(lead, now) === "upcoming");
  const action = all.filter((lead) => needsAction(lead, now));
  const completed = all.filter((lead) => Boolean(lead.discovery_completed_at));
  const visible = (view === "upcoming" ? upcoming : view === "action" ? action : view === "completed" ? completed : all)
    .sort((a, b) => {
      if (view === "upcoming") return new Date(a.discovery_scheduled_at || 0).getTime() - new Date(b.discovery_scheduled_at || 0).getTime();
      if (view === "action") return new Date(a.next_follow_up_at || a.discovery_scheduled_at || 0).getTime() - new Date(b.next_follow_up_at || b.discovery_scheduled_at || 0).getTime();
      return new Date(b.discovery_completed_at || b.discovery_scheduled_at || b.created_at).getTime() - new Date(a.discovery_completed_at || a.discovery_scheduled_at || a.created_at).getTime();
    });

  const counts: Record<string, number> = {
    upcoming: upcoming.length,
    action: action.length,
    completed: completed.length,
    all: all.length,
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className={styles.kicker}>Recruiter workspace</span>
          <h1>Discovery calls</h1>
          <p>Prepare for calls, capture discovery, qualify the role, and hand the client directly into matching.</p>
        </div>
        <div className={styles.headerActions}>
          <Link className={styles.secondaryButton} href="/workspace/recruiter/crm?view=discovery"><UsersRound size={15}/> Client pipeline</Link>
        </div>
      </header>

      <section className={styles.summary} aria-label="Discovery summary">
        <div><span>Upcoming</span><strong>{upcoming.length}</strong><small>Booked calls ahead</small></div>
        <div><span>Needs action</span><strong>{action.length}</strong><small>Past calls or follow-up due</small></div>
        <div><span>Completed</span><strong>{completed.length}</strong><small>Discovery history</small></div>
        <div><span>Assigned to me</span><strong>{all.filter((lead) => lead.owner_id === userId).length}</strong><small>Your discovery records</small></div>
      </section>

      <nav className={styles.tabs} aria-label="Discovery views">
        {VIEWS.map(([value, label]) => (
          <Link key={value} className={view === value ? styles.activeTab : undefined} href={`/workspace/recruiter/discovery?view=${value}`}>
            <span>{label}</span><small>{counts[value]}</small>
          </Link>
        ))}
      </nav>

      <section className={styles.list}>
        {visible.map((lead) => {
          const state = callState(lead, now);
          const timeZone = isValidTimeZone(lead.timezone) ? String(lead.timezone) : "";
          const role = lead.job_id ? jobs.get(lead.job_id) : null;
          return (
            <article className={styles.card} key={lead.id}>
              <div className={styles.cardMain}>
                <div className={styles.meta}>
                  <span className={styles.state} data-state={state}>{state.replaceAll("_", " ")}</span>
                  <span><Clock3 size={13}/>{ageLabel(lead.created_at)} lead</span>
                  <span><UserRound size={13}/>{lead.owner_id ? owners.get(lead.owner_id) || "Assigned" : "Unassigned"}</span>
                </div>
                <h2>{lead.company || lead.name || "Client"} <em>· {role || lead.service || "VA hiring"}</em></h2>
                <p>{cleanPain(lead.message)}</p>
                <div className={styles.callLine}>
                  <CalendarDays size={14}/>
                  <strong>{lead.discovery_scheduled_at ? formatDateTimeInTimeZone(lead.discovery_scheduled_at, timeZone) : "No active booking"}</strong>
                  <span>{timeZone || "Client timezone not confirmed"}</span>
                  {lead.discovery_completed_at ? <span>Outcome: {outcomeLabel(lead.discovery_outcome)}</span> : null}
                </div>
              </div>

              <div className={styles.actions}>
                <Link className={styles.primaryButton} href={`/workspace/recruiter/crm/${lead.id}/discovery`}>Open Discovery Workspace</Link>
                {lead.discovery_meeting_url && state === "upcoming" ? (
                  <a className={styles.secondaryButton} href={lead.discovery_meeting_url} target="_blank" rel="noreferrer">
                    Join Meet <ExternalLink size={13}/>
                  </a>
                ) : null}
                <Link className={styles.textLink} href={`/workspace/recruiter/crm/${lead.id}`}><MessageSquareText size={14}/> Client record</Link>
              </div>
            </article>
          );
        })}
        {!visible.length ? (
          <div className={styles.empty}>
            <CalendarDays size={24}/>
            <strong>No discovery calls in this view.</strong>
            <p>Booked calls will appear here automatically.</p>
            <Link href="/workspace/recruiter/crm">Open client pipeline</Link>
          </div>
        ) : null}
      </section>
    </main>
  );
}
