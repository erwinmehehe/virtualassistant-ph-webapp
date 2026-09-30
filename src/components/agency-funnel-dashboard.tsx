import Link from "next/link";
import { AlertTriangle, BriefcaseBusiness, ShieldCheck, TrendingUp } from "lucide-react";
import { getAgencyFunnelMetrics } from "@/lib/agency-funnel-metrics";

function count(value: unknown) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
}

function percent(value: number, denominator: number) {
  if (!denominator) return null;
  return Math.round((value / denominator) * 100);
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

export async function AgencyFunnelDashboard({ recruiterId, days, basePath, scopeLabel, leadsPath, rolesPath }: {
  recruiterId:string|null;
  days:number;
  basePath:string;
  scopeLabel:string;
  leadsPath:string;
  rolesPath:string;
}) {
  const {data,error}=await getAgencyFunnelMetrics(recruiterId,days);
  if(error)throw error;

  const journey={
    enquiries:count(data.journey?.enquiries),
    discovery_booked:count(data.journey?.discovery_booked),
    discovery_attended:count(data.journey?.discovery_attended),
    qualified:count(data.journey?.qualified),
    shortlisted:count(data.journey?.shortlisted),
    interviewed:count(data.journey?.interviewed),
    offered:count(data.journey?.offered),
    hired:count(data.journey?.hired),
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

  return <div className="agency-funnel-page">
    <div className="page-head agency-funnel-head">
      <div>
        <div className="kicker">Agency funnel</div>
        <h1>Hiring funnel</h1>
        <p>{scopeLabel}. Follow one client lead cohort from enquiry through discovery, shortlist, interview, offer, and hire. Delivery and retention operations remain separate below.</p>
      </div>
      <div className="role-filter-tabs agency-range-tabs" aria-label="Funnel date range">
        {[30,90,180].map((range)=><Link prefetch={false} key={range} className={days===range?"active":""} href={basePath+"?days="+range}>{range} days</Link>)}
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

    <section className="agency-funnel-explainer">
      <AlertTriangle size={18}/>
      <div><strong>Read the funnel as stage evidence, not attribution.</strong><span>The end-to-end funnel follows client leads and counts the furthest verified hiring stage they reached. Delivery still counts published role operations separately, and retention counts milestone-eligible placements.</span></div>
    </section>
  </div>;
}
