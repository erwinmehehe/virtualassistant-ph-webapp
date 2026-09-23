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
    <div className="app-shell dashboard-shell training-shell">
      <aside className="app-sidebar">
        <div className="app-sidebar-brand">
          <Link className="app-brand" href="/workspace/training" aria-label="Go to Training home">
            <span className="app-brand-mark"><Sparkles size={19}/></span>
            <span className="app-brand-copy"><strong>VirtualAssistant</strong><small>.com.ph</small></span>
          </Link>
        </div>

        <nav className="app-nav app-nav-desktop" aria-label="Training navigation">
          <div className="app-nav-group">
            <Link className="active" aria-current="page" href="/workspace/training"><BookOpenCheck size={17}/><span>Training home</span></Link>
            {workspaceHref ? <Link href={workspaceHref}><ArrowLeft size={17}/><span>{profile?.role === "va" ? "VA workspace" : "Workspace"}</span></Link> : null}
          </div>
        </nav>

        <nav className="app-nav-mobile" aria-label="Mobile training navigation">
          <Link className="active" aria-current="page" href="/workspace/training"><BookOpenCheck size={18}/><span>Training</span></Link>
          {workspaceHref ? <Link href={workspaceHref}><ArrowLeft size={18}/><span>{profile?.role === "va" ? "VA workspace" : "Workspace"}</span></Link> : null}
        </nav>

        <div className="sidebar-footer">
          <Link className="app-account-card" href="/workspace/account" aria-label="Open account settings">
            <span className="app-account-avatar"><BookOpenCheck size={18}/></span>
            <div className="user-copy"><strong>{profile?.full_name || "Learner"}</strong><span>Learner account</span></div>
          </Link>
          <form action={logoutAction}>
            <button className="btn btn-ghost app-logout-button" type="submit"><LogOut size={16}/><span>Sign out</span></button>
          </form>
        </div>
      </aside>

      <main className="app-main" id="main-content">
        <div className="app-topbar">
          <div className="app-topbar-inner">
            <div className="app-topbar-title">
              <strong className="app-topbar-page-title">Training</strong>
            </div>
          </div>
        </div>
        <div className="app-content">{children}</div>
      </main>
    </div>
  );
}
