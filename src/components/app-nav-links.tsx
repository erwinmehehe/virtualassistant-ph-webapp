"use client";

import Link from "next/link";
import { BarChart3, Bell, BriefcaseBusiness, Building2, CircleDollarSign, CircleEllipsis, CircleUserRound, FileText, Flag, Heart, LayoutDashboard, MessageSquare, Search, Settings, ShieldCheck, Sparkles, Tags, TrendingUp, UsersRound, Wrench, History } from "lucide-react";
import { usePathname } from "next/navigation";
import type { Role } from "@/lib/types";

const nav = {
  client: [
    ["Overview", "/workspace/client", LayoutDashboard],
    ["Roles", "/workspace/client/jobs", BriefcaseBusiness],
    ["Candidates", "/workspace/client/candidates", UsersRound],
    ["Saved VAs", "/workspace/client/saved", Heart],
    ["Messages", "/workspace/client/messages", MessageSquare],
    ["Notifications", "/workspace/client/notifications", Bell],
    ["Workroom", "/workspace/client/workroom", Wrench],
    ["Payments", "/workspace/client/payments", CircleDollarSign],
    ["Company", "/workspace/client/company", Building2]
  ],
  va: [
    ["Overview", "/workspace/va", LayoutDashboard],
    ["Quick setup", "/workspace/va/onboarding", Sparkles],
    ["My profile", "/workspace/va/profile", CircleUserRound],
    ["Vetting", "/workspace/va/vetting", ShieldCheck],
    ["Find jobs", "/workspace/va/jobs", Search],
    ["Applications", "/workspace/va/applications", FileText],
    ["Saved jobs", "/workspace/va/saved", Heart],
    ["Messages", "/workspace/va/messages", MessageSquare],
    ["Notifications", "/workspace/va/notifications", Bell],
    ["Workroom", "/workspace/va/workroom", Wrench],
    ["Payouts", "/workspace/va/payments", CircleDollarSign]
  ],
  recruiter: [
    ["Overview", "/workspace/recruiter", LayoutDashboard],
    ["Client leads", "/workspace/recruiter/leads", BriefcaseBusiness],
    ["Roles", "/workspace/recruiter/matching", Sparkles],
    ["Talent", "/workspace/recruiter/talent", Search],
    ["VA categories", "/workspace/recruiter/categories", Tags],
    ["Vetting", "/workspace/recruiter/queue", FileText],
    ["Stalled", "/workspace/recruiter/stalled", Flag],
    ["Bench", "/workspace/recruiter/bench", UsersRound],
    ["Activity", "/workspace/recruiter/activity", History],
    ["Analytics", "/workspace/recruiter/analytics", BarChart3]
  ],
  admin: [
    ["Overview", "/workspace/admin", ShieldCheck],
    ["Lead inbox", "/workspace/admin/leads", MessageSquare],
    ["Job review", "/workspace/admin/jobs", BriefcaseBusiness],
    ["Payments", "/workspace/admin/payments", CircleDollarSign],
    ["Moderation", "/workspace/admin/moderation", Flag],
    ["Analytics", "/workspace/admin/analytics", BarChart3],
    ["Sales analytics", "/workspace/admin/sales", TrendingUp],
    ["Vetting finalists", "/workspace/admin/vetting", FileText],
    ["Users", "/workspace/admin/users", UsersRound],
    ["Audit log", "/workspace/admin/audit", History],
    ["Agency settings", "/workspace/admin/settings", Settings],
    ["System setup", "/workspace/admin/system", Wrench],
    ["Release health", "/workspace/admin/health", ShieldCheck]
  ]
} as const;

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
  const items = nav[role];
  const secondaryItems = items.filter(([, href]) => !mobilePrimary[role].includes(href));
  const moreActive = secondaryItems.some(([, href]) => activeFor(pathname, href));
  const moreUnread = secondaryItems.reduce((total, [, href]) => total + (badges[href] || 0), 0);
  return <>
    <nav className="app-nav app-nav-desktop" aria-label="Workspace navigation">
      {items.map(([label, href, Icon]) => {
        const active = activeFor(pathname, href);
        return <Link href={href} key={href} className={active ? "active" : undefined} aria-current={active ? "page" : undefined}><Icon size={17}/><span>{label}</span><Badge count={badges[href] || 0}/></Link>;
      })}
    </nav>
    <nav className="app-nav-mobile" aria-label="Mobile workspace navigation">
      {items.filter(([,href]) => mobilePrimary[role].includes(href)).map(([label, href, Icon]) => {
        const active = activeFor(pathname, href);
        return <Link href={href} key={href} className={active ? "active" : undefined} aria-current={active ? "page" : undefined}><Icon size={19}/><span>{label}</span><Badge count={badges[href] || 0}/></Link>;
      })}
      {secondaryItems.length ? <details className={`mobile-more ${moreActive ? "active" : ""}`}><summary aria-current={moreActive ? "page" : undefined}><CircleEllipsis size={19}/><span>More</span><Badge count={moreUnread}/></summary><div className="mobile-more-panel">{secondaryItems.map(([label,href,Icon]) => {const active=activeFor(pathname,href);return <Link href={href} key={href} className={active?"active":undefined} aria-current={active?"page":undefined}><Icon size={18}/><span>{label}</span><Badge count={badges[href]||0}/></Link>;})}</div></details> : null}
    </nav>
  </>;
}
