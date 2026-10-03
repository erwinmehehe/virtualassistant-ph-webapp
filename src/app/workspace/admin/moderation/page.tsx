import { requireRoleFast } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { banUserAction, dismissFlagAction, unbanUserAction } from "@/app/actions/moderation";
import { dateShort } from "@/lib/format";

export default async function ModerationPage() {
  await requireRoleFast("admin");
  const admin = createAdminClient();

  const { data: flags, error: flagError } = await admin
    .from("communication_flags")
    .select("id,channel,matched_terms,status,created_at,message_id,thread_id,sender_id,message_excerpt,profiles!communication_flags_sender_id_fkey(id,full_name,role)")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(100);
  if (flagError) throw flagError;

  const { data: bannedUsers, error: bannedError } = await admin
    .from("profiles")
    .select("id,full_name,role,banned_at,banned_reason")
    .eq("account_status", "banned")
    .order("banned_at", { ascending: false, nullsFirst: false });
  if (bannedError) throw bannedError;

  return <>
    <div className="page-head"><div><h1>Moderation</h1><p>Client and VA messages that may contain personal contact details, direct-payment instructions, or off-platform hiring attempts are flagged for human review. Keyword matches never auto-ban an account.</p></div></div>

    <div className="alert" style={{marginBottom:20}}>
      <strong>Anti-circumvention rule:</strong> Clients and VAs must keep recruiter-managed hiring and payment inside the agreed VAPH workflow. A compensated/paid commercial path must be recorded before any process intentionally exposes information that could enable an off-platform hire.
    </div>

    <h3>Pending review</h3>
    <div className="stack" style={{ marginBottom: 32 }}>
      {flags?.length ? flags.map((f: any) => <div className="card" key={f.id}>
        <div className="row-between wrap">
          <div>
            <div className="row wrap"><span className="badge badge-warning">Flagged</span><span className="badge">{f.channel === "client_recruiter" ? "Client → recruiter" : "VA → recruiter"}</span><span className="small muted">{dateShort(f.created_at)}</span></div>
            <h3 style={{ margin: "8px 0 3px" }}>{f.profiles?.full_name || "Unknown"} <span className="small muted">({f.profiles?.role})</span></h3>
            <div className="small muted">Matched: {(f.matched_terms || []).join(", ")}</div>
          </div>
        </div>
        <blockquote style={{ margin: "12px 0", padding: "10px 14px", background: "var(--surface-2)", borderRadius: 8, borderLeft: "3px solid var(--warning)" }}>
          {f.message_excerpt || "Message content unavailable."}
        </blockquote>
        <div className="row wrap">
          <form action={dismissFlagAction}><input type="hidden" name="flag_id" value={f.id}/><button className="btn btn-sm" type="submit">Dismiss, no action</button></form>
          <form action={banUserAction} className="row wrap" style={{ gap: 8 }}>
            <input type="hidden" name="user_id" value={f.sender_id}/>
            <input type="hidden" name="flag_id" value={f.id}/>
            <input name="reason" placeholder="Confirmed violation reason" required minLength={5} style={{ minWidth: 240 }}/>
            <button className="btn btn-danger btn-sm" type="submit">Ban account</button>
          </form>
        </div>
      </div>) : <div className="card empty">No pending communication flags.</div>}
    </div>

    <h3>Banned accounts</h3>
    <div className="stack">
      {bannedUsers?.length ? bannedUsers.map((u: any) => <div className="card" key={u.id}>
        <div className="row-between wrap">
          <div>
            <h3 style={{ margin: "0 0 3px" }}>{u.full_name || "Unknown"} <span className="small muted">({u.role})</span></h3>
            <div className="small muted">Banned {u.banned_at ? dateShort(u.banned_at) : "date unavailable"}{u.banned_reason ? ` — ${u.banned_reason}` : ""}</div>
          </div>
          <form action={unbanUserAction}><input type="hidden" name="user_id" value={u.id}/><button className="btn btn-sm" type="submit">Restore account</button></form>
        </div>
      </div>) : <div className="card empty">No banned accounts.</div>}
    </div>
  </>;
}
