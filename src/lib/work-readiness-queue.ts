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
