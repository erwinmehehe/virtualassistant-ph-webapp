import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = { title: "VirtualAssistant.com.ph FAQ", description: "Answers about hiring, vetting, pricing, client accounts, VA applications, privacy, and managed placements.", keywords: ["virtual assistant faq", "hiring a virtual assistant questions", "virtualassistant.com.ph faq"] };

const groups = [
  ["For clients", [
    ["Do I need an account to start?", "No. You can browse approved talent and send a private role brief without creating an account. A client account becomes useful when you want to manage jobs, candidates, messages, and hires."],
    ["Can I request a specific VA?", "Yes. Use Request an introduction on a public profile. The profile slug is preserved through the client signup path so the request does not lose context."],
    ["What is the minimum VA rate?", "Ongoing hourly roles cannot be posted below USD 5/hour. That is a platform floor, not a recommendation for every specialty or experience level."],
    ["When do I see the service fee?", "The exact placement fee or managed-service margin is shown privately in your client workspace during job review, before you accept the terms and publish the role."],
    ["What happens when I hire someone?", "Hiring is a separate confirmation step. You confirm the final rate, start date, and schedule before the application is marked hired and a workroom is created."]
  ]],
  ["Vetting and privacy", [
    ["What does vetted mean?", "A public VA must complete the required structured profile, category skills test, video introduction, recruiter scorecard, and final approval workflow."],
    ["Can clients see test answers or recruiter notes?", "No. Those screening artifacts stay private. Public profiles expose only safe verification milestones and work-relevant profile information."],
    ["Are resumes public?", "No. Uploaded resumes stay private and are only made available through controlled authenticated workflows where access is permitted."]
  ]],
  ["For virtual assistants", [
    ["Can I apply to client jobs immediately?", "Client applications unlock after the required vetting stages are complete and the profile is approved."],
    ["What if I do not pass the category test?", "The vetting screen shows the passing threshold and a retake path when a retake is allowed. The UI distinguishes a failed/retake-needed state from a recruiter review state."],
    ["Is my contact information public?", "No. Public profiles do not expose private contact details, test answers, recruiter notes, or resume files."]
  ]]
] as const;

export default function FaqPage(){return <><SiteHeader/><main id="main-content" className="section"><div className="container" style={{maxWidth:920}}><div className="section-head"><h1 className="public-page-title">Questions before you hire or apply.</h1><p>These answers reflect the workflow in the current product build. Commercial values that require real operating data are intentionally not invented.</p></div>{groups.map(([title,items])=><section className="faq-group" key={title}><h2>{title}</h2><div className="faq-list">{items.map(([q,a])=><details className="faq-item" key={q}><summary>{q}</summary><p>{a}</p></details>)}</div></section>)}</div></main><SiteFooter/></>}
