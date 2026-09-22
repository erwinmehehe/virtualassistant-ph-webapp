import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock3, DollarSign, TrendingUp, UsersRound } from "lucide-react";
import { getSalesAnalytics, type SalesRangeDays } from "@/lib/sales-analytics";
import { RevenueBarChart, RevenueTrendChart } from "@/components/revenue-charts";

function usd(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value || 0);
}

function duration(minutes: number | null) {
  if (minutes == null) return "No data yet";
  if (minutes < 60) return `${Math.round(minutes)} min`;
  if (minutes < 1440) return `${(minutes / 60).toFixed(1)} hr`;
  return `${(minutes / 1440).toFixed(1)} days`;
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
    ["Hiring enquiries", data.totals.leads, String(data.totals.discoveryBooked) + " discovery calls booked", UsersRound],
    ["Discovery booked", data.totals.discoveryBooked, String(data.totals.qualified) + " qualified opportunities", TrendingUp],
    ["Clients won", data.totals.won, String(data.totals.leadToWinRate) + "% enquiry-to-win", CheckCircle2],
    ["Open pipeline", usd(data.totals.openPipelineValue), "Estimated value still in play", DollarSign]
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

    <div className="sales-health-strip">
      <div><span>Median first response</span><strong>{duration(data.totals.medianFirstResponseMinutes)}</strong><small>{data.totals.firstResponseWithinThirtyRate}% within 30 min</small></div>
      <div><span>Proposal acceptance</span><strong>{data.totals.proposalAcceptanceRate}%</strong><small>{data.totals.won} wins from {data.totals.proposalsSent} sent proposals</small></div>
      <div><span>Won value</span><strong>{usd(data.totals.wonValue)}</strong><small>{data.totals.medianDaysToWin == null ? "Close time not measurable yet" : String(data.totals.medianDaysToWin) + " median days to win"}</small></div>
    </div>

    <div className="grid-2 sales-analysis-grid">
      <section className="card">
        <div className="dashboard-section-head"><div><h2>Lead and win trend</h2><p>New hiring enquiries and won opportunities across the selected reporting window.</p></div></div>
        <RevenueTrendChart
          data={data.timeline.map((row) => ({ label: row.label, primary: row.leads, secondary: row.wins }))}
          primaryLabel="Leads"
          secondaryLabel="Wins"
          ariaLabel={`Lead and win trend for the last ${days} days`}
        />
      </section>
      <section className="card">
        <div className="dashboard-section-head"><div><h2>Lead source volume</h2><p>Where hiring opportunities are entering the sales pipeline, with wins layered on top.</p></div></div>
        {data.sources.length
          ? <RevenueBarChart data={data.sources.slice(0, 8).map((row) => ({ label: row.source, value: row.leads, secondary: row.wins }))} ariaLabel="Lead sources by volume and wins"/>
          : <div className="empty">No lead-source data in this reporting window.</div>}
      </section>
    </div>

    <section className="card sales-funnel-card">
      <div className="dashboard-section-head"><div><h2>Website → client funnel</h2><p>This is the complete Homepage-to-client funnel. Read each row against the step immediately before it to see where potential clients are actually dropping out.</p></div><span className="badge">{days} day window</span></div>
      <div className="sales-funnel-list">
        {data.funnel.map((stage, index) => {
          const previous = index ? data.funnel[index - 1] : null;
          const stepRate = previous && previous.count ? Math.round((stage.count / previous.count) * 1000) / 10 : null;
          return <div className="sales-funnel-row" key={stage.key}>
            <div><strong>{stage.label}</strong><span>{stage.count}</span></div>
            <div className="sales-funnel-track"><span style={{ width: String(Math.max(stage.count ? 3 : 0, Math.min(100, previous && previous.count ? (stage.count / previous.count) * 100 : 100))) + "%" }}/></div>
            <small>{index === 0 ? "Starting traffic" : stepRate == null ? "No prior-step baseline" : String(stepRate) + "% from previous step"}</small>
          </div>;
        })}
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
