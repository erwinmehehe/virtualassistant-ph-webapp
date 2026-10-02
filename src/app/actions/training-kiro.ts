"use server";

import { requireAuthenticatedUserFast } from "@/lib/auth";
import { answerTrainingKiro } from "@/lib/ai-training-kiro";
import { recordProductEvent } from "@/lib/product-events";

export async function askTrainingKiroAction(input: { question: string }) {
  const { userId } = await requireAuthenticatedUserFast("/workspace/training");
  const question = String(input.question || "").replace(/\s+/g, " ").trim().slice(0, 600);
  if (question.length < 2) {
    return { ok: false as const, answer: "Ask me a question about your courses, progress, certificates, saved courses, or what to learn next.", actionLabel: null, actionHref: null };
  }

  const result = await answerTrainingKiro(userId, question);

  await recordProductEvent("training_kiro_question", {
    userId,
    path: "/workspace/training",
    metadata: {
      source: result.source,
      has_action: Boolean(result.actionHref),
    },
  });

  return {
    ok: true as const,
    answer: result.answer,
    actionLabel: result.actionLabel,
    actionHref: result.actionHref,
  };
}
