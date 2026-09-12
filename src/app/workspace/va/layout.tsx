export const metadata = { robots: { index: false, follow: false } };
import { requireRole } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { VaOnboardingGate } from "@/components/va-onboarding-gate";
import { getWorkspaceBadges } from "@/lib/workspace-badges";
import { createClient } from "@/lib/supabase/server";
import { getVaCompletion } from "@/lib/profile-completeness";

export default async function VaLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await requireRole("va");
  const supabase = await createClient();
  const [{ data: va }, badges] = await Promise.all([
    supabase.from("va_profiles").select("headline,bio,primary_category,skills,tools,years_experience,weekly_hours,hourly_rate,resume_path,portfolio_url").eq("user_id", user.id).maybeSingle(),
    getWorkspaceBadges("va", user.id)
  ]);
  const needsQuickSetup = getVaCompletion(va, profile.avatar_url).score === 0;

  return <AppShell badges={badges} role="va" name={profile.full_name} title="VA workspace">
    <VaOnboardingGate needsQuickSetup={needsQuickSetup}>{children}</VaOnboardingGate>
  </AppShell>;
}
