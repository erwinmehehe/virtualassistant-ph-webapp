"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { PUBLIC_PROFILE_CONSENT_VERSION } from "@/lib/privacy-consent";
import { isPubliclyEligible } from "@/lib/public-visibility";
import { createAdminClient } from "@/lib/supabase/admin";

export async function updateVaPublicProfileConsentAction(formData: FormData) {
  const { user } = await requireRole("va");
  const granted = formData.get("public_profile_consent") === "on";
  const admin = createAdminClient();
  const [{ data: current }, { data: account }, { data: vetting }] = await Promise.all([
    admin.from("va_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    admin.from("profiles").select("avatar_url").eq("id", user.id).maybeSingle(),
    admin.from("va_vetting").select("stage").eq("va_id", user.id).maybeSingle(),
  ]);

  const { error } = await admin.rpc("record_va_public_profile_consent", {
    p_va_id: user.id,
    p_granted: granted,
    p_version: PUBLIC_PROFILE_CONSENT_VERSION,
    p_source: "va_profile_settings"
  });

  if (error) {
    redirect(`/workspace/va/profile?error=${encodeURIComponent("We could not save your public profile privacy choice. Please try again.")}#visibility`);
  }

  if (!granted) {
    await admin.from("va_profiles").update({ directory_visible: false }).eq("user_id", user.id);
  } else if (current) {
    const eligible = isPubliclyEligible(
      {
        ...current,
        public_profile_consent: true,
        public_profile_consent_at: new Date().toISOString(),
        public_profile_consent_withdrawn_at: null,
        public_profile_consent_version: PUBLIC_PROFILE_CONSENT_VERSION,
      },
      account?.avatar_url,
      vetting?.stage
    );
    if (!eligible && current.directory_visible) {
      await admin.from("va_profiles").update({ directory_visible: false }).eq("user_id", user.id);
    }
  }

  revalidatePath("/workspace/va");
  revalidatePath("/workspace/va/profile");
  revalidatePath("/find-talent");
  redirect(`/workspace/va/profile?consent=${granted ? "granted" : "withdrawn"}#visibility`);
}
