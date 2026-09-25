"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAnyRole, requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeRecruiterActivity } from "@/lib/recruiter-activity";
import { writeAdminAudit } from "@/lib/admin-audit";
import { MIN_HOURLY_RATE } from "@/lib/constants";
import { publicationMissingDetails } from "@/lib/job-publication";

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
  if(job.recruiter_id&&job.recruiter_id!==user.id)redirect(`/workspace/recruiter/roles?error=${encodeURIComponent("This role is assigned to another recruiter.")}`);
  if(job.status!=="pending")throw new Error("Only pending roles can receive standard terms.");
  if(job.service_model==="managed_service")throw new Error("Managed-service pricing is an admin exception and must be reviewed by Admin.");
  if(!job.client_id)throw new Error("Link the client account before preparing service terms.");
  if(existing?.commercial_status)redirect(`/workspace/recruiter/roles/${jobId}`);

  const missing=publicationMissingDetails(job);
  if(missing.length)throw new Error(`Complete the role quality gate first: ${missing.join(", ")}.`);

  const defaultFee=Number(settings?.default_placement_fee||0);
  if(defaultFee<=0)throw new Error("Admin must configure the standard placement fee first.");
  const {count:priorCount}=await admin.from("job_commercials").select("job_id",{count:"exact",head:true}).eq("commercial_status","accepted").in("job_id",(await admin.from("jobs").select("id").eq("client_id",job.client_id)).data?.map((row:any)=>row.id)||[]);
  const fee=priorCount?defaultFee:0;
  const {error}=await admin.from("job_commercials").upsert({job_id:job.id,service_model:"curated_placement",placement_fee:fee,commercial_status:"quoted",notes:fee===0?"First recruiter-led placement fee waived. Client acceptance still required before recruiting begins.":"Standard recruiter-led placement terms."},{onConflict:"job_id"});
  if(error)throw error;

  await admin.from("notifications").insert({user_id:job.client_id,title:"Your hiring request is ready for approval",body:fee===0?`“${job.title}” passed recruiter review. Your first placement fee is waived. Approve the terms to start recruiting.`:`“${job.title}” passed recruiter review. Approve the USD ${fee.toFixed(2)} placement fee to start recruiting.`,href:`/workspace/client/jobs/${job.id}`});
  await writeRecruiterActivity({subjectType:"job",subjectId:job.id,action:"standard_terms_prepared",description:`Recruiter prepared standard curated-placement terms${fee===0?" with first-placement fee waived":` at USD ${fee.toFixed(2)}`}`,actorId:user.id,metadata:{placement_fee:fee}});
  revalidatePath(`/workspace/recruiter/roles/${job.id}`);
  revalidatePath(`/workspace/client/jobs/${job.id}`);
  revalidatePath("/workspace/admin/jobs");
  redirect(`/workspace/recruiter/roles/${job.id}?terms_prepared=1`);
}

export async function sendClientAccountClaimAction(formData: FormData) {
  const { user } = await requireRole("recruiter");
  const jobId = String(formData.get("job_id") || "").trim();
  if (!jobId) throw new Error("Role is required.");

  const admin = createAdminClient();
  const { data: job } = await admin
    .from("jobs")
    .select("id,title,client_id,lead_id,recruiter_id")
    .eq("id", jobId)
    .maybeSingle();

  if (!job) throw new Error("Role not found.");
  if (job.recruiter_id && job.recruiter_id !== user.id) redirect(`/workspace/recruiter/roles?error=${encodeURIComponent("This role is assigned to another recruiter.")}`);
  if (job.client_id) redirect(`/workspace/recruiter/roles/${jobId}?client_already_linked=1`);
  if (!job.lead_id) throw new Error("This role does not have a lead to claim.");

  const { data: lead } = await admin
    .from("lead_intake")
    .select("id,name,email,client_id")
    .eq("id", job.lead_id)
    .maybeSingle();

  if (!lead?.email) throw new Error("The lead does not have an email address.");
  if (lead.client_id) redirect(`/workspace/recruiter/roles/${jobId}?client_already_linked=1`);

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph").replace(/\/$/, "");
  const { sendClaimDraftEmail } = await import("@/lib/email");
  const result = await sendClaimDraftEmail({
    to: lead.email,
    name: lead.name,
    jobTitle: job.title || "Virtual Assistant role",
    leadId: lead.id,
    appUrl,
  });

  if (!result.sent) throw new Error("The client account email could not be sent.");

  await admin.from("lead_intake").update({ nudged_at: new Date().toISOString() }).eq("id", lead.id);
  await writeRecruiterActivity({
    subjectType: "job",
    subjectId: jobId,
    action: "client_account_claim_sent",
    description: "Sent the client a secure account-claim link for this hiring request",
    actorId: user.id,
    metadata: { lead_id: lead.id },
  });

  revalidatePath(`/workspace/recruiter/roles/${jobId}`);
  redirect(`/workspace/recruiter/roles/${jobId}?client_claim_sent=1`);
}



