"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRoleFast } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTrackedRawEmail } from "@/lib/email";
import {
  getExternalSpecialistReview,
  hashSpecialistReviewToken,
} from "@/lib/training-specialist-invites";

const sendInviteSchema = z.object({
  course_id: z.string().uuid(),
  reviewer_email: z.string().trim().email().max(254),
});

function field(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function siteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  return configured?.startsWith("http")
    ? configured.replace(/\/$/, "")
    : "https://virtualassistant.com.ph";
}

function dueInstant(value: string) {
  return new Date(`${value}T23:59:59+08:00`);
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}

export async function sendTrainingSpecialistReviewInviteAction(formData: FormData) {
  const session = await requireRoleFast("admin");
  const parsed = sendInviteSchema.safeParse({
    course_id: formData.get("course_id"),
    reviewer_email: formData.get("reviewer_email"),
  });
  if (!parsed.success) throw new Error("Add a valid reviewer email address.");

  const admin = createAdminClient();
  const [{ data: course, error: courseError }, { data: review, error: reviewError }] = await Promise.all([
    admin
      .from("training_courses")
      .select("id,slug,title,review_requirement,content_version")
      .eq("id", parsed.data.course_id)
      .maybeSingle(),
    admin
      .from("training_specialist_reviews")
      .select("assigned_reviewer_name,assigned_reviewer_role,review_due_date,review_revision,assigned_revision")
      .eq("course_id", parsed.data.course_id)
      .maybeSingle(),
  ]);

  if (courseError) throw courseError;
  if (reviewError) throw reviewError;
  if (!course || course.review_requirement !== "specialist") {
    throw new Error("This course is not configured for specialist review.");
  }
  if (
    !review?.assigned_reviewer_name ||
    !review.assigned_reviewer_role ||
    !review.assigned_revision ||
    review.assigned_revision !== review.review_revision
  ) {
    throw new Error("Assign or refresh the specialist reviewer before sending a review link.");
  }
  if (!review.review_due_date) {
    throw new Error("Set a review due date before sending the specialist review.");
  }

  const dueAt = dueInstant(review.review_due_date);
  if (Number.isNaN(dueAt.getTime()) || dueAt.getTime() < Date.now()) {
    throw new Error("Refresh the assignment with a future due date before sending the review.");
  }

  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = hashSpecialistReviewToken(rawToken);
  const now = new Date();
  const fourteenDays = new Date(now.getTime() + 14 * 86_400_000);
  const threeDaysAfterDue = new Date(dueAt.getTime() + 3 * 86_400_000);
  const expiresAt = new Date(Math.max(fourteenDays.getTime(), threeDaysAfterDue.getTime()));

  await admin
    .from("training_specialist_review_invites")
    .update({ status: "revoked", updated_at: now.toISOString() })
    .eq("course_id", course.id)
    .in("status", ["pending", "opened"]);

  const { data: invite, error: inviteError } = await admin
    .from("training_specialist_review_invites")
    .insert({
      course_id: course.id,
      reviewer_email: parsed.data.reviewer_email.toLowerCase(),
      reviewer_name: review.assigned_reviewer_name,
      reviewer_role: review.assigned_reviewer_role,
      review_revision: review.review_revision,
      assigned_revision: review.assigned_revision,
      course_content_version: course.content_version,
      token_hash: tokenHash,
      due_at: dueAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      status: "pending",
      assigned_by: session.userId,
    })
    .select("id")
    .single();

  if (inviteError || !invite) throw inviteError || new Error("Could not create the specialist review invite.");

  const reviewUrl = `${siteUrl()}/training/review/${rawToken}`;
  const delivery = await sendTrackedRawEmail({
    to: parsed.data.reviewer_email,
    subject: `Specialist review requested: ${course.title}`,
    eventType: "training_specialist_review_invite",
    idempotencyKey: `training-specialist-review-invite:${invite.id}`,
    priority: "standard",
    text: [
      `Hi ${review.assigned_reviewer_name},`,
      "",
      `You have been assigned to review “${course.title}” as ${review.assigned_reviewer_role}.`,
      `Review due: ${dateLabel(dueAt.toISOString())}.`,
      "",
      "Please review the actual lessons, professional boundaries, privacy controls, escalation guidance, and final assessment before recording your decision.",
      "",
      reviewUrl,
      "",
      "This private link is intended for you and expires automatically. Approval records specialist evidence but does not publish the course automatically.",
    ].join("\n"),
    html: `
      <p>Hi ${escapeHtml(review.assigned_reviewer_name)},</p>
      <p>You have been assigned to review <strong>${escapeHtml(course.title)}</strong> as ${escapeHtml(review.assigned_reviewer_role)}.</p>
      <p><strong>Review due:</strong> ${escapeHtml(dateLabel(dueAt.toISOString()))}</p>
      <p>Please review the actual lessons, professional boundaries, privacy controls, escalation guidance, and final assessment before recording your decision.</p>
      <p><a href="${escapeHtml(reviewUrl)}">Open the secure specialist review</a></p>
      <p style="color:#667085;font-size:13px">This private link is intended for you and expires automatically. Approval records specialist evidence but does not publish the course automatically.</p>
    `,
  });

  if (!delivery.sent) {
    const revokedAt = new Date().toISOString();
    await admin
      .from("training_specialist_review_invites")
      .update({ status: "revoked", updated_at: revokedAt })
      .eq("id", invite.id);
    throw new Error("The review email could not be sent. Check Email Health and try again.");
  }

  const sentAt = new Date().toISOString();
  await Promise.all([
    admin
      .from("training_specialist_review_invites")
      .update({ sent_at: sentAt, updated_at: sentAt })
      .eq("id", invite.id),
    admin
      .from("training_specialist_review_events")
      .insert({
        course_id: course.id,
        event_type: "invite_sent",
        actor_id: session.userId,
        actor_label: session.profile.full_name || "Admin",
        reviewer_name: review.assigned_reviewer_name,
        reviewer_role: review.assigned_reviewer_role,
        review_due_date: review.review_due_date,
        review_revision: review.review_revision,
        assigned_revision: review.assigned_revision,
        course_content_version: course.content_version,
        checklist: {},
        notes: `Secure review sent to ${parsed.data.reviewer_email.toLowerCase()}.`,
      }),
  ]);

  revalidatePath("/workspace/admin/training/reviews");
  redirect("/workspace/admin/training/reviews?invited=1");
}

