import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ensureProposalClosingTask,
  resolveProposalClosingArtifacts,
} from "@/lib/proposal-closing-automation";
import {
  bearerTokenFromRequest,
  readRequestJson,
  timingSafeSecretMatches,
} from "@/lib/http-security";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  proposalId: z.string().uuid(),
  sentAt: z.string().datetime({ offset: true }),
  viewedAt: z.string().datetime({ offset: true }).nullable().optional(),
  checkpoint: z.enum(["sent_24h", "sent_48h", "viewed_4h"]),
});

function sameInstant(left?: string | null, right?: string | null) {
  if (!left || !right) return false;
  const a = new Date(left).getTime();
  const b = new Date(right).getTime();
  return Number.isFinite(a) && Number.isFinite(b) && a === b;
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
  const { data: proposal, error } = await admin
    .from("lead_proposals")
    .select(
      "id,lead_id,role_title,status,sent_at,viewed_at,changes_requested_at,accepted_at,declined_at,expires_at",
    )
    .eq("id", parsed.proposalId)
    .maybeSingle();

  if (error) {
    console.error("[automation] proposal closing lookup failed", {
      proposalId: parsed.proposalId,
      code: error.code,
    });
    return NextResponse.json(
      { error: "Proposal lookup failed" },
      { status: 500 },
    );
  }

  if (!proposal) {
    return NextResponse.json({
      ok: true,
      done: true,
      reason: "proposal_missing",
    });
  }

  const leadId = String(proposal.lead_id);
  const status = String(proposal.status || "");

  if (status !== "sent") {
    await resolveProposalClosingArtifacts(
      admin,
      proposal.id,
      leadId,
    );
    return NextResponse.json({
      ok: true,
      done: true,
      reason: `proposal_${status || "closed"}`,
    });
  }

  if (!sameInstant(proposal.sent_at, parsed.sentAt)) {
    return NextResponse.json({
      ok: true,
      done: true,
      reason: "stale_send",
    });
  }

  if (
    parsed.checkpoint === "viewed_4h" &&
    !sameInstant(proposal.viewed_at, parsed.viewedAt)
  ) {
    return NextResponse.json({
      ok: true,
      done: true,
      reason: "stale_view",
    });
  }

  if (
    proposal.expires_at &&
    new Date(proposal.expires_at).getTime() <= Date.now()
  ) {
    await resolveProposalClosingArtifacts(
      admin,
      proposal.id,
      leadId,
    );
    return NextResponse.json({
      ok: true,
      done: true,
      reason: "proposal_expired",
    });
  }

  const { data: lead } = await admin
    .from("lead_intake")
    .select("id,name,email,company,owner_id")
    .eq("id", leadId)
    .maybeSingle();

  const subject =
    lead?.company ||
    lead?.name ||
    proposal.role_title ||
    lead?.email ||
    "Client proposal";

  const viewed = Boolean(proposal.viewed_at);
  const urgent = parsed.checkpoint === "sent_48h";

  const next = await ensureProposalClosingTask({
    admin,
    proposalId: proposal.id,
    leadId,
    ownerId: lead?.owner_id,
    subject,
    kind: viewed ? "viewed_waiting" : "not_viewed",
    urgent,
  });

  await admin.from("recruiter_activity").insert({
    subject_type: "proposal",
    subject_id: proposal.id,
    action:
      parsed.checkpoint === "viewed_4h"
        ? "proposal_viewed_no_decision_4h"
        : parsed.checkpoint === "sent_48h"
          ? "proposal_decision_overdue_48h"
          : viewed
            ? "proposal_viewed_no_decision_24h"
            : "proposal_not_viewed_24h",
    description: viewed
      ? "Proposal was viewed but still has no client decision."
      : "Proposal has not been viewed and needs recruiter follow-up.",
    actor_id: null,
    metadata: {
      automation: "trigger.dev",
      checkpoint: parsed.checkpoint,
      sent_at: parsed.sentAt,
      viewed_at: proposal.viewed_at,
    },
  });

  return NextResponse.json({
    ok: true,
    done: parsed.checkpoint === "sent_48h",
    action: next.reason,
  });
}
