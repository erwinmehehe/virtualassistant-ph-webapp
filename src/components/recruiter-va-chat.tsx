import { sendRecruiterVaMessageAction } from "@/app/actions/recruiter-va-chat";
import { RecruiterClientChatRefresh } from "@/components/recruiter-client-chat-refresh";
import styles from "./recruiter-client-chat.module.css";

export function RecruiterVaChat({ thread, messages, viewerId, name }: {
  thread: { id: string; va_id: string };
  messages: { id: string; sender_id: string; body: string; created_at: string }[];
  viewerId: string;
  name: string;
}) {
  return <section className={styles.chatCard}>
    <RecruiterClientChatRefresh />
    <header className={styles.chatHeader}><div className={styles.chatTitle}><div><h2>{name}</h2><p>Private recruiter and VA conversation</p></div></div></header>
    <div className={styles.messages} aria-live="polite">
      {messages.length ? messages.map((message) => <article className={message.sender_id === viewerId ? styles.mine : styles.theirs} key={message.id}>
        <div className={styles.bubble}>{message.body}</div>
        <small>{message.sender_id === viewerId ? "You" : name} · {new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" }).format(new Date(message.created_at))}</small>
      </article>) : <div className={styles.empty}><strong>No messages yet</strong><p>Start a conversation here.</p></div>}
    </div>
    <form action={sendRecruiterVaMessageAction} className={styles.composer}>
      <input type="hidden" name="thread_id" value={thread.id}/>
      <input type="hidden" name="va_id" value={thread.va_id}/>
      <label className="sr-only" htmlFor={`va-message-${thread.id}`}>Message</label>
      <textarea id={`va-message-${thread.id}`} name="body" required maxLength={4000} rows={3} placeholder="Write a message…"/>
      <button className="btn btn-primary" type="submit">Send</button>
    </form>
  </section>;
}
