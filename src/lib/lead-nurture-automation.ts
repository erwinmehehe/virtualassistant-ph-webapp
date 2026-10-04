import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendLeadNurtureEmail } from "@/lib/email";

type Sequence = "nurture" | "winback";

const NEXT_DELAY_DAYS = [30, 60] as const;

function plusDays(value: Date | string, days: number) {
  const date = value instanceof Date ? value : new Date(value);
  return new Date(date.getTime() + days * 86400000).toISOString();
}

function sequenceCopy(sequence: Sequence, step: number, service?: string | null) {
  const role = service?.trim() || "Virtual Assistant";
  if (sequence === "winback") {
    const rows = [
      {
        subject: "Ready to revisit your Virtual Assistant hire?",
        heading: "Your VA search can restart when you’re ready",
        body: `You previously paused your search for a ${role}. If the timing, budget, or role has changed, reply and we’ll adjust the hiring plan rather than starting from scratch.`,
        ctaLabel: "Revisit my VA search",
      },
      {
        subject: "Has anything changed with your VA hiring plans?",
        heading: "We can update the role around what changed",
        body: `If you still need help with ${role}, we can revisit the hours, budget, scope, or candidate profile based on what has changed since your last conversation with us.`,
        ctaLabel: "Review hiring options",
      },
      {
        subject: "Should we close your VA search for now?",
        heading: "A final check-in on your VA search",
        body: `We don’t want to keep following up if hiring a ${role} is no longer a priority. If you still want help, choose a time and we’ll pick up from the latest plan.`,
        ctaLabel: "Keep my search open",
      },
    ];
    return rows[Math.max(0, Math.min(step, rows.length - 1))];
  }

  const rows = [
    {
      subject: "Still planning to hire a Virtual Assistant?",
      heading: "Your hiring request is still here",
      body: `You previously asked us about hiring a ${role}. If the role is still active, we can continue from your existing brief and adjust anything that changed.`,
      ctaLabel: "Continue my VA search",
    },
    {
      subject: "Should we keep your VA search open?",
      heading: "We can update the search instead of restarting",
      body: `If you still plan to hire a ${role}, reply with any changes to the hours, budget, responsibilities, or timing and we’ll use that to update the search.`,
      ctaLabel: "Update my hiring plan",
    },
    {
      subject: "Closing the loop on your VA hiring request",
      heading: "A final hiring follow-up",
      body: `This is our final automated follow-up about your ${role} request. If hiring becomes a priority again, you can restart the conversation anytime without rebuilding the role from zero.`,
      ctaLabel: "Restart my VA search",
    },
  ];
  return rows[Math.max(0, Math.min(step, rows.length - 1))];
}

export async function syncLeadNurtureState(args: {
  leadId: string;
  crmStage: string;
  winBackAt?: string | null;
}) {
  const admin = createAdminClient();
  const { data: existing, error: existingError } = await admin
    .from("lead_nurture_state")
    .select("lead_id,sequence,status,step")
    .eq("lead_id", args.leadId)
    .maybeSingle();
  if (existingError) throw existingError;

  const sequence: Sequence | null = args.crmStage === "nurture"
    ? "nurture"
    : args.crmStage === "lost" && args.winBackAt
      ? "winback"
      : null;

  if (!sequence) {
    if (existing?.status === "active" || existing?.status === "paused") {
      const { error } = await admin
        .from("lead_nurture_state")
        .update({
          status: "completed",
          next_send_at: null,
          paused_reason: "lead_stage_changed",
          updated_at: new Date().toISOString(),
        })
        .eq("lead_id", args.leadId)
        .neq("status", "unsubscribed");
      if (error) throw error;
    }
    return { active: false };
  }

  if (existing?.status === "unsubscribed") {
    return { active: false, unsubscribed: true };
  }

  const now = new Date();
  const firstSendAt = sequence === "winback" && args.winBackAt
    ? args.winBackAt
    : plusDays(now, 14);

  if (!existing) {
    const { error } = await admin.from("lead_nurture_state").insert({
      lead_id: args.leadId,
      sequence,
      status: "active",
      step: 0,
      next_send_at: firstSendAt,
      paused_reason: null,
    });
    if (error) throw error;
  } else {
    const reset = existing.sequence !== sequence || existing.status === "completed";
    const { error } = await admin
      .from("lead_nurture_state")
      .update({
        sequence,
        status: "active",
        ...(reset ? { step: 0, next_send_at: firstSendAt, last_sent_at: null, last_event: null } : {}),
        paused_reason: null,
        updated_at: now.toISOString(),
      })
      .eq("lead_id", args.leadId)
      .neq("status", "unsubscribed");
    if (error) throw error;
  }

  return { active: true, sequence };
}

