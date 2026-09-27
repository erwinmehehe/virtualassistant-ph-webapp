import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock3, Laptop2, Network, PlugZap, ShieldCheck, Wrench } from "lucide-react";
import { bulkWorkReadinessAction, verifyVaWorkSetupAction } from "@/app/actions/work-readiness";
import { PublicAvatar } from "@/components/public-avatar";
import { WorkReadinessBulkSelect } from "@/components/work-readiness-bulk-select";
import { requireAnyRoleFast } from "@/lib/auth";
import { getWorkReadinessQueue, type WorkReadinessQueueRow } from "@/lib/work-readiness-queue";

function dateLabel(value?: string | null) {
  if (!value) return "Not submitted";
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}

function missingEvidence(setup: WorkReadinessQueueRow) {
  return [
    !setup.work_setup_computer ? "computer" : null,
    !setup.work_setup_os ? "operating system" : null,
    !setup.work_setup_ram_gb ? "RAM" : null,
    !setup.primary_internet ? "primary internet" : null,
    !setup.backup_internet ? "backup internet" : null,
    !setup.backup_power ? "backup power" : null,
    !setup.headset_ready ? "headset" : null,
    !setup.webcam_ready ? "webcam" : null,
    !setup.quiet_workspace ? "quiet workspace" : null,
  ].filter(Boolean) as string[];
}

const VIEWS = ["ready", "incomplete", "overdue", "verified", "all"] as const;
type View = (typeof VIEWS)[number];

function queueHref(query: Record<string, string | undefined>, overrides: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...query, ...overrides })) {
    if (value) params.set(key, value);
  }
  const suffix = params.toString();
  return "/workspace/recruiter/work-readiness" + (suffix ? "?" + suffix : "");
}

