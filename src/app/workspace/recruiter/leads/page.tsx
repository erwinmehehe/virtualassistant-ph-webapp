import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { dateShort } from "@/lib/format";
import { recordLeadContactAction } from "@/app/actions/recruiter";

function activityLabel(action: string) {
  const labels: Record<string, string> = {
    client_contact_email: "Emailed",
    client_contact_call: "Called",
    client_contact_meeting: "Meeting",
    client_contact_follow_up: "Follow-up"
  };
  return labels[action] || action.replaceAll("_", " ");
}

export default async function RecruiterLeadsPage() {
  await requireRole("recruiter");
  const admin = createAdminClient();
  const { data: leads } = await admin
    .from("lead_intake")
    .select("id,name,email,phone,company,service,status,job_id,created_at,message")
    .order("created_at", { ascending: false })
    .limit(100);

  const leadIds = (leads || []).map((lead: any) => lead.id);
  const { data: activity } = leadIds.length
    ? await admin
        .from("recruiter_activity")
        .select("id,subject_id,action,description,created_at")
        .eq("subject_type", "lead")
        .in("subject_id", leadIds)
        .like("action", "client_contact_%")
        .order("created_at", { ascending: false })
        .limit(500)
    : { data: [] as any[] };

  const latestByLead = new Map<string, any>();
  const countByLead = new Map<string, number>();
  for (const row of activity || []) {
    countByLead.set(row.subject_id, (countByLead.get(row.subject_id) || 0) + 1);
    if (!latestByLead.has(row.subject_id)) latestByLead.set(row.subject_id, row);
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Client leads</h1>
          <p>Contact new hiring enquiries quickly, keep the follow-up history here, then move qualified roles into candidate matching.</p>
        </div>
      </div>

      <div className="table-wrap responsive-table">
        <table>
          <thead>
            <tr>
              <th>Lead</th>
              <th>Need</th>
              <th>Status</th>
              <th>Received</th>
              <th>Contact client</th>
              <th>Follow-up</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(leads || []).map((lead: any) => {
              const latest = latestByLead.get(lead.id);
              const contactCount = countByLead.get(lead.id) || 0;
              const emailSubject = `Your VirtualAssistant.com.ph enquiry${lead.service ? ` - ${lead.service}` : ""}`;
              return (
                <tr key={lead.id}>
                  <td data-label="Lead">
                    <strong>{lead.name || lead.email}</strong>
                    <div className="small muted">{lead.company || lead.email}</div>
                  </td>
                  <td data-label="Need">
                    {lead.service || "Virtual Assistant support"}
                    <div className="small muted clamp-2">{lead.message || ""}</div>
                  </td>
                  <td data-label="Status">
                    <span className={`badge ${lead.status === "new" ? "badge-warning" : lead.status === "converted" ? "badge-success" : ""}`}>{lead.status}</span>
                  </td>
                  <td data-label="Received">{dateShort(lead.created_at)}</td>
                  <td data-label="Contact client">
                    <div className="stack" style={{ gap: 8 }}>
                      <div className="row wrap">
                        <a className="btn btn-sm" href={`mailto:${lead.email}?subject=${encodeURIComponent(emailSubject)}`}><Mail size={14}/> Email</a>
                        {lead.phone ? <a className="btn btn-sm" href={`tel:${String(lead.phone).replace(/[^+\\d]/g, "")}`}><Phone size={14}/> Call</a> : null}
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
                      </div>
                    </div>
                  </td>
                  <td data-label="Follow-up">
                    {latest ? (
                      <div>
                        <strong className="small">{activityLabel(latest.action)}</strong>
                        <div className="small muted">{dateShort(latest.created_at)}{contactCount > 1 ? ` · ${contactCount} updates` : ""}</div>
                        {latest.description ? <div className="small muted clamp-2">{latest.description}</div> : null}
                      </div>
                    ) : <span className="small muted">No contact logged yet</span>}
                    <form action={recordLeadContactAction} className="row wrap" style={{ marginTop: 8 }}>
                      <input type="hidden" name="lead_id" value={lead.id}/>
                      <input type="hidden" name="contact_type" value="follow_up"/>
                      <input name="note" maxLength={1000} placeholder="Add follow-up note" aria-label="Follow-up note"/>
                      <button className="btn btn-sm" type="submit">Save</button>
                    </form>
                  </td>
                  <td data-label="Action">
                    {lead.job_id
                      ? <Link className="btn btn-sm btn-primary" href={`/workspace/recruiter/matching/${lead.job_id}`}>Match role</Link>
                      : <span className="small muted">Awaiting job conversion</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
