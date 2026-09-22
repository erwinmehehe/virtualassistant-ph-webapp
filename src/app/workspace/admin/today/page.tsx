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
import styles from "./today.module.css";
import { requireRole } from "@/lib/auth";
import { scoreLead } from "@/lib/lead-scoring";
import { money } from "@/lib/format";
import { createAdminClient } from "@/lib/supabase/admin";

const ACTIVE_LEAD_STAGES = new Set(["new","contacted","discovery_booked","qualified","terms_sent","shortlist_sent","nurture"]);
const DAY = 86_400_000;
const MANILA_OFFSET = 8 * 60 * 60 * 1000;

type LeadRow = {
  id:string;
  name:string|null;
  email:string|null;
  company:string|null;
  service:string|null;
  hours:string|null;
  budget:string|null;
  message:string|null;
  crm_stage:string|null;
  created_at:string;
  stage_updated_at:string|null;
  first_contact_at:string|null;
  last_contact_at:string|null;
  next_follow_up_at:string|null;
  discovery_scheduled_at:string|null;
  discovery_completed_at:string|null;
  first_response_due_at:string|null;
  discovery_cancelled_at:string|null;
  estimated_value_usd:number|string|null;
};

type ProposalRow = {
  id:string;
  lead_id:string;
  status:string;
  role_title:string|null;
  sent_at:string|null;
  viewed_at:string|null;
  changes_requested_at:string|null;
  expires_at:string|null;
  estimated_monthly_total:number|string|null;
  created_at:string;
};

type ShortlistRow = {
  id:string;
  job_id:string;
  released_at:string|null;
  client_decision:string|null;
  client_decision_at:string|null;
  jobs:{title:string|null;company_name:string|null;status:string|null}|null;
};

type WorkroomRow = {
  id:string;
  job_id:string;
  status:string|null;
  placement_stage:string|null;
  health_status:string|null;
  health_score:number|null;
  at_risk_reason:string|null;
  renewal_date:string|null;
  renewal_status:string|null;
  jobs:{title:string|null;company_name:string|null}|null;
  client:{full_name:string|null}|null;
};

type PaymentRow = {
  id:string;
  workroom_id:string|null;
  description:string|null;
  amount_total:number|string;
  currency:string|null;
  status:string;
  created_at:string;
};

type TaskRow = {
  id:string;
  title:string;
  description:string|null;
  priority:string;
  due_at:string|null;
  snoozed_until:string|null;
  href:string|null;
  subject_type:string|null;
  subject_id:string|null;
};

type OwnerAction = {
  id:string;
  title:string;
  subtitle:string;
  href:string;
  label:string;
  tone:Tone;
  icon:React.ReactNode;
  rank:number;
  due:number;
};

function manilaDayBounds(now:number){
  const shifted=new Date(now+MANILA_OFFSET);
  const shiftedStart=Date.UTC(shifted.getUTCFullYear(),shifted.getUTCMonth(),shifted.getUTCDate());
  return {
    start:shiftedStart-MANILA_OFFSET,
    end:shiftedStart-MANILA_OFFSET+DAY,
  };
}

function relativeAge(value:string|null|undefined,now:number){
  if(!value)return"";
  const diff=Math.max(0,now-new Date(value).getTime());
  const hours=Math.floor(diff/3_600_000);
  if(hours<1)return"under 1h";
  if(hours<24)return`${hours}h`;
  return `${Math.floor(hours/24)}d`;
}

