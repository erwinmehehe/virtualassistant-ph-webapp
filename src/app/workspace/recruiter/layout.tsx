export const metadata = { robots: { index: false, follow: false } };
import { requireRoleFast } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

export default async function RecruiterLayout({ children }: { children: React.ReactNode }) {
  const { userId, profile } = await requireRoleFast("recruiter");
  return <AppShell userId={userId} role="recruiter" name={profile.full_name} title="Recruiter workspace">{children}</AppShell>;
}
