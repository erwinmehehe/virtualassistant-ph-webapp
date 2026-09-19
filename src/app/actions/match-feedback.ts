"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { isMatchFeedbackValue, matchFeedbackLabel } from "@/lib/match-feedback";

/**
 * "Not quite right?" on the hiring-form success screen. The screen is public
 * and the lead id comes from the client's own redirect, so this is deliberately
 * narrow: a known lead id, a fixed vocabulary, a short window after the brief,
 * and nothing free-text. It turns a silent bounce into a preference the
 * recruiter sees before the first call.
 */

export type MatchFeedbackState = { status: "idle" | "saved" | "error"; message?: string };

const FEEDBACK_WINDOW_DAYS = 30;
const MAX_REASONS = 3;

const schema = z.object({
  lead: z.string().uuid(),
  reasons: z.array(z.string()).min(1).max(MAX_REASONS)
});

export async function submitMatchFeedbackAction(_previousState: MatchFeedbackState, formData: FormData): Promise<MatchFeedbackState> {
  const parsed = schema.safeParse({
    lead: formData.get("lead"),
    reasons: formData.getAll("reason").map(String).filter(isMatchFeedbackValue)
  });
  if (!parsed.success) return { status: "error", message: "Pick at least one reason." };

  try {
    const admin = createAdminClient();
    const since = new Date(Date.now() - FEEDBACK_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const { data: lead } = await admin
      .from("lead_intake")
      .select("id")
      .eq("id", parsed.data.lead)
      .gte("created_at", since)
      .maybeSingle();
    if (!lead) return { status: "error", message: "We could not attach that to your request." };

    const reasons = [...new Set(parsed.data.reasons)].slice(0, MAX_REASONS);
    const { error } = await admin
      .from("lead_intake")
      .update({ match_feedback: reasons, match_feedback_at: new Date().toISOString() })
      .eq("id", lead.id);
    if (error) return { status: "error", message: "We could not save that. Your request is still with our team." };

    return { status: "saved", message: `Noted: ${reasons.map(matchFeedbackLabel).join(", ").toLowerCase()}.` };
  } catch {
    return { status: "error", message: "We could not save that. Your request is still with our team." };
  }
}
