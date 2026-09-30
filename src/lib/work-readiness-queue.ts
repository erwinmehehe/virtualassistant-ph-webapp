import "server-only";
import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { withServerTiming } from "@/lib/server-timing";

export type WorkReadinessQueueRow = {
  user_id:string;
  full_name:string|null;
  avatar_url:string|null;
  work_setup_computer:string|null;
  work_setup_os:string|null;
  work_setup_ram_gb:number|null;
  primary_internet:string|null;
  backup_internet:string|null;
  backup_power:string|null;
  headset_ready:boolean|null;
  webcam_ready:boolean|null;
  quiet_workspace:boolean|null;
  work_setup_submitted_at:string|null;
  work_setup_verified_at:string|null;
  work_setup_verification_notes:string|null;
};

export const getWorkReadinessQueue = cache(async function getWorkReadinessQueue(actorId:string){
  const admin=createAdminClient();
  const result=await withServerTiming("recruiter.work_readiness",()=>admin.rpc("work_readiness_queue",{p_actor_id:actorId,p_limit:200}));
  const raw=(result.data||{}) as {rows?:WorkReadinessQueueRow[]};
  return {rows:Array.isArray(raw.rows)?raw.rows:[],error:result.error};
});


export const getRoleShortlistWorkReadinessQueue = cache(async function getRoleShortlistWorkReadinessQueue(actorId:string,jobId:string){
  const admin=createAdminClient();
  return withServerTiming("recruiter.shortlist_work_readiness",async()=>{
    const [{data:actor},{data:job},{data:shortlistRows}]=await Promise.all([
      admin.from("profiles").select("id,role,account_status").eq("id",actorId).maybeSingle(),
      admin.from("jobs").select("id,title").eq("id",jobId).maybeSingle(),
      admin.from("job_shortlist_candidates")
        .select("va_id")
        .eq("job_id",jobId)
        .eq("shortlist_status","proposed")
        .not("created_by","is",null),
    ]);
    if(!actor||actor.account_status!=="active"||!["recruiter","admin"].includes(String(actor.role))){
      return {rows:[] as WorkReadinessQueueRow[],error:new Error("Unauthorized work-readiness scope."),jobTitle:null};
    }
    const ids=[...new Set((shortlistRows||[]).map((row:any)=>String(row.va_id)).filter(Boolean))];
    if(!ids.length) return {rows:[] as WorkReadinessQueueRow[],error:null,jobTitle:job?.title||"Role shortlist"};

    const [{data:profiles,error:profileError},{data:setups,error:setupError}]=await Promise.all([
      admin.from("profiles").select("id,full_name,avatar_url").in("id",ids),
      admin.from("va_profiles")
        .select("user_id,work_setup_computer,work_setup_os,work_setup_ram_gb,primary_internet,backup_internet,backup_power,headset_ready,webcam_ready,quiet_workspace,work_setup_submitted_at,work_setup_verified_at,work_setup_verification_notes")
        .in("user_id",ids),
    ]);
    const error=profileError||setupError;
    if(error) return {rows:[] as WorkReadinessQueueRow[],error,jobTitle:job?.title||"Role shortlist"};

    const profileMap=new Map((profiles||[]).map((row:any)=>[String(row.id),row]));
    const setupMap=new Map((setups||[]).map((row:any)=>[String(row.user_id),row]));
    const rows=ids.map((id)=>{
      const setup=setupMap.get(id) as any;
      const profile=profileMap.get(id) as any;
      return {
        user_id:id,
        full_name:profile?.full_name||null,
        avatar_url:profile?.avatar_url||null,
        work_setup_computer:setup?.work_setup_computer||null,
        work_setup_os:setup?.work_setup_os||null,
        work_setup_ram_gb:setup?.work_setup_ram_gb||null,
        primary_internet:setup?.primary_internet||null,
        backup_internet:setup?.backup_internet||null,
        backup_power:setup?.backup_power||null,
        headset_ready:setup?.headset_ready??null,
        webcam_ready:setup?.webcam_ready??null,
        quiet_workspace:setup?.quiet_workspace??null,
        work_setup_submitted_at:setup?.work_setup_submitted_at||null,
        work_setup_verified_at:setup?.work_setup_verified_at||null,
        work_setup_verification_notes:setup?.work_setup_verification_notes||null,
      } satisfies WorkReadinessQueueRow;
    });
    return {rows,error:null,jobTitle:job?.title||"Role shortlist"};
  });
});
