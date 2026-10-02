import { task, wait } from "@trigger.dev/sdk";

type PlacementReadinessPayload = {
  workroomId: string;
  handoffAt: string;
  startDate: string;
};

async function callback(
  payload: PlacementReadinessPayload,
  checkpoint: "48h" | "24h",
) {
  const secret = process.env.AUTOMATION_CALLBACK_SECRET?.trim() || "";
  const base = (
    process.env.VAPH_APP_URL || "https://virtualassistant.com.ph"
  ).replace(/\/$/, "");
  if (secret.length < 32) {
    throw new Error("AUTOMATION_CALLBACK_SECRET is not configured.");
  }

  const response = await fetch(`${base}/api/internal/automation/post-hire`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      kind: "placement_readiness",
      workroomId: payload.workroomId,
      handoffAt: payload.handoffAt,
      startDate: payload.startDate,
      checkpoint,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `VAPH placement readiness callback failed with status ${response.status}.`,
    );
  }
  return response.json() as Promise<{ done?: boolean }>;
}

export const placementReadinessTask = task({
  id: "vaph-placement-readiness",
  run: async (payload: PlacementReadinessPayload) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(payload.startDate)) {
      throw new Error("Placement start date is invalid.");
    }

    const startMs = Date.parse(`${payload.startDate}T09:00:00Z`);
    if (!Number.isFinite(startMs)) {
      throw new Error("Placement start date is invalid.");
    }

    const firstAt = new Date(startMs - 48 * 60 * 60_000);
    if (firstAt.getTime() > Date.now()) await wait.until({ date: firstAt });

    const first = await callback(payload, "48h");
    if (first.done) return first;

    const urgentAt = new Date(startMs - 24 * 60 * 60_000);
    if (urgentAt.getTime() > Date.now()) await wait.until({ date: urgentAt });

    return callback(payload, "24h");
  },
});
