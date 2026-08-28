import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { banUserAction, dismissFlagAction, unbanUserAction } from "@/app/actions/moderation";
import { dateShort } from "@/lib/format";

export default async function ModerationPage() {
  await requireRole("admin");
  const admin = createAdminClient();

  const { data: flags } = await admin
    .from("message_flags")
    .select("id,matched_terms,status,created_at,message_id,sender_id,conversation_id,profiles!message_flags_sender_id_fkey(id,full_name,role)")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(50);

  const messageIds = (flags || []).map((f: any) => f.message_id);
  const { data: messages } = messageIds.length
    ? await admin.from("messages").select("id,body,created_at").in("id", messageIds)
    : { data: [] };
  const messageMap = new Map((messages || []).map((m: any) => [m.id, m]));

  const { data: bannedUsers } = await admin
    .from("profiles")
    .select("id,full_name,role,banned_at,banned_reason")
    .eq("account_status", "banned")
    .order("banned_at", { ascending: false });

  return <>
    <div className="page-head"><div><h1>Moderation</h1><p>Messages that mention off-platform payment or contact are flagged here for review. Nothing is auto-banned &mdash; confirm before taking action.</p></div></div>

    <h3>Pending review</h3>
    <div className="stack" style={{ marginBottom: 32 }}>
      {flags?.length ? flags.map((f: any) => {
        const message = messageMap.get(f.message_id);
        return <div className="card" key={f.id}>
          <div className="row-between wrap">
            <div>
              <div className="row wrap"><span className="badge badge-warning">Flagged</span><span className="small muted">{dateShort(f.created_at)}</span></div>
              <h3 style={{ margin: "8px 0 3px" }}>{f.profiles?.full_name || "Unknown"} <span className="small muted">({f.profiles?.role})</span></h3>
              <div className="small muted">Matched: {(f.matched_terms || []).join(", ")}</div>
            </div>
          </div>
          <blockquote style={{ margin: "12px 0", padding: "10px 14px", background: "var(--surface-2)", borderRadius: 8, borderLeft: "3px solid var(--warning)" }}>
            {message?.body || "Message content unavailable."}
          </blockquote>
          <div className="row wrap">
            <form action={dismissFlagAction}><input type="hidden" name="flag_id" value={f.id}/><button className="btn btn-sm" type="submit">Dismiss, no action</button></form>
            <form action={banUserAction} className="row wrap" style={{ gap: 8 }}>
              <input type="hidden" name="user_id" value={f.sender_id}/>
              <input type="hidden" name="flag_id" value={f.id}/>
              <input name="reason" placeholder="Ban reason (required)" required minLength={5} style={{ minWidth: 220 }}/>
              <button className="btn btn-primary btn-sm" type="submit" style={{ background: "var(--danger)", borderColor: "var(--danger)" }}>Ban this account</button>
            </form>
          </div>
        </div>;
      }) : <div className="card empty">No pending flags.</div>}
    </div>

    <h3>Banned accounts</h3>
    <div className="stack">
      {bannedUsers?.length ? bannedUsers.map((u: any) => <div className="card" key={u.id}>
        <div className="row-between wrap">
          <div>
            <h3 style={{ margin: "0 0 3px" }}>{u.full_name || "Unknown"} <span className="small muted">({u.role})</span></h3>
            <div className="small muted">Banned {dateShort(u.banned_at)}{u.banned_reason ? ` — ${u.banned_reason}` : ""}</div>
          </div>
          <form action={unbanUserAction}><input type="hidden" name="user_id" value={u.id}/><button className="btn btn-sm" type="submit">Restore account</button></form>
        </div>
      </div>) : <div className="card empty">No banned accounts.</div>}
    </div>
  </>;
}
