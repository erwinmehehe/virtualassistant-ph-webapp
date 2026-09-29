import styles from "./client-engagement-panel.module.css";

export function ClientEngagementPanel({
  linked,
  lastLogin,
  lastVaView,
  vaViews,
  shortlistOpened,
  shortlistActivity,
  decision,
  lastEmailReply,
  replyStatus,
}: {
  linked: boolean;
  lastLogin: string;
  lastVaView: string;
  vaViews: number;
  shortlistOpened: string;
  shortlistActivity: string;
  decision: string;
  lastEmailReply: string;
  replyStatus: string;
}) {
  return <section className={styles.card}>
    <div className={styles.head}>
      <div><span>Client activity</span><h2>What has the client actually done?</h2></div>
      <b>{linked ? "Account linked" : "No client account"}</b>
    </div>
    <div className={styles.grid}>
      <div><span>Last login</span><strong>{lastLogin}</strong></div>
      <div><span>Last VA viewed</span><strong>{lastVaView}</strong></div>
      <div><span>VAs viewed</span><strong>{vaViews}</strong></div>
      <div><span>Shortlist opened</span><strong>{shortlistOpened}</strong></div>
      <div><span>Last shortlist activity</span><strong>{shortlistActivity}</strong></div>
      <div><span>Decision received</span><strong>{decision}</strong></div>
      <div><span>Last email reply</span><strong>{lastEmailReply}</strong></div>
      <div><span>Reply status</span><strong className={replyStatus.startsWith("Client replied") ? styles.needsAction : replyStatus.startsWith("Awaiting") ? styles.awaiting : styles.handled}>{replyStatus}</strong></div>
    </div>
    <p className={styles.note}>Candidate views, shortlist activity, and inbound client email replies are tracked automatically when they reach the configured reply mailbox. Recruiters can still log a reply manually if needed.</p>
  </section>;
}
