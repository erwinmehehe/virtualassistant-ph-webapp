import { AlertTriangle, CheckCircle2, Database, GitCommitHorizontal, ShieldCheck, Wrench } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { archiveStaleRolesAction, hideIncompletePublicProfilesAction, repairVaRecordsAction } from "@/app/actions/recruiter";
import { dateShort } from "@/lib/format";
import { getRuntimeSetupStatus } from "@/lib/env-status";

export default async function AdminHealthPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireRole("admin");
  const params = await searchParams;
  const admin = createAdminClient();
  const runtime = getRuntimeSetupStatus();
  const now = new Date().toISOString();

  const [
    vaAccountsRes,
    vaProfilesRes,
    summaryRes,
    errorsRes,
    errorRowsRes,
    failedPaymentsRes,
    failedEmailsRes,
    failedEmailRowsRes,
    incompletePublicRes,
    publishedJobsRes,
    pendingPublishedRes,
    commercialsRes,
    acceptedProposalsRes,
    wonLeadsRes,
    expiredSentProposalsRes
  ] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "va"),
    admin.from("va_profiles").select("user_id", { count: "exact", head: true }),
    admin.rpc("admin_health_summary"),
    admin.from("app_error_events").select("id", { count: "exact", head: true }).is("resolved_at", null),
    admin.from("app_error_events").select("id,message,path,role,created_at").is("resolved_at", null).order("created_at", { ascending: false }).limit(20),
    admin.from("payments").select("id", { count: "exact", head: true }).in("status", ["failed", "disputed"]),
    admin.from("outbound_email_events").select("id", { count: "exact", head: true }).eq("status", "failed").gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString()),
    admin.from("outbound_email_events").select("id,event_type,recipient,error_message,created_at").eq("status", "failed").order("created_at", { ascending: false }).limit(10),
    admin.from("recruiter_va_directory").select("user_id", { count: "exact", head: true }).eq("directory_visible", true).lt("completion_score", 100),
    admin.from("jobs").select("id,title,status,published_at,client_id").eq("status", "published").limit(1000),
    admin.from("jobs").select("id", { count: "exact", head: true }).eq("status", "pending").not("published_at", "is", null),
    admin.from("job_commercials").select("job_id,commercial_status").limit(5000),
    admin.from("lead_proposals").select("id,lead_id,job_id,status,accepted_at").eq("status", "accepted").limit(1000),
    admin.from("lead_intake").select("id,client_id,job_id,crm_stage").eq("crm_stage", "won").limit(1000),
    admin.from("lead_proposals").select("id", { count: "exact", head: true }).eq("status", "sent").lt("expires_at", now)
  ]);

  const vaAccounts = vaAccountsRes.count || 0;
  const vaProfiles = vaProfilesRes.count || 0;
  const summary = (summaryRes.data || {}) as Record<string, number>;
  const missingSlugs = Number(summary.missing_slugs || 0);
  const missingVetting = Number(summary.missing_vetting || 0);
  const orphanedApplications = Number(summary.orphaned_applications || 0);
  const rolesWithoutCandidates = Number(summary.roles_without_candidates || 0);

  const commercialMap = new Map((commercialsRes.data || []).map((row: any) => [row.job_id, String(row.commercial_status || "")]));
  const approvedCommercialStatuses = new Set(["accepted", "invoiced", "paid"]);
  const publishedWithoutTerms = (publishedJobsRes.data || []).filter((job: any) => job.client_id && !approvedCommercialStatuses.has(commercialMap.get(job.id) || "")).length;
  const legacyPublicRolesWithoutTerms = (publishedJobsRes.data || []).filter((job: any) => !job.client_id && !approvedCommercialStatuses.has(commercialMap.get(job.id) || "")).length;
  const acceptedProposalMissingJob = (acceptedProposalsRes.data || []).filter((proposal: any) => !proposal.job_id || !proposal.accepted_at).length;
  const wonLeadMissingHandoff = (wonLeadsRes.data || []).filter((lead: any) => !lead.client_id || !lead.job_id).length;
  const staleSentProposals = expiredSentProposalsRes.count || 0;

  const runtimeChecks = [
    ["Lead intake protection", runtime.leadIngest.configured, runtime.leadIngest.detail],
    ["Transactional email", runtime.appEmail.configured, runtime.appEmail.detail],
    ["Production URL", runtime.appUrl.configured, runtime.appUrl.detail],
    ["Deployment identity", runtime.deployment.configured, runtime.deployment.detail]
  ] as const;

  const releaseChecks = [
    ["Published roles without accepted terms", publishedWithoutTerms, "Must be zero before launch", publishedWithoutTerms === 0],
    ["Pending roles carrying a publish timestamp", pendingPublishedRes.count || 0, "Must be zero", (pendingPublishedRes.count || 0) === 0],
    ["Accepted proposals missing job linkage", acceptedProposalMissingJob, "Accepted proposals should point to a real hiring request", acceptedProposalMissingJob === 0],
    ["Won leads missing client/job handoff", wonLeadMissingHandoff, "Won opportunities should be connected to the client workspace", wonLeadMissingHandoff === 0],
    ["Expired proposals still marked sent", staleSentProposals, "Maintenance should retire these", staleSentProposals === 0]
  ] as const;
  const releaseBlockers = runtimeChecks.filter(([, ok]) => !ok).length + releaseChecks.filter(([, , , ok]) => !ok).length;

  const health = [
    ["VA accounts", vaAccounts, `${vaProfiles} structured VA profiles`, vaAccounts === vaProfiles],
    ["Broken profile URL records", missingSlugs, "Missing VA slugs should stay at zero", missingSlugs === 0],
    ["Missing vetting", missingVetting, "Should stay at zero", missingVetting === 0],
    ["Roles without candidates", rolesWithoutCandidates, "Active roles needing matching", rolesWithoutCandidates === 0],
    ["Orphaned applications", orphanedApplications, "Application job/VA references should stay valid", orphanedApplications === 0],
    ["Incomplete profiles marked public", incompletePublicRes.count || 0, "Should be hidden", (incompletePublicRes.count || 0) === 0],
    ["Unresolved app errors", errorsRes.count || 0, "Captured by internal error monitor", (errorsRes.count || 0) === 0],
    ["Failed emails (30d)", failedEmailsRes.count || 0, "Review Resend/domain configuration", (failedEmailsRes.count || 0) === 0],
    ["Failed / disputed payments", failedPaymentsRes.count || 0, "Requires finance review", (failedPaymentsRes.count || 0) === 0]
  ] as const;

  return <>
    <div className="page-head"><div><div className="kicker">Production readiness</div><h1>Agency health & release checks</h1><p>Verify the live funnel, runtime configuration, data integrity, email delivery, and talent operations before calling a release healthy.</p></div><div className={`release-status-pill ${releaseBlockers ? "warn" : "ok"}`}>{releaseBlockers ? <AlertTriangle size={17}/> : <CheckCircle2 size={17}/>}<span>{releaseBlockers ? `${releaseBlockers} release blocker${releaseBlockers === 1 ? "" : "s"}` : "Release checks clear"}</span></div></div>

    {params.repaired ? <div className="success-banner">VA repair completed: {params.repaired} records changed.</div> : null}
    {params.hidden ? <div className="success-banner">Hidden {params.hidden} incomplete public profiles.</div> : null}
    {params.archived ? <div className="success-banner">Archived {params.archived} stale roles.</div> : null}

    <section className="card release-readiness-card">
      <div className="dashboard-section-head"><div><div className="row"><ShieldCheck size={19}/><h2>Production QA</h2></div><p>These checks target the agency-first lead, proposal, approval, and client handoff flow.</p></div>{runtime.deployment.commitSha ? <span className="badge"><GitCommitHorizontal size={13}/> {runtime.deployment.commitSha.slice(0, 8)}</span> : null}</div>
      <div className="release-check-grid">
        {runtimeChecks.map(([label, ok, detail]) => <div className={`release-check ${ok ? "ok" : "warn"}`} key={label}>{ok ? <CheckCircle2 size={18}/> : <AlertTriangle size={18}/>}<div><strong>{label}</strong><span>{detail}</span></div></div>)}
        {releaseChecks.map(([label, value, detail, ok]) => <div className={`release-check ${ok ? "ok" : "warn"}`} key={label}>{ok ? <CheckCircle2 size={18}/> : <AlertTriangle size={18}/>}<div><strong>{label}: {value}</strong><span>{detail}</span></div></div>)}
      </div>
      <div className="release-runtime-line"><strong>Runtime:</strong> {runtime.deployment.environment}{runtime.deployment.host ? ` · ${runtime.deployment.host}` : ""}<span>Supabase Auth SMTP is checked outside the app and should be verified separately.</span>{legacyPublicRolesWithoutTerms ? <span>{legacyPublicRolesWithoutTerms} legacy public role{legacyPublicRolesWithoutTerms === 1 ? "" : "s"} have no client/commercial record and are excluded from the client-approval release check.</span> : null}</div>
    </section>

    <div className="health-grid">{health.map(([label, value, copy, ok]) => <div className={`health-card ${ok ? "ok" : "warn"}`} key={label}>{ok ? <CheckCircle2 size={19}/> : <AlertTriangle size={19}/>}<div><span>{label}</span><strong>{value}</strong><small>{copy}</small></div></div>)}</div>

    <div className="grid-2">
      <section className="card"><div className="row"><Wrench size={20}/><h2 style={{ margin: 0 }}>Safe housekeeping</h2></div><p className="muted">Admin-only repair actions for known structural issues.</p><div className="stack"><form action={repairVaRecordsAction}><button className="btn btn-primary" type="submit">Repair missing VA records & slugs</button></form><form action={hideIncompletePublicProfilesAction}><button className="btn" type="submit">Hide incomplete public profiles</button></form><form action={archiveStaleRolesAction} className="row wrap"><input type="hidden" name="days" value="90"/><button className="btn" type="submit">Archive 90+ day stale roles</button></form></div></section>
      <section className="card"><div className="row"><Database size={20}/><h2 style={{ margin: 0 }}>Recent failures</h2></div>{errorRowsRes.data?.length ? <><h3 className="ops-subhead">Application errors</h3><div className="compact-list">{errorRowsRes.data.map((row: any) => <div className="compact-static" key={row.id}><span><strong>{row.message}</strong><small>{row.path || "Unknown path"} · {row.role || "visitor"}</small></span><small>{dateShort(row.created_at)}</small></div>)}</div></> : null}{failedEmailRowsRes.data?.length ? <><h3 className="ops-subhead">Email delivery</h3><div className="compact-list">{failedEmailRowsRes.data.map((row: any) => <div className="compact-static" key={row.id}><span><strong>{String(row.event_type).replaceAll("_", " ")}</strong><small>{row.error_message || "Provider rejected the message"}{row.recipient ? ` · ${row.recipient}` : ""}</small></span><small>{dateShort(row.created_at)}</small></div>)}</div></> : null}{!errorRowsRes.data?.length && !failedEmailRowsRes.data?.length ? <div className="empty">No unresolved application or recent email errors.</div> : null}</section>
    </div>
  </>;
}