function manilaTime(value:string|null|undefined){
  if(!value)return"";
  return new Intl.DateTimeFormat("en-PH",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Manila"}).format(new Date(value));
}

function safeJob(row:ShortlistRow|WorkroomRow){
  return Array.isArray(row.jobs)?row.jobs[0]||null:row.jobs;
}

export default async function AdminTodayPage(){
  await requireRole("admin");
  const admin=createAdminClient();
  const now=Date.now();
  const nowIso=new Date(now).toISOString();
  const {start:todayStart,end:todayEnd}=manilaDayBounds(now);

  const [
    {data:leadData,error:leadError},
    {data:proposalData,error:proposalError},
    {data:shortlistData,error:shortlistError},
    {data:workroomData,error:workroomError},
    {data:paymentData,error:paymentError},
    {data:taskData,error:taskError},
    {data:financeSettings,error:settingsError},
    {count:openRoleCount,error:openRoleError},
  ]=await Promise.all([
    admin.from("lead_intake")
      .select("id,name,email,company,service,hours,budget,message,crm_stage,created_at,stage_updated_at,first_contact_at,last_contact_at,next_follow_up_at,discovery_scheduled_at,discovery_completed_at,discovery_cancelled_at,first_response_due_at,estimated_value_usd")
      .eq("lead_type","client_hiring")
      .order("created_at",{ascending:false})
      .limit(250),
    admin.from("lead_proposals")
      .select("id,lead_id,status,role_title,sent_at,viewed_at,changes_requested_at,expires_at,estimated_monthly_total,created_at")
      .in("status",["sent","viewed","changes_requested"])
      .order("updated_at",{ascending:false})
      .limit(100),
    admin.from("job_shortlist_candidates")
      .select("id,job_id,released_at,client_decision,client_decision_at,jobs!inner(title,company_name,status)")
      .eq("shortlist_status","released")
      .in("jobs.status",["pending","published"])
      .order("released_at",{ascending:true})
      .limit(250),
    admin.from("workrooms")
      .select("id,job_id,status,placement_stage,health_status,health_score,at_risk_reason,renewal_date,renewal_status,jobs(title,company_name),client:profiles!workrooms_client_id_fkey(full_name)")
      .or("placement_stage.is.null,placement_stage.neq.ended")
      .order("created_at",{ascending:false})
      .limit(250),
    admin.from("payments")
      .select("id,workroom_id,description,amount_total,currency,status,created_at")
      .in("status",["awaiting_payment","paid","release_pending","disputed"])
      .order("created_at",{ascending:true})
      .limit(250),
    admin.from("recruiter_tasks")
      .select("id,title,description,priority,due_at,snoozed_until,href,subject_type,subject_id")
      .eq("status","todo")
      .order("due_at",{ascending:true,nullsFirst:false})
      .limit(250),
    admin.from("admin_settings")
      .select("finance_invoice_overdue_days")
      .eq("id",1)
      .maybeSingle(),
    admin.from("jobs")
      .select("id",{count:"exact",head:true})
      .in("status",["pending","published"]),
  ]);

  const firstError=leadError||proposalError||shortlistError||workroomError||paymentError||taskError||settingsError||openRoleError;
  if(firstError)throw firstError;

  const leads=((leadData||[]) as LeadRow[]).filter((lead)=>ACTIVE_LEAD_STAGES.has(String(lead.crm_stage||"new")));
  const rawProposals=(proposalData||[]) as ProposalRow[];
  const shortlist=(shortlistData||[]) as unknown as ShortlistRow[];
  const workrooms=(workroomData||[]) as unknown as WorkroomRow[];
  const payments=(paymentData||[]) as PaymentRow[];
  const tasks=(taskData||[]) as TaskRow[];
  const leadById=new Map(leads.map((lead)=>[lead.id,lead]));
  const proposals=rawProposals.filter((proposal)=>leadById.has(proposal.lead_id));
  const workroomByJob=new Map(workrooms.filter((room)=>room.job_id).map((room)=>[room.job_id,room]));
  const overdueDays=Number(financeSettings?.finance_invoice_overdue_days??7);
  const overdueCutoff=now-overdueDays*DAY;

  const scoredLeads=leads.map((lead)=>({lead,score:scoreLead(lead,now)}));
  const hotLeads=scoredLeads.filter(({score})=>score.temperature==="hot");
  const callsToday=leads
    .filter((lead)=>{
      const at=lead.discovery_scheduled_at?new Date(lead.discovery_scheduled_at).getTime():0;
      return at>=todayStart&&at<todayEnd&&!lead.discovery_completed_at&&!lead.discovery_cancelled_at;
    })
    .sort((a,b)=>new Date(a.discovery_scheduled_at||0).getTime()-new Date(b.discovery_scheduled_at||0).getTime());

  const pendingShortlist=shortlist.filter((row)=>!row.client_decision&&row.released_at);
  const hiringRoomByJob=new Map<string,{jobId:string;title:string;company:string;releasedAt:string;count:number}>();
  for(const row of pendingShortlist){
    if(!row.released_at)continue;
    const job=safeJob(row);
    const existing=hiringRoomByJob.get(row.job_id);
    if(existing){
      existing.count+=1;
      if(new Date(row.released_at).getTime()<new Date(existing.releasedAt).getTime())existing.releasedAt=row.released_at;
    }else{
      hiringRoomByJob.set(row.job_id,{
        jobId:row.job_id,
        title:job?.title||"Hiring Room shortlist",
        company:job?.company_name||"Client",
        releasedAt:row.released_at,
        count:1,
      });
    }
  }
  const hiringRoomsWaiting=[...hiringRoomByJob.values()];

  const atRisk=workrooms.filter((room)=>room.health_status==="at_risk"||["recovery","replacement"].includes(String(room.placement_stage)));
  const renewals=workrooms
    .filter((room)=>{
      if(!room.renewal_date)return false;
      const due=new Date(`${room.renewal_date}T00:00:00Z`).getTime();
      return due>=now-DAY&&due<=now+30*DAY&&room.renewal_status!=="renewed";
    })
    .sort((a,b)=>String(a.renewal_date).localeCompare(String(b.renewal_date)));

  const overdueInvoices=payments.filter((payment)=>payment.status==="awaiting_payment"&&new Date(payment.created_at).getTime()<overdueCutoff);
  const overdueTotal=overdueInvoices.reduce((sum,row)=>sum+Number(row.amount_total||0),0);
  const payoutReady=payments.filter((payment)=>["paid","release_pending"].includes(payment.status));
  const payoutReadyTotal=payoutReady.reduce((sum,row)=>sum+Number(row.amount_total||0),0);
  const disputes=payments.filter((payment)=>payment.status==="disputed");

  const urgentTasks=tasks.filter((task)=>{
    if(!["urgent","high"].includes(task.priority))return false;
    if(task.snoozed_until&&new Date(task.snoozed_until).getTime()>now)return false;
    if(!task.due_at)return true;
    return new Date(task.due_at).getTime()<=now+DAY;
  });
  const taskJobIds=[...new Set(urgentTasks.filter((task)=>task.subject_type==="job"&&task.subject_id).map((task)=>String(task.subject_id)))];
  const {data:taskJobData,error:taskJobError}=taskJobIds.length
    ?await admin.from("jobs").select("id,status").in("id",taskJobIds)
    :{data:[],error:null};
  if(taskJobError)throw taskJobError;
  const taskJobStatus=new Map((taskJobData||[]).map((job:any)=>[job.id,String(job.status||"")]));

  const actions:OwnerAction[]=[];

  for(const {lead} of scoredLeads){
    const stage=String(lead.crm_stage||"new");
    const responseDue=lead.first_response_due_at?new Date(lead.first_response_due_at).getTime():new Date(lead.created_at).getTime()+30*60_000;
    const href=lead.email
      ? `/workspace/admin/leads?view=hiring&q=${encodeURIComponent(lead.email)}`
      : `/workspace/admin/leads?view=hiring&q=${encodeURIComponent(lead.id)}`;
    if(stage==="new"&&!lead.first_contact_at&&responseDue<now){
      actions.push({
        id:`lead-first-${lead.id}`,
        title:`First response overdue · ${lead.company||lead.name||"New client lead"}`,
        subtitle:`${lead.service||"Hiring request"} · waiting ${relativeAge(lead.created_at,now)}`,
        href,label:"Lead",tone:"rose",icon:<MessageSquare size={17}/>,rank:1,due:responseDue,
      });
      continue;
    }
    if(lead.next_follow_up_at&&new Date(lead.next_follow_up_at).getTime()<now){
      actions.push({
        id:`lead-followup-${lead.id}`,
        title:`Follow-up overdue · ${lead.company||lead.name||"Client lead"}`,
        subtitle:`${lead.service||"Hiring request"} · ${relativeAge(lead.next_follow_up_at,now)} overdue`,
        href,label:"Lead",tone:"amber",icon:<Clock3 size={17}/>,rank:2,due:new Date(lead.next_follow_up_at).getTime(),
      });
    }
  }

  for(const lead of callsToday){
    const when=new Date(lead.discovery_scheduled_at||0).getTime();
    const missed=when<now;
    const href=lead.email
      ? `/workspace/admin/leads?view=hiring&q=${encodeURIComponent(lead.email)}`
      : `/workspace/admin/leads?view=hiring&q=${encodeURIComponent(lead.id)}`;
    actions.push({
      id:`call-${lead.id}`,
      title:`${missed?"Missed discovery call":"Discovery call"} · ${lead.company||lead.name||"Client"}`,
      subtitle:missed?`${relativeAge(lead.discovery_scheduled_at,now)} overdue · ${lead.service||"Hiring brief"}`:`${manilaTime(lead.discovery_scheduled_at)} · ${lead.service||"Hiring brief"}`,
      href,label:"Call",tone:missed?"rose":"violet",icon:<CalendarClock size={17}/>,rank:1,due:when,
    });
  }

  for(const proposal of proposals){
    const lead=leadById.get(proposal.lead_id);
    const viewedAge=proposal.viewed_at?now-new Date(proposal.viewed_at).getTime():0;
    const sentAge=proposal.sent_at?now-new Date(proposal.sent_at).getTime():0;
    const needsAction=Boolean(proposal.changes_requested_at)||(proposal.viewed_at&&viewedAge>=DAY)||(!proposal.viewed_at&&proposal.sent_at&&sentAge>=2*DAY);
    if(!needsAction)continue;
    const leadLabel=lead?.company||lead?.name||proposal.role_title||"Client proposal";
    const why=proposal.changes_requested_at
      ?"Changes requested"
      :proposal.viewed_at
        ?`Viewed ${relativeAge(proposal.viewed_at,now)} ago`
        :`Sent ${relativeAge(proposal.sent_at,now)} ago · not viewed`;
    actions.push({
      id:`proposal-${proposal.id}`,
      title:`Proposal needs follow-up · ${leadLabel}`,
      subtitle:`${proposal.role_title||"Hiring proposal"} · ${why}`,
      href:`/workspace/admin/leads?view=hiring&q=${encodeURIComponent(proposal.lead_id)}`,
      label:"Proposal",tone:"indigo",icon:<FileText size={17}/>,rank:proposal.changes_requested_at?1:3,
      due:new Date(proposal.changes_requested_at||proposal.viewed_at||proposal.sent_at||proposal.created_at).getTime(),
    });
  }

  for(const room of hiringRoomsWaiting){
    const age=now-new Date(room.releasedAt).getTime();
    if(age<DAY)continue;
    actions.push({
      id:`hiring-room-${room.jobId}`,
      title:`Hiring Room waiting · ${room.company}`,
      subtitle:`${room.title} · ${room.count} candidate${room.count===1?"":"s"} waiting ${relativeAge(room.releasedAt,now)} for client response`,
      href:`/workspace/admin/jobs/${room.jobId}`,
      label:"Hiring Room",tone:"amber",icon:<UsersRound size={17}/>,rank:3,due:new Date(room.releasedAt).getTime(),
    });
  }

  for(const room of atRisk){
    const job=safeJob(room);
    actions.push({
      id:`risk-${room.id}`,
      title:`Placement at risk · ${job?.company_name||room.client?.full_name||"Client"}`,
      subtitle:`${job?.title||"Active placement"} · ${room.at_risk_reason||"Recovery attention required"}`,
      href:`/workspace/client-success/${room.id}`,
      label:"Client health",tone:"rose",icon:<HeartPulse size={17}/>,rank:1,due:now,
    });
  }

  if(overdueInvoices.length){
    actions.push({
      id:"overdue-collections",
      title:`${overdueInvoices.length} overdue collection${overdueInvoices.length===1?"":"s"} · ${money(overdueTotal)}`,
      subtitle:`Awaiting payment for more than ${overdueDays} days`,
      href:"/workspace/admin/payments",
      label:"Finance",tone:"rose",icon:<CircleDollarSign size={17}/>,rank:1,due:Math.min(...overdueInvoices.map((row)=>new Date(row.created_at).getTime())),
    });
  }

  if(disputes.length){
    actions.push({
      id:"payment-disputes",
      title:`${disputes.length} payment dispute${disputes.length===1?"":"s"} need review`,
      subtitle:"Payout remains frozen until the dispute is resolved.",
      href:"/workspace/admin/payments",
      label:"Finance",tone:"rose",icon:<AlertTriangle size={17}/>,rank:1,due:Math.min(...disputes.map((row)=>new Date(row.created_at).getTime())),
    });
  }

  for(const room of renewals){
    const job=safeJob(room);
    const due=new Date(`${room.renewal_date}T00:00:00Z`).getTime();
    actions.push({
      id:`renewal-${room.id}`,
      title:`Renewal approaching · ${job?.company_name||room.client?.full_name||"Client"}`,
      subtitle:`${job?.title||"Placement"} · renewal ${room.renewal_date}`,
      href:`/workspace/client-success/${room.id}`,
      label:"Renewal",tone:"indigo",icon:<RefreshCw size={17}/>,rank:4,due,
    });
  }

  for(const task of urgentTasks){
    let href="/workspace/admin/today#owner-actions";
    if(task.subject_type==="job"&&task.subject_id){
      const room=workroomByJob.get(task.subject_id);
      const jobStatus=taskJobStatus.get(task.subject_id)||"";
      if(!room&&["closed","draft"].includes(jobStatus))continue;
      if(hiringRoomByJob.has(task.subject_id)&&/shortlist|client response/i.test(`${task.title} ${task.description||""}`))continue;
      href=room?`/workspace/client-success/${room.id}`:`/workspace/admin/jobs/${task.subject_id}`;
    }else if(task.subject_type==="lead"&&task.subject_id){
      href=`/workspace/admin/leads?view=hiring&q=${encodeURIComponent(task.subject_id)}`;
    }else if(task.subject_type==="va"&&task.subject_id){
      href=`/workspace/admin/vetting/${task.subject_id}`;
    }
    actions.push({
      id:`task-${task.id}`,
      title:task.title,
      subtitle:task.description||`${task.priority} priority owner task`,
      href,
      label:"Task",tone:task.priority==="urgent"?"rose":"amber",icon:<ListTodo size={17}/>,rank:task.priority==="urgent"?1:2,
      due:task.due_at?new Date(task.due_at).getTime():now,
    });
  }

  actions.sort((a,b)=>a.rank-b.rank||a.due-b.due);
  const visibleActions=actions.slice(0,14);
  const waitingHiringRooms=hiringRoomsWaiting.filter((room)=>now-new Date(room.releasedAt).getTime()>=DAY).length;
  const ownerAttention=actions.length;
  const newLeadCount=leads.filter((lead)=>String(lead.crm_stage||"new")==="new").length;
  const ownerPipeline=[
    {label:"New leads",value:newLeadCount,hint:"Hiring enquiries",href:"/workspace/admin/leads?view=hiring",icon:<MessageSquare size={16}/>},
    {label:"Calls today",value:callsToday.length,hint:"Discovery",href:"/workspace/admin/leads?view=hiring",icon:<CalendarClock size={16}/>},
    {label:"Proposals",value:proposals.length,hint:"Open proposals",href:"/workspace/admin/leads?view=hiring",icon:<FileText size={16}/>},
    {label:"Open roles",value:Number(openRoleCount||0),hint:"Recruiting",href:"/workspace/admin/jobs?view=all",icon:<BriefcaseBusiness size={16}/>},
    {label:"Shortlists",value:hiringRoomsWaiting.length,hint:"Client review",href:"/workspace/admin/jobs?view=all",icon:<UsersRound size={16}/>},
    {label:"Placements",value:workrooms.length,hint:"Active delivery",href:"/workspace/client-success",icon:<CheckCircle2 size={16}/>},
    {label:"Collections",value:overdueInvoices.length,hint:overdueInvoices.length?money(overdueTotal)+" overdue":"No overdue invoices",href:"/workspace/admin/payments",icon:<CircleDollarSign size={16}/>},
    {label:"Retention risks",value:atRisk.length,hint:"Needs intervention",href:"/workspace/client-success",icon:<HeartPulse size={16}/>}
  ];

  return <div className="dash-page owner-command-center">
    <DashHeader
      kicker="Agency owner · Today"
      title="Owner Command Center"
      subtitle={<>Read the business left to right, then work the owner exceptions below. <span className="dash-freshness">Refreshed {manilaTime(nowIso)} · Manila</span></>}
      actions={<>
        <Link className="dash-btn dash-btn-light" href="/workspace/admin">Admin overview</Link>
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
      {visibleActions.length?<div className="dash-list">
        {visibleActions.map((item)=><Link prefetch={false} className="dash-list-row" href={item.href} key={item.id}>
          <span className="dash-signal-icon" aria-hidden="true">{item.icon}</span>
          <span style={{minWidth:0,flex:"1 1 auto"}}>
            <strong>{item.title}</strong>
            <small>{item.subtitle}</small>
          </span>
          <Pill tone={item.tone}>{item.label}</Pill>
          <ArrowRight size={15} aria-hidden="true"/>
        </Link>)}
      </div>:<Empty
        title="Nothing needs owner intervention right now"
        desc="Sales, client delivery and finance have no current exception that crosses the owner threshold."
        action={<Link className="dash-btn dash-btn-light" href="/workspace/admin">Review the full admin workspace</Link>}
      />}
      {actions.length>visibleActions.length?<p className="small muted" style={{margin:"14px 0 0"}}>Showing the 14 highest-priority items. Clear these first and the queue will refresh.</p>:null}
    </Panel>
    </div>

    <div className="dash-grid">
      <div className="dash-col">
        <Panel title="Revenue & hiring pulse" subtitle="Signals worth checking without opening the CRM">
          <SignalList items={[
            {label:"Hot leads",count:hotLeads.length,href:"/workspace/admin/leads?view=hiring",icon:<BriefcaseBusiness size={16}/>,hint:"Current lead score is Hot"},
            {label:"Proposals out",count:proposals.length,href:"/workspace/admin/leads?view=hiring",icon:<FileText size={16}/>,hint:"Sent, viewed or changes requested"},
            {label:"Hiring Rooms waiting",count:waitingHiringRooms,href:"/workspace/admin/jobs?view=all",icon:<UsersRound size={16}/>,hint:"Client response outstanding 24h+"},
            {label:"High-priority tasks",count:urgentTasks.length,href:"/workspace/admin/today#owner-actions",icon:<ListTodo size={16}/>,hint:"Urgent/high due within 24h"},
          ]}/>
        </Panel>
      </div>
      <div className="dash-col">
        <Panel title="Client & money pulse" subtitle="Only conditions that can affect retention or cash">
          <SignalList items={[
            {label:"At-risk placements",count:atRisk.length,href:"/workspace/client-success",icon:<HeartPulse size={16}/>,hint:"Recovery or replacement signal"},
            {label:"Renewals in 30 days",count:renewals.length,href:"/workspace/client-success",icon:<RefreshCw size={16}/>,hint:"Upcoming client decision"},
            {label:"Payout ready",count:payoutReady.length,href:"/workspace/admin/payments",icon:<CircleDollarSign size={16}/>,hint:payoutReady.length?`${money(payoutReadyTotal)} collected / release pending`:"No payout waiting"},
            {label:"Payment disputes",count:disputes.length,href:"/workspace/admin/payments",icon:<AlertTriangle size={16}/>,hint:"Frozen until reviewed"},
          ]}/>
        </Panel>
      </div>
    </div>

    {!ownerAttention?<div className="dash-notice success"><CheckCircle2 size={16}/><strong>Owner queue is clear.</strong> Routine recruiting and Client Success work can stay with their normal workspaces.</div>:null}
  </div>;
}
