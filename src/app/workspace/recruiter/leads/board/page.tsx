import Link from "next/link";
import { Flame, LayoutDashboard, Snowflake, ThermometerSun } from "lucide-react";
import { requireRoleFast } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { DashHeader, StatCard } from "@/components/dash-ui";
import { RecruiterLeadKanban, type PipelineLead, type PipelineStage } from "@/components/recruiter-lead-kanban";
import { scoreLead } from "@/lib/lead-scoring";

type LeadRow = {
  id: string;
  name: string | null;
  email: string | null;
  company: string | null;
  service: string | null;
  crm_stage: string | null;
  owner_id: string | null;
  created_at: string;
  stage_updated_at: string | null;
  first_contact_at: string | null;
  last_contact_at: string | null;
  next_follow_up_at: string | null;
  discovery_scheduled_at: string | null;
  discovery_completed_at: string | null;
  estimated_value_usd: number | string | null;
  budget: string | null;
  hours: string | null;
  message: string | null;
};

const BOARD_STAGES: PipelineStage[] = ["new","contacted","discovery_booked","qualified","terms_sent","nurture","won"];

export default async function RecruiterLeadBoardPage({ searchParams }: { searchParams: Promise<Record<string,string|undefined>> }) {
  const params = await searchParams;
  const { userId } = await requireRoleFast("recruiter");
  const admin = createAdminClient();
  const scope = params.scope === "team" ? "team" : "mine";

  let query = admin
    .from("lead_intake")
    .select("id,name,email,company,service,crm_stage,owner_id,created_at,stage_updated_at,first_contact_at,last_contact_at,next_follow_up_at,discovery_scheduled_at,discovery_completed_at,estimated_value_usd,budget,hours,message")
    .eq("lead_type", "client_hiring")
    .in("crm_stage", BOARD_STAGES)
    .order("created_at", { ascending: false })
    .limit(500);

  if (scope === "mine") query = query.eq("owner_id", userId);

  const { data, error } = await query;
  if (error) throw error;

  const rows = (data || []) as LeadRow[];
  const leads: PipelineLead[] = rows.map((lead) => {
    const scored = scoreLead(lead);
    return {
      id: lead.id,
      name: lead.name || lead.email || "Client lead",
      email: lead.email,
      company: lead.company,
      service: lead.service,
      crm_stage: (BOARD_STAGES.includes(String(lead.crm_stage) as PipelineStage) ? lead.crm_stage : "new") as PipelineStage,
      score: scored.score,
      temperature: scored.temperature,
      reasons: scored.reasons,
      daysSinceTouch: scored.daysSinceTouch,
      daysOverdue: scored.daysOverdue,
      estimatedMonthlyBudget: scored.estimatedMonthlyBudget,
      estimatedAgencyValue: Number(lead.estimated_value_usd || 0)
    };
  });

  const active = leads.filter((lead) => lead.crm_stage !== "won");
  const hot = active.filter((lead) => lead.temperature === "hot").length;
  const warm = active.filter((lead) => lead.temperature === "warm").length;
  const cold = active.filter((lead) => lead.temperature === "cold").length;

  return <div className="dash-page pipeline-board-page">
    <DashHeader
      kicker="Sales CRM"
      title="Pipeline board"
      subtitle="Move opportunities through the active sales pipeline. Cards are score-sorted so the strongest and most urgent opportunities stay near the top."
      actions={<Link className="btn" href="/workspace/recruiter/leads"><LayoutDashboard size={16}/> List view</Link>}
    />

    <div className="dash-stats">
      <StatCard label="Active pipeline" value={active.length} icon={<LayoutDashboard size={20}/>} tone="indigo" sub={scope === "mine" ? "Your owned leads" : "Team-owned leads"}/>
      <StatCard label="Hot" value={hot} icon={<Flame size={20}/>} tone="rose" sub="High score or urgent action"/>
      <StatCard label="Warm" value={warm} icon={<ThermometerSun size={20}/>} tone="amber" sub="Progressing opportunities"/>
      <StatCard label="Cold" value={cold} icon={<Snowflake size={20}/>} tone="slate" sub="Low activity or early stage"/>
    </div>

    <div className="pipeline-board-toolbar">
      <div className="role-filter-tabs" aria-label="Pipeline ownership scope">
        <Link className={scope === "mine" ? "active" : ""} href="/workspace/recruiter/leads/board?scope=mine">My leads</Link>
        <Link className={scope === "team" ? "active" : ""} href="/workspace/recruiter/leads/board?scope=team">Team</Link>
      </div>
      <span className="small muted">Drag cards on desktop. Use “Move to” on touch devices.</span>
    </div>

    <RecruiterLeadKanban initialLeads={leads}/>
  </div>;
}
