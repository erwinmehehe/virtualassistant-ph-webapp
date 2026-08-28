import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { MIN_HOURLY_RATE } from "@/lib/constants";
import { autoReleaseTopMatches } from "@/lib/auto-matching";

/**
 * Shared core of the "auto-publish straightforward jobs" behavior, usable
 * both from the admin-triggered button (which wraps this in requireRole)
 * and from the scheduled cron job (which has no user session at all).
 * Quotes the default placement fee and publishes immediately for
 * curated-placement jobs already linked to a client account -- managed
 * service and unlinked-lead jobs are left for manual review either way.
 */
export async function autoPublishStraightforwardJobs() {
  const admin = createAdminClient();

  const [{ data: settings }, { data: pendingJobs }, { data: commercials }] = await Promise.all([
    admin.from("admin_settings").select("default_placement_fee").eq("id", 1).maybeSingle(),
    admin.from("jobs").select("*").eq("status", "pending"),
    admin.from("job_commercials").select("job_id,commercial_status")
  ]);
  const fee = Number(settings?.default_placement_fee || 0);
  if (fee <= 0) return { published: 0, skippedManaged: 0, skippedUnlinked: 0, reason: "no_default_fee" as const };

  const commercialMap = new Map((commercials || []).map((row: any) => [row.job_id, row.commercial_status]));
  // "Untouched" or previously quoted-but-never-accepted (from before this
  // job also auto-published) are both fair game to finish off here.
  const notYetPublishable = (status: string | undefined) => !status || status === "quoted";
  const eligible = (pendingJobs || []).filter((job: any) =>
    job.service_model !== "managed_service" &&
    job.client_id &&
    notYetPublishable(commercialMap.get(job.id)) &&
    job.min_hourly_rate != null &&
    Number(job.min_hourly_rate) >= MIN_HOURLY_RATE
  );
  const skippedManaged = (pendingJobs || []).filter((job: any) => job.service_model === "managed_service" && notYetPublishable(commercialMap.get(job.id))).length;
  const skippedUnlinked = (pendingJobs || []).filter((job: any) => !job.client_id && notYetPublishable(commercialMap.get(job.id))).length;

  // Founding-cohort pricing: a client's very first placement is free, every
  // one after that is charged the normal fee. Built as "first placement
  // free" rather than a blanket $0 default so it stays self-limiting -- no
  // one flag to remember to flip back once volume picks up, and it reads
  // as a real intro offer in the notification rather than "it's just free."
  const clientIds = [...new Set(eligible.map((job: any) => job.client_id))];
  const { data: clientJobs } = clientIds.length ? await admin.from("jobs").select("id,client_id").in("client_id", clientIds) : { data: [] as any[] };
  const jobIdToClientId = new Map((clientJobs || []).map((j: any) => [j.id, j.client_id]));
  const paidStatuses = new Set(["accepted", "invoiced", "paid"]);
  const clientsWithPriorPlacement = new Set<string>();
  for (const [jobId, status] of commercialMap) {
    if (status && paidStatuses.has(status)) {
      const clientId = jobIdToClientId.get(jobId);
      if (clientId) clientsWithPriorPlacement.add(clientId);
    }
  }

  for (const job of eligible) {
    const isFirstPlacement = !clientsWithPriorPlacement.has(job.client_id);
    const effectiveFee = isFirstPlacement ? 0 : fee;
    clientsWithPriorPlacement.add(job.client_id); // a second job for the same client in this same batch is no longer their "first"

    await admin.from("job_commercials").upsert({
      job_id: job.id,
      service_model: "curated_placement",
      placement_fee: effectiveFee,
      commercial_status: "accepted",
      notes: isFirstPlacement ? "Free -- first placement (founding-cohort offer)." : null
    }, { onConflict: "job_id" });
    await admin.from("jobs").update({ status: "published", published_at: new Date().toISOString(), rejection_note: null }).eq("id", job.id);
    await admin.from("notifications").insert({
      user_id: job.client_id,
      title: "Your role is now live",
      body: isFirstPlacement
        ? `"${job.title}" has been published free of charge -- your first placement is on us. Matched candidates will appear as they're found.`
        : `"${job.title}" has been published at a service fee of USD ${effectiveFee.toFixed(2)}. Matched candidates will appear as they're found.`,
      href: `/workspace/client/jobs/${job.id}`
    });
    try {
      await autoReleaseTopMatches(job);
    } catch {
      // Matching is a convenience layer -- publishing must still succeed either way.
    }
  }

  return { published: eligible.length, skippedManaged, skippedUnlinked, reason: null as null };
}
