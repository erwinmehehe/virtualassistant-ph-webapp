import Link from "next/link";
import { CalendarClock, CheckCircle2, Clock3, DollarSign, ExternalLink, FileCheck2, Flame, LayoutDashboard, Mail, Search, UserRound } from "lucide-react";
import { requireRoleFast } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { dateInputValue as dateInput, dateShort, dateTimeInputValue as dateTimeInput, elapsedLabel, manilaDateTimeLabel as dateTimeLabel } from "@/lib/format";
import { cancelRecruiterDiscoveryAction, completeDiscoveryAction, recordLeadContactAction, scheduleDiscoveryAction, sendClientFollowupAction, updateLeadCrmAction } from "@/app/actions/recruiter";
import { createAndSendProposalAction } from "@/app/actions/proposals";
import { LEAD_CRM_STAGES, isOpenLeadStage, leadStageLabel } from "@/lib/lead-crm";
import { proposalStatusLabel } from "@/lib/proposals";
import { inferHours } from "@/lib/category-inference";
import { MIN_HOURLY_RATE } from "@/lib/constants";
import { CloseLeadForm } from "@/components/close-lead-form";
import { scoreLead } from "@/lib/lead-scoring";
import styles from "./leads.module.css";

const PAGE_SIZE = 25;

/** Row returned in recruiter_leads_page().leads: a lead_intake row plus activity and proposal context. */
type LeadActivity = { id: string; action: string; description: string | null; created_at: string };
type LeadProposal = { id: string; status: string; role_title: string | null; service_model: string | null; public_token: string | null; sent_at: string | null; viewed_at: string | null; decline_reason: string | null };
type RecruiterLeadRow = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  service: string | null;
  hours: string | null;
  start_time: string | null;
  message: string | null;
  source_page: string | null;
  crm_stage: string | null;
  owner_id: string | null;
  job_id: string | null;
  estimated_value_usd: number | null;
  first_contact_at: string | null;
  last_contact_at: string | null;
  next_follow_up_at: string | null;
  stage_updated_at: string | null;
  lost_reason: string | null;
  attachment_name: string | null;
  attachment_path: string | null;
  discovery_scheduled_at: string | null;
  discovery_duration_minutes: number | null;
  discovery_meeting_url: string | null;
  discovery_completed_at: string | null;
  discovery_outcome: string | null;
  discovery_notes: string | null;
  created_at: string;
  contact_count?: number | null;
  latest_activity?: LeadActivity | null;
  latest_proposal?: LeadProposal | null;
};
type RecruiterLeadsPayload = {
  leads?: RecruiterLeadRow[];
  metrics?: Partial<Record<"needs_first_contact" | "followups_due" | "discovery_booked" | "qualified" | "won_this_month" | "open_pipeline_value", number>>;
  total?: number;
  page?: number;
  page_size?: number;
};
type LeadOwner = { id: string; full_name: string | null; role: string | null };
const ageLabel = (value: string) => elapsedLabel(value, { precision: "minutes" });

function activityLabel(action: string) {
  const labels: Record<string, string> = {
    client_contact_email: "Emailed",
    client_contact_call: "Called",
    client_contact_meeting: "Meeting",
    client_contact_follow_up: "Follow-up",
    client_followup_sent: "Email sent"
  };
  return labels[action] || action.replaceAll("_", " ");
}


function responseLabel(createdAt: string, firstContactAt?: string | null) {
  if (!firstContactAt) return null;
  const minutes = Math.max(0, Math.round((new Date(firstContactAt).getTime() - new Date(createdAt).getTime()) / 60000));
  if (minutes < 60) return `${minutes} min first response`;
  return `${(minutes / 60).toFixed(1)}h first response`;
}




