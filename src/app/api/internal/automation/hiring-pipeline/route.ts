import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ensureInterviewFeedbackAction,
  ensureInterviewSchedulingAction,
  ensureOfferPrepAction,
  ensureShortlistReviewAction,
  resolveInterviewFeedbackIfClear,
  resolveInterviewSchedulingIfClear,
  resolveShortlistReviewIfComplete,
} from "@/lib/hiring-pipeline-automation";
import {
  bearerTokenFromRequest,
  readRequestJson,
  timingSafeSecretMatches,
} from "@/lib/http-security";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("shortlist_review"),
    jobId: z.string().uuid(),
    releasedAt: z.string().datetime({ offset: true }),
    checkpoint: z.enum(["24h", "48h"]),
  }),
  z.object({
    kind: z.literal("interview_scheduling"),
    interviewId: z.string().uuid(),
    requestedAt: z.string().datetime({ offset: true }),
    checkpoint: z.enum(["4h", "24h"]),
  }),
  z.object({
    kind: z.literal("interview_feedback"),
    interviewId: z.string().uuid(),
    scheduledAt: z.string().datetime({ offset: true }),
    checkpoint: z.enum(["2h", "24h"]),
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

  if (parsed.kind === "shortlist_review") {
    const [{ data: job, error: jobError }, { data: rows, error: rowsError }] =
      await Promise.all([
        admin
          .from("jobs")
          .select("id,title,client_id,recruiter_id,status")
          .eq("id", parsed.jobId)
          .maybeSingle(),
        admin
          .from("job_shortlist_candidates")
          .select("id,released_at,client_decision")
          .eq("job_id", parsed.jobId)
          .eq("shortlist_status", "released"),
      ]);

    if (jobError || rowsError) {
      return NextResponse.json(
        { error: "Shortlist lookup failed" },
        { status: 500 },
      );
    }

    if (!job || job.status === "closed" || !job.client_id || !rows?.length) {
      await resolveShortlistReviewIfComplete(admin, parsed.jobId, true);
      return NextResponse.json({
        ok: true,
        done: true,
        reason: "shortlist_closed",
      });
    }

    const latestReleasedAt = rows
      .map((row) => row.released_at)
      .filter(Boolean)
      .sort()
      .at(-1);

    if (!sameInstant(latestReleasedAt, parsed.releasedAt)) {
      return NextResponse.json({
        ok: true,
        done: true,
        reason: "stale_release",
      });
    }

    const unresolved = rows.filter(
      (row) => !row.client_decision || row.client_decision === "hold",
    );

    if (!unresolved.length) {
      await resolveShortlistReviewIfComplete(admin, parsed.jobId, true);
      return NextResponse.json({
        ok: true,
        done: true,
        reason: "shortlist_reviewed",
      });
    }

    const next = await ensureShortlistReviewAction({
      admin,
      job,
      urgent: parsed.checkpoint === "48h",
    });

    await admin.from("recruiter_activity").insert({
      subject_type: "job",
      subject_id: job.id,
      action:
        parsed.checkpoint === "48h"
          ? "shortlist_review_overdue_48h"
          : "shortlist_review_due_24h",
      description: `${unresolved.length} released shortlist candidate(s) still need a client decision.`,
      actor_id: null,
      metadata: {
        automation: "trigger.dev",
        checkpoint: parsed.checkpoint,
        released_at: parsed.releasedAt,
      },
    });

    return NextResponse.json({
      ok: true,
      done: parsed.checkpoint === "48h",
      action: next.reason,
    });
  }

  const { data: interview, error: interviewError } = await admin
    .from("candidate_interviews")
    .select(
      "id,job_id,client_id,status,created_at,scheduled_at,duration_minutes,client_decision,client_feedback_at,cancelled_at",
    )
    .eq("id", parsed.interviewId)
    .maybeSingle();

  if (interviewError) {
    return NextResponse.json(
      { error: "Interview lookup failed" },
      { status: 500 },
    );
  }

  if (!interview) {
    return NextResponse.json({
      ok: true,
      done: true,
      reason: "interview_missing",
    });
  }

  const { data: job, error: jobError } = await admin
    .from("jobs")
    .select("id,title,client_id,recruiter_id,status")
    .eq("id", interview.job_id)
    .maybeSingle();

  if (jobError) {
    return NextResponse.json(
      { error: "Role lookup failed" },
      { status: 500 },
    );
  }

  if (!job || job.status === "closed" || interview.cancelled_at) {
    await Promise.all([
      resolveInterviewSchedulingIfClear(admin, interview.job_id),
      resolveInterviewFeedbackIfClear(admin, interview.job_id),
    ]);
    return NextResponse.json({
      ok: true,
      done: true,
      reason: "interview_closed",
    });
  }

  if (parsed.kind === "interview_scheduling") {
    if (!sameInstant(interview.created_at, parsed.requestedAt)) {
      return NextResponse.json({
        ok: true,
        done: true,
        reason: "stale_request",
      });
    }

    if (interview.status !== "requested" || interview.scheduled_at) {
      await resolveInterviewSchedulingIfClear(admin, interview.job_id);
      return NextResponse.json({
        ok: true,
        done: true,
        reason: "interview_scheduled",
      });
    }

    const next = await ensureInterviewSchedulingAction({
      admin,
      job,
      urgent: parsed.checkpoint === "24h",
    });

    await admin.from("recruiter_activity").insert({
      subject_type: "job",
      subject_id: job.id,
      action:
        parsed.checkpoint === "24h"
          ? "interview_scheduling_overdue_24h"
          : "interview_scheduling_due_4h",
      description: "Client-requested interview still needs a scheduled time.",
      actor_id: null,
      metadata: {
        automation: "trigger.dev",
        interview_id: interview.id,
        checkpoint: parsed.checkpoint,
      },
    });

    return NextResponse.json({
      ok: true,
      done: parsed.checkpoint === "24h",
      action: next.reason,
    });
  }

  if (!sameInstant(interview.scheduled_at, parsed.scheduledAt)) {
    return NextResponse.json({
      ok: true,
      done: true,
      reason: "stale_schedule",
    });
  }

  if (
    interview.status !== "scheduled" ||
    interview.client_feedback_at ||
    interview.client_decision
  ) {
    await resolveInterviewFeedbackIfClear(admin, interview.job_id);

    if (interview.client_decision === "proceed") {
      await ensureOfferPrepAction({ admin, job });
    }

    return NextResponse.json({
      ok: true,
      done: true,
      reason: interview.client_decision
        ? `feedback_${interview.client_decision}`
        : "feedback_recorded",
    });
  }

  const next = await ensureInterviewFeedbackAction({
    admin,
    job,
    urgent: parsed.checkpoint === "24h",
  });

  await admin.from("recruiter_activity").insert({
    subject_type: "job",
    subject_id: job.id,
    action:
      parsed.checkpoint === "24h"
        ? "interview_feedback_overdue_24h"
        : "interview_feedback_due_2h",
    description: "Candidate interview finished and client feedback is still missing.",
    actor_id: null,
    metadata: {
      automation: "trigger.dev",
      interview_id: interview.id,
      checkpoint: parsed.checkpoint,
      scheduled_at: parsed.scheduledAt,
    },
  });

  return NextResponse.json({
    ok: true,
    done: parsed.checkpoint === "24h",
    action: next.reason,
  });
}
