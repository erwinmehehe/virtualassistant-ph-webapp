"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { inferCategoriesFromProfile, inferPrimaryCategoryFromProfile } from "@/lib/category-inference";

type VaCategoryRepairRow = {
  user_id: string;
  headline: string | null;
  bio: string | null;
  primary_category: string | null;
  categories: string[] | null;
  skills: string[] | null;
  tools: string[] | null;
  industries: string[] | null;
};

const listKey = (value: string[] | null | undefined) => [...(value || [])].map(String).sort().join("\u0000");

export async function autoCategorizeUncategorizedVasAction() {
  await requireRole("recruiter");
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("va_profiles")
    .select("user_id,headline,bio,primary_category,categories,skills,tools,industries")
    .limit(2000);
  if (error) throw error;

  const rows = (data || []) as VaCategoryRepairRow[];
  if (!rows.length) {
    redirect("/workspace/recruiter/roles?categorized=0&skipped=0#talent-coverage");
  }

  const ids = rows.map((row) => row.user_id);
  const [
    { data: vettingRows, error: vettingError },
    { data: overrideRows, error: overrideError },
  ] = await Promise.all([
    admin.from("va_vetting").select("va_id,stage").in("va_id", ids),
    admin
      .from("recruiter_activity")
      .select("subject_id")
      .eq("subject_type", "va")
      .eq("action", "va_categories_recruiter_override")
      .in("subject_id", ids),
  ]);
  if (vettingError) throw vettingError;
  if (overrideError) throw overrideError;

  const stageByVa = new Map((vettingRows || []).map((row) => [String(row.va_id), String(row.stage || "")]));
  const recruiterOverrideIds = new Set((overrideRows || []).map((row) => String(row.subject_id)));
  let categorized = 0;
  let skipped = 0;

  for (const row of rows) {
    if (recruiterOverrideIds.has(row.user_id)) {
      skipped += 1;
      continue;
    }

    const inferenceInput = {
      headline: row.headline,
      bio: row.bio,
      skills: row.skills,
      tools: row.tools,
      industries: row.industries,
    };
    const inferred = inferCategoriesFromProfile(inferenceInput);
    const inferredPrimary = inferPrimaryCategoryFromProfile(inferenceInput);
    const stage = stageByVa.get(row.user_id) || "";
    // Recruiter-approved primaries are durable. Everyone else can be corrected
    // by stronger profile evidence during a full classification refresh.
    const primaryLocked = ["approved", "bench"].includes(stage) && Boolean(row.primary_category);
    const resolvedPrimaryCategory = primaryLocked
      ? row.primary_category
      : inferredPrimary || row.primary_category || inferred[0] || null;
    const resolvedCategories = [...new Set([
      ...(resolvedPrimaryCategory ? [resolvedPrimaryCategory] : []),
      ...inferred
    ])].slice(0, 3);

    if (!resolvedPrimaryCategory && !resolvedCategories.length) {
      skipped += 1;
      continue;
    }
    if (
      row.primary_category === resolvedPrimaryCategory
      && listKey(row.categories) === listKey(resolvedCategories)
    ) {
      skipped += 1;
      continue;
    }

    const { error: updateError } = await admin
      .from("va_profiles")
      .update({
        primary_category: resolvedPrimaryCategory,
        categories: resolvedCategories
      })
      .eq("user_id", row.user_id);
    if (updateError) throw updateError;
    categorized += 1;
  }

  revalidatePath("/workspace/recruiter/roles");
  revalidatePath("/workspace/recruiter/talent");
  redirect(`/workspace/recruiter/roles?categorized=${categorized}&skipped=${skipped}#talent-coverage`);
}
