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

function scheduleLatestLeadEnrichment(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return;

  after(async () => {
    try {
      const admin = createAdminClient();
      const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const { data: lead } = await admin
        .from("lead_intake")
        .select("job_id")
        .ilike("email", email)
        .not("job_id", "is", null)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (lead?.job_id) await enrichPendingLeadJob(lead.job_id);
    } catch {
      // A redirect or AI failure must never change the original form outcome.
    }
  });
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
    // submitRoleBriefAction completes with Next.js redirect(), so enrich the
    // just-created linked job after the response and preserve that redirect.
    scheduleLatestLeadEnrichment(formData);
    throw error;
  }
}
