import { task, wait } from "@trigger.dev/sdk";

type ProposalViewedPayload = {
  proposalId: string;
  sentAt: string;
  viewedAt: string;
};

export const proposalViewedTask = task({
  id: "vaph-proposal-viewed",
  run: async (payload: ProposalViewedPayload) => {
    const secret = process.env.AUTOMATION_CALLBACK_SECRET?.trim() || "";
    const base = (
      process.env.VAPH_APP_URL || "https://virtualassistant.com.ph"
    ).replace(/\/$/, "");

    if (secret.length < 32) {
      throw new Error("AUTOMATION_CALLBACK_SECRET is not configured.");
    }

    const viewedMs = new Date(payload.viewedAt).getTime();
    if (!Number.isFinite(viewedMs)) {
      throw new Error("Proposal viewed time is invalid.");
    }

    const followUpAt = new Date(viewedMs + 4 * 60 * 60_000);
    if (followUpAt.getTime() > Date.now()) {
      await wait.until({ date: followUpAt });
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
          viewedAt: payload.viewedAt,
          checkpoint: "viewed_4h",
        }),
      },
    );

    if (!response.ok) {
      throw new Error(
        `VAPH proposal viewed callback failed with status ${response.status}.`,
      );
    }

    return response.json();
  },
});