function readinessLines(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(/\r?\n/)
    .map((item) => item.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 30);
}

function readinessCsv(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 30);
}

function readinessReturnPath(role: string, jobId: string, value: FormDataEntryValue | null) {
  const requested = String(value || "").trim();
  const prefix = role === "admin" ? "/workspace/admin/" : "/workspace/recruiter/";
  if (requested.startsWith(prefix) && !requested.startsWith("//")) return requested;
  return role === "admin" ? `/workspace/admin/jobs/${jobId}` : `/workspace/recruiter/roles/${jobId}`;
}


export async function requestClientRoleDetailsAction(formData: FormData) {
  const { user, profile } = await requireAnyRole(["recruiter", "admin"]);
  const jobId = String(formData.get("job_id") || "").trim();
  if (!jobId) throw new Error("Role is required.");

  const returnTo = readinessReturnPath(profile.role, jobId, formData.get("return_to"));
  const admin = createAdminClient();
  const { data: job } = await admin
    .from("jobs")
    .select("id,status,recruiter_id,client_id,title,summary,responsibilities,required_skills,hours_per_week,timezone,min_hourly_rate,start_timing")
    .eq("id", jobId)
    .maybeSingle();

  if (!job) throw new Error("Role not found.");
  if (job.status === "closed") throw new Error("Closed roles do not need a client details request.");
  if (profile.role === "recruiter" && job.recruiter_id && job.recruiter_id !== user.id) {
    redirect(`/workspace/recruiter/roles?error=${encodeURIComponent("This role is assigned to another recruiter.")}`);
  }
  if (!job.client_id) throw new Error("Link the client account before requesting missing details.");

  const missing = publicationMissingDetails(job);
  if (!missing.length) redirect(`${returnTo}?role_details_complete=1#role-readiness`);

  const [{ data: clientProfile }, { data: authUserData, error: authUserError }] = await Promise.all([
    admin
      .from("profiles")
      .select("full_name")
      .eq("id", job.client_id)
      .maybeSingle(),
    admin.auth.admin.getUserById(job.client_id),
  ]);

  const authUser = authUserData?.user || null;
  const clientEmail = String(authUser?.email || "").trim();
  const clientName =
    clientProfile?.full_name ||
    (typeof authUser?.user_metadata?.full_name === "string" ? authUser.user_metadata.full_name : null) ||
    (typeof authUser?.user_metadata?.name === "string" ? authUser.user_metadata.name : null);

  let emailSent = false;
  let emailWarning = false;
  let emailReason: string | null = null;

  if (!authUserError && clientEmail) {
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph").replace(/\/$/, "");
    const { sendRoleDetailsRequestEmail } = await import("@/lib/email");
    const result = await sendRoleDetailsRequestEmail({
      to: clientEmail,
      clientName,
      jobTitle: job.title || "Virtual Assistant role",
      jobId,
      missing,
      appUrl,
    });
    emailSent = result.sent;
    emailReason = result.sent ? null : String(result.reason || "email_unavailable");
    emailWarning = !result.sent;
  } else {
    emailWarning = true;
    emailReason = authUserError ? "client_auth_lookup_failed" : "client_email_missing";
  }

  const { error: notificationError } = await admin.from("notifications").insert({
    user_id: job.client_id,
    title: "Complete your hiring brief",
    body: `Your recruiter needs a few more details for “${job.title || "your Virtual Assistant role"}”: ${missing.join(", ")}.`,
    href: `/workspace/client/jobs/${jobId}?complete=1#role-readiness`,
  });
  if (notificationError) throw notificationError;

  await writeRecruiterActivity({
    subjectType: "job",
    subjectId: jobId,
    action: "role_details_requested",
    description: `Requested missing hiring details from the client: ${missing.join(", ")}`,
    actorId: user.id,
    metadata: {
      missing_fields: missing,
      role: profile.role,
      email_sent: emailSent,
      email_reason: emailReason,
    },
  });

  if (profile.role === "admin") {
    await writeAdminAudit({
      actorId: user.id,
      action: "job_role_details_requested",
      targetType: "job",
      targetId: jobId,
      metadata: { missing_fields: missing },
    });
  }

  revalidatePath(returnTo);
  revalidatePath(`/workspace/client/jobs/${jobId}`);
  const outcome = new URLSearchParams({ role_details_requested: "1" });
  if (emailWarning) outcome.set("role_details_email_warning", "1");
  redirect(`${returnTo}?${outcome.toString()}#role-readiness`);
}

