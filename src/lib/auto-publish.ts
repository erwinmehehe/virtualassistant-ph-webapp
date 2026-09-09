import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { MIN_HOURLY_RATE } from "@/lib/constants";

/**
 * Safely automates only the quoting step for straightforward curated
 * placements. A pending role never becomes published here. Publication is
 * reserved for an explicit client acceptance event.
 */
export async function autoQuoteStraightforwardJobs() {
  const admin = createAdminClient();

  const [{ data: settings }, { data: pendingJobs }, { data: commercials }] = await Promise.all([
    admin.from("admin_settings").select("default_placement_fee").eq("id", 1).maybeSingle(),
    admin.from("jobs").select("id,client_id,title,service_model,min_hourly_rate").eq("status", "pending"),
    admin.from("job_commercials").select("job_id,commercial_status")
  ]);
  const fee = Number(settings?.default_placement_fee || 0);
  if (fee <= 0) return { quoted: 0, skippedManaged: 0, skippedUnlinked: 0, reason: "no_default_fee" as const };

  const commercialMap = new Map((commercials || []).map((row: any) => [row.job_id, row.commercial_status]));
  const needsQuote = (status: string | undefined) => !status;
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
  for (const [jobId, status] of commercialMap) {
    if (status && acceptedStatuses.has(status)) {
      const clientId = jobIdToClientId.get(jobId);
      if (clientId) clientsWithPriorPlacement.add(clientId);
    }
  }

  let quoted = 0;
  for (const job of eligible) {
    const isFirstPlacement = !clientsWithPriorPlacement.has(job.client_id);
    const effectiveFee = isFirstPlacement ? 0 : fee;
    clientsWithPriorPlacement.add(job.client_id);

    const { error } = await admin.from("job_commercials").upsert({
      job_id: job.id,
      service_model: "curated_placement",
      placement_fee: effectiveFee,
      commercial_status: "quoted",
      notes: isFirstPlacement ? "Free first placement offer. Client acceptance still required before publication." : null
    }, { onConflict: "job_id" });
    if (error) continue;

    await admin.from("notifications").insert({
      user_id: job.client_id,
      title: "Your hiring request is ready for approval",
      body: isFirstPlacement
        ? `"${job.title}" has been reviewed. Your first placement fee is waived. Review and approve the terms to start recruiting.`
        : `"${job.title}" has been reviewed with a USD ${effectiveFee.toFixed(2)} placement fee. Review and approve the terms to start recruiting.`,
      href: `/workspace/client/jobs/${job.id}`
    });
    quoted += 1;
  }

  return { quoted, skippedManaged, skippedUnlinked, reason: null as null };
}
