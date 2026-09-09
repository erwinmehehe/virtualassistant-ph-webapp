import Link from "next/link";
import { CalendarClock, CheckCircle2, Clock3, DollarSign, Mail, Phone, Search, UserRound } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { dateShort } from "@/lib/format";
import { recordLeadContactAction, sendClientFollowupAction, updateLeadCrmAction } from "@/app/actions/recruiter";
import { LEAD_CRM_STAGES, isOpenLeadStage, leadStageLabel } from "@/lib/lead-crm";

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

function ageLabel(value: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function responseLabel(createdAt: string, firstContactAt?: string | null) {
  if (!firstContactAt) return null;
  const minutes = Math.max(0, Math.round((new Date(firstContactAt).getTime() - new Date(createdAt).getTime()) / 60000));
  if (minutes < 60) return `${minutes} min first response`;
  return `${(minutes / 60).toFixed(1)}h first response`;
}

function dateInput(value?: string | null) {
  return value ? new Date(value).toISOString().slice(0, 10) : "";
}

function usd(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

export default async function RecruiterLeadsPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}) {
  const params = await searchParams;
  await requireRole("recruiter");
  const admin = createAdminClient();
  const [{ data: leads }, { data: owners }] = await Promise.all([
    admin
      .from("lead_intake")
      .select("id,name,email,phone,company,service,status,job_id,created_at,message,source_page,page_url,crm_stage,owner_id,next_follow_up_at,estimated_value_usd,lost_reason,first_contact_at,last_contact_at,stage_updated_at,won_at,lost_at")
      .order("created_at", { ascending: false })
      .limit(500),
    admin
      .from("profiles")
      .select("id,full_name,role,account_status")
      .in("role", ["recruiter", "admin"])
      .eq("account_status", "active")
      .order("full_name")
  ]);

  const leadRows = leads || [];
  const leadIds = leadRows.map((lead: any) => lead.id);
  const { data: activity } = leadIds.length
    ? await admin
        .from("recruiter_activity")
        .select("id,subject_id,action,description,created_at")
        .eq("subject_type", "lead")
        .in("subject_id", leadIds)
        .or("action.like.client_contact_%,action.eq.client_followup_sent")
        .order("created_at", { ascending: false })
        .limit(2000)
    : { data: [] as any[] };

  const latestByLead = new Map<string, any>();
  const countByLead = new Map<string, number>();
  for (const row of activity || []) {
    countByLead.set(row.subject_id, (countByLead.get(row.subject_id) || 0) + 1);
    if (!latestByLead.has(row.subject_id)) latestByLead.set(row.subject_id, row);
  }

  const ownerMap = new Map((owners || []).map((owner: any) => [owner.id, owner.full_name || (owner.role === "admin" ? "Admin" : "Recruiter")]));
  const now = Date.now();
  const next24h = now + 24 * 60 * 60 * 1000;
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0,0,0,0);

  const needsFirstContact = leadRows.filter((lead: any) => (lead.crm_stage || "new") === "new" && !lead.first_contact_at).length;
  const followUpsDue = leadRows.filter((lead: any) => isOpenLeadStage(lead.crm_stage) && lead.next_follow_up_at && new Date(lead.next_follow_up_at).getTime() <= now).length;
  const discoveryBooked = leadRows.filter((lead: any) => lead.crm_stage === "discovery_booked").length;
  const qualifiedCount = leadRows.filter((lead: any) => ["qualified","shortlist_sent"].includes(lead.crm_stage)).length;
  const wonThisMonth = leadRows.filter((lead: any) => lead.crm_stage === "won" && lead.won_at && new Date(lead.won_at).getTime() >= monthStart.getTime()).length;
  const openPipelineValue = leadRows
    .filter((lead: any) => isOpenLeadStage(lead.crm_stage))
    .reduce((sum: number, lead: any) => sum + Number(lead.estimated_value_usd || 0), 0);

  const view = params.view || "attention";
  const q = String(params.q || "").trim().toLowerCase();
  const ownerFilter = String(params.owner || "");
  const visible = leadRows.filter((lead: any) => {
    const stage = lead.crm_stage || "new";
    const followAt = lead.next_follow_up_at ? new Date(lead.next_follow_up_at).getTime() : null;
    const matchesView =
      view === "attention" ? isOpenLeadStage(stage) && (stage === "new" || Boolean(followAt && followAt <= next24h)) :
      view === "open" ? isOpenLeadStage(stage) && stage !== "nurture" :
      view === "discovery" ? stage === "discovery_booked" :
      view === "qualified" ? ["qualified","shortlist_sent"].includes(stage) :
      view === "nurture" ? stage === "nurture" :
      view === "won" ? stage === "won" :
      view === "lost" ? stage === "lost" :
      true;
    if (!matchesView) return false;
    if (ownerFilter && String(lead.owner_id || "") !== ownerFilter) return false;
    if (q) {
      const haystack = [lead.name, lead.email, lead.company, lead.service, lead.message].map((x) => String(x || "").toLowerCase()).join(" ");
      if (!haystack.includes(q)) return false;
    }
    return true;
  }).sort((a: any, b: any) => {
    const priority = (lead: any) => {
      const stage = lead.crm_stage || "new";
      const age = now - new Date(lead.created_at).getTime();
      const followAt = lead.next_follow_up_at ? new Date(lead.next_follow_up_at).getTime() : null;
      if (stage === "new" && !lead.first_contact_at && age > 30 * 60000) return 0;
      if (followAt && followAt < now && isOpenLeadStage(stage)) return 1;
      if (stage === "new") return 2;
      if (followAt && followAt <= next24h && isOpenLeadStage(stage)) return 3;
      return 4;
    };
    return priority(a) - priority(b) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const viewTabs = [
    ["attention", "Attention"],
    ["open", "Open pipeline"],
    ["discovery", "Discovery"],
    ["qualified", "Qualified"],
    ["nurture", "Nurture"],
    ["won", "Won"],
    ["lost", "Lost"],
    ["all", "All"]
  ] as const;

  const currentParams = new URLSearchParams();
  if (view) currentParams.set("view", view);
  if (params.q) currentParams.set("q", params.q);
  if (params.owner) currentParams.set("owner", params.owner);
  const returnTo = `/workspace/recruiter/leads?${currentParams.toString()}`;

  return (
    <>
      {params.crm_saved ? <div className="success-banner">Lead CRM updated.</div> : null}
      {params.contact_sent ? <div className="success-banner">Client follow-up email sent, logged, and the follow-up clock was updated.</div> : null}
      {params.contact_error ? <div className="alert" role="alert">{params.contact_error}</div> : null}
      {params.crm_error ? <div className="alert" role="alert">{params.crm_error}</div> : null}

      <div className="page-head">
        <div>
          <div className="kicker">Sales CRM</div>
          <h1>Client leads</h1>
          <p>Reply fast, always know the next follow-up, and keep every opportunity moving toward a decision.</p>
        </div>
        <div className="small muted">First-response target: <strong>30 minutes</strong></div>
      </div>

      <div className="crm-metrics">
        <Link href="/workspace/recruiter/leads?view=attention" className="card crm-metric-card"><Clock3 size={18}/><span>Needs first contact</span><strong>{needsFirstContact}</strong><small>Reply before they keep shopping</small></Link>
        <Link href="/workspace/recruiter/leads?view=attention" className="card crm-metric-card"><CalendarClock size={18}/><span>Follow-ups due</span><strong>{followUpsDue}</strong><small>Overdue or due now</small></Link>
        <Link href="/workspace/recruiter/leads?view=discovery" className="card crm-metric-card"><UserRound size={18}/><span>Discovery booked</span><strong>{discoveryBooked}</strong><small>Calls that can become qualified</small></Link>
        <Link href="/workspace/recruiter/leads?view=qualified" className="card crm-metric-card"><CheckCircle2 size={18}/><span>Qualified</span><strong>{qualifiedCount}</strong><small>Move these toward a proposal</small></Link>
        <Link href="/workspace/recruiter/leads?view=won" className="card crm-metric-card"><DollarSign size={18}/><span>Won this month</span><strong>{wonThisMonth}</strong><small>Closed client opportunities</small></Link>
        <div className="card crm-metric-card"><DollarSign size={18}/><span>Open pipeline value</span><strong>{usd(openPipelineValue)}</strong><small>Estimated value across open leads</small></div>
      </div>

      <div className="role-filter-tabs crm-tabs">
        {viewTabs.map(([value,label]) => <Link key={value} className={view === value ? "active" : ""} href={`/workspace/recruiter/leads?view=${value}`}>{label}</Link>)}
      </div>

      <form method="get" className="recruiter-filter-panel crm-filter-panel">
        <input type="hidden" name="view" value={view}/>
        <div className="directory-filter-search"><Search size={16}/><input name="q" defaultValue={params.q} placeholder="Search name, company, email, need"/></div>
        <select name="owner" defaultValue={ownerFilter}>
          <option value="">All owners</option>
          {(owners || []).map((owner: any) => <option key={owner.id} value={owner.id}>{owner.full_name || owner.role}</option>)}
        </select>
        <button className="btn btn-primary" type="submit">Filter</button>
        <Link className="btn" href={`/workspace/recruiter/leads?view=${view}`}>Reset</Link>
      </form>

      <div className="row-between wrap crm-results-head">
        <span className="small muted"><strong>{visible.length}</strong> lead{visible.length === 1 ? "" : "s"} in this view</span>
        {view === "attention" ? <span className="small muted">Sorted by missed SLA, overdue follow-up, then newest lead.</span> : null}
      </div>

      <div className="stack crm-lead-list">
        {visible.length ? visible.map((lead: any) => {
          const stage = lead.crm_stage || "new";
          const latest = latestByLead.get(lead.id);
          const contactCount = countByLead.get(lead.id) || 0;
          const receivedAge = now - new Date(lead.created_at).getTime();
          const slaMissed = stage === "new" && !lead.first_contact_at && receivedAge > 30 * 60000;
          const followTime = lead.next_follow_up_at ? new Date(lead.next_follow_up_at).getTime() : null;
          const followOverdue = Boolean(followTime && followTime < now && isOpenLeadStage(stage));
          const response = responseLabel(lead.created_at, lead.first_contact_at);
          const emailSubject = `Your VirtualAssistant.com.ph enquiry${lead.service ? ` - ${lead.service}` : ""}`;
          const firstName = String(lead.name || "there").trim().split(/\s+/)[0] || "there";

          return <article className={`card crm-lead-card ${slaMissed || followOverdue ? "needs-attention" : ""}`} key={lead.id}>
            <div className="crm-lead-head">
              <div>
                <div className="row wrap">
                  <span className={`badge ${stage === "won" ? "badge-success" : stage === "new" || followOverdue ? "badge-warning" : ""}`}>{leadStageLabel(stage)}</span>
                  {slaMissed ? <span className="badge badge-warning">30-min SLA missed</span> : null}
                  {followOverdue ? <span className="badge badge-warning">Follow-up overdue</span> : null}
                  {lead.job_id ? <span className="badge badge-success">Role linked</span> : null}
                </div>
                <h2>{lead.name || lead.email}</h2>
                <div className="small muted">{lead.company || lead.email} · {lead.service || "Virtual Assistant support"}</div>
              </div>
              <div className="crm-lead-meta">
                <span><Clock3 size={14}/> Received {ageLabel(lead.created_at)}</span>
                <span><UserRound size={14}/> {lead.owner_id ? ownerMap.get(lead.owner_id) || "Assigned" : "Unassigned"}</span>
                <span><DollarSign size={14}/> {lead.estimated_value_usd ? usd(Number(lead.estimated_value_usd)) : "Value not set"}</span>
              </div>
            </div>

            <div className="crm-lead-body">
              <section className="crm-client-context">
                <h3>What they need</h3>
                <p>{lead.message || "No additional message provided."}</p>
                <div className="small muted">Source: {lead.source_page || "Website enquiry"} · Received {dateShort(lead.created_at)}</div>
                <div className="crm-contact-summary">
                  <div><strong>First response</strong><span>{response || (slaMissed ? "Over target" : "Waiting")}</span></div>
                  <div><strong>Last contact</strong><span>{lead.last_contact_at ? dateShort(lead.last_contact_at) : "None yet"}</span></div>
                  <div><strong>Next follow-up</strong><span className={followOverdue ? "crm-overdue" : ""}>{lead.next_follow_up_at ? dateShort(lead.next_follow_up_at) : "Not scheduled"}</span></div>
                </div>
                {latest ? <div className="crm-latest-contact"><strong>{activityLabel(latest.action)}</strong><span>{dateShort(latest.created_at)}{contactCount > 1 ? ` · ${contactCount} contact updates` : ""}</span>{latest.description ? <small>{latest.description}</small> : null}</div> : null}
                {lead.job_id ? <Link className="btn btn-sm" href={`/workspace/recruiter/matching/${lead.job_id}`}>Open linked role</Link> : null}
              </section>

              <form action={updateLeadCrmAction} className="crm-update-card">
                <input type="hidden" name="lead_id" value={lead.id}/>
                <input type="hidden" name="return_to" value={returnTo}/>
                <div className="crm-form-head"><strong>Next sales move</strong><span className="small muted">Keep this current so nobody has to remember it.</span></div>
                <div className="grid-2">
                  <div className="field"><label>Stage</label><select name="crm_stage" defaultValue={stage}>{LEAD_CRM_STAGES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
                  <div className="field"><label>Owner</label><select name="owner_id" defaultValue={lead.owner_id || ""}><option value="">Unassigned</option>{(owners || []).map((owner: any) => <option key={owner.id} value={owner.id}>{owner.full_name || owner.role}</option>)}</select></div>
                  <div className="field"><label>Next follow-up</label><input type="date" name="next_follow_up_at" defaultValue={dateInput(lead.next_follow_up_at)}/></div>
                  <div className="field"><label>Est. value, USD</label><input type="number" min="0" step="50" name="estimated_value_usd" defaultValue={lead.estimated_value_usd ?? ""} placeholder="1500"/></div>
                </div>
                <div className="field"><label>Lost reason <span className="muted">(required only for Lost)</span></label><input name="lost_reason" maxLength={1000} defaultValue={lead.lost_reason || ""} placeholder="Budget, timing, hired elsewhere, no response..."/></div>
                <button className="btn btn-primary" type="submit">Save CRM update</button>
              </form>
            </div>

            <div className="crm-contact-bar">
              <div className="row wrap">
                <a className="btn btn-sm" href={`mailto:${lead.email}?subject=${encodeURIComponent(emailSubject)}`}><Mail size={14}/> Email</a>
                {lead.phone ? <a className="btn btn-sm" href={`tel:${String(lead.phone).replace(/[^+\d]/g, "")}`}><Phone size={14}/> Call</a> : null}
                <form action={recordLeadContactAction}><input type="hidden" name="lead_id" value={lead.id}/><input type="hidden" name="contact_type" value="email"/><button className="btn btn-sm" type="submit">Mark emailed</button></form>
                {lead.phone ? <form action={recordLeadContactAction}><input type="hidden" name="lead_id" value={lead.id}/><input type="hidden" name="contact_type" value="call"/><button className="btn btn-sm" type="submit">Mark called</button></form> : null}
                <form action={recordLeadContactAction}><input type="hidden" name="lead_id" value={lead.id}/><input type="hidden" name="contact_type" value="meeting"/><button className="btn btn-sm" type="submit">Meeting done</button></form>
              </div>

              <div className="row wrap">
                <details className="staff-followup-details">
                  <summary className="btn btn-sm btn-primary">Send follow-up</summary>
                  <form action={sendClientFollowupAction} className="stack staff-followup-form">
                    <input type="hidden" name="lead_id" value={lead.id}/>
                    <input type="hidden" name="return_to" value={returnTo}/>
                    <div className="field"><label>Subject</label><input name="subject" required minLength={3} maxLength={180} defaultValue={emailSubject}/></div>
                    <div className="field"><label>Message</label><textarea name="message" required minLength={10} maxLength={5000} defaultValue={`Hi ${firstName},\n\nThanks for your VirtualAssistant.com.ph request. I wanted to follow up so we can confirm what you need, your timeline, and the best next step.`}/></div>
                    <button className="btn btn-primary" type="submit">Send and log email</button>
                  </form>
                </details>
                <form action={recordLeadContactAction} className="row wrap">
                  <input type="hidden" name="lead_id" value={lead.id}/>
                  <input type="hidden" name="contact_type" value="follow_up"/>
                  <input name="note" maxLength={1000} placeholder="Add private follow-up note" aria-label="Follow-up note"/>
                  <button className="btn btn-sm" type="submit">Save note</button>
                </form>
              </div>
            </div>
          </article>;
        }) : <div className="card empty"><h3>Nothing needs attention here.</h3><p>Change the filter or move on to the next recruiter queue.</p></div>}
      </div>
    </>
  );
}
