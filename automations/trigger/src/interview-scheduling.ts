import { task, wait } from "@trigger.dev/sdk";

type InterviewSchedulingPayload = {
  interviewId: string;
  requestedAt: string;
};

async function callback(
  payload: InterviewSchedulingPayload,
  checkpoint: "4h" | "24h",
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
        kind: "interview_scheduling",
        interviewId: payload.interviewId,
        requestedAt: payload.requestedAt,
        checkpoint,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      `VAPH interview scheduling callback failed with status ${response.status}.`,
    );
  }
  return response.json() as Promise<{ done?: boolean }>;
}

export const interviewSchedulingTask = task({
  id: "vaph-interview-scheduling",
  run: async (payload: InterviewSchedulingPayload) => {
    const requestedMs = new Date(payload.requestedAt).getTime();
    if (!Number.isFinite(requestedMs)) {
      throw new Error("Interview request time is invalid.");
    }

    const firstAt = new Date(requestedMs + 4 * 60 * 60_000);
    if (firstAt.getTime() > Date.now()) await wait.until({ date: firstAt });

    const first = await callback(payload, "4h");
    if (first.done) return first;

    await wait.for({ hours: 20 });
    return callback(payload, "24h");
  },
});
