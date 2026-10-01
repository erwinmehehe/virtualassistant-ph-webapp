import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ensureDiscoveryOutcomeNextAction,
  resolveDiscoveryOutcomeArtifacts,
} from "@/lib/discovery-outcome-automation";
import {
  bearerTokenFromRequest,
  readRequestJson,
  timingSafeSecretMatches,
} from "@/lib/http-security";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  leadId: z.string().uuid(),
  scheduledAt: z.string().datetime({ offset: true }),
  checkpoint: z.enum(["outcome_due", "outcome_overdue"]),
});

function sameInstant(left?: string | null, right?: string | null) {
  if (!left || !right) return false;
  const a = new Date(left).getTime();
  const b = new Date(right).getTime();
  return Number.isFinite(a) && Number.isFinite(b) && a === b;
}

async function assigneeForLead(
  admin: ReturnType<typeof createAdminClient>,
  ownerId?: string | null,
) {
  if (ownerId) {
    const { data: owner } = await admin
      .from("profiles")
      .select("id,role,account_status")
      .eq("id", ownerId)
      .maybeSingle();
    if (
      owner &&
      ["recruiter", "admin"].includes(String(owner.role)) &&
      owner.account_status === "active"
    ) {
      return owner.id as string;
    }
  }

  const { data: fallback } = await admin
    .from("profiles")
    .select("id")
    .in("role", ["recruiter", "admin"])
    .eq("account_status", "active")
    .order("full_name", { ascending: true })
    .limit(1)
    .maybeSingle();

  return (fallback?.id as string | undefined) || null;
}

