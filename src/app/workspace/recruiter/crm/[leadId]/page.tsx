import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  CalendarPlus,
  Check,
  Clock3,
  ClipboardList,
  ListTodo,
  Mail,
  MessageSquareText,
  Phone,
  Send,
  UserRound,
  FileText,
} from "lucide-react";
import { requireRoleFast } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { LEAD_CRM_STAGES, leadStageLabel } from "@/lib/lead-crm";
import { dateInputValue as dateInput } from "@/lib/format";
import { dateTimeInputValueInTimeZone, formatDateTimeInTimeZone, isValidTimeZone } from "@/lib/timezone";
import {
  updateLeadCrmAction,
  addRecruiterNoteAction,
  recordLeadContactAction,
  sendClientFollowupAction,
  scheduleDiscoveryAction,
  completeDiscoveryAction,
  createDiscoveryGoogleMeetLinkAction,
  cancelRecruiterDiscoveryAction,
} from "@/app/actions/recruiter";
import { createCrmCustomFieldAction, saveCrmClosingControlAction, setCrmCustomValueAction } from "@/app/actions/crm";
import { completeRecruiterTaskAction, createRecruiterTaskAction } from "@/app/actions/recruiter-ops";
import { createRoleFromLeadAndMatchAction } from "@/app/actions/recruiter-hiring";
import styles from "../crm.module.css";
import { ClientEngagementPanel } from "@/components/client-engagement-panel";
import { clientReplyStatusLabel, type ClientReplyStateRow } from "@/lib/client-reply-state";

type Lead = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  service: string | null;
  hours: string | null;
  budget: string | null;
  timezone: string | null;
  start_time: string | null;
  message: string | null;
  source_page: string | null;
  page_url: string | null;
  client_id: string | null;
  job_id: string | null;
  crm_company_id: string | null;
  crm_contact_id: string | null;
  crm_stage: string | null;
  owner_id: string | null;
  next_follow_up_at: string | null;
  estimated_value_usd: number | null;
  lost_reason: string | null;
  first_contact_at: string | null;
  last_contact_at: string | null;
  stage_updated_at: string | null;
  discovery_scheduled_at: string | null;
  discovery_duration_minutes: number | null;
  discovery_meeting_url: string | null;
  discovery_calendar_event_id: string | null;
  discovery_completed_at: string | null;
  discovery_cancelled_at: string | null;
  discovery_outcome: string | null;
  discovery_notes: string | null;
  created_at: string;
};

type Job = {
  id: string;
  title: string | null;
  company_name: string | null;
  status: string | null;
  hiring_stage: string | null;
  hours_per_week: number | null;
  min_hourly_rate: number | null;
  max_hourly_rate: number | null;
  timezone: string | null;
};

type Owner = { id: string; full_name: string | null; role: string | null };
type Activity = { id: string; action: string; description: string | null; created_at: string };
type Note = { id: string; note: string; created_at: string };
type Task = { id: string; title: string; description: string | null; priority: string; status: string; due_at: string | null };
type CustomField = { id:string; label:string; field_type:string; options:unknown };
type CustomValue = { field_id:string; value:unknown };
type EmailEvent = { id:string; event_type:string; status:string; automation:string|null; error_message:string|null; created_at:string };
type Proposal = { id:string; status:string; role_title:string|null; created_at:string; sent_at:string|null; viewed_at:string|null; accepted_at:string|null; declined_at:string|null; changes_requested_at:string|null; decline_reason:string|null };
type Shortlist = { id:string; va_id:string; shortlist_status:string; released_at:string|null; created_at:string; client_decision:string|null; client_decision_note:string|null; client_decision_at:string|null };
type Interview = { id:string; va_id:string; status:string; created_at:string; scheduled_at:string|null; completed_at:string|null; cancelled_at:string|null; rescheduled_at:string|null; client_decision:string|null };
type Offer = { id:string; va_id:string; status:string; created_at:string; va_accepted_at:string|null; client_confirmed_at:string|null; declined_at:string|null; start_date:string|null };
type Workroom = { id:string; va_id:string; status:string; placement_stage:string|null; created_at:string; placement_stage_entered_at:string|null; handoff_completed_at:string|null; ended_at:string|null };
type TimelineEvent = { id:string; at:string; kind:string; title:string; detail?:string|null };
type DiscoveryBrief = {
  current_pain: string | null;
  why_now: string | null;
  ownership_needed: string | null;
  success_90_days: string | null;
  decision_process: string | null;
  failure_risks: string | null;
  additional_notes: string | null;
  next_step: string | null;
  recommended_role: string | null;
  recommended_hours: number | null;
  recommended_salary_min: number | null;
  recommended_salary_max: number | null;
  salary_currency: string | null;
  recommended_start_date: string | null;
  qualification_status: string | null;
  updated_at: string | null;
};

function fmt(value?: string | null, withTime = false) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    ...(withTime ? { timeStyle: "short" as const } : {}),
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}

function stageClass(stage?: string | null) {
  const value = String(stage || "new").replace(/[^a-z0-9_-]/gi, "");
  return `${styles.stage} ${styles[`stage_${value}`] || ""}`;
}

function leadAge(createdAt: string) {
  const ms = Math.max(0, Date.now() - new Date(createdAt).getTime());
  const hours = Math.floor(ms / 3600000);
  if (hours < 1) return "Less than 1 hour";
  if (hours < 48) return `${hours} hours`;
  return `${Math.floor(hours / 24)} days`;
}

