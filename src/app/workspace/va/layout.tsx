export const metadata = { robots: { index: false, follow: false } };
import { requireRoleFast } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

export default async function VaLayout({ children }: { children: React.ReactNode }) {
  const { userId, profile } = await requireRoleFast("va");
  return <AppShell userId={userId} role="va" name={profile.full_name} avatarUrl={profile.avatar_url} title="VA workspace">{children}</AppShell>;
}
