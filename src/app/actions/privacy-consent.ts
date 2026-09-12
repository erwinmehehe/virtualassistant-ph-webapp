"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { PUBLIC_PROFILE_CONSENT_VERSION } from "@/lib/privacy-consent";
import { createAdminClient } from "@/lib/supabase/admin";

export async function updateVaPublicProfileConsentAction(formData: FormData) {
  const { user } = await requireRole("va");
  const granted = formData.get("public_profile_consent") === "on";
  const admin = createAdminClient();

  const { error } = await admin.rpc("record_va_public_profile_consent", {
    p_va_id: user.id,
    p_granted: granted,
    p_version: PUBLIC_PROFILE_CONSENT_VERSION,
    p_source: "va_profile_settings"
  });

  if (error) {
    redirect(`/workspace/va/profile?error=${encodeURIComponent("We could not save your public profile privacy choice. Please try again.")}#visibility`);
  }

  revalidatePath("/workspace/va");
  revalidatePath("/workspace/va/profile");
  revalidatePath("/find-talent");
  redirect(`/workspace/va/profile?consent=${granted ? "granted" : "withdrawn"}#visibility`);
}
