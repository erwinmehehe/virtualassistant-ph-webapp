import { task, wait } from "@trigger.dev/sdk";

type ShortlistReviewPayload = {
  jobId: string;
  releasedAt: string;
};

async function callback(
  payload: ShortlistReviewPayload,
  checkpoint: "24h" | "48h",
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
        kind: "shortlist_review",
        jobId: payload.jobId,
        releasedAt: payload.releasedAt,
        checkpoint,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      `VAPH shortlist review callback failed with status ${response.status}.`,
    );
  }
  return response.json() as Promise<{ done?: boolean }>;
}

export const shortlistReviewTask = task({
  id: "vaph-shortlist-review",
  run: async (payload: ShortlistReviewPayload) => {
    const releasedMs = new Date(payload.releasedAt).getTime();
    if (!Number.isFinite(releasedMs)) {
      throw new Error("Shortlist release time is invalid.");
    }

    const firstAt = new Date(releasedMs + 24 * 60 * 60_000);
    if (firstAt.getTime() > Date.now()) await wait.until({ date: firstAt });

    const first = await callback(payload, "24h");
    if (first.done) return first;

    await wait.for({ hours: 24 });
    return callback(payload, "48h");
  },
});
