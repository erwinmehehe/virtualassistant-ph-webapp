import styles from "./client-engagement-panel.module.css";

export function ClientEngagementPanel({
  linked,
  lastLogin,
  lastVaView,
  vaViews,
  shortlistOpened,
  shortlistActivity,
  decision,
  lastClientReply,
  replyStatus,
}: {
  linked: boolean;
  lastLogin: string;
  lastVaView: string;
  vaViews: number;
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
      <div><span>Last VA viewed</span><strong>{lastVaView}</strong></div>
      <div><span>VAs viewed</span><strong>{vaViews}</strong></div>
      <div><span>Shortlist opened</span><strong>{shortlistOpened}</strong></div>
      <div><span>Last shortlist activity</span><strong>{shortlistActivity}</strong></div>
      <div><span>Decision received</span><strong>{decision}</strong></div>
      <div><span>Last email / chat reply</span><strong>{lastClientReply}</strong></div>
      <div><span>Reply status</span><strong className={replyStatus.startsWith("Client replied") ? styles.needsAction : replyStatus.startsWith("Awaiting") ? styles.awaiting : styles.handled}>{replyStatus}</strong></div>
    </div>
    <p className={styles.note}>VA views are distinct candidates actually viewed in this role's Hiring Room. Shortlist activity and inbound client email replies are tracked automatically and kept role-scoped so signals do not bleed across a client's other roles. Recruiters can still log a reply manually if needed.</p>
  </section>;
}
