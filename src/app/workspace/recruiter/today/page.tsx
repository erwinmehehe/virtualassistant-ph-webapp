import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, CalendarDays, CheckCircle2, Clock3, ExternalLink, FileText, MessageSquare, RefreshCw, UserRound, UserRoundCheck } from "lucide-react";
import { requireRoleFast } from "@/lib/auth";
import { DashHeader } from "@/components/dash-ui";
import { RecruiterOperationsNav } from "@/components/recruiter-operations-nav";
import { createAdminClient } from "@/lib/supabase/admin";
import { withServerTiming } from "@/lib/server-timing";
import { completeRecruiterTaskAction, snoozeRecruiterTaskAction } from "@/app/actions/recruiter-ops";
import { sendClientShortlistFollowupAction } from "@/app/actions/client-shortlist";
import { prepareTopMatchesForReviewAction } from "@/app/actions/matching";
import { getRecruiterRolesSummary } from "@/lib/recruiter-roles-summary";
import { canonicalRecruiterHref } from "@/lib/recruiter-routes";
import { formatDateTimeInTimeZone, isValidTimeZone } from "@/lib/timezone";
import styles from "./today.module.css";

const PRIORITY_CLASS: Record<string,string> = { urgent:"badge-warning", high:"badge-warning", normal:"", low:"" };
const LEAD_QUEUE_KINDS = new Set(["lead_first_contact", "lead_followup"]);
const FOLLOW_THROUGH_KINDS = new Set(["client_shortlist_waiting", "client_response_overdue"]);
const CONVERSION_QUEUE_KINDS = new Set(["discovery", "proposal_missing", "proposal_draft"]);

type DailyActionRow = {
  priority: string | null;
  action_type: string | null;
  title: string | null;
  description: string | null;
  href: string | null;
  subject_type: string | null;
  subject_id: string | null;
  age_hours: number | null;
};

type ActiveRoleRow = {
  id: string;
  title: string | null;
  company_name: string | null;
  status: string | null;
  hiring_stage: string | null;
  hiring_stage_entered_at: string | null;
  updated_at: string | null;
  created_at: string;
};

type NewHiringRoleRow = {
  id: string;
  title: string | null;
  company_name: string | null;
  lead_id: string | null;
  recruiter_id: string | null;
  status: string | null;
  hiring_stage: string | null;
  created_at: string;
};

type UpcomingDiscoveryRow = {
  id: string;
  company: string | null;
  service: string | null;
  timezone: string | null;
  message: string | null;
  created_at: string;
  discovery_scheduled_at: string;
  discovery_meeting_url: string | null;
  job_id: string | null;
};

type ProposalActionRow = {
  proposal_id: string;
  lead_id: string;
  role_title: string | null;
  status: string;
  sent_at: string | null;
  viewed_at: string | null;
  changes_requested_at: string | null;
  name: string | null;
  company: string | null;
  action_kind: "changes_requested" | "viewed_waiting" | "unopened";
  action_at: string | null;
};

type CleanupLeadRow = {
  id: string;
  name: string | null;
  email: string | null;
  company: string | null;
  service: string | null;
  crm_stage: string | null;
  first_contact_at: string | null;
  last_contact_at: string | null;
  next_follow_up_at: string | null;
  last_touch_at: string | null;
  primary_reason: "Missed first response" | "Follow-up overdue" | "No next step" | "Stale 3 days" | "Stale 7 days" | "Ready to close";
  cleanup_labels: string[] | null;
  due_at: string | null;
};

function ageLabel(hours: number | null | undefined) {
  const value = Math.max(0, Number(hours || 0));
  if (value < 24) return `${Math.max(1, Math.round(value))}h`;
  return `${Math.max(1, Math.floor(value / 24))}d`;
}

function stageAge(value?: string | null) {
  if (!value) return null;
  const diff = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(diff) || diff <= 0) return null;
  return Math.max(1, Math.floor(diff / 86400000));
}

function manilaTime(value?: string | null) {
  if (!value) return "No due time";
  return new Intl.DateTimeFormat("en-PH", { dateStyle:"medium", timeStyle:"short", timeZone:"Asia/Manila" }).format(new Date(value));
}

function discoveryTime(value?: string | null, timeZone?: string | null) {
  if (!value) return "No call time";
  if (isValidTimeZone(timeZone)) return formatDateTimeInTimeZone(value, timeZone);
  return `${formatDateTimeInTimeZone(value, "UTC")} · client timezone not confirmed`;
}

