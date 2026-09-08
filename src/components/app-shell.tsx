import Link from "next/link";
import { CircleUserRound, ExternalLink, LogOut } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { AppNavLinks } from "@/components/app-nav-links";
import type { Role } from "@/lib/types";

export function AppShell({ role, name, title, children, badges }: { role: Role; name?: string | null; title: string; children: React.ReactNode; badges?: Record<string, number> }) {
  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <Link className="brand" href="/">VirtualAssistant<span className="ph">.com.ph</span></Link>
        <div className="sidebar-label">Workspace</div>
        <AppNavLinks role={role} badges={badges}/>
        <div className="sidebar-footer">
          <div className="row" style={{padding: "8px 10px 12px"}}>
            <CircleUserRound size={18}/><div className="user-copy"><strong style={{display:"block",fontSize:13}}>{name || "Account"}</strong><span style={{color:"#98a2b3",fontSize:11,textTransform:"capitalize"}}>{role}</span></div>
          </div>
          <form action={logoutAction}><button className="btn btn-ghost" style={{color:"#cbd5e1",width:"100%",justifyContent:"flex-start"}} type="submit"><LogOut size={16}/><span className="user-copy">Log out</span></button></form>
        </div>
      </aside>
      <main className="app-main" id="main-content">
        <div className="app-topbar"><div className="app-topbar-inner"><span className="workspace-title">{title}</span><Link className="btn btn-sm" href="/" target="_blank"><ExternalLink size={15}/>Public site</Link></div></div>
        <div className="app-content">{children}</div>
      </main>
    </div>
  );
}
