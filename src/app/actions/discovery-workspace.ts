"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAnyRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { legacyLeadStatus, type LeadCrmStage } from "@/lib/lead-crm";
import { runCrmStageWorkflows } from "@/lib/crm-workflows";
import { writeRecruiterActivity } from "@/lib/recruiter-activity";
import { resolveDiscoveryOutcomeArtifacts } from "@/lib/discovery-outcome-automation";

const NEXT_STEPS = new Set(["save", "proposal", "follow_up", "nurture"]);

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
  if (intent === "proposal" && (!values.recommendedRole || !values.ownershipNeeded || !values.success90Days)) {
    redirect(safeReturn(leadId, "?error=Before%20proceeding%2C%20add%20the%20recommended%20role%2C%20ownership%2C%20and%2090-day%20success%20outcome."));
  }

  const admin = createAdminClient();
  const { data: lead, error: leadError } = await admin
    .from("lead_intake")
    .select("id,crm_stage,job_id,hours,budget,timezone,start_time")
    .eq("id", leadId)
    .eq("lead_type", "client_hiring")
    .maybeSingle();
  if (leadError || !lead) redirect("/workspace/recruiter/crm?discovery_error=Lead%20not%20found.");
  if (["won", "lost"].includes(String(lead.crm_stage || ""))) {
    redirect(safeReturn(leadId, "?error=Closed%20leads%20must%20be%20reopened%20before%20creating%20a%20new%20proposal."));
  }
  const now = new Date();
  const nextStep = intent === "save" ? null : intent;
  const qualificationStatus = intent === "proposal"
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
      // Discovery recommendations are screening criteria, not automatic hard blockers.
      // Preserve any explicitly configured must-have skills instead of converting
      // every recommendation into a must-have and accidentally eliminating the pool.
      jobPatch.required_skills = values.recommendedSkills;
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

  if (intent === "proposal") {
    // Commit the internal draft before changing the lead to qualified. If the
    // proposal write fails, no qualified lead is silently stranded without a draft.
    const responsibilities = values.ownershipNeeded
      .split(/\n|;/)
      .map((value) => value.trim())
      .filter(Boolean)
      .slice(0, 12);

    const proposalPayload = {
      role_title: values.recommendedRole,
      summary: values.currentPain || values.whyNow || values.ownershipNeeded || "Virtual Assistant hiring recommendation",
      hours_per_week: values.recommendedHours,
      responsibilities,
      required_skills: values.recommendedSkills,
      required_tools: values.recommendedTools,
      salary_min: values.recommendedSalaryMin,
      salary_max: values.recommendedSalaryMax,
      salary_currency: values.salaryCurrency,
      commercial_note: values.vaphFeeNote || null,
      recommended_start_date: values.recommendedStartDate,
      start_timing: values.recommendedStartDate || lead.start_time || null,
      job_id: lead.job_id || null,
      updated_at: now.toISOString(),
    };

    const { data: latestProposal, error: existingProposalError } = await admin
      .from("lead_proposals")
      .select("id,status")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existingProposalError) {
      redirect(safeReturn(leadId, `?error=${encodeURIComponent("Could not verify the existing client proposal.")}`));
    }
    if (latestProposal && ["sent", "accepted"].includes(String(latestProposal.status))) {
      redirect(safeReturn(leadId, "?error=This%20lead%20already%20has%20a%20sent%20or%20accepted%20proposal.%20Review%20it%20before%20creating%20another."));
    }

    if (latestProposal && ["draft", "changes_requested"].includes(String(latestProposal.status))) {
      const { error: proposalError } = await admin
        .from("lead_proposals")
        .update({ ...proposalPayload, status: "draft" })
        .eq("id", latestProposal.id);
      if (proposalError) redirect(safeReturn(leadId, `?error=${encodeURIComponent(proposalError.message || "Could not prepare the proposal.")}`));
    } else {
      const { error: proposalError } = await admin
        .from("lead_proposals")
        .insert({
          lead_id: leadId,
          status: "draft",
          service_model: "curated_placement",
          created_by: user.id,
          ...proposalPayload,
        });
      if (proposalError) redirect(safeReturn(leadId, `?error=${encodeURIComponent(proposalError.message || "Could not prepare the proposal.")}`));
    }
  }

  if (intent !== "save") {
    const stage: LeadCrmStage = intent === "proposal"
      ? "qualified"
      : intent === "nurture"
        ? "nurture"
        : (lead.crm_stage as LeadCrmStage) || "contacted";
    const nextFollowUpAt = intent === "proposal"
      ? new Date(now.getTime() + 86400000).toISOString()
      : intent === "follow_up"
        ? new Date(now.getTime() + 2 * 86400000).toISOString()
        : new Date(now.getTime() + 14 * 86400000).toISOString();

    // Follow-up and nurture describe a sales next step, not proof of an
    // attended discovery. Only the qualified recommendation path records
    // a completed call here. The CRM outcome form handles no-shows/attendance.
    const leadPatch: Record<string, unknown> = {
      next_follow_up_at: nextFollowUpAt,
    };
    if (summary || values.additionalNotes) {
      leadPatch.discovery_notes = summary || values.additionalNotes;
    }
    if (intent !== "follow_up") {
      leadPatch.stage_updated_at = now.toISOString();
      leadPatch.crm_stage = stage;
      leadPatch.status = legacyLeadStatus(stage);
      leadPatch.lost_reason = null;
      leadPatch.lost_at = null;
    }
    if (intent === "proposal") {
      leadPatch.discovery_completed_at = now.toISOString();
      leadPatch.discovery_outcome = "qualified";
    }
    const { error: leadUpdateError } = await admin.from("lead_intake").update(leadPatch).eq("id", leadId);
    if (leadUpdateError) redirect(safeReturn(leadId, `?error=${encodeURIComponent(leadUpdateError.message || "Could not update the lead.")}`));

    if (intent !== "follow_up" && stage !== String(lead.crm_stage || "new")) {
      await runCrmStageWorkflows({ leadId, stage, actorId: user.id });
    }
    if (intent === "proposal") {
      try {
        await resolveDiscoveryOutcomeArtifacts(admin, leadId);
      } catch (automationError) {
        console.error("[automation] discovery outcome cleanup failed", {
          leadId,
          error: automationError instanceof Error ? automationError.message : String(automationError),
        });
      }
    }
  }

  await writeRecruiterActivity({
    subjectType: "lead",
    subjectId: leadId,
    action: intent === "save" ? "discovery_workspace_saved" : `discovery_workspace_${intent}`,
    description: intent === "proposal"
      ? "Discovery qualified and recommendation draft generated"
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
  revalidatePath(`/workspace/recruiter/crm/${leadId}/proposal`);
  if (lead.job_id) {
    revalidatePath(`/workspace/recruiter/roles/${lead.job_id}`);
    revalidatePath(`/workspace/recruiter/matching/${lead.job_id}`);
  }

  if (intent === "proposal") {
    redirect(`/workspace/recruiter/crm/${leadId}/proposal?generated=1`);
  }

  if (intent === "follow_up" || intent === "nurture") {
    redirect(`/workspace/recruiter/crm/${leadId}?discovery_completed=1`);
  }
  redirect(safeReturn(leadId, "?saved=1"));
}
