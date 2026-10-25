import styles from "./client-engagement-panel.module.css";

export function ClientEngagementPanel({
  linked,
  lastLogin,
  shortlistOpened,
  shortlistActivity,
  decision,
  lastClientReply,
  replyStatus,
}: {
  linked: boolean;
  lastLogin: string;
  shortlistOpened: string;
  shortlistActivity: string;
  decision: string;
  lastClientReply: string;
  replyStatus: string;
}) {
  return <section className={styles.card}>
    <div className={styles.head}>
      <div><span>Client activity</span><h2>What has the client actually done?</h2></div>
      <b>{linked ? "Account linked" : "No client account"}</b>
    </div>
    <div className={styles.grid}>
      <div><span>Last login</span><strong>{lastLogin}</strong></div>
      <div><span>Shortlist opened</span><strong>{shortlistOpened}</strong></div>
      <div><span>Last shortlist activity</span><strong>{shortlistActivity}</strong></div>
      <div><span>Decision received</span><strong>{decision}</strong></div>
      <div><span>Last email reply / chat reply</span><strong>{lastClientReply}</strong></div>
      <div><span>Reply status</span><strong className={replyStatus.startsWith("Client replied") ? styles.needsAction : replyStatus.startsWith("Awaiting") ? styles.awaiting : styles.handled}>{replyStatus}</strong></div>
    </div>
    <p className={styles.note}>Shortlist decisions and inbound client email replies are tracked automatically and kept role-scoped. Recruiters can also log a reply manually if needed. Candidate-view analytics have been retired.</p>
  </section>;
}
