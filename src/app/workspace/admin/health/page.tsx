import { AlertTriangle, CheckCircle2, Database, Wrench } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { archiveStaleRolesAction, hideIncompletePublicProfilesAction, repairVaRecordsAction } from "@/app/actions/recruiter";
import { dateShort } from "@/lib/format";

export default async function AdminHealthPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireRole("admin");
  const params = await searchParams;
  const admin = createAdminClient();

  const [
    vaAccountsRes,
    vaProfilesRes,
    vaProfileRowsRes,
    vettingRowsRes,
    jobsRes,
    allJobsRes,
    vaIdsRes,
    shortlistRes,
    appsRes,
    errorsRes,
    errorRowsRes,
    failedPaymentsRes,
    failedEmailsRes,
    failedEmailRowsRes,
    incompletePublicRes
  ] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "va"),
    admin.from("va_profiles").select("user_id", { count: "exact", head: true }),
    admin.from("va_profiles").select("user_id,slug"),
    admin.from("va_vetting").select("va_id"),
    admin.from("jobs").select("id,title,status,updated_at").in("status", ["pending", "published"]),
    admin.from("jobs").select("id").limit(5000),
    admin.from("profiles").select("id").eq("role", "va").limit(5000),
    admin.from("job_shortlist_candidates").select("job_id").in("shortlist_status", ["proposed", "released"]),
    admin.from("applications").select("id,job_id,va_id").limit(5000),
    admin.from("app_error_events").select("id", { count: "exact", head: true }).is("resolved_at", null),
    admin.from("app_error_events").select("id,message,path,role,created_at").is("resolved_at", null).order("created_at", { ascending: false }).limit(20),
    admin.from("payments").select("id", { count: "exact", head: true }).in("status", ["failed", "disputed"]),
    admin.from("outbound_email_events").select("id", { count: "exact", head: true }).eq("status", "failed").gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString()),
    admin.from("outbound_email_events").select("id,event_type,recipient,error_message,created_at").eq("status", "failed").order("created_at", { ascending: false }).limit(10),
    admin.from("recruiter_va_directory").select("user_id", { count: "exact", head: true }).eq("directory_visible", true).lt("completion_score", 100)
  ]);

  const vaAccounts = vaAccountsRes.count || 0;
  const vaProfiles = vaProfilesRes.count || 0;
  const vaProfileRows = vaProfileRowsRes.data || [];
  const vettingIds = new Set((vettingRowsRes.data || []).map((row: any) => row.va_id));
  const missingSlugs = vaProfileRows.filter((row: any) => !String(row.slug || "").trim()).length;
  const missingVetting = vaProfileRows.filter((row: any) => !vettingIds.has(row.user_id)).length;
  const allJobIds = new Set((allJobsRes.data || []).map((row: any) => row.id));
  const allVaIds = new Set((vaIdsRes.data || []).map((row: any) => row.id));
  const orphanedApplications = (appsRes.data || []).filter((row: any) => !allJobIds.has(row.job_id) || !allVaIds.has(row.va_id)).length;
  const candidateJobs = new Set([
    ...(shortlistRes.data || []).map((row: any) => row.job_id),
    ...(appsRes.data || []).map((row: any) => row.job_id)
  ]);
  const unassigned = (jobsRes.data || []).filter((job: any) => !candidateJobs.has(job.id));

  const health = [
    ["VA accounts", vaAccounts, `${vaProfiles} structured VA profiles`, vaAccounts === vaProfiles],
    ["Broken profile URL records", missingSlugs, "Missing VA slugs should stay at zero", missingSlugs === 0],
    ["Missing vetting", missingVetting, "Should stay at zero", missingVetting === 0],
    ["Roles without candidates", unassigned.length, "Active roles needing matching", unassigned.length === 0],
    ["Orphaned applications", orphanedApplications, "Application job/VA references should stay valid", orphanedApplications === 0],
    ["Incomplete profiles marked public", incompletePublicRes.count || 0, "Should be hidden", (incompletePublicRes.count || 0) === 0],
    ["Unresolved app errors", errorsRes.count || 0, "Captured by internal error monitor", (errorsRes.count || 0) === 0],
    ["Failed emails (30d)", failedEmailsRes.count || 0, "Review Resend/domain configuration", (failedEmailsRes.count || 0) === 0],
    ["Failed / disputed payments", failedPaymentsRes.count || 0, "Requires finance review", (failedPaymentsRes.count || 0) === 0]
  ] as const;

  return <>
    <div className="page-head"><div><div className="kicker">Internal operations</div><h1>Marketplace health & repair</h1><p>Catch schema/data drift, broken VA routing, stale roles, and application errors before users report them.</p></div></div>
    {params.repaired ? <div className="success-banner">VA repair completed: {params.repaired} records changed.</div> : null}
    {params.hidden ? <div className="success-banner">Hidden {params.hidden} incomplete public profiles.</div> : null}
    {params.archived ? <div className="success-banner">Archived {params.archived} stale roles.</div> : null}

    <div className="health-grid">{health.map(([label, value, copy, ok]) => <div className={`health-card ${ok ? "ok" : "warn"}`} key={label}>{ok ? <CheckCircle2 size={19}/> : <AlertTriangle size={19}/>}<div><span>{label}</span><strong>{value}</strong><small>{copy}</small></div></div>)}</div>

    <div className="grid-2">
      <section className="card"><div className="row"><Wrench size={20}/><h2 style={{ margin: 0 }}>Safe housekeeping</h2></div><p className="muted">Admin-only, logged actions. These repair known structural issues without exposing direct SQL controls.</p><div className="stack"><form action={repairVaRecordsAction}><button className="btn btn-primary" type="submit">Repair missing VA records & slugs</button></form><form action={hideIncompletePublicProfilesAction}><button className="btn" type="submit">Hide incomplete public profiles</button></form><form action={archiveStaleRolesAction} className="row wrap"><input type="hidden" name="days" value="90"/><button className="btn" type="submit">Archive 90+ day stale roles</button></form></div></section>
      <section className="card"><div className="row"><Database size={20}/><h2 style={{ margin: 0 }}>Recent failures</h2></div>{errorRowsRes.data?.length ? <><h3 className="ops-subhead">Application errors</h3><div className="compact-list">{errorRowsRes.data.map((row: any) => <div className="compact-static" key={row.id}><span><strong>{row.message}</strong><small>{row.path || "Unknown path"} · {row.role || "visitor"}</small></span><small>{dateShort(row.created_at)}</small></div>)}</div></> : null}{failedEmailRowsRes.data?.length ? <><h3 className="ops-subhead">Email delivery</h3><div className="compact-list">{failedEmailRowsRes.data.map((row: any) => <div className="compact-static" key={row.id}><span><strong>{String(row.event_type).replaceAll("_", " ")}</strong><small>{row.error_message || "Provider rejected the message"}{row.recipient ? ` · ${row.recipient}` : ""}</small></span><small>{dateShort(row.created_at)}</small></div>)}</div></> : null}{!errorRowsRes.data?.length && !failedEmailRowsRes.data?.length ? <div className="empty">No unresolved application or recent email errors.</div> : null}</section>
    </div>
  </>;
}
