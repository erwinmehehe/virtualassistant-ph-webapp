"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAnyRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { cleanJobDescription, cleanJobSummary } from "@/lib/job-content-cleanup";
import { inferCategories, inferHours } from "@/lib/category-inference";
import { MIN_HOURLY_RATE } from "@/lib/constants";
import { slugifyJobTitle } from "@/lib/public-routing";
import { proposalAgencyValue, proposalClientMonthlyTotal } from "@/lib/proposals";
import { writeRecruiterActivity } from "@/lib/recruiter-activity";
import { sendLeadProposalEmail, sendTransactionalEventEmail } from "@/lib/email";

function safePath(value: FormDataEntryValue | null, fallback: string) {
  const path = String(value || "");
  return path.startsWith("/") && !path.startsWith("//") ? path : fallback;
}

function numberValue(value: FormDataEntryValue | null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

async function uniqueJobSlug(admin: ReturnType<typeof createAdminClient>, title: string) {
  const base = slugifyJobTitle(title);
  for (let i = 0; i < 30; i += 1) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`;
    const { data } = await admin.from("jobs").select("id").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
  }
  return `${base}-${crypto.randomUUID().slice(0, 6)}`;
}

export async function createAndSendProposalAction(formData: FormData) {
  const { user, profile } = await requireAnyRole(["recruiter", "admin"]);
  const leadId = String(formData.get("lead_id") || "").trim();
  const returnTo = safePath(formData.get("return_to"), "/workspace/recruiter/leads?view=qualified");
  const roleTitle = String(formData.get("role_title") || "").trim().slice(0, 160);
  const summary = String(formData.get("summary") || "").trim().slice(0, 5000);
  const serviceModel = String(formData.get("service_model") || "curated_placement") === "managed_service" ? "managed_service" : "curated_placement";
  const hoursPerWeek = numberValue(formData.get("hours_per_week"));
  const rateMin = numberValue(formData.get("va_rate_min"));
  const rateMax = numberValue(formData.get("va_rate_max"));
  const placementFee = numberValue(formData.get("placement_fee"));
  const markup = numberValue(formData.get("managed_markup_percent"));
  const startTiming = String(formData.get("start_timing") || "").trim().slice(0, 200);
  const expiresDays = Math.max(3, Math.min(30, Number(formData.get("expires_days") || 7)));

  const fail = (message: string) => redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}proposal_error=${encodeURIComponent(message)}`);
  if (!leadId || roleTitle.length < 3) return fail("Add a clear role title.");
  if (!hoursPerWeek || hoursPerWeek < 1 || hoursPerWeek > 80) return fail("Set weekly hours between 1 and 80.");
  if (!rateMin || rateMin < MIN_HOURLY_RATE) return fail(`Set Virtual Assistant pay to at least USD ${MIN_HOURLY_RATE}/hour.`);
  if (rateMax != null && rateMax < rateMin) return fail("Maximum VA rate must be at least the minimum rate.");
  if (serviceModel === "curated_placement" && (!placementFee || placementFee <= 0)) return fail("Set the placement fee.");
  if (serviceModel === "managed_service" && (!markup || markup <= 0)) return fail("Set the managed-service margin.");

  const admin = createAdminClient();
  const { data: lead } = await admin.from("lead_intake")
    .select("id,name,email,company,service,message,hours,start_time,timezone,client_id,job_id,owner_id")
    .eq("id", leadId)
    .maybeSingle();
  if (!lead?.email) return fail("This lead does not have a valid email address.");

  const rateForEstimate = rateMax || rateMin;
  const monthlyTotal = proposalClientMonthlyTotal({
    hoursPerWeek,
    vaRate: rateForEstimate,
    serviceModel,
    managedMarkupPercent: markup
  });
  const agencyValue = proposalAgencyValue({
    hoursPerWeek,
    vaRate: rateForEstimate,
    serviceModel,
    placementFee,
    managedMarkupPercent: markup
  });
  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiresDays * 86400000);

  const { data: proposal, error } = await admin.from("lead_proposals").insert({
    lead_id: leadId,
    status: "draft",
    role_title: roleTitle,
    summary: summary || lead.message || null,
    service_model: serviceModel,
    hours_per_week: hoursPerWeek,
    va_rate_min: rateMin,
    va_rate_max: rateMax,
    placement_fee: serviceModel === "curated_placement" ? placementFee : null,
    managed_markup_percent: serviceModel === "managed_service" ? markup : null,
    estimated_monthly_total: monthlyTotal || null,
    start_timing: startTiming || lead.start_time || null,
    expires_at: expiresAt.toISOString(),
    job_id: lead.job_id || null,
    created_by: user.id
  }).select("id,public_token").single();
  if (error || !proposal) return fail(error?.message || "Could not create the proposal.");

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph").replace(/\/$/, "");
  const proposalUrl = `${appUrl}/proposal/${proposal.public_token}`;
  const expiresLabel = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeZone: "Asia/Manila" }).format(expiresAt);
  const emailResult = await sendLeadProposalEmail({
    to: lead.email,
    clientName: lead.name,
    roleTitle,
    proposalUrl,
    expiresLabel,
    recruiterName: profile.full_name
  });

  if (!emailResult.sent) {
    return fail("The proposal was saved as a draft, but the email could not be sent. The previous live proposal, if any, was left unchanged.");
  }

  await admin.from("lead_proposals")
    .update({ status: "expired", updated_at: now.toISOString() })
    .eq("lead_id", leadId)
    .eq("status", "sent");

  await admin.from("lead_proposals").update({
    status: "sent",
    sent_at: now.toISOString(),
    updated_at: now.toISOString()
  }).eq("id", proposal.id);

  await admin.from("lead_intake").update({
    crm_stage: "shortlist_sent",
    status: "converted",
    owner_id: lead.owner_id || user.id,
    estimated_value_usd: agencyValue || null,
    next_follow_up_at: new Date(now.getTime() + 2 * 86400000).toISOString(),
    stage_updated_at: now.toISOString()
  }).eq("id", leadId);

  await writeRecruiterActivity({
    subjectType: "lead",
    subjectId: leadId,
    action: "proposal_sent",
    description: `Proposal sent for ${roleTitle}`,
    actorId: user.id,
    metadata: {
      proposal_id: proposal.id,
      service_model: serviceModel,
      estimated_monthly_total: monthlyTotal,
      estimated_agency_value: agencyValue,
      expires_at: expiresAt.toISOString()
    }
  });

  revalidatePath("/workspace/recruiter");
  revalidatePath("/workspace/recruiter/leads");
  revalidatePath("/workspace/admin/leads");
  redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}proposal_sent=1`);
}

export async function acceptLeadProposalAction(formData: FormData) {
  const token = String(formData.get("token") || "").trim();
  const acceptanceName = String(formData.get("acceptance_name") || "").trim().slice(0, 160);
  if (!token || acceptanceName.length < 2 || formData.get("fee_ack") !== "on") {
    redirect(`/proposal/${encodeURIComponent(token)}?error=${encodeURIComponent("Enter your name and confirm the proposal terms.")}`);
  }

  const admin = createAdminClient();
  const { data: proposal } = await admin.from("lead_proposals")
    .select("*")
    .eq("public_token", token)
    .maybeSingle();
  if (!proposal) redirect("/proposal/not-found");
  if (proposal.status === "accepted") redirect(`/proposal/${token}?accepted=1`);
  if (proposal.status !== "sent") redirect(`/proposal/${token}?error=${encodeURIComponent("This proposal is no longer available for acceptance.")}`);
  if (proposal.expires_at && new Date(proposal.expires_at).getTime() < Date.now()) {
    await admin.from("lead_proposals").update({ status: "expired", updated_at: new Date().toISOString() }).eq("id", proposal.id);
    redirect(`/proposal/${token}?error=${encodeURIComponent("This proposal has expired. Please contact your recruiter for an updated version.")}`);
  }

  const { data: lead } = await admin.from("lead_intake").select("*").eq("id", proposal.lead_id).maybeSingle();
  if (!lead) redirect(`/proposal/${token}?error=${encodeURIComponent("The hiring request linked to this proposal could not be found.")}`);

  const now = new Date().toISOString();
  let jobId = String(proposal.job_id || lead.job_id || "");
  let clientId = lead.client_id || null;
  let job: any = null;

  if (jobId) {
    const { data } = await admin.from("jobs").select("*").eq("id", jobId).maybeSingle();
    job = data;
    clientId = job?.client_id || clientId;
  }

  const description = cleanJobDescription(proposal.summary || lead.message);
  const fallbackSummary = `Virtual Assistant support requested for ${proposal.role_title || lead.service || "business operations"}.`;
  const jobPayload = {
    client_id: clientId,
    lead_id: lead.id,
    title: proposal.role_title,
    company_name: lead.company || null,
    summary: cleanJobSummary(proposal.summary || lead.message, fallbackSummary),
    description,
    responsibilities: description ? [description] : [],
    categories: inferCategories(lead.service, proposal.summary || lead.message),
    hours_per_week: proposal.hours_per_week || inferHours(lead.hours),
    min_hourly_rate: proposal.va_rate_min || MIN_HOURLY_RATE,
    max_hourly_rate: proposal.va_rate_max || null,
    timezone: lead.timezone || null,
    overlap_hours: 4,
    live_coverage_exception: /reception|dispatch|cold call|outbound|front desk/i.test(`${lead.service || ""} ${lead.message || ""}`),
    onboarding_plan: "Client onboarding and tool access to be confirmed before placement.",
    direct_feedback: true,
    engagement_length: "Long-term preferred",
    start_timing: proposal.start_timing || lead.start_time || null,
    service_model: proposal.service_model,
    status: clientId ? "published" : "pending",
    published_at: clientId ? now : null
  };

  if (jobId && job) {
    const { error } = await admin.from("jobs").update(jobPayload).eq("id", jobId);
    if (error) redirect(`/proposal/${token}?error=${encodeURIComponent("The proposal was accepted but the hiring request could not be updated. Your recruiter has been notified.")}`);
  } else {
    const slug = await uniqueJobSlug(admin, proposal.role_title);
    const { data: createdJob, error } = await admin.from("jobs").insert({ ...jobPayload, slug }).select("id").single();
    if (error || !createdJob) redirect(`/proposal/${token}?error=${encodeURIComponent("The proposal was accepted but the hiring request could not be created. Your recruiter has been notified.")}`);
    jobId = createdJob.id;
  }

  await admin.from("job_commercials").upsert({
    job_id: jobId,
    service_model: proposal.service_model,
    placement_fee: proposal.service_model === "curated_placement" ? proposal.placement_fee : null,
    managed_markup_percent: proposal.service_model === "managed_service" ? proposal.managed_markup_percent : null,
    commercial_status: "accepted"
  }, { onConflict: "job_id" });

  if (clientId) {
    await admin.from("job_candidate_access").upsert({
      job_id: jobId,
      access_status: "comped",
      access_fee: 0,
      currency: "USD",
      unlocked_at: now
    }, { onConflict: "job_id" });
  }

  await admin.from("lead_proposals").update({
    status: "accepted",
    accepted_at: now,
    acceptance_name: acceptanceName,
    job_id: jobId,
    updated_at: now
  }).eq("id", proposal.id);

  await admin.from("lead_intake").update({
    crm_stage: "won",
    status: "converted",
    job_id: jobId,
    won_at: now,
    lost_at: null,
    lost_reason: null,
    next_follow_up_at: null,
    stage_updated_at: now
  }).eq("id", lead.id);

  await writeRecruiterActivity({
    subjectType: "lead",
    subjectId: lead.id,
    action: "proposal_accepted",
    description: `Proposal accepted by ${acceptanceName}`,
    metadata: { proposal_id: proposal.id, job_id: jobId, client_id: clientId }
  });

  await admin.from("analytics_events").insert({
    event_name: "lead_won",
    path: "/proposal",
    session_id: lead.session_id || null,
    metadata: { lead_id: lead.id, proposal_id: proposal.id, job_id: jobId, estimated_value_usd: lead.estimated_value_usd || null }
  });

  if (clientId) {
    try {
      const { data: publishedJob } = await admin.from("jobs").select("id,client_id,title,categories,required_skills,required_tools,hours_per_week,overlap_hours").eq("id", jobId).single();
      if (publishedJob) {
        const { autoReleaseTopMatches } = await import("@/lib/auto-matching");
        await autoReleaseTopMatches(publishedJob);
      }
    } catch {}
  }

  try {
    await sendTransactionalEventEmail({
      to: lead.email,
      subject: `Proposal accepted: ${proposal.role_title}`,
      heading: "Your hiring request is confirmed",
      body: clientId
        ? "Your proposal is accepted and your hiring request is now active. Our recruiting team can begin preparing your shortlist."
        : "Your proposal is accepted. Your recruiter will connect this request to your client workspace and begin the next hiring step.",
      href: clientId ? `${process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph"}/workspace/client/jobs/${jobId}` : undefined,
      hrefLabel: clientId ? "View hiring progress" : undefined
    });
  } catch {}

  revalidatePath("/workspace/recruiter");
  revalidatePath("/workspace/recruiter/leads");
  revalidatePath("/workspace/admin/leads");
  if (clientId) {
    revalidatePath("/workspace/client");
    revalidatePath("/workspace/client/jobs");
    revalidatePath(`/workspace/client/jobs/${jobId}`);
  }
  redirect(`/proposal/${token}?accepted=1`);
}
