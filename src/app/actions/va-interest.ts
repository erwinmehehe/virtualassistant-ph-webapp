"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { matchScore } from "@/lib/matching";
import { recordProductEvent } from "@/lib/product-events";
import { writeRecruiterActivity } from "@/lib/recruiter-activity";

function snapshot(profile:any,va:any,vettingStage?:string|null){return{full_name:profile?.full_name,headline:va.headline,primary_category:va.primary_category,categories:va.categories,skills:va.skills,tools:va.tools,industries:va.industries,languages:va.languages,years_experience:va.years_experience,bio:va.bio,weekly_hours:va.weekly_hours,schedule:va.schedule,overlap_hours:va.overlap_hours,hourly_rate:va.hourly_rate,availability_status:va.availability_status,slug:va.slug,vetting_stage:vettingStage};}

export async function expressInterestAction(formData:FormData){
  const {user,profile}=await requireRole("va");
  const jobId=String(formData.get("job_id")||"");
  const note=String(formData.get("cover_note")||"").trim();
  if(note.length<20)throw new Error("Add a short note explaining the experience most relevant to this role.");
  const supabase=await createClient();
  const admin=createAdminClient();
  const [{data:va},{data:job},{data:vetting},{data:existing}]=await Promise.all([
    supabase.from("va_profiles").select("*").eq("user_id",user.id).single(),
    admin.from("jobs").select("*").eq("id",jobId).eq("status","published").eq("moderation_status","clear").not("client_id","is",null).single(),
    admin.from("va_vetting").select("stage").eq("va_id",user.id).single(),
    admin.from("applications").select("id,status").eq("job_id",jobId).eq("va_id",user.id).maybeSingle()
  ]);
  if(!va||!job)throw new Error("Role or VA profile was not found.");
  if(!vetting||!["approved","bench"].includes(vetting.stage))throw new Error("Complete recruiter vetting before expressing interest in client roles.");
  if(existing)redirect("/workspace/va/applications?interest=already");

  const score=matchScore(job,va);
  const {data:application,error}=await admin.from("applications").insert({job_id:jobId,va_id:user.id,status:"new",cover_note:note,match_score:score,profile_snapshot:snapshot(profile,va,vetting.stage)}).select("id").single();
  if(error)throw error;
  await admin.from("application_status_history").insert({application_id:application.id,from_status:null,to_status:"new",changed_by:user.id,note:"VA expressed interest for recruiter review"});
  await recordProductEvent("va_interest_submitted",{userId:user.id,path:`/jobs/${jobId}`,metadata:{job_id:jobId,application_id:application.id}});
  await writeRecruiterActivity({subjectType:"job",subjectId:jobId,action:"va_interest_submitted",description:"A vetted VA expressed interest and is waiting for recruiter review",actorId:user.id,metadata:{va_id:user.id,application_id:application.id,match_score:score}});

  const recruiterIds=job.recruiter_id
    ? [job.recruiter_id]
    : (await admin.from("profiles").select("id").eq("role","recruiter").eq("account_status","active")).data?.map((row:any)=>row.id)||[];
  if(recruiterIds.length)await admin.from("notifications").insert(recruiterIds.map((id:string)=>({user_id:id,title:`VA interest: ${job.title}`,body:"A vetted VA expressed interest. Review the VA inside the recruiter matching workspace before deciding whether to present them to the client.",href:`/workspace/recruiter/matching/${jobId}`,type:"matching",priority:"normal"})));

  revalidatePath("/workspace/va/applications");
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath(`/workspace/recruiter/matching/${jobId}`);
  redirect("/workspace/va/applications?interest=1");
}
