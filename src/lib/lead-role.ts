import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { VA_CATEGORIES, MIN_HOURLY_RATE } from "@/lib/constants";
import { inferCategories, inferHours } from "@/lib/category-inference";
import { cleanJobSummary, cleanJobDescription } from "@/lib/job-content-cleanup";

export type EnsurePendingRoleForLeadArgs = {
  admin: ReturnType<typeof createAdminClient>;
  leadId: string;
  title: string;
  service?: string | null;
  company?: string | null;
  hours?: string | null;
  timezone?: string | null;
  startTime?: string | null;
  message?: string | null;
  budget?: string | null;
  requestedVaId?: string | null;
  clientId?: string | null;
  recruiterId?: string | null;
  ownerId?: string | null;
};

export function rateRangeFromBudget(value?: string | null) {
  const matches = String(value || "").match(/\d+(?:\.\d+)?/g)?.map(Number).filter(Number.isFinite) || [];
  if (!matches.length) return { min: MIN_HOURLY_RATE, max: null as number | null };
  const min = Math.max(MIN_HOURLY_RATE, matches[0]);
  const max = matches.length > 1 ? Math.max(min, matches[1]) : null;
  return { min, max };
}

export function jobTitleForCategory(category: string) {
  const labels: Record<string, string> = {
    "Administrative Support": "Administrative Virtual Assistant",
    "Bookkeeping & Finance": "Bookkeeping & Finance Virtual Assistant",
    "Customer Service": "Customer Service Virtual Assistant",
    "Dental & Healthcare": "Dental & Healthcare Virtual Assistant",
    "Ecommerce": "Ecommerce Virtual Assistant",
    "Executive Assistance": "Executive Virtual Assistant",
    "Lead Generation & Sales": "Lead Generation & Sales Virtual Assistant",
    "Marketing & Social Media": "Marketing & Social Media Virtual Assistant",
    "Phone & Reception": "Virtual Receptionist",
    "Real Estate": "Real Estate Virtual Assistant",
    "SEO": "SEO Virtual Assistant",
    "Video Editing & Creative": "Video Editing & Creative Virtual Assistant",
    "Web & WordPress": "WordPress & Web Virtual Assistant",
  };
  const clean = category.trim();
  if (!clean) return "Virtual Assistant";
  return labels[clean] || `${clean} Virtual Assistant`;
}

async function updateLeadLink(args: EnsurePendingRoleForLeadArgs, jobId: string) {
  const patch: Record<string, unknown> = { job_id: jobId };
  if (args.clientId) patch.client_id = args.clientId;

  const { error: linkError } = await args.admin
    .from("lead_intake")
    .update(patch)
    .eq("id", args.leadId)
    .is("job_id", null);
  if (linkError) throw linkError;

  if (args.ownerId) {
    const { error: ownerError } = await args.admin
      .from("lead_intake")
      .update({ owner_id: args.ownerId })
      .eq("id", args.leadId)
      .is("owner_id", null);
    if (ownerError) throw ownerError;
  }
}

export async function ensurePendingRoleForLead(args: EnsurePendingRoleForLeadArgs): Promise<string> {
  const { data: existingLead, error: leadError } = await args.admin
    .from("lead_intake")
    .select("job_id")
    .eq("id", args.leadId)
    .maybeSingle();
  if (leadError) throw leadError;
  if (existingLead?.job_id) {
    if (args.ownerId) {
      const { error: ownerError } = await args.admin
        .from("lead_intake")
        .update({ owner_id: args.ownerId })
        .eq("id", args.leadId)
        .is("owner_id", null);
      if (ownerError) throw ownerError;
    }
    return existingLead.job_id as string;
  }

  const { data: existingJob, error: existingJobError } = await args.admin
    .from("jobs")
    .select("id")
    .eq("lead_id", args.leadId)
    .maybeSingle();
  if (existingJobError) throw existingJobError;
  if (existingJob?.id) {
    await updateLeadLink(args, existingJob.id as string);
    return existingJob.id as string;
  }

  const categories = args.service && VA_CATEGORIES.includes(args.service as (typeof VA_CATEGORIES)[number])
    ? [args.service]
    : inferCategories(args.service, args.message);
  const rates = rateRangeFromBudget(args.budget);
  const fallbackSummary = `Virtual Assistant support requested for ${args.service || "business operations"}.`;
  const description = cleanJobDescription(args.message);

  const payload: Record<string, unknown> = {
    client_id: args.clientId || null,
    lead_id: args.leadId,
    requested_va_id: args.requestedVaId || null,
    title: args.title,
    company_name: args.company || null,
    summary: cleanJobSummary(args.message, fallbackSummary),
    description,
    responsibilities: description ? [description] : [],
    categories,
    hours_per_week: inferHours(args.hours),
    min_hourly_rate: rates.min,
    max_hourly_rate: rates.max,
    timezone: args.timezone || null,
    overlap_hours: 4,
    live_coverage_exception: /reception|dispatch|cold call|outbound|front desk/i.test(`${args.service || ""} ${args.message || ""}`),
    onboarding_plan: "Client onboarding, success measures, and tool access to be confirmed before publication.",
    direct_feedback: true,
    engagement_length: "Long-term preferred",
    start_timing: args.startTime || null,
    status: "pending",
  };
  if (args.recruiterId) payload.recruiter_id = args.recruiterId;

  const { data: job, error } = await args.admin
    .from("jobs")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      const { data: winner, error: winnerError } = await args.admin
        .from("jobs")
        .select("id")
        .eq("lead_id", args.leadId)
        .maybeSingle();
      if (winnerError) throw winnerError;
      if (winner?.id) {
        await updateLeadLink(args, winner.id as string);
        return winner.id as string;
      }
    }
    throw error;
  }

  await updateLeadLink(args, job.id as string);
  return job.id as string;
}
