import { task, wait } from "@trigger.dev/sdk";

type ProposalSentPayload = {
  proposalId: string;
  sentAt: string;
};

async function runCheckpoint(
  payload: ProposalSentPayload,
  checkpoint: "sent_24h" | "sent_48h",
) {
  const secret = process.env.AUTOMATION_CALLBACK_SECRET?.trim() || "";
  const base = (
    process.env.VAPH_APP_URL || "https://virtualassistant.com.ph"
  ).replace(/\/$/, "");

  if (secret.length < 32) {
    throw new Error("AUTOMATION_CALLBACK_SECRET is not configured.");
  }

  const response = await fetch(
    `${base}/api/internal/automation/proposal-closing`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        proposalId: payload.proposalId,
        sentAt: payload.sentAt,
        checkpoint,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      `VAPH proposal closing callback failed with status ${response.status}.`,
    );
  }

  return (await response.json()) as {
    ok: boolean;
    done?: boolean;
    reason?: string;
    action?: string;
  };
}

export const proposalClosingTask = task({
  id: "vaph-proposal-closing",
  run: async (payload: ProposalSentPayload) => {
    const sentMs = new Date(payload.sentAt).getTime();
    if (!Number.isFinite(sentMs)) {
      throw new Error("Proposal sent time is invalid.");
    }

    const firstAt = new Date(sentMs + 24 * 60 * 60_000);
    if (firstAt.getTime() > Date.now()) {
      await wait.until({ date: firstAt });
    }

    const first = await runCheckpoint(payload, "sent_24h");
    if (first.done) return first;

    await wait.for({ hours: 24 });
    return runCheckpoint(payload, "sent_48h");
  },
});
