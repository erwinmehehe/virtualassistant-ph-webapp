import "server-only";
import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { withServerTiming } from "@/lib/server-timing";

export type RecruiterRoleSummaryJob = {
  id:string;
  title:string|null;
  company_name:string|null;
  status:string;
  hiring_stage:string;
  hiring_stage_entered_at:string|null;
  target_start_date:string|null;
  recruiter_id:string|null;
  client_id:string|null;
  created_at:string;
  updated_at:string;
  summary:string|null;
  responsibilities:string[]|null;
  required_skills:string[]|null;
  categories:string[]|null;
  hours_per_week:number|null;
  timezone:string|null;
  min_hourly_rate:number|null;
  start_timing:string|null;
  commercial_status:string|null;
  proposed_count:number;
  released_count:number;
  active_shortlist_count:number;
  released_pass_count:number;
  unanswered_released_count:number;
  oldest_unanswered_released_at:string|null;
  active_interview_count:number;
  interview_overdue:boolean;
  active_offer_count:number;
  offer_overdue:boolean;
  placement_created:boolean;
};

export type RecruiterRolesSummary = {
  jobs:RecruiterRoleSummaryJob[];
  talent:{
    active_count:number;
    uncategorized_count:number;
    not_started_count:number;
    supply_by_category:Record<string,number>;
  };
};

export const getRecruiterRolesSummary = cache(async function getRecruiterRolesSummary(recruiterId:string){
  const admin=createAdminClient();
  const result=await withServerTiming("recruiter.roles_summary",()=>admin.rpc("recruiter_roles_summary",{p_recruiter_id:recruiterId}));
  const data=(result.data||{}) as Partial<RecruiterRolesSummary>;
  return {
    data:{
      jobs:Array.isArray(data.jobs)?data.jobs:[],
      talent:{
        active_count:Number(data.talent?.active_count||0),
        uncategorized_count:Number(data.talent?.uncategorized_count||0),
        not_started_count:Number(data.talent?.not_started_count||0),
        supply_by_category:(data.talent?.supply_by_category||{}) as Record<string,number>,
      },
    },
    error:result.error,
  };
});
