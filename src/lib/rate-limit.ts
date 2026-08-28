import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export async function enforceActionRateLimit(actionKey: string, subject: string, maxAttempts: number, windowMinutes: number) {
  const normalized = subject.trim().toLowerCase();
  if (!normalized) return;
  const subjectHash = createHash("sha256").update(normalized).digest("hex");
  const admin = createAdminClient();
  const now = new Date();
  const { data } = await admin.from("action_rate_limits").select("id,attempts,window_started_at").eq("action_key", actionKey).eq("subject_hash", subjectHash).maybeSingle();
  if (!data) {
    await admin.from("action_rate_limits").insert({ action_key: actionKey, subject_hash: subjectHash, attempts: 1, window_started_at: now.toISOString(), updated_at: now.toISOString() });
    return;
  }
  const ageMs = now.getTime() - new Date(data.window_started_at).getTime();
  if (ageMs > windowMinutes * 60_000) {
    await admin.from("action_rate_limits").update({ attempts: 1, window_started_at: now.toISOString(), updated_at: now.toISOString() }).eq("id", data.id);
    return;
  }
  if (Number(data.attempts) >= maxAttempts) throw new Error("Too many attempts. Please wait a few minutes and try again.");
  await admin.from("action_rate_limits").update({ attempts: Number(data.attempts) + 1, updated_at: now.toISOString() }).eq("id", data.id);
}
