import Link from "next/link";
import {
  ArrowLeft,
  Award,
  BookOpenCheck,
  CircleEllipsis,
  GraduationCap,
  LogOut,
  Settings,
  Sparkles,
} from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import type { Role } from "@/lib/types";

const roleHome: Record<Role, string> = {
  client: "/workspace/client",
  va: "/workspace/va",
  recruiter: "/workspace/recruiter/today",
  admin: "/workspace/admin/today",
};

const roleWorkspaceLabel: Record<Role, string> = {
  client: "Client workspace",
  va: "VA workspace",
  recruiter: "Recruiter workspace",
  admin: "Admin workspace",
};

function isRole(value: unknown): value is Role {
  return value === "client" || value === "va" || value === "recruiter" || value === "admin";
}

function TrainingNavIcon({
  tone,
  children,
}: {
  tone: "violet" | "indigo" | "emerald" | "amber" | "cyan" | "slate" | "rose";
  children: React.ReactNode;
}) {
  return <span className={`app-nav-icon nav-tone-${tone}`} aria-hidden="true">{children}</span>;
}

export function TrainingShell({
  profile,
  children,
}: {
  profile?: { role?: string | null; full_name?: string | null } | null;
  children: React.ReactNode;
}) {
  const role = isRole(profile?.role) ? profile.role : null;
  const workspaceHref = role ? roleHome[role] : null;
  const workspaceLabel = role ? roleWorkspaceLabel[role] : "Workspace";
  const accountHref = role ? "/workspace/account" : "/workspace/training/account";
  const isAdminPreview = role === "admin";
  const pageTitle = isAdminPreview ? "Training preview" : "Learner dashboard";
  const accountLabel = isAdminPreview ? "Admin account" : role === "va" ? "VA learner" : "Training account";
  const contextLabel = isAdminPreview ? "Admin · Training preview" : role === "va" ? "VA · Training" : "Training account";

  return (
    <div className={`app-shell dashboard-shell training-shell training-role-${role || "unknown"}`}>
      <aside className="app-sidebar">
        <div className="app-sidebar-brand">
          <Link className="app-brand training-shell-brand" href="/training" aria-label="Go to public Training home">
            <span className="app-brand-mark"><Sparkles size={19}/></span>
            <span className="app-brand-copy">
              <strong>VirtualAssistant</strong>
              <small>.com.ph · Training</small>
            </span>
          </Link>
        </div>

        <nav className="app-nav app-nav-desktop training-shell-nav" aria-label="Training navigation">
          <div className="app-nav-group">
            <div className="sidebar-label">Training</div>
            <Link href="/workspace/training" aria-current="page">
              <TrainingNavIcon tone="violet"><GraduationCap size={16}/></TrainingNavIcon>
              <span>{isAdminPreview ? "Learner view" : "My learning"}</span>
            </Link>
            <Link href="/workspace/training?browse=1#course-library-title">
              <TrainingNavIcon tone="indigo"><BookOpenCheck size={16}/></TrainingNavIcon>
              <span>Browse courses</span>
            </Link>
            <Link href="/workspace/training#certificates">
              <TrainingNavIcon tone="emerald"><Award size={16}/></TrainingNavIcon>
              <span>Certificates</span>
            </Link>
          </div>

          <div className="app-nav-group training-shell-account-group">
            <div className="sidebar-label">Account & site</div>
            {workspaceHref ? (
              <Link href={workspaceHref}>
                <TrainingNavIcon tone="slate"><ArrowLeft size={16}/></TrainingNavIcon>
                <span>{workspaceLabel}</span>
              </Link>
            ) : null}
            <Link href={accountHref}>
              <TrainingNavIcon tone="slate"><Settings size={16}/></TrainingNavIcon>
              <span>Account settings</span>
            </Link>
            <Link className="training-shell-public-link" href="/training">
              <TrainingNavIcon tone="violet"><Sparkles size={16}/></TrainingNavIcon>
              <span>Public training home</span>
            </Link>
          </div>
        </nav>

        <nav className="app-nav-mobile training-shell-mobile-nav" aria-label="Mobile training navigation">
          <Link href="/workspace/training" aria-current="page">
            <TrainingNavIcon tone="violet"><GraduationCap size={17}/></TrainingNavIcon>
            <span>Learning</span>
          </Link>
          <Link href="/workspace/training?browse=1#course-library-title">
            <TrainingNavIcon tone="indigo"><BookOpenCheck size={17}/></TrainingNavIcon>
            <span>Courses</span>
          </Link>
          <Link href="/workspace/training#certificates">
            <TrainingNavIcon tone="emerald"><Award size={17}/></TrainingNavIcon>
            <span>Certificates</span>
          </Link>
          <details className="training-mobile-more">
            <summary>
              <TrainingNavIcon tone="slate"><CircleEllipsis size={17}/></TrainingNavIcon>
              <span>More</span>
            </summary>
            <div className="training-mobile-more-panel">
              <strong>Account & site</strong>
              {workspaceHref ? (
                <Link href={workspaceHref}>
                  <TrainingNavIcon tone="slate"><ArrowLeft size={17}/></TrainingNavIcon>
                  <span>{workspaceLabel}</span>
                </Link>
              ) : null}
              <Link href={accountHref}>
                <TrainingNavIcon tone="slate"><Settings size={17}/></TrainingNavIcon>
                <span>Account settings</span>
              </Link>
              <Link href="/training">
                <TrainingNavIcon tone="violet"><Sparkles size={17}/></TrainingNavIcon>
                <span>Training home</span>
              </Link>
              <form action={logoutAction}>
                <button className="training-mobile-logout" type="submit">
                  <TrainingNavIcon tone="rose"><LogOut size={17}/></TrainingNavIcon>
                  <span>Sign out</span>
                </button>
              </form>
            </div>
          </details>
        </nav>

        <div className="sidebar-footer">
          <Link className="app-account-card" href={accountHref} aria-label="Open account settings">
            <span className="app-account-avatar"><BookOpenCheck size={18}/></span>
            <div className="user-copy"><strong>{profile?.full_name || "Account"}</strong><span>{accountLabel}</span></div>
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
              <Link className="app-topbar-workspace-home" href={workspaceHref || "/training"}>
                {contextLabel}
              </Link>
              <strong className="app-topbar-page-title">{pageTitle}</strong>
            </div>
            <details className="training-detail-account-menu">
              <summary aria-label="Open training account menu"><CircleEllipsis size={19}/></summary>
              <div className="training-detail-account-panel">
                {workspaceHref ? <Link href={workspaceHref}>{workspaceLabel}</Link> : null}
                <Link href={accountHref}>Account settings</Link>
                <form action={logoutAction}><button type="submit">Sign out</button></form>
              </div>
            </details>
          </div>
        </div>
        <div className="app-content">{children}</div>
      </main>
    </div>
  );
}