function discoveryPain(message?: string | null) {
  const clean = String(message || "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^(Requested talent profile|Client-selected shortlist|Virtual Assistant budget|Tools \/ systems):/i.test(line))
    .join(" ");
  return clean ? clean.slice(0, 220) : "No pain or workload note captured yet.";
}

function meetingActionLabel(value: unknown) {
  const raw = String(value || "").trim();
  try {
    const host = new URL(raw).hostname.toLowerCase();
    if (host === "meet.google.com") return "Join Google Meet";
    if (host === "zoom.us" || host.endsWith(".zoom.us")) return "Join Zoom";
    if (host === "teams.microsoft.com" || host.endsWith(".teams.microsoft.com") || host === "teams.live.com") return "Join Microsoft Teams";
    if (host === "calendar.google.com") return "Open Google Calendar";
  } catch {
    // Unknown or malformed URLs get a provider-neutral label below.
  }
  return "Join call";
}

function exactActionHref(item:any) {
  const meta=item?.metadata||{};
  if(item.kind==="discovery"&&item.id) return `/workspace/recruiter/crm/${item.id}/discovery`;
  if(item.kind==="client_email_reply"&&item.id) return `/workspace/recruiter/crm/${item.id}`;
  if(item.kind==="proposal_action"&&item.id) return `/workspace/recruiter/crm/${item.id}/proposal`;
  if(item.kind==="proposal_draft"&&item.id) return `/workspace/recruiter/crm/${item.id}/proposal`;
  if(item.kind==="proposal_missing"&&item.id) return `/workspace/recruiter/crm/${item.id}/discovery`;
  if(item.kind==="closing_followup"&&item.id) return `/workspace/recruiter/crm/${item.id}#client-followup`;
  if(["placement_checkin","placement_risk","placement_handoff"].includes(String(item.kind))&&item.href) return canonicalRecruiterHref(item.href,null);
  if(meta.subject_type==="job"&&meta.subject_id) return `/workspace/recruiter/roles/${meta.subject_id}`;
  if(meta.subject_type==="va"&&meta.subject_id) return `/workspace/recruiter/candidates/${meta.subject_id}`;
  if(["role_review","role_without_shortlist","role_needs_terms","client_terms_waiting","client_account_missing","client_shortlist_waiting","all_candidates_passed","client_response_overdue","interview_requested","interview_today","interview_feedback_missing","offer_waiting_va","offer_waiting_client"].includes(String(item.kind))&&item.id) return `/workspace/recruiter/roles/${item.id}`;
  if(item.kind==="candidate_capacity_conflict"&&item.id) return `/workspace/recruiter/candidates/${item.id}`;
  return canonicalRecruiterHref(item.href,null);
}

function actionLabel(item:any) {
  if(item.kind==="discovery") return "Open Discovery Workspace";
  if(item.kind==="client_email_reply") return "Reply to client";
  if(item.kind==="proposal_action") return "Open proposal";
  if(item.kind==="proposal_draft") return "Finish proposal";
  if(item.kind==="proposal_missing") return "Prepare proposal";
  if(item.kind==="closing_followup") return "Open closing record";
  if(item.kind==="all_candidates_passed") return "Find replacements";
  if(["client_shortlist_waiting","client_response_overdue"].includes(String(item.kind))) return "Open role";
  if(item.kind==="interview_requested") return "Schedule interview";
  if(["interview_today","interview_feedback_missing"].includes(String(item.kind))) return "Open interview";
  if(["offer_waiting_va","offer_waiting_client"].includes(String(item.kind))) return "Open offer";
  if(item.kind==="placement_checkin") return "Complete check-in";
  if(item.kind==="placement_risk") return "Open placement";
  if(item.kind==="placement_handoff") return "Complete handoff";
  if(item.kind==="candidate_capacity_conflict") return "Review VA";
  if(item.kind==="task") return "Act now";
  return "Review role";
}

export default async function RecruiterTodayPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}) {
  const params = await searchParams;
  const { userId } = await requireRoleFast("recruiter");
  const admin = createAdminClient();
  const [
    { data: summaryData, error: summaryError },
    roleSummary,
    { data: activeLeadTimeZones, error: activeLeadTimeZonesError },
  ] = await Promise.all([
    withServerTiming("recruiter.today_summary", () => admin.rpc("recruiter_today_summary", { p_user_id:userId })),
    getRecruiterRolesSummary(userId),
    admin
      .from("lead_intake")
      .select("id,timezone,crm_stage")
      .eq("lead_type", "client_hiring")
      .limit(500),
  ]);
  if (summaryError) throw summaryError;
  if (roleSummary.error) throw roleSummary.error;
  if (activeLeadTimeZonesError) throw activeLeadTimeZonesError;

  const timezoneNeedsConfirmation = (activeLeadTimeZones || []).filter((lead:any) => {
    const stage = String(lead.crm_stage || "new");
    return !["won", "lost"].includes(stage) && !isValidTimeZone(lead.timezone);
  });
  const summary = (summaryData || {}) as Record<string,any>;
  const upcomingDiscoveryCalls = (Array.isArray(summary.upcoming_discovery_calls) ? summary.upcoming_discovery_calls : []) as UpcomingDiscoveryRow[];
  const activeRoleSummaries = roleSummary.data.jobs.filter((job) => !["filled", "closed"].includes(job.hiring_stage));
  const shortlistConversionRoles = activeRoleSummaries.filter((job) => job.proposed_count > 0 && job.released_count === 0);
  const readyToSendRoles = shortlistConversionRoles.filter((job) => {
    const accessReady = ["paid", "comped"].includes(String(job.candidate_access_status || ""));
    return job.client_ready_proposed_count === job.proposed_count
      && Boolean(job.client_id)
      && job.status === "published"
      && job.commercial_status === "accepted"
      && accessReady;
  });
  const blockedShortlistRoles = shortlistConversionRoles.filter((job) => job.blocked_proposed_count > 0);
  const handoffBlockedRoles = shortlistConversionRoles.filter((job) => job.blocked_proposed_count === 0 && !readyToSendRoles.some((ready) => ready.id === job.id));
  const newHiringRoles = (Array.isArray(summary.new_hiring_roles) ? summary.new_hiring_roles : []) as NewHiringRoleRow[];
  const clientReplies = (Array.isArray(summary.client_replies) ? summary.client_replies : []) as Array<{
    lead_id:string;
    owner_id?:string|null;
    job_id?:string|null;
    name?:string|null;
    company?:string|null;
    crm_stage?:string|null;
    last_client_reply_at?:string|null;
    reply_status?:string|null;
  }>;
  const proposalActions = (Array.isArray(summary.proposal_actions) ? summary.proposal_actions : []) as ProposalActionRow[];
  const proposalChangesRequested = Number(summary.proposal_changes_requested || 0);
  const proposalViewedWaiting = Number(summary.proposal_viewed_waiting || 0);
  const proposalUnopened = Number(summary.proposal_unopened || 0);
  const cleanupQueue = (Array.isArray(summary.cleanup_queue) ? summary.cleanup_queue : []) as CleanupLeadRow[];
  const rawQueue = Array.isArray(summary.today_queue) ? summary.today_queue as any[] : [];
  const overdueDiscoveryActions = rawQueue.filter((item:any) =>
    item.kind === "discovery" &&
    item.due_at &&
    new Date(item.due_at).getTime() < Date.now()
  );
  const proposalDraftActions = rawQueue.filter((item:any) => item.kind === "proposal_draft");
  const proposalMissingActions = rawQueue.filter((item:any) => item.kind === "proposal_missing");

  const higherPriorityClosingLeadIds = new Set([
    ...clientReplies.map((row) => row.lead_id),
    ...proposalActions.map((row) => row.lead_id),
    ...overdueDiscoveryActions.map((row:any) => String(row.id)),
    ...proposalDraftActions.map((row:any) => String(row.id)),
    ...proposalMissingActions.map((row:any) => String(row.id)),
  ]);
  const closingCleanupSignals = cleanupQueue
    .filter((row) => !higherPriorityClosingLeadIds.has(row.id))
    .filter((row) => ["Follow-up overdue", "No next step", "Stale 3 days", "Stale 7 days", "Ready to close"].includes(row.primary_reason));
  const overdueClosingLeads = closingCleanupSignals.filter((row) => row.primary_reason === "Follow-up overdue");
  const stalledClosingLeads = closingCleanupSignals.filter((row) => ["Stale 3 days", "Stale 7 days", "Ready to close"].includes(row.primary_reason));
  const noNextStepLeads = closingCleanupSignals.filter((row) => row.primary_reason === "No next step");
  const closingActionLeadIds = new Set([
    ...clientReplies.map((row) => row.lead_id),
    ...proposalActions.map((row) => row.lead_id),
    ...overdueDiscoveryActions.map((row:any) => String(row.id)),
    ...proposalDraftActions.map((row:any) => String(row.id)),
    ...proposalMissingActions.map((row:any) => String(row.id)),
    ...closingCleanupSignals.map((row) => row.id),
  ]);

  const nonLeadQueue = rawQueue.filter((item:any)=>
    !LEAD_QUEUE_KINDS.has(String(item.kind)) &&
    !CONVERSION_QUEUE_KINDS.has(String(item.kind))
  );
  const queue = [
    ...clientReplies.map((row) => ({
      kind: "client_email_reply",
      id: row.lead_id,
      title: `${row.name || row.company || "Client"} replied by email`,
      subtitle: "Open the client record and respond or record the action taken.",
      due_at: row.last_client_reply_at,
      priority: "high",
      href: `/workspace/recruiter/crm/${row.lead_id}`,
    })),
    ...overdueDiscoveryActions,
    ...proposalMissingActions,
    ...proposalDraftActions,
    ...proposalActions.map((row) => ({
      kind: "proposal_action",
      id: row.lead_id,
      title: row.action_kind === "changes_requested"
        ? `Changes requested: ${row.role_title || "hiring recommendation"}`
        : row.action_kind === "viewed_waiting"
          ? `Viewed proposal needs follow-up: ${row.role_title || "hiring recommendation"}`
          : `Proposal not opened: ${row.role_title || "hiring recommendation"}`,
      subtitle: row.action_kind === "changes_requested"
        ? `${row.company || row.name || "Client"} asked for changes. Revise and resend the recommendation.`
        : row.action_kind === "viewed_waiting"
          ? `${row.company || row.name || "Client"} viewed the proposal at least 24 hours ago and has not responded.`
          : `${row.company || row.name || "Client"} has not opened the proposal after 48 hours.`,
      due_at: row.action_at,
      priority: row.action_kind === "changes_requested" ? "urgent" : row.action_kind === "viewed_waiting" ? "high" : "normal",
      href: `/workspace/recruiter/crm/${row.lead_id}/proposal`,
      metadata: { proposal_id: row.proposal_id, action_kind: row.action_kind },
    })),
    ...closingCleanupSignals.map((row) => ({
      kind: "closing_followup",
      id: row.id,
      title: row.primary_reason === "Follow-up overdue"
        ? `Follow-up overdue: ${row.company || row.name || "Client"}`
        : row.primary_reason === "Ready to close"
          ? `Decision needed: ${row.company || row.name || "Client"}`
          : row.primary_reason === "No next step"
            ? `No next step: ${row.company || row.name || "Client"}`
            : `${row.primary_reason === "Stale 7 days" ? "Stalled 7d" : "Stalled 72h+"}: ${row.company || row.name || "Client"}`,
      subtitle: row.primary_reason === "Follow-up overdue"
        ? "The scheduled CRM follow-up is past due. Re-engage with a specific decision or next step."
        : row.primary_reason === "Ready to close"
          ? "This lead has had multiple touches and no movement for 7+ days. Decide whether to recover or close it."
          : row.primary_reason === "No next step"
            ? "The client is active but has no next follow-up date. Set the next decision point."
            : `No meaningful movement since ${manilaTime(row.last_touch_at)}. Re-engage or move the lead to nurture.`,
      due_at: row.due_at,
      priority: ["Follow-up overdue", "Ready to close"].includes(row.primary_reason) ? "high" : "normal",
      href: `/workspace/recruiter/crm/${row.id}#client-followup`,
      metadata: { primary_reason: row.primary_reason, crm_stage: row.crm_stage },
    })),
    ...nonLeadQueue.filter((item:any)=>!FOLLOW_THROUGH_KINDS.has(String(item.kind))),
  ];
  const dailyActions = (Array.isArray(summary.daily_actions) ? summary.daily_actions : []) as DailyActionRow[];
  const clientWaitByJob = new Map<string,DailyActionRow>();
  for (const item of dailyActions) {
    if (!["client_shortlist_waiting","client_response_overdue"].includes(String(item.action_type)) || !item.subject_id) continue;
    const current = clientWaitByJob.get(item.subject_id);
    if (!current || item.action_type === "client_response_overdue") clientWaitByJob.set(item.subject_id,item);
  }
  const clientWaits = [...clientWaitByJob.values()].sort((a,b)=>Number(b.age_hours || 0)-Number(a.age_hours || 0));
  const interviewRequests = dailyActions
    .filter((item)=>item.action_type==="interview_requested" && item.subject_id)
    .sort((a,b)=>Number(b.age_hours || 0)-Number(a.age_hours || 0));
  const staleRolePreview = (Array.isArray(summary.stale_roles_preview) ? summary.stale_roles_preview : []) as ActiveRoleRow[];
  const staleRolesCount = Number(summary.stale_roles_count || 0);
  const unreadNotifications = Number(summary.unread_notifications || 0);
  const openTasks = Number(summary.open_tasks || 0);
  const approvalReadyCount = Number(summary.approval_ready_count || 0);
  const noShows = (Array.isArray(summary.no_show_preview) ? summary.no_show_preview : []) as Array<{id:string;name?:string|null;email?:string|null;sent?:boolean}>;
  const clientResponseOverdue = Number(summary.client_response_overdue || 0);
  const roleNoCandidates = Number(summary.role_no_candidates || 0);
  const interviewsDue = Number(summary.interviews_due || 0);

  const nextActionCandidates = [
    {count:clientReplies.length,title:"Reply to clients",copy:"A client has replied and is waiting on the recruiter. Open the CRM record, respond, or record the action taken.",href:"#sales-closing",cta:"Open client replies",icon:<MessageSquare size={20}/>},
    {count:timezoneNeedsConfirmation.length,title:"Confirm client timezones",copy:`${timezoneNeedsConfirmation.length} active client${timezoneNeedsConfirmation.length===1?" has":"s have"} no valid scheduling timezone. Confirm it before discovery or local-time follow-up.`,href:"/workspace/recruiter/crm?view=timezone",cta:"Review timezones",icon:<Clock3 size={20}/>},
    {count:overdueDiscoveryActions.length,title:"Resolve overdue discovery outcomes",copy:`${overdueDiscoveryActions.length} discovery call${overdueDiscoveryActions.length===1?" is":"s are"} past the scheduled time with no saved outcome. Record the result before the sales trail goes stale.`,href:"#needs-action",cta:"Resolve discoveries",icon:<CalendarDays size={20}/>},
    {count:proposalMissingActions.length,title:"Prepare qualified proposals",copy:`${proposalMissingActions.length} qualified discover${proposalMissingActions.length===1?"y has":"ies have"} not entered the proposal workflow. Prepare the recommendation before matching.`,href:"#needs-action",cta:"Prepare proposals",icon:<FileText size={20}/>},
    {count:proposalDraftActions.length,title:"Send proposal drafts",copy:`${proposalDraftActions.length} proposal draft${proposalDraftActions.length===1?" has":"s have"} been sitting unsent for at least two hours.`,href:"#needs-action",cta:"Finish proposals",icon:<FileText size={20}/>},
    {count:proposalActions.length,title:"Move open proposals",copy:proposalChangesRequested
      ? `${proposalChangesRequested} client change request${proposalChangesRequested===1?"":"s"} need revision now.`
      : proposalViewedWaiting
        ? `${proposalViewedWaiting} viewed proposal${proposalViewedWaiting===1?" is":"s are"} waiting for a decision.`
        : `${proposalUnopened} proposal${proposalUnopened===1?" has":"s have"} not been opened after 48 hours.`,href:"#sales-closing",cta:"Open proposal queue",icon:<FileText size={20}/>},
    {count:overdueClosingLeads.length,title:"Recover overdue follow-ups",copy:`${overdueClosingLeads.length} client follow-up${overdueClosingLeads.length===1?" is":"s are"} past the CRM due date. Re-engage before the opportunity goes cold.`,href:"#sales-closing",cta:"Open overdue follow-ups",icon:<Clock3 size={20}/>},
    {count:stalledClosingLeads.length,title:"Recover stalled client leads",copy:`${stalledClosingLeads.length} lead${stalledClosingLeads.length===1?" has":"s have"} had no meaningful movement for at least 72 hours. Follow up, nurture, or close the loop.`,href:"#sales-closing",cta:"Open stalled leads",icon:<RefreshCw size={20}/>},
    {count:noNextStepLeads.length,title:"Set missing next steps",copy:`${noNextStepLeads.length} active client lead${noNextStepLeads.length===1?" has":"s have"} no scheduled follow-up. Give each one a clear next decision point.`,href:"#sales-closing",cta:"Set next steps",icon:<Clock3 size={20}/>},
    {count:upcomingDiscoveryCalls.length,title:"Prepare upcoming discovery calls",copy:"Review the client pain, role, and known context before the call starts.",href:"#upcoming-discovery-calls",cta:"Open call prep",icon:<CalendarDays size={20}/>},
    {count:newHiringRoles.length,title:"Build the first shortlist",copy:"Fresh hiring enquiries already have linked roles. Claim one, prepare the strongest internal matches, and review them before anything reaches the client.",href:"#new-hiring-enquiries",cta:"Open new enquiries",icon:<BriefcaseBusiness size={20}/>},
    {count:cleanupQueue.length,title:"Review client follow-ups",copy:"Client leads need a decision, follow-up, or close action.",href:"/workspace/recruiter/crm?view=attention",cta:"Open needs action",icon:<MessageSquare size={20}/>},
    {count:noShows.length,title:"Review discovery no-shows",copy:"Keep missed calls visible without sending automatic client email. Resume when the client returns.",href:"/workspace/recruiter/today#role-follow-through",cta:"Open no-shows",icon:<RefreshCw size={20}/>},
    {count:interviewRequests.length,title:"Schedule requested interviews",copy:"Clients have explicitly requested interviews. Lock in the time from the role so the request cannot get lost.",href:interviewRequests[0]?.subject_id?`/workspace/recruiter/roles/${interviewRequests[0].subject_id}#interviews`:"/workspace/recruiter/roles?view=interviewing&sort=urgent",cta:"Schedule interview",icon:<CalendarDays size={20}/>},
    {count:clientResponseOverdue,title:"Chase overdue client decisions",copy:"Shortlists are waiting on client feedback. Follow up before active roles lose momentum.",href:"/workspace/recruiter/roles?view=waiting_client&sort=oldest",cta:"Open client waits",icon:<Clock3 size={20}/>},
    {count:readyToSendRoles.length,title:"Send client-ready shortlists",copy:"Recruiter-selected candidates are ready and all release gates are clear. Preview the client view and send them now.",href:"/workspace/recruiter/roles?view=ready_to_send&sort=urgent",cta:"Send shortlists",icon:<UserRoundCheck size={20}/>},
    {count:blockedShortlistRoles.length,title:"Clear shortlist readiness blockers",copy:"Recruiter-selected candidates are waiting on talent-pool, availability, or verified work-setup readiness.",href:"/workspace/recruiter/roles?view=shortlist_blocked&sort=urgent",cta:"Clear blockers",icon:<RefreshCw size={20}/>},
    {count:handoffBlockedRoles.length,title:"Clear client handoff gates",copy:"The shortlist itself is ready, but the client link, role publication, service terms, or candidate access still blocks release.",href:"/workspace/recruiter/roles?view=client_review&sort=urgent",cta:"Open blocked handoffs",icon:<BriefcaseBusiness size={20}/>},
    {count:roleNoCandidates,title:"Fill roles without candidates",copy:"These active roles do not have a usable shortlist yet.",href:"/workspace/recruiter/roles?view=needs_candidates&sort=urgent",cta:"Open roles",icon:<BriefcaseBusiness size={20}/>},
    {count:approvalReadyCount,title:"Review approval-ready VAs",copy:"These profiles have reached the readiness threshold and are waiting for a recruiter decision.",href:"/workspace/recruiter/talent?view=approval_ready&sort=completion",cta:"Review talent",icon:<UserRoundCheck size={20}/>},
    {count:interviewsDue,title:"Handle interview actions",copy:"Interviews or interview feedback need attention today.",href:"/workspace/recruiter/roles?view=interviewing&sort=urgent",cta:"Open interviews",icon:<CalendarDays size={20}/>}
  ];
  const primaryAction = nextActionCandidates.find((item)=>item.count>0) || {
    count:0,
    title:"You are caught up",
    copy:"No urgent recruiter action needs attention right now. Open Roles or Talent for routine review.",
    href:"/workspace/recruiter/roles",
    cta:"Review roles",
    icon:<CheckCircle2 size={20}/>
  };

  return <div className="dash-page recruiter-today-page">
    {params.contact_sent ? <div className="success-banner">Email sent and the next follow-up was scheduled.</div> : null}
    {params.contact_error ? <div className="alert" role="alert">{params.contact_error}</div> : null}
    {params.cleanup_saved ? <div className="success-banner">Lead updated. The cleanup queue has been refreshed.</div> : null}
    {params.cleanup_error ? <div className="alert" role="alert">{params.cleanup_error}</div> : null}
    {params.lead_closed ? <div className="success-banner">Lead closed and removed from the active cleanup queue.</div> : null}
    {params.crm_error ? <div className="alert" role="alert">{params.crm_error}</div> : null}
    {params.role_close_warning ? <div className="alert" role="alert">The lead closed, but its linked role could not be closed automatically. Review the role before continuing.</div> : null}
    {params.followup_sent ? <div className="success-banner">Client shortlist follow-up sent.</div> : null}
    {params.followup_error ? <div className="alert" role="alert">{params.followup_error}</div> : null}

    <DashHeader
      kicker="Recruiter workspace"
      title="Today"
      subtitle={<>Work the next action, then clear the queue. Roles and talent stay in their dedicated workspaces. <span className="dash-freshness">Less scanning · clearer ownership</span></>}
    />
    <RecruiterOperationsNav current="today" taskCount={openTasks} notificationCount={unreadNotifications}/>

    <section className={`${styles.nextAction} ${primaryAction.count ? styles.nextActionOpen : styles.nextActionClear}`} aria-labelledby="recruiter-next-action">
      <span className={styles.nextActionIcon}>{primaryAction.icon}</span>
      <div className={styles.nextActionCopy}>
        <span>Next up{primaryAction.count ? ` · ${primaryAction.count} waiting` : ""}</span>
        <h2 id="recruiter-next-action">{primaryAction.title}</h2>
        <p>{primaryAction.copy}</p>
      </div>
      <Link prefetch={false} className="btn btn-primary" href={primaryAction.href}>{primaryAction.cta}<ArrowRight size={15}/></Link>
    </section>

    <section id="sales-closing" className={styles.closingCommandCenter} aria-labelledby="sales-closing-heading">
      <div className={styles.closingCommandHead}>
        <div>
          <span>Sales closing</span>
          <h2 id="sales-closing-heading">Close the loop before leads go cold.</h2>
          <p>Discovery outcomes, proposal handoffs, replies, and overdue follow-ups from the same Recruiter Today summary.</p>
        </div>
        <Link prefetch={false} className="btn btn-sm" href="/workspace/recruiter/crm?view=attention">Open CRM <ArrowRight size={13}/></Link>
      </div>
      <div className={styles.closingSignalGrid}>
        <a href="#needs-action" className={overdueDiscoveryActions.length ? styles.closingSignalHot : styles.closingSignalClear}>
          <CalendarDays size={15}/>
          <span>Discovery outcomes</span>
          <strong>{overdueDiscoveryActions.length}</strong>
          <small>{overdueDiscoveryActions.length ? "Past call · outcome missing" : "Clear"}</small>
        </a>
        <a href="#needs-action" className={(proposalMissingActions.length + proposalDraftActions.length) ? styles.closingSignalWarm : styles.closingSignalClear}>
          <FileText size={15}/>
          <span>Proposal handoff</span>
          <strong>{proposalMissingActions.length + proposalDraftActions.length}</strong>
          <small>{proposalMissingActions.length ? `${proposalMissingActions.length} missing proposal` : proposalDraftActions.length ? `${proposalDraftActions.length} draft unsent` : "Clear"}</small>
        </a>
        <a href="#needs-action" className={clientReplies.length ? styles.closingSignalHot : styles.closingSignalClear}>
          <MessageSquare size={15}/>
          <span>Client replies</span>
          <strong>{clientReplies.length}</strong>
          <small>{clientReplies.length ? "Waiting on recruiter" : "Clear"}</small>
        </a>
        <a href="#needs-action" className={proposalActions.length ? styles.closingSignalWarm : styles.closingSignalClear}>
          <FileText size={15}/>
          <span>Proposal actions</span>
          <strong>{proposalActions.length}</strong>
          <small>{proposalChangesRequested ? `${proposalChangesRequested} changes requested` : proposalViewedWaiting ? `${proposalViewedWaiting} viewed · waiting` : proposalUnopened ? `${proposalUnopened} unopened` : "Clear"}</small>
        </a>
        <a href="#needs-action" className={overdueClosingLeads.length ? styles.closingSignalHot : styles.closingSignalClear}>
          <Clock3 size={15}/>
          <span>Overdue follow-ups</span>
          <strong>{overdueClosingLeads.length}</strong>
          <small>{overdueClosingLeads.length ? "Past CRM due date" : "Clear"}</small>
        </a>
        <a href="#needs-action" className={(stalledClosingLeads.length + noNextStepLeads.length) ? styles.closingSignalWarm : styles.closingSignalClear}>
          <RefreshCw size={15}/>
          <span>Stalled / no next step</span>
          <strong>{stalledClosingLeads.length + noNextStepLeads.length}</strong>
          <small>{stalledClosingLeads.length ? `${stalledClosingLeads.length} stalled 72h+` : noNextStepLeads.length ? `${noNextStepLeads.length} missing follow-up` : "Clear"}</small>
        </a>
      </div>
      <div className={styles.closingCommandFoot}>
        <strong>{closingActionLeadIds.size ? `${closingActionLeadIds.size} client lead${closingActionLeadIds.size===1?"":"s"} need closing attention` : "Closing queue is clear"}</strong>
        <span>{closingActionLeadIds.size ? "Work these before routine sourcing and profile review." : "No discovery, proposal, reply, overdue follow-up, or stalled-lead signal is active."}</span>
      </div>
    </section>

    {upcomingDiscoveryCalls.length ? <section id="upcoming-discovery-calls" className={`card dashboard-section-card ${styles.sectionShell}`}>
      <div className={`dashboard-section-head ${styles.sectionHead}`}>
        <div><h2>Upcoming discovery calls</h2><p>Open the call workspace with the client context already in front of you.</p></div>
        <span className="badge">{upcomingDiscoveryCalls.length} next 48h</span>
      </div>
      <div className={styles.discoveryList}>
        {upcomingDiscoveryCalls.map((lead) => <article className={styles.discoveryRow} key={lead.id}>
          <div className={styles.discoveryMain}>
            <div className={styles.discoveryMeta}>
              <span><CalendarDays size={13}/>{discoveryTime(lead.discovery_scheduled_at, lead.timezone)}</span>
              <span><Clock3 size={13}/>{ageLabel((Date.now()-new Date(lead.created_at).getTime())/3600000)} lead age</span>
            </div>
            <h3>{lead.company || "Client"} <em>· {lead.service || "Virtual Assistant role"}</em></h3>
            <p>{discoveryPain(lead.message)}</p>
          </div>
          <div className={styles.discoveryActions}>
            <Link className="btn btn-sm btn-primary" href={`/workspace/recruiter/crm/${lead.id}/discovery`}>Open Discovery Workspace</Link>
            {lead.discovery_meeting_url ? <a className="btn btn-sm" href={lead.discovery_meeting_url} target="_blank" rel="noreferrer">{meetingActionLabel(lead.discovery_meeting_url)} <ExternalLink size={13}/></a> : null}
          </div>
        </article>)}
      </div>
    </section> : null}

    {newHiringRoles.length ? <section id="new-hiring-enquiries" className={`card dashboard-section-card ${styles.sectionShell}`}>
      <div className={`dashboard-section-head ${styles.sectionHead}`}>
        <div><h2>New hiring enquiries</h2><p>Review the brief, prepare matches, then release only the VAs you want the client to see.</p></div>
        <span className="badge badge-warning">{newHiringRoles.length} waiting</span>
      </div>
      <div className={styles.enquiryList}>
        {newHiringRoles.map((job)=><article className={styles.enquiryRow} key={job.id}>
          <div className={styles.enquiryMain}>
            <div className={styles.enquiryMeta}><span className="badge">{job.recruiter_id===userId?"My role":"Unassigned"}</span><span>{ageLabel((Date.now()-new Date(job.created_at).getTime())/3600000)} old</span></div>
            <h3>{job.title||"Virtual Assistant role"}</h3>
            <p>{job.company_name||"New client"} · {String(job.hiring_stage||"intake").replaceAll("_"," ")}</p>
            <div className={styles.handoffSteps} aria-label="Booking to shortlist handoff"><span className={styles.stepDone}>Booked</span><span className={styles.stepCurrent}>Review brief</span><span>Match VAs</span><span>Shortlist</span></div>
          </div>
          <div className={styles.enquiryActions}>
            {job.lead_id?<Link className="btn btn-sm" href={`/workspace/recruiter/crm/${job.lead_id}`}>Review booking</Link>:null}
            <Link className="btn btn-sm" href={`/workspace/recruiter/roles/${job.id}#overview`}>Brief</Link>
            <form action={prepareTopMatchesForReviewAction}>
              <input type="hidden" name="job_id" value={job.id}/>
              <input type="hidden" name="return_to" value={`/workspace/recruiter/roles/${job.id}`}/>
              <button className="btn btn-sm btn-primary" type="submit">Prepare top matches</button>
            </form>
          </div>
        </article>)}
      </div>
    </section> : null}

    {shortlistConversionRoles.length ? <section id="shortlist-conversion" className={`card dashboard-section-card ${styles.sectionShell}`}>
      <div className={`dashboard-section-head ${styles.sectionHead}`}>
        <div><h2>Shortlists to move</h2><p>These are recruiter-selected candidates, not automatic match suggestions. Clear the blocker, then move the role into client review.</p></div>
        <div className="row wrap"><span className="badge">{readyToSendRoles.length} ready to send</span><span className={`badge ${blockedShortlistRoles.length ? "badge-warning" : "badge-success"}`}>{blockedShortlistRoles.length} readiness blocked</span></div>
      </div>
      <div className={styles.compactList}>
        {shortlistConversionRoles.slice(0,6).map((role)=>{
          const accessReady=["paid","comped"].includes(String(role.candidate_access_status||""));
          const ready=role.client_ready_proposed_count===role.proposed_count&&Boolean(role.client_id)&&role.status==="published"&&role.commercial_status==="accepted"&&accessReady;
          const blockers=[
            role.blocked_proposed_count>0?`${role.blocked_proposed_count} VA readiness blocker${role.blocked_proposed_count===1?"":"s"}`:null,
            !role.client_id?"client account not linked":null,
            role.status!=="published"?"role not published":null,
            role.commercial_status!=="accepted"?"service terms not accepted":null,
            !accessReady?"candidate access not active":null,
          ].filter(Boolean);
          return <div className={styles.compactRow} key={`conversion-${role.id}`}>
            <div className={styles.compactCopy}>
              <strong>{role.title||"Client role"}</strong>
              <small>{role.company_name||"Client"} · {role.client_ready_proposed_count}/{role.proposed_count} shortlisted VAs client-ready</small>
              <small>{ready?"Ready for client review":blockers.join(" · ")||"Review release gates"}</small>
            </div>
            <Link className={`btn btn-sm ${ready?"btn-primary":""}`} href={`/workspace/recruiter/roles/${role.id}${role.blocked_proposed_count>0?"#matching":"#client-handoff"}`}>{ready?"Send to client":"Fix blockers"}</Link>
          </div>;
        })}
      </div>
      {shortlistConversionRoles.length>6?<Link prefetch={false} className={styles.moreLink} href="/workspace/recruiter/roles?view=shortlist_blocked&sort=urgent">+{shortlistConversionRoles.length-6} more shortlist roles</Link>:null}
    </section> : null}

    {interviewRequests.length ? <section id="interview-requests" className={`card dashboard-section-card ${styles.sectionShell}`}>
      <div className={`dashboard-section-head ${styles.sectionHead}`}>
        <div><h2>Interview requests</h2><p>Clients have asked to meet these candidates. Schedule from the role and keep the next step in one place.</p></div>
        <span className="badge badge-warning">{interviewRequests.length} waiting</span>
      </div>
      <div className={styles.compactList}>
        {interviewRequests.slice(0,6).map((item)=><div className={styles.compactRow} key={item.subject_id || item.title}>
          <div className={styles.compactCopy}>
            <strong>{item.title || "Client requested an interview"}</strong>
            <small>{item.description || "Interview time has not been scheduled yet."}</small>
          </div>
          {item.subject_id?<Link className="btn btn-primary btn-sm" href={`/workspace/recruiter/roles/${item.subject_id}#interviews`}>Schedule</Link>:null}
        </div>)}
      </div>
    </section> : null}



    <div className={styles.actionColumns}>
    <section id="needs-action" className={`card dashboard-section-card ${styles.sectionShell} ${styles.queueCard}`}>
      <div className={`dashboard-section-head ${styles.sectionHead}`}><div><h2>Needs action</h2><p>Only work that needs a recruiter decision or follow-up today.</p></div><span className={`badge ${queue.length ? "badge-warning" : "badge-success"}`}>{queue.length} item{queue.length===1?"":"s"}</span></div>
      {queue.length ? <>
        {queue.length > 2 ? <div className={styles.scrollHint}>All {queue.length} items are below. Scroll this queue to review every item.</div> : null}
        <div className={`dash-actions ${styles.queue}`} tabIndex={0} aria-label={`Today's work queue, ${queue.length} items`}>
          {queue.map((item:any) => {
            const isDiscovery = item.kind === "discovery";
            const isTask = item.kind === "task";
            const isClientFollowup=["client_shortlist_waiting","client_response_overdue"].includes(item.kind);
            const actionHref=exactActionHref(item);
            return <article className={`dash-action ${styles.queueItem}`} key={`${item.kind}-${item.id}`}>
              <span className="dash-action-count"><Clock3 size={16}/></span>
              <span className="dash-action-copy">
                <span className="dash-action-title"><strong>{item.title}</strong><span className={`badge ${PRIORITY_CLASS[item.priority] || ""}`}>{item.priority}</span></span>
                <small>{item.subtitle}</small>
                {isDiscovery && item.metadata?.name ? <small className="muted"><UserRound size={12}/> Booked by {item.metadata.name}{item.metadata.email ? ` · ${item.metadata.email}` : ""}</small> : null}
                <small className="muted">{isDiscovery ? discoveryTime(item.due_at, item.metadata?.timezone) : `${manilaTime(item.due_at)} · Manila`}</small>
                <div className="row wrap" style={{marginTop:8}}>
                  {isDiscovery && item.action_url ? <a className="btn btn-sm btn-primary" href={item.action_url} target="_blank" rel="noreferrer">{meetingActionLabel(item.action_url)} <ExternalLink size={13}/></a> : null}
                  {isClientFollowup&&item.id?<form action={sendClientShortlistFollowupAction}><input type="hidden" name="job_id" value={item.id}/><input type="hidden" name="return_to" value="/workspace/recruiter/today"/><button className="btn btn-sm btn-primary" type="submit"><MessageSquare size={13}/> Send client follow-up</button></form>:null}
                  {actionHref ? <Link prefetch={false} className="btn btn-sm" href={actionHref}>{actionLabel(item)}</Link> : null}
                  {isTask ? <>
                    <form action={completeRecruiterTaskAction}><input type="hidden" name="task_id" value={item.id}/><input type="hidden" name="return_to" value="/workspace/recruiter/today"/><button className="btn btn-sm btn-primary" type="submit"><CheckCircle2 size={13}/> Done</button></form>
                    <form action={snoozeRecruiterTaskAction}><input type="hidden" name="task_id" value={item.id}/><input type="hidden" name="minutes" value="1440"/><button className="btn btn-sm" type="submit">Snooze 1 day</button></form>
                  </> : null}
                </div>
              </span>
            </article>;
          })}
        </div>
      </> : <div className="dashboard-caught-up"><CheckCircle2 size={22}/><div><strong>You’re caught up.</strong><p>No current Recruitment or Client Success work is waiting right now.</p></div><Link prefetch={false} className="btn btn-sm" href="/workspace/recruiter/roles">Open roles</Link></div>}
    </section>

    <section id="role-follow-through" className={`card dashboard-section-card ${styles.sectionShell}`}>
      <div className={`dashboard-section-head ${styles.sectionHead}`}>
        <div><h2>Follow-through</h2><p>No-shows, client decisions, and roles that have stopped moving.</p></div>
        <Link prefetch={false} className="btn btn-sm" href="/workspace/recruiter/roles">Open roles <ArrowRight size={13}/></Link>
      </div>

      {noShows.length ? <div className={styles.followList}>
        <div className={styles.groupLabel}>Discovery no-shows</div>
        {noShows.slice(0,5).map((lead)=>(
          <div className={styles.followRow} key={`no-show-${lead.id}`}>
            <span className={styles.followIcon}><RefreshCw size={15}/></span>
            <span className={styles.followCopy}>
              <strong>{lead.name||lead.email||"Client discovery call"}</strong>
              <small>{lead.email||"No email on file"} · No-show recorded</small>
            </span>
            <div className={styles.followActions}>
              <Link prefetch={false} className="btn btn-sm" href={`/workspace/recruiter/crm/${lead.id}`}>Open</Link>
            </div>
          </div>
        ))}
      </div> : null}

      {clientWaits.length ? <div className={styles.followList}>
        <div className={styles.groupLabel}>Waiting on client</div>
        {clientWaits.slice(0,5).map((item)=>(
          <div className={styles.followRow} key={`wait-${item.action_type}-${item.subject_id}`}>
            <span className={styles.followIcon}><MessageSquare size={15}/></span>
            <span className={styles.followCopy}>
              <strong>{item.title || "Client decision pending"}</strong>
              <small>{item.description || "Shortlist feedback is still pending."}</small>
              <small>{ageLabel(item.age_hours)} waiting</small>
            </span>
            <div className={styles.followActions}>
              {item.subject_id ? <form action={sendClientShortlistFollowupAction}><input type="hidden" name="job_id" value={item.subject_id}/><input type="hidden" name="return_to" value="/workspace/recruiter/today"/><button className="btn btn-sm btn-primary" type="submit">Follow up</button></form> : null}
              {item.subject_id ? <Link prefetch={false} className="btn btn-sm" href={`/workspace/recruiter/roles/${item.subject_id}`}>Open</Link> : null}
            </div>
          </div>
        ))}
      </div> : null}

      {staleRolePreview.length ? <div className={styles.followList}>
        <div className={styles.groupLabel}>No recent movement</div>
        {staleRolePreview.map((role)=>{
          const lastStageAt = role.hiring_stage_entered_at || role.updated_at || role.created_at;
          return <Link prefetch={false} className={styles.followRow} href={`/workspace/recruiter/roles/${role.id}`} key={`stale-${role.id}`}>
            <span className={styles.followIcon}><BriefcaseBusiness size={15}/></span>
            <span className={styles.followCopy}>
              <strong>{role.title || "Client role"}</strong>
              <small>{role.company_name || "Client"} · {role.hiring_stage || role.status || "Open"}</small>
              <small>{stageAge(lastStageAt)}d in the same stage</small>
            </span>
            <ArrowRight size={15}/>
          </Link>;
        })}
        {staleRolesCount > staleRolePreview.length ? <Link prefetch={false} className={styles.moreLink} href="/workspace/recruiter/roles">+{staleRolesCount - staleRolePreview.length} more stale roles</Link> : null}
      </div> : null}

      {!noShows.length && !clientWaits.length && !staleRolePreview.length ? <div className="dashboard-caught-up"><CheckCircle2 size={22}/><div><strong>Role follow-through is clear.</strong><p>No client decisions are overdue and no owned role has been sitting in the same stage for 72+ hours.</p></div></div> : null}
    </section>
    </div>
  </div>;
}