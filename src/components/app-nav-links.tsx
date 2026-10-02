"use client";

import Link from "next/link";
import {
  Activity,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  CircleDollarSign,
  CircleEllipsis,
  CircleUserRound,
  FileText,
  ClipboardCheck,
  GraduationCap,
  LayoutDashboard,
  ListTodo,
  LifeBuoy,
  MessageCircle,
  LogOut,
  Search,
  Settings,
  ShieldCheck,
  Target,
  UsersRound,
  Wrench
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { logoutAction } from "@/app/actions/auth";
import type { Role } from "@/lib/types";

type NavItem = readonly [string, string, typeof LayoutDashboard];
type NavGroup = { label: string; items: readonly NavItem[] };

/* Keep the four highest-frequency destinations in the mobile bar. Everything
 * else stays reachable from the desktop sidebar and the mobile More menu.
 * Built workspace pages must never depend on someone knowing a URL by hand. */
const nav: Record<Role, readonly NavGroup[]> = {
  client: [
    {
      label: "Workspace",
      items: [
        ["Client Dashboard", "/workspace/client", LayoutDashboard],
        ["My Hire", "/workspace/client/jobs", BriefcaseBusiness],
        ["Proposals", "/workspace/client/proposals", FileText],
        ["Candidates", "/workspace/client/candidates", UsersRound],
        ["Messages", "/workspace/client/messages", MessageCircle],
        ["Interviews", "/workspace/client/interviews", CalendarDays],
        ["Offers", "/workspace/client/offers", ClipboardCheck],
        ["My Team", "/workspace/client/team", UsersRound],
        ["Workroom", "/workspace/client/workroom", Wrench],
        ["Notifications", "/workspace/client/notifications", Bell],
        ["Billing", "/workspace/client/payments", CircleDollarSign],
        ["Support", "/workspace/client/support", LifeBuoy],
        ["Settings", "/workspace/account", Settings],
      ],
    },
  ],
  va: [
    {
      label: "Workspace",
      items: [
        ["Home", "/workspace/va", LayoutDashboard],
        ["Profile", "/workspace/va/profile", CircleUserRound],
        ["Opportunities", "/workspace/va/jobs", Search],
        ["Interviews", "/workspace/va/interviews", CalendarDays],
        ["Recruiter messages", "/workspace/va/messages", MessageCircle],
        ["My Placement", "/workspace/va/workroom", Wrench],
        ["Work Readiness", "/workspace/va/work-readiness", ClipboardCheck],
        ["Training", "/workspace/training", GraduationCap],
        ["Payouts", "/workspace/va/payments", CircleDollarSign],
        ["Support", "/workspace/va/support", LifeBuoy],
        ["Account settings", "/workspace/account", Settings],
      ],
    },
  ],
  recruiter: [
    {
      label: "Hiring",
      items: [
        ["My Day", "/workspace/recruiter/today", ListTodo],
        ["Clients", "/workspace/recruiter/crm", UsersRound],
        ["Discovery", "/workspace/recruiter/discovery", CalendarDays],
        ["Client messages", "/workspace/recruiter/messages", MessageCircle],
        ["VA messages", "/workspace/recruiter/va-messages", MessageCircle],
        ["Roles", "/workspace/recruiter/roles", BriefcaseBusiness],
        ["Talent", "/workspace/recruiter/talent", Search],
        ["Account settings", "/workspace/account", Settings],
      ],
    },
    {
      label: "Tools",
      items: [
        ["Work Readiness", "/workspace/recruiter/work-readiness", ClipboardCheck],
        ["Coverage", "/workspace/recruiter/coverage", Target],
      ],
    },
    {
      label: "Reports",
      items: [
        ["Performance", "/workspace/recruiter/performance", BarChart3],
        ["Finance", "/workspace/recruiter/finance", CircleDollarSign],
      ],
    },
  ],
  admin: [
    {
      label: "Workspace",
      items: [
        ["Today", "/workspace/admin/today", ListTodo],
        ["Finance", "/workspace/admin/finance", CircleDollarSign],
        ["Sales", "/workspace/admin/sales", BriefcaseBusiness],
        ["Client Success", "/workspace/client-success", UsersRound],
        ["Agency Funnel", "/workspace/admin/funnel", Activity],
        ["Analytics", "/workspace/admin/analytics", BarChart3],
        ["Users", "/workspace/admin/users", UsersRound],
        ["Account settings", "/workspace/account", Settings],
      ],
    },
    {
      label: "Administration",
      items: [
        ["Audit Log", "/workspace/admin/audit", Activity],
        ["Email Health", "/workspace/admin/email-health", Activity],
        ["Training", "/workspace/admin/training", GraduationCap],
        ["Deletion requests", "/workspace/admin/account-deletion-requests", ShieldCheck],
        ["Settings", "/workspace/admin/settings", Settings],
      ],
    },
  ],
};

const mobilePrimary: Record<Role, string[]> = {
  client: ["/workspace/client", "/workspace/client/jobs", "/workspace/client/candidates", "/workspace/client/messages"],
  va: ["/workspace/va", "/workspace/va/jobs", "/workspace/va/workroom", "/workspace/va/support"],
  recruiter: ["/workspace/recruiter/today", "/workspace/recruiter/crm", "/workspace/recruiter/messages", "/workspace/recruiter/roles"],
  admin: ["/workspace/admin/today", "/workspace/admin/finance", "/workspace/admin/sales", "/workspace/admin/analytics"],
};

function activeFor(pathname: string, href: string) {
  if (pathname === href) return true;
  if (["/workspace/client", "/workspace/va", "/workspace/admin", "/workspace/recruiter", "/workspace/client-success"].includes(href)) return false;
  return pathname.startsWith(`${href}/`);
}

function navToneFor(label: string, href: string) {
  const key = `${label} ${href}`.toLowerCase();

  if (key.includes("training")) return "violet";
  if (key.includes("payout") || key.includes("payment") || key.includes("finance")) return "emerald";
  if (key.includes("support")) return "rose";
  if (key.includes("work readiness") || key.includes("coverage")) return "teal";
  if (key.includes("message")) return "indigo";
  if (key.includes("interview")) return "sky";
  if (key.includes("opportunit") || key.includes("/jobs") || key.includes("hiring") || key.includes("roles")) return "amber";
  if (key.includes("placement") || key.includes("client success")) return "purple";
  if (key.includes("profile") || key.includes("talent") || key.includes("users")) return "cyan";
  if (key.includes("analytics") || key.includes("funnel")) return "blue";
  if (key.includes("settings") || key.includes("audit") || key.includes("email health") || key.includes("deletion")) return "slate";
  return "indigo";
}

function Badge({ count }: { count: number }) {
  if (!count) return null;
  return <span className="nav-badge" aria-label={`${count} unread`}>{count > 99 ? "99+" : count}</span>;
}

export function AppNavLinks({ role, badges = {} }: { role: Role; badges?: Record<string, number> }) {
  const pathname = usePathname();
  const moreRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    moreRef.current?.removeAttribute("open");
  }, [pathname]);

  useEffect(() => {
    const details = moreRef.current;
    if (!details) return;

    const closeMore = () => details.removeAttribute("open");
    const handlePointerDown = (event: PointerEvent) => {
      if (!details.open) return;
      if (event.target instanceof Node && !details.contains(event.target)) closeMore();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !details.open) return;
      closeMore();
      details.querySelector<HTMLElement>("summary")?.focus();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const groups = nav[role];
  const desktopGroups = groups.map((group) => ({ ...group, items: group.items.filter(([, href]) => href !== "/workspace/account") })).filter((group) => group.items.length);
  const primarySet = new Set(mobilePrimary[role]);
  const primaryItems = groups.flatMap((group) => group.items).filter(([, href]) => primarySet.has(href));
  const secondaryGroups = groups
    .map((group) => ({ ...group, items: group.items.filter(([, href]) => !primarySet.has(href)) }))
    .filter((group) => group.items.length);
  const moreActive = secondaryGroups.some((group) => group.items.some(([, href]) => activeFor(pathname, href)));
  const moreUnread = secondaryGroups.reduce(
    (total, group) => total + group.items.reduce((subtotal, [, href]) => subtotal + (badges[href] || 0), 0),
    0,
  );
  const renderItem = ([label, href, Icon]: NavItem, mobile = false) => {
    const active = activeFor(pathname, href);
    return (
      <Link
        prefetch={false}
        href={href}
        key={href}
        className={active ? "active" : undefined}
        aria-current={active ? "page" : undefined}
        onClick={mobile ? () => moreRef.current?.removeAttribute("open") : undefined}
      >
        <span className={`app-nav-icon nav-tone-${navToneFor(label, href)}`} aria-hidden="true">
          <Icon size={mobile ? 17 : 16} />
        </span>
        <span>{label}</span>
        <Badge count={badges[href] || 0} />
      </Link>
    );
  };

  return (
    <>
      <nav className="app-nav app-nav-desktop" aria-label="Workspace navigation">
        {desktopGroups.map((group) => (
          <div className="app-nav-group" key={group.label}>
            <div className="sidebar-label">{group.label}</div>
            {group.items.map((item) => renderItem(item))}
          </div>
        ))}
      </nav>
      <nav className="app-nav-mobile" aria-label="Mobile workspace navigation">
        {primaryItems.map((item) => renderItem(item))}
        {secondaryGroups.length ? (
          <details ref={moreRef} className={`mobile-more ${moreActive ? "active" : ""}`}>
            <summary aria-current={moreActive ? "page" : undefined}>
              <CircleEllipsis size={19} />
              <span>More</span>
              <Badge count={moreUnread} />
            </summary>
            <div className="mobile-more-panel">
              {secondaryGroups.map((group) => (
                <div className="mobile-more-group" key={group.label}>
                  <strong>{group.label}</strong>
                  {group.items.map((item) => renderItem(item, true))}
                </div>
              ))}
              <div className="mobile-more-group mobile-account-actions">
                <strong>Account</strong>
                {!secondaryGroups.some((group) => group.items.some(([, href]) => href === "/workspace/account"))
                  ? renderItem(["Account settings", "/workspace/account", Settings], true)
                  : null}
                <form action={logoutAction} className="mobile-logout-form">
                  <button className="mobile-logout-button" type="submit">
                    <span className="app-nav-icon nav-tone-rose" aria-hidden="true"><LogOut size={17} /></span>
                    <span>Sign out</span>
                  </button>
                </form>
              </div>
            </div>
          </details>
        ) : null}
      </nav>
    </>
  );
}
