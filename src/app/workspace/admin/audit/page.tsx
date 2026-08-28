import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { dateShort } from "@/lib/format";

export default async function AdminAuditPage() {
  await requireRole("admin");
  const admin = createAdminClient();
  const { data: rows } = await admin.from("admin_audit_log").select("id,actor_id,action,target_type,target_id,metadata,created_at").order("created_at", { ascending: false }).limit(250);
  const actorIds = [...new Set((rows || []).map((r: any) => r.actor_id).filter(Boolean))];
  const { data: actors } = actorIds.length ? await admin.from("profiles").select("id,full_name").in("id", actorIds) : { data: [] as any[] };
  const names = new Map((actors || []).map((p: any) => [p.id, p.full_name]));
  return <>
    <div className="page-head"><div><h1>Admin audit log</h1><p>Review sensitive staff actions such as bans, role changes, job decisions, and identity verification.</p></div></div>
    <div className="table-wrap responsive-table"><table><thead><tr><th>When</th><th>Actor</th><th>Action</th><th>Target</th><th>Details</th></tr></thead><tbody>
      {(rows || []).map((r: any) => <tr key={r.id}><td data-label="When">{dateShort(r.created_at)}</td><td data-label="Actor">{names.get(r.actor_id) || "System / former admin"}</td><td data-label="Action"><span className="badge">{String(r.action).replaceAll("_", " ")}</span></td><td data-label="Target">{r.target_type}{r.target_id ? ` · ${r.target_id}` : ""}</td><td data-label="Details"><span className="small muted">{Object.keys(r.metadata || {}).length ? JSON.stringify(r.metadata) : "—"}</span></td></tr>)}
      {!rows?.length ? <tr><td colSpan={5}><div className="empty">No audit events yet.</div></td></tr> : null}
    </tbody></table></div>
  </>;
}