export async function saveRoleReadinessDetailsAction(formData: FormData) {
  const { user, profile } = await requireAnyRole(["recruiter", "admin"]);
  const jobId = String(formData.get("job_id") || "").trim();
  if (!jobId) throw new Error("Role is required.");

  const returnTo = readinessReturnPath(profile.role, jobId, formData.get("return_to"));
  const admin = createAdminClient();
  const { data: job } = await admin
    .from("jobs")
    .select("id,status,slug,recruiter_id,client_id,title,summary,responsibilities,required_skills,hours_per_week,timezone,min_hourly_rate,start_timing")
    .eq("id", jobId)
    .maybeSingle();

  if (!job) redirect(`${returnTo}?role_details_error=${encodeURIComponent("Role not found.")}`);
  if (profile.role === "recruiter" && job.recruiter_id && job.recruiter_id !== user.id) {
    redirect(`/workspace/recruiter/roles?error=${encodeURIComponent("This role is assigned to another recruiter.")}`);
  }

  const patch: Record<string, unknown> = {};
  const changed: string[] = [];

  if (formData.has("title")) {
    const value = String(formData.get("title") || "").trim();
    if (value.length < 3 || value.length > 140) {
      redirect(`${returnTo}?role_details_error=${encodeURIComponent("Enter a valid role title.")}#role-readiness`);
    }
    patch.title = value;
    changed.push("title");
  }

  if (formData.has("summary")) {
    const value = String(formData.get("summary") || "").trim();
    if (value.length < 20 || value.length > 1200) {
      redirect(`${returnTo}?role_details_error=${encodeURIComponent("Role summary must be at least 20 characters.")}#role-readiness`);
    }
    patch.summary = value;
    changed.push("summary");
  }

  if (formData.has("responsibilities")) {
    const value = readinessLines(formData.get("responsibilities"));
    if (!value.length) {
      redirect(`${returnTo}?role_details_error=${encodeURIComponent("Add at least one responsibility.")}#role-readiness`);
    }
    patch.responsibilities = value;
    changed.push("responsibilities");
  }

  if (formData.has("required_skills")) {
    const value = readinessCsv(formData.get("required_skills"));
    if (value.length < 2) {
      redirect(`${returnTo}?role_details_error=${encodeURIComponent("Add at least two required skills.")}#role-readiness`);
    }
    patch.required_skills = value;
    changed.push("skills");
  }

  if (formData.has("hours_per_week")) {
    const value = Number(formData.get("hours_per_week"));
    if (!Number.isInteger(value) || value < 1 || value > 168) {
      redirect(`${returnTo}?role_details_error=${encodeURIComponent("Hours per week must be between 1 and 168.")}#role-readiness`);
    }
    patch.hours_per_week = value;
    changed.push("hours");
  }

  if (formData.has("timezone")) {
    const value = String(formData.get("timezone") || "").trim();
    if (!value || value.length > 100) {
      redirect(`${returnTo}?role_details_error=${encodeURIComponent("Enter the client timezone or working region.")}#role-readiness`);
    }
    patch.timezone = value;
    changed.push("timezone");
  }

  if (formData.has("min_hourly_rate")) {
    const value = Number(formData.get("min_hourly_rate"));
    if (!Number.isFinite(value) || value < MIN_HOURLY_RATE) {
      redirect(`${returnTo}?role_details_error=${encodeURIComponent(`VA budget must be at least USD ${MIN_HOURLY_RATE}/hour.`)}#role-readiness`);
    }
    patch.min_hourly_rate = value;
    changed.push("budget");
  }

  if (formData.has("start_timing")) {
    const value = String(formData.get("start_timing") || "").trim();
    if (!value || value.length > 100) {
      redirect(`${returnTo}?role_details_error=${encodeURIComponent("Enter the client's confirmed preferred start.")}#role-readiness`);
    }
    patch.start_timing = value;
    changed.push("start timing");
  }

  if (!changed.length) {
    redirect(`${returnTo}?role_details_error=${encodeURIComponent("No missing role details were submitted.")}#role-readiness`);
  }

  const candidate = { ...job, ...patch };
  const stillMissing = publicationMissingDetails(candidate);
  if (stillMissing.length) {
    redirect(`${returnTo}?role_details_error=${encodeURIComponent(`Still missing: ${stillMissing.join(", ")}.`)}#role-readiness`);
  }

  const { error } = await admin.from("jobs").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", jobId);
  if (error) throw error;

  const description = `Completed role readiness: ${changed.join(", ")}`;
  await writeRecruiterActivity({
    subjectType: "job",
    subjectId: jobId,
    action: "role_readiness_completed",
    description,
    actorId: user.id,
    metadata: { changed_fields: changed, role: profile.role },
  });

  if (profile.role === "admin") {
    await writeAdminAudit({
      actorId: user.id,
      action: "job_role_readiness_completed",
      targetType: "job",
      targetId: jobId,
      metadata: { changed_fields: changed },
    });
  }

  revalidatePath(returnTo);
  revalidatePath(`/workspace/recruiter/roles/${jobId}`);
  revalidatePath(`/workspace/admin/jobs/${jobId}`);
  revalidatePath(`/workspace/client/jobs/${jobId}`);
  if (job.status === "published") {
    revalidatePath("/jobs");
    if (job.slug) revalidatePath(`/jobs/${job.slug}`);
  }

  redirect(`${returnTo}?role_details_saved=1#role-readiness`);
}
