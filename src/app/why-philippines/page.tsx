import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Why Hire a Virtual Assistant from the Philippines?",
  description: "A practical guide to evaluating Filipino virtual assistants by role fit, communication, tools, schedule overlap, and vetted evidence, not stereotypes.",
  keywords: ["why hire virtual assistant philippines", "benefits of hiring filipino virtual assistant", "philippines outsourcing"]
};

const factors = [
  ["Role skills", "Start with the work the person must own: tasks, judgment calls, tools, and expected outcomes."],
  ["Communication", "Evaluate written and spoken communication directly instead of assuming it from a candidate's location."],
  ["Schedule fit", "Specify the live overlap the role genuinely needs. Async work and phone coverage require different schedules."],
  ["Client readiness", "Look for reliability, context handling, escalation judgment, and the ability to work inside documented processes."],
];

export default function WhyPhilippinesPage() {
  return <><SiteHeader/><main id="main-content"><section className="section public-hero-small"><div className="container"><div className="public-page-head"><h1 className="public-page-title">Why consider a virtual assistant from the Philippines?</h1><p className="public-lede">The useful answer is not “because of nationality.” Businesses hire remotely to add capable execution capacity, and the person still needs to match the role. Our Philippines-focused talent pool makes the search narrower; vetting is what makes a candidate decision-ready.</p><div className="hero-actions" style={{marginTop:24}}><Link className="btn btn-primary btn-lg" href="/find-talent">Browse VAs <ArrowRight size={16}/></Link><Link className="btn btn-lg" href="/how-vetting-works">See the vetting process</Link></div></div></div></section><section className="section"><div className="container public-content-grid"><div><h2>Location narrows the search. Evidence decides the hire.</h2><p className="muted">A good remote hire depends on the same fundamentals as any other hire: relevant capability, communication, reliability, tools, schedule, and clear expectations.</p><div className="stack" style={{marginTop:20}}>{factors.map(([title,body])=><div className="card" key={title}><div className="row"><CheckCircle2 size={19}/><strong>{title}</strong></div><p className="muted" style={{marginBottom:0}}>{body}</p></div>)}</div></div><aside className="card stack"><div><h3>Do not hire on hourly rate alone.</h3></div><p className="muted">The cheapest profile is not automatically the lowest-cost hire. Rework, missed follow-up, weak communication, and poor role fit create costs that do not appear in an hourly number.</p><p className="muted">Compare candidate compensation separately from the platform's service fee, and confirm the exact commercial terms before a role is published.</p><Link className="btn" href="/pricing">How pricing works</Link></aside></div></section><section className="section section-soft"><div className="container"><div className="section-head"><h2>A narrower talent market, then role-specific screening.</h2><p>We screen for structured profile completeness, a category-appropriate skills test, a private video introduction, recruiter review, and final approval before a VA is eligible for public discovery. Clients still interview and make the final hiring decision.</p></div></div></section></main><SiteFooter/></>;
}
