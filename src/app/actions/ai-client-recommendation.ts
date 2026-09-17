"use server";

import { revalidatePath } from "next/cache";
import { requireAnyRole } from "@/lib/auth";
import { generateClientRecommendation } from "@/lib/ai-client-recommendation";
import { matchAssessment } from "@/lib/matching";
import { writeRecruiterActivity } from "@/lib/recruiter-activity";
import { createAdminClient } from "@/lib/supabase/admin";

function normalized(values: unknown) {
  return new Set((Array.isArray(values) ? values : []).map((value) => String(value).trim().toLowerCase()).filter(Boolean));
}

function verifiedEvidence(job: any, va: any) {
  const evidence: string[] = [];
  const jobCategories = normalized(job.categories);
  const vaCategories = [va.primary_category, ...(Array.isArray(va.categories) ? va.categories : [])].filter(Boolean).map((value) => String(value));
  if (vaCategories.some((value) => jobCategories.has(value.trim().toLowerCase()))) evidence.push("Relevant specialty matches the role category");

  const vaSkills = normalized(va.skills);
  const skillMatches = (Array.isArray(job.required_skills) ? job.required_skills : []).filter((value: unknown) => vaSkills.has(String(value).trim().toLowerCase()));
  if (skillMatches.length) evidence.push(`Matching required skills: ${skillMatches.slice(0, 4).join(", ")}`);

  const vaTools = normalized(va.tools);
  const toolMatches = (Array.isArray(job.required_tools) ? job.required_tools : []).filter((value: unknown) => vaTools.has(String(value).trim().toLowerCase()));
  if (toolMatches.length) evidence.push(`Matching required tools: ${toolMatches.slice(0, 4).join(", ")}`);

  if (va.availability_status === "available") evidence.push("VA profile currently shows available");
  if (job.hours_per_week && va.weekly_hours && Number(va.weekly_hours) >= Number(job.hours_per_week)) evidence.push(`VA profile shows ${Number(va.weekly_hours)} hours/week available for a ${Number(job.hours_per_week)} hours/week role`);
  if (job.overlap_hours && va.overlap_hours && Number(va.overlap_hours) >= Number(job.overlap_hours)) evidence.push("VA profile covers the role's required overlap hours");
  return evidence.slice(0, 8);
}

export async function generateClientRecommendationAction(formData: FormData) {
  const { user, profile } = await requireAnyRole(["admin", "recruiter"]);
  const jobId = String(formData.get("job_id") || "");
  const vaId = String(formData.get("va_id") || "");
  if (!jobId || !vaId) return { ok: false as const, error: "Role and VA are required." };

  const admin = createAdminClient();
  const [{ data: job }, { data: va }, { data: vetting }, { data: existing }] = await Promise.all([
    admin.from("jobs").select("*").eq("id", jobId).maybeSingle(),
    admin.from("va_profiles").select("*").eq("user_id", vaId).maybeSingle(),
    admin.from("va_vetting").select("stage").eq("va_id", vaId).maybeSingle(),
    admin.from("job_shortlist_candidates").select("shortlist_status,released_at").eq("job_id", jobId).eq("va_id", vaId).maybeSingle()
  ]);

  if (!job || !va) return { ok: false as const, error: "Role or VA profile was not found." };
  if (!vetting || !["approved", "bench"].includes(vetting.stage)) return { ok: false as const, error: "This VA is no longer approved for client matching." };

  try {
    const generated = await generateClientRecommendation({
      role: {
        title: job.title,
        summary: job.summary || null,
        responsibilities: Array.isArray(job.responsibilities) ? job.responsibilities : [],
        requiredSkills: Array.isArray(job.required_skills) ? job.required_skills : [],
        requiredTools: Array.isArray(job.required_tools) ? job.required_tools : [],
        hoursPerWeek: job.hours_per_week ?? null,
        timezone: job.timezone || null,
        overlapHours: job.overlap_hours ?? null
      },
      va: {
        headline: va.headline || null,
        primaryCategory: va.primary_category || null,
        categories: Array.isArray(va.categories) ? va.categories : [],
        skills: Array.isArray(va.skills) ? va.skills : [],
        tools: Array.isArray(va.tools) ? va.tools : [],
        availabilityStatus: va.availability_status || null,
        weeklyHours: va.weekly_hours ?? null,
        overlapHours: va.overlap_hours ?? null,
        preferredTimezone: va.preferred_timezone || null
      },
      verifiedEvidence: verifiedEvidence(job, va)
    });

    if (!generated) return { ok: false as const, error: "AI recommendation is unavailable right now. You can still write the client note manually." };

    const assessment = matchAssessment(job, va);
    const status = existing?.shortlist_status === "released" ? "released" : "proposed";
    const { error } = await admin.from("job_shortlist_candidates").upsert({
      job_id: jobId,
      va_id: vaId,
      match_score: assessment.score,
      match_confidence: assessment.confidence,
      shortlist_status: status,
      client_recommendation: generated.recommendation,
      created_by: user.id,
      released_at: status === "released" ? existing?.released_at || new Date().toISOString() : null
    }, { onConflict: "job_id,va_id" });
    if (error) throw error;

    try {
      await writeRecruiterActivity({
        subjectType: "va",
        subjectId: vaId,
        action: "ai_client_recommendation_generated",
        description: `Generated a client-facing recommendation for ${job.title}`,
        actorId: user.id,
        metadata: { job_id: jobId, model: generated.model }
      });
    } catch {}

    const returnTo = profile.role === "recruiter" ? `/workspace/recruiter/matching/${jobId}` : `/workspace/admin/jobs/${jobId}`;
    revalidatePath(returnTo);
    if (status === "released") revalidatePath("/workspace/client/candidates");
    return { ok: true as const, recommendation: generated.recommendation };
  } catch (error) {
    console.error("AI client recommendation generation failed", error);
    return { ok: false as const, error: "Could not generate the recommendation. You can retry or write the client note manually." };
  }
}
