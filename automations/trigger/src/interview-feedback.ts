import { task, wait } from "@trigger.dev/sdk";

type InterviewFeedbackPayload = {
  interviewId: string;
  scheduledAt: string;
  durationMinutes: number;
};

async function callback(
  payload: InterviewFeedbackPayload,
  checkpoint: "2h" | "24h",
) {
  const secret = process.env.AUTOMATION_CALLBACK_SECRET?.trim() || "";
  const base = (
    process.env.VAPH_APP_URL || "https://virtualassistant.com.ph"
  ).replace(/\/$/, "");
  if (secret.length < 32) {
    throw new Error("AUTOMATION_CALLBACK_SECRET is not configured.");
  }

  const response = await fetch(
    `${base}/api/internal/automation/hiring-pipeline`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        kind: "interview_feedback",
        interviewId: payload.interviewId,
        scheduledAt: payload.scheduledAt,
        checkpoint,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      `VAPH interview feedback callback failed with status ${response.status}.`,
    );
  }
  return response.json() as Promise<{ done?: boolean }>;
}

export const interviewFeedbackTask = task({
  id: "vaph-interview-feedback",
  run: async (payload: InterviewFeedbackPayload) => {
    const scheduledMs = new Date(payload.scheduledAt).getTime();
    if (!Number.isFinite(scheduledMs)) {
      throw new Error("Interview schedule is invalid.");
    }

    const durationMinutes = Math.max(
      15,
      Math.min(120, Number(payload.durationMinutes || 30)),
    );
    const firstAt = new Date(
      scheduledMs + durationMinutes * 60_000 + 2 * 60 * 60_000,
    );
    if (firstAt.getTime() > Date.now()) await wait.until({ date: firstAt });

    const first = await callback(payload, "2h");
    if (first.done) return first;

    await wait.for({ hours: 22 });
    return callback(payload, "24h");
  },
});
