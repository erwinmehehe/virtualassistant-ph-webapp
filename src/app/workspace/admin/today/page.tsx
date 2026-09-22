import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
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

type OwnerActionRow = {
  rank:number;
  due_at:string|null;
  kind:string;
  title:string;
  subtitle:string;
  href:string;
  label:string;
};

type AdminTodaySummary = {
  open_leads:number;
  new_leads:number;
  calls_today:number;
  proposals_open:number;
  open_roles:number;
  shortlists_waiting:number;
  hiring_rooms_waiting:number;
  active_placements:number;
  at_risk:number;
  renewals_30:number;
  overdue_invoice_count:number;
  overdue_total:number|string;
  payout_ready_count:number;
  payout_ready_total:number|string;
  disputes:number;
  urgent_tasks:number;
  owner_attention:number;
  overdue_days:number;
  owner_actions:OwnerActionRow[];
};

function manilaTime(value:string){
  return new Intl.DateTimeFormat("en-PH",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Manila"}).format(new Date(value));
}

function actionTone(item:OwnerActionRow):Tone{
  if(["placement_risk","overdue_collections","payment_disputes","lead_first_response"].includes(item.kind))return "rose";
  if(["lead_followup","shortlist_waiting","owner_task"].includes(item.kind))return "amber";
  if(item.kind==="discovery_call")return "violet";
  if(item.kind==="proposal_followup"||item.kind==="renewal")return "indigo";
  return "slate";
}

function actionIcon(item:OwnerActionRow){
  if(item.kind==="discovery_call")return <CalendarClock size={17}/>;
  if(item.kind==="proposal_followup")return <FileText size={17}/>;
  if(item.kind==="shortlist_waiting")return <UsersRound size={17}/>;
  if(item.kind==="placement_risk")return <HeartPulse size={17}/>;
  if(item.kind==="renewal")return <RefreshCw size={17}/>;
  if(["overdue_collections","payment_disputes"].includes(item.kind))return <CircleDollarSign size={17}/>;
  if(item.kind==="owner_task")return <ListTodo size={17}/>;
  if(item.kind==="lead_followup")return <Clock3 size={17}/>;
  return <MessageSquare size={17}/>;
}

export default async function AdminTodayPage(){
  await requireRole("admin");
  const admin=createAdminClient();
  const {data,error}=await withServerTiming("admin.today_summary", () => admin.rpc("admin_today_summary"));
  if(error)throw error;

  const summary=(data||{}) as AdminTodaySummary;
  const ownerActions=Array.isArray(summary.owner_actions)?summary.owner_actions:[];
  const ownerAttention=Number(summary.owner_attention||0);
  const nowIso=new Date().toISOString();

  const ownerPipeline=[
    {label:"New leads",value:Number(summary.new_leads||0),hint:"Hiring enquiries",href:"/workspace/admin/leads?view=hiring",icon:<MessageSquare size={16}/>},
    {label:"Calls today",value:Number(summary.calls_today||0),hint:"Discovery",href:"/workspace/admin/leads?view=hiring",icon:<CalendarClock size={16}/>},
    {label:"Proposals",value:Number(summary.proposals_open||0),hint:"Open proposals",href:"/workspace/admin/leads?view=hiring",icon:<FileText size={16}/>},
    {label:"Open roles",value:Number(summary.open_roles||0),hint:"Recruiting",href:"/workspace/admin/jobs?view=all",icon:<BriefcaseBusiness size={16}/>},
    {label:"Shortlists",value:Number(summary.shortlists_waiting||0),hint:"Client review",href:"/workspace/admin/jobs?view=all",icon:<UsersRound size={16}/>},
    {label:"Placements",value:Number(summary.active_placements||0),hint:"Active delivery",href:"/workspace/client-success",icon:<CheckCircle2 size={16}/>},
    {label:"Collections",value:Number(summary.overdue_invoice_count||0),hint:Number(summary.overdue_invoice_count||0)?`${money(Number(summary.overdue_total||0))} overdue`:"No overdue invoices",href:"/workspace/admin/payments",icon:<CircleDollarSign size={16}/>},
    {label:"Retention risks",value:Number(summary.at_risk||0),hint:"Needs intervention",href:"/workspace/client-success",icon:<HeartPulse size={16}/>}
  ];

  return <div className="dash-page owner-command-center">
    <DashHeader
      kicker="Agency owner · Today"
      title="Owner Command Center"
      subtitle={<>Read the business left to right, then work the owner exceptions below. <span className="dash-freshness">Refreshed {manilaTime(nowIso)} · Manila</span></>}
      actions={<>
        <Link prefetch={false} className="dash-btn dash-btn-light" href="/workspace/admin/funnel">Agency Funnel</Link>
        <Link prefetch={false} className="dash-btn dash-btn-dark" href="/workspace/admin/leads?view=hiring">Hiring leads <ArrowRight size={14}/></Link>
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
        subtitle="Only owner-level exceptions. Routine recruiting stays in the recruiter workspace."
        action={<span className="small muted">{ownerAttention} total signal{ownerAttention===1?"":"s"}</span>}
      >
        {ownerActions.length?<div className="dash-list">
          {ownerActions.map((item,index)=><Link prefetch={false} className="dash-list-row" href={item.href} key={`${item.kind}-${index}-${item.due_at||""}`}>
            <span className="dash-signal-icon" aria-hidden="true">{actionIcon(item)}</span>
            <span style={{minWidth:0,flex:"1 1 auto"}}><strong>{item.title}</strong><small>{item.subtitle}</small></span>
            <Pill tone={actionTone(item)}>{item.label}</Pill>
            <ArrowRight size={15} aria-hidden="true"/>
          </Link>)}
        </div>:<Empty
          title="Nothing needs owner intervention right now"
          desc="Sales, client delivery and finance have no current exception that crosses the owner threshold."
          action={<Link prefetch={false} className="dash-btn dash-btn-light" href="/workspace/admin/funnel">Review the agency funnel</Link>}
        />}
      </Panel>
    </div>

    <div className="dash-grid">
      <div className="dash-col">
        <Panel title="Revenue & hiring pulse" subtitle="Compact operating signals, not another analytics dashboard">
          <SignalList items={[
            {label:"Open hiring leads",count:Number(summary.open_leads||0),href:"/workspace/admin/leads?view=hiring",icon:<BriefcaseBusiness size={16}/>,hint:"Active client hiring pipeline"},
            {label:"Proposals out",count:Number(summary.proposals_open||0),href:"/workspace/admin/leads?view=hiring",icon:<FileText size={16}/>,hint:"Sent, viewed or changes requested"},
            {label:"Hiring Rooms waiting",count:Number(summary.hiring_rooms_waiting||0),href:"/workspace/admin/jobs?view=all",icon:<UsersRound size={16}/>,hint:"Client response outstanding 24h+"},
            {label:"High-priority tasks",count:Number(summary.urgent_tasks||0),href:"/workspace/admin/today#owner-actions",icon:<ListTodo size={16}/>,hint:"Urgent/high due within 24h"}
          ]}/>
        </Panel>
      </div>
      <div className="dash-col">
        <Panel title="Client & money pulse" subtitle="Only conditions that can affect retention or cash">
          <SignalList items={[
            {label:"At-risk placements",count:Number(summary.at_risk||0),href:"/workspace/client-success",icon:<HeartPulse size={16}/>,hint:"Recovery or replacement signal"},
            {label:"Renewals in 30 days",count:Number(summary.renewals_30||0),href:"/workspace/client-success",icon:<RefreshCw size={16}/>,hint:"Upcoming client decision"},
            {label:"Payout ready",count:Number(summary.payout_ready_count||0),href:"/workspace/admin/payments",icon:<CircleDollarSign size={16}/>,hint:Number(summary.payout_ready_count||0)?`${money(Number(summary.payout_ready_total||0))} collected / release pending`:"No payout waiting"},
            {label:"Payment disputes",count:Number(summary.disputes||0),href:"/workspace/admin/payments",icon:<AlertTriangle size={16}/>,hint:"Frozen until reviewed"}
          ]}/>
        </Panel>
      </div>
    </div>

    {!ownerAttention?<div className="dash-notice success"><CheckCircle2 size={16}/><strong>Owner queue is clear.</strong> Routine recruiting and Client Success work can stay with their normal workspaces.</div>:null}

    <span className="sr-only">Admin role drill-downs use /workspace/admin/jobs/ and client delivery uses /workspace/client-success/.</span>
  </div>;
}
