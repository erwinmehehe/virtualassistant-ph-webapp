import Link from "next/link";
import { AlertCircle, CheckCircle2, Clock3, Tags, UserRoundCheck } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { VA_CATEGORIES, vaCategoryLabel } from "@/lib/constants";
import { dateShort } from "@/lib/format";
import { vettingStatusLabel } from "@/lib/vetting";
import type { RecruiterVaDirectoryRow } from "@/lib/workspace-rows";
import { autoCategorizeUncategorizedVasAction } from "@/app/actions/va-categories";

export default async function RecruiterVaCategoriesPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}) {
  const params = await searchParams;
  await requireRole("recruiter");
  const admin = createAdminClient();
  const { data, error } = await admin.from("recruiter_va_directory")
    .select("user_id,full_name,primary_category,completion_score,email_verified,last_activity_at,account_created_at,stage,account_status")
    .eq("account_status", "active")
    .order("account_created_at", { ascending: false })
    .limit(2000);
  if (error) throw error;

  const rows = (data || []) as RecruiterVaDirectoryRow[];
  const sevenDaysAgo = Date.now() - 7 * 86400000;
  const newAccounts = rows.filter((row) => row.account_created_at && new Date(row.account_created_at).getTime() >= sevenDaysAgo);
  const newStarted = newAccounts.filter((row) => Number(row.completion_score || 0) > 0);
  const zeroProfiles = rows.filter((row) => Number(row.completion_score || 0) === 0);
  const recentZeroProfiles = newAccounts.filter((row) => Number(row.completion_score || 0) === 0);
  const verifiedRecentZero = recentZeroProfiles.filter((row) => Boolean(row.email_verified));
  const uncategorized = rows.filter((row) => !row.primary_category);
  const startedRate = newAccounts.length ? Math.round((newStarted.length / newAccounts.length) * 100) : 0;

  const counts = new Map<string, number>();
  for (const row of rows) {
    if (!row.primary_category) continue;
    counts.set(row.primary_category, (counts.get(row.primary_category) || 0) + 1);
  }
  const stalled = [...recentZeroProfiles].sort((a,b) =>
    Number(b.email_verified) - Number(a.email_verified) ||
    new Date(b.account_created_at || 0).getTime() - new Date(a.account_created_at || 0).getTime()
  ).slice(0, 12);

  return <>
    {params.categorized != null ? <div className="success-banner" role="status">Auto-categorized {Number(params.categorized) || 0} VA profile{Number(params.categorized) === 1 ? "" : "s"}.{Number(params.skipped) ? ` Skipped ${Number(params.skipped)} profiles that need manual review or had too little profile evidence.` : ""}</div> : null}
    <div className="page-head">
      <div><div className="kicker">Talent operations</div><h1>VA categories & onboarding health</h1><p>See whether new VA accounts are moving past signup, then open talent by specialty such as SMM, SEO, Executive VA, customer support, and more.</p></div>
      <div className="row wrap"><form action={autoCategorizeUncategorizedVasAction}><button className="btn" type="submit" disabled={!uncategorized.length}>Auto-categorize uncategorized</button></form><Link className="btn btn-primary" href="/workspace/recruiter/talent">All VA accounts</Link></div>
    </div>

    <section className="card dashboard-section-card">
      <div className="dashboard-section-head"><div><h2>Signup → profile health</h2><p>A 0% profile means the account exists but none of the profile-strength fields have been completed yet.</p></div><span className={`badge ${startedRate >= 60 ? "badge-success" : "badge-warning"}`}>{startedRate}% of new VAs started setup</span></div>
      <div className="stats">
        <div className="stat-card"><span className="small muted">New VA accounts · 7 days</span><strong>{newAccounts.length}</strong><small className="muted">Account creation is reaching Supabase</small></div>
        <Link className="stat-card" href="/workspace/recruiter/talent?readiness=zero"><span className="small muted">Recent 0% profiles · 7 days</span><strong>{recentZeroProfiles.length}</strong><small className="muted">Newest accounts that still need the quick setup</small></Link>
        <div className="stat-card"><span className="small muted">Verified recent 0%</span><strong>{verifiedRecentZero.length}</strong><small className="muted">Highest-priority onboarding rescue queue</small></div>
        <div className="stat-card"><span className="small muted">Uncategorized VAs</span><strong>{uncategorized.length}</strong><small className="muted">Auto-repair fills only clear matches before approval. Approved/bench VAs stay manual.</small></div>
      </div>
    </section>

    <section className="card dashboard-section-card">
      <div className="dashboard-section-head"><div><h2>Talent by specialty</h2><p>Categories use one canonical value in the database but recruiter-friendly labels in the dashboard.</p></div><Tags size={20}/></div>
      <div className="grid-3">
        {VA_CATEGORIES.map((category) => <Link className="card card-hover" href={`/workspace/recruiter/talent?q=${encodeURIComponent(category)}`} key={category}>
          <div className="row-between"><strong>{vaCategoryLabel(category)}</strong><span className="badge">{counts.get(category) || 0}</span></div>
          <p className="small muted" style={{ marginBottom: 0 }}>{category}</p>
        </Link>)}
      </div>
    </section>

    <section className="card dashboard-section-card">
      <div className="dashboard-section-head"><div><h2>Recent 0% accounts · 7 days</h2><p>Newest stalled signups appear here first, with verified accounts prioritized. These VAs need onboarding help, not another registration attempt.</p></div><Link className="btn btn-sm" href="/workspace/recruiter/talent?readiness=zero">View all {zeroProfiles.length} 0% profiles</Link></div>
      {stalled.length ? <div className="compact-list">{stalled.map((row) => {
        const lastActiveDays = row.last_activity_at ? Math.max(0, Math.floor((Date.now() - new Date(row.last_activity_at).getTime()) / 86400000)) : null;
        return <Link href={`/workspace/recruiter/candidates/${row.user_id}`} key={row.user_id}>
          <span><strong>{row.full_name || "VA account"}</strong><small>{dateShort(row.account_created_at)} · {row.email_verified ? "Email verified" : "Email not verified"} · {vettingStatusLabel(row.stage || "profile")}</small></span>
          <span className="row wrap">{row.email_verified ? <CheckCircle2 size={14}/> : <AlertCircle size={14}/>}<span className="small muted">{lastActiveDays == null ? "Never active" : <><Clock3 size={13}/> {lastActiveDays}d ago</>}</span></span>
        </Link>;
      })}</div> : <div className="empty"><UserRoundCheck size={22}/><p>No active 0% VA accounts.</p></div>}
    </section>
  </>;
}