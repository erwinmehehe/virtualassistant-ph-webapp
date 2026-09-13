export const metadata = { robots: { index: false, follow: false } };
import { requireRoleFast } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
export default async function ClientLayout({children}:{children:React.ReactNode}){const {userId,profile}=await requireRoleFast("client");return <AppShell userId={userId} role="client" name={profile.full_name} title="Client workspace">{children}</AppShell>}
