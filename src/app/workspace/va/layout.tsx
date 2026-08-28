export const metadata = { robots: { index: false, follow: false } };
import { requireRole } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
export default async function VaLayout({children}:{children:React.ReactNode}){const {profile}=await requireRole("va");return <AppShell role="va" name={profile.full_name} title="VA workspace">{children}</AppShell>}