export default async function WorkReadinessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const query = await searchParams;
  const { userId } = await requireAnyRoleFast(["recruiter", "admin"]);
  const { rows, error } = await getWorkReadinessQueue(userId);
  if (error) throw error;

  const annotated = rows.map((setup) => ({ setup, missing: missingEvidence(setup) }));
  const ready = annotated.filter(({ setup, missing }) => !setup.work_setup_verified_at && missing.length === 0);
  const incomplete = annotated.filter(({ setup, missing }) => !setup.work_setup_verified_at && missing.length > 0);
  const verified = annotated.filter(({ setup }) => Boolean(setup.work_setup_verified_at));
  const overdueCutoff = Date.now() - 5 * 86400000;
  const overdue = annotated.filter(({ setup }) =>
    !setup.work_setup_verified_at &&
    Boolean(setup.work_setup_submitted_at) &&
    new Date(setup.work_setup_submitted_at || 0).getTime() <= overdueCutoff
  );

  const requested = String(query.view || "");
  const view: View = (VIEWS as readonly string[]).includes(requested) ? requested as View : "ready";
  const missingFilter = ["internet", "power", "equipment", "workspace"].includes(String(query.missing || ""))
    ? String(query.missing)
    : "";

  const baseRows = view === "ready" ? ready
    : view === "incomplete" ? incomplete
      : view === "overdue" ? overdue
        : view === "verified" ? verified
          : annotated;

  const filtered = baseRows
    .filter(({ missing }) => {
      if (missingFilter === "internet" && !missing.some((item) => item.includes("internet"))) return false;
      if (missingFilter === "power" && !missing.includes("backup power")) return false;
      if (missingFilter === "equipment" && !missing.some((item) => ["computer", "operating system", "RAM", "headset", "webcam"].includes(item))) return false;
      if (missingFilter === "workspace" && !missing.includes("quiet workspace")) return false;
      return true;
    })
    .sort((a, b) => new Date(a.setup.work_setup_submitted_at || 0).getTime() - new Date(b.setup.work_setup_submitted_at || 0).getTime());

  const labels: Record<View, string> = {
    ready: "Ready to verify",
    incomplete: "Incomplete",
    overdue: "Overdue",
    verified: "Verified",
    all: "All submitted",
  };
  const currentUrl = queueHref(query, { view, missing: missingFilter || undefined });
  const canFilterMissing = view === "incomplete" || view === "overdue" || view === "all";
  const canBulk = view !== "verified";

  return <div className="recruiter-readiness-page">
    {query.work_setup_verified ? <div className="success-banner" role="status">Work setup verified. Clients can now see the verified readiness signal without seeing private device or network details.</div> : null}
    {query.bulk_done ? <div className="success-banner" role="status">Bulk {query.bulk_done === "verify" ? "verification" : "reminder"} complete · {Number(query.affected || 0)} affected{Number(query.skipped || 0) ? ` · ${Number(query.skipped)} skipped` : ""}.</div> : null}
    {query.bulk_error ? <div className="alert" role="alert">{query.bulk_error}</div> : null}

    <div className="page-head recruiter-readiness-head">
      <div>
        <div className="kicker">Talent operations</div>
        <h1>Work readiness</h1>
        <p>Verify complete setups first, then clear overdue and incomplete evidence without scanning the full VA directory.</p>
      </div>
      <Link className="btn" href="/workspace/recruiter/talent">Open Talent directory</Link>
    </div>

    <div className="recruiter-readiness-summary" aria-label="Work readiness priorities">
      <Link href={queueHref(query,{view:"ready",missing:undefined})} className={`is-ready ${view === "ready" ? "active" : ""}`}>
        <span>Ready to verify</span>
        <strong>{ready.length}</strong>
        <small>Complete evidence, recruiter decision next</small>
      </Link>
      <Link href={queueHref(query,{view:"incomplete"})} className={`is-incomplete ${view === "incomplete" ? "active" : ""}`}>
        <span>Incomplete</span>
        <strong>{incomplete.length}</strong>
        <small>VA still has missing setup evidence</small>
      </Link>
      <Link href={queueHref(query,{view:"overdue"})} className={`is-overdue ${view === "overdue" ? "active" : ""}`}>
        <span>Overdue 5d+</span>
        <strong>{overdue.length}</strong>
        <small>Unverified for five or more days</small>
      </Link>
    </div>

    <section className="recruiter-readiness-panel">
      <div className="recruiter-readiness-toolbar">
        <div>
          <h2>{labels[view]}</h2>
          <p>{filtered.length} VA{filtered.length === 1 ? "" : "s"} in this queue. Oldest submissions appear first.</p>
        </div>
        <div className="recruiter-readiness-tabs" aria-label="Secondary work readiness views">
          <Link href={queueHref(query,{view:"verified",missing:undefined})} className={view === "verified" ? "active" : ""}>Verified <span>{verified.length}</span></Link>
          <Link href={queueHref(query,{view:"all"})} className={view === "all" ? "active" : ""}>All submitted <span>{rows.length}</span></Link>
        </div>
      </div>

      <div className="recruiter-readiness-privacy">
        <ShieldCheck size={16}/>
        <span><strong>Private recruiter evidence.</strong> Clients only see whether work readiness is verified, never the device, network, or backup details below.</span>
      </div>

      {(canFilterMissing || canBulk) ? <div className="recruiter-readiness-ops">
        {canFilterMissing ? <form className="recruiter-readiness-filters recruiter-readiness-filters-compact" method="get">
          <input type="hidden" name="view" value={view}/>
          <label>
            <span>Missing evidence</span>
            <select name="missing" defaultValue={missingFilter}>
              <option value="">Any type</option>
              <option value="internet">Internet</option>
              <option value="power">Backup power</option>
              <option value="equipment">Computer / equipment</option>
              <option value="workspace">Quiet workspace</option>
            </select>
          </label>
          <button className="btn btn-sm" type="submit">Apply</button>
          {missingFilter ? <Link className="text-link" href={queueHref(query,{view,missing:undefined})}>Clear</Link> : null}
        </form> : <div className="small muted">Use the priority cards above to switch queues.</div>}

        {canBulk ? <form id="work-readiness-bulk" action={bulkWorkReadinessAction} className="recruiter-readiness-bulk">
          <input type="hidden" name="return_to" value={currentUrl}/>
          <WorkReadinessBulkSelect/>
          <select name="bulk_action" defaultValue="" required aria-label="Work readiness bulk action">
            <option value="" disabled>Bulk action…</option>
            <option value="verify">Verify complete selected</option>
            <option value="remind">Send in-app reminder to incomplete selected</option>
          </select>
          <button className="btn btn-primary btn-sm" type="submit">Run action</button>
        </form> : null}
      </div> : null}

      {filtered.length ? <div className="recruiter-readiness-list">{filtered.map(({ setup, missing }) => {
        const complete = missing.length === 0;
        const isVerified = Boolean(setup.work_setup_verified_at);
        const isOverdue = !isVerified && Boolean(setup.work_setup_submitted_at) && new Date(setup.work_setup_submitted_at || 0).getTime() <= overdueCutoff;
        const status = isVerified ? "Verified" : complete ? "Ready to verify" : "Incomplete";
        return <article className="recruiter-readiness-item" key={setup.user_id}>
          <div className="recruiter-readiness-item-head">
            <div className="recruiter-readiness-identity">
              {!isVerified ? <input className="recruiter-readiness-check" type="checkbox" form="work-readiness-bulk" name="va_id" value={setup.user_id} aria-label={`Select ${setup.full_name || "Virtual Assistant"}`}/> : null}
              <PublicAvatar name={setup.full_name || "VA"} src={setup.avatar_url} size="sm"/>
              <div>
                <div className="row wrap">
                  <Link className="text-link recruiter-readiness-name" href={"/workspace/recruiter/candidates/" + setup.user_id}>{setup.full_name || "Virtual Assistant"}</Link>
                  <span className={"recruiter-readiness-status " + (isVerified ? "is-verified" : complete ? "is-ready" : "is-incomplete")}>
                    {isVerified ? <CheckCircle2 size={13}/> : complete ? <ShieldCheck size={13}/> : <AlertTriangle size={13}/>} {status}
                  </span>
                  {isOverdue ? <span className="recruiter-readiness-status is-overdue"><Clock3 size={13}/> Overdue</span> : null}
                </div>
                <span className="recruiter-readiness-submitted"><Clock3 size={12}/> Submitted {dateLabel(setup.work_setup_submitted_at)}</span>
              </div>
            </div>
            {!isVerified && complete
              ? <span className="recruiter-readiness-next">Next: recruiter verification</span>
              : !isVerified
                ? <span className="recruiter-readiness-next">Next: VA completes missing evidence</span>
                : null}
          </div>

          <div className="recruiter-readiness-evidence">
            <div><span className="recruiter-readiness-evidence-icon"><Laptop2 size={16}/></span><span><small>Computer</small><strong>{setup.work_setup_computer || "Missing"}</strong><em>{setup.work_setup_os || "OS missing"} · {setup.work_setup_ram_gb || "?"} GB RAM</em></span></div>
            <div><span className="recruiter-readiness-evidence-icon"><Network size={16}/></span><span><small>Internet</small><strong>{setup.primary_internet || "Primary missing"}</strong><em>Backup: {setup.backup_internet || "missing"}</em></span></div>
            <div><span className="recruiter-readiness-evidence-icon"><PlugZap size={16}/></span><span><small>Continuity</small><strong>{setup.backup_power || "Power backup missing"}</strong><em>Headset {setup.headset_ready ? "✓" : "✕"} · Webcam {setup.webcam_ready ? "✓" : "✕"} · Quiet space {setup.quiet_workspace ? "✓" : "✕"}</em></span></div>
          </div>

          {!isVerified && missing.length ? <div className="recruiter-readiness-blockers"><Wrench size={14}/><span><strong>Missing:</strong> {missing.join(", ")}</span></div> : null}

          {!isVerified && complete ? <form action={verifyVaWorkSetupAction} className="recruiter-readiness-verify">
            <input type="hidden" name="va_id" value={setup.user_id}/>
            <input type="hidden" name="return_to" value={currentUrl}/>
            <label><span>Verification note <em>optional</em></span><input name="verification_notes" maxLength={2000} placeholder="Example: reviewed during video interview; backup internet and power confirmed."/></label>
            <button className="btn btn-primary" type="submit">Verify work setup</button>
          </form> : isVerified ? <div className="recruiter-readiness-verified-note"><CheckCircle2 size={14}/><span>Verified {dateLabel(setup.work_setup_verified_at)}{setup.work_setup_verification_notes ? " · " + setup.work_setup_verification_notes : ""}</span></div> : null}
        </article>;
      })}</div> : <div className="empty">Nothing needs attention in this view.</div>}
    </section>
  </div>;
}
