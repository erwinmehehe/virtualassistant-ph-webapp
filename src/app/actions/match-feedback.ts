"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { isMatchFeedbackValue, matchFeedbackLabel } from "@/lib/match-feedback";
import { verifySignedCapability } from "@/lib/public-capability";
import { enforceActionRateLimit } from "@/lib/rate-limit";

export type MatchFeedbackState = { status: "idle" | "saved" | "error"; message?: string };

const FEEDBACK_WINDOW_DAYS = 30;
const MAX_REASONS = 3;

const schema = z.object({
  token: z.string().min(40).max(1000),
  reasons: z.array(z.string()).min(1).max(MAX_REASONS),
});

export async function submitMatchFeedbackAction(
  _previousState: MatchFeedbackState,
  formData: FormData,
): Promise<MatchFeedbackState> {
  const parsed = schema.safeParse({
    token: formData.get("token"),
    reasons: formData.getAll("reason").map(String).filter(isMatchFeedbackValue),
  });
  if (!parsed.success) return { status: "error", message: "Pick at least one reason." };

  const capability = verifySignedCapability(parsed.data.token, "match_feedback");
  if (!capability) {
    return { status: "error", message: "That feedback link has expired. Your request is still with our team." };
  }

  try {
    await enforceActionRateLimit("public_match_feedback", parsed.data.token, 4, 60);
  } catch {
    return { status: "error", message: "That feedback was already submitted too many times." };
  }

  try {
    const admin = createAdminClient();
    const since = new Date(Date.now() - FEEDBACK_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const { data: lead } = await admin
      .from("lead_intake")
      .select("id,match_feedback_at")
      .eq("id", capability.subject)
      .gte("created_at", since)
      .maybeSingle();
    if (!lead) return { status: "error", message: "We could not attach that to your request." };

    if (lead.match_feedback_at) {
      return { status: "saved", message: "Your feedback was already recorded." };
    }

    const reasons = [...new Set(parsed.data.reasons)].slice(0, MAX_REASONS);
    const { data: updated, error } = await admin
      .from("lead_intake")
      .update({ match_feedback: reasons, match_feedback_at: new Date().toISOString() })
      .eq("id", lead.id)
      .is("match_feedback_at", null)
      .select("id")
      .maybeSingle();
    if (error) {
      return { status: "error", message: "We could not save that. Your request is still with our team." };
    }
    if (!updated) return { status: "saved", message: "Your feedback was already recorded." };

    return {
      status: "saved",
      message: `Noted: ${reasons.map(matchFeedbackLabel).join(", ").toLowerCase()}.`,
    };
  } catch {
    return { status: "error", message: "We could not save that. Your request is still with our team." };
  }
}
