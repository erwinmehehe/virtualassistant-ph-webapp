import Link from "next/link";
import { BriefcaseBusiness, ChevronLeft, MessageSquareText, UsersRound } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { candidateAccessUnlocked } from "@/lib/candidate-access";
import { sendMessageAction } from "@/app/actions/messages";
import { MarkThreadRead } from "@/components/mark-thread-read";
import { MessageLiveSync } from "@/components/message-live-sync";

const HIRING_CALL_URL = "/book-client-call";

type ThreadRef = { id: string; application_id: string | null; va_id: string; created_at: string };
type ApplicationRef = { id: string; job_id: string };
type AccessRef = { job_id: string; access_status: string | null };
type ApplicationDetails = {
  id: string;
  profile_snapshot: { full_name?: string } | null;
  jobs: { title: string } | null;
};
type ClientThreadRow = {
  id: string;
  application_id: string | null;
  va_id: string;
  applications: ApplicationDetails | null;
};
type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  attachment_path?: string | null;
  attachment_name?: string | null;
  created_at: string;
};

type UnreadRow = { conversation_id: string };

export default async function ClientMessagesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const { user } = await requireRole("client");
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: threadData } = await admin
    .from("conversations")
    .select("id,application_id,va_id,created_at")
    .eq("client_id", user.id)
    .order("created_at", { ascending: false });
  const threadRefs = (threadData || []) as ThreadRef[];
  const applicationIds = threadRefs.map((thread) => thread.application_id).filter((id): id is string => Boolean(id));

  const { data: applicationData } = applicationIds.length
    ? await admin.from("applications").select("id,job_id").in("id", applicationIds)
    : { data: [] };
  const applicationRefs = (applicationData || []) as ApplicationRef[];
  const jobIds = [...new Set(applicationRefs.map((application) => application.job_id))];

  const { data: accessData } = jobIds.length
    ? await admin.from("job_candidate_access").select("job_id,access_status").in("job_id", jobIds)
    : { data: [] };
  const accessRows = (accessData || []) as AccessRef[];
  const accessMap = new Map(accessRows.map((row) => [row.job_id, row.access_status]));
  const applicationJobMap = new Map(applicationRefs.map((application) => [application.id, application.job_id]));
  const unlockedRefs = threadRefs.filter((thread) => thread.application_id && candidateAccessUnlocked(accessMap.get(applicationJobMap.get(thread.application_id) ?? "")));
  const unlockedApplicationIds = unlockedRefs.map((thread) => thread.application_id).filter((id): id is string => Boolean(id));

  const { data: unlockedData } = unlockedApplicationIds.length
    ? await admin.from("applications").select("id,profile_snapshot,jobs(title)").in("id", unlockedApplicationIds)
    : { data: [] };
  const unlockedApplications = (unlockedData || []) as unknown as ApplicationDetails[];
  const applicationMap = new Map(unlockedApplications.map((application) => [application.id, application]));
  const rows: ClientThreadRow[] = unlockedRefs.map((thread) => ({
    id: thread.id,
    application_id: thread.application_id,
    va_id: thread.va_id,
    applications: thread.application_id ? applicationMap.get(thread.application_id) || null : null,
  }));

  const threadIds = rows.map((thread) => thread.id);
  const { data: unreadData } = threadIds.length
    ? await supabase.from("messages").select("conversation_id").in("conversation_id", threadIds).neq("sender_id", user.id).is("read_at", null)
    : { data: [] };
  const unreadRows = (unreadData || []) as UnreadRow[];
  const unread = new Map<string, number>();
  for (const row of unreadRows) unread.set(row.conversation_id, (unread.get(row.conversation_id) || 0) + 1);

  const active = params.thread && threadIds.includes(params.thread) ? params.thread : undefined;
  let messages: MessageRow[] = [];
  if (active) {
    const { data } = await supabase.from("messages").select("*").eq("conversation_id", active).order("created_at", { ascending: true });
    messages = (data || []) as MessageRow[];
  }
  const current = rows.find((thread) => thread.id === active);

  return <>
    <MessageLiveSync role="client" userId={user.id} conversationIds={threadIds}/>
    <div className="page-head"><div><h1>Messages</h1><p>Keep each hiring conversation attached to the correct candidate and job.</p></div></div>

    {!rows.length ? <section className="workspace-empty-card" aria-labelledby="client-messages-empty-title">
      <div className="workspace-empty-icon"><MessageSquareText size={26}/></div>
      <h2 id="client-messages-empty-title">No candidate conversations yet</h2>
      <p>Direct candidate conversations appear here after candidate access is active for a role. Your recruiting team can still help you narrow the shortlist and decide who is worth speaking with before that step.</p>
      <div className="row wrap workspace-empty-actions"><a className="btn btn-primary" href={HIRING_CALL_URL}>Book a client discovery call</a><Link className="btn" href="/workspace/client/candidates"><UsersRound size={16}/>Review candidates</Link><Link className="btn" href="/workspace/client/jobs"><BriefcaseBusiness size={16}/>View roles</Link></div>
    </section> : <div className={`messages-layout ${active ? "has-active-thread" : "no-active-thread"}`}>
      <div className="thread-list"><div className="thread-list-head"><strong>Conversations</strong><span className="thread-count">{rows.length}</span></div>{rows.map((thread)=><Link className={`thread-item ${thread.id === active ? "active" : ""}`} href={`/workspace/client/messages?thread=${thread.id}`} key={thread.id}><div className="row-between"><strong>{thread.applications?.profile_snapshot?.full_name || "Virtual Assistant applicant"}</strong>{unread.get(thread.id) ? <span className="unread-dot" aria-label={`${unread.get(thread.id)} unread messages`}>{unread.get(thread.id)}</span> : null}</div><div className="small muted">{thread.applications?.jobs?.title || "Job conversation"}</div></Link>)}</div>
      <div className="message-panel">{active ? <><MarkThreadRead conversationId={active}/><div className="message-head"><Link className="mobile-thread-back" href="/workspace/client/messages"><ChevronLeft size={17}/> Conversations</Link><strong>{current?.applications?.profile_snapshot?.full_name || "Candidate conversation"}</strong><div className="small muted">{current?.applications?.jobs?.title}</div></div><div className="message-body">{messages.length ? messages.map((message)=><div className={`bubble ${message.sender_id === user.id ? "mine" : ""}`} key={message.id}>{message.body}{message.attachment_path ? <div className="message-attachment"><a href={`/api/message-attachment/${message.id}`} target="_blank" rel="noreferrer">Open attachment: {message.attachment_name || "file"}</a></div> : null}<div className="small muted" style={{marginTop:4}}>{new Date(message.created_at).toLocaleString()}</div></div>) : <div className="empty">No messages yet. Start the conversation below.</div>}</div><form action={sendMessageAction} className="message-form" encType="multipart/form-data"><input type="hidden" name="conversation_id" value={active}/><label className="sr-only" htmlFor="client-message">Write a message</label><input id="client-message" name="body" placeholder="Write a message..." autoComplete="off" maxLength={5000}/><label className="btn btn-sm message-attach-button">Attach<input className="sr-only" type="file" name="attachment" accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.docx"/></label><button className="btn btn-primary" type="submit">Send</button></form></> : <div className="message-placeholder-card"><MessageSquareText size={26}/><h2>Select a conversation</h2><p>Choose a candidate thread from the left to read the history and reply.</p></div>}</div>
    </div>}
  </>;
}
