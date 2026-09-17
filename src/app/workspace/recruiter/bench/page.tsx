import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, ShieldCheck, Sparkles, UsersRound } from "lucide-react";
import { bulkAddBenchMembersAction } from "@/app/actions/bench";
import { addBenchMemberAction, updateBenchMemberAction } from "@/app/actions/vetting";
import { BenchBulkSelectAll } from "@/components/bench-bulk-select-all";
import { requireRole } from "@/lib/auth";
import { DEFAULT_BENCH_TARGET, VA_CATEGORIES, vaCategoryLabel } from "@/lib/constants";
import { dateShort } from "@/lib/format";
import {
  TALENT_AVAILABILITY_FRESH_DAYS,
  talentCoverage,
  talentCoverageLabel,
  talentReadiness,
  talentReadinessActions,
  type TalentCoverageStatus,
} from "@/lib/talent-operations";
import { createAdminClient } from "@/lib/supabase/admin";
import type { BenchMembershipRow, OpenJobRow, ProfileSummaryRow, TalentHealthRow, VaReadinessRow, VettingStageRow } from "@/lib/workspace-rows";

const HEALTH_TONE: Record<string, string> = { Hot: "badge-success", Active: "badge-success", Cooling: "badge-warning", Stale: "badge-warning", Placed: "" };
const COVERAGE_TONE: Record<TalentCoverageStatus, string> = { source: "badge-danger", develop: "badge-warning", covered: "badge-success", surplus: "" };

