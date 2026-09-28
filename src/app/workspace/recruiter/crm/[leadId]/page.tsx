import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  CalendarPlus,
  Check,
  ListTodo,
  Mail,
  MessageSquareText,
  Phone,
  Send,
  UserRound,
} from "lucide-react";
import { requireRoleFast } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getClientLastLogin } from "@/lib/client-auth-activity";
import { LEAD_CRM_STAGES, leadStageLabel } from "@/lib/lead-crm";
import { dateInputValue as dateInput, dateTimeInputValue as dateTimeInput } from "@/lib/format";
import {
  updateLeadCrmAction,
  addRecruiterNoteAction,
  recordLeadContactAction,
  sendClientFollowupAction,
  scheduleDiscoveryAction,
  completeDiscoveryAction,
  cancelRecruiterDiscoveryAction,
} from "@/app/actions/recruiter";
import { createCrmCustomFieldAction, setCrmCustomValueAction } from "@/app/actions/crm";
import { completeRecruiterTaskAction, createRecruiterTaskAction } from "@/app/actions/recruiter-ops";
import styles from "../crm.module.css";

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

function activityTitle(action: string) {
  const labels: Record<string, string> = {
    client_contact_email: "Client email logged",
    client_contact_call: "Client call logged",
    client_contact_meeting: "Client meeting logged",
    client_contact_follow_up: "Follow-up logged",
    client_followup_sent: "Client follow-up sent",
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

  const [jobResult, ownersResult, activityResult, notesResult, tasksResult, customFieldsResult, customValuesResult, emailResult, proposalResult, shortlistResult, interviewResult, offerResult, workroomResult] = await Promise.all([
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
  ]);
  for (const result of [jobResult, ownersResult, activityResult, notesResult, tasksResult, customFieldsResult, customValuesResult, emailResult, proposalResult, shortlistResult, interviewResult, offerResult, workroomResult]) {
    if (result.error) throw result.error;
  }

  const job = jobResult.data as Job | null;
  const owners = (ownersResult.data || []) as Owner[];
  const activities = (activityResult.data || []) as Activity[];
  const notes = (notesResult.data || []) as Note[];
  const tasks = (tasksResult.data || []) as Task[];
  const customFields = (customFieldsResult.data || []) as CustomField[];
  const customValueMap = new Map(((customValuesResult.data || []) as CustomValue[]).map(item=>[item.field_id,item.value]));
  const emailEvents = (emailResult.data || []) as EmailEvent[];
  const proposals = (proposalResult.data || []) as Proposal[];
  const shortlists = (shortlistResult.data || []) as Shortlist[];
  const interviews = (interviewResult.data || []) as Interview[];
  const offers = (offerResult.data || []) as Offer[];
  const workrooms = (workroomResult.data || []) as Workroom[];

  const [
    clientLastLoginAt,
    candidateViewResult,
    shortlistOpenResult,
    shortlistMessageResult,
    emailReplyResult,
  ] = await Promise.all([
    getClientLastLogin(lead.client_id),
    lead.client_id
      ? admin.from("analytics_events")
          .select("created_at", { count: "exact" })
          .eq("user_id", lead.client_id)
          .in("event_name", ["candidate_view", "candidate_viewed"])
          .order("created_at", { ascending: false })
          .limit(1)
      : Promise.resolve({ data: [], count: 0, error: null }),
    lead.client_id && lead.job_id
      ? admin.from("recruiter_activity")
          .select("created_at")
          .eq("subject_type", "job")
          .eq("subject_id", lead.job_id)
          .eq("actor_id", lead.client_id)
          .eq("action", "client_shortlist_viewed")
          .order("created_at", { ascending: false })
          .limit(1)
      : Promise.resolve({ data: [], error: null }),
    lead.client_id && lead.job_id
      ? admin.from("recruiter_activity")
          .select("created_at")
          .eq("subject_type", "job")
          .eq("subject_id", lead.job_id)
          .eq("actor_id", lead.client_id)
          .eq("action", "client_shortlist_message")
          .order("created_at", { ascending: false })
          .limit(1)
      : Promise.resolve({ data: [], error: null }),
    admin.from("recruiter_activity")
      .select("created_at")
      .eq("subject_type", "lead")
      .eq("subject_id", leadId)
      .eq("action", "client_contact_email")
      .order("created_at", { ascending: false })
      .limit(1),
  ]);
  for (const result of [candidateViewResult, shortlistOpenResult, shortlistMessageResult, emailReplyResult]) {
    if (result.error) throw result.error;
  }
  const candidateViewCount = Number(candidateViewResult.count || 0);
  const lastCandidateViewAt = candidateViewResult.data?.[0]?.created_at || null;
  const shortlistOpenedAt = shortlistOpenResult.data?.[0]?.created_at || null;
  const lastShortlistMessageAt = shortlistMessageResult.data?.[0]?.created_at || null;
  const lastEmailReplyAt = emailReplyResult.data?.[0]?.created_at || null;

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
    qualified:[{value:"terms_sent",label:"Terms sent"},{value:"nurture",label:"Move to nurture"}],
    terms_sent:[{value:"shortlist_sent",label:"Shortlist sent"},{value:"nurture",label:"Move to nurture"}],
    shortlist_sent:[{value:"won",label:"Mark won"},{value:"nurture",label:"Move to nurture"}],
    nurture:[{value:"contacted",label:"Reopen as contacted"}],
  };
  const hasReleasedShortlist = shortlists.some((item) => Boolean(item.released_at) || item.shortlist_status === "released");
  const hasInterview = interviews.length > 0;
  const hasOffer = offers.length > 0;
  const hasHire = workrooms.length > 0 || job?.status === "filled";
  const workflowSteps = ["Enquiry", "Call", "Role", "Shortlist", "Interview", "Offer", "Hire"] as const;
  const workflowIndex = hasHire ? 6
    : hasOffer ? 5
      : hasInterview ? 4
        : hasReleasedShortlist ? 3
          : job ? 2
            : (lead.discovery_scheduled_at || lead.discovery_completed_at) ? 1
              : 0;

  const latestDecision = shortlists
    .filter((item) => item.client_decision_at)
    .sort((x,y) => new Date(y.client_decision_at || 0).getTime() - new Date(x.client_decision_at || 0).getTime())[0] || null;
  const shortlistActivityTimes = [shortlistOpenedAt, lastShortlistMessageAt, latestDecision?.client_decision_at || null].filter(Boolean) as string[];
  const lastShortlistActivityAt = shortlistActivityTimes.length
    ? shortlistActivityTimes.sort((x,y) => new Date(y).getTime() - new Date(x).getTime())[0]
    : null;
  const decisionSummary = latestDecision?.client_decision
    ? `${String(latestDecision.client_decision).replaceAll("_", " ")} · ${fmt(latestDecision.client_decision_at, true)}`
    : "No decision yet";

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
      {query.discovery_completed ? <div className="success-banner">Discovery outcome saved.</div> : null}
      {query.discovery_cancelled ? <div className="success-banner">Discovery booking cancelled.</div> : null}
      {query.discovery_error ? <div className="alert" role="alert">{query.discovery_error}</div> : null}

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
          {job ? <Link className={styles.primaryButton} href={`/workspace/recruiter/roles/${job.id}`}><BriefcaseBusiness size={15}/> Open linked role</Link> : null}
          <Link className={styles.secondaryButton} href="/workspace/recruiter/crm"><UserRound size={15}/> Clients</Link>
        </div>
      </header>

      <nav className={styles.workflow} aria-label="Hiring workflow">
        {workflowSteps.map((label,index)=><span key={label} className={index < workflowIndex ? styles.workflowDone : index === workflowIndex ? styles.workflowCurrent : undefined}><i>{index < workflowIndex ? "✓" : index + 1}</i><em>{label}</em></span>)}
      </nav>

      <section className={styles.actionCenter}>
        <div className={styles.actionCenterHead}>
          <div>
            <span className={styles.kicker}>Next step</span>
            <h2>Move this hire forward</h2>
            <p>Use the client record for the brief and call. Use the linked role for matching, shortlist, interviews, and hire.</p>
          </div>
          <div className={styles.actionStatus}>
            <span className={lead.client_id ? styles.statusGood : styles.statusNeutral}>{lead.client_id ? "Client account active" : "Client account not activated"}</span>
            <span>{lead.next_follow_up_at ? `Follow-up ${fmt(lead.next_follow_up_at)}` : "No follow-up scheduled"}</span>
          </div>
        </div>

        <div className={styles.actionLinks}>
          {job ? <Link href={`/workspace/recruiter/roles/${job.id}`}><BriefcaseBusiness size={14}/> Role</Link> : null}
          {job ? <Link href={`/workspace/recruiter/matching/${job.id}`}><UserRound size={14}/> Matching</Link> : null}
          {lead.discovery_meeting_url && !lead.discovery_completed_at && !lead.discovery_cancelled_at ? <a href={lead.discovery_meeting_url} target="_blank" rel="noreferrer"><CalendarDays size={14}/> Join discovery</a> : null}
        </div>

        <div className={styles.actionGrid}>
          <details className={styles.actionCard}>
            <summary><span className={styles.actionIcon}><Mail size={16}/></span><span><strong>Email client</strong><small>Only send when you need clarification or have a concrete update.</small></span><ArrowRight size={15}/></summary>
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
            <summary><span className={styles.actionIcon}><CalendarPlus size={16}/></span><span><strong>{lead.discovery_scheduled_at && !lead.discovery_completed_at ? "Reschedule discovery" : "Book discovery"}</strong><small>{lead.discovery_scheduled_at && !lead.discovery_completed_at ? fmt(lead.discovery_scheduled_at,true) : "Create the meeting only when a call is actually needed."}</small></span><ArrowRight size={15}/></summary>
            <div className={styles.actionFormStack}>
              <form action={scheduleDiscoveryAction} className={styles.actionForm}>
                <input type="hidden" name="lead_id" value={lead.id}/>
                <input type="hidden" name="request_id" value={crypto.randomUUID()}/>
                <input type="hidden" name="return_to" value={returnTo}/>
                <label>Date & time <span className={styles.muted}>(Manila)</span><input type="datetime-local" name="discovery_scheduled_at" required defaultValue={dateTimeInput(lead.discovery_scheduled_at)}/></label>
                <label>Duration<select name="discovery_duration_minutes" defaultValue={String(lead.discovery_duration_minutes || 30)}><option value="30">30 minutes</option><option value="45">45 minutes</option><option value="60">60 minutes</option></select></label>
                <label>Meeting link <span className={styles.muted}>(optional)</span><input type="url" name="discovery_meeting_url" defaultValue={lead.discovery_meeting_url || ""} placeholder="Leave blank to create Google Meet"/></label>
                <button type="submit"><CalendarPlus size={14}/> Save booking</button>
              </form>

              {lead.discovery_scheduled_at && !lead.discovery_completed_at && !lead.discovery_cancelled_at ? <div className={styles.actionSubsection}>
                <form action={completeDiscoveryAction} className={styles.actionForm}>
                  <input type="hidden" name="lead_id" value={lead.id}/>
                  <input type="hidden" name="return_to" value={returnTo}/>
                  <label>Outcome<select name="outcome" defaultValue="qualified"><option value="qualified">Attended and qualified</option><option value="attended">Attended, follow-up needed</option><option value="no_show">No-show</option><option value="rescheduled">Rescheduled</option><option value="nurture">Nurture</option><option value="lost">Lost</option></select></label>
                  <label>Discovery notes<textarea name="discovery_notes" required minLength={3} maxLength={5000} defaultValue={lead.discovery_notes || ""} placeholder="Priorities, tools, schedule, budget, decision process, next step…"/></label>
                  <label>Lost reason <span className={styles.muted}>(only if lost)</span><input name="lost_reason" maxLength={1000} placeholder="Budget, timing, hired elsewhere…"/></label>
                  <button type="submit">Complete discovery</button>
                </form>
                <form action={cancelRecruiterDiscoveryAction}>
                  <input type="hidden" name="lead_id" value={lead.id}/>
                  <input type="hidden" name="return_to" value={returnTo}/>
                  <button className={styles.textButton} type="submit">Cancel booking</button>
                </form>
              </div> : null}
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
                <summary>Log client interaction</summary>
                <form action={recordLeadContactAction} className={styles.form}>
                  <input type="hidden" name="lead_id" value={lead.id}/>
                  <label>Type<select name="contact_type" defaultValue="call"><option value="call">Call</option><option value="meeting">Meeting</option><option value="follow_up">Follow-up</option></select></label>
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
