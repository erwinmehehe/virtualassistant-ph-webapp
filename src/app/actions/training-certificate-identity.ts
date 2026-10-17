"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuthenticatedUserFast, requireRoleFast } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { enforceEmailAndIpRateLimit } from "@/lib/rate-limit";
import { finalizeTrainingCourseIfEligible } from "@/lib/training-completion";
import { recordProductEvent } from "@/lib/product-events";
import { normalizeTrainingCertificateName } from "@/lib/training-certificate-identity";

const accountPath = "/workspace/training/account";
const adminPath = "/workspace/admin/training/certificate-corrections";

function accountStatus(status: string): never {
  redirect(accountPath + "?certificate_name_status=" + encodeURIComponent(status));
}

function adminStatus(code: string, status: string): never {
  redirect(adminPath + "?code=" + encodeURIComponent(code) + "&status=" + encodeURIComponent(status));
}

/**
 * A signed-in learner may confirm the name used for *future* credentials.
 * It never edits any issued certificate; those require verified staff review.
 */
export async function confirmTrainingCertificateNameAction(formData: FormData) {
  const { userId } = await requireAuthenticatedUserFast(accountPath);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== userId || !user.email_confirmed_at) accountStatus("login_required");

  const name = normalizeTrainingCertificateName(formData.get("certificate_name"));
  if (!name) accountStatus("invalid_name");
  if (formData.get("publish_name_consent") !== "yes") accountStatus("consent_required");

  try {
    await enforceEmailAndIpRateLimit("training_certificate_name", user.id, 6, 18, 60);
  } catch {
    accountStatus("rate_limited");
  }

  const admin = createAdminClient();
  // Only service-role-controlled app_metadata is trusted at issuance.
  // Auth users may freely edit user_metadata through the public SDK, so it
  // must remain a suggestion and never count as a consent confirmation.
  const { data: existingIdentity, error: fetchError } = await admin.auth.admin.getUserById(user.id);
  if (fetchError || !existingIdentity?.user) accountStatus("save_failed");
  const { error: identityError } = await admin.auth.admin.updateUserById(user.id, {
    app_metadata: {
      ...(existingIdentity.user.app_metadata || {}),
      certificate_recipient_name: name,
      certificate_recipient_name_confirmed_at: new Date().toISOString(),
    },
    user_metadata: {
      ...(existingIdentity.user.user_metadata || {}),
      certificate_name: name,
    },
  });
  if (identityError) accountStatus("save_failed");

  // Certificates previously held awaiting confirmation become issuable without
  // retaking lessons or changing completion evidence, provided they still pass
  // the normal server-side eligibility checks.
  const [{ data: completions, error: completionError }, { data: existing, error: existingError }] = await Promise.all([
    admin.from("training_enrollments")
      .select("course_id").eq("user_id", user.id).not("completed_at", "is", null).limit(60),
    admin.from("training_certificates").select("course_id").eq("user_id", user.id),
  ]);
  if (completionError || existingError) accountStatus("saved_pending");

  const alreadyIssued = new Set((existing || []).map((row) => row.course_id));
  let pending = false;
  for (const row of completions || []) {
    if (alreadyIssued.has(row.course_id)) continue;
    try {
      const completion = await finalizeTrainingCourseIfEligible(user.id, row.course_id);
      if (!completion.certificateIssued) pending = true;
      if (completion.certificateIssued) {
        // Delayed issuance is still a real certificate event. Do not silently
        // undercount completion-to-certificate conversion after confirmation.
        const { data: course } = await admin.from("training_courses")
          .select("slug").eq("id", row.course_id).maybeSingle();
        try {
          await recordProductEvent("training_certificate_issued", {
            userId: user.id,
            path: course?.slug
              ? "/workspace/training/courses/" + course.slug
              : "/workspace/training",
            metadata: {
              course_slug: course?.slug || null,
              issuance_source: "certificate_name_confirmation",
            },
          });
        } catch {
          // Reporting must not undo an issued credential.
        }
      }
    } catch {
      pending = true;
    }
  }

  revalidatePath("/workspace/training", "layout");
  accountStatus(pending ? "saved_pending" : "saved");
}

/**
 * Only an authorized admin may correct a previously issued credential.
 * Staff must verify the requester's identity/name outside this action and
 * record a support case reference. The credential code, award date, and
 * completion/assessment evidence are never touched.
 */
export async function correctIssuedTrainingCertificateNameAction(formData: FormData) {
  const { userId } = await requireRoleFast("admin");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== userId) redirect("/auth/login");

  const code = String(formData.get("credential_code") || "").trim().toUpperCase();
  if (!/^VAT-[A-Z0-9-]{8,64}$/.test(code)) adminStatus("", "invalid_code");
  const name = normalizeTrainingCertificateName(formData.get("recipient_name"));
  const caseReference = String(formData.get("case_reference") || "").trim();
  if (!name) adminStatus(code, "invalid_name");
  if (caseReference.length < 4 || caseReference.length > 120) adminStatus(code, "invalid_case");
  if (formData.get("identity_verified") !== "yes") adminStatus(code, "verification_required");

  const admin = createAdminClient();
  const { data: certificate, error: lookupError } = await admin.from("training_certificates")
    .select("id,user_id,credential_code,metadata")
    .eq("credential_code", code).is("revoked_at", null).maybeSingle();
  if (lookupError || !certificate) adminStatus(code, "not_found");

  const metadata: Record<string, unknown> = certificate.metadata &&
    typeof certificate.metadata === "object" && !Array.isArray(certificate.metadata)
      ? certificate.metadata as Record<string, unknown>
      : {};
  const oldName = normalizeTrainingCertificateName(metadata.recipient_name);
  if (oldName === name) adminStatus(code, "unchanged");

  const history = Array.isArray(metadata.recipient_name_corrections)
    ? metadata.recipient_name_corrections
    : [];
  const { data: updated, error: updateError } = await admin.from("training_certificates")
    .update({
      metadata: {
        ...metadata,
        recipient_name: name,
        recipient_name_corrections: [
          ...history,
          {
            previous_name: oldName,
            new_name: name,
            // training_certificates is readable by its owner under RLS.
            // Keep the internal support reference out of learner-visible JSON.
            case_reference_sha256: createHash("sha256").update(caseReference).digest("hex"),
            corrected_by: userId,
            corrected_at: new Date().toISOString(),
          },
        ],
      },
    })
    .eq("id", certificate.id)
    .eq("user_id", certificate.user_id)
    .eq("credential_code", certificate.credential_code)
    // Optimistic CAS prevents two staff corrections overwriting audit history.
    .eq("metadata", JSON.stringify(metadata))
    .is("revoked_at", null).select("id").maybeSingle();
  if (updateError || !updated) adminStatus(code, "update_failed");

  revalidatePath("/training/certificates/" + encodeURIComponent(code));
  revalidatePath("/workspace/training", "layout");
  adminStatus(code, "corrected");
}
