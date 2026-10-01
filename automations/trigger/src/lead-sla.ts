import { task, wait } from "@trigger.dev/sdk";

type LeadSlaPayload = {
  leadId: string;
};

type Checkpoint = "30m" | "2h";

async function runCheckpoint(leadId: string, checkpoint: Checkpoint) {
  const secret = process.env.AUTOMATION_CALLBACK_SECRET?.trim() || "";
  const base = (process.env.VAPH_APP_URL || "https://virtualassistant.com.ph").replace(/\/$/, "");

  if (secret.length < 32) {
    throw new Error("AUTOMATION_CALLBACK_SECRET is not configured.");
  }

  const response = await fetch(`${base}/api/internal/automation/lead-sla`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ leadId, checkpoint }),
  });

  if (!response.ok) {
    throw new Error(`VAPH lead SLA callback failed with status ${response.status}.`);
  }

  return (await response.json()) as {
    ok: boolean;
    done?: boolean;
    reason?: string;
    action?: string;
  };
}

export const leadSlaTask = task({
  id: "vaph-lead-sla",
  run: async (payload: LeadSlaPayload) => {
    await wait.for({ seconds: 30 * 60 });

    const first = await runCheckpoint(payload.leadId, "30m");
    if (first.done) return first;

    await wait.for({ seconds: 90 * 60 });
    return runCheckpoint(payload.leadId, "2h");
  },
});
