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
import { sendTransactionalEventEmail } from "@/lib/email";
import { ensureAcceptedLeadClientWorkspace } from "@/lib/client-handoff";
import { isValidTimeZone, zonedDateTimeToUtc } from "@/lib/timezone";

function safePath(value: FormDataEntryValue | null, fallback: string) {
  const path = String(value || "");
  return path.startsWith("/") && !path.startsWith("//") ? path : fallback;
}

function localDateKey(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value || "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function addDaysToDateKey(value: string, days: number) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const next = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]) + days));
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-${pad(next.getUTCDate())}`;
}

function followUpAtClientNine(dateKey: string | null, timeZone: string) {
  if (!dateKey) return null;
  return zonedDateTimeToUtc(`${dateKey}T09:00`, timeZone)?.toISOString() || null;
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

function listText(value: FormDataEntryValue | null, limit = 20) {
  return [...new Set(
    String(value || "")
      .split(/[,;\n]/)
      .map((item) => item.trim())
      .filter(Boolean),
  )].slice(0, limit);
}

function proposalReturnPath(leadId: string, suffix = "") {
  return `/workspace/recruiter/crm/${encodeURIComponent(leadId)}/proposal${suffix}`;
}

function proposalEditorFields(formData: FormData) {
  const salaryCurrency = String(formData.get("salary_currency") || "PHP").trim().toUpperCase();
  return {
    roleTitle: String(formData.get("role_title") || "").trim().slice(0, 160),
    summary: String(formData.get("summary") || "").trim().slice(0, 5000),
    responsibilities: listText(formData.get("responsibilities"), 16),
    requiredSkills: listText(formData.get("required_skills"), 20),
    requiredTools: listText(formData.get("required_tools"), 20),
    hoursPerWeek: numberValue(formData.get("hours_per_week")),
    salaryMin: numberValue(formData.get("salary_min")),
    salaryMax: numberValue(formData.get("salary_max")),
    salaryCurrency: ["PHP", "AUD", "USD"].includes(salaryCurrency) ? salaryCurrency : "PHP",
    serviceModel: String(formData.get("service_model") || "curated_placement") === "managed_service" ? "managed_service" : "curated_placement",
    placementFee: numberValue(formData.get("placement_fee")),
    managedMarkupPercent: numberValue(formData.get("managed_markup_percent")),
    commercialNote: String(formData.get("commercial_note") || "").trim().slice(0, 1000),
    recommendedStartDate: String(formData.get("recommended_start_date") || "").trim().slice(0, 20) || null,
    expiresDays: Math.max(3, Math.min(30, Number(formData.get("expires_days") || 7))),
  };
}

function validateProposalEditorFields(fields: ReturnType<typeof proposalEditorFields>, sending = false) {
  if (fields.roleTitle.length < 3) return "Add a clear recommended role.";
  if (!fields.summary) return "Add a short client-facing recommendation summary.";
  if (!fields.hoursPerWeek || fields.hoursPerWeek < 1 || fields.hoursPerWeek > 80) return "Set weekly hours between 1 and 80.";
  if (fields.salaryMin != null && fields.salaryMin < 0) return "Salary minimum cannot be negative.";
  if (fields.salaryMax != null && fields.salaryMax < 0) return "Salary maximum cannot be negative.";
  if (fields.salaryMin != null && fields.salaryMax != null && fields.salaryMax < fields.salaryMin) return "Salary maximum must be at least the minimum.";
  if (!sending) return null;
  if (fields.serviceModel === "curated_placement" && (!fields.placementFee || fields.placementFee <= 0)) return "Add the one-time VAPH placement fee before sending.";
  if (fields.serviceModel === "managed_service" && (!fields.managedMarkupPercent || fields.managedMarkupPercent <= 0)) return "Add the managed-service margin before sending.";
  return null;
}

export async function saveProposalDraftAction(formData: FormData) {
  const { user } = await requireAnyRole(["recruiter", "admin"]);
  const proposalId = String(formData.get("proposal_id") || "").trim();
  const leadId = String(formData.get("lead_id") || "").trim();
  const fields = proposalEditorFields(formData);
  const validation = validateProposalEditorFields(fields);
  if (!proposalId || !leadId) redirect("/workspace/recruiter/crm?proposal_error=Proposal%20not%20found.");
  if (validation) redirect(proposalReturnPath(leadId, `?error=${encodeURIComponent(validation)}`));

  const admin = createAdminClient();
  const { data: proposal, error: proposalError } = await admin
    .from("lead_proposals")
    .select("id,lead_id,status")
    .eq("id", proposalId)
    .eq("lead_id", leadId)
    .maybeSingle();
  if (proposalError || !proposal) redirect(proposalReturnPath(leadId, "?error=Proposal%20not%20found."));
  if (!["draft", "changes_requested"].includes(String(proposal.status))) {
    redirect(proposalReturnPath(leadId, "?error=Only%20drafts%20or%20requested%20revisions%20can%20be%20edited."));
  }

  const now = new Date().toISOString();
  const { error } = await admin.from("lead_proposals").update({
    status: "draft",
    role_title: fields.roleTitle,
    summary: fields.summary,
    responsibilities: fields.responsibilities,
    required_skills: fields.requiredSkills,
    required_tools: fields.requiredTools,
    hours_per_week: Math.round(fields.hoursPerWeek || 0),
    salary_min: fields.salaryMin,
    salary_max: fields.salaryMax,
    salary_currency: fields.salaryCurrency,
    service_model: fields.serviceModel,
    placement_fee: fields.serviceModel === "curated_placement" ? fields.placementFee : null,
    managed_markup_percent: fields.serviceModel === "managed_service" ? fields.managedMarkupPercent : null,
    commercial_note: fields.commercialNote || null,
    recommended_start_date: fields.recommendedStartDate,
    start_timing: fields.recommendedStartDate,
    updated_at: now,
  }).eq("id", proposalId);
  if (error) redirect(proposalReturnPath(leadId, `?error=${encodeURIComponent(error.message || "Could not save the proposal.")}`));

  await writeRecruiterActivity({
    subjectType: "lead",
    subjectId: leadId,
    action: "proposal_draft_saved",
    description: `Recommendation draft saved for ${fields.roleTitle}`,
    actorId: user.id,
    metadata: { proposal_id: proposalId },
  });

  revalidatePath(`/workspace/recruiter/crm/${leadId}`);
  revalidatePath(proposalReturnPath(leadId));
  redirect(proposalReturnPath(leadId, "?saved=1"));
}

export async function sendProposalToClientAction(formData: FormData) {
  const { user } = await requireAnyRole(["recruiter", "admin"]);
  const proposalId = String(formData.get("proposal_id") || "").trim();
  const leadId = String(formData.get("lead_id") || "").trim();
  const fields = proposalEditorFields(formData);
  const validation = validateProposalEditorFields(fields, true);
  if (!proposalId || !leadId) redirect("/workspace/recruiter/crm?proposal_error=Proposal%20not%20found.");
  if (validation) redirect(proposalReturnPath(leadId, `?error=${encodeURIComponent(validation)}`));

  const admin = createAdminClient();
  const [{ data: proposal, error: proposalError }, { data: lead, error: leadError }] = await Promise.all([
    admin.from("lead_proposals")
      .select("id,lead_id,status,public_token,send_count,job_id")
      .eq("id", proposalId)
      .eq("lead_id", leadId)
      .maybeSingle(),
    admin.from("lead_intake")
      .select("id,name,email,company,owner_id,timezone,job_id")
      .eq("id", leadId)
      .eq("lead_type", "client_hiring")
      .maybeSingle(),
  ]);
  if (proposalError || !proposal || leadError || !lead?.email) {
    redirect(proposalReturnPath(leadId, "?error=The%20client%20email%20or%20proposal%20could%20not%20be%20verified."));
  }
  if (!["draft", "changes_requested"].includes(String(proposal.status))) {
    redirect(proposalReturnPath(leadId, "?error=This%20proposal%20is%20not%20waiting%20to%20be%20sent."));
  }

  const now = new Date();
  const nextSendCount = Number(proposal.send_count || 0) + 1;
  const expiresAt = new Date(now.getTime() + fields.expiresDays * 86400000);
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph").replace(/\/$/, "");
  const proposalUrl = `${appUrl}/proposal/${proposal.public_token}`;

  const { error: saveError } = await admin.from("lead_proposals").update({
    role_title: fields.roleTitle,
    summary: fields.summary,
    responsibilities: fields.responsibilities,
    required_skills: fields.requiredSkills,
    required_tools: fields.requiredTools,
    hours_per_week: Math.round(fields.hoursPerWeek || 0),
    salary_min: fields.salaryMin,
    salary_max: fields.salaryMax,
    salary_currency: fields.salaryCurrency,
    service_model: fields.serviceModel,
    placement_fee: fields.serviceModel === "curated_placement" ? fields.placementFee : null,
    managed_markup_percent: fields.serviceModel === "managed_service" ? fields.managedMarkupPercent : null,
    commercial_note: fields.commercialNote || null,
    recommended_start_date: fields.recommendedStartDate,
    start_timing: fields.recommendedStartDate,
    updated_at: now.toISOString(),
  }).eq("id", proposalId);
  if (saveError) redirect(proposalReturnPath(leadId, `?error=${encodeURIComponent(saveError.message || "Could not save the proposal.")}`));

  try {
    const delivery = await sendTransactionalEventEmail({
      to: lead.email,
      subject: `Your ${fields.roleTitle} hiring recommendation`,
      heading: "Your hiring recommendation is ready",
      body: `Based on our discovery conversation, we prepared a recommended role and commercial proposal for ${lead.company || lead.name || "your business"}. Review the scope, compensation range, VAPH fee, and next steps, then approve it or request changes.`,
      href: proposalUrl,
      hrefLabel: "Review recommendation",
      priority: "critical",
      idempotencyKey: `proposal-send-${proposalId}-${nextSendCount}`,
      eventType: "client_hiring_proposal",
    });
    if (!delivery.sent) throw new Error("Proposal email could not be delivered.");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Proposal email could not be sent.";
    redirect(proposalReturnPath(leadId, `?error=${encodeURIComponent(message)}`));
  }

  const { error: sentError } = await admin.from("lead_proposals").update({
    status: "sent",
    sent_at: now.toISOString(),
    viewed_at: null,
    expires_at: expiresAt.toISOString(),
    send_count: nextSendCount,
    updated_at: now.toISOString(),
  }).eq("id", proposalId);
  if (sentError) redirect(proposalReturnPath(leadId, `?error=${encodeURIComponent(sentError.message || "Proposal email sent, but status could not be updated.")}`));

  let proposalFollowUpTimeZone = isValidTimeZone(lead.timezone) ? String(lead.timezone) : "";
  if (!proposalFollowUpTimeZone && lead.job_id) {
    const { data: linkedJob } = await admin.from("jobs").select("timezone").eq("id", lead.job_id).maybeSingle();
    if (isValidTimeZone(linkedJob?.timezone)) proposalFollowUpTimeZone = String(linkedJob?.timezone);
  }
  if (!proposalFollowUpTimeZone) proposalFollowUpTimeZone = "Asia/Manila";
  const proposalFollowUpAt = followUpAtClientNine(
    addDaysToDateKey(localDateKey(now, proposalFollowUpTimeZone), 2),
    proposalFollowUpTimeZone,
  ) || new Date(now.getTime() + 2 * 86400000).toISOString();

  await admin.from("lead_intake").update({
    crm_stage: "terms_sent",
    status: "converted",
    owner_id: lead.owner_id || user.id,
    next_follow_up_at: proposalFollowUpAt,
    stage_updated_at: now.toISOString(),
    lost_at: null,
    lost_reason: null,
  }).eq("id", leadId);

  await writeRecruiterActivity({
    subjectType: "lead",
    subjectId: leadId,
    action: "proposal_sent",
    description: `Hiring recommendation sent for ${fields.roleTitle}`,
    actorId: user.id,
    metadata: {
      proposal_id: proposalId,
      send_count: nextSendCount,
      expires_at: expiresAt.toISOString(),
      service_model: fields.serviceModel,
      next_follow_up_at: proposalFollowUpAt,
      follow_up_timezone: proposalFollowUpTimeZone,
    },
  });

  revalidatePath("/workspace/recruiter");
  revalidatePath("/workspace/recruiter/today");
  revalidatePath("/workspace/recruiter/crm");
  revalidatePath(`/workspace/recruiter/crm/${leadId}`);
  revalidatePath(proposalReturnPath(leadId));
  redirect(proposalReturnPath(leadId, "?sent=1"));
}

export async function createAndSendProposalAction(formData: FormData) {
  const { user } = await requireAnyRole(["recruiter", "admin"]);
  const leadId = String(formData.get("lead_id") || "").trim();
  const returnTo = safePath(formData.get("return_to"), "/workspace/recruiter/crm?view=qualified");
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

  // Client-facing proposal email is intentionally deferred. Proposal data is
  // kept as an internal recruiter draft until actual VAs are ready to send.
  await admin.from("lead_intake").update({
    owner_id: lead.owner_id || user.id,
    estimated_value_usd: agencyValue || null,
    stage_updated_at: now.toISOString()
  }).eq("id", leadId);

  await writeRecruiterActivity({
    subjectType: "lead",
    subjectId: leadId,
    action: "proposal_draft_created",
    description: `Proposal draft prepared for ${roleTitle}`,
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
  revalidatePath("/workspace/recruiter/crm");
  revalidatePath("/workspace/admin/leads");
  redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}proposal_saved=1`);
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
  const recruiterHref = askingForChanges ? `/workspace/recruiter/crm/${lead.id}/proposal` : `/workspace/recruiter/crm/${lead.id}`;
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
      href: recruiterHref
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
        href: `${process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph"}${recruiterHref}`,
        hrefLabel: "Open sales CRM"
      });
    } catch {}
  }

  revalidatePath("/workspace/recruiter");
  revalidatePath("/workspace/recruiter/crm");
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
  const proposalResponsibilities = Array.isArray(proposal.responsibilities) ? proposal.responsibilities.filter(Boolean).slice(0, 16) : [];
  const proposalSkills = Array.isArray(proposal.required_skills) ? proposal.required_skills.filter(Boolean).slice(0, 20) : [];
  const proposalTools = Array.isArray(proposal.required_tools) ? proposal.required_tools.filter(Boolean).slice(0, 20) : [];
  const jobPayload = {
    title: proposal.role_title,
    slug,
    company_name: lead.company || null,
    summary: cleanJobSummary(proposal.summary || lead.message, fallbackSummary),
    description,
    responsibilities: proposalResponsibilities.length ? proposalResponsibilities : description ? [description] : [],
    categories: inferCategories(lead.service, proposal.summary || lead.message),
    required_skills: proposalSkills,
    required_tools: proposalTools,
    hours_per_week: proposal.hours_per_week || inferHours(lead.hours),
    min_hourly_rate: proposal.va_rate_min || MIN_HOURLY_RATE,
    max_hourly_rate: proposal.va_rate_max || null,
    timezone: lead.timezone || null,
    overlap_hours: 4,
    live_coverage_exception: /reception|dispatch|cold call|outbound|front desk/i.test(`${lead.service || ""} ${lead.message || ""}`),
    onboarding_plan: "Client onboarding and tool access to be confirmed before placement.",
    direct_feedback: true,
    engagement_length: "Long-term preferred",
    start_timing: proposal.recommended_start_date || proposal.start_timing || lead.start_time || null
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

  if (clientId && handoff.linked && handoff.actionLink) {
    try {
      await sendTransactionalEventEmail({
        to: handoff.email,
        subject: handoff.created ? "Your VirtualAssistant.com.ph client workspace is ready" : "Open your VirtualAssistant.com.ph client workspace",
        heading: handoff.created ? "Your client workspace is ready" : "Continue in your client workspace",
        body: handoff.created
          ? "Your hiring proposal is accepted. Use this secure one-time link to activate your client workspace, review the accepted proposal, and follow recruiting progress."
          : "Your hiring proposal is accepted. Use this secure sign-in link to open your client workspace, review the accepted proposal, and follow recruiting progress.",
        href: handoff.actionLink,
        hrefLabel: handoff.created ? "Activate client workspace" : "Open client workspace",
        priority: "critical",
        idempotencyKey: `proposal-workspace-access-${proposal.id}-${clientId}`,
        eventType: "client_workspace_access",
      });
    } catch {
      // Acceptance is already committed. Workspace access email is recoverable
      // from the normal client login flow and must never roll back the hire.
    }
  }

  revalidatePath("/workspace/recruiter");
  revalidatePath("/workspace/recruiter/crm");
  revalidatePath("/workspace/admin/leads");
  if (clientId) {
    revalidatePath("/workspace/client");
    revalidatePath("/workspace/client/proposals");
    revalidatePath("/workspace/client/jobs");
    revalidatePath(`/workspace/client/jobs/${acceptedJobId}`);
  }
  redirect(`/proposal/${token}?accepted=1`);
}
