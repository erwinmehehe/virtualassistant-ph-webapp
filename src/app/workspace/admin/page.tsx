import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, ClipboardCheck, Eye, UsersRound } from "lucide-react";
import { DashHeader, Notice, Panel, Pill, StatCard, type Tone } from "@/components/dash-ui";
import { requireRole } from "@/lib/auth";
import { getRuntimeSetupStatus } from "@/lib/env-status";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminPage(){
  await requireRole("admin");
  const admin=createAdminClient();
  const status=getRuntimeSetupStatus();
  const [{count:managedExceptions},{count:finalists},{count:bench},{count:vas},{count:clients},{count:recruiters},{count:publicVas}]=await Promise.all([
    admin.from("jobs").select("id",{count:"exact",head:true}).eq("status","pending").eq("service_model","managed_service"),
    admin.from("va_vetting").select("va_id",{count:"exact",head:true}).eq("stage","finalist"),
    admin.from("bench_memberships").select("id",{count:"exact",head:true}).eq("status","active"),
    admin.from("profiles").select("id",{count:"exact",head:true}).eq("role","va"),
    admin.from("profiles").select("id",{count:"exact",head:true}).eq("role","client"),
    admin.from("profiles").select("id",{count:"exact",head:true}).eq("role","recruiter"),
    admin.from("public_va_directory").select("user_id",{count:"exact",head:true})
  ]);
  const setupNeedsAttention=!status.leadIngest.configured||!status.appEmail.configured||!status.appUrl.configured;
  const accounts:{label:string;value:number;tone:Tone}[]=[{label:"VAs",value:vas||0,tone:"emerald"},{label:"Clients",value:clients||0,tone:"indigo"},{label:"Recruiters",value:recruiters||0,tone:"amber"}];
  const accountTop=Math.max(...accounts.map((row)=>row.value),1);

  return <div className="dash-page">
    <DashHeader kicker="Agency administration" title="Operations by exception" subtitle="Recruiters own standard client searches. Admin focuses on managed-service commercial decisions, finalist approval, payment risk, and system health." actions={<Link className="dash-btn dash-btn-dark" href="/workspace/admin/vetting"><ClipboardCheck size={15}/> Review finalists</Link>}/>
    {setupNeedsAttention?<Notice tone="warn"><strong>Production setup needs attention.</strong> Check webhook protection, transactional email, and the production URL before relying on automated workflows. <Link className="dash-link" href="/workspace/admin/system">Review system setup <ArrowRight size={14}/></Link></Notice>:null}

    <div className="dash-stats">
      <StatCard label="Job exceptions" value={managedExceptions||0} icon={<BriefcaseBusiness size={20}/>} tone="amber" href="/workspace/admin/jobs" sub="Managed-service pricing decisions" chip={managedExceptions?{label:"Needs admin",tone:"warn"}:{label:"All clear",tone:"good"}}/>
      <StatCard label="Vetting finalists" value={finalists||0} icon={<ClipboardCheck size={20}/>} tone="indigo" href="/workspace/admin/vetting" sub="Recruiter-screened finalists" chip={finalists?{label:"Awaiting final call",tone:"warn"}:{label:"All clear",tone:"good"}}/>
      <StatCard label="Vetted public profiles" value={publicVas||0} icon={<Eye size={20}/>} tone="emerald" href="/find-talent" sub="Approved VA profiles"/>
      <StatCard label="Active talent pool" value={bench||0} icon={<UsersRound size={20}/>} tone="sky" sub="Bench memberships"/>
    </div>

    <div className="dash-grid"><div className="dash-col"><Panel title="Where admin should act" subtitle="Routine recruiting should not land here"><div className="dash-list">
      <Link className="dash-list-row" href="/workspace/admin/jobs"><span><strong>Resolve job exceptions</strong><small>Managed-service margin and unusual commercial decisions only.</small></span><Pill tone={managedExceptions?"amber":"emerald"}>{managedExceptions||0} waiting</Pill></Link>
      <Link className="dash-list-row" href="/workspace/admin/vetting"><span><strong>Review finalists</strong><small>Only recruiter-screened and scorecarded VAs reach final approval.</small></span><Pill tone={finalists?"amber":"emerald"}>{finalists||0} waiting</Pill></Link>
      <Link className="dash-list-row" href="/workspace/admin/payments"><span><strong>Payments and disputes</strong><small>Create confirmed compensation invoices, release paid payouts, and resolve disputes.</small></span><ArrowRight size={16}/></Link>
      <Link className="dash-list-row" href="/workspace/admin/system"><span><strong>System health</strong><small>Email, webhook protection, runtime configuration, and release readiness.</small></span><Pill tone={setupNeedsAttention?"rose":"emerald"}>{setupNeedsAttention?"needs attention":"configured"}</Pill></Link>
    </div></Panel></div>
    <div className="dash-col"><Panel title="Agency accounts" subtitle="Operational users by role"><div className="dash-funnel">{accounts.map((row)=><div className="dash-funnel-row" key={row.label}><span className="dash-funnel-label">{row.label}</span><div className="dash-funnel-track"><div className={`dash-funnel-fill tone-${row.tone}`} style={{width:`${Math.max((row.value/accountTop)*100,9)}%`}}>{row.value}</div></div></div>)}</div></Panel></div></div>
  </div>;
}
