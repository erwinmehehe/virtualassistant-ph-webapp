"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { inferCategories } from "@/lib/category-inference";

type VaCategoryRepairRow = {
  user_id: string;
  headline: string | null;
  bio: string | null;
  categories: string[] | null;
  skills: string[] | null;
  tools: string[] | null;
  industries: string[] | null;
};

export async function autoCategorizeUncategorizedVasAction() {
  await requireRole("recruiter");
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("va_profiles")
    .select("user_id,headline,bio,categories,skills,tools,industries")
    .is("primary_category", null)
    .limit(2000);
  if (error) throw error;

  const rows = (data || []) as VaCategoryRepairRow[];
  if (!rows.length) {
    redirect("/workspace/recruiter/roles?categorized=0&skipped=0#talent-coverage");
  }

  const ids = rows.map((row) => row.user_id);
  const { data: vettingRows, error: vettingError } = await admin
    .from("va_vetting")
    .select("va_id,stage")
    .in("va_id", ids);
  if (vettingError) throw vettingError;

  const stageByVa = new Map((vettingRows || []).map((row) => [String(row.va_id), String(row.stage || "")]));
  let categorized = 0;
  let skipped = 0;

  for (const row of rows) {
    const stage = stageByVa.get(row.user_id) || "";
    if (["approved", "bench"].includes(stage)) {
      skipped += 1;
      continue;
    }

    const inferred = inferCategories(
      row.headline,
      row.bio,
      ...(row.categories || []),
      ...(row.skills || []),
      ...(row.tools || []),
      ...(row.industries || [])
    );
    if (!inferred.length) {
      skipped += 1;
      continue;
    }

    const additional = [...new Set([
      ...(row.categories || []),
      ...inferred.slice(1)
    ])]
      .filter((category) => category !== inferred[0])
      .slice(0, 3);

    const { data: updated, error: updateError } = await admin
      .from("va_profiles")
      .update({
        primary_category: inferred[0],
        categories: additional
      })
      .eq("user_id", row.user_id)
      .is("primary_category", null)
      .select("user_id")
      .maybeSingle();

    if (updateError) throw updateError;
    if (updated) categorized += 1;
    else skipped += 1;
  }

  revalidatePath("/workspace/recruiter/roles");
  revalidatePath("/workspace/recruiter/talent");
  redirect(`/workspace/recruiter/roles?categorized=${categorized}&skipped=${skipped}#talent-coverage`);
}
