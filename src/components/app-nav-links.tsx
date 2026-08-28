"use client";

import Link from "next/link";
import { BarChart3, Bell, BriefcaseBusiness, Building2, CircleDollarSign, CircleEllipsis, CircleUserRound, FileText, Flag, Heart, LayoutDashboard, MessageSquare, Search, Settings, ShieldCheck, Sparkles, UsersRound, Wrench, History } from "lucide-react";
import { usePathname } from "next/navigation";
import type { Role } from "@/lib/types";

const nav = {
  client: [
    ["Overview", "/workspace/client", LayoutDashboard],
    ["Jobs", "/workspace/client/jobs", BriefcaseBusiness],
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
    ["Vetting queue", "/workspace/recruiter/queue", FileText],
    ["VA directory", "/workspace/recruiter/talent", Search],
    ["Role matching", "/workspace/recruiter/matching", Sparkles],
    ["Talent pool", "/workspace/recruiter/bench", UsersRound],
    ["Client leads", "/workspace/recruiter/leads", BriefcaseBusiness],
    ["Activity", "/workspace/recruiter/activity", History]
  ],
  admin: [
    ["Overview", "/workspace/admin", ShieldCheck],
    ["Lead inbox", "/workspace/admin/leads", MessageSquare],
    ["Job review", "/workspace/admin/jobs", BriefcaseBusiness],
    ["Payments", "/workspace/admin/payments", CircleDollarSign],
    ["Moderation", "/workspace/admin/moderation", Flag],
    ["Analytics", "/workspace/admin/analytics", BarChart3],
    ["Vetting finalists", "/workspace/admin/vetting", FileText],
    ["Users", "/workspace/admin/users", UsersRound],
    ["Audit log", "/workspace/admin/audit", History],
    ["Marketplace settings", "/workspace/admin/settings", Settings],
    ["System setup", "/workspace/admin/system", Wrench],
    ["Health & repair", "/workspace/admin/health", ShieldCheck]
  ]
} as const;

const mobilePrimary: Record<Role, string[]> = {
  client: ["/workspace/client", "/workspace/client/jobs", "/workspace/client/candidates", "/workspace/client/messages"],
  va: ["/workspace/va", "/workspace/va/jobs", "/workspace/va/applications", "/workspace/va/messages"],
  recruiter: ["/workspace/recruiter", "/workspace/recruiter/talent", "/workspace/recruiter/queue", "/workspace/recruiter/matching"],
  admin: ["/workspace/admin", "/workspace/admin/jobs", "/workspace/admin/vetting", "/workspace/admin/leads"]
};

function activeFor(pathname: string, href: string) {
  if (pathname === href) return true;
  if (["/workspace/client", "/workspace/va", "/workspace/admin", "/workspace/recruiter"].includes(href)) return false;
  return pathname.startsWith(`${href}/`);
}

export function AppNavLinks({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = nav[role];
  return <>
    <nav className="app-nav app-nav-desktop" aria-label="Workspace navigation">
      {items.map(([label, href, Icon]) => {
        const active = activeFor(pathname, href);
        return <Link href={href} key={href} className={active ? "active" : undefined} aria-current={active ? "page" : undefined}><Icon size={17}/><span>{label}</span></Link>;
      })}
    </nav>
    <nav className="app-nav-mobile" aria-label="Mobile workspace navigation">
      {items.filter(([,href]) => mobilePrimary[role].includes(href)).map(([label, href, Icon]) => {
        const active = activeFor(pathname, href);
        return <Link href={href} key={href} className={active ? "active" : undefined} aria-current={active ? "page" : undefined}><Icon size={19}/><span>{label}</span></Link>;
      })}
      {items.some(([,href]) => !mobilePrimary[role].includes(href)) ? <details className="mobile-more"><summary><CircleEllipsis size={19}/><span>More</span></summary><div className="mobile-more-panel">{items.filter(([,href]) => !mobilePrimary[role].includes(href)).map(([label,href,Icon]) => {const active=activeFor(pathname,href);return <Link href={href} key={href} className={active?"active":undefined} aria-current={active?"page":undefined}><Icon size={18}/><span>{label}</span></Link>;})}</div></details> : null}
    </nav>
  </>;
}