function usd(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

export default async function RecruiterLeadsPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}) {
  const params = await searchParams;
  await requireRoleFast("recruiter");
  const admin = createAdminClient();

  const view = params.view || "open";
  const q = String(params.q || "").trim();
  const ownerFilter = String(params.owner || "");
  const parsedPage = Number.parseInt(String(params.page || "1"), 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  let scoringQuery = admin
    .from("lead_intake")
    .select("crm_stage,created_at,stage_updated_at,first_contact_at,last_contact_at,next_follow_up_at,discovery_scheduled_at,discovery_completed_at,estimated_value_usd")
    .eq("lead_type", "client_hiring")
    .in("crm_stage", ["new","contacted","discovery_booked","qualified","terms_sent","nurture"])
    .limit(5000);
  if (ownerFilter) scoringQuery = scoringQuery.eq("owner_id", ownerFilter);

  const [{ data: pagePayload, error: pageError }, { data: owners }, { data: settings }, { data: scoringLeads }] = await Promise.all([
    admin.rpc("recruiter_leads_page", {
      p_view: view,
      p_query: q || null,
      p_owner_id: ownerFilter || null,
      p_page: page,
      p_page_size: PAGE_SIZE
    }),
    admin
      .from("profiles")
      .select("id,full_name,role,account_status")
      .in("role", ["recruiter", "admin"])
      .eq("account_status", "active")
      .order("full_name"),
    admin
      .from("admin_settings")
      .select("default_placement_fee,default_managed_markup_percent")
      .eq("id", 1)
      .maybeSingle(),
    scoringQuery
  ]);
  if (pageError) throw pageError;

  const payload = (pagePayload || {}) as RecruiterLeadsPayload;
  const visible = Array.isArray(payload.leads) ? payload.leads : [];
  const metrics = payload.metrics || {};
  const total = Number(payload.total || 0);
  const currentPage = Math.max(1, Number(payload.page || page));
  const pageSize = Math.max(1, Number(payload.page_size || PAGE_SIZE));
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const latestByLead = new Map<string, LeadActivity>();
  const countByLead = new Map<string, number>();
  const latestProposalByLead = new Map<string, LeadProposal>();
  for (const lead of visible) {
    if (lead.latest_activity) latestByLead.set(lead.id, lead.latest_activity);
    countByLead.set(lead.id, Number(lead.contact_count || 0));
    if (lead.latest_proposal) latestProposalByLead.set(lead.id, lead.latest_proposal);
  }

  const ownerMap = new Map(((owners || []) as LeadOwner[]).map((owner) => [owner.id, owner.full_name || (owner.role === "admin" ? "Admin" : "Recruiter")]));
  const now = Date.now();
  const needsFirstContact = Number(metrics.needs_first_contact || 0);
  const followUpsDue = Number(metrics.followups_due || 0);
  const discoveryBooked = Number(metrics.discovery_booked || 0);
  const qualifiedCount = Number(metrics.qualified || 0);
  const wonThisMonth = Number(metrics.won_this_month || 0);
  const openPipelineValue = Number(metrics.open_pipeline_value || 0);
  const pipelineScores = (scoringLeads || []).map((lead) => scoreLead(lead, now));
  const hotLeads = pipelineScores.filter((lead) => lead.temperature === "hot").length;
  const warmLeads = pipelineScores.filter((lead) => lead.temperature === "warm").length;

  const viewTabs = [
    ["open", "Open pipeline"],
    ["recent", "Newest leads"],
    ["attention", "Attention"],
    ["discovery", "Discovery"],
    ["qualified", "Qualified"],
    ["nurture", "Nurture"],
    ["won", "Won"],
    ["lost", "Lost"],
    ["all", "All"]
  ] as const;
  const currentViewLabel = viewTabs.find(([value]) => value === view)?.[1] || "Open pipeline";

  const buildHref = (targetPage?: number) => {
    const next = new URLSearchParams();
    next.set("view", view);
    if (params.q) next.set("q", params.q);
    if (ownerFilter) next.set("owner", ownerFilter);
    if (targetPage && targetPage > 1) next.set("page", String(targetPage));
    return `/workspace/recruiter/leads?${next.toString()}`;
  };

  const currentParams = new URLSearchParams();
  if (view) currentParams.set("view", view);
  if (params.q) currentParams.set("q", params.q);
  if (params.owner) currentParams.set("owner", params.owner);
  if (currentPage > 1) currentParams.set("page", String(currentPage));
  const returnTo = `/workspace/recruiter/leads?${currentParams.toString()}`;
  const defaultPlacementFee = Number(settings?.default_placement_fee || 0);
  const defaultManagedMarkup = Number(settings?.default_managed_markup_percent || 0);

  return (
    <div className={styles.crmPage}>
      {params.crm_saved ? <div className="success-banner">Lead CRM updated.</div> : null}
      {params.contact_sent ? <div className="success-banner">Reply sent to the client, logged in the CRM, and the follow-up clock was updated.</div> : null}
      {params.discovery_saved ? <div className="success-banner">Discovery call booked.{params.discovery_email === "failed" ? " The confirmation email could not be sent, so contact the client manually." : " Confirmation email sent."}</div> : null}
      {params.discovery_completed ? <div className="success-banner">Discovery outcome saved.</div> : null}
      {params.discovery_cancelled ? <div className="success-banner">Discovery booking cancelled and the client has been notified.</div> : null}
      {params.proposal_sent ? <div className="success-banner">Proposal sent. The CRM will follow up automatically in two days if it is still open.</div> : null}
      {params.contact_error ? <div className="alert" role="alert">{params.contact_error}</div> : null}
      {params.crm_error ? <div className="alert" role="alert">{params.crm_error}</div> : null}
      {params.discovery_error ? <div className="alert" role="alert">{params.discovery_error}</div> : null}
      {params.proposal_error ? <div className="alert" role="alert">{params.proposal_error}</div> : null}

      <div className="page-head">
        <div>
          <div className="kicker">Sales CRM</div>
          <h1>Client leads</h1>
          <p>Reply fast, book the discovery call, send the proposal, and keep every opportunity moving toward a decision.</p>
        </div>
        <div className="row wrap">
          <Link className="btn btn-sm" href="/workspace/recruiter/leads/board"><LayoutDashboard size={15}/> Pipeline board</Link>
          <div className="crm-sla-target"><Clock3 size={15}/><span>First-response target</span><strong>30 min</strong></div>
        </div>
      </div>

      <div className="crm-metrics">
        <Link href="/workspace/recruiter/leads?view=attention" className="card crm-metric-card"><Clock3 size={18}/><span>Needs first contact</span><strong>{needsFirstContact}</strong><small>Reply before they keep shopping</small></Link>
        <Link href="/workspace/recruiter/leads?view=attention" className="card crm-metric-card"><CalendarClock size={18}/><span>Follow-ups due</span><strong>{followUpsDue}</strong><small>Overdue or due now</small></Link>
        <Link href="/workspace/recruiter/leads?view=discovery" className="card crm-metric-card"><UserRound size={18}/><span>Discovery booked</span><strong>{discoveryBooked}</strong><small>Calls ready to qualify</small></Link>
        <Link href="/workspace/recruiter/leads/board" className="card crm-metric-card"><Flame size={18}/><span>Hot leads</span><strong>{hotLeads}</strong><small>{warmLeads} more warm opportunities</small></Link>
        <Link href="/workspace/recruiter/leads?view=won" className="card crm-metric-card"><DollarSign size={18}/><span>Won this month</span><strong>{wonThisMonth}</strong><small>Closed client opportunities</small></Link>
        <div className="card crm-metric-card"><DollarSign size={18}/><span>Open pipeline value</span><strong>{usd(openPipelineValue)}</strong><small>Estimated agency revenue</small></div>
      </div>

      <nav className="role-filter-tabs crm-tabs" aria-label="Lead pipeline views">
        {viewTabs.map(([value,label]) => <Link key={value} className={view === value ? "active" : ""} aria-current={view === value ? "page" : undefined} href={`/workspace/recruiter/leads?${new URLSearchParams({view:value,...(params.q?{q:params.q}:{}),...(ownerFilter?{owner:ownerFilter}:{})}).toString()}`}>{label}</Link>)}
      </nav>

      {view === "recent" ? <p className="small muted crm-view-note">Newest enquiries first, across all stages. Search and owner filters run in the database. Showing {pageSize} at a time.</p> : null}

      <form method="get" className="recruiter-filter-panel crm-filter-panel">
        <input type="hidden" name="view" value={view}/>
        <div className="directory-filter-search"><Search size={16}/><input name="q" defaultValue={params.q} aria-label="Search leads" placeholder="Search name, company, email, or hiring need"/></div>
        <label className="crm-filter-owner"><span>Owner</span><select name="owner" defaultValue={ownerFilter}>
          <option value="">All owners</option>
          {((owners || []) as LeadOwner[]).map((owner) => <option key={owner.id} value={owner.id}>{owner.full_name || owner.role}</option>)}
        </select></label>
        <button className="btn btn-primary" type="submit">Apply filters</button>
        <Link className="btn" href={`/workspace/recruiter/leads?view=${view}`}>Clear</Link>
      </form>

      <div className="row-between wrap crm-results-head">
        <div className="crm-results-title"><strong>{currentViewLabel}</strong><span>{total} lead{total === 1 ? "" : "s"} · page {Math.min(currentPage,totalPages)} of {totalPages}</span></div>
        {view === "attention" ? <span className="small muted">Sorted by missed SLA, overdue follow-up, then newest lead.</span> : null}
      </div>

      <div className="stack crm-lead-list">
        {visible.length ? visible.map((lead) => {
          const stage = lead.crm_stage || "new";
          const leadScore = scoreLead(lead, now);
          const latest = latestByLead.get(lead.id);
          const proposal = latestProposalByLead.get(lead.id);
          const contactCount = countByLead.get(lead.id) || 0;
          const receivedAge = now - new Date(lead.created_at).getTime();
          const slaMissed = stage === "new" && !lead.first_contact_at && receivedAge > 30 * 60000;
          const followTime = lead.next_follow_up_at ? new Date(lead.next_follow_up_at).getTime() : null;
          const followOverdue = Boolean(followTime && followTime < now && isOpenLeadStage(stage));
          const response = responseLabel(lead.created_at, lead.first_contact_at);
          const emailSubject = `Your VirtualAssistant.com.ph enquiry${lead.service ? ` - ${lead.service}` : ""}`;
          const firstName = String(lead.name || "there").trim().split(/\s+/)[0] || "there";
          const replyMessage = lead.first_contact_at
            ? `Hi ${firstName},\n\nFollowing up on your VirtualAssistant.com.ph request. I wanted to keep things moving and confirm the best next step for your VA search.`
            : `Hi ${firstName},\n\nThanks for reaching out to VirtualAssistant.com.ph. I reviewed your request${lead.service ? ` for ${lead.service}` : ""} and would like to confirm a few details so we can recommend the right vetted VA. Are you available for a short discovery call?`;
          const discoveryScheduled = Boolean(lead.discovery_scheduled_at && !lead.discovery_completed_at);
          const suggestedHours = inferHours(lead.hours) || 40;
          const attentionMessage = slaMissed
            ? "First response overdue. Reply to this client now."
            : followOverdue
              ? "Follow-up overdue. Move this lead forward or close it."
              : null;

          return <article className={`card crm-lead-card ${slaMissed || followOverdue ? "needs-attention" : ""}`} key={lead.id}>
            <div className="crm-lead-head">
              <div className="crm-lead-identity">
                <div className="row wrap crm-lead-tags">
                  <span className={`badge ${stage === "won" ? "badge-success" : stage === "new" || followOverdue ? "badge-warning" : ""}`}>{leadStageLabel(stage)}</span>
                  {isOpenLeadStage(stage) ? <span className={`lead-temperature ${leadScore.temperature}`}>{leadScore.temperature === "hot" ? "Hot" : leadScore.temperature === "warm" ? "Warm" : "Cold"} · {leadScore.score}</span> : null}
                  {slaMissed ? <span className="badge badge-warning">30-min SLA missed</span> : null}
                  {followOverdue ? <span className="badge badge-warning">Follow-up overdue</span> : null}
                  {discoveryScheduled ? <span className="badge">Discovery {dateTimeLabel(lead.discovery_scheduled_at)}</span> : null}
                  {proposal ? <span className={`badge ${proposal.status === "accepted" ? "badge-success" : ""}`}>Proposal {proposalStatusLabel(proposal.status)}</span> : null}
                  {lead.job_id ? <span className="badge badge-success">Role linked</span> : null}
                </div>
                <h2>{lead.name || lead.email}</h2>
                <div className="crm-lead-subtitle">
                  <span>{lead.company || "Individual client"}</span>
                  <span>{lead.service || "Virtual Assistant support"}</span>
                  {lead.email ? <span>{lead.email}</span> : null}
                </div>
              </div>
              <div className="crm-lead-meta">
                <span><Clock3 size={14}/> Received {ageLabel(lead.created_at)}</span>
                <span><UserRound size={14}/> {lead.owner_id ? ownerMap.get(lead.owner_id) || "Assigned" : "Unassigned"}</span>
                <span><DollarSign size={14}/> {lead.estimated_value_usd ? usd(Number(lead.estimated_value_usd)) : "Value not set"}</span>
              </div>
            </div>

            {attentionMessage ? <div className="crm-attention-strip"><Clock3 size={15}/><strong>{attentionMessage}</strong></div> : null}

            <div className="crm-lead-body">
              <section className="crm-client-context">
                <h3>What they need</h3>
                <p>{lead.message || "No additional message provided."}</p>
                {lead.attachment_path ? <a className="btn btn-sm" href={`/api/recruiter/lead-attachment/${lead.id}`} target="_blank" rel="noreferrer"><FileCheck2 size={13}/> Open client document{lead.attachment_name ? `: ${lead.attachment_name}` : ""}</a> : null}
                <div className="small muted">Source: {lead.source_page || "Website enquiry"} · Received {dateShort(lead.created_at)}</div>
                <div className="crm-contact-summary">
                  <div><strong>First response</strong><span>{response || (slaMissed ? "Over target" : "Waiting")}</span></div>
                  <div><strong>Last contact</strong><span>{lead.last_contact_at ? dateShort(lead.last_contact_at) : "None yet"}</span></div>
                  <div><strong>Next follow-up</strong><span className={followOverdue ? "crm-overdue" : ""}>{lead.next_follow_up_at ? dateShort(lead.next_follow_up_at) : "Not scheduled"}</span></div>
                </div>

                {lead.discovery_scheduled_at ? <div className="crm-discovery-summary">
                  <div><CalendarClock size={16}/><span><strong>{lead.discovery_completed_at ? "Discovery completed" : "Discovery call"}</strong><small>{dateTimeLabel(lead.discovery_scheduled_at)} · {lead.discovery_duration_minutes || 30} min</small></span></div>
                  <div className="row wrap">
                    {lead.discovery_meeting_url && !lead.discovery_completed_at ? <a className="btn btn-sm" href={lead.discovery_meeting_url} target="_blank" rel="noreferrer">Join call <ExternalLink size={13}/></a> : null}
                    {discoveryScheduled ? <form action={cancelRecruiterDiscoveryAction}><input type="hidden" name="lead_id" value={lead.id}/><input type="hidden" name="return_to" value={returnTo}/><button className="btn btn-sm" type="submit">Cancel discovery</button></form> : null}
                    {view === "discovery" && isOpenLeadStage(stage) ? <CloseLeadForm leadId={lead.id} returnTo={returnTo} hasLinkedRole={Boolean(lead.job_id)}/> : null}
                    {lead.discovery_outcome ? <span className="small muted">Outcome: {String(lead.discovery_outcome).replaceAll("_", " ")}</span> : lead.discovery_notes ? <span className="small muted">{lead.discovery_notes}</span> : null}
                  </div>
                </div> : null}

                {proposal ? <div className="crm-proposal-summary">
                  <div><FileCheck2 size={16}/><span><strong>{proposal.role_title}</strong><small>{proposalStatusLabel(proposal.status)}{proposal.sent_at ? ` · sent ${dateShort(proposal.sent_at)}` : ""}{proposal.viewed_at ? ` · viewed ${dateShort(proposal.viewed_at)}` : proposal.status === "sent" ? " · not viewed yet" : ""}</small>{proposal.decline_reason ? <small><strong>Client feedback:</strong> {proposal.decline_reason}</small> : null}</span></div>
                  <Link className="btn btn-sm" href={`/proposal/${proposal.public_token}`} target="_blank">Open proposal <ExternalLink size={13}/></Link>
                </div> : null}

                {latest ? <div className="crm-latest-contact"><strong>{activityLabel(latest.action)}</strong><span>{dateShort(latest.created_at)}{contactCount > 1 ? ` · ${contactCount} contact updates` : ""}</span>{latest.description ? <small>{latest.description}</small> : null}</div> : null}
                {lead.job_id ? <Link className="btn btn-sm" href={`/workspace/recruiter/matching/${lead.job_id}`}>View linked role</Link> : null}
              </section>

              <form action={updateLeadCrmAction} className="crm-update-card">
                <input type="hidden" name="lead_id" value={lead.id}/>
                <input type="hidden" name="return_to" value={returnTo}/>
                <div className="crm-form-head"><span className="crm-form-kicker">Pipeline control</span><strong>Next step</strong><span className="small muted">Stage, owner, follow-up date, and value should always be current.</span></div>
                <div className="grid-2">
                  <div className="field"><label>Stage</label><select name="crm_stage" defaultValue={stage}>{LEAD_CRM_STAGES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
                  <div className="field"><label>Owner</label><select name="owner_id" defaultValue={lead.owner_id || ""}><option value="">Unassigned</option>{((owners || []) as LeadOwner[]).map((owner) => <option key={owner.id} value={owner.id}>{owner.full_name || owner.role}</option>)}</select></div>
                  <div className="field"><label>Next follow-up</label><input type="date" name="next_follow_up_at" defaultValue={dateInput(lead.next_follow_up_at)}/></div>
                  <div className="field"><label>Est. agency value, USD</label><input type="number" min="0" step="50" name="estimated_value_usd" defaultValue={lead.estimated_value_usd ?? ""} placeholder="1500"/></div>
                </div>
                <div className="field"><label>Lost reason <span className="muted">(required only for Lost)</span></label><input name="lost_reason" maxLength={1000} defaultValue={lead.lost_reason || ""} placeholder="Budget, timing, hired elsewhere, no response..."/></div>
                <button className="btn btn-primary" type="submit">Save CRM update</button>
              </form>
            </div>

            {isOpenLeadStage(stage) ? <div className="crm-close-tools">
              <details className="crm-tool-panel" open={stage === "contacted" && !lead.discovery_scheduled_at}>
                <summary><CalendarClock size={16}/><span><strong>{lead.discovery_scheduled_at ? "Reschedule discovery" : "Book discovery"}</strong><small>Send the client a confirmed date, time, and meeting link.</small></span></summary>
                <form action={scheduleDiscoveryAction} className="crm-tool-form">
                  <input type="hidden" name="lead_id" value={lead.id}/>
                  <input type="hidden" name="return_to" value={returnTo}/>
                  <div className="grid-3">
                    <div className="field"><label>Date & time <span className="muted">(Manila)</span></label><input type="datetime-local" name="discovery_scheduled_at" required defaultValue={dateTimeInput(lead.discovery_scheduled_at)}/></div>
                    <div className="field"><label>Duration</label><select name="discovery_duration_minutes" defaultValue={String(lead.discovery_duration_minutes || 30)}><option value="30">30 minutes</option><option value="45">45 minutes</option><option value="60">60 minutes</option></select></div>
                    <div className="field"><label>Meeting link</label><input name="discovery_meeting_url" type="url" defaultValue={lead.discovery_meeting_url || ""} placeholder="https://meet.google.com/..."/></div>
                  </div>
                  <button className="btn btn-primary" type="submit">Book and email client</button>
                </form>
              </details>

              {discoveryScheduled ? <details className="crm-tool-panel">
                <summary><CheckCircle2 size={16}/><span><strong>Complete discovery</strong><small>Save what you learned and set the next sales stage.</small></span></summary>
                <form action={completeDiscoveryAction} className="crm-tool-form">
                  <input type="hidden" name="lead_id" value={lead.id}/>
                  <input type="hidden" name="return_to" value={returnTo}/>
                  <div className="grid-2">
                    <div className="field"><label>Outcome</label><select name="outcome" defaultValue="qualified"><option value="qualified">Attended and qualified</option><option value="attended">Attended, follow-up needed</option><option value="no_show">No-show</option><option value="cancelled">Cancelled</option><option value="rescheduled">Rescheduled</option><option value="nurture">Nurture</option><option value="lost">Lost</option></select></div>
                    <div className="field"><label>Lost reason <span className="muted">(only if lost)</span></label><input name="lost_reason" maxLength={1000} placeholder="Budget, timing, hired elsewhere..."/></div>
                  </div>
                  <div className="field"><label>Discovery notes</label><textarea name="discovery_notes" required minLength={3} maxLength={5000} defaultValue={lead.discovery_notes || ""} placeholder="Priorities, pain points, tools, hours, budget, decision process, timeline..."/></div>
                  <button className="btn btn-primary" type="submit">Save discovery outcome</button>
                </form>
              </details> : null}

              {["qualified","shortlist_sent"].includes(stage) ? <details className="crm-tool-panel" open={stage === "qualified" && !proposal}>
                <summary><FileCheck2 size={16}/><span><strong>{proposal ? "Send updated proposal" : "Create proposal"}</strong><small>Turn the discovery notes into one clear commercial decision.</small></span></summary>
                <form action={createAndSendProposalAction} className="crm-tool-form">
                  <input type="hidden" name="lead_id" value={lead.id}/>
                  <input type="hidden" name="return_to" value={returnTo}/>
                  <div className="grid-2">
                    <div className="field"><label>Role</label><input name="role_title" required minLength={3} maxLength={160} defaultValue={proposal?.role_title || lead.service || "Virtual Assistant"}/></div>
                    <div className="field"><label>Service model</label><select name="service_model" defaultValue={proposal?.service_model || "curated_placement"}><option value="curated_placement">Curated placement</option><option value="managed_service">Managed VA service</option></select></div>
                  </div>
                  <div className="field"><label>Hiring brief</label><textarea name="summary" maxLength={5000} defaultValue={lead.discovery_notes || lead.message || ""} placeholder="What the VA will own and what a good outcome looks like."/></div>
                  <div className="grid-3">
                    <div className="field"><label>Hours/week</label><input type="number" name="hours_per_week" min="1" max="80" required defaultValue={suggestedHours}/></div>
                    <div className="field"><label>VA rate from</label><input type="number" name="va_rate_min" min={MIN_HOURLY_RATE} step="0.5" required defaultValue={MIN_HOURLY_RATE}/></div>
                    <div className="field"><label>VA rate to</label><input type="number" name="va_rate_max" min={MIN_HOURLY_RATE} step="0.5" defaultValue={Math.max(MIN_HOURLY_RATE, 8)}/></div>
                  </div>
                  <div className="grid-3">
                    <div className="field"><label>Placement fee, USD</label><input type="number" name="placement_fee" min="0" step="50" defaultValue={defaultPlacementFee || ""}/></div>
                    <div className="field"><label>Managed margin, %</label><input type="number" name="managed_markup_percent" min="0" step="1" defaultValue={defaultManagedMarkup || ""}/></div>
                    <div className="field"><label>Proposal valid</label><select name="expires_days" defaultValue="7"><option value="7">7 days</option><option value="14">14 days</option><option value="30">30 days</option></select></div>
                  </div>
                  <div className="field"><label>Start timing</label><input name="start_timing" maxLength={200} defaultValue={lead.start_time || ""} placeholder="ASAP, within 2 weeks, next month..."/></div>
                  <button className="btn btn-primary" type="submit">{proposal ? "Create and send updated proposal" : "Create and send proposal"}</button>
                </form>
              </details> : null}
            </div> : null}

            <div className="crm-contact-bar">
              <details className="staff-followup-details" open={!lead.first_contact_at || slaMissed}>
                <summary className="btn btn-sm btn-primary"><Mail size={14}/> Reply to client</summary>
                <form action={sendClientFollowupAction} className="stack staff-followup-form">
                  <input type="hidden" name="lead_id" value={lead.id}/>
                  <input type="hidden" name="return_to" value={returnTo}/>
                  <div className="small muted">To: <strong>{lead.email}</strong></div>
                  <div className="field"><label>Subject</label><input name="subject" required minLength={3} maxLength={180} defaultValue={emailSubject}/></div>
                  <div className="field"><label>Reply</label><textarea name="message" required minLength={10} maxLength={5000} defaultValue={replyMessage}/></div>
                  <div className="row wrap"><button className="btn btn-primary" type="submit">Send reply</button><span className="small muted">Sending here logs the contact, records the first response, assigns the owner if needed, and schedules the next follow-up.</span></div>
                </form>
              </details>

              <div className="row wrap">
                <form action={recordLeadContactAction}><input type="hidden" name="lead_id" value={lead.id}/><input type="hidden" name="contact_type" value="email"/><button className="btn btn-sm" type="submit">Log external email</button></form>
                {lead.phone ? <form action={recordLeadContactAction}><input type="hidden" name="lead_id" value={lead.id}/><input type="hidden" name="contact_type" value="call"/><button className="btn btn-sm" type="submit">Mark called</button></form> : null}
              </div>

              {isOpenLeadStage(stage) && view !== "discovery" ? <CloseLeadForm leadId={lead.id} returnTo={returnTo} hasLinkedRole={Boolean(lead.job_id)}/> : null}

              <form action={recordLeadContactAction} className="row wrap">
                <input type="hidden" name="lead_id" value={lead.id}/>
                <input type="hidden" name="contact_type" value="follow_up"/>
                <input name="note" maxLength={1000} placeholder="Add private follow-up note" aria-label="Follow-up note"/>
                <button className="btn btn-sm" type="submit">Save private note</button>
              </form>
            </div>
          </article>;
        }) : <div className="card empty"><h3>Nothing needs attention here.</h3><p>Change the filter or move on to the next recruiter queue.</p></div>}
      </div>

      {totalPages > 1 ? <div className="row-between wrap crm-results-head" aria-label="Lead pagination">
        {currentPage > 1 ? <Link className="btn btn-sm" href={buildHref(currentPage - 1)}>Previous</Link> : <span/>}
        <span className="small muted">Page {Math.min(currentPage,totalPages)} of {totalPages}</span>
        {currentPage < totalPages ? <Link className="btn btn-sm" href={buildHref(currentPage + 1)}>Next</Link> : <span/>}
      </div> : null}
    </div>
  );
}