"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordProductEvent } from "@/lib/product-events";

function safeReturnTo(value: FormDataEntryValue | null) {
  const raw = String(value || "").trim();
  if (!raw.startsWith("/workspace/")) return "/workspace/va/profile";
  if (raw.startsWith("//")) return "/workspace/va/profile";
  return raw;
}

export async function updateTrainingCertificateVisibilityAction(formData: FormData) {
  const { user } = await requireRole("va");
  const certificateId = String(formData.get("certificate_id") || "").trim();
  const publicVisible = String(formData.get("public_visible") || "") === "true";
  const returnTo = safeReturnTo(formData.get("return_to"));

  if (!certificateId) redirect(returnTo);

  const admin = createAdminClient();
  const { data: certificate } = await admin
    .from("training_certificates")
    .select("id,user_id,course_id,metadata,revoked_at")
    .eq("id", certificateId)
    .eq("user_id", user.id)
    .is("revoked_at", null)
    .maybeSingle();

  if (!certificate) redirect(returnTo);

  const metadata =
    certificate.metadata &&
    typeof certificate.metadata === "object" &&
    !Array.isArray(certificate.metadata)
      ? certificate.metadata
      : {};

  const currentPublicVisible = metadata.public_profile_visible === true;
  if (currentPublicVisible === publicVisible) redirect(returnTo);

  const { error } = await admin
    .from("training_certificates")
    .update({
      metadata: {
        ...metadata,
        public_profile_visible: publicVisible,
        public_profile_visibility_updated_at: new Date().toISOString(),
      },
    })
    .eq("id", certificate.id)
    .eq("user_id", user.id);

  if (error) throw new Error("Could not update certificate visibility.");

  const { data: course } = await admin
    .from("training_courses")
    .select("slug")
    .eq("id", certificate.course_id)
    .maybeSingle();

  await recordProductEvent(
    publicVisible
      ? "training_certificate_profile_added"
      : "training_certificate_profile_removed",
    {
      userId: user.id,
      path: returnTo,
      metadata: {
        certificate_id: certificate.id,
        course_id: certificate.course_id,
        course_slug: course?.slug || null,
      },
    },
  );

  revalidatePath("/workspace/va/profile");
  revalidatePath("/workspace/va/profile/preview");
  revalidatePath("/workspace/training");
  if (course?.slug) revalidatePath(`/workspace/training/courses/${course.slug}`);
  revalidatePath("/find-talent");
  revalidatePath(`/workspace/recruiter/candidates/${user.id}`);

  const separator = returnTo.includes("?") ? "&" : "?";
  redirect(`${returnTo}${separator}certificate_visibility=${publicVisible ? "shown" : "hidden"}`);
}
