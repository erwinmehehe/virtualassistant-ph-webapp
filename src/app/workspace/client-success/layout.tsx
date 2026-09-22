export const metadata = { robots: { index: false, follow: false } };

import Link from "next/link";
import { requireAnyRoleFast } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

export default async function ClientSuccessLayout({ children }: { children: React.ReactNode }) {
  const { userId, profile } = await requireAnyRoleFast(["admin", "recruiter"]);
  return <AppShell userId={userId} role={profile.role} name={profile.full_name} title="Client Success">
    <nav className="client-success-tabs" aria-label="Client Success workspace">
      <Link prefetch={false} className="btn btn-sm" href="/workspace/client-success">Placements</Link>
      <Link prefetch={false} className="btn btn-sm" href="/workspace/client-success/support">Support</Link>
      <Link prefetch={false} className="btn btn-sm" href="/workspace/client-success/retention">Retention &amp; replacements</Link>
    </nav>
    {children}
  </AppShell>;
}
