import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock3, DollarSign, TrendingUp, UsersRound } from "lucide-react";
import { getSalesAnalytics, type SalesRangeDays } from "@/lib/sales-analytics";

function usd(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value || 0);
}

function duration(minutes: number | null) {
  if (minutes == null) return "No data yet";
  if (minutes < 60) return `${Math.round(minutes)} min`;
  if (minutes < 1440) return `${(minutes / 60).toFixed(1)} hr`;
  return `${(minutes / 1440).toFixed(1)} days`;
}

function number(value: number | null) {
  return value == null ? "No data yet" : String(value);
}

export async function SalesAnalyticsDashboard({
  days,
  basePath,
  scope = "team",
  recruiterId,
  allowScopeToggle = false
}: {
  days: SalesRangeDays;
  basePath: string;
  scope?: "team" | "mine";
  recruiterId?: string | null;
  allowScopeToggle?: boolean;
}) {
  const data = await getSalesAnalytics({
    days,
    ownerId: scope === "mine" ? recruiterId : null
  });
  const errors = Object.entries(data.errors).filter(([, value]) => value);

  const queryHref = (nextDays: number, nextScope = scope) => `${basePath}?days=${nextDays}${allowScopeToggle ? `&scope=${nextScope}` : ""}`;

  const metrics = [
    ["Leads", data.totals.leads, `Last ${days} days`, UsersRound],
    ["Won", data.totals.won, `${data.totals.leadToWinRate}% lead-to-win`, CheckCircle2],
    ["Proposal acceptance", `${data.totals.proposalAcceptanceRate}%`, `${data.totals.won} won from ${data.totals.proposalsSent} proposal leads`, TrendingUp],
    ["First response", duration(data.totals.medianFirstResponseMinutes), `${data.totals.firstResponseWithinThirtyRate}% within 30 min`, Clock3],
    ["Open pipeline", usd(data.totals.openPipelineValue), "Estimated agency value", DollarSign],
    ["Won value", usd(data.totals.wonValue), data.totals.medianDaysToWin == null ? "Close time not measurable yet" : `${data.totals.medianDaysToWin} median days to win`, DollarSign]
  ] as const;

  return <>
    <div className="sales-analytics-toolbar">
      <div className="role-filter-tabs">
        {[30, 90, 365].map((range) => <Link className={days === range ? "active" : ""} href={queryHref(range)} key={range}>{range === 365 ? "12 months" : `${range} days`}</Link>)}
      </div>
      {allowScopeToggle ? <div className="role-filter-tabs">
        <Link className={scope === "team" ? "active" : ""} href={queryHref(days, "team")}>Team</Link>
        <Link className={scope === "mine" ? "active" : ""} href={queryHref(days, "mine")}>My leads</Link>
      </div> : null}
    </div>

    {errors.length ? <div className="alert" role="alert"><AlertTriangle size={17}/><div><strong>Some sales data could not be loaded.</strong><div className="small">{errors.map(([key]) => key).join(", ")}</div></div></div> : null}

    <div className="sales-kpi-grid">
      {metrics.map(([label, value, copy, Icon]) => <div className="card sales-kpi-card" key={label}><Icon size={18}/><span>{label}</span><strong>{value}</strong><small>{copy}</small></div>)}
    </div>

    <section className="card sales-funnel-card">
      <div className="dashboard-section-head"><div><h2>Lead-to-hire funnel</h2><p>Each stage is shown as a share of leads created in this reporting window.</p></div><span className="badge">{days} day window</span></div>
      <div className="sales-funnel-list">
        {data.funnel.map((stage) => <div className="sales-funnel-row" key={stage.key}>
          <div><strong>{stage.label}</strong><span>{stage.count}</span></div>
          <div className="sales-funnel-track"><span style={{ width: `${Math.max(stage.count ? 3 : 0, Math.min(100, stage.rate))}%` }}/></div>
          <small>{stage.rate}% of leads</small>
        </div>)}
      </div>
      {data.dataQuality.legacyQualifiedWithoutTimeline ? <div className="sales-data-note"><AlertTriangle size={16}/><span><strong>{data.dataQuality.legacyQualifiedWithoutTimeline} historical qualified lead{data.dataQuality.legacyQualifiedWithoutTimeline === 1 ? "" : "s"}</strong> do not have earlier contact/discovery timestamps. New leads will produce a clean sequential funnel automatically.</span></div> : null}
    </section>

    <div className="grid-2 sales-analysis-grid">
      <section className="card">
        <div className="dashboard-section-head"><div><h2>Lead sources</h2><p>Which pages and sources create opportunities and wins.</p></div></div>
        {data.sources.length ? <div className="table-wrap responsive-table"><table>
          <thead><tr><th>Source</th><th>Leads</th><th>Proposals</th><th>Wins</th><th>Win rate</th><th>Open value</th></tr></thead>
          <tbody>{data.sources.map((row) => <tr key={row.source}><td data-label="Source"><strong>{row.source}</strong></td><td data-label="Leads">{row.leads}</td><td data-label="Proposals">{row.proposals}</td><td data-label="Wins">{row.wins}</td><td data-label="Win rate">{row.winRate}%</td><td data-label="Open value">{usd(row.openValue)}</td></tr>)}</tbody>
        </table></div> : <div className="empty">No leads in this reporting window.</div>}
      </section>

      <section className="card">
        <div className="dashboard-section-head"><div><h2>Proposal performance</h2><p>See whether the bottleneck is delivery, viewing, or acceptance.</p></div></div>
        <div className="sales-stage-summary">
          <div><span>Sent</span><strong>{data.totals.proposalsSent}</strong></div>
          <div><span>Viewed</span><strong>{data.totals.proposalsViewed}</strong><small>{data.totals.proposalViewRate}% view rate</small></div>
          <div><span>Changes requested</span><strong>{data.totals.proposalChanges}</strong></div>
          <div><span>Accepted</span><strong>{data.totals.won}</strong><small>{data.totals.proposalAcceptanceRate}% acceptance</small></div>
        </div>
        <div className="sales-data-quality">
          <div className={data.dataQuality.missingSource ? "warn" : "ok"}><span>Missing source</span><strong>{data.dataQuality.missingSource}</strong></div>
          <div className={data.dataQuality.wonWithoutValue ? "warn" : "ok"}><span>Won without value</span><strong>{data.dataQuality.wonWithoutValue}</strong></div>
        </div>
      </section>
    </div>

    {scope === "team" ? <section className="card">
      <div className="dashboard-section-head"><div><h2>Recruiter performance</h2><p>Use this for coaching and workload balancing, not as a vanity leaderboard.</p></div></div>
      {data.owners.length ? <div className="table-wrap responsive-table"><table>
        <thead><tr><th>Owner</th><th>Leads</th><th>Contacted</th><th>Proposals</th><th>Wins</th><th>Win rate</th><th>Median response</th><th>Open value</th></tr></thead>
        <tbody>{data.owners.map((row) => <tr key={row.ownerId}><td data-label="Owner"><strong>{row.owner}</strong></td><td data-label="Leads">{row.leads}</td><td data-label="Contacted">{row.contacted}</td><td data-label="Proposals">{row.proposals}</td><td data-label="Wins">{row.wins}</td><td data-label="Win rate">{row.winRate}%</td><td data-label="Median response">{duration(row.medianResponseMinutes)}</td><td data-label="Open value">{usd(row.openValue)}</td></tr>)}</tbody>
      </table></div> : <div className="empty">No owned leads in this reporting window.</div>}
    </section> : null}

    <section className="card">
      <div className="dashboard-section-head"><div><h2>Why opportunities are lost</h2><p>Record a specific lost reason in the CRM so this becomes useful for pricing and sales decisions.</p></div></div>
      {data.lossReasons.length ? <div className="compact-list">{data.lossReasons.map((row) => <div className="compact-static" key={row.reason}><span><strong>{row.reason}</strong></span><span className="badge">{row.count}</span></div>)}</div> : <div className="empty">No lost opportunities with recorded reasons in this period.</div>}
    </section>
  </>;
}
