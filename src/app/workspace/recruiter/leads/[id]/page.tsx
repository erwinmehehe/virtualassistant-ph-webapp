import Link from "next/link";
import { notFound } from "next/navigation";
import { Mail, Phone, BriefcaseBusiness } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { addRecruiterNoteAction, sendClientFollowupAction } from "@/app/actions/recruiter";
import { dateShort } from "@/lib/format";

export default async function RecruiterLeadDetail({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  await requireRole("recruiter");
  const admin = createAdminClient();

  const [{ data: lead }, { data: notes }, { data: activity }] = await Promise.all([
    admin.from("lead_intake").select("*").eq("id", id).maybeSingle(),
    admin.from("recruiter_notes").select("id,note,created_at").eq("subject_type", "lead").eq("subject_id", id).order("created_at", { ascending: false }).limit(30),
    admin.from("recruiter_activity").select("id,action,description,created_at").eq("subject_type", "lead").eq("subject_id", id).order("created_at", { ascending: false }).limit(40)
  ]);

  if (!lead) notFound();

  const firstName = String(lead.name || "there").trim().split(/\s+/)[0] || "there";
  const service = lead.service || "Virtual Assistant support";
  const defaultSubject = `Following up on your Virtual Assistant request`;
  const defaultBody = `Hi ${firstName},

Thanks for reaching out about ${service}. I reviewed your request and wanted to follow up directly.

If you can share any must-have experience, schedule overlap, or tools that matter most, we can narrow the shortlist and recommend the strongest fits.

Best,
VirtualAssistant.com.ph Hiring Team`;
  const returnTo = `/workspace/recruiter/leads/${lead.id}`;

  return <>
    {query.contact_sent ? <div className="success-banner" role="status">Client email sent and logged in the lead timeline.</div> : null}
    {query.contact_error ? <div className="alert" role="alert">{query.contact_error}</div> : null}
    {query.note_saved ? <div className="success-banner" role="status">Private lead note saved.</div> : null}

    <div className="page-head">
      <div>
        <Link className="text-link small" href="/workspace/recruiter/leads">← Client leads</Link>
        <div className="row wrap" style={{ marginTop: 8 }}>
          <span className={`badge ${lead.status === "new" ? "badge-warning" : lead.status === "converted" ? "badge-success" : ""}`}>{lead.status}</span>
          <span className="small muted">Received {dateShort(lead.created_at)}</span>
        </div>
        <h1 style={{ marginTop: 8 }}>{lead.company || lead.name || lead.email}</h1>
        <p>{service}</p>
      </div>
      <div className="row wrap">
        {lead.job_id ? <Link className="btn btn-primary" href={`/workspace/recruiter/matching/${lead.job_id}`}><BriefcaseBusiness size={16}/> Open linked role</Link> : null}
        <a className="btn" href={`mailto:${lead.email}`}><Mail size={16}/> Open in email app</a>
      </div>
    </div>

    <div className="grid-2">
      <section className="card stack">
        <div>
          <div className="small muted">Client contact</div>
          <h2 style={{ margin: "4px 0 10px" }}>{lead.name || "Hiring contact"}</h2>
          <div className="stack" style={{ gap: 8 }}>
            <a className="text-link" href={`mailto:${lead.email}`}><Mail size={15}/> {lead.email}</a>
            {lead.phone ? <a className="text-link" href={`tel:${lead.phone}`}><Phone size={15}/> {lead.phone}</a> : <span className="small muted">No phone number provided.</span>}
          </div>
        </div>
        <div className="profile-facts">
          <div><span>Company</span><strong>{lead.company || "Not provided"}</strong></div>
          <div><span>Hours</span><strong>{lead.hours || "Not provided"}</strong></div>
          <div><span>Timezone</span><strong>{lead.timezone || "Not provided"}</strong></div>
          <div><span>Start timing</span><strong>{lead.start_time || "Not provided"}</strong></div>
          <div><span>Source</span><strong>{lead.source_page || "Unknown"}</strong></div>
        </div>
      </section>

      <section className="card stack">
        <div>
          <h2 style={{ marginTop: 0 }}>Email the client</h2>
          <p className="small muted">Send from the platform and keep the follow-up recorded in the recruiter timeline.</p>
        </div>
        <form action={sendClientFollowupAction} className="stack">
          <input type="hidden" name="lead_id" value={lead.id}/>
          <input type="hidden" name="return_to" value={returnTo}/>
          <div className="field">
            <label htmlFor="lead-email-subject">Subject</label>
            <input id="lead-email-subject" name="subject" required minLength={3} maxLength={160} defaultValue={defaultSubject}/>
          </div>
          <div className="field">
            <label htmlFor="lead-email-body">Message</label>
            <textarea id="lead-email-body" name="message" required minLength={10} maxLength={5000} rows={10} defaultValue={defaultBody}/>
          </div>
          <button className="btn btn-primary" type="submit"><Mail size={16}/> Send client email</button>
        </form>
      </section>
    </div>

    <section className="card" style={{ marginTop: 18 }}>
      <h2 style={{ marginTop: 0 }}>Hiring request</h2>
      <p style={{ whiteSpace: "pre-wrap" }}>{lead.message || "No request details were provided."}</p>
      {lead.page_url ? <a className="text-link small" href={lead.page_url} target="_blank" rel="noreferrer">Open source page</a> : null}
    </section>

    <div className="grid-2" style={{ marginTop: 18 }}>
      <section className="card">
        <h2 style={{ marginTop: 0 }}>Private recruiter notes</h2>
        <form action={addRecruiterNoteAction} className="stack">
          <input type="hidden" name="subject_type" value="lead"/>
          <input type="hidden" name="subject_id" value={lead.id}/>
          <input type="hidden" name="return_to" value={returnTo}/>
          <div className="field"><label htmlFor="lead-note">Add note</label><textarea id="lead-note" name="note" required minLength={2} maxLength={4000} placeholder="Client feedback, follow-up status, budget context, next step..."/></div>
          <button className="btn" type="submit">Save private note</button>
        </form>
        {notes?.length ? <div className="notes-list" style={{ marginTop: 16 }}>{notes.map((note: any) => <div className="note-card" key={note.id}><p>{note.note}</p><small>{dateShort(note.created_at)}</small></div>)}</div> : <div className="empty" style={{ marginTop: 16 }}>No private notes yet.</div>}
      </section>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Lead timeline</h2>
        {activity?.length ? <div className="timeline-list">{activity.map((row: any) => <div className="timeline-item" key={row.id}><span className="timeline-dot"/><div><strong>{String(row.action).replaceAll("_", " ")}</strong><p>{row.description || "Lead activity"}</p><small>{dateShort(row.created_at)}</small></div></div>)}</div> : <div className="empty">Client emails and recruiter actions will appear here.</div>}
      </section>
    </div>
  </>;
}
