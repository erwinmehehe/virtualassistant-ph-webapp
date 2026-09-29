import Link from "next/link";
import { MessageCircle, UsersRound } from "lucide-react";
import { requireRoleFast } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getOrCreateClientRecruiterThread,
  getRecruiterChatThreads,
  getRecruiterClientMessages,
  markRecruiterClientMessagesRead,
  type RecruiterClientThread,
} from "@/lib/recruiter-client-chat";
import { RecruiterClientChatPanel } from "@/components/recruiter-client-chat";
import pageStyles from "@/components/recruiter-client-chat-page.module.css";

function displayTime(value?: string | null) {
  if (!value) return "No messages yet";
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}

export default async function RecruiterMessagesPage({ searchParams }: { searchParams: Promise<Record<string,string|undefined>> }) {
  const params = await searchParams;
  const { userId } = await requireRoleFast("recruiter");
  const admin = createAdminClient();

  let requestedThread: RecruiterClientThread | null = null;
  if (params.client) {
    const { data: client } = await admin
      .from("profiles")
      .select("id,role")
      .eq("id", params.client)
      .eq("role", "client")
      .maybeSingle();
    if (client) {
      const candidate = await getOrCreateClientRecruiterThread(client.id);
      if (!candidate.recruiter_id || candidate.recruiter_id === userId) requestedThread = candidate;
    }
  }

  const threads = await getRecruiterChatThreads(userId);
  const requestedId = params.thread || requestedThread?.id || "";
  let active = (requestedId ? threads.find((thread) => thread.id === requestedId) : null)
    || requestedThread
    || threads[0]
    || null;

  if (active && !active.recruiter_id) {
    const { data: claimed, error: claimError } = await admin
      .from("client_recruiter_threads")
      .update({ recruiter_id: userId, updated_at: new Date().toISOString() })
      .eq("id", active.id)
      .is("recruiter_id", null)
      .select("*")
      .maybeSingle();
    if (claimError) throw claimError;
    if (claimed) active = claimed as RecruiterClientThread;
  }

  const clientIds = [...new Set(threads.map((thread) => thread.client_id).concat(active ? [active.client_id] : []))];
  const { data: clientProfiles } = clientIds.length
    ? await admin.from("profiles").select("id,full_name").in("id", clientIds)
    : { data: [] as Array<{id:string;full_name:string|null}> };
  const clientMap = new Map((clientProfiles || []).map((profile) => [profile.id, profile.full_name || "Client"]));

  const unreadByThread = new Map<string, number>();
  if (threads.length) {
    const { data: unread } = await admin
      .from("client_recruiter_messages")
      .select("thread_id")
      .in("thread_id", threads.map((thread) => thread.id))
      .neq("sender_id", userId)
      .is("read_at", null);
    for (const row of unread || []) unreadByThread.set(row.thread_id, (unreadByThread.get(row.thread_id) || 0) + 1);
  }

  let messages = [] as Awaited<ReturnType<typeof getRecruiterClientMessages>>;
  if (active) {
    await markRecruiterClientMessagesRead(active.id, userId);
    messages = await getRecruiterClientMessages(active.id);
  }

  return <div className={pageStyles.page}>
    <div className="page-head">
      <div>
        <div className="kicker">Client communication</div>
        <h1>Messages</h1>
        <p>Private client conversations owned by the recruiting team. Virtual Assistants cannot access or send messages here.</p>
      </div>
    </div>

    <div className={pageStyles.layout}>
      <aside className={pageStyles.threadList}>
        <div className={pageStyles.threadListHead}><UsersRound size={16}/><strong>Clients</strong></div>
        {threads.length ? threads.map((thread) => {
          const activeThread = active?.id === thread.id;
          const unread = unreadByThread.get(thread.id) || 0;
          return <Link
            className={activeThread ? pageStyles.threadActive : pageStyles.thread}
            href={"/workspace/recruiter/messages?thread=" + encodeURIComponent(thread.id)}
            key={thread.id}
          >
            <div>
              <strong>{clientMap.get(thread.client_id) || "Client"}</strong>
              <small>{thread.recruiter_id ? "Assigned to you" : "Unassigned team chat"}</small>
            </div>
            <div className={pageStyles.threadMeta}>
              {unread ? <span className={pageStyles.unread}>{unread}</span> : null}
              <small>{displayTime(thread.last_message_at)}</small>
            </div>
          </Link>;
        }) : <div className={pageStyles.emptyThreads}><MessageCircle size={20}/><p>No client chats yet.</p></div>}
      </aside>

      <main className={pageStyles.chatPane}>
        {active ? <RecruiterClientChatPanel
          viewerId={userId}
          threadId={active.id}
          clientId={active.client_id}
          counterpartLabel={clientMap.get(active.client_id) || "Client"}
          messages={messages}
          returnTo={"/workspace/recruiter/messages?thread=" + encodeURIComponent(active.id)}
          emptyCopy="Send the client a message here. The VA is not part of this thread."
        /> : <div className={"card " + pageStyles.noActive}><MessageCircle size={26}/><h2>No conversation selected</h2><p>A client chat will appear here as soon as a client sends a message or you open one from their CRM record.</p></div>}
      </main>
    </div>
  </div>;
}
