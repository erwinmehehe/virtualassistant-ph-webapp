import { MessageCircle, Send, ShieldCheck } from "lucide-react";
import { sendRecruiterClientChatMessageAction } from "@/app/actions/client-recruiter-chat";
import type { RecruiterClientMessage } from "@/lib/recruiter-client-chat";
import { RecruiterClientChatRefresh } from "@/components/recruiter-client-chat-refresh";
import styles from "./recruiter-client-chat.module.css";

function stamp(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}

export function RecruiterClientChatPanel({
  viewerId,
  threadId,
  clientId,
  counterpartLabel,
  messages,
  returnTo,
  emptyCopy,
}: {
  viewerId: string;
  threadId: string;
  clientId: string;
  counterpartLabel: string;
  messages: RecruiterClientMessage[];
  returnTo: string;
  emptyCopy?: string;
}) {
  return (
    <section className={styles.chatCard}>
      <RecruiterClientChatRefresh />
      <header className={styles.chatHeader}>
        <div className={styles.chatTitle}>
          <span className={styles.icon}><MessageCircle size={18}/></span>
          <div>
            <h2>{counterpartLabel}</h2>
            <p>Private recruiter-client conversation</p>
          </div>
        </div>
        <span className={styles.rule}><ShieldCheck size={14}/> Recruiter ↔ client only</span>
      </header>

      <div className={styles.messages} aria-live="polite">
        {messages.length ? messages.map((message) => {
          const mine = message.sender_id === viewerId;
          return (
            <article className={mine ? styles.mine : styles.theirs} key={message.id}>
              <div className={styles.bubble}>{message.body}</div>
              <small>{mine ? "You" : counterpartLabel} · {stamp(message.created_at)}</small>
            </article>
          );
        }) : (
          <div className={styles.empty}>
            <MessageCircle size={24}/>
            <strong>No messages yet</strong>
            <p>{emptyCopy || "Start the conversation here."}</p>
          </div>
        )}
      </div>

      <form action={sendRecruiterClientChatMessageAction} className={styles.composer}>
        <input type="hidden" name="thread_id" value={threadId}/>
        <input type="hidden" name="client_id" value={clientId}/>
        <input type="hidden" name="return_to" value={returnTo}/>
        <label className="sr-only" htmlFor={"chat-body-" + threadId}>Message</label>
        <textarea id={"chat-body-" + threadId} name="body" required minLength={1} maxLength={4000} placeholder="Write a message…" rows={3}/>
        <button className="btn btn-primary" type="submit"><Send size={15}/> Send</button>
      </form>
    </section>
  );
}