function describeTimeZone(value?: string | null) {
  if (!isValidTimeZone(value)) return null;
  const timeZone = String(value);
  const city = (timeZone.split("/").pop() || timeZone).replaceAll("_", " ");
  const localTime = new Intl.DateTimeFormat("en-AU", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(new Date());
  const zoneName = new Intl.DateTimeFormat("en-AU", {
    hour: "numeric",
    timeZone,
    timeZoneName: "short",
  }).formatToParts(new Date()).find((part) => part.type === "timeZoneName")?.value || "";
  return { timeZone, city, localTime, zoneName };
}

function known(value?: string | null) {
  const clean = String(value || "").trim().toLowerCase();
  return Boolean(clean && clean !== "not sure yet" && !clean.startsWith("to confirm"));
}

function activityTitle(action: string) {
  const labels: Record<string, string> = {
    client_contact_email: "Client email logged",
    client_contact_call: "Client call logged",
    client_contact_meeting: "Client meeting logged",
    client_contact_follow_up: "Follow-up logged",
    client_followup_sent: "Client follow-up sent",
    client_chat_message: "Client chat message",
    note_added: "Private note added",
  };
  if (labels[action]) return labels[action];
  if (action.startsWith("lead_stage_")) return `Stage changed to ${action.replace("lead_stage_", "").replaceAll("_", " ")}`;
  return action.replaceAll("_", " ");
}

export default async function RecruiterCrmRecordPage({ params, searchParams }: { params: Promise<{ leadId: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { leadId } = await params;
  const query = await searchParams;
  const { userId } = await requireRoleFast("recruiter");
  const admin = createAdminClient();

  const { data: leadData, error: leadError } = await admin
    .from("lead_intake")
    .select("id,name,email,phone,company,service,hours,budget,timezone,start_time,message,source_page,page_url,client_id,job_id,crm_company_id,crm_contact_id,crm_stage,owner_id,next_follow_up_at,estimated_value_usd,lost_reason,first_contact_at,last_contact_at,stage_updated_at,discovery_scheduled_at,discovery_duration_minutes,discovery_meeting_url,discovery_calendar_event_id,discovery_completed_at,discovery_cancelled_at,discovery_outcome,discovery_notes,created_at,lead_type")
    .eq("id", leadId)
    .eq("lead_type", "client_hiring")
    .maybeSingle();
  if (leadError) throw leadError;
  if (!leadData) notFound();
  const lead = leadData as Lead;

  const [jobResult, ownersResult, activityResult, notesResult, tasksResult, customFieldsResult, customValuesResult, emailResult, proposalResult, shortlistResult, interviewResult, offerResult, workroomResult, replyStateResult, discoveryBriefResult] = await Promise.all([
    lead.job_id
      ? admin.from("jobs").select("id,title,company_name,status,hiring_stage,hours_per_week,min_hourly_rate,max_hourly_rate,timezone").eq("id", lead.job_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    admin.from("profiles").select("id,full_name,role,account_status").in("role", ["recruiter", "admin"]).eq("account_status", "active").order("full_name"),
    admin.from("recruiter_activity").select("id,action,description,created_at").eq("subject_type", "lead").eq("subject_id", leadId).order("created_at", { ascending: false }).limit(80),
    admin.from("recruiter_notes").select("id,note,created_at").eq("subject_type", "lead").eq("subject_id", leadId).order("created_at", { ascending: false }).limit(20),
    admin.from("recruiter_tasks").select("id,title,description,priority,status,due_at").eq("subject_type", "lead").eq("subject_id", leadId).eq("assignee_id", userId).order("created_at", { ascending: false }).limit(20),
    admin.from("crm_custom_fields").select("id,label,field_type,options").eq("object_type","lead").order("created_at",{ascending:true}),
    admin.from("crm_custom_values").select("field_id,value").eq("object_type","lead").eq("object_id",leadId),
    lead.email
      ? admin.from("outbound_email_events").select("id,event_type,status,automation,error_message,created_at").ilike("recipient", `%${lead.email}%`).order("created_at",{ascending:false}).limit(40)
      : Promise.resolve({data:[],error:null}),
    admin.from("lead_proposals").select("id,status,role_title,created_at,sent_at,viewed_at,accepted_at,declined_at,changes_requested_at,decline_reason").eq("lead_id",leadId).order("created_at",{ascending:false}).limit(20),
    lead.job_id
      ? admin.from("job_shortlist_candidates").select("id,va_id,shortlist_status,released_at,created_at,client_decision,client_decision_note,client_decision_at").eq("job_id",lead.job_id).order("created_at",{ascending:false}).limit(50)
      : Promise.resolve({data:[],error:null}),
    lead.job_id
      ? admin.from("candidate_interviews").select("id,va_id,status,created_at,scheduled_at,completed_at,cancelled_at,rescheduled_at,client_decision").eq("job_id",lead.job_id).order("created_at",{ascending:false}).limit(30)
      : Promise.resolve({data:[],error:null}),
    lead.job_id
      ? admin.from("placement_offers").select("id,va_id,status,created_at,va_accepted_at,client_confirmed_at,declined_at,start_date").eq("job_id",lead.job_id).order("created_at",{ascending:false}).limit(30)
      : Promise.resolve({data:[],error:null}),
    lead.job_id
      ? admin.from("workrooms").select("id,va_id,status,placement_stage,created_at,placement_stage_entered_at,handoff_completed_at,ended_at").eq("job_id",lead.job_id).order("created_at",{ascending:false}).limit(20)
      : Promise.resolve({data:[],error:null}),
    admin.from("recruiter_client_reply_state")
      .select("lead_id,owner_id,job_id,name,company,crm_stage,last_client_reply_at,last_recruiter_response_at,last_recruiter_response_action,reply_status")
      .eq("lead_id", leadId)
      .maybeSingle(),
    admin.from("lead_discovery_briefs")
      .select("current_pain,why_now,ownership_needed,success_90_days,decision_process,failure_risks,additional_notes,next_step,recommended_role,recommended_hours,recommended_salary_min,recommended_salary_max,salary_currency,recommended_start_date,qualification_status,updated_at")
      .eq("lead_id", leadId)
      .maybeSingle(),
  ]);
  for (const result of [jobResult, ownersResult, activityResult, notesResult, tasksResult, customFieldsResult, customValuesResult, emailResult, proposalResult, shortlistResult, interviewResult, offerResult, workroomResult, replyStateResult, discoveryBriefResult]) {
    if (result.error) throw result.error;
  }

  const job = jobResult.data as Job | null;
  const clientTimeZone = isValidTimeZone(lead.timezone)
    ? String(lead.timezone)
    : isValidTimeZone(job?.timezone)
      ? String(job?.timezone)
      : "";
  const clientTimeZoneDetails = describeTimeZone(clientTimeZone);
  const owners = (ownersResult.data || []) as Owner[];
  const activities = (activityResult.data || []) as Activity[];
  const notes = (notesResult.data || []) as Note[];
  const tasks = (tasksResult.data || []) as Task[];
  const customFields = (customFieldsResult.data || []) as CustomField[];
  const customValueMap = new Map(((customValuesResult.data || []) as CustomValue[]).map(item=>[item.field_id,item.value]));
  const emailEvents = (emailResult.data || []) as EmailEvent[];
  const proposals = (proposalResult.data || []) as Proposal[];
  const latestProposal = proposals[0] || null;
  const proposalPipelineStatus = latestProposal
    ? latestProposal.status === "accepted"
      ? "Accepted"
      : latestProposal.status === "changes_requested"
        ? "Changes requested"
        : latestProposal.status === "declined"
          ? "Lost"
          : latestProposal.status === "sent" && latestProposal.viewed_at
            ? "Viewed"
            : latestProposal.status === "sent"
              ? "Sent"
              : "Draft"
    : null;
  const shortlists = (shortlistResult.data || []) as Shortlist[];
  const interviews = (interviewResult.data || []) as Interview[];
  const offers = (offerResult.data || []) as Offer[];
  const workrooms = (workroomResult.data || []) as Workroom[];
  const replyState = replyStateResult.data as ClientReplyStateRow | null;
  const discoveryBrief = discoveryBriefResult.data as DiscoveryBrief | null;

  const { data: engagementRows, error: engagementError } = await admin
    .rpc("recruiter_client_activity_snapshot", { lead_ids: [leadId] });
  if (engagementError) throw engagementError;
  const engagement = (engagementRows || [])[0] as {
    last_login_at?: string | null;
    last_va_view_at?: string | null;
    va_views?: number | null;
    shortlist_opened_at?: string | null;
    last_shortlist_activity_at?: string | null;
    latest_decision?: string | null;
    latest_decision_at?: string | null;
    last_client_reply_at?: string | null;
    last_client_chat_at?: string | null;
    last_client_contact_at?: string | null;
    unread_chat?: number | null;
  } | undefined;

  const clientLastLoginAt = engagement?.last_login_at || null;
  const candidateViewCount = Number(engagement?.va_views || 0);
  const lastCandidateViewAt = engagement?.last_va_view_at || null;
  const shortlistOpenedAt = engagement?.shortlist_opened_at || null;
  const snapshotShortlistActivityAt = engagement?.last_shortlist_activity_at || null;
  const lastClientReplyAt = engagement?.last_client_contact_at || replyState?.last_client_reply_at || null;
  const replyStatus = String(replyState?.reply_status || (lead.first_contact_at ? "awaiting_reply" : "not_contacted"));
  const replyStatusLabel = clientReplyStatusLabel(replyStatus);

  const vaIds = [...new Set([
    ...shortlists.map(item=>item.va_id),
    ...interviews.map(item=>item.va_id),
    ...offers.map(item=>item.va_id),
    ...workrooms.map(item=>item.va_id),
  ].filter(Boolean))];
  const { data: vaRows, error: vaError } = vaIds.length
    ? await admin.from("profiles").select("id,full_name").in("id",vaIds)
    : { data: [] as {id:string;full_name:string|null}[], error: null };
  if (vaError) throw vaError;
  const vaName = new Map((vaRows || []).map(item=>[item.id,item.full_name || "Candidate"]));
  const candidateLabel = (id:string) => vaName.get(id) || "Candidate";

  const timeline: TimelineEvent[] = [];
  const pushEvent = (event: TimelineEvent | null) => { if (event?.at) timeline.push(event); };

  pushEvent({ id:"lead-created", at:lead.created_at, kind:"lead", title:"Hiring enquiry received", detail:lead.service || lead.company || null });
  for (const item of activities) {
    if (item.action === "note_added") continue;
    pushEvent({ id:`activity-${item.id}`, at:item.created_at, kind:"activity", title:activityTitle(item.action), detail:item.description });
  }
  for (const item of emailEvents) {
    pushEvent({
      id:`email-${item.id}`,
      at:item.created_at,
      kind:"email",
      title:`Email ${item.status}`,
      detail:item.error_message || (item.automation ? item.automation.replaceAll("_"," ") : item.event_type.replaceAll("_"," ")),
    });
  }
  if (lead.discovery_scheduled_at) {
    pushEvent({ id:"discovery-scheduled", at:lead.discovery_scheduled_at, kind:"calendar", title:"Discovery scheduled", detail:`${lead.discovery_duration_minutes || 30} minutes${lead.discovery_meeting_url ? " · meeting link ready" : ""}` });
  }
  if (lead.discovery_completed_at) {
    pushEvent({ id:"discovery-completed", at:lead.discovery_completed_at, kind:"calendar", title:"Discovery completed", detail:lead.discovery_outcome || lead.discovery_notes || null });
  }
  if (lead.discovery_cancelled_at) {
    pushEvent({ id:"discovery-cancelled", at:lead.discovery_cancelled_at, kind:"calendar", title:"Discovery cancelled", detail:lead.discovery_notes || null });
  }

  for (const proposal of proposals) {
    pushEvent({ id:`proposal-created-${proposal.id}`, at:proposal.created_at, kind:"proposal", title:"Proposal created", detail:proposal.role_title });
    if (proposal.sent_at) pushEvent({ id:`proposal-sent-${proposal.id}`, at:proposal.sent_at, kind:"proposal", title:"Proposal sent", detail:proposal.role_title });
    if (proposal.viewed_at) pushEvent({ id:`proposal-viewed-${proposal.id}`, at:proposal.viewed_at, kind:"proposal", title:"Client viewed proposal", detail:proposal.role_title });
    if (proposal.changes_requested_at) pushEvent({ id:`proposal-changes-${proposal.id}`, at:proposal.changes_requested_at, kind:"proposal", title:"Client requested proposal changes", detail:proposal.role_title });
    if (proposal.accepted_at) pushEvent({ id:`proposal-accepted-${proposal.id}`, at:proposal.accepted_at, kind:"proposal", title:"Proposal accepted", detail:proposal.role_title });
    if (proposal.declined_at) pushEvent({ id:`proposal-declined-${proposal.id}`, at:proposal.declined_at, kind:"proposal", title:"Proposal declined", detail:proposal.decline_reason || proposal.role_title });
  }

  for (const item of shortlists) {
    if (item.released_at) pushEvent({ id:`shortlist-release-${item.id}`, at:item.released_at, kind:"shortlist", title:"Candidate released to client", detail:candidateLabel(item.va_id) });
    if (item.client_decision_at) pushEvent({ id:`shortlist-decision-${item.id}`, at:item.client_decision_at, kind:"shortlist", title:`Client shortlist decision: ${String(item.client_decision || "updated").replaceAll("_"," ")}`, detail:`${candidateLabel(item.va_id)}${item.client_decision_note ? ` · ${item.client_decision_note}` : ""}` });
  }

  for (const item of interviews) {
    pushEvent({ id:`interview-created-${item.id}`, at:item.created_at, kind:"interview", title:"Interview requested", detail:candidateLabel(item.va_id) });
    if (item.scheduled_at) pushEvent({ id:`interview-scheduled-${item.id}`, at:item.scheduled_at, kind:"interview", title:"Interview scheduled", detail:candidateLabel(item.va_id) });
    if (item.completed_at) pushEvent({ id:`interview-completed-${item.id}`, at:item.completed_at, kind:"interview", title:"Interview completed", detail:`${candidateLabel(item.va_id)}${item.client_decision ? ` · ${item.client_decision}` : ""}` });
    if (item.rescheduled_at) pushEvent({ id:`interview-rescheduled-${item.id}`, at:item.rescheduled_at, kind:"interview", title:"Interview rescheduled", detail:candidateLabel(item.va_id) });
    if (item.cancelled_at) pushEvent({ id:`interview-cancelled-${item.id}`, at:item.cancelled_at, kind:"interview", title:"Interview cancelled", detail:candidateLabel(item.va_id) });
  }

  for (const item of offers) {
    pushEvent({ id:`offer-created-${item.id}`, at:item.created_at, kind:"offer", title:"Placement offer created", detail:candidateLabel(item.va_id) });
    if (item.va_accepted_at) pushEvent({ id:`offer-va-${item.id}`, at:item.va_accepted_at, kind:"offer", title:"VA accepted offer", detail:candidateLabel(item.va_id) });
    if (item.client_confirmed_at) pushEvent({ id:`offer-client-${item.id}`, at:item.client_confirmed_at, kind:"offer", title:"Client confirmed offer", detail:candidateLabel(item.va_id) });
    if (item.declined_at) pushEvent({ id:`offer-declined-${item.id}`, at:item.declined_at, kind:"offer", title:"Offer declined", detail:candidateLabel(item.va_id) });
  }

  for (const item of workrooms) {
    pushEvent({ id:`workroom-created-${item.id}`, at:item.created_at, kind:"placement", title:"Placement workspace created", detail:`${candidateLabel(item.va_id)} · ${item.status}` });
    if (item.placement_stage_entered_at) pushEvent({ id:`placement-stage-${item.id}`, at:item.placement_stage_entered_at, kind:"placement", title:`Placement stage: ${String(item.placement_stage || item.status).replaceAll("_"," ")}`, detail:candidateLabel(item.va_id) });
    if (item.handoff_completed_at) pushEvent({ id:`handoff-${item.id}`, at:item.handoff_completed_at, kind:"placement", title:"Recruiter handoff completed", detail:candidateLabel(item.va_id) });
    if (item.ended_at) pushEvent({ id:`placement-ended-${item.id}`, at:item.ended_at, kind:"placement", title:"Placement ended", detail:candidateLabel(item.va_id) });
  }

  timeline.sort((a,b)=>new Date(b.at).getTime()-new Date(a.at).getTime());
  const returnTo = `/workspace/recruiter/crm/${lead.id}`;
  const initial = (lead.name || lead.company || lead.email || "?").slice(0, 1).toUpperCase();
  const stage = String(lead.crm_stage || "new");
  const quickStages: Record<string,{value:string;label:string}[]> = {
    new:[{value:"contacted",label:"Mark contacted"}],
    contacted:[{value:"qualified",label:"Mark qualified"},{value:"nurture",label:"Move to nurture"}],
    discovery_booked:[{value:"qualified",label:"Mark qualified"},{value:"nurture",label:"Move to nurture"}],
    qualified:[{value:"nurture",label:"Move to nurture"}],
    terms_sent:[{value:"nurture",label:"Move to nurture"}],
    shortlist_sent:[{value:"won",label:"Mark won"},{value:"nurture",label:"Move to nurture"}],
    nurture:[{value:"contacted",label:"Reopen as contacted"}],
  };
  const hasReleasedShortlist = shortlists.some((item) => Boolean(item.released_at) || item.shortlist_status === "released");
  const hasInterview = interviews.length > 0;
  const hasOffer = offers.length > 0;
  const hasHire = workrooms.length > 0 || job?.status === "filled";
  const workflowSteps = ["Enquiry", "Discovery", "Proposal", "Shortlist", "Interview", "Offer", "Hire"] as const;
  const workflowIndex = hasHire ? 6
    : hasOffer ? 5
      : hasInterview ? 4
        : hasReleasedShortlist ? 3
          : latestProposal ? 2
            : (lead.discovery_scheduled_at || lead.discovery_completed_at) ? 1
              : 0;

  const latestDecision = shortlists
    .filter((item) => item.client_decision_at)
    .sort((x,y) => new Date(y.client_decision_at || 0).getTime() - new Date(x.client_decision_at || 0).getTime())[0] || null;
  const shortlistActivityTimes = [snapshotShortlistActivityAt, shortlistOpenedAt, latestDecision?.client_decision_at || null].filter(Boolean) as string[];
  const lastShortlistActivityAt = shortlistActivityTimes.length
    ? shortlistActivityTimes.sort((x,y) => new Date(y).getTime() - new Date(x).getTime())[0]
    : null;
  const decisionSummary = latestDecision?.client_decision
    ? `${String(latestDecision.client_decision).replaceAll("_", " ")} · ${fmt(latestDecision.client_decision_at, true)}`
    : "No decision yet";
  const interviewRequested = shortlists.some((item) => item.client_decision === "interview");
  const clientDecisionReceived = shortlists.some((item) => Boolean(item.client_decision_at));
  const openInterview = interviews.some((item) => !["cancelled", "completed"].includes(item.status));
  const resolvedRole = discoveryBrief?.recommended_role || job?.title || lead.service || "—";
  const resolvedHours = discoveryBrief?.recommended_hours
    ? `${discoveryBrief.recommended_hours}/week`
    : lead.hours || (job?.hours_per_week ? `${job.hours_per_week}/week` : "—");
  const resolvedBudget = discoveryBrief?.recommended_salary_min || discoveryBrief?.recommended_salary_max
    ? `${discoveryBrief.salary_currency || "PHP"} ${discoveryBrief.recommended_salary_min ?? "—"}${discoveryBrief.recommended_salary_max ? `–${discoveryBrief.recommended_salary_max}` : ""}`
    : lead.budget || (job?.min_hourly_rate ? `${job.min_hourly_rate}–${job.max_hourly_rate || job.min_hourly_rate}/hr` : "—");
  const resolvedStart = discoveryBrief?.recommended_start_date || lead.start_time || "—";
  const callReadiness = [
    { label: "Business problem understood", complete: Boolean(discoveryBrief?.current_pain || lead.message), prompt: "Clarify the operational pain this hire must remove." },
    { label: "Why now captured", complete: Boolean(discoveryBrief?.why_now), prompt: "Ask what changed and why the hire matters now." },
    { label: "Responsibilities defined", complete: Boolean(discoveryBrief?.ownership_needed), prompt: "Define what the VA should fully own." },
    { label: "Hours known", complete: Boolean(discoveryBrief?.recommended_hours || known(lead.hours) || job?.hours_per_week), prompt: "Confirm weekly hours and working overlap." },
    { label: "Budget discussed", complete: known(lead.budget) || Boolean(discoveryBrief?.recommended_salary_min || discoveryBrief?.recommended_salary_max || job?.min_hourly_rate), prompt: "Confirm the working budget and commercial fit." },
    { label: "Start timeframe known", complete: known(lead.start_time) || Boolean(discoveryBrief?.recommended_start_date), prompt: "Confirm when the client wants the VA to start." },
    { label: "90-day success defined", complete: Boolean(discoveryBrief?.success_90_days), prompt: "Define what success should look like after 90 days." },
    { label: "Decision process known", complete: Boolean(discoveryBrief?.decision_process), prompt: "Confirm who decides, interview steps, and approval timing." },
  ];
  const missingCallItems = callReadiness.filter((item) => !item.complete);
  const completedCallItems = callReadiness.length - missingCallItems.length;

  const nowMs = Date.now();
  const isClosedLead = ["won", "lost"].includes(stage);
  const followUpAtMs = lead.next_follow_up_at ? new Date(lead.next_follow_up_at).getTime() : 0;
  const followUpOverdue = !isClosedLead && followUpAtMs > 0 && followUpAtMs <= nowMs;
  const proposalViewedWaiting = Boolean(
    latestProposal?.status === "sent"
      && latestProposal.viewed_at
      && nowMs - new Date(latestProposal.viewed_at).getTime() >= 24 * 3600000
  );
  const proposalUnopened = Boolean(
    latestProposal?.status === "sent"
      && !latestProposal.viewed_at
      && latestProposal.sent_at
      && nowMs - new Date(latestProposal.sent_at).getTime() >= 48 * 3600000
  );
  const outboundTouchTimes = [lead.last_contact_at, latestProposal?.sent_at || null, lead.discovery_completed_at]
    .filter(Boolean)
    .map((value) => new Date(String(value)).getTime())
    .filter(Number.isFinite);
  const lastOutboundAtMs = outboundTouchTimes.length ? Math.max(...outboundTouchTimes) : 0;
  const lastClientReplyAtMs = lastClientReplyAt ? new Date(lastClientReplyAt).getTime() : 0;
  const noResponseStall = Boolean(
    !isClosedLead
      && lastOutboundAtMs > 0
      && (!lastClientReplyAtMs || lastClientReplyAtMs < lastOutboundAtMs)
      && ["contacted", "qualified", "terms_sent"].includes(stage)
      && nowMs - lastOutboundAtMs >= 72 * 3600000
  );
  const discoveryOutcomeLabel = lead.discovery_outcome
    ? ({
        qualified: "Qualified",
        attended: "Attended · follow-up needed",
        no_show: "No-show",
        cancelled: "Cancelled",
        rescheduled: "Rescheduled",
      } as Record<string, string>)[lead.discovery_outcome] || String(lead.discovery_outcome).replaceAll("_", " ")
    : lead.discovery_completed_at
      ? "Completed"
      : "Not recorded";
  const closingRecovery = isClosedLead
    ? null
    : replyStatus === "needs_action"
      ? { label: "Client replied", detail: "Reply before doing more outreach.", href: "#client-followup", tone: "urgent" as const }
      : latestProposal?.status === "changes_requested"
        ? { label: "Changes requested", detail: "Revise the proposal while the client is engaged.", href: `/workspace/recruiter/crm/${lead.id}/proposal`, tone: "urgent" as const }
        : followUpOverdue
          ? { label: "Follow-up overdue", detail: "The scheduled follow-up date has passed. Send a specific next-step message now.", href: "#client-followup", tone: "urgent" as const }
          : proposalViewedWaiting
            ? { label: "Proposal viewed · no decision", detail: "The client viewed the terms more than 24 hours ago. Follow up on the decision.", href: "#client-followup", tone: "waiting" as const }
            : proposalUnopened
              ? { label: "Proposal unopened", detail: "The proposal has been sitting unopened for more than 48 hours. Confirm receipt.", href: "#client-followup", tone: "waiting" as const }
              : noResponseStall
                ? { label: "No response · 72h+", detail: "There has been no client response after the last outbound touch. Re-engage or move to nurture.", href: "#client-followup", tone: "waiting" as const }
                : { label: "On track", detail: "No stalled or overdue closing signal is active.", href: null, tone: "clear" as const };

  const nextAction = hasHire
    ? { label: "Close role", href: job ? `/workspace/recruiter/roles/${job.id}#overview` : returnTo, detail: "A placement exists. Close the role when no additional hiring is needed." }
    : hasOffer
      ? { label: "Review offer", href: job ? `/workspace/recruiter/roles/${job.id}#interviews` : returnTo, detail: "An offer is active. Keep the placement moving through acceptance and client confirmation." }
      : interviewRequested && !openInterview
        ? { label: "Schedule interview", href: job ? `/workspace/recruiter/roles/${job.id}#interviews` : returnTo, detail: "The client requested an interview. Schedule it before doing more sourcing." }
        : clientDecisionReceived
          ? { label: "Review decision", href: job ? `/workspace/recruiter/roles/${job.id}#client-handoff` : returnTo, detail: "The client has responded to the shortlist. Process that decision before sending more candidates." }
          : hasReleasedShortlist
            ? { label: "Follow up", href: lead.client_id ? `/workspace/recruiter/messages?client=${encodeURIComponent(lead.client_id)}${lead.job_id ? `&job=${encodeURIComponent(lead.job_id)}` : ""}` : returnTo, detail: "The shortlist is with the client. Follow up on a decision instead of adding more internal suggestions." }
            : latestProposal?.status === "accepted" && job
              ? { label: "Review matches", href: `/workspace/recruiter/matching/${job.id}`, detail: "The recommendation is accepted. Review the strongest matching VAs and prepare the shortlist." }
              : latestProposal?.status === "changes_requested"
                ? { label: "Revise proposal", href: `/workspace/recruiter/crm/${lead.id}/proposal`, detail: "The client requested changes. Update the recommendation and resend it without rebuilding the role." }
                : latestProposal?.status === "sent"
                  ? { label: "Follow up on proposal", href: `/workspace/recruiter/crm/${lead.id}/proposal`, detail: latestProposal.viewed_at ? "The client viewed the proposal but has not responded yet." : "The proposal is sent but has not been viewed yet." }
                  : latestProposal
                    ? { label: "Finish proposal", href: `/workspace/recruiter/crm/${lead.id}/proposal`, detail: "Review the generated recommendation, confirm the commercial terms, and send it to the client." }
                    : lead.discovery_completed_at
                      ? { label: "Generate recommendation", href: `/workspace/recruiter/crm/${lead.id}/discovery`, detail: "Discovery is complete. Turn the call into a client-ready recommendation before moving to shortlist." }
                      : { label: "Complete discovery", href: `/workspace/recruiter/crm/${lead.id}/discovery`, detail: "Diagnose the role and client outcome before preparing a recommendation." };

  return (
    <div className={styles.detailPage}>
      {query.crm_saved ? <div className="success-banner">CRM record updated.</div> : null}
      {query.crm_error ? <div className="alert" role="alert">{query.crm_error}</div> : null}
      {query.note_saved ? <div className="success-banner">Private note added.</div> : null}
      {query.task_saved ? <div className="success-banner">Task created.</div> : null}
      {query.task_error ? <div className="alert" role="alert">{query.task_error}</div> : null}
      {query.field_saved ? <div className="success-banner">Custom field created.</div> : null}
      {query.field_value_saved ? <div className="success-banner">Custom field updated.</div> : null}
      {query.field_error ? <div className="alert" role="alert">{query.field_error}</div> : null}
      {query.contact_sent ? <div className="success-banner">Client email sent.</div> : null}
      {query.contact_already_sent ? <div className="success-banner">That email was already sent. A duplicate was prevented.</div> : null}
      {query.contact_error ? <div className="alert" role="alert">{query.contact_error}</div> : null}
      {query.discovery_saved ? <div className="success-banner">Discovery booking saved.</div> : null}
      {query.meet_link_created ? <div className="success-banner">Google Meet created. No client email was sent.</div> : null}
      {query.discovery_completed ? <div className="success-banner">Discovery outcome saved.</div> : null}
      {query.discovery_cancelled ? <div className="success-banner">Discovery booking cancelled.</div> : null}
      {query.discovery_error ? <div className="alert" role="alert">{query.discovery_error}</div> : null}
      {query.closing_saved ? <div className="success-banner">Closing plan updated.</div> : null}
      {query.closing_error ? <div className="alert" role="alert">{query.closing_error}</div> : null}

      <Link className={styles.detailBack} href="/workspace/recruiter/crm"><ArrowLeft size={14}/> Back to clients</Link>

      <header className={styles.detailHeader}>
        <div className={styles.detailIdentity}>
          <span className={styles.detailAvatar}>{initial}</span>
          <div>
            <div className={stageClass(lead.crm_stage)}>{leadStageLabel(lead.crm_stage)}</div>
            <h1>{lead.name || lead.company || "Client lead"}</h1>
            <p>{lead.company || "No company"}{lead.service ? ` · ${lead.service}` : ""}</p>
          </div>
        </div>
        <div className={styles.headerActions}>
          {clientTimeZoneDetails ? (
            <span className={styles.clientLocalClock}>
              <Clock3 size={15}/>
              <span><strong>Client local time</strong><small>{clientTimeZoneDetails.city} · {clientTimeZoneDetails.localTime}{clientTimeZoneDetails.zoneName ? ` · ${clientTimeZoneDetails.zoneName}` : ""}</small></span>
            </span>
          ) : null}
          <Link className={styles.primaryButton} href={`/workspace/recruiter/crm/${lead.id}/discovery`}><ClipboardList size={15}/> Discovery workspace</Link>
          {lead.client_id ? <Link className={styles.secondaryButton} href={`/workspace/recruiter/messages?client=${encodeURIComponent(lead.client_id)}${lead.job_id ? `&job=${encodeURIComponent(lead.job_id)}` : ""}`}><MessageSquareText size={15}/> Message client</Link> : null}
          {job ? <Link className={styles.secondaryButton} href={`/workspace/recruiter/roles/${job.id}`}><BriefcaseBusiness size={15}/> Open linked role</Link> : <form action={createRoleFromLeadAndMatchAction}><input type="hidden" name="lead_id" value={lead.id}/><input type="hidden" name="return_to" value={`/workspace/recruiter/crm/${lead.id}`}/><button className={styles.secondaryButton} type="submit"><BriefcaseBusiness size={15}/> Create role & open matching</button></form>}
        </div>
      </header>

      <nav className={styles.workflow} aria-label="Hiring workflow">
        {workflowSteps.map((label,index)=><span key={label} className={index < workflowIndex ? styles.workflowDone : index === workflowIndex ? styles.workflowCurrent : undefined}><i>{index < workflowIndex ? "✓" : index + 1}</i><em>{label}</em></span>)}
      </nav>

      <section className={styles.closingBrief}>
        <div className={styles.closingBriefHead}>
          <div>
            <span className={styles.kicker}>Pre-call / closing brief</span>
            <h2>Know the client before the conversation starts.</h2>
            <p>Use this as the closer&apos;s one-screen briefing. Missing discovery answers are called out before they become proposal or follow-up problems.</p>
          </div>
          <div className={styles.closingBriefActions}>
            <span className={missingCallItems.length ? styles.closingProgressOpen : styles.closingProgressReady}>
              {completedCallItems}/{callReadiness.length} known
            </span>
            <Link className={styles.primaryButton} href={`/workspace/recruiter/crm/${lead.id}/discovery`}>
              <ClipboardList size={15}/> Open discovery
            </Link>
          </div>
        </div>

        <div className={styles.closingFactGrid}>
          <div><span>Company</span><strong>{lead.company || job?.company_name || "—"}</strong></div>
          <div><span>Role / need</span><strong>{resolvedRole}</strong></div>
          <div><span>Hours</span><strong>{resolvedHours}</strong></div>
          <div><span>Budget</span><strong>{resolvedBudget}</strong></div>
          <div>
            <span>Timezone</span>
            <strong>{clientTimeZoneDetails ? `${clientTimeZoneDetails.city}${clientTimeZoneDetails.zoneName ? ` · ${clientTimeZoneDetails.zoneName}` : ""}` : "Not detected"}</strong>
            {clientTimeZoneDetails ? <small>{clientTimeZoneDetails.localTime} local · {clientTimeZoneDetails.timeZone}</small> : null}
          </div>
          <div><span>Preferred start</span><strong>{resolvedStart}</strong></div>
          <div><span>Source</span><strong>{String(lead.source_page || "Direct").replaceAll("_", " ")}</strong></div>
          <div><span>Lead age</span><strong>{leadAge(lead.created_at)}</strong></div>
        </div>

        <div className={styles.closingBriefBody}>
          <div className={styles.closingNeed}>
            <span>Original hiring need</span>
            <p>{discoveryBrief?.current_pain || lead.message || "No detailed workload was supplied yet."}</p>
          </div>
          <div className={styles.closingChecklist}>
            <div className={styles.closingChecklistHead}>
              <div>
                <span>What we need to learn</span>
                <strong>{missingCallItems.length ? `${missingCallItems.length} item${missingCallItems.length === 1 ? "" : "s"} still unclear` : "Discovery inputs complete"}</strong>
              </div>
              {discoveryBrief?.updated_at ? <small>Updated {fmt(discoveryBrief.updated_at, true)}</small> : <small>Not yet saved in Discovery</small>}
            </div>
            <div className={styles.closingChecklistItems}>
              {(missingCallItems.length ? missingCallItems : callReadiness).map((item) => (
                <div key={item.label} className={item.complete ? styles.closingChecklistComplete : styles.closingChecklistMissing}>
                  <span aria-hidden="true">{item.complete ? "✓" : "?"}</span>
                  <div><strong>{item.label}</strong><small>{item.complete ? "Captured" : item.prompt}</small></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.closingControl}>
        <div className={styles.closingControlHead}>
          <div>
            <span className={styles.kicker}>Closing workflow</span>
            <h2>Call outcome → objections → terms → follow-up → recovery.</h2>
            <p>Keep the closer&apos;s next move explicit. This uses the existing discovery brief, proposal state, and CRM follow-up date.</p>
          </div>
          {closingRecovery ? (
            <div className={closingRecovery.tone === "urgent" ? styles.recoveryUrgent : closingRecovery.tone === "waiting" ? styles.recoveryWaiting : styles.recoveryClear}>
              <strong>{closingRecovery.label}</strong>
              <span>{closingRecovery.detail}</span>
              {closingRecovery.href ? <a href={closingRecovery.href}>Take action</a> : null}
            </div>
          ) : null}
        </div>

        <div className={styles.closingFlow}>
          <div>
            <span>1 · Call outcome</span>
            <strong>{discoveryOutcomeLabel}</strong>
            <small>{lead.discovery_completed_at ? fmt(lead.discovery_completed_at, true) : "Complete Discovery to record the outcome."}</small>
          </div>
          <div>
            <span>2 · Objections / risks</span>
            <strong>{discoveryBrief?.failure_risks ? "Captured" : "None captured"}</strong>
            <small>{discoveryBrief?.failure_risks || "Record the real reason the client may not move forward."}</small>
          </div>
          <div>
            <span>3 · Proposal / terms</span>
            <strong>{proposalPipelineStatus || "Not prepared"}</strong>
            <small>{latestProposal?.viewed_at ? `Viewed ${fmt(latestProposal.viewed_at, true)}` : latestProposal?.sent_at ? `Sent ${fmt(latestProposal.sent_at, true)}` : "Generate the recommendation after discovery."}</small>
          </div>
          <div>
            <span>4 · Next follow-up</span>
            <strong>{lead.next_follow_up_at
              ? clientTimeZone
                ? formatDateTimeInTimeZone(lead.next_follow_up_at, clientTimeZone)
                : fmt(lead.next_follow_up_at, true)
              : "Not scheduled"}</strong>
            <small>{followUpOverdue ? "Overdue · recover now" : lead.next_follow_up_at ? clientTimeZoneDetails ? `${clientTimeZoneDetails.city} local time` : "Scheduled in CRM" : "Set the next decision point."}</small>
          </div>
          <div>
            <span>5 · Recovery</span>
            <strong>{closingRecovery?.label || "Closed"}</strong>
            <small>{closingRecovery?.detail || "No recovery action needed."}</small>
          </div>
        </div>

        {!isClosedLead ? (
          <form action={saveCrmClosingControlAction} className={styles.closingControlForm}>
            <input type="hidden" name="lead_id" value={lead.id}/>
            <input type="hidden" name="return_to" value={returnTo}/>
            <label className={styles.closingWide}>Objections / risks
              <textarea name="failure_risks" maxLength={5000} defaultValue={discoveryBrief?.failure_risks || ""} placeholder="Budget concern, timing, trust, scope uncertainty, wants to compare providers, internal approval…"/>
            </label>
            <label className={styles.closingWide}>Closing notes
              <textarea name="additional_notes" maxLength={5000} defaultValue={discoveryBrief?.additional_notes || ""} placeholder="Decision-maker context, agreed next step, terms discussed, what would unblock the client…"/>
            </label>
            <label>Next move
              <select name="closing_next_step" defaultValue={discoveryBrief?.next_step || (latestProposal ? "follow_up" : lead.discovery_completed_at ? "proposal" : "follow_up")}>
                <option value="proposal">Prepare / revise proposal</option>
                <option value="qualified">Ready to proceed</option>
                <option value="follow_up">Follow up</option>
                <option value="nurture">Nurture</option>
              </select>
            </label>
            <label>Next follow-up date
              <input
                type="date"
                name="next_follow_up_at"
                defaultValue={clientTimeZone
                  ? dateTimeInputValueInTimeZone(lead.next_follow_up_at, clientTimeZone).slice(0, 10)
                  : dateInput(lead.next_follow_up_at)}
              />
              <small className={styles.followUpTimeZoneHint}>
                {clientTimeZoneDetails
                  ? `Schedules for 9:00 AM in ${clientTimeZoneDetails.city}${clientTimeZoneDetails.zoneName ? ` (${clientTimeZoneDetails.zoneName})` : ""}.`
                  : "Timezone not detected. Schedules for 9:00 AM Manila time."}
              </small>
            </label>
            <div className={styles.closingFormActions}>
              <button type="submit">Save closing plan</button>
              <button type="submit" name="quick_followup_days" value="2" className={styles.secondaryFormButton}>Follow up +2 days</button>
              <button type="submit" name="quick_followup_days" value="7" className={styles.secondaryFormButton}>+7 days</button>
              <button type="submit" name="quick_followup_days" value="14" className={styles.secondaryFormButton}>Nurture +14 days</button>
            </div>
          </form>
        ) : (
          <div className={styles.closingClosed}>This lead is closed. Follow-up scheduling is disabled.</div>
        )}
      </section>

      <ClientEngagementPanel
        linked={Boolean(lead.client_id)}
        lastLogin={clientLastLoginAt ? fmt(clientLastLoginAt, true) : "Never / not linked"}
        lastVaView={lastCandidateViewAt ? fmt(lastCandidateViewAt, true) : "No tracked view"}
        vaViews={candidateViewCount}
        shortlistOpened={shortlistOpenedAt ? fmt(shortlistOpenedAt, true) : "Not tracked yet"}
        shortlistActivity={lastShortlistActivityAt ? fmt(lastShortlistActivityAt, true) : "No activity yet"}
        decision={decisionSummary}
        lastClientReply={lastClientReplyAt ? fmt(lastClientReplyAt, true) : "No email or chat reply logged"}
        replyStatus={replyStatusLabel}
      />

      <section className={styles.actionCenter}>
        <div className={styles.actionCenterHead}>
          <div>
            <span className={styles.kicker}>Next step</span>
            <h2>Move this hire forward</h2>
            <p>{nextAction.detail}</p>
          </div>
          <div className={styles.headerActions}>
            <Link className={styles.primaryButton} href={nextAction.href}><ArrowRight size={15}/> {nextAction.label}</Link>
          </div>
          <div className={styles.actionStatus}>
            <span className={replyStatus === "needs_action" ? styles.statusReplyNeedsAction : replyStatus === "awaiting_reply" ? styles.statusReplyWaiting : replyStatus === "handled" ? styles.statusReplyHandled : styles.statusNeutral}>{replyStatusLabel}</span>
            <span className={lead.client_id ? styles.statusGood : styles.statusNeutral}>{lead.client_id ? "Client account active" : "Client account not activated"}</span>
            <span>{lead.next_follow_up_at ? `Follow-up ${fmt(lead.next_follow_up_at)}` : "No follow-up scheduled"}</span>
          </div>
        </div>

        <div className={styles.actionLinks}>
          <Link href={`/workspace/recruiter/crm/${lead.id}/discovery`}><ClipboardList size={14}/> Discovery</Link>
          <Link href={`/workspace/recruiter/crm/${lead.id}/proposal`}><FileText size={14}/> Proposal{proposalPipelineStatus ? ` · ${proposalPipelineStatus}` : ""}</Link>
          {lead.client_id ? <Link href={`/workspace/recruiter/messages?client=${encodeURIComponent(lead.client_id)}${lead.job_id ? `&job=${encodeURIComponent(lead.job_id)}` : ""}`}><MessageSquareText size={14}/> Chat</Link> : null}
          {job ? <Link href={`/workspace/recruiter/roles/${job.id}`}><BriefcaseBusiness size={14}/> Role</Link> : null}
          {job ? <Link href={`/workspace/recruiter/matching/${job.id}`}><UserRound size={14}/> Matching</Link> : null}
          {lead.discovery_meeting_url && !lead.discovery_completed_at && !lead.discovery_cancelled_at ? <a href={lead.discovery_meeting_url} target="_blank" rel="noreferrer"><CalendarDays size={14}/> Join discovery</a> : null}
        </div>

        <div className={styles.actionGrid}>
          <details id="client-followup" className={styles.actionCard} open={replyStatus === "needs_action" || followUpOverdue || proposalViewedWaiting || proposalUnopened || noResponseStall}>
            <summary><span className={styles.actionIcon}><Mail size={16}/></span><span><strong>{replyStatus === "needs_action" ? "Reply to client" : "Email client"}</strong><small>{replyStatus === "needs_action" ? "The client replied. Respond here or record the action you took." : "Only send when you need clarification or have a concrete update."}</small></span><ArrowRight size={15}/></summary>
            <form action={sendClientFollowupAction} className={styles.actionForm}>
              <input type="hidden" name="lead_id" value={lead.id}/>
              <input type="hidden" name="job_id" value={lead.job_id || ""}/>
              <input type="hidden" name="return_to" value={returnTo}/>
              <label>Subject<input name="subject" required minLength={3} maxLength={180} defaultValue={`About ${job?.title || lead.service || "your Virtual Assistant hiring request"}`}/></label>
              <label>Message<textarea name="message" required minLength={10} maxLength={5000} placeholder="Write the actual question or update the client needs. No generic second acknowledgement."/></label>
              <div className={styles.formHint}>This is a manual recruiter email. It is not sent automatically.</div>
              <button type="submit"><Send size={14}/> Send client email</button>
            </form>
          </details>

          <details className={styles.actionCard} open={stage === "contacted" && !lead.discovery_scheduled_at}>
            <summary><span className={styles.actionIcon}><CalendarPlus size={16}/></span><span><strong>{lead.discovery_scheduled_at && !lead.discovery_completed_at ? "Reschedule discovery" : "Book discovery"}</strong><small>{lead.discovery_scheduled_at && !lead.discovery_completed_at ? formatDateTimeInTimeZone(lead.discovery_scheduled_at, clientTimeZone) : "Create the meeting only when a call is actually needed."}</small></span><ArrowRight size={15}/></summary>
            <div className={styles.actionFormStack}>
              <form action={scheduleDiscoveryAction} className={styles.actionForm}>
                <input type="hidden" name="lead_id" value={lead.id}/>
                <input type="hidden" name="request_id" value={crypto.randomUUID()}/>
                <input type="hidden" name="return_to" value={returnTo}/>
                <label>Client timezone
                  <input
                    name="discovery_timezone"
                    required
                    defaultValue={clientTimeZone}
                    placeholder="e.g. Australia/Sydney or America/Chicago"
                  />
                  <span className={styles.formHint}>{clientTimeZone ? "The call time below is entered in this timezone." : "Confirm the client's timezone before scheduling."}</span>
                </label>
                <label>Date & time <span className={styles.muted}>(client local time)</span><input type="datetime-local" name="discovery_scheduled_at" required defaultValue={dateTimeInputValueInTimeZone(lead.discovery_scheduled_at, clientTimeZone)}/></label>
                <label>Duration<select name="discovery_duration_minutes" defaultValue={String(lead.discovery_duration_minutes || 30)}><option value="30">30 minutes</option><option value="45">45 minutes</option><option value="60">60 minutes</option></select></label>
                <label>Meeting link <span className={styles.muted}>(optional)</span><input type="url" name="discovery_meeting_url" defaultValue={lead.discovery_meeting_url || ""} placeholder="Leave blank to create Google Meet"/></label>
                <button type="submit"><CalendarPlus size={14}/> Save booking</button>
              </form>

              {lead.discovery_scheduled_at && !lead.discovery_completed_at && !lead.discovery_cancelled_at ? <div className={styles.actionSubsection}>
                {!lead.discovery_meeting_url ? <form action={createDiscoveryGoogleMeetLinkAction}>
                  <input type="hidden" name="lead_id" value={lead.id}/>
                  <input type="hidden" name="return_to" value={returnTo}/>
                  <button type="submit"><CalendarPlus size={14}/> Create Google Meet</button>
                </form> : null}
                <form action={completeDiscoveryAction} className={styles.actionForm}>
                  <input type="hidden" name="lead_id" value={lead.id}/>
                  <input type="hidden" name="return_to" value={returnTo}/>
                  <label>Outcome<select name="outcome" defaultValue="qualified"><option value="qualified">Attended and qualified</option><option value="attended">Attended, follow-up needed</option><option value="no_show">No-show</option><option value="rescheduled">Rescheduled</option><option value="nurture">Nurture</option><option value="lost">Lost</option></select></label>
                  <label>Discovery notes<textarea name="discovery_notes" required minLength={3} maxLength={5000} defaultValue={lead.discovery_notes || ""} placeholder="Priorities, tools, schedule, budget, decision process, next step…"/></label>
                  <label>Lost reason <span className={styles.muted}>(only if lost)</span><input name="lost_reason" maxLength={1000} placeholder="Budget, timing, hired elsewhere…"/></label>
                  <button type="submit">Complete discovery</button>
                </form>
                <div className={styles.quickStages}>
                  <form action={completeDiscoveryAction}>
                    <input type="hidden" name="lead_id" value={lead.id}/>
                    <input type="hidden" name="return_to" value={returnTo}/>
                    <input type="hidden" name="outcome" value="no_show"/>
                    <input type="hidden" name="discovery_notes" value={lead.discovery_notes || "Client did not attend the scheduled discovery call."}/>
                    <button type="submit">Mark no-show</button>
                  </form>
                  <form action={cancelRecruiterDiscoveryAction}>
                    <input type="hidden" name="lead_id" value={lead.id}/>
                    <input type="hidden" name="return_to" value={returnTo}/>
                    <button className={styles.textButton} type="submit">Cancel booking</button>
                  </form>
                </div>
              </div> : null}
              {lead.discovery_outcome === "no_show" ? <div className={styles.formHint}>Client missed the call. No automatic rebooking email is sent; keep the follow-up recruiter-led.</div> : null}
            </div>
          </details>

          <div className={styles.actionCardStatic}>
            <div className={styles.actionCardTitle}><span className={styles.actionIcon}><ArrowRight size={16}/></span><span><strong>Move stage</strong><small>Use the likely next step. Full stage control stays in Properties.</small></span></div>
            <div className={styles.quickStages}>
              {(quickStages[stage] || []).map(item=><form action={updateLeadCrmAction} key={item.value}>
                <input type="hidden" name="lead_id" value={lead.id}/>
                <input type="hidden" name="return_to" value={returnTo}/>
                <input type="hidden" name="owner_id" value={lead.owner_id || ""}/>
                <input type="hidden" name="next_follow_up_at" value={dateInput(lead.next_follow_up_at)}/>
                <input type="hidden" name="estimated_value_usd" value={lead.estimated_value_usd ?? ""}/>
                <input type="hidden" name="lost_reason" value={lead.lost_reason || ""}/>
                <button type="submit" name="crm_stage" value={item.value}>{item.label}</button>
              </form>)}
              {!(quickStages[stage] || []).length ? <span className={styles.muted}>No suggested transition from this stage.</span> : null}
            </div>
          </div>
        </div>
      </section>

      <div className={styles.detailGrid}>
        <div className="stack">
          <section className={styles.panel}>
            <div className={styles.panelHead}><h2>Hiring brief</h2><span className={styles.muted}>{fmt(lead.created_at, true)}</span></div>
            <div className={styles.panelBody}>
              <p className={styles.brief}>{lead.message || "No role brief was provided."}</p>
              <div className={styles.factGrid}>
                <div className={styles.fact}><span>Service</span><strong>{lead.service || "—"}</strong></div>
                <div className={styles.fact}><span>Hours</span><strong>{lead.hours || (job?.hours_per_week ? `${job.hours_per_week}/week` : "—")}</strong></div>
                <div className={styles.fact}><span>Budget</span><strong>{lead.budget || (job?.min_hourly_rate ? `$${job.min_hourly_rate}–$${job.max_hourly_rate || job.min_hourly_rate}/hr` : "—")}</strong></div>
                <div className={styles.fact}><span>Timezone</span><strong>{lead.timezone || job?.timezone || "—"}</strong></div>
                <div className={styles.fact}><span>Preferred start</span><strong>{lead.start_time || "—"}</strong></div>
                <div className={styles.fact}><span>Source</span><strong>{lead.source_page || "—"}</strong></div>
              </div>
            </div>
          </section>

          <details className={styles.panelDetails}>
            <summary><span><strong>Activity history</strong><small>{timeline.length} event{timeline.length===1?"":"s"} · newest first</small></span><ArrowRight size={15}/></summary>
            <div className={styles.panelBody}>
              {timeline.length ? <div className={styles.timeline}>
                {timeline.slice(0,30).map(item=><div className={styles.timelineItem} key={item.id}>
                  <span className={styles.timelineDot}/>
                  <div>
                    <div className={styles.timelineTitle}><strong>{item.title}</strong><span className={styles.timelineKind}>{item.kind}</span></div>
                    {item.detail ? <p>{item.detail}</p> : null}
                    <time>{fmt(item.at,true)}</time>
                  </div>
                </div>)}
              </div> : <div className={styles.empty}>No activity recorded yet.</div>}
            </div>
          </details>

          <section className={styles.panel}>
            <div className={styles.panelHead}><h2>Private notes</h2><MessageSquareText size={15}/></div>
            <div className={styles.panelBody}>
              <form action={addRecruiterNoteAction} className={styles.form}>
                <input type="hidden" name="subject_type" value="lead"/>
                <input type="hidden" name="subject_id" value={lead.id}/>
                <input type="hidden" name="return_to" value={returnTo}/>
                <label>New note<textarea name="note" required minLength={2} maxLength={4000} placeholder="Add context your team should know…"/></label>
                <button type="submit">Add private note</button>
              </form>
              <div style={{ marginTop: 12 }}>
                {notes.length ? notes.map((note) => <div className={styles.note} key={note.id}>{note.note}<time>{fmt(note.created_at, true)}</time></div>) : <div className={styles.muted}>No private notes yet.</div>}
              </div>
            </div>
          </section>
        </div>

        <aside className="stack">
          <details className={styles.panelDetails}>
            <summary><span><strong>Record settings</strong><small>Owner, CRM stage, follow-up date</small></span><ArrowRight size={15}/></summary>
            <div className={styles.panelBody}>
              <form action={updateLeadCrmAction} className={styles.form}>
                <input type="hidden" name="lead_id" value={lead.id}/>
                <input type="hidden" name="return_to" value={returnTo}/>
                <input type="hidden" name="estimated_value_usd" value={lead.estimated_value_usd ?? ""}/>
                <label>Stage<select name="crm_stage" defaultValue={lead.crm_stage || "new"}>{LEAD_CRM_STAGES.map((stage) => <option key={stage.value} value={stage.value}>{stage.label}</option>)}</select></label>
                <label>Owner<select name="owner_id" defaultValue={lead.owner_id || ""}><option value="">Unassigned</option>{owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.full_name || owner.role}</option>)}</select></label>
                <label>Next follow-up<input type="date" name="next_follow_up_at" defaultValue={dateInput(lead.next_follow_up_at)}/></label>
                <label>Lost reason <span className={styles.muted}>(only if closing as lost)</span><input name="lost_reason" defaultValue={lead.lost_reason || ""} placeholder="Budget, timing, hired elsewhere…"/></label>
                <button type="submit">Save next step</button>
              </form>
            </div>
          </details>

          <section className={styles.panel}>
            <div className={styles.panelHead}><h2>Contact</h2><Phone size={15}/></div>
            <div className={styles.panelBody}>
              <div className={styles.contactList}>
                <div><span>Email</span>{lead.email ? <a href={`mailto:${lead.email}`}>{lead.email}</a> : <strong>—</strong>}</div>
                <div><span>Phone</span>{lead.phone ? <a href={`tel:${lead.phone}`}>{lead.phone}</a> : <strong>—</strong>}</div>
                <div><span>Discovery</span><strong>{lead.discovery_completed_at ? `Completed · ${lead.discovery_outcome || "outcome not set"}` : lead.discovery_scheduled_at ? fmt(lead.discovery_scheduled_at, true) : "Not booked"}</strong></div>
              </div>
              <details className={styles.compactDetails}>
                <summary>Log client interaction or email reply</summary>
                <form action={recordLeadContactAction} className={styles.form}>
                  <input type="hidden" name="lead_id" value={lead.id}/>
                  <label>Type<select name="contact_type" defaultValue="call"><option value="email">Email reply</option><option value="call">Call</option><option value="meeting">Meeting</option><option value="follow_up">Follow-up</option></select></label>
                  <label>Note<input name="note" maxLength={1000} placeholder="What happened?"/></label>
                  <button type="submit">Log interaction</button>
                </form>
              </details>
            </div>
          </section>

          <details className={styles.panelDetails}>
            <summary><span><strong>Tasks</strong><small>{tasks.filter((task)=>task.status!=="done").length} open</small></span><ListTodo size={15}/></summary>
            <div className={styles.panelBody}>
              <div className="stack">
                {tasks.filter((task) => task.status !== "done").length ? tasks.filter((task) => task.status !== "done").map((task) => (
                  <div className={styles.note} key={task.id}>
                    <strong>{task.title}</strong>
                    {task.description ? <div>{task.description}</div> : null}
                    <time>{task.due_at ? `Due ${fmt(task.due_at, true)} · ` : ""}{task.priority}</time>
                    <form action={completeRecruiterTaskAction} style={{ marginTop: 7 }}>
                      <input type="hidden" name="task_id" value={task.id}/>
                      <input type="hidden" name="return_to" value={returnTo}/>
                      <button className={styles.secondaryButton} type="submit"><Check size={13}/> Done</button>
                    </form>
                  </div>
                )) : <div className={styles.muted}>No open tasks.</div>}
              </div>
              <details className={styles.compactDetails}>
                <summary>+ Add follow-up task</summary>
                <form action={createRecruiterTaskAction} className={styles.form}>
                  <input type="hidden" name="subject_type" value="lead"/>
                  <input type="hidden" name="subject_id" value={lead.id}/>
                  <input type="hidden" name="href" value={returnTo}/>
                  <input type="hidden" name="return_to" value={returnTo}/>
                  <label>Task<input name="title" required minLength={3} maxLength={180} defaultValue={`Follow up with ${lead.name || lead.company || "client"}`}/></label>
                  <label>Due<input type="datetime-local" name="due_at"/></label>
                  <label>Priority<select name="priority" defaultValue="normal"><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></label>
                  <button type="submit">Create task</button>
                </form>
              </details>
            </div>
          </details>

          <details className={styles.panelDetails}>
            <summary><span><strong>Advanced CRM fields</strong><small>Deal value and custom fields</small></span><ArrowRight size={15}/></summary>
            <div className={styles.panelBody}>
              <form action={updateLeadCrmAction} className={styles.form}>
                <input type="hidden" name="lead_id" value={lead.id}/>
                <input type="hidden" name="return_to" value={returnTo}/>
                <input type="hidden" name="crm_stage" value={lead.crm_stage || "new"}/>
                <input type="hidden" name="owner_id" value={lead.owner_id || ""}/>
                <input type="hidden" name="next_follow_up_at" value={dateInput(lead.next_follow_up_at)}/>
                <input type="hidden" name="lost_reason" value={lead.lost_reason || ""}/>
                <label>Estimated value (USD)<input type="number" name="estimated_value_usd" min="0" step="1" defaultValue={lead.estimated_value_usd ?? ""}/></label>
                <button type="submit">Save value</button>
              </form>

              {customFields.length ? <div className={styles.advancedFields}>
                {customFields.map(field=>{
                  const current=customValueMap.get(field.id);
                  const raw=current==null?"":typeof current==="string"||typeof current==="number"?String(current):current===true?"true":current===false?"false":"";
                  const options=Array.isArray(field.options)?field.options.map(String):[];
                  return <form action={setCrmCustomValueAction} className={styles.form} key={field.id}>
                    <input type="hidden" name="field_id" value={field.id}/>
                    <input type="hidden" name="object_id" value={lead.id}/>
                    <input type="hidden" name="object_type" value="lead"/>
                    <input type="hidden" name="return_to" value={returnTo}/>
                    <label>{field.label}
                      {field.field_type==="select"?<select name="value" defaultValue={raw}><option value="">—</option>{options.map(option=><option key={option} value={option}>{option}</option>)}</select>
                      :field.field_type==="boolean"?<select name="value" defaultValue={raw}><option value="">—</option><option value="true">Yes</option><option value="false">No</option></select>
                      :<input name="value" type={field.field_type==="number"?"number":field.field_type==="date"?"date":"text"} defaultValue={raw}/>}
                    </label>
                    <button type="submit">Save {field.label}</button>
                  </form>;
                })}
              </div> : <div className={styles.muted}>No custom fields.</div>}

              <details className={styles.compactDetails}>
                <summary>+ Add custom field</summary>
                <form action={createCrmCustomFieldAction} className={styles.form}>
                  <input type="hidden" name="object_type" value="lead"/>
                  <input type="hidden" name="return_to" value={returnTo}/>
                  <label>Label<input name="label" required minLength={2} placeholder="Lead source quality"/></label>
                  <label>Type<select name="field_type" defaultValue="text"><option value="text">Text</option><option value="number">Number</option><option value="date">Date</option><option value="boolean">Yes / No</option><option value="select">Select</option></select></label>
                  <label>Select options<input name="options" placeholder="Hot, Warm, Cold"/></label>
                  <button type="submit">Create field</button>
                </form>
              </details>
            </div>
          </details>
        </aside>
      </div>
    </div>
  );
}
