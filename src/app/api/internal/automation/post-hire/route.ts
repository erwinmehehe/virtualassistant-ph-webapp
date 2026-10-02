import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ensureOfferClientConfirmationAction,
  ensurePlacementHandoffAction,
  ensurePlacementReadinessAction,
  resolveOfferClientConfirmationArtifacts,
  resolvePlacementHandoffTask,
  resolvePlacementReadinessArtifacts,
  resolvePlacementReadinessIfReady,
} from "@/lib/post-hire-automation";
import {
  bearerTokenFromRequest,
  readRequestJson,
  timingSafeSecretMatches,
} from "@/lib/http-security";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("offer_client_confirmation"),
    offerId: z.string().uuid(),
    acceptedAt: z.string().datetime({ offset: true }),
    checkpoint: z.enum(["4h", "24h"]),
  }),
  z.object({
    kind: z.literal("placement_handoff"),
    workroomId: z.string().uuid(),
    createdAt: z.string().datetime({ offset: true }),
    checkpoint: z.literal("24h"),
  }),
  z.object({
    kind: z.literal("placement_readiness"),
    workroomId: z.string().uuid(),
    handoffAt: z.string().datetime({ offset: true }),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    checkpoint: z.enum(["48h", "24h"]),
  }),
]);

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

  if (parsed.kind === "offer_client_confirmation") {
    const { data: offer, error: offerError } = await admin
      .from("placement_offers")
      .select(
        "id,job_id,client_id,status,va_accepted_at,client_confirmed_at,declined_at",
      )
      .eq("id", parsed.offerId)
      .maybeSingle();

    if (offerError) {
      return NextResponse.json(
        { error: "Placement offer lookup failed" },
        { status: 500 },
      );
    }

    if (!offer) {
      return NextResponse.json({
        ok: true,
        done: true,
        reason: "offer_missing",
      });
    }

    if (!sameInstant(offer.va_accepted_at, parsed.acceptedAt)) {
      return NextResponse.json({
        ok: true,
        done: true,
        reason: "stale_acceptance",
      });
    }

    const { data: job, error: jobError } = await admin
      .from("jobs")
      .select("id,title,recruiter_id,status")
      .eq("id", offer.job_id)
      .maybeSingle();

    if (jobError) {
      return NextResponse.json(
        { error: "Role lookup failed" },
        { status: 500 },
      );
    }

    if (
      !job ||
      offer.status !== "pending_client" ||
      offer.client_confirmed_at ||
      offer.declined_at
    ) {
      if (job) {
        await resolveOfferClientConfirmationArtifacts(
          admin,
          offer.id,
          offer.job_id,
          offer.client_id,
        );
      }
      return NextResponse.json({
        ok: true,
        done: true,
        reason: "offer_resolved",
      });
    }

    const next = await ensureOfferClientConfirmationAction({
      admin,
      offerId: offer.id,
      job,
      clientId: offer.client_id,
      urgent: parsed.checkpoint === "24h",
    });

    await admin.from("recruiter_activity").insert({
      subject_type: "job",
      subject_id: job.id,
      action:
        parsed.checkpoint === "24h"
          ? "placement_client_confirmation_overdue_24h"
          : "placement_client_confirmation_due_4h",
      description:
        "VA accepted the placement offer and client confirmation is still pending.",
      actor_id: null,
      metadata: {
        automation: "trigger.dev",
        offer_id: offer.id,
        checkpoint: parsed.checkpoint,
      },
    });

    return NextResponse.json({
      ok: true,
      done: parsed.checkpoint === "24h",
      action: next.reason,
    });
  }

  const { data: room, error: roomError } = await admin
    .from("workrooms")
    .select(
      "id,job_id,client_id,va_id,status,created_at,start_date,client_success_owner_id,handoff_completed_at,placement_ready_at,placement_stage",
    )
    .eq("id", parsed.workroomId)
    .maybeSingle();

  if (roomError) {
    return NextResponse.json(
      { error: "Workroom lookup failed" },
      { status: 500 },
    );
  }

  if (!room) {
    return NextResponse.json({
      ok: true,
      done: true,
      reason: "workroom_missing",
    });
  }

  const { data: job, error: jobError } = await admin
    .from("jobs")
    .select("id,title,recruiter_id,status")
    .eq("id", room.job_id)
    .maybeSingle();

  if (jobError) {
    return NextResponse.json(
      { error: "Role lookup failed" },
      { status: 500 },
    );
  }

  if (!job) {
    return NextResponse.json({
      ok: true,
      done: true,
      reason: "role_missing",
    });
  }

  if (parsed.kind === "placement_handoff") {
    if (!sameInstant(room.created_at, parsed.createdAt)) {
      return NextResponse.json({
        ok: true,
        done: true,
        reason: "stale_workroom",
      });
    }

    if (room.handoff_completed_at) {
      await resolvePlacementHandoffTask(admin, room.job_id);
      return NextResponse.json({
        ok: true,
        done: true,
        reason: "handoff_complete",
      });
    }

    if (room.status !== "active" || room.placement_stage === "ended") {
      await resolvePlacementHandoffTask(admin, room.job_id);
      return NextResponse.json({
        ok: true,
        done: true,
        reason: "placement_closed",
      });
    }

    const next = await ensurePlacementHandoffAction({
      admin,
      workroomId: room.id,
      job,
      clientSuccessOwnerId: room.client_success_owner_id,
      urgent: true,
    });

    await admin.from("recruiter_activity").insert({
      subject_type: "job",
      subject_id: job.id,
      action: "placement_handoff_overdue_24h",
      description:
        "Placement was confirmed more than 24 hours ago and the formal recruiter-to-Client-Success handoff is incomplete.",
      actor_id: null,
      metadata: {
        automation: "trigger.dev",
        workroom_id: room.id,
      },
    });

    return NextResponse.json({
      ok: true,
      done: true,
      action: next.reason,
    });
  }

  if (!sameInstant(room.handoff_completed_at, parsed.handoffAt)) {
    return NextResponse.json({
      ok: true,
      done: true,
      reason: "stale_handoff",
    });
  }

  if (
    room.status !== "active" ||
    ["ended", "recovery", "replacement"].includes(
      String(room.placement_stage || ""),
    )
  ) {
    await resolvePlacementReadinessArtifacts(admin, room.id);
    return NextResponse.json({
      ok: true,
      done: true,
      reason: "readiness_not_applicable",
    });
  }

  if (room.placement_ready_at) {
    await resolvePlacementReadinessIfReady(admin, room.id);
    return NextResponse.json({
      ok: true,
      done: true,
      reason: "placement_ready",
    });
  }

  const next = await ensurePlacementReadinessAction({
    admin,
    room,
    job,
    urgent: parsed.checkpoint === "24h",
  });

  await admin.from("recruiter_activity").insert({
    subject_type: "job",
    subject_id: job.id,
    action:
      parsed.checkpoint === "24h"
        ? "placement_readiness_overdue_24h"
        : "placement_readiness_due_48h",
    description:
      "Placement setup is still incomplete ahead of the planned start date.",
    actor_id: null,
    metadata: {
      automation: "trigger.dev",
      workroom_id: room.id,
      checkpoint: parsed.checkpoint,
      start_date: parsed.startDate,
    },
  });

  return NextResponse.json({
    ok: true,
    done: parsed.checkpoint === "24h",
    action: next.reason,
  });
}
