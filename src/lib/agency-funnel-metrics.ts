import "server-only";
import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { withServerTiming } from "@/lib/server-timing";

export type AgencyFunnelData = {
  days:number;
  journey:{
    enquiries:number;
    discovery_booked:number;
    discovery_attended:number;
    qualified:number;
    proposal_sent:number;
    proposal_accepted:number;
    shortlisted:number;
    interviewed:number;
    offered:number;
    hired:number;
  };
  sales:{
    leads:number;
    calls_booked:number;
    discovery_completed:number;
    qualified:number;
    proposals:number;
    clients_won:number;
    active_job_orders:number;
  };
  proposal:{
    sent:number;
    viewed:number;
    responded:number;
    changes_requested:number;
    accepted:number;
    declined:number;
    median_hours_to_view:number;
    median_hours_to_decision:number;
  };
  recruiting:{
    job_orders:number;
    shortlisted:number;
    interviewed:number;
    offered:number;
    placed:number;
    avg_days_to_shortlist:number;
    avg_days_to_start:number;
  };
  retention:{
    active_placements:number;
    eligible_30d:number;
    retained_30d:number;
    eligible_90d:number;
    retained_90d:number;
  };
};

export type AgencyAttributionRow = {
  source:string;
  medium:string|null;
  campaign:string|null;
  total_inquiries:number;
  leads:number;
  spam_leads:number;
  junk_leads:number;
  spam_rate:number;
  junk_rate:number;
  qualified:number;
  discovery_booked:number;
  discovery_completed:number;
  proposal_leads:number;
  proposals:number;
  proposal_accepted:number;
  proposal_acceptance_rate:number;
  customers:number;
  lost_leads:number;
  top_loss_reason_code:string|null;
  open_pipeline_value_usd:number;
  pipeline_value_usd:number;
  won_value_usd:number;
  avg_customer_value_usd:number;
  collected_revenue_usd:number;
  collected_revenue_per_customer_usd:number;
  paid_payments:number;
  revenue_per_lead_usd:number;
};

export type AttributionModel = "first_touch" | "last_touch";

export const getAgencyFunnelMetrics = cache(async function getAgencyFunnelMetrics(recruiterId:string|null,days:number){
  const admin=createAdminClient();
  const result=await withServerTiming("agency.funnel_summary",()=>admin.rpc("agency_funnel_metrics",{
    p_days:days,
    p_recruiter_id:recruiterId,
  }));
  return {data:(result.data||{}) as Partial<AgencyFunnelData>,error:result.error};
});


export const getAgencyRevenueAttributionMetrics = cache(async function getAgencyRevenueAttributionMetrics(
  recruiterId:string|null,
  days:number,
  model:AttributionModel,
){
  const admin=createAdminClient();
  const result=await withServerTiming(`agency.revenue_attribution.${model}`,()=>admin.rpc("agency_revenue_attribution_metrics",{
    p_days:days,
    p_recruiter_id:recruiterId,
    p_model:model,
  }));
  return {data:(Array.isArray(result.data)?result.data:[]) as AgencyAttributionRow[],error:result.error};
});
