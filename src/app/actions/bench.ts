"use server";

import { revalidatePath } from "next/cache";
import { requireAnyRole } from "@/lib/auth";
import { VA_CATEGORIES } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_BULK_BENCH_ADD = 100;

export async function bulkAddBenchMembersAction(formData: FormData) {
  const { user } = await requireAnyRole(["recruiter", "admin"]);
  const selectedIds = [...new Set(formData.getAll("va_id").map(String).filter(Boolean))];
  const category = String(formData.get("category") ?? "").trim();
  const priority = Number(formData.get("priority") ?? 3);

  if (!selectedIds.length) throw new Error("Select at least one approved VA to add to the talent pool.");
  if (selectedIds.length > MAX_BULK_BENCH_ADD) throw new Error(`Select no more than ${MAX_BULK_BENCH_ADD} VAs at once.`);
  if (!VA_CATEGORIES.includes(category as (typeof VA_CATEGORIES)[number])) throw new Error("Choose a valid talent-pool category.");
  if (!Number.isInteger(priority) || priority < 1 || priority > 5) throw new Error("Choose a priority from 1 to 5.");

  const vaIds = selectedIds;
  const admin = createAdminClient();
  const [{ data: vettingRows, error: vettingError }, { data: existingMemberships, error: membershipLookupError }] = await Promise.all([
    admin.from("va_vetting").select("va_id,stage").in("va_id", vaIds),
    admin.from("bench_memberships").select("va_id").in("va_id", vaIds),
  ]);
  if (vettingError) throw vettingError;
  if (membershipLookupError) throw membershipLookupError;
  if (existingMemberships?.length) throw new Error("One or more selected VAs were already added to the talent pool. Refresh the page and try again.");

  const approvedIds = new Set((vettingRows || [])
    .filter((row: { va_id: string; stage: string }) => ["approved", "bench"].includes(row.stage))
    .map((row: { va_id: string }) => row.va_id));
  if (approvedIds.size !== vaIds.length) throw new Error("One or more selected VAs are no longer approved for the talent pool. Refresh the page and try again.");

  const { error: membershipError } = await admin.from("bench_memberships").upsert(
    vaIds.map((vaId) => ({
      va_id: vaId,
      category,
      status: "active",
      priority,
      notes: null,
      created_by: user.id,
    })),
    { onConflict: "va_id,category" }
  );
  if (membershipError) throw membershipError;

  const { error: stageError } = await admin.from("va_vetting").update({ stage: "bench" }).in("va_id", vaIds);
  if (stageError) throw stageError;

  revalidatePath("/workspace/recruiter/bench");
  revalidatePath("/workspace/admin/vetting");
  revalidatePath("/find-talent");
}
