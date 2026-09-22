import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  FileText,
  HeartPulse,
  ListTodo,
  MessageSquare,
  RefreshCw,
  UsersRound,
} from "lucide-react";
import { DashHeader, Empty, Panel, Pill, SignalList, type Tone } from "@/components/dash-ui";
import { requireRole } from "@/lib/auth";
import { money } from "@/lib/format";
import { createAdminClient } from "@/lib/supabase/admin";
import { withServerTiming } from "@/lib/server-timing";
import styles from "./today.module.css";

type OwnerAction = {
  id:string;
  title:string;
  subtitle:string;
  href:string;
  label:string;
  tone:Tone;
};

type AdminTodaySummary = {
  pipeline?: {
    new_leads?:number;
    calls_today?:number;
    proposals?:number;
    open_roles?:number;
    shortlists?:number;
    placements?:number;
    overdue_collections?:number;
    overdue_total?:number;
    retention_risks?:number;
  };
  pulse?: {
    active_leads?:number;
    proposals_out?:number;
    hiring_rooms_waiting?:number;
    high_priority_tasks?:number;
    at_risk?:number;
    renewals_30d?:number;
    payout_ready?:number;
    payout_ready_total?:number;
    disputes?:number;
  };
  owner_attention?:number;
  overdue_days?:number;
  actions?:OwnerAction[];
};

function actionIcon(label:string){
  if(label==="Lead") return <MessageSquare size={17}/>;
  if(label==="Call") return <CalendarClock size={17}/>;
  if(label==="Proposal") return <FileText size={17}/>;
  if(label==="Hiring Room") return <UsersRound size={17}/>;
  if(label==="Client health") return <HeartPulse size={17}/>;
  if(label==="Finance") return <CircleDollarSign size={17}/>;
  if(label==="Renewal") return <RefreshCw size={17}/>;
  if(label==="Task") return <ListTodo size={17}/>;
  return <AlertTriangle size={17}/>;
}

