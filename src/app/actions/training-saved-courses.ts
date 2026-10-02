"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticatedUserFast } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { recordProductEvent } from "@/lib/product-events";

export async function toggleTrainingSavedCourseAction(input: {
  courseId: string;
  save: boolean;
}) {
  const { userId } = await requireAuthenticatedUserFast("/workspace/training");
  const courseId = String(input.courseId || "").trim();
  const save = Boolean(input.save);
  if (!courseId) return { ok: false as const, saved: false };

  const supabase = await createClient();
  const { data: course } = await supabase
    .from("training_courses")
    .select("id,slug")
    .eq("id", courseId)
    .eq("status", "published")
    .maybeSingle();

  if (!course) return { ok: false as const, saved: false };

  if (save) {
    const { error } = await supabase
      .from("training_saved_courses")
      .insert({ user_id: userId, course_id: course.id });
    if (error && error.code !== "23505") {
      throw new Error("Could not save this course.");
    }
  } else {
    const { error } = await supabase
      .from("training_saved_courses")
      .delete()
      .eq("user_id", userId)
      .eq("course_id", course.id);
    if (error) throw new Error("Could not remove this saved course.");
  }

  await recordProductEvent(save ? "training_course_saved" : "training_course_unsaved", {
    userId,
    path: "/workspace/training",
    metadata: { course_id: course.id, course_slug: course.slug },
  });

  revalidatePath("/workspace/training");
  return { ok: true as const, saved: save };
}
