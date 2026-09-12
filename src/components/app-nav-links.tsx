"use client";

import Link from "next/link";
import { BarChart3, Bell, BriefcaseBusiness, Building2, CircleDollarSign, CircleEllipsis, CircleUserRound, FileText, Flag, Heart, LayoutDashboard, MessageSquare, Search, Settings, ShieldCheck, Sparkles, Tags, TrendingUp, UsersRound, Wrench, History } from "lucide-react";
import { usePathname } from "next/navigation";
import type { Role } from "@/lib/types";

type NavItem = readonly [string, string, typeof LayoutDashboard];
type NavGroup = { label: string; items: readonly NavItem[] };

const nav: Record<Role, readonly NavGroup[]> = {
  client: [
    { label: "Hiring", items: [
      ["Overview", "/workspace/client", LayoutDashboard],
      ["Roles", "/workspace/client/jobs", BriefcaseBusiness],
      ["Candidates", "/workspace/client/candidates", UsersRound],
      ["Saved VAs", "/workspace/client/saved", Heart]
    ]},
    { label: "Collaboration", items: [
      ["Messages", "/workspace/client/messages", MessageSquare],
      ["Workroom", "/workspace/client/workroom", Wrench],
      ["Notifications", "/workspace/client/notifications", Bell]
    ]},
    { label: "Account", items: [
      ["Payments", "/workspace/client/payments", CircleDollarSign],
      ["Company", "/workspace/client/company", Building2]
    ]}
  ],
  va: [
    { label: "Get ready", items: [
      ["Overview", "/workspace/va", LayoutDashboard],
      ["Quick setup", "/workspace/va/onboarding", Sparkles],
      ["My profile", "/workspace/va/profile", CircleUserRound],
      ["Vetting", "/workspace/va/vetting", ShieldCheck]
    ]},
    { label: "Opportunities", items: [
      ["Find jobs", "/workspace/va/jobs", Search],
      ["Applications", "/workspace/va/applications", FileText],
      ["Saved jobs", "/workspace/va/saved", Heart]
    ]},
    { label: "Work", items: [
      ["Messages", "/workspace/va/messages", MessageSquare],
      ["Workroom", "/workspace/va/workroom", Wrench]
    ]},
    { label: "Account", items: [
      ["Notifications", "/workspace/va/notifications", Bell],
      ["Payouts", "/workspace/va/payments", CircleDollarSign]
    ]}
  ],
  recruiter: [
    { label: "Client pipeline", items: [
      ["Overview", "/workspace/recruiter", LayoutDashboard],
      ["Client leads", "/workspace/recruiter/leads", BriefcaseBusiness],
      ["Roles", "/workspace/recruiter/matching", Sparkles]
    ]},
    { label: "Talent operations", items: [
      ["Talent", "/workspace/recruiter/talent", Search],
      ["Vetting", "/workspace/recruiter/queue", FileText],
      ["Bench", "/workspace/recruiter/bench", UsersRound],
      ["Stalled", "/workspace/recruiter/stalled", Flag]
    ]},
    { label: "Insights", items: [
      ["Activity", "/workspace/recruiter/activity", History],
      ["Conversion", "/workspace/recruiter/analytics", BarChart3],
      ["VA categories", "/workspace/recruiter/categories", Tags]
    ]}
  ],
  admin: [
    { label: "Operations", items: [
      ["Overview", "/workspace/admin", ShieldCheck],
      ["Lead inbox", "/workspace/admin/leads", MessageSquare],
      ["Job review", "/workspace/admin/jobs", BriefcaseBusiness],
      ["Vetting finalists", "/workspace/admin/vetting", FileText],
      ["Users", "/workspace/admin/users", UsersRound]
    ]},
    { label: "Risk and finance", items: [
      ["Payments", "/workspace/admin/payments", CircleDollarSign],
      ["Moderation", "/workspace/admin/moderation", Flag],
      ["Audit log", "/workspace/admin/audit", History]
    ]},
    { label: "Insights", items: [
      ["Analytics", "/workspace/admin/analytics", BarChart3],
      ["Sales analytics", "/workspace/admin/sales", TrendingUp]
    ]},
    { label: "Configuration", items: [
      ["Agency settings", "/workspace/admin/settings", Settings],
      ["System setup", "/workspace/admin/system", Wrench],
      ["Release health", "/workspace/admin/health", ShieldCheck]
    ]}
  ]
};

const mobilePrimary: Record<Role, string[]> = {
  client: ["/workspace/client", "/workspace/client/jobs", "/workspace/client/candidates", "/workspace/client/messages"],
  va: ["/workspace/va", "/workspace/va/jobs", "/workspace/va/applications", "/workspace/va/messages"],
  recruiter: ["/workspace/recruiter", "/workspace/recruiter/leads", "/workspace/recruiter/matching", "/workspace/recruiter/queue"],
  admin: ["/workspace/admin", "/workspace/admin/jobs", "/workspace/admin/vetting", "/workspace/admin/leads"]
};

function activeFor(pathname: string, href: string) {
  if (pathname === href) return true;
  if (["/workspace/client", "/workspace/va", "/workspace/admin", "/workspace/recruiter"].includes(href)) return false;
  return pathname.startsWith(`${href}/`);
}

function Badge({ count }: { count: number }) {
  if (!count) return null;
  return <span className="nav-badge" aria-label={`${count} unread`}>{count > 99 ? "99+" : count}</span>;
}

export function AppNavLinks({ role, badges = {} }: { role: Role; badges?: Record<string, number> }) {
  const pathname = usePathname();
  const groups = nav[role];
  const primarySet = new Set(mobilePrimary[role]);
  const primaryItems = groups.flatMap((group) => group.items).filter(([, href]) => primarySet.has(href));
  const secondaryGroups = groups
    .map((group) => ({ ...group, items: group.items.filter(([, href]) => !primarySet.has(href)) }))
    .filter((group) => group.items.length);
  const moreActive = secondaryGroups.some((group) => group.items.some(([, href]) => activeFor(pathname, href)));
  const moreUnread = secondaryGroups.reduce((total, group) => total + group.items.reduce((subtotal, [, href]) => subtotal + (badges[href] || 0), 0), 0);

  const renderItem = ([label, href, Icon]: NavItem, mobile = false) => {
    const active = activeFor(pathname, href);
    return <Link href={href} key={href} className={active ? "active" : undefined} aria-current={active ? "page" : undefined} onClick={mobile ? (event) => event.currentTarget.closest("details")?.removeAttribute("open") : undefined}><Icon size={mobile ? 18 : 17}/><span>{label}</span><Badge count={badges[href] || 0}/></Link>;
  };

  return <>
    <nav className="app-nav app-nav-desktop" aria-label="Workspace navigation">
      {groups.map((group) => <div className="app-nav-group" key={group.label}><div className="sidebar-label">{group.label}</div>{group.items.map((item) => renderItem(item))}</div>)}
    </nav>
    <nav className="app-nav-mobile" aria-label="Mobile workspace navigation">
      {primaryItems.map((item) => renderItem(item))}
      {secondaryGroups.length ? <details className={`mobile-more ${moreActive ? "active" : ""}`}><summary aria-current={moreActive ? "page" : undefined}><CircleEllipsis size={19}/><span>More</span><Badge count={moreUnread}/></summary><div className="mobile-more-panel">{secondaryGroups.map((group) => <div className="mobile-more-group" key={group.label}><strong>{group.label}</strong>{group.items.map((item) => renderItem(item, true))}</div>)}</div></details> : null}
    </nav>
  </>;
}
