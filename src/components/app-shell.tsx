import Link from "next/link";
import { Suspense } from "react";
import { CircleUserRound, LifeBuoy, LogOut, Sparkles } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { AppNavLinks } from "@/components/app-nav-links";
import { getWorkspaceBadges, type WorkspaceBadges } from "@/lib/workspace-badges";
import type { Role } from "@/lib/types";

const roleLabels: Record<Role, string> = {
  client: "Client",
  va: "Virtual Assistant",
  recruiter: "Recruiter",
  admin: "Admin",
};

const workspaceHome: Record<Role, string> = {
  client: "/workspace/client",
  va: "/workspace/va",
  recruiter: "/workspace/recruiter",
  admin: "/workspace/admin/today",
};

async function WorkspaceNavWithBadges({ role, userId }: { role: Role; userId: string }) {
  const badges = await getWorkspaceBadges(role, userId);
  return <AppNavLinks role={role} badges={badges}/>;
}

export function AppShell({ role, name, title, children, badges, userId }: { role: Role; name?: string | null; title: string; children: React.ReactNode; badges?: WorkspaceBadges; userId?: string | null }) {
  const roleLabel = roleLabels[role];
  const nav = badges
    ? <AppNavLinks role={role} badges={badges}/>
    : userId
      ? <Suspense fallback={<AppNavLinks role={role}/>}><WorkspaceNavWithBadges role={role} userId={userId}/></Suspense>
      : <AppNavLinks role={role}/>;

  return (
    <div className="app-shell dashboard-shell">
      <aside className="app-sidebar">
        <div className="app-sidebar-brand">
          <Link className="app-brand" href={workspaceHome[role]} aria-label={`Go to ${roleLabel} workspace home`}>
            <span className="app-brand-mark"><Sparkles size={19}/></span>
            <span className="app-brand-copy"><strong>VirtualAssistant</strong><small>.com.ph</small></span>
          </Link>
        </div>


        {nav}

        <div className="sidebar-footer">
          <Link className="app-support-link" href="/contact"><LifeBuoy size={15}/><span>Help and support</span></Link>
          <Link
            className="app-account-card"
            href="/workspace/account"
            aria-label="Open account settings"
            title="Account settings"
          >
            <span className="app-account-avatar"><CircleUserRound size={18}/></span>
            <div className="user-copy"><strong>{name || "Account"}</strong><span>{roleLabel}</span></div>
          </Link>
          <form action={logoutAction}>
            <button className="btn btn-ghost app-logout-button" type="submit"><LogOut size={16}/><span>Sign out</span></button>
          </form>
        </div>
      </aside>

      <main className="app-main" id="main-content">
        <div className="app-topbar">
          <div className="app-topbar-inner">
            <div className="app-topbar-title"><Link className="app-topbar-workspace-home" href={workspaceHome[role]}>{roleLabel} workspace</Link><strong className="app-topbar-page-title">{title}</strong></div>
          </div>
        </div>
        <div className="app-content">{children}</div>
      </main>
    </div>
  );
}
