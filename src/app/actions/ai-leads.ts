"use server";

import { after } from "next/server";
import {
  submitIndustryMatchAction,
  submitRoleBriefAction,
  submitServiceMatchAction,
  type ServiceMatchState
} from "@/app/actions/leads";
import { enrichPendingLeadJob } from "@/lib/ai-job-draft";
import { createAdminClient } from "@/lib/supabase/admin";

function scheduleJobEnrichment(jobId?: string | null) {
  if (!jobId) return;
  after(async () => {
    try {
      await enrichPendingLeadJob(jobId);
    } catch {
      // AI enrichment is best effort. The saved lead and fallback job draft remain valid.
    }
  });
}

function scheduleLeadEnrichment(leadId?: string | null) {
  if (!leadId) return;
  after(async () => {
    try {
      const admin = createAdminClient();
      const { data: lead } = await admin
        .from("lead_intake")
        .select("job_id")
        .eq("id", leadId)
        .maybeSingle();
      if (lead?.job_id) await enrichPendingLeadJob(lead.job_id);
    } catch {
      // AI enrichment is best effort. The saved lead and fallback job draft remain valid.
    }
  });
}

function redirectTarget(error: unknown) {
  if (!error || typeof error !== "object") return null;
  const digest = (error as { digest?: unknown }).digest;
  if (typeof digest !== "string" || !digest.startsWith("NEXT_REDIRECT;")) return null;
  return digest.split(";").find((part) => part.startsWith("/")) || null;
}

function scheduleRoleBriefRedirectEnrichment(error: unknown) {
  const target = redirectTarget(error);
  if (!target) return;

  try {
    const url = new URL(target, "https://virtualassistant.com.ph");
    const clientJobMatch = url.pathname.match(/^\/workspace\/client\/jobs\/([^/]+)$/);
    if (clientJobMatch?.[1]) {
      scheduleJobEnrichment(decodeURIComponent(clientJobMatch[1]));
      return;
    }

    // Anonymous successful submissions include the exact lead id in the redirect.
    // Validation/error redirects and duplicate redirects do not, so they never
    // guess at a recent lead by email.
    if (url.searchParams.get("sent") !== "1") return;
    scheduleLeadEnrichment(url.searchParams.get("lead"));
  } catch {
    // Preserve the original redirect even if its target cannot be parsed.
  }
}

export async function submitServiceMatchWithAiAction(
  previousState: ServiceMatchState,
  formData: FormData
): Promise<ServiceMatchState> {
  const result = await submitServiceMatchAction(previousState, formData);
  if (result.status === "success") scheduleJobEnrichment(result.jobId);
  return result;
}

export async function submitIndustryMatchWithAiAction(
  previousState: ServiceMatchState,
  formData: FormData
): Promise<ServiceMatchState> {
  const result = await submitIndustryMatchAction(previousState, formData);
  if (result.status === "success") scheduleJobEnrichment(result.jobId);
  return result;
}

export async function submitRoleBriefWithAiAction(formData: FormData) {
  try {
    return await submitRoleBriefAction(formData);
  } catch (error) {
    // submitRoleBriefAction finishes through redirect(). Only successful redirects
    // that carry the exact new job or lead id are eligible for enrichment.
    scheduleRoleBriefRedirectEnrichment(error);
    throw error;
  }
}
