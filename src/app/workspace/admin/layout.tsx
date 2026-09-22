export const metadata = { robots: { index: false, follow: false } };

import { requireRoleFast } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId, profile } = await requireRoleFast("admin");
  return (
    <AppShell userId={userId} role="admin" name={profile.full_name} title="Admin workspace">
      {children}
    </AppShell>
  );
}
