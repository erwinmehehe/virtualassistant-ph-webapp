import "server-only";

const LEAD_SLA_TASK_ID = "vaph-lead-sla";
const DISCOVERY_OUTCOME_TASK_ID = "vaph-discovery-outcome";
const PROPOSAL_CLOSING_TASK_ID = "vaph-proposal-closing";
const PROPOSAL_VIEWED_TASK_ID = "vaph-proposal-viewed";

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


export async function queueDiscoveryOutcomeAutomation(
  leadId: string,
  scheduledAt: string,
  durationMinutes = 30,
) {
  const triggerSecret = process.env.TRIGGER_SECRET_KEY?.trim() || "";
  const callbackSecret = process.env.AUTOMATION_CALLBACK_SECRET?.trim() || "";
  const scheduledMs = new Date(scheduledAt).getTime();

  if (!Number.isFinite(scheduledMs)) {
    return { queued: false as const, reason: "invalid_schedule" as const };
  }

  if (triggerSecret.length < 20 || callbackSecret.length < 32) {
    return { queued: false as const, reason: "not_configured" as const };
  }

  const scheduleKey = String(scheduledMs);
  const safeDuration = Math.max(15, Math.min(120, Number(durationMinutes || 30)));

  try {
    const response = await fetch(
      `https://api.trigger.dev/api/v1/tasks/${encodeURIComponent(DISCOVERY_OUTCOME_TASK_ID)}/trigger`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${triggerSecret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payload: {
            leadId,
            scheduledAt: new Date(scheduledMs).toISOString(),
            durationMinutes: safeDuration,
          },
          options: {
            idempotencyKey: `discovery-outcome-${leadId}-${scheduleKey}`,
          },
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(2500),
      },
    );

    if (!response.ok) {
      console.warn("[automation] discovery outcome trigger rejected", {
        status: response.status,
        leadId,
      });
      return { queued: false as const, reason: "trigger_rejected" as const };
    }

    return { queued: true as const };
  } catch (error) {
    console.warn("[automation] discovery outcome trigger unavailable", {
      leadId,
      error: error instanceof Error ? error.name : "unknown",
    });
    return { queued: false as const, reason: "trigger_unavailable" as const };
  }
}


export function proposalAutomationConfigured() {
  const triggerSecret = process.env.TRIGGER_SECRET_KEY?.trim() || "";
  const callbackSecret = process.env.AUTOMATION_CALLBACK_SECRET?.trim() || "";
  return (
    process.env.TRIGGER_AUTOMATIONS_ACTIVE === "1" &&
    triggerSecret.length >= 20 &&
    callbackSecret.length >= 32
  );
}

async function queueTriggerTask(args: {
  taskId: string;
  payload: Record<string, unknown>;
  idempotencyKey: string;
  logLabel: string;
  subjectId: string;
}) {
  const triggerSecret = process.env.TRIGGER_SECRET_KEY?.trim() || "";
  const callbackSecret = process.env.AUTOMATION_CALLBACK_SECRET?.trim() || "";

  if (triggerSecret.length < 20 || callbackSecret.length < 32) {
    return { queued: false as const, reason: "not_configured" as const };
  }

  try {
    const response = await fetch(
      `https://api.trigger.dev/api/v1/tasks/${encodeURIComponent(args.taskId)}/trigger`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${triggerSecret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payload: args.payload,
          options: { idempotencyKey: args.idempotencyKey },
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(2500),
      },
    );

    if (!response.ok) {
      console.warn(`[automation] ${args.logLabel} trigger rejected`, {
        status: response.status,
        subjectId: args.subjectId,
      });
      return { queued: false as const, reason: "trigger_rejected" as const };
    }

    return { queued: true as const };
  } catch (error) {
    console.warn(`[automation] ${args.logLabel} trigger unavailable`, {
      subjectId: args.subjectId,
      error: error instanceof Error ? error.name : "unknown",
    });
    return { queued: false as const, reason: "trigger_unavailable" as const };
  }
}

export async function queueProposalClosingAutomation(
  proposalId: string,
  sentAt: string,
) {
  const sentMs = new Date(sentAt).getTime();
  if (!Number.isFinite(sentMs)) {
    return { queued: false as const, reason: "invalid_sent_at" as const };
  }
  const sendKey = String(sentMs);

  return queueTriggerTask({
    taskId: PROPOSAL_CLOSING_TASK_ID,
    payload: {
      proposalId,
      sentAt: new Date(sentMs).toISOString(),
    },
    idempotencyKey: `proposal-closing-${proposalId}-${sendKey}`,
    logLabel: "proposal closing",
    subjectId: proposalId,
  });
}

export async function queueProposalViewedAutomation(
  proposalId: string,
  sentAt: string,
  viewedAt: string,
) {
  const sentMs = new Date(sentAt).getTime();
  const viewedMs = new Date(viewedAt).getTime();
  if (!Number.isFinite(sentMs) || !Number.isFinite(viewedMs)) {
    return { queued: false as const, reason: "invalid_view_state" as const };
  }
  const viewKey = String(viewedMs);

  return queueTriggerTask({
    taskId: PROPOSAL_VIEWED_TASK_ID,
    payload: {
      proposalId,
      sentAt: new Date(sentMs).toISOString(),
      viewedAt: new Date(viewedMs).toISOString(),
    },
    idempotencyKey: `proposal-viewed-${proposalId}-${viewKey}`,
    logLabel: "proposal viewed",
    subjectId: proposalId,
  });
}
