"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRoleFast } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTrackedRawEmail } from "@/lib/email";
import { getSpecialistReviewDefinition } from "@/lib/training-specialist-review";
import {
  getExternalSpecialistReview,
  hashSpecialistReviewToken,
} from "@/lib/training-specialist-invites";

const inviteSchema = z.object({
  course_id: z.string().uuid(),
  reviewer_name: z.string().trim().min(2).max(160),
  reviewer_email: z.string().trim().email().max(254),
  reviewer_role: z.string().trim().min(3).max(220),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
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

function reviewBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  return configured?.startsWith("http") ? configured.replace(/\/$/, "") : "https://virtualassistant.com.ph";
}

function dueDateLabel(value: string) {
  return new Intl.DateTimeFormat("en", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" })
    .format(new Date(value));
}

export async function sendTrainingSpecialistReviewInviteAction(formData: FormData) {
  const session = await requireRoleFast("admin");
  const parsed = inviteSchema.safeParse({
    course_id: formData.get("course_id"),
    reviewer_name: formData.get("reviewer_name"),
    reviewer_email: formData.get("reviewer_email"),
    reviewer_role: formData.get("reviewer_role"),
    due_date: formData.get("due_date"),
  });
  if (!parsed.success) throw new Error("Add the reviewer name, valid email, role, and due date.");

  const dueAt = new Date(`${parsed.data.due_date}T23:59:59.999Z`);
  if (Number.isNaN(dueAt.getTime()) || dueAt.getTime() < Date.now()) {
    throw new Error("Choose a future review due date.");
  }

  const admin = createAdminClient();
  const { data: course, error: courseError } = await admin
    .from("training_courses")
    .select("id,slug,title,summary,review_requirement,status")
    .eq("id", parsed.data.course_id)
    .maybeSingle();

  if (courseError) throw courseError;
  if (!course || course.review_requirement !== "specialist") {
    throw new Error("This course is not configured for specialist review.");
  }
  if (!getSpecialistReviewDefinition(course.slug)) {
    throw new Error("Add the specialist checklist for this course before inviting a reviewer.");
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
      reviewer_name: parsed.data.reviewer_name,
      reviewer_email: parsed.data.reviewer_email.toLowerCase(),
      reviewer_role: parsed.data.reviewer_role,
      token_hash: tokenHash,
      due_at: dueAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      status: "pending",
      assigned_by: session.userId,
    })
    .select("id")
    .single();

  if (inviteError || !invite) throw inviteError || new Error("Could not create the specialist review invite.");

  const reviewUrl = `${reviewBaseUrl()}/training/review/${rawToken}`;
  const delivery = await sendTrackedRawEmail({
    to: parsed.data.reviewer_email,
    subject: `Specialist review requested: ${course.title}`,
    eventType: "training_specialist_review_invite",
    idempotencyKey: `training-specialist-review-invite:${invite.id}`,
    priority: "standard",
    text: [
      `Hi ${parsed.data.reviewer_name},`,
      "",
      `VirtualAssistant.com.ph is asking you to review the draft course “${course.title}” as ${parsed.data.reviewer_role}.`,
      `Review due: ${dueDateLabel(dueAt.toISOString())}.`,
      "",
      "Please review the actual lesson guidance, professional boundaries, privacy controls, escalation rules, and final assessment before recording a decision.",
      "",
      reviewUrl,
      "",
      "The secure link is intended for you and expires automatically. Training remains unpublished until all review and publishing requirements pass.",
    ].join("\n"),
    html: `
      <p>Hi ${escapeHtml(parsed.data.reviewer_name)},</p>
      <p>VirtualAssistant.com.ph is asking you to review the draft course <strong>${escapeHtml(course.title)}</strong> as ${escapeHtml(parsed.data.reviewer_role)}.</p>
      <p><strong>Review due:</strong> ${escapeHtml(dueDateLabel(dueAt.toISOString()))}</p>
      <p>Please review the actual lesson guidance, professional boundaries, privacy controls, escalation rules, and final assessment before recording a decision.</p>
      <p><a href="${escapeHtml(reviewUrl)}">Open the secure review</a></p>
      <p style="color:#667085;font-size:13px">The secure link is intended for you and expires automatically. Training remains unpublished until all review and publishing requirements pass.</p>
    `,
  });

  if (!delivery.sent) {
    await admin
      .from("training_specialist_review_invites")
      .update({ status: "revoked", updated_at: new Date().toISOString() })
      .eq("id", invite.id);
    throw new Error("The review invite was created but the email could not be sent. Check email health and try again.");
  }

  await admin
    .from("training_specialist_review_invites")
    .update({ sent_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", invite.id);

  revalidatePath("/workspace/admin/training/reviews");
  redirect("/workspace/admin/training/reviews?invited=1");
}

export async function revokeTrainingSpecialistReviewInviteAction(formData: FormData) {
  await requireRoleFast("admin");
  const inviteId = field(formData, "invite_id");
  if (!inviteId) throw new Error("Review invite is required.");

  const admin = createAdminClient();
  const { error } = await admin
    .from("training_specialist_review_invites")
    .update({ status: "revoked", updated_at: new Date().toISOString() })
    .eq("id", inviteId)
    .in("status", ["pending", "opened"]);

  if (error) throw error;
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

  const reviewContext = await getExternalSpecialistReview(rawToken, false);
  if (reviewContext.state !== "active" || !reviewContext.invite || !reviewContext.course || !reviewContext.definition) {
    throw new Error("This specialist review link is no longer active.");
  }

  const { invite, course, definition } = reviewContext;
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

  const { error: reviewError } = await admin
    .from("training_specialist_reviews")
    .upsert({
      course_id: course.id,
      reviewer_name: invite.reviewer_name,
      reviewer_role: invite.reviewer_role,
      checklist,
      notes,
      decision,
      reviewed_at: approved ? now : null,
      updated_at: now,
    }, { onConflict: "course_id" });

  if (reviewError) throw reviewError;

  const { error: courseError } = await admin
    .from("training_courses")
    .update({
      specialist_reviewed_by: approved ? invite.reviewer_name : null,
      specialist_reviewer_role: approved ? invite.reviewer_role : null,
      specialist_review_notes: approved ? notes : null,
      specialist_reviewed_at: approved ? now : null,
      status: "draft",
      published_at: null,
      updated_at: now,
    })
    .eq("id", course.id);

  if (courseError) throw courseError;

  const { error: inviteError } = await admin
    .from("training_specialist_review_invites")
    .update({ status: "submitted", submitted_at: now, updated_at: now })
    .eq("id", invite.id)
    .in("status", ["pending", "opened"]);

  if (inviteError) throw inviteError;

  revalidatePath("/workspace/admin/training/reviews");
  revalidatePath(`/workspace/admin/training/${course.id}`);
  revalidatePath(`/training/review/${rawToken}`);
  redirect(`/training/review/${rawToken}?submitted=${decision}`);
}
