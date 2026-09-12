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
import { ensureAcceptedLeadClientWorkspace } from "@/lib/client-handoff";

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

export async function respondToLeadProposalAction(formData: FormData) {
  const token = String(formData.get("token") || "").trim();
  const decision = String(formData.get("decision") || "").trim();
  const reason = String(formData.get("reason") || "").trim().slice(0, 2000);
  if (!token || !["changes", "decline"].includes(decision) || reason.length < 5) {
    redirect(`/proposal/${encodeURIComponent(token)}?error=${encodeURIComponent("Tell us what should change, or why you are declining.")}`);
  }

  const admin = createAdminClient();
  const { data: proposal } = await admin.from("lead_proposals").select("*").eq("public_token", token).maybeSingle();
  if (!proposal) redirect("/proposal/not-found");
  if (proposal.status !== "sent") {
    redirect(`/proposal/${token}?error=${encodeURIComponent("This proposal is no longer waiting for a response.")}`);
  }
  if (proposal.expires_at && new Date(proposal.expires_at).getTime() < Date.now()) {
    await admin.from("lead_proposals").update({ status: "expired", updated_at: new Date().toISOString() }).eq("id", proposal.id);
    redirect(`/proposal/${token}?error=${encodeURIComponent("This proposal has expired. Please contact your recruiter for an updated version.")}`);
  }

  const { data: lead } = await admin.from("lead_intake").select("id,name,email,owner_id,crm_stage").eq("id", proposal.lead_id).maybeSingle();
  if (!lead) redirect(`/proposal/${token}?error=${encodeURIComponent("The linked hiring request could not be found.")}`);

  const now = new Date();
  const askingForChanges = decision === "changes";
  await admin.from("lead_proposals").update({
    status: askingForChanges ? "changes_requested" : "declined",
    changes_requested_at: askingForChanges ? now.toISOString() : null,
    declined_at: askingForChanges ? null : now.toISOString(),
    decline_reason: reason,
    updated_at: now.toISOString()
  }).eq("id", proposal.id);

  await admin.from("lead_intake").update({
    crm_stage: askingForChanges ? "qualified" : "lost",
    status: askingForChanges ? "converted" : "archived",
    next_follow_up_at: askingForChanges ? now.toISOString() : null,
    stage_updated_at: now.toISOString(),
    lost_at: askingForChanges ? null : now.toISOString(),
    lost_reason: askingForChanges ? null : reason
  }).eq("id", lead.id);

  await writeRecruiterActivity({
    subjectType: "lead",
    subjectId: lead.id,
    action: askingForChanges ? "proposal_changes_requested" : "proposal_declined",
    description: askingForChanges ? `Client requested proposal changes: ${reason}` : `Client declined proposal: ${reason}`,
    metadata: { proposal_id: proposal.id, reason }
  });

  let recipients: string[] = [];
  if (lead.owner_id) {
    recipients = [lead.owner_id];
  } else {
    const { data: staff } = await admin.from("profiles").select("id").in("role", ["recruiter", "admin"]).eq("account_status", "active");
    recipients = (staff || []).map((row: any) => row.id);
  }
  if (recipients.length) {
    await admin.from("notifications").insert(recipients.map((userId) => ({
      user_id: userId,
      title: askingForChanges ? `Proposal changes requested: ${proposal.role_title}` : `Proposal declined: ${proposal.role_title}`,
      body: reason,
      href: "/workspace/recruiter/leads?view=qualified"
    })));
  }

  for (const userId of recipients.slice(0, 10)) {
    try {
      const { data } = await admin.auth.admin.getUserById(userId);
      await sendTransactionalEventEmail({
        to: data.user?.email,
        subject: askingForChanges ? `Proposal changes requested: ${proposal.role_title}` : `Proposal declined: ${proposal.role_title}`,
        heading: askingForChanges ? "Client wants changes" : "Client declined the proposal",
        body: reason,
        href: `${process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph"}/workspace/recruiter/leads?view=qualified`,
        hrefLabel: "Open sales CRM"
      });
    } catch {}
  }

  revalidatePath("/workspace/recruiter");
  revalidatePath("/workspace/recruiter/leads");
  redirect(`/proposal/${token}?${askingForChanges ? "changes_requested=1" : "declined=1"}`);
}

