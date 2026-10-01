import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  bearerTokenFromRequest,
  readRequestJson,
  timingSafeSecretMatches,
} from "@/lib/http-security";

const schema = z.object({
  leadId: z.string().uuid(),
  checkpoint: z.enum(["30m", "2h"]),
});

async function resolveLeadSlaArtifacts(
  admin: ReturnType<typeof createAdminClient>,
  leadId: string,
) {
  const now = new Date().toISOString();
  const href = `/workspace/recruiter/crm/${leadId}`;

  await admin
    .from("recruiter_tasks")
    .update({
      status: "done",
      completed_at: now,
      updated_at: now,
      snoozed_until: null,
    })
    .eq("subject_type", "lead")
    .eq("subject_id", leadId)
    .eq("status", "todo")
    .ilike("title", "Lead SLA%");

  await admin
    .from("notifications")
    .update({
      done_at: now,
      read_at: now,
      snoozed_until: null,
    })
    .eq("type", "lead_sla")
    .eq("href", href)
    .is("done_at", null);
}

async function resolveAssignee(
  admin: ReturnType<typeof createAdminClient>,
  lead: { id: string; owner_id: string | null; job_id: string | null },
) {
  if (lead.owner_id) return lead.owner_id;

  const { data: recruiter } = await admin
    .from("profiles")
    .select("id")
    .eq("role", "recruiter")
    .eq("account_status", "active")
    .order("full_name", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!recruiter?.id) return null;

  await admin
    .from("lead_intake")
    .update({ owner_id: recruiter.id })
    .eq("id", lead.id)
    .is("owner_id", null);

  const { data: currentLead } = await admin
    .from("lead_intake")
    .select("owner_id")
    .eq("id", lead.id)
    .maybeSingle();
  const assigneeId = currentLead?.owner_id || recruiter.id;

  if (lead.job_id) {
    await admin
      .from("jobs")
      .update({ recruiter_id: assigneeId })
      .eq("id", lead.job_id)
      .is("recruiter_id", null);
  }

  return assigneeId as string;
}

export async function POST(request: Request) {
  const expectedSecret = process.env.AUTOMATION_CALLBACK_SECRET?.trim() || "";
  if (expectedSecret.length < 32) {
    return NextResponse.json({ error: "Automation callback is not configured" }, { status: 503 });
  }

  if (!timingSafeSecretMatches(bearerTokenFromRequest(request), expectedSecret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let parsed: z.infer<typeof schema>;
  try {
    parsed = schema.parse(await readRequestJson(request, 4096));
  } catch {
    return NextResponse.json({ error: "Invalid automation payload" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: lead, error } = await admin
    .from("lead_intake")
    .select(
      "id,lead_type,owner_id,job_id,name,company,email,service,crm_stage,first_contact_at,discovery_scheduled_at,created_at",
    )
    .eq("id", parsed.leadId)
    .maybeSingle();

  if (error) {
    console.error("[automation] lead SLA lookup failed", {
      leadId: parsed.leadId,
      code: error.code,
    });
    return NextResponse.json({ error: "Lead lookup failed" }, { status: 500 });
  }

  if (!lead || lead.lead_type !== "client_hiring") {
    return NextResponse.json({ ok: true, done: true, reason: "not_hiring_lead" });
  }

  if (
    lead.first_contact_at ||
    ["won", "lost"].includes(String(lead.crm_stage || "new")) ||
    lead.discovery_scheduled_at
  ) {
    await resolveLeadSlaArtifacts(admin, lead.id);
    return NextResponse.json({
      ok: true,
      done: true,
      reason: lead.first_contact_at
        ? "contacted"
        : lead.discovery_scheduled_at
          ? "discovery_scheduled"
          : "closed",
    });
  }

  const assigneeId = await resolveAssignee(admin, lead);
  if (!assigneeId) {
    return NextResponse.json({ ok: true, done: false, reason: "no_active_recruiter" });
  }

  const now = new Date().toISOString();
  const priority = parsed.checkpoint === "2h" ? "urgent" : "high";
  const subject = String(lead.company || lead.name || lead.email || "Client lead").slice(0, 110);
  const href = `/workspace/recruiter/crm/${lead.id}`;
  const description =
    parsed.checkpoint === "2h"
      ? "This hiring lead is still missing human recruiter contact two hours after intake. Open the lead, contact the client now, and record the next step."
      : "The automatic acknowledgement was sent, but no human recruiter contact has been recorded within 30 minutes. Open the lead and make contact.";

  const { data: existingTask } = await admin
    .from("recruiter_tasks")
    .select("id")
    .eq("subject_type", "lead")
    .eq("subject_id", lead.id)
    .eq("status", "todo")
    .ilike("title", "Lead SLA%")
    .limit(1)
    .maybeSingle();

  let taskError = null;
  if (existingTask?.id) {
    const result = await admin
      .from("recruiter_tasks")
      .update({
        priority,
        description,
        assignee_id: assigneeId,
        due_at: now,
        updated_at: now,
        snoozed_until: null,
      })
      .eq("id", existingTask.id);
    taskError = result.error;
  } else {
    const result = await admin.from("recruiter_tasks").insert({
      title: `Lead SLA · recruiter contact overdue · ${subject}`,
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
    console.error("[automation] lead SLA task write failed", {
      leadId: lead.id,
      code: taskError.code,
    });
    return NextResponse.json({ error: "SLA task write failed" }, { status: 500 });
  }

  await admin
    .from("notifications")
    .update({ done_at: now, read_at: now, snoozed_until: null })
    .eq("user_id", assigneeId)
    .eq("type", "lead_sla")
    .eq("href", href)
    .is("done_at", null);

  const { error: notificationError } = await admin.from("notifications").insert({
    user_id: assigneeId,
    type: "lead_sla",
    priority,
    title:
      parsed.checkpoint === "2h"
        ? `Urgent: lead still uncontacted · ${subject}`
        : `Recruiter contact overdue · ${subject}`,
    body: description,
    href,
  });

  if (notificationError) {
    console.error("[automation] lead SLA notification write failed", {
      leadId: lead.id,
      code: notificationError.code,
    });
    return NextResponse.json({ error: "SLA notification write failed" }, { status: 500 });
  }

  await admin.from("recruiter_activity").insert({
    subject_type: "lead",
    subject_id: lead.id,
    action:
      parsed.checkpoint === "2h"
        ? "lead_sla_escalated_2h"
        : "lead_sla_escalated_30m",
    description,
    actor_id: null,
    metadata: {
      automation: "trigger.dev",
      checkpoint: parsed.checkpoint,
      assignee_id: assigneeId,
    },
  });

  return NextResponse.json({
    ok: true,
    done: parsed.checkpoint === "2h",
    action: parsed.checkpoint === "2h" ? "urgent_escalation" : "contact_reminder",
  });
}
