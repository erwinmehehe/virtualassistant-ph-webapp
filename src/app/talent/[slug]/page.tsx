import { notFound, redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionProfile } from "@/lib/auth";
import { isUuid } from "@/lib/public-routing";

/**
 * Compatibility route for older /talent/<slug-or-uuid> links.
 * Public profile access is disabled. Staff can still recover an old internal
 * talent-pool link and land on the appropriate private review screen.
 */
export default async function LegacyTalentProfilePage({ params }: { params: Promise<{slug:string}> }) {
  const { slug } = await params;
  const { profile } = await getSessionProfile();

  if (profile?.role === "recruiter" || profile?.role === "admin") {
    const admin = createAdminClient();
    const privateQuery = admin.from("va_profiles").select("user_id,slug");
    const { data: privateVa } = isUuid(slug)
      ? await privateQuery.eq("user_id", slug).maybeSingle()
      : await privateQuery.eq("slug", slug).maybeSingle();

    if (privateVa?.user_id) {
      if (profile.role === "admin") redirect(`/workspace/admin/vetting/${privateVa.user_id}`);
      redirect(`/workspace/recruiter/candidates/${privateVa.user_id}`);
    }
  }

  notFound();
}
