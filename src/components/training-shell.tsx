import Link from "next/link";
import {
  Award,
  Bell,
  Bookmark,
  BookOpen,
  BookOpenCheck,
  CalendarDays,
  CircleEllipsis,
  GraduationCap,
  Home,
  Library,
  LogOut,
  Route,
  Settings,
} from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import type { Role } from "@/lib/types";
import { TrainingDashboardSearch } from "@/components/training-dashboard-search";
import { markAllTrainingNotificationsReadAction, openTrainingNotificationAction } from "@/app/actions/training-notifications";
import type { TrainingShellNotification } from "@/lib/training-shell-data";

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

function initials(name?: string | null) {
  return String(name || "VA")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0] || "")
    .join("")
    .toUpperCase() || "VA";
}

function NavIcon({ children }: { children: React.ReactNode }) {
  return <span className="training-reference-nav-icon" aria-hidden="true">{children}</span>;
}

export function TrainingShell({
  profile,
  learnerName,
  notifications,
  unreadCount,
  children,
}: {
  profile?: { role?: string | null; full_name?: string | null } | null;
  learnerName?: string | null;
  notifications: TrainingShellNotification[];
  unreadCount: number;
  children: React.ReactNode;
}) {
  const role = isRole(profile?.role) ? profile.role : null;
  const workspaceHref = role ? roleHome[role] : null;
  const workspaceLabel = role ? roleWorkspaceLabel[role] : "Workspace";
  const accountHref = role ? "/workspace/account" : "/workspace/training/account";
  const name = profile?.full_name || learnerName || "Training learner";
  const avatar = initials(name);
  const roleLabel = role === "va" ? "VA learner" : role === "admin" ? "Training preview" : "Training account";
  const today = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Manila",
  }).format(new Date());

  return (
    <div className={`app-shell dashboard-shell training-shell training-reference-shell training-role-${role || "unknown"}`}>
      <aside className="app-sidebar training-reference-sidebar">
        <div className="app-sidebar-brand">
          <Link className="training-reference-logo" href="/training" aria-label="Go to public Training home">
            VAPH<span className="sr-only">VirtualAssistant.com.ph · Training</span>
          </Link>
        </div>

        <nav className="app-nav app-nav-desktop training-reference-sidebar-nav" aria-label="Training navigation">
          <div className="sidebar-label">Training</div>
          <Link className="is-active" href="/workspace/training" aria-current="page">
            <NavIcon><Home size={17}/></NavIcon>
            <span>Dashboard</span>
          </Link>
          <Link href="/workspace/training#my-courses">
            <NavIcon><GraduationCap size={17}/></NavIcon>
            <span>My Training</span>
          </Link>
          <Link href="/workspace/training#certificates">
            <NavIcon><Award size={17}/></NavIcon>
            <span>My Certificates</span>
          </Link>
          <Link href="/workspace/training?browse=1#course-library-title">
            <NavIcon><Library size={17}/></NavIcon>
            <span>Course Library</span>
          </Link>
          <Link href="/workspace/training#learning-path">
            <NavIcon><Route size={17}/></NavIcon>
            <span>Learning Path</span>
          </Link>
          <Link href="/workspace/training#saved-courses">
            <NavIcon><Bookmark size={17}/></NavIcon>
            <span>Saved Courses</span>
          </Link>
          <Link href={accountHref}>
            <NavIcon><Settings size={17}/></NavIcon>
            <span>Settings</span>
          </Link>
        </nav>

        <nav className="app-nav-mobile training-shell-mobile-nav training-reference-mobile-nav" aria-label="Mobile training navigation">
          <Link href="/workspace/training#training-dashboard-overview">
            <NavIcon><Home size={17}/></NavIcon>
            <span>Learning</span>
          </Link>
          <Link href="/workspace/training?browse=1#course-library-title">
            <NavIcon><GraduationCap size={17}/></NavIcon>
            <span>Courses</span>
          </Link>
          <Link href="/workspace/training#certificates">
            <NavIcon><Award size={17}/></NavIcon>
            <span>Certificates</span>
          </Link>
          <details>
            <summary>
              <NavIcon><CircleEllipsis size={17}/></NavIcon>
              <span>More</span>
            </summary>
            <div className="training-mobile-more-panel">
              <Link href="/workspace/training?browse=1#course-library-title"><BookOpen size={16}/>Course Library</Link>
              <Link href="/workspace/training#learning-path"><Route size={16}/>Learning Path</Link>
              <Link href="/workspace/training#saved-courses"><Bookmark size={16}/>Saved Courses</Link>
              <Link href={accountHref}><Settings size={16}/>Account settings</Link>
              <Link href="/training"><BookOpenCheck size={16}/>Public training</Link>
              {workspaceHref ? <Link href={workspaceHref}>{workspaceLabel}</Link> : null}
              <form action={logoutAction}><button className="training-mobile-logout" type="submit"><LogOut size={16}/><span>Sign out</span></button></form>
            </div>
          </details>
        </nav>

        <div className="sidebar-footer training-reference-sidebar-footer">
          <div className="sidebar-label">Account & site</div>
          <Link className="training-reference-sidebar-account" href={accountHref}>
            <span>{avatar}</span>
            <div><strong>{name}</strong><small>{roleLabel}</small></div>
          </Link>
          {workspaceHref ? <Link className="training-reference-workspace-link" href={workspaceHref}>{workspaceLabel}</Link> : null}
          <form action={logoutAction}>
            <button className="btn btn-ghost app-logout-button" type="submit"><LogOut size={16}/><span>Sign out</span></button>
          </form>
        </div>
      </aside>

      <main className="app-main" id="main-content">
        <div className="app-topbar training-reference-topbar">
          <div className="app-topbar-inner">
            <TrainingDashboardSearch />

            <div className="training-reference-topbar-actions">
              <details className="training-reference-notifications">
                <summary aria-label="Open training notifications">
                  <Bell size={17}/>
                  {unreadCount ? <span>{Math.min(unreadCount, 9)}</span> : null}
                </summary>
                <div className="training-reference-notification-panel">
                  <div className="training-reference-notification-head">
                    <strong>Training notifications</strong>
                    {unreadCount ? <form action={markAllTrainingNotificationsReadAction}><button type="submit">Mark all read</button></form> : null}
                  </div>
                  {notifications.length ? <div className="training-reference-notification-list">
                    {notifications.map((notification) => <form action={openTrainingNotificationAction} key={notification.id}>
                      <input type="hidden" name="notification_id" value={notification.id}/>
                      <button className={notification.readAt ? "" : "is-unread"} type="submit">
                        <span className="training-reference-notification-dot" aria-hidden="true"/>
                        <span>
                          <strong>{notification.title}</strong>
                          {notification.body ? <small>{notification.body}</small> : null}
                          <em>{new Intl.DateTimeFormat("en-PH",{month:"short",day:"numeric",timeZone:"Asia/Manila"}).format(new Date(notification.createdAt))}</em>
                        </span>
                      </button>
                    </form>)}
                  </div> : <p>You’re all caught up. New course and certificate updates will appear here.</p>}
                </div>
              </details>

              <div className="training-reference-date">
                <CalendarDays size={16}/>
                <span>{today}</span>
              </div>

              <details className="training-reference-profile training-detail-account-menu">
                <summary aria-label="Open training profile menu">
                  <span className="training-reference-profile-avatar">{avatar}</span>
                  <span className="training-reference-profile-copy"><strong>{name}</strong><small>{roleLabel}</small></span>
                </summary>
                <div className="training-reference-profile-menu training-detail-account-panel">
                  <Link href={accountHref}>Settings</Link>
                  {workspaceHref ? <Link href={workspaceHref}>{workspaceLabel}</Link> : null}
                  <Link href="/training">Public training home</Link>
                  <form action={logoutAction}><button type="submit">Sign out</button></form>
                </div>
              </details>
            </div>
          </div>
        </div>

        <div className="app-content">{children}</div>
      </main>
    </div>
  );
}
