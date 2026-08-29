export const metadata = { robots: { index: false, follow: false } };
import { requireRole } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { getWorkspaceBadges } from "@/lib/workspace-badges";
export default async function ClientLayout({children}:{children:React.ReactNode}){const {user,profile}=await requireRole("client");const badges=await getWorkspaceBadges("client",user.id);return <AppShell badges={badges} role="client" name={profile.full_name} title="Client workspace">{children}</AppShell>}
