"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAnyRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { legacyLeadStatus, type LeadCrmStage } from "@/lib/lead-crm";
import { runCrmStageWorkflows } from "@/lib/crm-workflows";
import { writeRecruiterActivity } from "@/lib/recruiter-activity";

const NEXT_STEPS = new Set(["save", "qualified", "follow_up", "nurture"]);

function textValue(formData: FormData, key: string, max = 5000) {
  return String(formData.get(key) || "").trim().slice(0, max);
}

function listValue(formData: FormData, key: string, limit = 20) {
  return [...new Set(
    textValue(formData, key, 1200)
      .split(/[,;\n]/)
      .map((value) => value.trim())
      .filter(Boolean),
  )].slice(0, limit);
}

function numberValue(formData: FormData, key: string) {
  const raw = String(formData.get(key) || "").trim();
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function safeReturn(leadId: string, suffix = "") {
  return `/workspace/recruiter/crm/${encodeURIComponent(leadId)}/discovery${suffix}`;
}

function discoverySummary(values: {
  whyNow: string;
  currentPain: string;
  ownershipNeeded: string;
  previousAttempts: string;
  success90Days: string;
  failureRisks: string;
  decisionProcess: string;
  recommendedRole: string;
  recommendedSkills: string[];
  recommendedTools: string[];
}) {
  return [
    values.whyNow && `Why now: ${values.whyNow}`,
    values.currentPain && `Current pain: ${values.currentPain}`,
    values.ownershipNeeded && `Ownership needed: ${values.ownershipNeeded}`,
    values.previousAttempts && `Tried before: ${values.previousAttempts}`,
    values.success90Days && `90-day success: ${values.success90Days}`,
    values.failureRisks && `Failure risks: ${values.failureRisks}`,
    values.decisionProcess && `Decision process: ${values.decisionProcess}`,
    values.recommendedRole && `Recommended role: ${values.recommendedRole}`,
    values.recommendedSkills.length && `Skills: ${values.recommendedSkills.join(", ")}`,
    values.recommendedTools.length && `Tools: ${values.recommendedTools.join(", ")}`,
  ].filter(Boolean).join("\n").slice(0, 5000);
}

export async function saveDiscoveryWorkspaceAction(formData: FormData) {
  const { user } = await requireAnyRole(["recruiter", "admin"]);
  const leadId = textValue(formData, "lead_id", 80);
  const intent = textValue(formData, "intent", 30) || "save";
  if (!leadId || !NEXT_STEPS.has(intent)) redirect("/workspace/recruiter/crm?discovery_error=Invalid%20discovery%20request.");

  const values = {
    currentPain: textValue(formData, "current_pain"),
    whyNow: textValue(formData, "why_now"),
    ownershipNeeded: textValue(formData, "ownership_needed"),
    previousAttempts: textValue(formData, "previous_attempts"),
    success90Days: textValue(formData, "success_90_days"),
    failureRisks: textValue(formData, "failure_risks"),
    decisionProcess: textValue(formData, "decision_process"),
    additionalNotes: textValue(formData, "additional_notes"),
    recommendedRole: textValue(formData, "recommended_role", 180),
    recommendedHours: numberValue(formData, "recommended_hours"),
    recommendedSkills: listValue(formData, "recommended_skills"),
    recommendedTools: listValue(formData, "recommended_tools"),
    recommendedSalaryMin: numberValue(formData, "recommended_salary_min"),
    recommendedSalaryMax: numberValue(formData, "recommended_salary_max"),
    salaryCurrency: textValue(formData, "salary_currency", 12) || "PHP",
    vaphFeeNote: textValue(formData, "vaph_fee_note", 500),
    recommendedStartDate: textValue(formData, "recommended_start_date", 20) || null,
  };

  if (values.recommendedHours !== null && (values.recommendedHours < 1 || values.recommendedHours > 80)) {
    redirect(safeReturn(leadId, "?error=Hours%20must%20be%20between%201%20and%2080."));
  }
  if (
    values.recommendedSalaryMin !== null &&
    values.recommendedSalaryMax !== null &&
    values.recommendedSalaryMax < values.recommendedSalaryMin
  ) {
    redirect(safeReturn(leadId, "?error=Maximum%20salary%20cannot%20be%20lower%20than%20minimum%20salary."));
  }
  if (intent === "qualified" && (!values.recommendedRole || !values.ownershipNeeded || !values.success90Days)) {
    redirect(safeReturn(leadId, "?error=Before%20qualifying%2C%20add%20the%20recommended%20role%2C%20ownership%2C%20and%2090-day%20success%20outcome."));
  }

  const admin = createAdminClient();
  const { data: lead, error: leadError } = await admin
    .from("lead_intake")
    .select("id,crm_stage,job_id,hours,budget,timezone,start_time")
    .eq("id", leadId)
    .eq("lead_type", "client_hiring")
    .maybeSingle();
  if (leadError || !lead) redirect("/workspace/recruiter/crm?discovery_error=Lead%20not%20found.");
  if (intent === "qualified" && !lead.job_id) {
    redirect(safeReturn(leadId, "?error=This%20lead%20does%20not%20have%20a%20linked%20role%20yet."));
  }

  const now = new Date();
  const nextStep = intent === "save" ? null : intent;
  const qualificationStatus = intent === "qualified"
    ? "ready"
    : intent === "follow_up"
      ? "follow_up"
      : intent === "nurture"
        ? "nurture"
        : "in_progress";

  const { error: briefError } = await admin.from("lead_discovery_briefs").upsert({
    lead_id: leadId,
    current_pain: values.currentPain || null,
    why_now: values.whyNow || null,
    ownership_needed: values.ownershipNeeded || null,
    previous_attempts: values.previousAttempts || null,
    success_90_days: values.success90Days || null,
    failure_risks: values.failureRisks || null,
    decision_process: values.decisionProcess || null,
    additional_notes: values.additionalNotes || null,
    recommended_role: values.recommendedRole || null,
    recommended_hours: values.recommendedHours,
    recommended_skills: values.recommendedSkills,
    recommended_tools: values.recommendedTools,
    recommended_salary_min: values.recommendedSalaryMin,
    recommended_salary_max: values.recommendedSalaryMax,
    salary_currency: values.salaryCurrency,
    vaph_fee_note: values.vaphFeeNote || null,
    recommended_start_date: values.recommendedStartDate,
    next_step: nextStep,
    qualification_status: qualificationStatus,
    created_by: user.id,
    updated_by: user.id,
    updated_at: now.toISOString(),
  }, { onConflict: "lead_id" });
  if (briefError) redirect(safeReturn(leadId, `?error=${encodeURIComponent(briefError.message || "Could not save discovery notes.")}`));

  if (lead.job_id) {
    const jobPatch: Record<string, unknown> = { updated_at: now.toISOString() };
    if (values.recommendedRole) jobPatch.title = values.recommendedRole;
    if (values.recommendedHours !== null) jobPatch.hours_per_week = Math.round(values.recommendedHours);
    if (values.recommendedSkills.length) {
      jobPatch.required_skills = values.recommendedSkills;
      jobPatch.must_have_skills = values.recommendedSkills;
    }
    if (values.recommendedTools.length) jobPatch.required_tools = values.recommendedTools;
    if (values.ownershipNeeded) {
      const responsibilities = values.ownershipNeeded
        .split(/\n|;/)
        .map((value) => value.trim())
        .filter(Boolean)
        .slice(0, 12);
      if (responsibilities.length) jobPatch.responsibilities = responsibilities;
    }
    if (values.recommendedStartDate) jobPatch.start_timing = values.recommendedStartDate;

    const { error: jobError } = await admin.from("jobs").update(jobPatch).eq("id", lead.job_id);
    if (jobError) redirect(safeReturn(leadId, `?error=${encodeURIComponent(jobError.message || "Could not update the linked role.")}`));
  }

  const summary = discoverySummary(values);

  if (intent !== "save") {
    const stage: LeadCrmStage = intent === "qualified" ? "qualified" : "nurture";
    const nextFollowUpAt = intent === "qualified"
      ? new Date(now.getTime() + 86400000).toISOString()
      : intent === "follow_up"
        ? new Date(now.getTime() + 2 * 86400000).toISOString()
        : new Date(now.getTime() + 14 * 86400000).toISOString();

    const { error: leadUpdateError } = await admin.from("lead_intake").update({
      discovery_completed_at: now.toISOString(),
      discovery_outcome: intent === "qualified" ? "qualified" : "attended",
      discovery_notes: summary || values.additionalNotes || "Discovery workspace completed.",
      crm_stage: stage,
      status: legacyLeadStatus(stage),
      next_follow_up_at: nextFollowUpAt,
      stage_updated_at: now.toISOString(),
      lost_reason: null,
      lost_at: null,
    }).eq("id", leadId);
    if (leadUpdateError) redirect(safeReturn(leadId, `?error=${encodeURIComponent(leadUpdateError.message || "Could not update the lead.")}`));

    if (stage !== String(lead.crm_stage || "new")) {
      await runCrmStageWorkflows({ leadId, stage, actorId: user.id });
    }
  }

  await writeRecruiterActivity({
    subjectType: "lead",
    subjectId: leadId,
    action: intent === "save" ? "discovery_workspace_saved" : `discovery_workspace_${intent}`,
    description: intent === "qualified"
      ? "Discovery qualified and handed to matching"
      : intent === "follow_up"
        ? "Discovery saved for follow-up"
        : intent === "nurture"
          ? "Discovery moved to nurture"
          : "Discovery workspace saved",
    actorId: user.id,
    metadata: {
      job_id: lead.job_id || null,
      recommended_role: values.recommendedRole || null,
      recommended_hours: values.recommendedHours,
      recommended_skills: values.recommendedSkills,
      recommended_tools: values.recommendedTools,
    },
  });

  revalidatePath("/workspace/recruiter");
  revalidatePath("/workspace/recruiter/today");
  revalidatePath("/workspace/recruiter/crm");
  revalidatePath(`/workspace/recruiter/crm/${leadId}`);
  revalidatePath(`/workspace/recruiter/crm/${leadId}/discovery`);
  if (lead.job_id) {
    revalidatePath(`/workspace/recruiter/roles/${lead.job_id}`);
    revalidatePath(`/workspace/recruiter/matching/${lead.job_id}`);
  }

  if (intent === "qualified" && lead.job_id) {
    redirect(`/workspace/recruiter/matching/${lead.job_id}?discovery=qualified`);
  }
  if (intent === "follow_up" || intent === "nurture") {
    redirect(`/workspace/recruiter/crm/${leadId}?discovery_completed=1`);
  }
  redirect(safeReturn(leadId, "?saved=1"));
}