async function createNurtureReviewTask(args: {
  leadId: string;
  ownerId?: string | null;
  subject: string;
}) {
  if (!args.ownerId) return;
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("recruiter_tasks")
    .select("id")
    .eq("subject_type", "lead")
    .eq("subject_id", args.leadId)
    .eq("title", "Review nurtured lead")
    .eq("status", "todo")
    .maybeSingle();
  if (existing?.id) return;

  const { error } = await admin.from("recruiter_tasks").insert({
    title: "Review nurtured lead",
    description: `The automated email nurture sequence for ${args.subject} is complete. Decide whether to call, keep dormant, or close the opportunity.`,
    assignee_id: args.ownerId,
    subject_type: "lead",
    subject_id: args.leadId,
    href: `/workspace/recruiter/crm/${args.leadId}`,
    priority: "normal",
    status: "todo",
    due_at: new Date().toISOString(),
    repeat_rule: "none",
  });
  if (error) throw error;
}

export async function runLeadNurtureAutomation(limit = 20) {
  const admin = createAdminClient();
  const now = new Date();
  const { data: dueRows, error: dueError } = await admin
    .from("lead_nurture_state")
    .select("lead_id,sequence,status,step,next_send_at,unsubscribe_token")
    .eq("status", "active")
    .not("next_send_at", "is", null)
    .lte("next_send_at", now.toISOString())
    .order("next_send_at", { ascending: true })
    .limit(Math.max(1, Math.min(limit, 50)));
  if (dueError) throw dueError;
  if (!dueRows?.length) return { checked: 0, sent: 0, completed: 0, paused: 0 };

  const leadIds = dueRows.map((row: any) => row.lead_id);
  const { data: leads, error: leadsError } = await admin
    .from("lead_intake")
    .select("id,name,email,company,service,crm_stage,status,owner_id,win_back_at")
    .in("id", leadIds);
  if (leadsError) throw leadsError;
  const leadMap = new Map((leads || []).map((lead: any) => [lead.id, lead]));

  let sent = 0;
  let completed = 0;
  let paused = 0;

  for (const state of dueRows as any[]) {
    const lead = leadMap.get(state.lead_id) as any;
    const eligible = lead && lead.status !== "spam" && (
      (state.sequence === "nurture" && lead.crm_stage === "nurture") ||
      (state.sequence === "winback" && lead.crm_stage === "lost" && Boolean(lead.win_back_at))
    );

    if (!eligible || !lead?.email) {
      await admin.from("lead_nurture_state").update({
        status: "completed",
        next_send_at: null,
        paused_reason: lead?.email ? "lead_no_longer_eligible" : "missing_email",
        updated_at: new Date().toISOString(),
      }).eq("lead_id", state.lead_id);
      completed += 1;
      continue;
    }

    const sequence = state.sequence as Sequence;
    const step = Math.max(0, Math.min(Number(state.step || 0), 2));
    const copy = sequenceCopy(sequence, step, lead.service);
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph").replace(/\/$/, "");
    const ctaHref = `${appUrl}/book-client-call`;
    const unsubscribeUrl = `${appUrl}/email/unsubscribe/${state.unsubscribe_token}`;

    const delivery = await sendLeadNurtureEmail({
      to: lead.email,
      firstName: lead.name,
      leadId: lead.id,
      subject: copy.subject,
      heading: copy.heading,
      body: copy.body,
      ctaHref,
      ctaLabel: copy.ctaLabel,
      unsubscribeUrl,
      sequence,
      step,
    });

    if (!delivery.sent) {
      if (["recipient_suppressed", "notification_preference_disabled", "invalid_recipient"].includes(String(delivery.reason || ""))) {
        await admin.from("lead_nurture_state").update({
          status: "paused",
          paused_reason: String(delivery.reason || "delivery_blocked"),
          next_send_at: null,
          updated_at: new Date().toISOString(),
        }).eq("lead_id", state.lead_id);
        paused += 1;
      }
      continue;
    }

    sent += 1;
    const nextStep = step + 1;
    const done = nextStep >= 3;
    const nextSendAt = done ? null : plusDays(now, NEXT_DELAY_DAYS[nextStep - 1] || 60);
    const { error: updateError } = await admin.from("lead_nurture_state").update({
      step: nextStep,
      last_sent_at: now.toISOString(),
      last_event: `${sequence}_step_${step}`,
      next_send_at: nextSendAt,
      status: done ? "completed" : "active",
      paused_reason: null,
      updated_at: now.toISOString(),
    }).eq("lead_id", state.lead_id);
    if (updateError) throw updateError;

    try {
      await admin.from("recruiter_activity").insert({
        subject_type: "lead",
        subject_id: lead.id,
        action: "nurture_email_sent",
        description: `${sequence === "winback" ? "Win-back" : "Nurture"} email ${step + 1} sent automatically.`,
        actor_id: null,
        metadata: { sequence, step, next_send_at: nextSendAt },
      });
    } catch {}

    if (done && sequence === "nurture") {
      await createNurtureReviewTask({
        leadId: lead.id,
        ownerId: lead.owner_id,
        subject: lead.company || lead.name || lead.email,
      });
      completed += 1;
    } else if (done) {
      completed += 1;
    }
  }

  return { checked: dueRows.length, sent, completed, paused };
}
