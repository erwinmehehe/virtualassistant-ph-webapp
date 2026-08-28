import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BriefcaseBusiness, UserRoundCheck } from "lucide-react";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "Join VirtualAssistant.com.ph", robots: { index: false, follow: false } };

function queryString(params: Record<string,string|undefined>, allowed: string[]) {
  const query = new URLSearchParams();
  for (const key of allowed) if (params[key]) query.set(key, params[key]!);
  const value = query.toString();
  return value ? `?${value}` : "";
}

export default async function JoinPage({ searchParams }: { searchParams: Promise<Record<string,string|undefined>> }) {
  const params = await searchParams;
  if (params.talent || params.role === "client") redirect(`/auth/join/client${queryString(params, ["talent", "lead", "next", "error"])}`);
  if (params.role === "va") redirect(`/auth/join/va${queryString(params, ["next", "error"])}`);

  return <><SiteHeader/><main id="main-content" className="auth-page auth-choice-page"><section className="join-choice-shell">
    <div className="join-choice-head"><div className="kicker">Choose your account</div><h1>How are you joining?</h1><p>Client and VA accounts have separate workspaces, onboarding, and permissions.</p></div>
    <div className="join-choice-grid">
      <Link className="join-choice-card join-choice-client" href={`/auth/join/client${queryString(params, ["lead", "next"])}`}>
        <span className="join-choice-icon"><BriefcaseBusiness size={26}/></span><div><span className="small muted">For businesses</span><h2>Join as a client</h2><p>Request matches, create roles, shortlist VAs, interview, and hire.</p></div><span className="join-choice-link">Create client account <ArrowRight size={16}/></span>
      </Link>
      <Link className="join-choice-card" href={`/auth/join/va${queryString(params, ["next"])}`}>
        <span className="join-choice-icon"><UserRoundCheck size={26}/></span><div><span className="small muted">For virtual assistants</span><h2>Join as a VA</h2><p>Complete vetting, build your public profile, and apply for roles.</p></div><span className="join-choice-link">Create VA account <ArrowRight size={16}/></span>
      </Link>
    </div>
    <p className="small muted join-choice-login">Already registered? <Link href="/auth/login" className="text-link">Log in</Link>.</p>
  </section></main></>;
}
