export const metadata = { robots: { index: false, follow: false } };
import { requireRole } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { getWorkspaceBadges } from "@/lib/workspace-badges";
export default async function RecruiterLayout({children}:{children:React.ReactNode}){const {user,profile}=await requireRole("recruiter");const badges=await getWorkspaceBadges("recruiter",user.id);return <AppShell badges={badges} role="recruiter" name={profile.full_name} title="Recruiter workspace">{children}</AppShell>}
