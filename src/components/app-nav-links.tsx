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
  ClipboardCheck,
  LayoutDashboard,
  ListTodo,
  LifeBuoy,
  Search,
  Settings,
  ShieldCheck,
  UsersRound,
  Wrench,
} from "lucide-react";
import { usePathname } from "next/navigation";
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
        ["Overview", "/workspace/client", LayoutDashboard],
        ["Hiring", "/workspace/client/jobs", BriefcaseBusiness],
        ["My Team", "/workspace/client/team", UsersRound],
        ["Notifications", "/workspace/client/notifications", Bell],
        ["Payments", "/workspace/client/payments", CircleDollarSign],
        ["Support", "/workspace/client/support", LifeBuoy],
        ["Account settings", "/workspace/account", Settings],
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
        ["My Placement", "/workspace/va/workroom", Wrench],
        ["Work Readiness", "/workspace/va/work-readiness", ClipboardCheck],
        ["Payouts", "/workspace/va/payments", CircleDollarSign],
        ["Support", "/workspace/va/support", LifeBuoy],
        ["Account settings", "/workspace/account", Settings],
      ],
    },
  ],
  recruiter: [
    {
      label: "Workspace",
      items: [
        ["My Day", "/workspace/recruiter/today", ListTodo],
        ["Leads", "/workspace/recruiter/leads", BriefcaseBusiness],
        ["Roles", "/workspace/recruiter/roles", BriefcaseBusiness],
        ["Talent", "/workspace/recruiter/talent", Search],
        ["Client Success", "/workspace/client-success", Wrench],
      ],
    },
    {
      label: "Recruiting tools",
      items: [
        ["Work Readiness", "/workspace/recruiter/work-readiness", ClipboardCheck],
      ],
    },
    {
      label: "Performance",
      items: [
        ["Agency Funnel", "/workspace/recruiter/funnel", Activity],
        ["Recruiting Analytics", "/workspace/recruiter/analytics", BarChart3],
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
        ["Deletion requests", "/workspace/admin/account-deletion-requests", ShieldCheck],
        ["Settings", "/workspace/admin/settings", Settings],
      ],
    },
  ],
};

const mobilePrimary: Record<Role, string[]> = {
  client: ["/workspace/client", "/workspace/client/jobs", "/workspace/client/team", "/workspace/client/support"],
  va: ["/workspace/va", "/workspace/va/jobs", "/workspace/va/workroom", "/workspace/va/support"],
  recruiter: ["/workspace/recruiter/today", "/workspace/recruiter/leads", "/workspace/recruiter/roles", "/workspace/recruiter/talent"],
  admin: ["/workspace/admin/today", "/workspace/admin/finance", "/workspace/admin/sales", "/workspace/admin/analytics"],
};

function activeFor(pathname: string, href: string) {
  if (pathname === href) return true;
  if (["/workspace/client", "/workspace/va", "/workspace/admin", "/workspace/recruiter", "/workspace/client-success"].includes(href)) return false;
  return pathname.startsWith(`${href}/`);
}

function Badge({ count }: { count: number }) {
  if (!count) return null;
  return <span className="nav-badge" aria-label={`${count} unread`}>{count > 99 ? "99+" : count}</span>;
}

export function AppNavLinks({ role, badges = {} }: { role: Role; badges?: Record<string, number> }) {
  const pathname = usePathname();
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
        onClick={mobile ? (event) => event.currentTarget.closest("details")?.removeAttribute("open") : undefined}
      >
        <Icon size={mobile ? 18 : 17} />
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
          <details className={`mobile-more ${moreActive ? "active" : ""}`}>
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
            </div>
          </details>
        ) : null}
      </nav>
    </>
  );
}
