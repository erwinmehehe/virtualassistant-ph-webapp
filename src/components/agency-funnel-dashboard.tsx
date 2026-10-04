import Link from "next/link";
import { AlertTriangle, BriefcaseBusiness, ShieldCheck, TrendingUp } from "lucide-react";
import { getAgencyFunnelMetrics, getAgencyRevenueAttributionMetrics, type AgencyAttributionRow } from "@/lib/agency-funnel-metrics";
import { leadLossReasonLabel } from "@/lib/loss-reasons";

function count(value: unknown) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
}

function percent(value: number, denominator: number) {
  if (!denominator) return null;
  return Math.round((value / denominator) * 100);
}

function usd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

type FunnelStage = { label:string; value:number; note:string };

function FunnelFlow({ stages, dropTarget }: { stages:FunnelStage[]; dropTarget:number|null }) {
  return <div className="agency-funnel-flow">
    {stages.map((stage,index)=>{
      const previous=index?stages[index-1]:null;
      const conversion=previous?percent(stage.value,previous.value):null;
      const lost=previous?Math.max(0,previous.value-stage.value):0;
      return <div className={`agency-funnel-step ${dropTarget===index?"is-dropoff":""}`} key={stage.label}>
        <div className="agency-funnel-step-top"><span>{stage.label}</span><strong>{stage.value}</strong></div>
        <p>{stage.note}</p>
        {previous
          ? <div className="agency-funnel-step-foot"><span>{conversion==null?"No prior-stage data":`${conversion}% from ${previous.label.toLowerCase()}`}</span><small>{lost?`${lost} did not move forward`:"No recorded drop-off"}</small></div>
          : <div className="agency-funnel-step-foot"><span>Starting cohort</span><small>Selected period</small></div>}
      </div>;
    })}
  </div>;
}

function OpsMetric({label,value,note}:{label:string;value:string|number;note:string}) {
  return <div className="agency-health-metric">
    <span>{label}</span>
    <strong>{value}</strong>
    <small>{note}</small>
  </div>;
}


function attributionLabel(row:AgencyAttributionRow) {
  return [row.source,row.medium,row.campaign].filter(Boolean).join(" · ");
}

function AttributionTable({ rows, model }: { rows:AgencyAttributionRow[]; model:"First touch"|"Last touch" }) {
  if (!rows.length) return <div className="agency-funnel-empty">Attribution will appear as new hiring briefs arrive with campaign or referrer data.</div>;
  return <div className="table-wrap responsive-table">
    <table>
      <thead><tr><th>{model}</th><th>Leads</th><th>Quality</th><th>Discovery</th><th>Proposal accept</th><th>Wins</th><th>Open pipeline</th><th>Won value</th><th>Collected</th><th>Rev / lead</th><th>Top loss</th></tr></thead>
      <tbody>{rows.slice(0,12).map((row)=>{
        const leadCount=count(row.leads);
        const qualified=count(row.qualified);
        const discovery=count(row.discovery_booked);
        const proposalLeads=count(row.proposal_leads);
        const customers=count(row.customers);
        return <tr key={`${row.source}:${row.medium || ""}:${row.campaign || ""}`}>
          <td data-label={model}><strong>{attributionLabel(row)}</strong></td>
          <td data-label="Leads">{leadCount}<small className="muted" style={{display:"block"}}>{count(row.junk_leads)} junk · {count(row.junk_rate)}%</small></td>
          <td data-label="Quality">{qualified} <small className="muted">{percent(qualified,leadCount) ?? 0}% qualified</small></td>
          <td data-label="Discovery">{discovery}</td>
          <td data-label="Proposal accept">{proposalLeads ? `${count(row.proposal_acceptance_rate)}%` : "—"}</td>
          <td data-label="Wins">{customers} <small className="muted">{percent(customers,leadCount) ?? 0}%</small></td>
          <td data-label="Open pipeline">{usd(count(row.open_pipeline_value_usd))}</td>
          <td data-label="Won value">{usd(count(row.won_value_usd))}</td>
          <td data-label="Collected">{usd(count(row.collected_revenue_usd))}</td>
          <td data-label="Rev / lead">{usd(count(row.revenue_per_lead_usd))}</td>
          <td data-label="Top loss">{row.top_loss_reason_code ? leadLossReasonLabel(row.top_loss_reason_code) : "—"}</td>
        </tr>;
      })}</tbody>
    </table>
  </div>;
}

