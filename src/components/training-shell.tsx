import Link from "next/link";
import {
  ArrowLeft,
  Award,
  BookOpenCheck,
  BriefcaseBusiness,
  GraduationCap,
  LogOut,
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
  tone: "violet" | "indigo" | "emerald" | "amber" | "cyan" | "slate";
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

  return (
    <div className="app-shell dashboard-shell training-shell">
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
              <span>My learning</span>
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

          <div className="app-nav-group">
            <div className="sidebar-label">VirtualAssistant.com.ph</div>
            <Link className="training-shell-public-link" href="/training">
              <TrainingNavIcon tone="violet"><Sparkles size={16}/></TrainingNavIcon>
              <span>Training home</span>
            </Link>
            <Link href="/jobs">
              <TrainingNavIcon tone="amber"><BriefcaseBusiness size={16}/></TrainingNavIcon>
              <span>VA jobs</span>
            </Link>
            <Link href="/blog">
              <TrainingNavIcon tone="cyan"><BookOpenCheck size={16}/></TrainingNavIcon>
              <span>VA guides</span>
            </Link>
            {workspaceHref ? (
              <Link href={workspaceHref}>
                <TrainingNavIcon tone="slate"><ArrowLeft size={16}/></TrainingNavIcon>
                <span>{workspaceLabel}</span>
              </Link>
            ) : null}
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
          {workspaceHref ? (
            <Link href={workspaceHref}>
              <TrainingNavIcon tone="slate"><ArrowLeft size={17}/></TrainingNavIcon>
              <span>Workspace</span>
            </Link>
          ) : (
            <Link href="/jobs">
              <TrainingNavIcon tone="amber"><BriefcaseBusiness size={17}/></TrainingNavIcon>
              <span>VA jobs</span>
            </Link>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="app-account-card" aria-label="Training learner">
            <span className="app-account-avatar"><BookOpenCheck size={18}/></span>
            <div className="user-copy"><strong>{profile?.full_name || "Learner"}</strong><span>Learner account</span></div>
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
              <Link className="app-topbar-workspace-home" href="/training">Training</Link>
              <strong className="app-topbar-page-title">Learner dashboard</strong>
            </div>
            <div className="training-shell-topbar-actions">
              <Link className="btn training-shell-browse" href="/workspace/training?browse=1#course-library-title">
                Browse courses
              </Link>
              <Link className="btn app-topbar-public training-shell-public" href="/training">
                Training home
              </Link>
            </div>
          </div>
        </div>
        <div className="app-content">{children}</div>
      </main>
    </div>
  );
}