export async function revokeTrainingSpecialistReviewInviteAction(formData: FormData) {
  const session = await requireRoleFast("admin");
  const inviteId = field(formData, "invite_id");
  if (!inviteId) throw new Error("Review invite is required.");

  const admin = createAdminClient();
  const { data: invite, error: loadError } = await admin
    .from("training_specialist_review_invites")
    .select("id,course_id,reviewer_name,reviewer_role,review_revision,assigned_revision,course_content_version,due_at,status")
    .eq("id", inviteId)
    .maybeSingle();

  if (loadError) throw loadError;
  if (!invite || !["pending", "opened"].includes(invite.status)) {
    throw new Error("This review invite is no longer active.");
  }

  const now = new Date().toISOString();
  const { error } = await admin
    .from("training_specialist_review_invites")
    .update({ status: "revoked", updated_at: now })
    .eq("id", invite.id)
    .in("status", ["pending", "opened"]);
  if (error) throw error;

  await admin.from("training_specialist_review_events").insert({
    course_id: invite.course_id,
    event_type: "invite_revoked",
    actor_id: session.userId,
    actor_label: session.profile.full_name || "Admin",
    reviewer_name: invite.reviewer_name,
    reviewer_role: invite.reviewer_role,
    review_due_date: invite.due_at ? invite.due_at.slice(0, 10) : null,
    review_revision: invite.review_revision,
    assigned_revision: invite.assigned_revision,
    course_content_version: invite.course_content_version,
    checklist: {},
    notes: "Secure external specialist review invite revoked.",
  });

  revalidatePath("/workspace/admin/training/reviews");
}

export async function submitExternalTrainingSpecialistReviewAction(formData: FormData) {
  const rawToken = field(formData, "token");
  const decision = field(formData, "decision");
  const notes = field(formData, "notes");

  if (!["changes_requested", "approved"].includes(decision)) {
    throw new Error("Choose approve or request changes.");
  }
  if (notes.length < 20 || notes.length > 5000) {
    throw new Error("Add review notes between 20 and 5,000 characters.");
  }

  const context = await getExternalSpecialistReview(rawToken, false);
  if (context.state !== "active" || !context.invite || !context.course || !context.definition || !context.review) {
    throw new Error("This specialist review link is no longer active.");
  }

  const { invite, course, definition, review } = context;
  const checklist = Object.fromEntries(
    definition.items.map((item) => [item.id, field(formData, `check_${item.id}`) === "1"]),
  );
  const allChecked = definition.items.every((item) => checklist[item.id]);
  if (decision === "approved" && !allChecked) {
    throw new Error("Complete every specialist review check before approving the course.");
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();
  const approved = decision === "approved";
  const reviewedAt = approved ? now : null;

  const { error: reviewUpdateError } = await admin
    .from("training_specialist_reviews")
    .update({
      reviewer_name: invite.reviewer_name,
      reviewer_role: invite.reviewer_role,
      checklist,
      notes,
      decision,
      reviewed_at: reviewedAt,
      updated_at: now,
    })
    .eq("course_id", course.id)
    .eq("review_revision", invite.review_revision)
    .eq("assigned_revision", invite.assigned_revision);
  if (reviewUpdateError) throw reviewUpdateError;

  const { error: courseUpdateError } = await admin
    .from("training_courses")
    .update(approved
      ? {
          specialist_reviewed_by: invite.reviewer_name,
          specialist_reviewer_role: invite.reviewer_role,
          specialist_review_notes: notes,
          specialist_reviewed_at: now,
          status: "draft",
          published_at: null,
          updated_at: now,
        }
      : {
          specialist_reviewed_by: null,
          specialist_reviewer_role: null,
          specialist_review_notes: null,
          specialist_reviewed_at: null,
          status: "draft",
          published_at: null,
          updated_at: now,
        })
    .eq("id", course.id)
    .eq("content_version", invite.course_content_version);
  if (courseUpdateError) throw courseUpdateError;

  const eventType = approved ? "external_approved" : "external_changes_requested";
  const { error: eventError } = await admin.from("training_specialist_review_events").insert({
    course_id: course.id,
    event_type: eventType,
    actor_id: null,
    actor_label: "External specialist reviewer",
    reviewer_name: invite.reviewer_name,
    reviewer_role: invite.reviewer_role,
    review_due_date: review.review_due_date || null,
    review_revision: invite.review_revision,
    assigned_revision: invite.assigned_revision,
    course_content_version: invite.course_content_version,
    checklist,
    notes,
  });
  if (eventError) throw eventError;

  const { error: inviteError } = await admin
    .from("training_specialist_review_invites")
    .update({ status: "submitted", submitted_at: now, updated_at: now })
    .eq("id", invite.id)
    .in("status", ["pending", "opened"]);
  if (inviteError) throw inviteError;

  revalidateTag("public-training");
  revalidatePath("/workspace/admin/training/reviews");
  revalidatePath(`/workspace/admin/training/${course.id}`);
  revalidatePath(`/training/review/${rawToken}`);
  redirect(`/training/review/${rawToken}?submitted=${decision}`);
}
