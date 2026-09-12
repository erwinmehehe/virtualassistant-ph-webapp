export const metadata = { robots: { index: false, follow: false } };
import { requireRole } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
export default async function RecruiterLayout({children}:{children:React.ReactNode}){const {user,profile}=await requireRole("recruiter");return <AppShell userId={user.id} role="recruiter" name={profile.full_name} title="Recruiter workspace">{children}</AppShell>}