export default async function RecruiterTalentOperations() {
  await requireRole("recruiter");
  const admin = createAdminClient();
  const now = Date.now();

  const [{ data: memberData }, { data: vettingData }, { data: healthData }, { data: openJobData }] = await Promise.all([
    admin.from("bench_memberships").select("*").order("category").order("priority", { ascending: false }),
    admin.from("va_vetting").select("va_id,stage").in("stage", ["finalist", "approved", "bench"]).limit(500),
    admin.rpc("recruiter_talent_health"),
    admin.from("jobs").select("id,title,status,categories,created_at").in("status", ["pending", "published"]).order("created_at", { ascending: false }).limit(500),
  ]);

  const members = (memberData || []) as BenchMembershipRow[];
  const vettingRows = (vettingData || []) as VettingStageRow[];
  const healthRows = (healthData || []) as TalentHealthRow[];
  const openJobs = (openJobData || []) as OpenJobRow[];

  const candidateIds = [...new Set([...members.map((row) => row.va_id), ...vettingRows.map((row) => row.va_id)])];
  const [{ data: profileData }, { data: vaData }] = candidateIds.length
    ? await Promise.all([
        admin.from("profiles").select("id,full_name,account_status").in("id", candidateIds),
        admin
          .from("va_profiles")
          .select("user_id,headline,primary_category,categories,weekly_hours,availability_status,availability_confirmed_at,work_setup_verified_at")
          .in("user_id", candidateIds),
      ])
    : [{ data: [] }, { data: [] }];

  const profileMap = new Map(((profileData || []) as ProfileSummaryRow[]).map((row) => [row.id, row]));
  const vaMap = new Map(((vaData || []) as VaReadinessRow[]).map((row) => [row.user_id, row]));
  const healthMap = new Map(healthRows.map((row) => [row.va_id, row]));
  const vettingMap = new Map(vettingRows.map((row) => [row.va_id, row]));
  const activeMembershipMap = new Map(members.filter((row) => row.status === "active").map((row) => [row.va_id, row]));
  const anyMembershipIds = new Set(members.map((row) => row.va_id));

  const candidates = candidateIds.map((vaId) => {
    const profile = profileMap.get(vaId);
    const va = vaMap.get(vaId);
    const vetting = vettingMap.get(vaId);
    const membership = activeMembershipMap.get(vaId);
    const health = healthMap.get(vaId);
    const readinessInput = {
      stage: vetting?.stage,
      activePool: Boolean(membership),
      availabilityStatus: va?.availability_status,
      availabilityConfirmedAt: va?.availability_confirmed_at,
      workSetupVerifiedAt: va?.work_setup_verified_at,
    };
    return {
      vaId,
      profile,
      va,
      vetting,
      membership,
      health,
      category: membership?.category || va?.primary_category || "",
      readiness: talentReadiness(readinessInput, now),
      actions: talentReadinessActions(readinessInput, now),
    };
  }).filter((candidate) => candidate.profile?.account_status === "active");

  const readyRows = candidates.filter((candidate) => candidate.readiness === "client_ready");
  const nearReadyRows = candidates.filter((candidate) => candidate.readiness === "near_ready");
  const unavailableRows = candidates.filter((candidate) => candidate.readiness === "unavailable");

  const demandCounts = new Map<string, number>();
  for (const job of openJobs) {
    const rawCategories: unknown[] = Array.isArray(job.categories) ? job.categories : [];
    const categories = [...new Set(rawCategories.filter((value): value is string => typeof value === "string" && value.length > 0))];
    for (const category of categories) demandCounts.set(category, (demandCounts.get(category) || 0) + 1);
  }

  const coverageRows = VA_CATEGORIES.map((category) => {
    const ready = readyRows.filter((candidate) => candidate.category === category).length;
    const nearReady = nearReadyRows.filter((candidate) => candidate.category === category).length;
    const unavailable = unavailableRows.filter((candidate) => candidate.category === category).length;
    const demand = demandCounts.get(category) || 0;
    const model = talentCoverage({ ready, nearReady, demand, target: DEFAULT_BENCH_TARGET });
    return { category, ready, nearReady, unavailable, demand, target: DEFAULT_BENCH_TARGET, ...model };
  }).sort((a, b) => b.sourcingGap - a.sourcingGap || b.demand - a.demand || b.readyGap - a.readyGap || a.category.localeCompare(b.category));

  const sourceNext = coverageRows.filter((row) => row.status === "source");
  const developmentQueue = [...nearReadyRows]
    .sort((a, b) => a.actions.length - b.actions.length || Number(Boolean(b.health?.health === "Hot")) - Number(Boolean(a.health?.health === "Hot")))
    .slice(0, 12);
  const approvedWaiting = vettingRows.filter((row) => ["approved", "bench"].includes(row.stage) && !anyMembershipIds.has(row.va_id));

  return <>
    <div className="page-head">
      <div>
        <div className="kicker">Talent Operations OS</div>
        <h1>Talent supply & readiness</h1>
        <p>See who can be presented to a client now, which specialties are short, and whether recruiters should develop the existing pool or source additional talent.</p>
      </div>
      <div className="row wrap">
        <Link prefetch={false} className="btn" href="/workspace/recruiter/talent">All VA accounts</Link>
        <Link prefetch={false} className="btn btn-primary" href="/workspace/recruiter/queue">Vetting queue</Link>
      </div>
    </div>

    <div className="stats" style={{ marginBottom: 18 }}>
      <div className="stat-card"><span className="small muted">Client-ready now</span><strong>{readyRows.length}</strong><small className="muted">Approved, active pool, fresh availability, setup verified</small></div>
      <div className="stat-card"><span className="small muted">Source-now categories</span><strong>{sourceNext.length}</strong><small className="muted">Current pool + near-ready supply cannot cover demand/target</small></div>
      <div className="stat-card"><span className="small muted">Near-ready talent</span><strong>{nearReadyRows.length}</strong><small className="muted">Closest candidates to client-ready</small></div>
      <div className="stat-card"><span className="small muted">Open roles</span><strong>{openJobs.length}</strong><small className="muted">Pending + published hiring demand</small></div>
    </div>

    <section className="card dashboard-section-card" style={{ marginBottom: 18 }}>
      <div className="dashboard-section-head">
        <div><h2>Source next</h2><p>Prioritized from live role demand, a {DEFAULT_BENCH_TARGET}-person readiness target, and the near-ready pool. Near-ready VAs are counted before recommending additional sourcing.</p></div>
        <Sparkles size={20} />
      </div>
      {sourceNext.length ? <div className="compact-list">{sourceNext.slice(0, 6).map((row) => <Link prefetch={false} href={`/workspace/recruiter/talent?q=${encodeURIComponent(row.category)}`} key={row.category}>
        <span><strong>{vaCategoryLabel(row.category)}</strong><small>{row.demand} open role{row.demand === 1 ? "" : "s"} · {row.ready} client-ready · {row.nearReady} near-ready</small></span>
        <span className="row wrap"><span className="badge badge-danger">Source {row.sourcingGap}</span><ArrowRight size={15}/></span>
      </Link>)}</div> : <div className="success-banner"><CheckCircle2 size={17}/> Current ready + near-ready supply covers every category&apos;s live demand and baseline target.</div>}
    </section>

    <section className="card dashboard-section-card" style={{ marginBottom: 18 }}>
      <div className="dashboard-section-head"><div><h2>Coverage by specialty</h2><p>“Need” is the greater of current open-role demand or the baseline talent-pool target. This avoids sourcing just because a category has no live role today.</p></div><ShieldCheck size={20}/></div>
      <div className="table-wrap responsive-table"><table>
        <thead><tr><th>Specialty</th><th>Open roles</th><th>Client-ready</th><th>Near-ready</th><th>Unavailable</th><th>Need</th><th>Action</th></tr></thead>
        <tbody>{coverageRows.map((row) => <tr key={row.category}>
          <td data-label="Specialty"><strong>{vaCategoryLabel(row.category)}</strong><div className="small muted">{row.category}</div></td>
          <td data-label="Open roles">{row.demand}</td>
          <td data-label="Client-ready">{row.ready}</td>
          <td data-label="Near-ready">{row.nearReady}</td>
          <td data-label="Unavailable">{row.unavailable}</td>
          <td data-label="Need">{row.coverageNeed}</td>
          <td data-label="Action"><span className={`badge ${COVERAGE_TONE[row.status]}`}>{talentCoverageLabel(row.status)}{row.status === "source" ? ` · ${row.sourcingGap}` : row.status === "develop" ? ` · ${row.readyGap}` : row.status === "surplus" ? ` · +${row.surplus}` : ""}</span></td>
        </tr>)}</tbody>
      </table></div>
    </section>

    <div className="grid-2" style={{ alignItems: "start", marginBottom: 18 }}>
      <section className="card dashboard-section-card">
        <div className="dashboard-section-head"><div><h2>Client-ready now</h2><p>Only approved pool members with availability confirmed in the last {TALENT_AVAILABILITY_FRESH_DAYS} days and recruiter-verified work setup appear here.</p></div><UsersRound size={20}/></div>
        {readyRows.length ? <div className="compact-list">{readyRows.slice(0, 12).map((candidate) => <Link prefetch={false} href={`/workspace/recruiter/candidates/${candidate.vaId}`} key={candidate.vaId}>
          <span><strong>{candidate.profile?.full_name || "VA"}</strong><small>{vaCategoryLabel(candidate.category)} · {candidate.va?.weekly_hours ? `${candidate.va.weekly_hours} hrs/week` : "Hours not set"}</small></span>
          <span className={`badge ${HEALTH_TONE[candidate.health?.health ?? ""] || "badge-success"}`}>{candidate.health?.health || "Ready"}</span>
        </Link>)}</div> : <div className="empty"><AlertTriangle size={20}/><p>No VA currently meets every client-ready requirement.</p></div>}
      </section>

      <section className="card dashboard-section-card">
        <div className="dashboard-section-head"><div><h2>Development queue</h2><p>Closest candidates to client-ready, with the exact operational step that is still missing.</p></div><Sparkles size={20}/></div>
        {developmentQueue.length ? <div className="compact-list">{developmentQueue.map((candidate) => <Link prefetch={false} href={`/workspace/recruiter/candidates/${candidate.vaId}`} key={candidate.vaId}>
          <span><strong>{candidate.profile?.full_name || "VA"}</strong><small>{vaCategoryLabel(candidate.category)} · {candidate.vetting?.stage || "pipeline"}</small></span>
          <span className="small muted">{candidate.actions.slice(0, 2).join(" · ") || "Review profile"}</span>
        </Link>)}</div> : <div className="empty"><CheckCircle2 size={20}/><p>No near-ready candidates need development work.</p></div>}
      </section>
    </div>

    <details className="card dashboard-section-card" style={{ marginBottom: 18 }}>
      <summary style={{ cursor: "pointer" }}><strong>Manage current talent pool</strong> <span className="small muted">· {members.length} membership{members.length === 1 ? "" : "s"}</span></summary>
      <p className="small muted">Activation and category assignment remain manual recruiter decisions. Talent OS only calculates operational readiness and coverage from recorded evidence.</p>
      {members.length ? <div className="table-wrap responsive-table"><table><thead><tr><th>VA</th><th>Health</th><th>Category</th><th>Priority</th><th>Hours</th><th>Availability</th><th>Status</th><th></th></tr></thead><tbody>{members.map((member) => {
        const profile = profileMap.get(member.va_id); const va = vaMap.get(member.va_id); const health = healthMap.get(member.va_id);
        return <tr key={member.id}><td data-label="VA"><strong>{profile?.full_name || "VA"}</strong><div className="small muted">{va?.headline || va?.primary_category}</div></td><td data-label="Health"><span className={`badge ${HEALTH_TONE[health?.health ?? ""] || ""}`}>{health?.health || "Unknown"}</span></td><td data-label="Category">{member.category}</td><td data-label="Priority">{member.priority}/5</td><td data-label="Hours">{va?.weekly_hours ? `${va.weekly_hours}/week` : "Not set"}</td><td data-label="Availability">{va?.availability_status || "unknown"}</td><td data-label="Status"><span className={`badge ${member.status === "active" ? "badge-success" : ""}`}>{member.status}</span></td><td data-label="Action"><div className="row wrap"><Link prefetch={false} className="btn btn-sm" href={`/workspace/recruiter/candidates/${member.va_id}`}>Profile</Link><form action={updateBenchMemberAction}><input type="hidden" name="membership_id" value={member.id}/><input type="hidden" name="status" value={member.status === "active" ? "paused" : "active"}/><button className="btn btn-sm" type="submit">{member.status === "active" ? "Pause" : "Activate"}</button></form></div></td></tr>;
      })}</tbody></table></div> : <div className="empty">No VAs are in the talent pool yet.</div>}
    </details>

    <details className="card dashboard-section-card">
      <summary style={{ cursor: "pointer" }}><strong>Add approved VAs to the talent pool</strong> <span className="small muted">· {approvedWaiting.length} waiting</span></summary>
      <p className="small muted">Approved candidates are not counted as client-ready supply until a recruiter intentionally activates them in a talent-pool category.</p>
      {approvedWaiting.length ? <>
        <form id="bench-bulk-add" action={bulkAddBenchMembersAction} className="row wrap" style={{ alignItems: "center", gap: 8, marginBottom: 12 }}>
          <BenchBulkSelectAll formId="bench-bulk-add" checkboxName="va_id" />
          <button className="btn btn-sm" type="reset">Clear</button>
          <span className="small muted">Add selected to</span>
          <select name="category" defaultValue="" required aria-label="Bulk talent-pool category"><option value="" disabled>Choose category</option>{VA_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select>
          <select name="priority" defaultValue="3" aria-label="Bulk talent-pool priority"><option value="5">Priority 5</option><option value="4">Priority 4</option><option value="3">Priority 3</option><option value="2">Priority 2</option><option value="1">Priority 1</option></select>
          <button className="btn btn-sm btn-primary" type="submit">Add selected</button>
        </form>
        <div className="table-wrap responsive-table"><table><thead><tr><th aria-label="Select"></th><th>VA</th><th>Primary category</th><th>Availability</th><th>Work setup</th><th>Add to pool</th></tr></thead><tbody>{approvedWaiting.map((row) => {
          const profile = profileMap.get(row.va_id); const va = vaMap.get(row.va_id);
          return <tr key={row.va_id}><td data-label="Select"><input type="checkbox" form="bench-bulk-add" name="va_id" value={row.va_id} aria-label={`Select ${profile?.full_name || "VA"}`} /></td><td data-label="VA"><strong>{profile?.full_name || "VA"}</strong><div className="small muted">{va?.headline || "Virtual Assistant"}</div></td><td data-label="Primary category">{vaCategoryLabel(va?.primary_category)}</td><td data-label="Availability">{va?.availability_status || "Not set"}{va?.availability_confirmed_at ? <div className="small muted">Confirmed {dateShort(va.availability_confirmed_at)}</div> : null}</td><td data-label="Work setup">{va?.work_setup_verified_at ? <span className="badge badge-success">Verified</span> : <span className="badge badge-warning">Needs verification</span>}</td><td data-label="Add to pool"><form action={addBenchMemberAction} className="row wrap"><input type="hidden" name="va_id" value={row.va_id}/><select name="category" defaultValue={va?.primary_category || VA_CATEGORIES[0]}>{VA_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select><select name="priority" defaultValue="3"><option value="5">Priority 5</option><option value="4">Priority 4</option><option value="3">Priority 3</option><option value="2">Priority 2</option><option value="1">Priority 1</option></select><button className="btn btn-sm btn-primary" type="submit">Add</button></form></td></tr>;
        })}</tbody></table></div>
      </> : <div className="empty">No approved VAs are waiting for a talent-pool category.</div>}
    </details>
  </>;
}
