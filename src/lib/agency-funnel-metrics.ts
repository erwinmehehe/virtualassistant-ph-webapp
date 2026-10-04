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
  campaign:string|null;
  leads:number;
  qualified:number;
  customers:number;
  won_value_usd:number;
};

export const getAgencyFunnelMetrics = cache(async function getAgencyFunnelMetrics(recruiterId:string|null,days:number){
  const admin=createAdminClient();
  const result=await withServerTiming("agency.funnel_summary",()=>admin.rpc("agency_funnel_metrics",{
    p_days:days,
    p_recruiter_id:recruiterId,
  }));
  return {data:(result.data||{}) as Partial<AgencyFunnelData>,error:result.error};
});


export const getAgencyAttributionMetrics = cache(async function getAgencyAttributionMetrics(recruiterId:string|null,days:number){
  const admin=createAdminClient();
  const result=await withServerTiming("agency.attribution_summary",()=>admin.rpc("agency_attribution_metrics",{
    p_days:days,
    p_recruiter_id:recruiterId,
  }));
  return {data:(Array.isArray(result.data)?result.data:[]) as AgencyAttributionRow[],error:result.error};
});
