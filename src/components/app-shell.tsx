import Link from "next/link";
import { CircleUserRound, ExternalLink, LifeBuoy, LogOut, Sparkles } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { AppNavLinks } from "@/components/app-nav-links";
import type { Role } from "@/lib/types";

const roleLabels: Record<Role, string> = {
  client: "Client",
  va: "Virtual Assistant",
  recruiter: "Recruiter",
  admin: "Admin",
};

export function AppShell({ role, name, title, children, badges }: { role: Role; name?: string | null; title: string; children: React.ReactNode; badges?: Record<string, number> }) {
  const roleLabel = roleLabels[role];

  return (
    <div className="app-shell dashboard-shell">
      <aside className="app-sidebar">
        <div className="app-sidebar-brand">
          <Link className="app-brand" href="/" aria-label="VirtualAssistant.com.ph home">
            <span className="app-brand-mark"><Sparkles size={19}/></span>
            <span className="app-brand-copy"><strong>VirtualAssistant</strong><small>.com.ph</small></span>
          </Link>
        </div>

        <div className="app-workspace-card" aria-label={`${roleLabel} workspace`}>
          <span className="app-workspace-icon"><CircleUserRound size={18}/></span>
          <span><small>Current workspace</small><strong>{roleLabel}</strong></span>
        </div>

        <div className="sidebar-label">Workspace</div>
        <AppNavLinks role={role} badges={badges}/>

        <div className="sidebar-footer">
          <div className="app-support-card">
            <strong>Need a hand?</strong>
            <p>If a hiring, vetting, payment, or account step is blocked, contact the team.</p>
            <Link href="/contact"><LifeBuoy size={14}/> Contact support</Link>
          </div>
          <div className="app-account-card">
            <span className="app-account-avatar"><CircleUserRound size={18}/></span>
            <div className="user-copy"><strong>{name || "Account"}</strong><span>{roleLabel}</span></div>
          </div>
          <form action={logoutAction}>
            <button className="btn btn-ghost app-logout-button" type="submit"><LogOut size={16}/><span>Sign out</span></button>
          </form>
        </div>
      </aside>

      <main className="app-main" id="main-content">
        <div className="app-topbar">
          <div className="app-topbar-inner">
            <div className="app-topbar-title"><span>{roleLabel} workspace</span><h1>{title}</h1></div>
            <Link className="btn btn-sm app-topbar-public" href="/" target="_blank" rel="noopener noreferrer"><ExternalLink size={15}/><span>Public site</span></Link>
          </div>
        </div>
        <div className="app-content">{children}</div>
      </main>
    </div>
  );
}
