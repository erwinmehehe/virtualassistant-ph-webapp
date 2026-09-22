import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock3, Laptop2, Network, PlugZap, ShieldCheck, Wrench } from "lucide-react";
import { requireAnyRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyVaWorkSetupAction } from "@/app/actions/work-readiness";
import type { ProfileSummaryRow, WorkSetupRow } from "@/lib/workspace-rows";

function dateLabel(value?: string | null) {
  if (!value) return "Not submitted";
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" }).format(new Date(value));
}

function missingEvidence(setup: WorkSetupRow) {
  return [
    !setup.work_setup_computer ? "computer" : null,
    !setup.work_setup_os ? "operating system" : null,
    !setup.work_setup_ram_gb ? "RAM" : null,
    !setup.primary_internet ? "primary internet" : null,
    !setup.backup_internet ? "backup internet" : null,
    !setup.backup_power ? "backup power" : null,
    !setup.headset_ready ? "headset" : null,
    !setup.webcam_ready ? "webcam" : null,
    !setup.quiet_workspace ? "quiet workspace" : null
  ].filter(Boolean) as string[];
}

const VIEWS = [
  ["action", "Needs action"],
  ["ready", "Ready to verify"],
  ["incomplete", "Incomplete"],
  ["verified", "Verified"],
  ["all", "All submitted"]
] as const;

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
  const annotated = rows.map((setup) => ({ setup, missing: missingEvidence(setup) }));
  const ready = annotated.filter(({ setup, missing }) => !setup.work_setup_verified_at && missing.length === 0);
  const incomplete = annotated.filter(({ setup, missing }) => !setup.work_setup_verified_at && missing.length > 0);
  const verified = annotated.filter(({ setup }) => Boolean(setup.work_setup_verified_at));
  const view = VIEWS.some(([key]) => key === query.view) ? String(query.view) : "action";
  const filtered = (view === "ready" ? ready
    : view === "incomplete" ? incomplete
      : view === "verified" ? verified
        : view === "all" ? annotated
          : [...ready, ...incomplete])
    .sort((a, b) => {
      if (Boolean(a.setup.work_setup_verified_at) !== Boolean(b.setup.work_setup_verified_at)) return a.setup.work_setup_verified_at ? 1 : -1;
      if (a.missing.length !== b.missing.length) return a.missing.length - b.missing.length;
      return new Date(b.setup.work_setup_submitted_at || 0).getTime() - new Date(a.setup.work_setup_submitted_at || 0).getTime();
    });

  const counts = new Map<string, number>([
    ["action", ready.length + incomplete.length],
    ["ready", ready.length],
    ["incomplete", incomplete.length],
    ["verified", verified.length],
    ["all", rows.length]
  ]);

  return <div className="recruiter-readiness-page">
    {query.work_setup_verified ? <div className="success-banner" role="status">Work setup verified. Clients can now see the verified readiness signal without seeing private device or network details.</div> : null}

    <div className="page-head recruiter-readiness-head">
      <div>
        <div className="kicker">Talent operations</div>
        <h1>Work readiness</h1>
        <p>Review only what needs attention. Verify complete setups quickly, and send incomplete VAs back with a clear checklist.</p>
      </div>
      <Link className="btn" href="/workspace/recruiter/talent">Open Talent directory</Link>
    </div>

    <div className="recruiter-readiness-summary" aria-label="Work readiness summary">
      <Link href="/workspace/recruiter/work-readiness?view=action" className={view === "action" ? "active" : ""}><span>Needs action</span><strong>{ready.length + incomplete.length}</strong><small>Not verified yet</small></Link>
      <Link href="/workspace/recruiter/work-readiness?view=ready" className={view === "ready" ? "active" : ""}><span>Ready to verify</span><strong>{ready.length}</strong><small>All evidence present</small></Link>
      <Link href="/workspace/recruiter/work-readiness?view=incomplete" className={view === "incomplete" ? "active" : ""}><span>Incomplete</span><strong>{incomplete.length}</strong><small>Missing setup evidence</small></Link>
      <Link href="/workspace/recruiter/work-readiness?view=verified" className={view === "verified" ? "active" : ""}><span>Verified</span><strong>{verified.length}</strong><small>Client-ready signal</small></Link>
    </div>

    <section className="recruiter-readiness-panel">
      <div className="recruiter-readiness-toolbar">
        <div>
          <h2>Verification queue</h2>
          <p>{filtered.length} VA{filtered.length === 1 ? "" : "s"} in this view. Ready-to-verify profiles are shown first.</p>
        </div>
        <div className="recruiter-readiness-tabs">
          {VIEWS.map(([key, label]) => <Link key={key} href={"/workspace/recruiter/work-readiness?view=" + key} className={view === key ? "active" : ""}>{label}<span>{counts.get(key) || 0}</span></Link>)}
        </div>
      </div>

      <div className="recruiter-readiness-privacy"><ShieldCheck size={16}/><span><strong>Private recruiter evidence.</strong> Clients only see whether work readiness is verified, never the device, network, or backup details below.</span></div>

      {filtered.length ? <div className="recruiter-readiness-list">{filtered.map(({ setup, missing }) => {
        const person = names.get(setup.user_id);
        const complete = missing.length === 0;
        const isVerified = Boolean(setup.work_setup_verified_at);
        const status = isVerified ? "Verified" : complete ? "Ready to verify" : "Incomplete";
        return <article className="recruiter-readiness-item" key={setup.user_id}>
          <div className="recruiter-readiness-item-head">
            <div>
              <div className="row wrap">
                <Link className="text-link recruiter-readiness-name" href={"/workspace/recruiter/candidates/" + setup.user_id}>{person?.full_name || "Virtual Assistant"}</Link>
                <span className={"recruiter-readiness-status " + (isVerified ? "is-verified" : complete ? "is-ready" : "is-incomplete")}>{isVerified ? <CheckCircle2 size={13}/> : complete ? <ShieldCheck size={13}/> : <AlertTriangle size={13}/>} {status}</span>
              </div>
              <span className="recruiter-readiness-submitted"><Clock3 size={12}/> Submitted {dateLabel(setup.work_setup_submitted_at)}</span>
            </div>
            {!isVerified && complete ? <span className="recruiter-readiness-next">Next: recruiter verification</span> : !isVerified ? <span className="recruiter-readiness-next">Next: VA completes missing evidence</span> : null}
          </div>

          <div className="recruiter-readiness-evidence">
            <div><span className="recruiter-readiness-evidence-icon"><Laptop2 size={16}/></span><span><small>Computer</small><strong>{setup.work_setup_computer || "Missing"}</strong><em>{setup.work_setup_os || "OS missing"} · {setup.work_setup_ram_gb || "?"} GB RAM</em></span></div>
            <div><span className="recruiter-readiness-evidence-icon"><Network size={16}/></span><span><small>Internet</small><strong>{setup.primary_internet || "Primary missing"}</strong><em>Backup: {setup.backup_internet || "missing"}</em></span></div>
            <div><span className="recruiter-readiness-evidence-icon"><PlugZap size={16}/></span><span><small>Continuity</small><strong>{setup.backup_power || "Power backup missing"}</strong><em>Headset {setup.headset_ready ? "✓" : "✕"} · Webcam {setup.webcam_ready ? "✓" : "✕"} · Quiet space {setup.quiet_workspace ? "✓" : "✕"}</em></span></div>
          </div>

          {!isVerified && missing.length ? <div className="recruiter-readiness-blockers"><Wrench size={14}/><span><strong>Missing:</strong> {missing.join(", ")}</span></div> : null}

          {!isVerified && complete ? <form action={verifyVaWorkSetupAction} className="recruiter-readiness-verify">
            <input type="hidden" name="va_id" value={setup.user_id}/>
            <input type="hidden" name="return_to" value={"/workspace/recruiter/work-readiness?view=" + view}/>
            <label><span>Verification note <em>optional</em></span><input name="verification_notes" maxLength={2000} placeholder="Example: reviewed during video interview; backup internet and power confirmed."/></label>
            <button className="btn btn-primary" type="submit">Verify setup</button>
          </form> : isVerified ? <div className="recruiter-readiness-verified-note"><CheckCircle2 size={14}/><span>Verified {dateLabel(setup.work_setup_verified_at)}{setup.work_setup_verification_notes ? " · " + setup.work_setup_verification_notes : ""}</span></div> : null}
        </article>;
      })}</div> : <div className="empty">Nothing needs attention in this view.</div>}
    </section>
  </div>;
}
