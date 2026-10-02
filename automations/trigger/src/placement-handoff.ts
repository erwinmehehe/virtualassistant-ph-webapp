import { task, wait } from "@trigger.dev/sdk";

type PlacementHandoffPayload = {
  workroomId: string;
  createdAt: string;
};

export const placementHandoffTask = task({
  id: "vaph-placement-handoff",
  run: async (payload: PlacementHandoffPayload) => {
    const createdMs = new Date(payload.createdAt).getTime();
    if (!Number.isFinite(createdMs)) {
      throw new Error("Workroom creation time is invalid.");
    }

    const dueAt = new Date(createdMs + 24 * 60 * 60_000);
    if (dueAt.getTime() > Date.now()) await wait.until({ date: dueAt });

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
        kind: "placement_handoff",
        workroomId: payload.workroomId,
        createdAt: payload.createdAt,
        checkpoint: "24h",
      }),
    });

    if (!response.ok) {
      throw new Error(
        `VAPH placement handoff callback failed with status ${response.status}.`,
      );
    }

    return response.json();
  },
});
