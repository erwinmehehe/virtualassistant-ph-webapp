import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, ClipboardCheck, Eye, UsersRound } from "lucide-react";
import { DashHeader, Notice, Panel, Pill, StatCard, type Tone } from "@/components/dash-ui";
import { requireRole } from "@/lib/auth";
import { getRuntimeSetupStatus } from "@/lib/env-status";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminPage() {
  await requireRole("admin");
  const admin = createAdminClient();
  const status = getRuntimeSetupStatus();
  const [{ count: pending }, { count: finalists }, { count: bench }, { count: vas }, { count: clients }, { count: recruiters }, { count: publicVas }] = await Promise.all([
    admin.from("jobs").select("id", { count: "exact", head: true }).eq("status", "pending"),
    admin.from("va_vetting").select("va_id", { count: "exact", head: true }).eq("stage", "finalist"),
    admin.from("bench_memberships").select("id", { count: "exact", head: true }).eq("status", "active"),
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "va"),
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "client"),
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "recruiter"),
    admin.from("public_va_directory").select("user_id", { count: "exact", head: true })
  ]);
  const setupNeedsAttention = !status.leadIngest.configured || !status.appEmail.configured || !status.appUrl.configured;

  const accounts: { label: string; value: number; tone: Tone }[] = [
    { label: "VA accounts", value: vas || 0, tone: "emerald" },
    { label: "Client accounts", value: clients || 0, tone: "indigo" },
    { label: "Recruiter accounts", value: recruiters || 0, tone: "amber" }
  ];
  const accountTop = Math.max(...accounts.map((row) => row.value), 1);

  return (
    <div className="dash-page">
      <DashHeader
        kicker="Marketplace admin"
        title="Platform overview"
        subtitle="Run the agency by exception: recruiters handle first-pass screening, while you focus on finalists, client demand, talent-pool gaps, and service decisions."
        actions={<Link className="dash-btn dash-btn-dark" href="/workspace/admin/vetting"><ClipboardCheck size={15} aria-hidden="true" /> Review finalists</Link>}
      />

      {setupNeedsAttention ? <Notice tone="warn"><strong>Production setup needs attention.</strong> Check webhook protection, transactional email, and the production URL before relying on automated workflows. <Link className="dash-link" href="/workspace/admin/system">Review system setup <ArrowRight size={14} aria-hidden="true" /></Link></Notice> : null}

      <div className="dash-stats">
        <StatCard label="Pending jobs" value={pending || 0} icon={<BriefcaseBusiness size={20} />} tone="amber" href="/workspace/admin/jobs" sub="Client roles awaiting review" chip={pending ? { label: "Needs review", tone: "warn" } : { label: "All clear", tone: "good" }} />
        <StatCard label="Vetting finalists" value={finalists || 0} icon={<ClipboardCheck size={20} />} tone="indigo" href="/workspace/admin/vetting" sub="Screened and scorecarded" chip={finalists ? { label: "Awaiting your call", tone: "warn" } : { label: "All clear", tone: "good" }} />
        <StatCard label="Public VAs" value={publicVas || 0} icon={<Eye size={20} />} tone="emerald" href="/find-talent" sub="Live in the directory now" />
        <StatCard label="Active talent pool" value={bench || 0} icon={<UsersRound size={20} />} tone="sky" sub="Bench memberships" />
      </div>

      <div className="dash-grid">
        <div className="dash-col">
          <Panel title="Where to act" subtitle="Everything here has already been through a recruiter">
            <div className="dash-list">
              <Link className="dash-list-row" href="/workspace/admin/vetting">
                <span><strong>Review finalists</strong><small>Only candidates already screened and scorecarded by a recruiter arrive here.</small></span>
                <Pill tone={finalists ? "amber" : "emerald"}>{finalists || 0} waiting</Pill>
              </Link>
              <Link className="dash-list-row" href="/workspace/admin/jobs">
                <span><strong>Review client jobs</strong><small>Approve roles and confirm curated placement or managed service terms.</small></span>
                <Pill tone={pending ? "amber" : "emerald"}>{pending || 0} pending</Pill>
              </Link>
              <Link className="dash-list-row" href="/workspace/admin/settings">
                <span><strong>Focus and economics</strong><small>Control your 2 to 3 focus verticals, talent-pool targets, placement fee, and managed service markup.</small></span>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link className="dash-list-row" href="/workspace/admin/system">
                <span><strong>System setup</strong><small>Webhook protection, transactional email, and the production URL.</small></span>
                <Pill tone={setupNeedsAttention ? "rose" : "emerald"}>{setupNeedsAttention ? "needs attention" : "configured"}</Pill>
              </Link>
            </div>
          </Panel>
        </div>

        <div className="dash-col">
          <Panel title="Marketplace" subtitle="Accounts by role">
            <div className="dash-funnel">
              {accounts.map((row) => (
                <div className="dash-funnel-row" key={row.label}>
                  <span className="dash-funnel-label">{row.label}</span>
                  <div className="dash-funnel-track">
                    <div className={`dash-funnel-fill tone-${row.tone}`} style={{ width: `${Math.max((row.value / accountTop) * 100, 9)}%` }}>{row.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
