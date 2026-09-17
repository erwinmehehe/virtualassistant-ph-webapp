import { CheckCircle2, ShieldCheck, Wrench } from "lucide-react";
import { requireAnyRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyVaWorkSetupAction } from "@/app/actions/work-readiness";
import type { ProfileSummaryRow, WorkSetupRow } from "@/lib/workspace-rows";

function dateLabel(value?: string | null) {
  if (!value) return "Not submitted";
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" }).format(new Date(value));
}

export default async function WorkReadinessPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const query = await searchParams;
  await requireAnyRole(["recruiter", "admin"]);
  const admin = createAdminClient();
  const { data: setupData, error } = await admin.from("va_profiles")
    .select("user_id,work_setup_computer,work_setup_os,work_setup_ram_gb,primary_internet,backup_internet,backup_power,headset_ready,webcam_ready,quiet_workspace,work_setup_submitted_at,work_setup_verified_at,work_setup_verification_notes")
    .not("work_setup_submitted_at", "is", null)
    .order("work_setup_submitted_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  const setups = (setupData || []) as WorkSetupRow[];
  const ids = setups.map((row) => row.user_id);
  const { data: profileData } = ids.length
    ? await admin.from("profiles").select("id,full_name,account_status").in("id", ids)
    : { data: [] };
  const names = new Map(((profileData || []) as ProfileSummaryRow[]).map((row) => [row.id, row]));
  const rows = setups.filter((row) => names.get(row.user_id)?.account_status === "active");
  const pending = rows.filter((row) => !row.work_setup_verified_at);
  const verified = rows.filter((row) => row.work_setup_verified_at);

  return <>
    {query.work_setup_verified ? <div className="success-banner" role="status">Work setup verified. Clients can now see the verified readiness signal without seeing private device or network details.</div> : null}
    <div className="page-head"><div><div className="kicker">Talent operations</div><h1>Work readiness</h1><p>Verify equipment, internet backup, power backup, audio/video readiness, and a quiet workspace before client presentation.</p></div></div>
    <div className="grid-3">
      <div className="card"><span className="small muted">Submitted</span><strong style={{display:"block",fontSize:28}}>{rows.length}</strong></div>
      <div className="card"><span className="small muted">Needs verification</span><strong style={{display:"block",fontSize:28}}>{pending.length}</strong></div>
      <div className="card"><span className="small muted">Verified</span><strong style={{display:"block",fontSize:28}}>{verified.length}</strong></div>
    </div>
    <section className="card" style={{marginTop:18}}>
      <div className="row-between wrap"><div><h2 style={{margin:0}}>Verification queue</h2><p className="small muted" style={{margin:"5px 0 0"}}>Private evidence stays inside recruiter operations. Clients only receive a verified/not-yet-verified signal.</p></div><ShieldCheck size={20}/></div>
      {rows.length ? <div className="stack" style={{marginTop:14}}>{rows.map((setup) => { const person = names.get(setup.user_id); const complete = Boolean(setup.work_setup_computer && setup.work_setup_os && setup.work_setup_ram_gb && setup.primary_internet && setup.backup_internet && setup.backup_power && setup.headset_ready && setup.webcam_ready && setup.quiet_workspace); return <article className="card" key={setup.user_id}>
        <div className="row-between wrap"><div><h3 style={{margin:"0 0 4px"}}>{person?.full_name || "Virtual Assistant"}</h3><span className="small muted">Submitted {dateLabel(setup.work_setup_submitted_at)}</span></div>{setup.work_setup_verified_at ? <span className="badge badge-success"><CheckCircle2 size={13}/> Verified {dateLabel(setup.work_setup_verified_at)}</span> : <span className={`badge ${complete ? "badge-warning" : "badge-danger"}`}><Wrench size={13}/>{complete ? "Ready to verify" : "Incomplete"}</span>}</div>
        <div className="grid-3" style={{marginTop:14}}><div><span className="small muted">Computer</span><strong style={{display:"block"}}>{setup.work_setup_computer || "Missing"}</strong><span className="small muted">{setup.work_setup_os || "OS missing"} · {setup.work_setup_ram_gb || "?"} GB RAM</span></div><div><span className="small muted">Connectivity</span><strong style={{display:"block"}}>{setup.primary_internet || "Primary missing"}</strong><span className="small muted">Backup: {setup.backup_internet || "missing"}</span></div><div><span className="small muted">Continuity</span><strong style={{display:"block"}}>{setup.backup_power || "Power backup missing"}</strong><span className="small muted">Headset {setup.headset_ready ? "✓" : "✕"} · Webcam {setup.webcam_ready ? "✓" : "✕"} · Quiet space {setup.quiet_workspace ? "✓" : "✕"}</span></div></div>
        {!setup.work_setup_verified_at ? <form action={verifyVaWorkSetupAction} className="stack" style={{marginTop:14}}><input type="hidden" name="va_id" value={setup.user_id}/><input type="hidden" name="return_to" value="/workspace/recruiter/work-readiness"/><div className="field"><label>Verification note <span className="muted">(optional)</span></label><input name="verification_notes" maxLength={2000} placeholder="Example: setup reviewed during video interview; backup internet and power confirmed."/></div><button className="btn btn-primary" type="submit" disabled={!complete}>Verify work setup</button></form> : setup.work_setup_verification_notes ? <p className="small muted" style={{marginBottom:0}}>{setup.work_setup_verification_notes}</p> : null}
      </article>;})}</div> : <div className="empty">No VA has submitted work-readiness evidence yet.</div>}
    </section>
  </>;
}
