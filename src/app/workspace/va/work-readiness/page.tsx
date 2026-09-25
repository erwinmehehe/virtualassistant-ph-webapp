import { CheckCircle2, Headphones, Monitor, ShieldCheck, Video, Wifi, Zap } from "lucide-react";
import { saveVaWorkSetupAction } from "@/app/actions/work-readiness";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function VaWorkReadinessPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const params = await searchParams;
  const { user } = await requireRole("va");
  const supabase = await createClient();
  const { data: va } = await supabase
    .from("va_profiles")
    .select("work_setup_computer,work_setup_os,work_setup_ram_gb,primary_internet,backup_internet,backup_power,headset_ready,webcam_ready,quiet_workspace,work_setup_submitted_at,work_setup_verified_at")
    .eq("user_id", user.id)
    .maybeSingle();

  const complete = Boolean(
    va?.work_setup_computer &&
    va?.work_setup_os &&
    va?.work_setup_ram_gb &&
    va?.primary_internet &&
    va?.backup_internet &&
    va?.backup_power &&
    va?.headset_ready &&
    va?.webcam_ready &&
    va?.quiet_workspace
  );

  const status = va?.work_setup_verified_at
    ? { label: "Verified", className: "is-verified", detail: "Recruiting has verified this setup." }
    : complete
      ? { label: "Awaiting verification", className: "is-pending", detail: "Your setup is complete and ready for recruiter review." }
      : { label: "Setup incomplete", className: "is-incomplete", detail: "Complete every field and readiness check below." };

  return <div className="va-work-readiness-page">
    <div className="page-head va-work-readiness-head va-readiness-mobile-head">
      <div>
        <div className="kicker">Work readiness</div>
        <h1>Show recruiters you can work reliably</h1>
        <p>Keep your computer, connectivity, backup plan, and meeting setup current. These details stay private with the recruiting team.</p>
      </div>
      <span className={`va-readiness-status ${status.className}`}>
        {va?.work_setup_verified_at ? <CheckCircle2 size={15}/> : <ShieldCheck size={15}/>}
        {status.label}
      </span>
    </div>

    {params.saved ? <div className="success-banner" role="status">Work readiness saved. {complete ? "Your setup is ready for recruiter review." : "Finish the remaining checks when you can."}</div> : null}
    {params.error ? <div className="alert" role="alert">{params.error}</div> : null}

    <div className="va-readiness-layout">
      <aside className="card va-readiness-summary" aria-label="Work readiness status">
        <div className="va-readiness-summary-icon"><Monitor size={20}/></div>
        <h2>{status.label}</h2>
        <p>{status.detail}</p>

        <div className="va-readiness-summary-list">
          <div><Wifi size={16}/><span>Primary and backup internet</span></div>
          <div><Zap size={16}/><span>Backup power</span></div>
          <div><Headphones size={16}/><span>Call-ready audio</span></div>
          <div><Video size={16}/><span>Client-meeting camera</span></div>
        </div>

        <div className="va-readiness-privacy-note">
          <ShieldCheck size={16}/>
          <span>Computer and backup details are private. They are used for recruiter readiness checks, not your public VA profile.</span>
        </div>
      </aside>

      <section className="card va-readiness-form-card" aria-labelledby="work-setup-title">
        <div className="va-readiness-form-head">
          <div>
            <span className="small">Equipment & continuity</span>
            <h2 id="work-setup-title">Your work setup</h2>
            <p>Use real details. If recruiters verify this setup and you later change it, verification resets so the signal stays accurate.</p>
          </div>
        </div>

        <form action={saveVaWorkSetupAction} className="va-readiness-form">
          <div className="va-readiness-fields">
            <div className="field">
              <label htmlFor="readiness-computer">Computer</label>
              <input id="readiness-computer" name="work_setup_computer" required maxLength={500} defaultValue={va?.work_setup_computer || ""} placeholder="Lenovo ThinkPad E14"/>
            </div>
            <div className="field">
              <label htmlFor="readiness-os">Operating system</label>
              <input id="readiness-os" name="work_setup_os" required maxLength={500} defaultValue={va?.work_setup_os || ""} placeholder="Windows 11"/>
            </div>
            <div className="field">
              <label htmlFor="readiness-ram">RAM, GB</label>
              <input id="readiness-ram" name="work_setup_ram_gb" type="number" min="4" max="256" required defaultValue={va?.work_setup_ram_gb || ""} placeholder="16"/>
            </div>
            <div className="field">
              <label htmlFor="readiness-primary-internet">Primary internet</label>
              <input id="readiness-primary-internet" name="primary_internet" required maxLength={500} defaultValue={va?.primary_internet || ""} placeholder="Fiber · provider · typical speed"/>
            </div>
            <div className="field">
              <label htmlFor="readiness-backup-internet">Backup internet</label>
              <input id="readiness-backup-internet" name="backup_internet" required maxLength={500} defaultValue={va?.backup_internet || ""} placeholder="5G hotspot or second ISP"/>
            </div>
            <div className="field">
              <label htmlFor="readiness-backup-power">Backup power</label>
              <input id="readiness-backup-power" name="backup_power" required maxLength={500} defaultValue={va?.backup_power || ""} placeholder="UPS or power station"/>
            </div>
          </div>

          <div className="va-readiness-checks">
            <label className="va-readiness-check">
              <input type="checkbox" name="headset_ready" defaultChecked={Boolean(va?.headset_ready)}/>
              <span><strong>Call-ready headset</strong><small>Clear microphone and audio for calls and interviews.</small></span>
            </label>
            <label className="va-readiness-check">
              <input type="checkbox" name="webcam_ready" defaultChecked={Boolean(va?.webcam_ready)}/>
              <span><strong>Webcam ready</strong><small>Available for client meetings when video is required.</small></span>
            </label>
            <label className="va-readiness-check">
              <input type="checkbox" name="quiet_workspace" defaultChecked={Boolean(va?.quiet_workspace)}/>
              <span><strong>Quiet workspace</strong><small>Suitable for focused remote work and live calls.</small></span>
            </label>
          </div>

          <div className="va-readiness-actions">
            <span>{va?.work_setup_verified_at ? "Saving changes will reset recruiter verification." : "Recruiters can verify the setup after all fields and checks are complete."}</span>
            <button className="btn btn-primary" type="submit">Save work readiness</button>
          </div>
        </form>
      </section>
    </div>
  </div>;
}
