import "server-only";
import { cache } from "react";
import { publicationMissingDetails } from "@/lib/job-publication";
import { createAdminClient } from "@/lib/supabase/admin";
import { withServerTiming } from "@/lib/server-timing";

type RoleReadinessJobRow = {
  id:string;
  title:string|null;
  company_name:string|null;
  status:string;
  service_model:string|null;
  recruiter_id:string|null;
  client_id:string|null;
  created_at:string;
  updated_at:string|null;
  summary:string|null;
  responsibilities:string[]|null;
  required_skills:string[]|null;
  hours_per_week:number|null;
  timezone:string|null;
  min_hourly_rate:number|null;
  start_timing:string|null;
};

export type RoleReadinessDashboardItem = RoleReadinessJobRow & {
  missing:string[];
  age_hours:number;
};

function ageHours(value:string){
  const created=new Date(value).getTime();
  if(!Number.isFinite(created)) return 0;
  return Math.max(0,Math.floor((Date.now()-created)/3600000));
}

export function roleReadinessMissingLabel(value:string){
  if(value==="start timing") return "preferred start";
  if(value==="budget") return "VA budget";
  return value;
}

export function adminRoleReadinessNeedsAttention(item:RoleReadinessDashboardItem){
  return !item.recruiter_id || item.age_hours>=72 || item.service_model==="managed_service";
}

export const getRoleReadinessDashboard=cache(async function getRoleReadinessDashboard(recruiterId:string|null=null){
  const admin=createAdminClient();
  let query=admin
    .from("jobs")
    .select("id,title,company_name,status,service_model,recruiter_id,client_id,created_at,updated_at,summary,responsibilities,required_skills,hours_per_week,timezone,min_hourly_rate,start_timing")
    .in("status",["pending","published"])
    .order("created_at",{ascending:true})
    .limit(100);

  if(recruiterId) query=query.eq("recruiter_id",recruiterId);

  const {data,error}=await withServerTiming(
    recruiterId?"role_readiness.recruiter":"role_readiness.admin",
    ()=>query
  );
  if(error) throw error;

  return ((data||[]) as RoleReadinessJobRow[])
    .map((job)=>{
      const missing=publicationMissingDetails(job);
      return {...job,missing,age_hours:ageHours(job.created_at)};
    })
    .filter((job)=>job.missing.length>0)
    .sort((a,b)=>b.age_hours-a.age_hours);
});
