import "server-only";

const LEAD_SLA_TASK_ID = "vaph-lead-sla";

export async function queueLeadSlaAutomation(leadId: string) {
  const triggerSecret = process.env.TRIGGER_SECRET_KEY?.trim() || "";
  const callbackSecret = process.env.AUTOMATION_CALLBACK_SECRET?.trim() || "";

  // Automation is opt-in. Lead capture remains fully functional until the
  // Trigger.dev project and callback secret are configured together.
  if (triggerSecret.length < 20 || callbackSecret.length < 32) {
    return { queued: false as const, reason: "not_configured" as const };
  }

  try {
    const response = await fetch(
      `https://api.trigger.dev/api/v1/tasks/${encodeURIComponent(LEAD_SLA_TASK_ID)}/trigger`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${triggerSecret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payload: { leadId },
          options: {
            idempotencyKey: `lead-sla-${leadId}`,
          },
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(2500),
      },
    );

    if (!response.ok) {
      console.warn("[automation] lead SLA trigger rejected", {
        status: response.status,
        leadId,
      });
      return { queued: false as const, reason: "trigger_rejected" as const };
    }

    return { queued: true as const };
  } catch (error) {
    console.warn("[automation] lead SLA trigger unavailable", {
      leadId,
      error: error instanceof Error ? error.name : "unknown",
    });
    return { queued: false as const, reason: "trigger_unavailable" as const };
  }
}