export default async function AdminTodayPage(){
  await requireRole("admin");
  const admin=createAdminClient();
  const {data,error}=await withServerTiming("admin.today_summary", () => admin.rpc("admin_today_summary"));
  if(error) throw error;

  const summary=(data||{}) as AdminTodaySummary;
  const pipeline=summary.pipeline||{};
  const pulse=summary.pulse||{};
  const actions=Array.isArray(summary.actions)?summary.actions:[];
  const ownerAttention=Number(summary.owner_attention||0);
  const overdueDays=Number(summary.overdue_days||7);

  const ownerPipeline=[
    {label:"New leads",value:Number(pipeline.new_leads||0),hint:"Hiring enquiries",href:"/workspace/admin/leads?view=hiring",icon:<MessageSquare size={16}/>},
    {label:"Calls today",value:Number(pipeline.calls_today||0),hint:"Discovery",href:"/workspace/admin/leads?view=hiring",icon:<CalendarClock size={16}/>},
    {label:"Proposals",value:Number(pipeline.proposals||0),hint:"Open proposals",href:"/workspace/admin/leads?view=hiring",icon:<FileText size={16}/>},
    {label:"Open roles",value:Number(pipeline.open_roles||0),hint:"Recruiting",href:"/workspace/admin/jobs?view=all",icon:<BriefcaseBusiness size={16}/>},
    {label:"Shortlists",value:Number(pipeline.shortlists||0),hint:"Client review",href:"/workspace/admin/jobs?view=all",icon:<UsersRound size={16}/>},
    {label:"Placements",value:Number(pipeline.placements||0),hint:"Active delivery",href:"/workspace/client-success",icon:<CheckCircle2 size={16}/>},
    {label:"Collections",value:Number(pipeline.overdue_collections||0),hint:Number(pipeline.overdue_collections||0)?`${money(Number(pipeline.overdue_total||0))} overdue`:"No overdue invoices",href:"/workspace/admin/payments",icon:<CircleDollarSign size={16}/>},
    {label:"Retention risks",value:Number(pipeline.retention_risks||0),hint:"Needs intervention",href:"/workspace/client-success",icon:<HeartPulse size={16}/>}
  ];

  return <div className="dash-page owner-command-center">
    <DashHeader
      kicker="Agency owner · Today"
      title="Owner Command Center"
      subtitle={<>Read the business left to right, then work the owner exceptions below. <span className="dash-freshness">One database summary · Manila</span></>}
      actions={<>
        <Link className="dash-btn dash-btn-light" href="/workspace/admin/funnel">Agency Funnel</Link>
        <Link className="dash-btn dash-btn-dark" href="/workspace/admin/leads?view=hiring">Hiring leads <ArrowRight size={14}/></Link>
      </>}
    />

    <section className={styles.pipelineSection} aria-label="Agency operating pipeline">
      <div className={styles.pipelineHeading}>
        <div><div className="dash-kicker">Business flow</div><h2>Lead → revenue → retention</h2><p>Every number opens the operating queue behind it.</p></div>
        <span className={`badge ${ownerAttention?"badge-warning":"badge-success"}`}>{ownerAttention} owner exception{ownerAttention===1?"":"s"}</span>
      </div>
      <div className={styles.pipelineGrid}>
        {ownerPipeline.map((item,index)=><Link prefetch={false} className={styles.pipelineItem} href={item.href} key={item.label}>
          <span className={styles.pipelineIcon}>{item.icon}</span>
          <span className={styles.pipelineCopy}><strong>{item.label}</strong><small>{item.hint}</small></span>
          <b>{item.value}</b>
          {index<ownerPipeline.length-1?<ArrowRight className={styles.pipelineArrow} size={13}/>:null}
        </Link>)}
      </div>
    </section>

    <div id="owner-actions">
      <Panel
        title="What needs you now"
        subtitle="Ordered by urgency. Resolve the first item, then move down the list."
        action={<span className="small muted">{ownerAttention} total signal{ownerAttention===1?"":"s"}</span>}
      >
        {actions.length?<div className="dash-list">
          {actions.map((item)=><Link prefetch={false} className="dash-list-row" href={item.href} key={item.id}>
            <span className="dash-signal-icon" aria-hidden="true">{actionIcon(item.label)}</span>
            <span style={{minWidth:0,flex:"1 1 auto"}}>
              <strong>{item.title}</strong>
              <small>{item.subtitle}</small>
            </span>
            <Pill tone={item.tone}>{item.label}</Pill>
            <ArrowRight size={15} aria-hidden="true"/>
          </Link>)}
        </div>:<Empty
          title="Nothing needs owner intervention right now"
          desc="Sales, recruiting, client delivery and finance have no current exception that crosses the owner threshold."
          action={<Link className="dash-btn dash-btn-light" href="/workspace/admin/funnel">Review agency funnel</Link>}
        />}
        {ownerAttention>actions.length?<p className="small muted" style={{margin:"14px 0 0"}}>Showing the 14 highest-priority items. Clear these first and the queue will refresh.</p>:null}
      </Panel>
    </div>

    <div className="dash-grid">
      <div className="dash-col">
        <Panel title="Revenue & hiring pulse" subtitle="The operating signals worth checking without opening every dashboard">
          <SignalList items={[
            {label:"Active hiring leads",count:Number(pulse.active_leads||0),href:"/workspace/admin/leads?view=hiring",icon:<BriefcaseBusiness size={16}/>,hint:"Open client hiring pipeline"},
            {label:"Proposals out",count:Number(pulse.proposals_out||0),href:"/workspace/admin/leads?view=hiring",icon:<FileText size={16}/>,hint:"Sent, viewed or changes requested"},
            {label:"Hiring Rooms waiting",count:Number(pulse.hiring_rooms_waiting||0),href:"/workspace/admin/jobs?view=all",icon:<UsersRound size={16}/>,hint:"Client response outstanding 24h+"},
            {label:"High-priority tasks",count:Number(pulse.high_priority_tasks||0),href:"/workspace/admin/today#owner-actions",icon:<ListTodo size={16}/>,hint:"Urgent/high due within 24h"},
          ]}/>
        </Panel>
      </div>
      <div className="dash-col">
        <Panel title="Client & money pulse" subtitle="Conditions that can affect retention or cash">
          <SignalList items={[
            {label:"At-risk placements",count:Number(pulse.at_risk||0),href:"/workspace/client-success",icon:<HeartPulse size={16}/>,hint:"Recovery or replacement signal"},
            {label:"Renewals in 30 days",count:Number(pulse.renewals_30d||0),href:"/workspace/client-success",icon:<RefreshCw size={16}/>,hint:"Upcoming client decision"},
            {label:"Payout ready",count:Number(pulse.payout_ready||0),href:"/workspace/admin/payments",icon:<CircleDollarSign size={16}/>,hint:Number(pulse.payout_ready||0)?`${money(Number(pulse.payout_ready_total||0))} collected / release pending`:"No payout waiting"},
            {label:"Payment disputes",count:Number(pulse.disputes||0),href:"/workspace/admin/payments",icon:<AlertTriangle size={16}/>,hint:"Frozen until reviewed"},
          ]}/>
        </Panel>
      </div>
    </div>

    {Number(pipeline.overdue_collections||0)>0?<div className="dash-notice warn"><CircleDollarSign size={16}/><strong>{money(Number(pipeline.overdue_total||0))} overdue.</strong> {pipeline.overdue_collections} invoice{Number(pipeline.overdue_collections)===1?"":"s"} have been awaiting payment for more than {overdueDays} days.</div>:null}
    {!ownerAttention?<div className="dash-notice success"><CheckCircle2 size={16}/><strong>Owner queue is clear.</strong> Routine recruiting and Client Success work can stay with their normal workspaces.</div>:null}
  </div>;
}
