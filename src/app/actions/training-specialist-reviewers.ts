"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRoleFast } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSpecialistReviewDomain } from "@/lib/training-specialist-review";
import { assignTrainingSpecialistReviewerAction } from "@/app/actions/training-admin";

const reviewerSchema = z.object({
  reviewer_id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  role: z.string().trim().min(3).max(180),
  qualification_notes: z.string().trim().max(1500).optional(),
  domains: z.array(z.enum(["Healthcare", "Finance", "Property", "Software"])).min(1),
});

function value(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

export async function saveTrainingSpecialistReviewerAction(formData: FormData) {
  const session = await requireRoleFast("admin");
  const reviewerId = value(formData, "reviewer_id") || undefined;
  const parsed = reviewerSchema.safeParse({
    reviewer_id: reviewerId,
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    qualification_notes: formData.get("qualification_notes") || undefined,
    domains: formData.getAll("domains").map((item) => String(item)),
  });

  if (!parsed.success) {
    throw new Error("Add a valid specialist name, email, role, and at least one review domain.");
  }

  const admin = createAdminClient();
  const payload = {
    name: parsed.data.name,
    email: parsed.data.email.toLowerCase(),
    role: parsed.data.role,
    domains: parsed.data.domains,
    qualification_notes: parsed.data.qualification_notes || null,
    is_active: true,
    updated_at: new Date().toISOString(),
  };

  if (reviewerId) {
    const { error } = await admin
      .from("training_specialist_reviewers")
      .update(payload)
      .eq("id", reviewerId);
    if (error) throw error;
  } else {
    const { error } = await admin
      .from("training_specialist_reviewers")
      .insert({ ...payload, created_by: session.userId });
    if (error) {
      if (/duplicate key|unique/i.test(error.message || "")) {
        throw new Error("A specialist reviewer with this email is already in the roster.");
      }
      throw error;
    }
  }

  revalidatePath("/workspace/admin/training/reviews");
}

export async function setTrainingSpecialistReviewerActiveAction(formData: FormData) {
  await requireRoleFast("admin");
  const reviewerId = value(formData, "reviewer_id");
  const isActive = value(formData, "is_active") === "1";
  if (!reviewerId) throw new Error("Reviewer is required.");

  const admin = createAdminClient();
  const { error } = await admin
    .from("training_specialist_reviewers")
    .update({
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reviewerId);
  if (error) throw error;

  revalidatePath("/workspace/admin/training/reviews");
}

export async function assignTrainingSpecialistReviewerFromRosterAction(formData: FormData) {
  await requireRoleFast("admin");
  const reviewerId = value(formData, "reviewer_id");
  const courseId = value(formData, "course_id");
  const reviewDueDate = value(formData, "review_due_date");

  if (!reviewerId || !courseId) throw new Error("Choose a reviewer and course.");
  if (reviewDueDate && !/^\d{4}-\d{2}-\d{2}$/.test(reviewDueDate)) {
    throw new Error("Choose a valid specialist review due date.");
  }

  const admin = createAdminClient();
  const [{ data: reviewer, error: reviewerError }, { data: course, error: courseError }] = await Promise.all([
    admin
      .from("training_specialist_reviewers")
      .select("id,name,email,role,domains,is_active")
      .eq("id", reviewerId)
      .maybeSingle(),
    admin
      .from("training_courses")
      .select("id,slug,review_requirement")
      .eq("id", courseId)
      .maybeSingle(),
  ]);

  if (reviewerError) throw reviewerError;
  if (courseError) throw courseError;
  if (!reviewer || !reviewer.is_active) throw new Error("Choose an active specialist reviewer.");
  if (!course || course.review_requirement !== "specialist") {
    throw new Error("This course does not require specialist review.");
  }

  const domain = getSpecialistReviewDomain(course.slug);
  if (!domain || !Array.isArray(reviewer.domains) || !reviewer.domains.includes(domain)) {
    throw new Error("This reviewer is not approved for the course specialist domain.");
  }

  const assignment = new FormData();
  assignment.set("course_id", course.id);
  assignment.set("assigned_reviewer_name", reviewer.name);
  assignment.set("assigned_reviewer_role", reviewer.role);
  assignment.set("review_due_date", reviewDueDate);
  await assignTrainingSpecialistReviewerAction(assignment);
}
