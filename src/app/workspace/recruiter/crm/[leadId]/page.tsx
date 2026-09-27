import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarClock,
  Check,
  Clock3,
  ListTodo,
  MessageSquareText,
  Phone,
  UserRound,
} from "lucide-react";
import { requireRoleFast } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { LEAD_CRM_STAGES, leadStageLabel } from "@/lib/lead-crm";
import { dateInputValue as dateInput } from "@/lib/format";
import { updateLeadCrmAction, addRecruiterNoteAction, recordLeadContactAction } from "@/app/actions/recruiter";
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
  crm_stage: string | null;
  owner_id: string | null;
  next_follow_up_at: string | null;
  estimated_value_usd: number | null;
  lost_reason: string | null;
  first_contact_at: string | null;
  last_contact_at: string | null;
  stage_updated_at: string | null;
  discovery_scheduled_at: string | null;
  discovery_completed_at: string | null;
  discovery_outcome: string | null;
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
  await requireRoleFast("recruiter");
  const admin = createAdminClient();

  const { data: leadData, error: leadError } = await admin
    .from("lead_intake")
    .select("id,name,email,phone,company,service,hours,budget,timezone,start_time,message,source_page,page_url,client_id,job_id,crm_stage,owner_id,next_follow_up_at,estimated_value_usd,lost_reason,first_contact_at,last_contact_at,stage_updated_at,discovery_scheduled_at,discovery_completed_at,discovery_outcome,created_at,lead_type")
    .eq("id", leadId)
    .eq("lead_type", "client_hiring")
    .maybeSingle();
  if (leadError) throw leadError;
  if (!leadData) notFound();
  const lead = leadData as Lead;

  const [jobResult, ownersResult, activityResult, notesResult, tasksResult] = await Promise.all([
    lead.job_id
      ? admin.from("jobs").select("id,title,company_name,status,hiring_stage,hours_per_week,min_hourly_rate,max_hourly_rate,timezone").eq("id", lead.job_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    admin.from("profiles").select("id,full_name,role,account_status").in("role", ["recruiter", "admin"]).eq("account_status", "active").order("full_name"),
    admin.from("recruiter_activity").select("id,action,description,created_at").eq("subject_type", "lead").eq("subject_id", leadId).order("created_at", { ascending: false }).limit(60),
    admin.from("recruiter_notes").select("id,note,created_at").eq("subject_type", "lead").eq("subject_id", leadId).order("created_at", { ascending: false }).limit(20),
    admin.from("recruiter_tasks").select("id,title,description,priority,status,due_at").eq("subject_type", "lead").eq("subject_id", leadId).order("created_at", { ascending: false }).limit(20),
  ]);
  if (jobResult.error) throw jobResult.error;
  if (ownersResult.error) throw ownersResult.error;
  if (activityResult.error) throw activityResult.error;
  if (notesResult.error) throw notesResult.error;
  if (tasksResult.error) throw tasksResult.error;

  const job = jobResult.data as Job | null;
  const owners = (ownersResult.data || []) as Owner[];
  const activities = (activityResult.data || []) as Activity[];
  const notes = (notesResult.data || []) as Note[];
  const tasks = (tasksResult.data || []) as Task[];
  const returnTo = `/workspace/recruiter/crm/${lead.id}`;
  const initial = (lead.name || lead.company || lead.email || "?").slice(0, 1).toUpperCase();

  return (
    <div className={styles.detailPage}>
      {query.crm_saved ? <div className="success-banner">CRM record updated.</div> : null}
      {query.crm_error ? <div className="alert" role="alert">{query.crm_error}</div> : null}
      {query.note_saved ? <div className="success-banner">Private note added.</div> : null}
      {query.task_saved ? <div className="success-banner">Task created.</div> : null}
      {query.task_error ? <div className="alert" role="alert">{query.task_error}</div> : null}

      <Link className={styles.detailBack} href="/workspace/recruiter/crm"><ArrowLeft size={14}/> Back to CRM</Link>

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
          <Link className={styles.secondaryButton} href="/workspace/recruiter/leads"><UserRound size={15}/> Operations inbox</Link>
        </div>
      </header>

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

          {job ? (
            <section className={styles.panel}>
              <div className={styles.panelHead}><h2>Relationship</h2><span className={styles.muted}>Linked VAPH object</span></div>
              <div className={styles.panelBody}>
                <Link className={styles.linkedRole} href={`/workspace/recruiter/roles/${job.id}`}>
                  <span>
                    <strong>{job.title || "Virtual Assistant role"}</strong>
                    <small>{job.company_name || lead.company || "Client"} · {String(job.hiring_stage || "intake").replaceAll("_", " ")} · {job.status || "pending"}</small>
                  </span>
                  <BriefcaseBusiness size={17}/>
                </Link>
              </div>
            </section>
          ) : null}

          <section className={styles.panel}>
            <div className={styles.panelHead}><h2>Activity</h2><span className={styles.muted}>{activities.length} events</span></div>
            <div className={styles.panelBody}>
              {activities.length ? <div className={styles.timeline}>{activities.map((item) => (
                <div className={styles.timelineItem} key={item.id}>
                  <span className={styles.timelineDot}/>
                  <div>
                    <strong>{activityTitle(item.action)}</strong>
                    {item.description ? <p>{item.description}</p> : null}
                    <time>{fmt(item.created_at, true)}</time>
                  </div>
                </div>
              ))}</div> : <div className={styles.empty}>No activity recorded yet.</div>}
            </div>
          </section>

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
          <section className={styles.panel}>
            <div className={styles.panelHead}><h2>Properties</h2><span className={styles.muted}>CRM fields</span></div>
            <div className={styles.panelBody}>
              <form action={updateLeadCrmAction} className={styles.form}>
                <input type="hidden" name="lead_id" value={lead.id}/>
                <input type="hidden" name="return_to" value={returnTo}/>
                <label>Stage<select name="crm_stage" defaultValue={lead.crm_stage || "new"}>{LEAD_CRM_STAGES.map((stage) => <option key={stage.value} value={stage.value}>{stage.label}</option>)}</select></label>
                <label>Owner<select name="owner_id" defaultValue={lead.owner_id || ""}><option value="">Unassigned</option>{owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.full_name || owner.role}</option>)}</select></label>
                <label>Next follow-up<input type="date" name="next_follow_up_at" defaultValue={dateInput(lead.next_follow_up_at)}/></label>
                <label>Estimated value (USD)<input type="number" name="estimated_value_usd" min="0" step="1" defaultValue={lead.estimated_value_usd ?? ""}/></label>
                <label>Lost reason<input name="lost_reason" defaultValue={lead.lost_reason || ""} placeholder="Required only when stage is Lost"/></label>
                <button type="submit">Save properties</button>
              </form>
            </div>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHead}><h2>Contact</h2><Phone size={15}/></div>
            <div className={styles.panelBody}>
              <div className={styles.contactList}>
                <div><span>Email</span>{lead.email ? <a href={`mailto:${lead.email}`}>{lead.email}</a> : <strong>—</strong>}</div>
                <div><span>Phone</span>{lead.phone ? <a href={`tel:${lead.phone}`}>{lead.phone}</a> : <strong>—</strong>}</div>
                <div><span>Client account</span><strong>{lead.client_id ? "Connected" : "Not activated"}</strong></div>
                <div><span>Last touch</span><strong>{fmt(lead.last_contact_at || lead.first_contact_at, true)}</strong></div>
                <div><span>Discovery</span><strong>{lead.discovery_completed_at ? `Completed · ${lead.discovery_outcome || "outcome not set"}` : lead.discovery_scheduled_at ? fmt(lead.discovery_scheduled_at, true) : "Not booked"}</strong></div>
              </div>
              <form action={recordLeadContactAction} className={styles.form} style={{ marginTop: 12 }}>
                <input type="hidden" name="lead_id" value={lead.id}/>
                <label>Log interaction<select name="contact_type" defaultValue="call"><option value="call">Call</option><option value="meeting">Meeting</option><option value="follow_up">Follow-up</option></select></label>
                <label>Note<input name="note" maxLength={1000} placeholder="What happened?"/></label>
                <button type="submit">Log client touch</button>
              </form>
            </div>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHead}><h2>Tasks</h2><ListTodo size={15}/></div>
            <div className={styles.panelBody}>
              <form action={createRecruiterTaskAction} className={styles.form}>
                <input type="hidden" name="subject_type" value="lead"/>
                <input type="hidden" name="subject_id" value={lead.id}/>
                <input type="hidden" name="href" value={returnTo}/>
                <input type="hidden" name="return_to" value={returnTo}/>
                <label>Task<input name="title" required minLength={3} maxLength={180} placeholder="Follow up with client"/></label>
                <label>Due<input type="datetime-local" name="due_at"/></label>
                <label>Priority<select name="priority" defaultValue="normal"><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></label>
                <button type="submit">Create task</button>
              </form>
              <div style={{ marginTop: 12 }} className="stack">
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
                )) : <div className={styles.muted}>No open tasks for this lead.</div>}
              </div>
            </div>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHead}><h2>Dates</h2><Clock3 size={15}/></div>
            <div className={styles.panelBody}>
              <div className={styles.contactList}>
                <div><span>Created</span><strong>{fmt(lead.created_at, true)}</strong></div>
                <div><span>Stage updated</span><strong>{fmt(lead.stage_updated_at, true)}</strong></div>
                <div><span>Next follow-up</span><strong>{fmt(lead.next_follow_up_at, true)}</strong></div>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
