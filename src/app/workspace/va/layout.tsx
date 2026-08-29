export const metadata = { robots: { index: false, follow: false } };
import { requireRole } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { getWorkspaceBadges } from "@/lib/workspace-badges";
export default async function VaLayout({children}:{children:React.ReactNode}){const {user,profile}=await requireRole("va");const badges=await getWorkspaceBadges("va",user.id);return <AppShell badges={badges} role="va" name={profile.full_name} title="VA workspace">{children}</AppShell>}