type AtomicAcceptanceResult = {
  ok?: boolean;
  code?: string;
  already_accepted?: boolean;
  job_id?: string | null;
  client_id?: string | null;
};

function acceptanceErrorMessage(code?: string) {
  switch (code) {
    case "proposal_expired": return "This proposal has expired. Please contact your recruiter for an updated version.";
    case "proposal_unavailable": return "This proposal is no longer available for acceptance.";
    case "lead_already_accepted": return "A proposal for this hiring request has already been accepted. Please contact your recruiter if you need changes.";
    case "existing_client_unverified":
    case "client_identity_invalid":
    case "job_client_conflict": return "We could not safely verify the client account linked to this hiring request. Please contact your recruiter before accepting.";
    case "job_lead_conflict": return "This proposal is linked to a different hiring request than expected. Please contact your recruiter before accepting.";
    default: return "We could not complete the acceptance safely. Nothing was partially accepted. Please try again or contact your recruiter.";
  }
}

export async function acceptLeadProposalAction(formData: FormData) {
  const token = String(formData.get("token") || "").trim();
  const acceptanceName = String(formData.get("acceptance_name") || "").trim().slice(0, 160);
  if (!token || acceptanceName.length < 2 || formData.get("fee_ack") !== "on") {
    redirect(`/proposal/${encodeURIComponent(token)}?error=${encodeURIComponent("Enter your name and confirm the proposal terms.")}`);
  }

  const admin = createAdminClient();
  const { data: proposal, error: proposalError } = await admin.from("lead_proposals")
    .select("*")
    .eq("public_token", token)
    .maybeSingle();
  if (proposalError || !proposal) redirect("/proposal/not-found");
  if (proposal.status === "accepted") redirect(`/proposal/${token}?accepted=1`);
  if (proposal.status !== "sent") redirect(`/proposal/${token}?error=${encodeURIComponent("This proposal is no longer available for acceptance.")}`);
  if (proposal.expires_at && new Date(proposal.expires_at).getTime() < Date.now()) {
    await admin.from("lead_proposals").update({ status: "expired", updated_at: new Date().toISOString() }).eq("id", proposal.id).eq("status", "sent");
    redirect(`/proposal/${token}?error=${encodeURIComponent("This proposal has expired. Please contact your recruiter for an updated version.")}`);
  }

  const { data: lead, error: leadError } = await admin.from("lead_intake").select("*").eq("id", proposal.lead_id).maybeSingle();
  if (leadError || !lead) redirect(`/proposal/${token}?error=${encodeURIComponent("The hiring request linked to this proposal could not be found.")}`);

  const referencedJobId = String(proposal.job_id || lead.job_id || "");
  let job: any = null;
  if (referencedJobId) {
    const { data, error } = await admin.from("jobs").select("*").eq("id", referencedJobId).maybeSingle();
    if (error) redirect(`/proposal/${token}?error=${encodeURIComponent("The linked hiring request could not be verified. Please contact your recruiter.")}`);
    job = data;
  }

  const jobId = referencedJobId || crypto.randomUUID();
  const existingClientId = job?.client_id || lead.client_id || null;
  const slug = job?.slug || await uniqueJobSlug(admin, proposal.role_title);
  const description = cleanJobDescription(proposal.summary || lead.message);
  const fallbackSummary = `Virtual Assistant support requested for ${proposal.role_title || lead.service || "business operations"}.`;
  const jobPayload = {
    title: proposal.role_title,
    slug,
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
    start_timing: proposal.start_timing || lead.start_time || null
  };

  const handoff = await ensureAcceptedLeadClientWorkspace({
    lead,
    jobId,
    existingClientId
  });

  if (!handoff.linked && handoff.blocking) {
    const message = handoff.reason === "identity_mismatch"
      ? "The email on this proposal does not match the client account already linked to the hiring request. Please contact your recruiter so we can verify ownership before acceptance."
      : handoff.reason === "role_conflict"
        ? "The email on this proposal belongs to a non-client account. Please contact your recruiter so we can verify the correct client account before acceptance."
        : "We could not safely verify the existing client account for this hiring request. Please contact your recruiter before accepting.";
    redirect(`/proposal/${token}?error=${encodeURIComponent(message)}`);
  }

  const resolvedClientId = handoff.linked ? handoff.userId : null;
  const { data: acceptanceData, error: acceptanceError } = await admin.rpc("accept_lead_proposal_atomic", {
    p_token: token,
    p_acceptance_name: acceptanceName,
    p_client_id: resolvedClientId,
    p_job_id: jobId,
    p_job_payload: jobPayload
  });

  if (acceptanceError) {
    redirect(`/proposal/${token}?error=${encodeURIComponent("We could not complete the acceptance safely. No partial hiring state was saved. Please try again or contact your recruiter.")}`);
  }

  const acceptance = (acceptanceData || {}) as AtomicAcceptanceResult;
  if (!acceptance.ok) {
    redirect(`/proposal/${token}?error=${encodeURIComponent(acceptanceErrorMessage(acceptance.code))}`);
  }
  if (acceptance.already_accepted) redirect(`/proposal/${token}?accepted=1`);

  const acceptedJobId = String(acceptance.job_id || jobId);
  const clientId = acceptance.client_id ? String(acceptance.client_id) : null;

  if (clientId && handoff.linked) {
    try {
      const { claimClientHiringRequests } = await import("@/lib/lead-claims");
      await claimClientHiringRequests({ userId: clientId, email: handoff.email });
    } catch {
      // Related older requests are a convenience. The accepted proposal itself
      // is already committed by the atomic database transaction.
    }
  }

  if (clientId) {
    try {
      const { data: publishedJob } = await admin.from("jobs")
        .select("id,client_id,title,categories,required_skills,required_tools,hours_per_week,overlap_hours")
        .eq("id", acceptedJobId)
        .single();
      if (publishedJob) {
        const { autoReleaseTopMatches } = await import("@/lib/auto-matching");
        await autoReleaseTopMatches(publishedJob);
      }
    } catch {
      // Matching is post-commit automation and must never roll back acceptance.
    }
  }

  try {
    const safeActionLink = handoff.linked && acceptedJobId === jobId ? handoff.actionLink : null;
    await sendTransactionalEventEmail({
      to: lead.email,
      subject: `Proposal accepted: ${proposal.role_title}`,
      heading: handoff.linked ? "Your client workspace is ready" : "Your hiring request is confirmed",
      body: handoff.linked
        ? "Your proposal is accepted, the role is active, and our recruiting team can begin preparing your shortlist. Use the secure link below to open your client workspace."
        : "Your proposal is accepted. Our recruiting team has the request and will follow up if your account still needs to be connected manually.",
      href: safeActionLink || (clientId ? `${process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph"}/workspace/client/jobs/${acceptedJobId}` : undefined),
      hrefLabel: handoff.linked ? "Open client workspace" : undefined
    });
  } catch {
    // Email is post-commit. A delivery failure must not create partial hiring state.
  }

  revalidatePath("/workspace/recruiter");
  revalidatePath("/workspace/recruiter/leads");
  revalidatePath("/workspace/admin/leads");
  if (clientId) {
    revalidatePath("/workspace/client");
    revalidatePath("/workspace/client/jobs");
    revalidatePath(`/workspace/client/jobs/${acceptedJobId}`);
  }
  redirect(`/proposal/${token}?accepted=1`);
}
