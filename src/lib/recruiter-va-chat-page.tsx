import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { RecruiterVaChat } from "@/components/recruiter-va-chat";
import styles from "@/components/recruiter-client-chat-page.module.css";

export async function RecruiterVaChatPage({ role, userId, requestedThread }: {
  role: "recruiter" | "va"; userId: string; requestedThread?: string;
}) {
  const admin = createAdminClient();
  const column = role === "recruiter" ? "recruiter_id" : "va_id";
  const base = role === "recruiter" ? "/workspace/recruiter/va-messages" : "/workspace/va/messages";
  const { data: threads, error } = await admin.from("recruiter_va_threads")
    .select("id,recruiter_id,va_id,last_message_at,created_at")
    .eq(column, userId).order("last_message_at", { ascending: false, nullsFirst: false });
  if (error) throw error;
  const selected = threads?.find((thread) => thread.id === requestedThread) || threads?.[0];

  const unreadByThread = new Map<string, number>();
  if (threads?.length) {
    const { data: unread, error: unreadError } = await admin.from("recruiter_va_messages")
      .select("thread_id")
      .in("thread_id", threads.map((thread) => thread.id))
      .neq("sender_id", userId)
      .is("read_at", null);
    if (unreadError) throw unreadError;
    for (const row of unread || []) unreadByThread.set(row.thread_id, (unreadByThread.get(row.thread_id) || 0) + 1);
  }

  const otherIds = (threads || []).map((thread) => role === "recruiter" ? thread.va_id : thread.recruiter_id);
  const { data: profiles } = otherIds.length
    ? await admin.from("profiles").select("id,full_name").in("id", otherIds)
    : { data: [] as { id: string; full_name: string | null }[] };
  const names = new Map((profiles || []).map((profile) => [profile.id, profile.full_name || "Account"]));
  let messages: { id: string; sender_id: string; body: string; created_at: string }[] = [];
  if (selected) {
    const { data, error: messageError } = await admin.from("recruiter_va_messages")
      .select("id,sender_id,body,created_at").eq("thread_id", selected.id)
      .order("created_at", { ascending: true }).limit(100);
    if (messageError) throw messageError;
    messages = data || [];
    await admin.from("recruiter_va_messages").update({ read_at: new Date().toISOString() })
      .eq("thread_id", selected.id).neq("sender_id", userId).is("read_at", null);
  }
  return <div className={styles.page}>
    <div className="page-head"><div><div className="kicker">Private communication</div><h1>VA messages</h1><p>Recruiters and Virtual Assistants can message each other here. Clients cannot access these conversations.</p></div></div>
    <div className={styles.layout}>
      <aside className={styles.threadList}>
        <div className={styles.threadListHead}><strong>{role === "recruiter" ? "Virtual Assistants" : "Recruiters"}</strong></div>
        {(threads || []).map((thread) => {
          const name = names.get(role === "recruiter" ? thread.va_id : thread.recruiter_id) || "Account";
          const unread = unreadByThread.get(thread.id) || 0;
          return <Link className={selected?.id === thread.id ? styles.threadActive : styles.thread}
            href={`${base}?thread=${encodeURIComponent(thread.id)}`} key={thread.id}>
            <strong>{name}</strong>{unread ? <span className={styles.unread}>{unread}</span> : null}
          </Link>;
        })}
        {!threads?.length ? <div className={styles.emptyThreads}>No conversations yet. Recruiters can start one from a VA profile.</div> : null}
      </aside>
      <main className={styles.chatPane}>
        {selected ? <RecruiterVaChat thread={selected} messages={messages} viewerId={userId}
          name={names.get(role === "recruiter" ? selected.va_id : selected.recruiter_id) || "Account"}/>
          : <div className="card">No conversation selected.</div>}
      </main>
    </div>
  </div>;
}
