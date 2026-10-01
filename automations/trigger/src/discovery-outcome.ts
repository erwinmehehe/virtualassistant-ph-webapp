import { task, wait } from "@trigger.dev/sdk";

type DiscoveryOutcomePayload = {
  leadId: string;
  scheduledAt: string;
  durationMinutes: number;
};

type Checkpoint = "outcome_due" | "outcome_overdue";

async function runCheckpoint(
  payload: DiscoveryOutcomePayload,
  checkpoint: Checkpoint,
) {
  const secret = process.env.AUTOMATION_CALLBACK_SECRET?.trim() || "";
  const base = (
    process.env.VAPH_APP_URL || "https://virtualassistant.com.ph"
  ).replace(/\/$/, "");

  if (secret.length < 32) {
    throw new Error("AUTOMATION_CALLBACK_SECRET is not configured.");
  }

  const response = await fetch(
    `${base}/api/internal/automation/discovery-outcome`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        leadId: payload.leadId,
        scheduledAt: payload.scheduledAt,
        checkpoint,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      `VAPH discovery outcome callback failed with status ${response.status}.`,
    );
  }

  return (await response.json()) as {
    ok: boolean;
    done?: boolean;
    reason?: string;
    action?: string;
  };
}

export const discoveryOutcomeTask = task({
  id: "vaph-discovery-outcome",
  run: async (payload: DiscoveryOutcomePayload) => {
    const scheduledMs = new Date(payload.scheduledAt).getTime();
    if (!Number.isFinite(scheduledMs)) {
      throw new Error("Discovery schedule is invalid.");
    }

    const durationMinutes = Math.max(
      15,
      Math.min(120, Number(payload.durationMinutes || 30)),
    );
    const outcomeDueAt = new Date(
      scheduledMs + durationMinutes * 60_000 + 45 * 60_000,
    );

    if (outcomeDueAt.getTime() > Date.now()) {
      await wait.until({ date: outcomeDueAt });
    }

    const first = await runCheckpoint(payload, "outcome_due");
    if (first.done) return first;

    await wait.for({ hours: 2 });
    return runCheckpoint(payload, "outcome_overdue");
  },
});
