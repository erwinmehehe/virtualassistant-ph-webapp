export const metadata = { robots: { index: false, follow: false } };
import { requireRole } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
export default async function ClientLayout({children}:{children:React.ReactNode}){const {profile}=await requireRole("client");return <AppShell role="client" name={profile.full_name} title="Client workspace">{children}</AppShell>}
