import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { canonicalPath } from "@/lib/seo-url";

export const metadata: Metadata = { title: "VirtualAssistant.com.ph FAQ", description: "Answers about hiring, vetting, pricing, client accounts, Virtual Assistant applications, privacy, and managed placements.", keywords: ["virtual assistant faq", "hiring a virtual assistant questions", "virtualassistant.com.ph faq"], alternates:{canonical:canonicalPath("/faq")} };

const groups = [
  ["For clients", [
    ["Do I need an account to start?", "No. You can browse approved talent and send a private role brief without creating an account. A client account becomes useful when you want to manage jobs, candidates, messages, and hires."],
    ["Can I request a specific Virtual Assistant?", "Yes. Use Request an introduction on a public profile. We keep that profile attached to your hiring request so our team has the right context when following up."],
    ["What is the minimum Virtual Assistant rate?", "Ongoing hourly roles cannot be set below USD 5/hour through our service. That is a minimum, not a recommendation for every specialty or experience level."],
    ["When do I see the service fee?", "The exact placement fee or managed-service margin is shown privately during role review before you make a hiring commitment."],
    ["What happens when I hire someone?", "You confirm the final rate, start date, and schedule before the hire is finalized. Managed placements then move into structured onboarding and ongoing placement support."]
  ]],
  ["Vetting and privacy", [
    ["What does vetted mean?", "A public Virtual Assistant must complete the required structured profile, category skills test, video introduction, recruiter scorecard, and final approval workflow."],
    ["Can clients see test answers or recruiter notes?", "No. Those screening artifacts stay private. Public profiles expose only safe verification milestones and work-relevant profile information."],
    ["Are resumes public?", "No. Uploaded resumes stay private and are only made available through controlled authenticated workflows where access is permitted."]
  ]],
  ["For virtual assistants", [
    ["Can I apply to client jobs immediately?", "Client applications unlock after the required vetting stages are complete and the profile is approved."],
    ["What if I do not pass the category test?", "The vetting screen shows the passing threshold and a retake path when a retake is allowed. The UI distinguishes a failed/retake-needed state from a recruiter review state."],
    ["Is my contact information public?", "No. Public profiles do not expose private contact details, test answers, recruiter notes, or resume files."]
  ]]
] as const;

export default function FaqPage(){return <><SiteHeader/><main id="main-content" className="section"><div className="container" style={{maxWidth:920}}><div className="section-head"><h1 className="public-page-title">Questions before you hire or apply.</h1><p>These answers cover our current hiring, vetting, privacy, pricing, and application process.</p></div>{groups.map(([title,items])=><section className="faq-group" key={title}><h2>{title}</h2><div className="faq-list">{items.map(([q,a])=><details className="faq-item" key={q}><summary>{q}</summary><p>{a}</p></details>)}</div></section>)}</div></main><SiteFooter/></>}