export async function AgencyFunnelDashboard({ recruiterId, days, basePath, scopeLabel, leadsPath, rolesPath }: {
  recruiterId:string|null;
  days:number;
  basePath:string;
  scopeLabel:string;
  leadsPath:string;
  rolesPath:string;
}) {
  const [
    {data,error},
    {data:firstTouch,error:firstTouchError},
    {data:lastTouch,error:lastTouchError},
  ]=await Promise.all([
    getAgencyFunnelMetrics(recruiterId,days),
    getAgencyRevenueAttributionMetrics(recruiterId,days,"first_touch"),
    getAgencyRevenueAttributionMetrics(recruiterId,days,"last_touch"),
  ]);
  if(error)throw error;
  if(firstTouchError)throw firstTouchError;
  if(lastTouchError)throw lastTouchError;

  const journey={
    enquiries:count(data.journey?.enquiries),
    discovery_booked:count(data.journey?.discovery_booked),
    discovery_attended:count(data.journey?.discovery_attended),
    qualified:count(data.journey?.qualified),
    proposal_sent:count(data.journey?.proposal_sent),
    proposal_accepted:count(data.journey?.proposal_accepted),
    shortlisted:count(data.journey?.shortlisted),
    interviewed:count(data.journey?.interviewed),
    offered:count(data.journey?.offered),
    hired:count(data.journey?.hired),
  };
  const proposal={
    sent:count(data.proposal?.sent),
    viewed:count(data.proposal?.viewed),
    responded:count(data.proposal?.responded),
    changes_requested:count(data.proposal?.changes_requested),
    accepted:count(data.proposal?.accepted),
    declined:count(data.proposal?.declined),
    median_hours_to_view:count(data.proposal?.median_hours_to_view),
    median_hours_to_decision:count(data.proposal?.median_hours_to_decision),
  };
  const recruiting={
    job_orders:count(data.recruiting?.job_orders),
    shortlisted:count(data.recruiting?.shortlisted),
    interviewed:count(data.recruiting?.interviewed),
    offered:count(data.recruiting?.offered),
    placed:count(data.recruiting?.placed),
    avg_days_to_shortlist:count(data.recruiting?.avg_days_to_shortlist),
    avg_days_to_start:count(data.recruiting?.avg_days_to_start),
  };
  const retention={
    active_placements:count(data.retention?.active_placements),
    eligible_30d:count(data.retention?.eligible_30d),
    retained_30d:count(data.retention?.retained_30d),
    eligible_90d:count(data.retention?.eligible_90d),
    retained_90d:count(data.retention?.retained_90d),
  };

  const stages:FunnelStage[]=[
    {label:"Enquiries",value:journey.enquiries,note:"Client hiring enquiries received"},
    {label:"Discovery booked",value:journey.discovery_booked,note:"Discovery call scheduled"},
    {label:"Discovery attended",value:journey.discovery_attended,note:"Call attended or later-stage evidence exists"},
    {label:"Qualified",value:journey.qualified,note:"Confirmed hiring opportunity"},
    {label:"Proposal sent",value:journey.proposal_sent,note:"Proposal sent, or later-stage evidence for legacy roles"},
    {label:"Proposal accepted",value:journey.proposal_accepted,note:"Proposal accepted, or later-stage evidence for legacy roles"},
    {label:"Shortlist",value:journey.shortlisted,note:"At least one candidate released to the client"},
    {label:"Interview",value:journey.interviewed,note:"Candidate interview reached"},
    {label:"Offer",value:journey.offered,note:"Placement offer reached"},
    {label:"Hire",value:journey.hired,note:"Placement / workroom created"},
  ];
  const transitions=stages.slice(1).map((stage,index)=>{
    const previous=stages[index];
    const conversion=percent(stage.value,previous.value);
    return {
      from:previous.label,
      to:stage.label,
      targetIndex:index+1,
      conversion,
      lossRate:conversion==null?null:Math.max(0,100-conversion),
      lost:Math.max(0,previous.value-stage.value),
    };
  });
  const biggestDrop=transitions
    .filter((row)=>row.lossRate!=null)
    .sort((a,b)=>Number(b.lossRate)-Number(a.lossRate)||b.lost-a.lost)[0]||null;
  const discoveryToHire=percent(journey.hired,journey.discovery_attended);
  const enquiryToHire=percent(journey.hired,journey.enquiries);
  const retained30=percent(retention.retained_30d,retention.eligible_30d);
  const retained90=percent(retention.retained_90d,retention.eligible_90d);
  const proposalViewRate=percent(proposal.viewed,proposal.sent);
  const proposalResponseRate=percent(proposal.responded,proposal.sent);
  const proposalAcceptanceRate=percent(proposal.accepted,proposal.sent);
  const proposalDecisions=proposal.accepted+proposal.declined;
  const hourMetric=(value:number,hasData:boolean)=>hasData?`${value}h`:"—";
  const collectedRevenue=firstTouch.reduce((sum,row)=>sum+count(row.collected_revenue_usd),0);
  const attributedWonValue=firstTouch.reduce((sum,row)=>sum+count(row.won_value_usd),0);
  const attributedLeads=firstTouch.reduce((sum,row)=>sum+count(row.leads),0);
  const paidPayments=firstTouch.reduce((sum,row)=>sum+count(row.paid_payments),0);
  const realSources=firstTouch.filter(row=>count(row.leads)>0);
  const bestConversion=[...realSources].filter(row=>count(row.customers)>0).sort((a,b)=>{
    const aRate=count(a.leads)?count(a.customers)/count(a.leads):0;
    const bRate=count(b.leads)?count(b.customers)/count(b.leads):0;
    return bRate-aRate||count(b.customers)-count(a.customers);
  })[0]||null;
  const bestRevenue=[...realSources].filter(row=>count(row.collected_revenue_usd)>0).sort((a,b)=>count(b.collected_revenue_usd)-count(a.collected_revenue_usd))[0]||null;
  const bestProposal=[...realSources].filter(row=>count(row.proposal_leads)>0).sort((a,b)=>count(b.proposal_acceptance_rate)-count(a.proposal_acceptance_rate)||count(b.proposal_accepted)-count(a.proposal_accepted))[0]||null;
  const bestCustomerValue=[...realSources].filter(row=>count(row.customers)>0).sort((a,b)=>count(b.avg_customer_value_usd)-count(a.avg_customer_value_usd))[0]||null;
  const noisiestSource=[...firstTouch].filter(row=>count(row.junk_leads)>0).sort((a,b)=>count(b.junk_rate)-count(a.junk_rate)||count(b.junk_leads)-count(a.junk_leads))[0]||null;
  const biggestLossSource=[...realSources].filter(row=>count(row.lost_leads)>0).sort((a,b)=>count(b.lost_leads)-count(a.lost_leads))[0]||null;

  return <div className="agency-funnel-page">
    <div className="page-head agency-funnel-head">
      <div>
        <div className="kicker">Agency funnel</div>
        <h1>Hiring funnel</h1>
        <p>{scopeLabel}. Follow one client lead cohort from enquiry through discovery, shortlist, interview, offer, and hire. Delivery and retention operations remain separate below.</p>
      </div>
      <div className="role-filter-tabs agency-range-tabs" aria-label="Funnel date range">
        {[30,90,180].map((range)=><Link prefetch={false} key={range} className={days===range?"active":""} href={`${basePath}${basePath.includes("?")?"&":"?"}days=${range}`}>{range} days</Link>)}
      </div>
    </div>

    <section className="agency-funnel-section agency-sales-funnel-section">
      <div className="agency-funnel-section-head">
        <div><span className="agency-section-icon"><TrendingUp size={18}/></span><div><h2>Enquiry → hire</h2><p>Every percentage compares the same lead cohort with the stage immediately before it.</p></div></div>
        <Link className="text-link" href={leadsPath}>Review leads →</Link>
      </div>
      <FunnelFlow stages={stages} dropTarget={biggestDrop?.targetIndex??null}/>
      <div className="agency-sales-summary">
        <div><span>Discovery → hire</span><strong>{discoveryToHire==null?"—":`${discoveryToHire}%`}</strong><small>{journey.hired} hires from {journey.discovery_attended} attended discoveries</small></div>
        <div><span>Enquiry → hire</span><strong>{enquiryToHire==null?"—":`${enquiryToHire}%`}</strong><small>{journey.hired} hires from {journey.enquiries} enquiries</small></div>
        <div className={biggestDrop?"is-warning":""}>
          <span>Biggest drop-off</span>
          <strong>{biggestDrop?`${biggestDrop.from} → ${biggestDrop.to}`:"Not enough data"}</strong>
          <small>{biggestDrop&&biggestDrop.lossRate!=null?`${biggestDrop.lossRate}% drop-off · ${biggestDrop.lost} records`:"A previous stage needs volume before a drop-off can be calculated."}</small>
        </div>
      </div>
    </section>

    <section className="agency-funnel-section">
      <div className="agency-funnel-section-head">
        <div><span className="agency-section-icon"><TrendingUp size={18}/></span><div><h2>Proposal conversion</h2><p>Actual proposal events only. This separates proposal engagement from legacy later-stage evidence used in the end-to-end funnel.</p></div></div>
        <Link className="text-link" href={leadsPath}>Review client pipeline →</Link>
      </div>
      <div className="agency-health-grid agency-operations-grid">
        <OpsMetric label="View rate" value={proposalViewRate==null?"—":`${proposalViewRate}%`} note={`${proposal.viewed} viewed of ${proposal.sent} sent`}/>
        <OpsMetric label="Response rate" value={proposalResponseRate==null?"—":`${proposalResponseRate}%`} note={`${proposal.responded} client responses · ${proposal.changes_requested} change request${proposal.changes_requested===1?"":"s"}`}/>
        <OpsMetric label="Acceptance rate" value={proposalAcceptanceRate==null?"—":`${proposalAcceptanceRate}%`} note={`${proposal.accepted} accepted · ${proposal.declined} declined`}/>
        <OpsMetric label="Time to view" value={hourMetric(proposal.median_hours_to_view,proposal.viewed>0)} note="Median proposal sent → first client view"/>
        <OpsMetric label="Time to decision" value={hourMetric(proposal.median_hours_to_decision,proposalDecisions>0)} note="Median proposal sent → accept or decline"/>
        <OpsMetric label="Open decision gap" value={Math.max(0,proposal.sent-proposal.accepted-proposal.declined)} note="Sent proposals without a final accept / decline decision"/>
      </div>
    </section>

    <section className="agency-funnel-section">
      <div className="agency-funnel-section-head">
        <div><span className="agency-section-icon"><BriefcaseBusiness size={18}/></span><div><h2>Delivery operations</h2><p>Operational workload after a role enters recruiting. These are not sales conversion stages.</p></div></div>
        <Link className="text-link" href={rolesPath}>Review roles →</Link>
      </div>
      <div className="agency-health-grid agency-operations-grid">
        <OpsMetric label="Job orders" value={recruiting.job_orders} note="Published roles in the selected period"/>
        <OpsMetric label="Placed" value={recruiting.placed} note={`${recruiting.shortlisted} shortlisted · ${recruiting.interviewed} interviewed · ${recruiting.offered} offered`}/>
        <OpsMetric label="Time to shortlist" value={`${recruiting.avg_days_to_shortlist}d`} note="Average published role → first client shortlist"/>
        <OpsMetric label="Time to start" value={`${recruiting.avg_days_to_start}d`} note="Average published role → placement start"/>
      </div>
    </section>

    <section className="agency-funnel-section">
      <div className="agency-funnel-section-head">
        <div><span className="agency-section-icon"><ShieldCheck size={18}/></span><div><h2>Retention operations</h2><p>Placement health after the sale and recruiting handoff. Retention uses milestone-eligible placement cohorts.</p></div></div>
        <Link className="text-link" href="/workspace/client-success">Open Client Success →</Link>
      </div>
      <div className="agency-retention-grid">
        <div><span>Active placements</span><strong>{retention.active_placements}</strong><small>Current non-ended managed placements</small></div>
        <div><span>30-day retention</span><strong>{retained30==null?"—":`${retained30}%`}</strong><small>{retention.retained_30d} retained of {retention.eligible_30d} eligible</small></div>
        <div><span>90-day retention</span><strong>{retained90==null?"—":`${retained90}%`}</strong><small>{retention.retained_90d} retained of {retention.eligible_90d} eligible</small></div>
      </div>
    </section>

    <section className="agency-funnel-section">
      <div className="agency-funnel-section-head">
        <div><span className="agency-section-icon"><TrendingUp size={18}/></span><div><h2>Marketing → revenue</h2><p>Follow acquisition from lead source through qualification, discovery, proposals, customers, and actual collected invoice revenue. First touch answers what acquired the lead; last touch answers what brought them back before conversion.</p></div></div>
      </div>
      <div className="agency-health-grid agency-operations-grid">
        <OpsMetric label="Attributed leads" value={attributedLeads} note="Client hiring enquiries in the selected cohort"/>
        <OpsMetric label="Won value" value={usd(attributedWonValue)} note="Estimated value on leads marked won"/>
        <OpsMetric label="Collected revenue" value={usd(collectedRevenue)} note={`${paidPayments} paid invoice${paidPayments===1?"":"s"} linked back to originating leads`}/>
        <OpsMetric label="Revenue / lead" value={attributedLeads?usd(collectedRevenue/attributedLeads):"—"} note="Collected revenue divided by attributed leads"/>
      </div>
      <div className="dashboard-section-head"><div><h3>Source-quality signals</h3><p>Prioritize channels by customers and revenue, not traffic volume alone.</p></div></div>
      <div className="agency-health-grid agency-operations-grid">
        <OpsMetric label="Highest lead → win rate" value={bestConversion&&count(bestConversion.leads)?`${percent(count(bestConversion.customers),count(bestConversion.leads))}%`:"—"} note={bestConversion?attributionLabel(bestConversion):"No won source data yet"}/>
        <OpsMetric label="Highest collected revenue" value={bestRevenue?usd(count(bestRevenue.collected_revenue_usd)):"—"} note={bestRevenue?attributionLabel(bestRevenue):"No collected revenue attributed yet"}/>
        <OpsMetric label="Best proposal acceptance" value={bestProposal?`${count(bestProposal.proposal_acceptance_rate)}%`:"—"} note={bestProposal?attributionLabel(bestProposal):"No proposal source data yet"}/>
        <OpsMetric label="Highest avg customer value" value={bestCustomerValue?usd(count(bestCustomerValue.avg_customer_value_usd)):"—"} note={bestCustomerValue?attributionLabel(bestCustomerValue):"No won customer value yet"}/>
        <OpsMetric label="Highest junk rate" value={noisiestSource?`${count(noisiestSource.junk_rate)}%`:"—"} note={noisiestSource?`${attributionLabel(noisiestSource)} · ${count(noisiestSource.junk_leads)} spam/duplicate`:"No attributed junk in this period"}/>
        <OpsMetric label="Most losses" value={biggestLossSource?count(biggestLossSource.lost_leads):"—"} note={biggestLossSource?`${attributionLabel(biggestLossSource)} · ${leadLossReasonLabel(biggestLossSource.top_loss_reason_code)}`:"No attributed losses in this period"}/>
      </div>
      <div className="dashboard-section-head"><div><h3>First-touch acquisition</h3><p>Use this view to decide which channels deserve more acquisition budget.</p></div></div>
      <AttributionTable rows={firstTouch} model="First touch"/>
      <div className="dashboard-section-head" style={{marginTop:24}}><div><h3>Last-touch conversion influence</h3><p>Use this view to see which campaign or source brought prospects back before they submitted the hiring request.</p></div></div>
      <AttributionTable rows={lastTouch} model="Last touch"/>
    </section>

    <section className="agency-funnel-explainer">
      <AlertTriangle size={18}/>
      <div><strong>Read the funnel as stage evidence, not attribution.</strong><span>The end-to-end funnel follows client leads and counts the furthest verified hiring stage they reached. Delivery still counts published role operations separately, and retention counts milestone-eligible placements.</span></div>
    </section>
  </div>;
}