export async function POST(request: Request) {
  const expectedSecret = process.env.AUTOMATION_CALLBACK_SECRET?.trim() || "";
  if (expectedSecret.length < 32) {
    return NextResponse.json(
      { error: "Automation callback is not configured" },
      { status: 503 },
    );
  }

  if (
    !timingSafeSecretMatches(
      bearerTokenFromRequest(request),
      expectedSecret,
    )
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let parsed: z.infer<typeof schema>;
  try {
    parsed = schema.parse(await readRequestJson(request, 4096));
  } catch {
    return NextResponse.json(
      { error: "Invalid automation payload" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const { data: lead, error } = await admin
    .from("lead_intake")
    .select(
      "id,lead_type,name,email,company,owner_id,crm_stage,discovery_scheduled_at,discovery_duration_minutes,discovery_completed_at,discovery_cancelled_at,discovery_outcome",
    )
    .eq("id", parsed.leadId)
    .maybeSingle();

  if (error) {
    console.error("[automation] discovery outcome lookup failed", {
      leadId: parsed.leadId,
      code: error.code,
    });
    return NextResponse.json(
      { error: "Discovery lookup failed" },
      { status: 500 },
    );
  }

  if (!lead || lead.lead_type !== "client_hiring") {
    return NextResponse.json({
      ok: true,
      done: true,
      reason: "not_hiring_lead",
    });
  }

  const stage = String(lead.crm_stage || "new");
  const outcome = String(lead.discovery_outcome || "");
  const terminal =
    Boolean(lead.discovery_cancelled_at) ||
    ["cancelled"].includes(outcome) ||
    ["won", "lost"].includes(stage);

  if (terminal) {
    await resolveDiscoveryOutcomeArtifacts(admin, lead.id);
    return NextResponse.json({
      ok: true,
      done: true,
      reason: "discovery_closed",
    });
  }

  if (!sameInstant(lead.discovery_scheduled_at, parsed.scheduledAt)) {
    return NextResponse.json({
      ok: true,
      done: true,
      reason: "stale_schedule",
    });
  }

  if (
    lead.discovery_completed_at ||
    ["qualified", "attended", "no_show"].includes(outcome)
  ) {
    const next = await ensureDiscoveryOutcomeNextAction({
      admin,
      leadId: lead.id,
      ownerId: lead.owner_id,
      subject: lead.company || lead.name || lead.email || "Client",
      outcome,
    });
    return NextResponse.json({
      ok: true,
      done: true,
      reason: "outcome_recorded",
      nextAction: next.reason,
    });
  }

  const assigneeId = await assigneeForLead(admin, lead.owner_id);
  if (!assigneeId) {
    return NextResponse.json({
      ok: true,
      done: parsed.checkpoint === "outcome_overdue",
      reason: "no_active_assignee",
    });
  }

  const now = new Date().toISOString();
  const priority =
    parsed.checkpoint === "outcome_overdue" ? "urgent" : "high";
  const subject = String(
    lead.company || lead.name || lead.email || "Client",
  ).slice(0, 110);
  const href = `/workspace/recruiter/crm/${lead.id}/discovery`;
  const description =
    parsed.checkpoint === "outcome_overdue"
      ? "The discovery call ended more than two hours ago and still has no outcome. Record qualified, follow-up, no-show, nurture, or lost now so the hiring pipeline can continue."
      : "The discovery call has ended and no outcome has been recorded. Add the outcome and next step while the conversation is still fresh.";

  const { data: existing } = await admin
    .from("recruiter_tasks")
    .select("id")
    .eq("subject_type", "lead")
    .eq("subject_id", lead.id)
    .eq("status", "todo")
    .ilike("title", "Discovery outcome due%")
    .limit(1)
    .maybeSingle();

  let taskError = null;
  if (existing?.id) {
    const result = await admin
      .from("recruiter_tasks")
      .update({
        title: `Discovery outcome due · ${subject}`,
        description,
        assignee_id: assigneeId,
        href,
        priority,
        due_at: now,
        updated_at: now,
        snoozed_until: null,
      })
      .eq("id", existing.id);
    taskError = result.error;
  } else {
    const result = await admin.from("recruiter_tasks").insert({
      title: `Discovery outcome due · ${subject}`,
      description,
      assignee_id: assigneeId,
      subject_type: "lead",
      subject_id: lead.id,
      href,
      priority,
      status: "todo",
      repeat_rule: "none",
      due_at: now,
    });
    taskError = result.error;
  }

  if (taskError) {
    console.error("[automation] discovery outcome task write failed", {
      leadId: lead.id,
      code: taskError.code,
    });
    return NextResponse.json(
      { error: "Discovery outcome task write failed" },
      { status: 500 },
    );
  }

  await admin
    .from("notifications")
    .update({
      done_at: now,
      read_at: now,
      snoozed_until: null,
    })
    .eq("user_id", assigneeId)
    .eq("type", "discovery_outcome")
    .eq("href", href)
    .is("done_at", null);

  const { error: notificationError } = await admin
    .from("notifications")
    .insert({
      user_id: assigneeId,
      type: "discovery_outcome",
      priority,
      title:
        parsed.checkpoint === "outcome_overdue"
          ? `Urgent: record discovery outcome · ${subject}`
          : `Record discovery outcome · ${subject}`,
      body: description,
      href,
    });

  if (notificationError) {
    console.error("[automation] discovery outcome notification write failed", {
      leadId: lead.id,
      code: notificationError.code,
    });
    return NextResponse.json(
      { error: "Discovery outcome notification write failed" },
      { status: 500 },
    );
  }

  await admin.from("recruiter_activity").insert({
    subject_type: "lead",
    subject_id: lead.id,
    action:
      parsed.checkpoint === "outcome_overdue"
        ? "discovery_outcome_overdue"
        : "discovery_outcome_due",
    description,
    actor_id: null,
    metadata: {
      automation: "trigger.dev",
      checkpoint: parsed.checkpoint,
      scheduled_at: parsed.scheduledAt,
      assignee_id: assigneeId,
    },
  });

  return NextResponse.json({
    ok: true,
    done: parsed.checkpoint === "outcome_overdue",
    action:
      parsed.checkpoint === "outcome_overdue"
        ? "urgent_outcome_escalation"
        : "outcome_reminder",
  });
}
