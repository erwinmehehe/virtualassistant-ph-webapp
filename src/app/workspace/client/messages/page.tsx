import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { requireRoleFast } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getOrCreateClientRecruiterThread,
  getRecruiterClientMessages,
  markRecruiterClientMessagesRead,
} from "@/lib/recruiter-client-chat";
import { RecruiterClientChatPanel } from "@/components/recruiter-client-chat";
import pageStyles from "@/components/recruiter-client-chat-page.module.css";

export default async function ClientMessagesPage({ searchParams }: {
  searchParams: Promise<{ job?: string }>;
}) {
  const { userId } = await requireRoleFast("client");
  const admin = createAdminClient();
  const params = await searchParams;

  const { data: jobs, error: jobsError } = await admin
    .from("jobs")
    .select("id,title,status,updated_at")
    .eq("client_id", userId)
    .order("updated_at", { ascending: false });
  if (jobsError) throw jobsError;

  const requestedJob = params.job
    ? (jobs || []).find((job) => job.id === params.job) || null
    : null;
  const selectedJob = requestedJob || jobs?.[0] || null;
  const thread = await getOrCreateClientRecruiterThread(userId, selectedJob?.id || null);
  await markRecruiterClientMessagesRead(thread.id, userId);

  const [{ data: recruiter }, messages] = await Promise.all([
    thread.recruiter_id
      ? admin.from("profiles").select("full_name").eq("id", thread.recruiter_id).maybeSingle()
      : Promise.resolve({ data: null }),
    getRecruiterClientMessages(thread.id),
  ]);

  const recruiterLabel = recruiter?.full_name || "VirtualAssistant.com.ph recruiting team";

  return <div className={pageStyles.page}>
    <div className="page-head">
      <div>
        <div className="kicker">Private messages</div>
        <h1>Chat with your recruiter</h1>
        <p>Your recruiter is your point of contact throughout hiring. Virtual Assistants are never participants in this conversation.</p>
      </div>
      <span className={pageStyles.ruleBadge}><MessageCircle size={15}/> Recruiter ↔ client only</span>
    </div>

    {(jobs || []).length > 1 ? <div className="card" style={{ marginBottom: 16 }}>
      <strong>Choose hiring role</strong>
      <p className="small muted">Each role has its own conversation so feedback and decisions stay attached to the correct hire.</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {(jobs || []).map((job) => <Link
          className={selectedJob?.id === job.id ? "btn btn-primary" : "btn btn-secondary"}
          href={"/workspace/client/messages?job=" + encodeURIComponent(job.id)}
          key={job.id}
        >{job.title || "Hiring role"}</Link>)}
      </div>
    </div> : null}

    {selectedJob ? <div className={pageStyles.roleContext}>
      <div>
        <span className="small muted">Hiring role</span>
        <strong>{selectedJob.title || "This hiring role"}</strong>
        <small>Status: {String(selectedJob.status || "in progress").replaceAll("_", " ")}</small>
      </div>
      <Link className="btn btn-sm" href={"/workspace/client/jobs/" + encodeURIComponent(selectedJob.id)}>View hiring progress</Link>
    </div> : null}

    <RecruiterClientChatPanel
      viewerId={userId}
      threadId={thread.id}
      clientId={userId}
      counterpartLabel={recruiterLabel}
      messages={messages}
      returnTo={selectedJob ? "/workspace/client/messages?job=" + encodeURIComponent(selectedJob.id) : "/workspace/client/messages"}
      emptyCopy="Ask a hiring question, clarify the brief, or send feedback to your recruiter."
    />
  </div>;
}
