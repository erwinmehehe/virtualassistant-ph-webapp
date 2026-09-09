import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { convertLeadToJobAction } from "@/app/actions/admin";
import { recordLeadContactAction, sendClientFollowupAction, updateLeadStatusAction } from "@/app/actions/recruiter";
import { dateShort } from "@/lib/format";

function leadStatusLabel(status: string) {
  if (status === "converted") return "qualified";
  return status;
}

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

export default async function AdminLeadsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  await requireRole("admin");
  const admin = createAdminClient();
  const [{ data: leads }, { data: clients }] = await Promise.all([
    admin.from("lead_intake").select("*").order("created_at", { ascending: false }).limit(100),
    admin.from("profiles").select("id,full_name,client_profiles(company_name)").eq("role", "client").order("full_name")
  ]);

  const leadIds = (leads || []).map((lead: any) => lead.id);
  const { data: activity } = leadIds.length
    ? await admin
        .from("recruiter_activity")
        .select("id,subject_id,action,description,created_at")
        .eq("subject_type", "lead")
        .in("subject_id", leadIds)
        .or("action.like.client_contact_%,action.eq.client_followup_sent")
        .order("created_at", { ascending: false })
        .limit(500)
    : { data: [] as any[] };

  const latestByLead = new Map<string, any>();
  const countByLead = new Map<string, number>();
  for (const row of activity || []) {
    countByLead.set(row.subject_id, (countByLead.get(row.subject_id) || 0) + 1);
    if (!latestByLead.has(row.subject_id)) latestByLead.set(row.subject_id, row);
  }

  const leadRows = leads || [];
  const needsFirstContact = leadRows.filter((lead: any) => lead.status === "new" && !latestByLead.has(lead.id)).length;
  const contactedOpen = leadRows.filter((lead: any) => lead.status === "new" && latestByLead.has(lead.id)).length;
  const qualifiedCount = leadRows.filter((lead: any) => lead.status === "converted").length;
  const archivedCount = leadRows.filter((lead: any) => lead.status === "archived").length;
  const orderedLeads = [...leadRows].sort((a: any, b: any) => {
    const rank = (lead: any) => lead.status === "new"
      ? (latestByLead.has(lead.id) ? 1 : 0)
      : lead.status === "converted" ? 2 : 3;
    return rank(a) - rank(b) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <>
      {params.contact_sent ? <div className="success-banner">Client follow-up email sent and logged.</div> : null}
      {params.contact_error ? <div className="alert" role="alert">{params.contact_error}</div> : null}

      <div className="page-head">
        <div>
          <h1>Lead inbox</h1>
          <p>Contact new enquiries, record the follow-up, and move qualified requests into candidate matching when the client is ready.</p>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 18 }}>
        <div className="card"><span className="small muted">Needs first contact</span><strong style={{ display: "block", fontSize: 28, marginTop: 4 }}>{needsFirstContact}</strong></div>
        <div className="card"><span className="small muted">Contacted, still open</span><strong style={{ display: "block", fontSize: 28, marginTop: 4 }}>{contactedOpen}</strong></div>
        <div className="card"><span className="small muted">Qualified</span><strong style={{ display: "block", fontSize: 28, marginTop: 4 }}>{qualifiedCount}</strong></div>
        <div className="card"><span className="small muted">Archived</span><strong style={{ display: "block", fontSize: 28, marginTop: 4 }}>{archivedCount}</strong></div>
      </div>

      <div className="stack">
        {orderedLeads.length ? orderedLeads.map((lead: any) => {
          const latest = latestByLead.get(lead.id);
          const contactCount = countByLead.get(lead.id) || 0;
          const emailSubject = `Your VirtualAssistant.com.ph enquiry${lead.service ? ` - ${lead.service}` : ""}`;
          const firstName = String(lead.name || "there").trim().split(/\s+/)[0] || "there";

          return (
            <div className="card" key={lead.id}>
              <div className="row-between wrap">
                <div>
                  <div className="row wrap">
                    <span className="badge">{leadStatusLabel(lead.status)}</span>
                    <span className="small muted">{dateShort(lead.created_at)}</span>
                    {lead.job_id ? <span className="badge badge-success">Job draft created</span> : null}
                  </div>
                  <h3 style={{ margin: "8px 0 3px" }}>{lead.service || "Virtual Assistant request"}</h3>
                  <div className="small muted">{lead.company || lead.name || "Lead"} · {lead.hours || "Hours not set"} · {lead.timezone || "Timezone not set"}</div>
                  {lead.status === "new" && !latestByLead.has(lead.id) ? <div style={{ marginTop: 6 }}><span className="badge badge-warning">Needs first contact</span></div> : null}
                </div>

                <div className="row wrap">
                  <a className="btn btn-sm" href={`mailto:${lead.email}?subject=${encodeURIComponent(emailSubject)}`}><Mail size={14}/> Email client</a>
                  {lead.phone ? <a className="btn btn-sm" href={`tel:${String(lead.phone).replace(/[^+\d]/g, "")}`}><Phone size={14}/> Call</a> : null}
                  {lead.job_id
                    ? <Link className="btn btn-sm" href={`/workspace/admin/jobs/${lead.job_id}`}>Open job draft</Link>
                    : lead.status === "new"
                      ? <form action={convertLeadToJobAction} className="row wrap">
                          <input type="hidden" name="lead_id" value={lead.id}/>
                          <select name="client_id" style={{ border: "1px solid var(--line)", borderRadius: 8, padding: "8px 9px" }}>
                            <option value="">No client account yet</option>
                            {(clients || []).map((c: any) => <option key={c.id} value={c.id}>{c.client_profiles?.company_name || c.full_name || c.id}</option>)}
                          </select>
                          <button className="btn btn-primary btn-sm" type="submit">Create pending job</button>
                        </form>
                      : null}
                </div>
              </div>

              <p>{lead.message || "No message provided."}</p>
              <div className="small muted">
                <strong>Private contact:</strong> {lead.name || ""} · <a className="text-link" href={`mailto:${lead.email}`}>{lead.email}</a>
                {lead.phone ? <> · <a className="text-link" href={`tel:${String(lead.phone).replace(/[^+\d]/g, "")}`}>{lead.phone}</a></> : null}
              </div>

              <div className="row-between wrap" style={{ marginTop: 14, gap: 12 }}>
                <div className="small">
                  <strong>Latest client contact:</strong>{" "}
                  {latest ? <>{activityLabel(latest.action)} · {dateShort(latest.created_at)}{contactCount > 1 ? ` · ${contactCount} updates` : ""}{latest.description ? <> · <span className="muted">{latest.description}</span></> : null}</> : <span className="muted">None logged yet</span>}
                </div>

                <div className="row wrap">
                  <form action={recordLeadContactAction}>
                    <input type="hidden" name="lead_id" value={lead.id}/>
                    <input type="hidden" name="contact_type" value="email"/>
                    <button className="btn btn-sm" type="submit">Mark emailed</button>
                  </form>

                  {lead.phone ? <form action={recordLeadContactAction}>
                    <input type="hidden" name="lead_id" value={lead.id}/>
                    <input type="hidden" name="contact_type" value="call"/>
                    <button className="btn btn-sm" type="submit">Mark called</button>
                  </form> : null}

                  <details className="staff-followup-details">
                    <summary className="btn btn-sm btn-primary">Send email</summary>
                    <form action={sendClientFollowupAction} className="stack staff-followup-form">
                      <input type="hidden" name="lead_id" value={lead.id}/>
                      <input type="hidden" name="return_to" value="/workspace/admin/leads"/>
                      <div className="field"><label>Subject</label><input name="subject" required minLength={3} maxLength={180} defaultValue={emailSubject}/></div>
                      <div className="field"><label>Message</label><textarea name="message" required minLength={10} maxLength={5000} defaultValue={`Hi ${firstName},\n\nThanks for your VirtualAssistant.com.ph request. I am following up so we can confirm the priorities and agree the best next step.`}/></div>
                      <button className="btn btn-primary" type="submit">Send and log email</button>
                    </form>
                  </details>

                  <form action={recordLeadContactAction} className="row wrap">
                    <input type="hidden" name="lead_id" value={lead.id}/>
                    <input type="hidden" name="contact_type" value="follow_up"/>
                    <input name="note" maxLength={1000} placeholder="Follow-up note" aria-label="Follow-up note"/>
                    <button className="btn btn-sm" type="submit">Save note</button>
                  </form>

                  <form action={updateLeadStatusAction}>
                    <input type="hidden" name="lead_id" value={lead.id}/>
                    <input type="hidden" name="status" value={lead.status === "new" ? "converted" : lead.status === "converted" ? "archived" : "new"}/>
                    <button className="btn btn-sm" type="submit">{lead.status === "new" ? "Mark qualified" : lead.status === "converted" ? "Archive lead" : "Reopen lead"}</button>
                  </form>
                </div>
              </div>
            </div>
          );
        }) : <div className="card empty">No leads received yet.</div>}
      </div>
    </>
  );
}
