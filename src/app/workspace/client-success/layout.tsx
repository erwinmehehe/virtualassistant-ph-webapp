export const metadata = { robots: { index: false, follow: false } };

import Link from "next/link";
import { requireAnyRole } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

export default async function ClientSuccessLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await requireAnyRole(["admin", "recruiter"]);
  return <AppShell userId={user.id} role={profile.role} name={profile.full_name} title="Client Success">
    <nav className="row wrap" aria-label="Client Success workspace" style={{ marginBottom: 16 }}>
      <Link prefetch={false} className="btn btn-sm" href="/workspace/client-success">Placements</Link>
      <Link prefetch={false} className="btn btn-sm" href="/workspace/client-success/support">Support</Link>
      <Link prefetch={false} className="btn btn-sm" href="/workspace/client-success/retention">Retention &amp; replacements</Link>
    </nav>
    {children}
  </AppShell>;
}
