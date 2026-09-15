"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeRecruiterActivity } from "@/lib/recruiter-activity";

export async function prepareStandardPlacementTermsAction(formData:FormData){
  const {user}=await requireRole("recruiter");
  const jobId=String(formData.get("job_id")||"");
  if(!jobId)throw new Error("Role is required.");
  const admin=createAdminClient();
  const [{data:job},{data:settings},{data:existing}]=await Promise.all([
    admin.from("jobs").select("*").eq("id",jobId).single(),
    admin.from("admin_settings").select("default_placement_fee").eq("id",1).maybeSingle(),
    admin.from("job_commercials").select("job_id,commercial_status").eq("job_id",jobId).maybeSingle()
  ]);
  if(!job)throw new Error("Role not found.");
  if(job.recruiter_id&&job.recruiter_id!==user.id)throw new Error("This role is assigned to another recruiter.");
  if(job.status!=="pending")throw new Error("Only pending roles can receive standard terms.");
  if(job.service_model==="managed_service")throw new Error("Managed-service pricing is an admin exception and must be reviewed by Admin.");
  if(!job.client_id)throw new Error("Link the client account before preparing service terms.");
  if(existing?.commercial_status)redirect(`/workspace/recruiter/matching/${jobId}`);

  const missing:string[]=[];
  if(!job.title||String(job.title).trim().length<3)missing.push("role title");
  if(!job.summary||String(job.summary).trim().length<20)missing.push("role outcome / summary");
  if(!Array.isArray(job.responsibilities)||!job.responsibilities.length)missing.push("responsibilities");
  if(!Array.isArray(job.required_skills)||job.required_skills.length<2)missing.push("at least 2 required skills");
  if(!job.hours_per_week)missing.push("weekly hours");
  if(!job.timezone)missing.push("client timezone / working region");
  if(job.min_hourly_rate==null)missing.push("VA budget");
  if(!job.start_timing)missing.push("start timing");
  if(missing.length)throw new Error(`Complete the role quality gate first: ${missing.join(", ")}.`);

  const defaultFee=Number(settings?.default_placement_fee||0);
  if(defaultFee<=0)throw new Error("Admin must configure the standard placement fee first.");
  const {count:priorCount}=await admin.from("job_commercials").select("job_id",{count:"exact",head:true}).eq("commercial_status","accepted").in("job_id",(await admin.from("jobs").select("id").eq("client_id",job.client_id)).data?.map((row:any)=>row.id)||[]);
  const fee=priorCount?defaultFee:0;
  const {error}=await admin.from("job_commercials").upsert({job_id:job.id,service_model:"curated_placement",placement_fee:fee,commercial_status:"quoted",notes:fee===0?"First recruiter-led placement fee waived. Client acceptance still required before recruiting begins.":"Standard recruiter-led placement terms."},{onConflict:"job_id"});
  if(error)throw error;

  await admin.from("notifications").insert({user_id:job.client_id,title:"Your hiring request is ready for approval",body:fee===0?`“${job.title}” passed recruiter review. Your first placement fee is waived. Approve the terms to start recruiting.`:`“${job.title}” passed recruiter review. Approve the USD ${fee.toFixed(2)} placement fee to start recruiting.`,href:`/workspace/client/jobs/${job.id}`});
  await writeRecruiterActivity({subjectType:"job",subjectId:job.id,action:"standard_terms_prepared",description:`Recruiter prepared standard curated-placement terms${fee===0?" with first-placement fee waived":` at USD ${fee.toFixed(2)}`}`,actorId:user.id,metadata:{placement_fee:fee}});
  revalidatePath(`/workspace/recruiter/matching/${job.id}`);
  revalidatePath(`/workspace/client/jobs/${job.id}`);
  revalidatePath("/workspace/admin/jobs");
  redirect(`/workspace/recruiter/matching/${job.id}?terms_prepared=1`);
}
