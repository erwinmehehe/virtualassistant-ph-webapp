import { CheckCircle2, LockKeyhole, ShieldCheck } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { saveVaWorkSetupAction } from "@/app/actions/work-readiness";

export default async function VaWorkReadinessPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const query = await searchParams;
  const { user } = await requireRole("va");
  const supabase = await createClient();
  const { data: va, error } = await supabase.from("va_profiles").select("work_setup_computer,work_setup_os,work_setup_ram_gb,primary_internet,backup_internet,backup_power,headset_ready,webcam_ready,quiet_workspace,work_setup_submitted_at,work_setup_verified_at,work_setup_verification_notes").eq("user_id", user.id).single();
  if (error) throw error;
  const complete = Boolean(va?.work_setup_computer && va?.work_setup_os && va?.work_setup_ram_gb && va?.primary_internet && va?.backup_internet && va?.backup_power && va?.headset_ready && va?.webcam_ready && va?.quiet_workspace);

  return <>
    {query.work_setup_saved ? <div className="success-banner" role="status">Work setup saved. A recruiter can now verify it. Any future change will require verification again.</div> : null}
    <div className="page-head"><div><div className="kicker">Get recruiter-ready</div><h1>Work readiness</h1><p>Record the setup you can reliably use for client work. These details stay private with the recruiting team.</p></div>{va?.work_setup_verified_at ? <span className="badge badge-success"><CheckCircle2 size={14}/> Work setup verified</span> : <span className="badge badge-warning"><ShieldCheck size={14}/>{complete ? "Awaiting verification" : "Setup incomplete"}</span>}</div>

    <div className="info-banner"><LockKeyhole size={17}/><div><strong>Private operating evidence</strong><p style={{margin:"4px 0 0"}}>Clients do not see your computer, ISP, or backup details. After recruiter review they only see that your work setup is verified.</p></div></div>

    <form action={saveVaWorkSetupAction} className="card stack" style={{marginTop:18}}>
      <div><h2 style={{margin:"0 0 4px"}}>Primary work setup</h2><p className="small muted" style={{margin:0}}>Use the equipment and connection you actually plan to work with.</p></div>
      <div className="form-grid">
        <div className="field"><label>Computer</label><input name="work_setup_computer" required maxLength={500} defaultValue={va?.work_setup_computer || ""} placeholder="Example: Lenovo ThinkPad E14"/></div>
        <div className="field"><label>Operating system</label><input name="work_setup_os" required maxLength={500} defaultValue={va?.work_setup_os || ""} placeholder="Windows 11 / macOS"/></div>
        <div className="field"><label>RAM, GB</label><input name="work_setup_ram_gb" type="number" min="4" max="256" step="1" required defaultValue={va?.work_setup_ram_gb || ""}/></div>
        <div className="field"><label>Primary internet</label><input name="primary_internet" required maxLength={500} defaultValue={va?.primary_internet || ""} placeholder="Fiber · provider · typical speed"/></div>
        <div className="field"><label>Backup internet</label><input name="backup_internet" required maxLength={500} defaultValue={va?.backup_internet || ""} placeholder="5G hotspot / second ISP"/></div>
        <div className="field"><label>Backup power</label><input name="backup_power" required maxLength={500} defaultValue={va?.backup_power || ""} placeholder="UPS / power station / generator"/></div>
      </div>
      <div className="grid-3">
        <label className="choice"><input type="checkbox" name="headset_ready" defaultChecked={Boolean(va?.headset_ready)}/><span><strong>Call-ready headset</strong><small>Clear microphone and audio.</small></span></label>
        <label className="choice"><input type="checkbox" name="webcam_ready" defaultChecked={Boolean(va?.webcam_ready)}/><span><strong>Webcam ready</strong><small>Available for client meetings.</small></span></label>
        <label className="choice"><input type="checkbox" name="quiet_workspace" defaultChecked={Boolean(va?.quiet_workspace)}/><span><strong>Quiet workspace</strong><small>Suitable for focused remote work.</small></span></label>
      </div>
      {va?.work_setup_verified_at ? <div className="alert"><strong>Changing this setup resets verification.</strong><p style={{margin:"4px 0 0"}}>That keeps the client-facing verified signal truthful.</p></div> : null}
      <div className="row-between wrap"><span className="small muted">Submit only accurate information. Recruiters may confirm the setup during vetting.</span><button className="btn btn-primary" type="submit">Save work setup</button></div>
    </form>
  </>;
}
