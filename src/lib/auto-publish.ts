import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { MIN_HOURLY_RATE } from "@/lib/constants";

/**
 * Safely handles straightforward curated placements.
 *
 * Paid placements still require explicit client acceptance before publication.
 * A reviewed first placement with a zero placement fee can publish immediately:
 * the client already submitted the role, and there is no commercial charge left
 * to accept. Managed-service roles never auto-publish here.
 */
export async function autoQuoteStraightforwardJobs() {
  const admin = createAdminClient();

  const [{ data: settings }, { data: pendingJobs }, { data: commercials }] = await Promise.all([
    admin.from("admin_settings").select("default_placement_fee").eq("id", 1).maybeSingle(),
    admin.from("jobs").select("id,client_id,title,service_model,min_hourly_rate").eq("status", "pending"),
    admin.from("job_commercials").select("job_id,commercial_status,placement_fee,service_model")
  ]);
  const fee = Number(settings?.default_placement_fee || 0);
  if (fee <= 0) return { quoted: 0, skippedManaged: 0, skippedUnlinked: 0, reason: "no_default_fee" as const };

  const commercialMap = new Map((commercials || []).map((row: any) => [row.job_id, row]));
  const needsQuote = (row: any | undefined) => !row?.commercial_status;
  const eligible = (pendingJobs || []).filter((job: any) =>
    job.service_model !== "managed_service" &&
    job.client_id &&
    needsQuote(commercialMap.get(job.id)) &&
    job.min_hourly_rate != null &&
    Number(job.min_hourly_rate) >= MIN_HOURLY_RATE
  );
  const skippedManaged = (pendingJobs || []).filter((job: any) => job.service_model === "managed_service" && needsQuote(commercialMap.get(job.id))).length;
  const skippedUnlinked = (pendingJobs || []).filter((job: any) => !job.client_id && needsQuote(commercialMap.get(job.id))).length;

  const clientIds = [...new Set(eligible.map((job: any) => job.client_id))];
  const { data: clientJobs } = clientIds.length
    ? await admin.from("jobs").select("id,client_id").in("client_id", clientIds)
    : { data: [] as any[] };
  const jobIdToClientId = new Map((clientJobs || []).map((job: any) => [job.id, job.client_id]));
  const acceptedStatuses = new Set(["accepted", "invoiced", "paid"]);
  const clientsWithPriorPlacement = new Set<string>();
  for (const [jobId, commercial] of commercialMap) {
    const status = commercial?.commercial_status;
    if (status && acceptedStatuses.has(status)) {
      const clientId = jobIdToClientId.get(jobId);
      if (clientId) clientsWithPriorPlacement.add(clientId);
    }
  }

  let quoted = 0;
  let publishedFree = 0;

  const publishFreePlacement = async (job: any) => {
    const publishedAt = new Date().toISOString();
    await admin.from("job_commercials").update({ commercial_status: "accepted" }).eq("job_id", job.id).eq("commercial_status", "quoted");
    const { data: publishedJob, error } = await admin
      .from("jobs")
      .update({ status: "published", published_at: publishedAt })
      .eq("id", job.id)
      .eq("status", "pending")
      .select("id,client_id,title,categories,required_skills,required_tools,hours_per_week,overlap_hours")
      .maybeSingle();
    if (error || !publishedJob) return false;

    await admin.from("job_candidate_access").upsert({
      job_id: job.id,
      access_status: "comped",
      access_fee: 0,
      currency: "USD",
      unlocked_at: publishedAt
    }, { onConflict: "job_id" });

    await admin.from("notifications").insert({
      user_id: job.client_id,
      title: "Your hiring request is live",
      body: `"${job.title}" passed review. Your first placement fee is waived, so recruiting can begin immediately.`,
      href: `/workspace/client/jobs/${job.id}`
    });

    try {
      const { autoReleaseTopMatches } = await import("@/lib/auto-matching");
      await autoReleaseTopMatches(publishedJob);
    } catch {
      // Matching is a convenience layer; publication must not depend on it.
    }
    publishedFree += 1;
    return true;
  };

  // Recover already-quoted free first placements that were stranded by the old
  // "always wait for another acceptance click" workflow.
  for (const job of pendingJobs || []) {
    const commercial = commercialMap.get(job.id);
    if (
      job.client_id &&
      job.service_model !== "managed_service" &&
      commercial?.commercial_status === "quoted" &&
      Number(commercial?.placement_fee || 0) === 0
    ) {
      await publishFreePlacement(job);
    }
  }

  for (const job of eligible) {
    const isFirstPlacement = !clientsWithPriorPlacement.has(job.client_id);
    const effectiveFee = isFirstPlacement ? 0 : fee;
    clientsWithPriorPlacement.add(job.client_id);

    const { error } = await admin.from("job_commercials").upsert({
      job_id: job.id,
      service_model: "curated_placement",
      placement_fee: effectiveFee,
      commercial_status: "quoted",
      notes: isFirstPlacement ? "Free first placement. Publishes after staff review because no commercial charge remains to accept." : null
    }, { onConflict: "job_id" });
    if (error) continue;

    quoted += 1;
    if (effectiveFee === 0) {
      await publishFreePlacement(job);
      continue;
    }

    await admin.from("notifications").insert({
      user_id: job.client_id,
      title: "Your hiring request is ready for approval",
      body: `"${job.title}" has been reviewed with a USD ${effectiveFee.toFixed(2)} placement fee. Review and approve the terms to start recruiting.`,
      href: `/workspace/client/jobs/${job.id}`
    });
  }

  return { quoted, publishedFree, skippedManaged, skippedUnlinked, reason: null as null };
}
