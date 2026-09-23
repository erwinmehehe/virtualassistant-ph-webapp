import Link from "next/link";
import { ArrowLeft, BookOpenCheck, LogOut, Sparkles } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import type { Role } from "@/lib/types";

const roleHome: Record<Role, string> = {
  client: "/workspace/client",
  va: "/workspace/va",
  recruiter: "/workspace/recruiter/today",
  admin: "/workspace/admin/today",
};

function isRole(value: unknown): value is Role {
  return value === "client" || value === "va" || value === "recruiter" || value === "admin";
}

export function TrainingShell({
  profile,
  children,
}: {
  profile?: { role?: string | null; full_name?: string | null } | null;
  children: React.ReactNode;
}) {
  const workspaceHref = isRole(profile?.role) ? roleHome[profile.role] : null;

  return (
    <div className="app-shell dashboard-shell">
      <aside className="app-sidebar">
        <div className="app-sidebar-brand">
          <Link className="app-brand" href="/workspace/training" aria-label="Go to Training home">
            <span className="app-brand-mark"><Sparkles size={19}/></span>
            <span className="app-brand-copy"><strong>VirtualAssistant</strong><small>.com.ph</small></span>
          </Link>
        </div>

        <nav className="app-nav app-nav-desktop" aria-label="Training navigation">
          <div className="app-nav-group">
            <div className="sidebar-label">Free training</div>
            <Link href="/workspace/training"><BookOpenCheck size={17}/><span>My learning</span></Link>
            {workspaceHref ? <Link href={workspaceHref}><ArrowLeft size={17}/><span>Back to workspace</span></Link> : null}
          </div>
        </nav>

        <nav className="app-nav-mobile" aria-label="Mobile training navigation">
          <Link href="/workspace/training"><BookOpenCheck size={18}/><span>My learning</span></Link>
          {workspaceHref ? <Link href={workspaceHref}><ArrowLeft size={18}/><span>Workspace</span></Link> : null}
        </nav>

        <div className="sidebar-footer">
          <div className="app-account-card" aria-label="Training learner">
            <span className="app-account-avatar"><BookOpenCheck size={18}/></span>
            <div className="user-copy"><strong>{profile?.full_name || "Learner"}</strong><span>Free training</span></div>
          </div>
          <form action={logoutAction}>
            <button className="btn btn-ghost app-logout-button" type="submit"><LogOut size={16}/><span>Sign out</span></button>
          </form>
        </div>
      </aside>

      <main className="app-main" id="main-content">
        <div className="app-topbar">
          <div className="app-topbar-inner">
            <div className="app-topbar-title">
              <Link className="app-topbar-workspace-home" href="/workspace/training">Training</Link>
              <strong className="app-topbar-page-title">Free learning</strong>
            </div>
          </div>
        </div>
        <div className="app-content">{children}</div>
      </main>
    </div>
  );
}
