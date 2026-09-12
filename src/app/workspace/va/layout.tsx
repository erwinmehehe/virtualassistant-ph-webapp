export const metadata = { robots: { index: false, follow: false } };
import { requireRole } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

export default async function VaLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await requireRole("va");
  return <AppShell userId={user.id} role="va" name={profile.full_name} title="VA workspace">{children}</AppShell>;
}
