export const metadata = { robots: { index: false, follow: false } };

import { requireAnyRole } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

export default async function ClientSuccessLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await requireAnyRole(["admin", "recruiter"]);
  return <AppShell userId={user.id} role={profile.role} name={profile.full_name} title="Client Success">{children}</AppShell>;
}
