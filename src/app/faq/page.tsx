import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MarketingHero } from "@/components/marketing-hero";
import { DiscoveryCallCard } from "@/components/hiring-brief-form";
import { canonicalPath } from "@/lib/seo-url";

export const metadata: Metadata = { title: "VirtualAssistant.com.ph FAQ", description: "Answers about hiring, vetting, pricing, client accounts, Virtual Assistant applications, privacy, and managed placements.", keywords: ["virtual assistant faq", "hiring a virtual assistant questions", "virtualassistant.com.ph faq"], alternates:{canonical:canonicalPath("/faq")} };

const groups = [
  ["For clients", [
    ["Do I need an account to start?", "No. You can browse approved talent and send a private role brief without creating an account. A client account becomes useful when you want to manage jobs, candidates, messages, and hires."],
    ["Can I request a specific Virtual Assistant?", "Yes. Use Request an introduction on a public profile. We keep that profile attached to your hiring request so our team has the right context when following up."],
    ["What is the minimum Virtual Assistant rate?", "Ongoing hourly roles cannot be set below USD 5/hour through our service. That is a minimum, not a recommendation for every specialty or experience level."],
    ["When do I see the service fee?", "The exact placement fee or managed-service margin is shown privately during role review before you make a hiring commitment."],
    ["What happens when I hire someone?", "You confirm the final rate, start date, and schedule before the hire is finalized. Managed placements then move into structured onboarding and ongoing placement support."],
    ["Who provides the computer and internet?", "Confirm this in the final engagement terms. Many remote professionals use their own equipment, but specialized security, calling, monitoring, backup power, or software requirements may need client-provided tools or an agreed allowance."],
    ["How are Philippine holidays and time off handled?", "Agree on the working calendar, paid time off, sick leave, holiday coverage, and any alternate days before the Virtual Assistant starts. Requirements vary by hiring model and should be written into the final terms."],
    ["How do replacements work?", "Managed placements include 30-day replacement support under the agreed service terms. Direct-hire replacement terms are separate and are confirmed before commitment."],
    ["Can I monitor a Virtual Assistant?", "Use proportionate, lawful tools that are disclosed in advance. We recommend measuring agreed outputs, response standards, and completed work rather than relying only on intrusive activity monitoring."]
  ]],
  ["Vetting and privacy", [
    ["What does vetted mean?", "A public Virtual Assistant must complete the required structured profile, category skills test, video introduction, recruiter scorecard, and final approval workflow."],
    ["Can clients see test answers or recruiter notes?", "No. Those screening artifacts stay private. Public profiles expose only safe verification milestones and work-relevant profile information."],
    ["Are resumes public?", "No. Uploaded resumes stay private and are only made available through controlled authenticated workflows where access is permitted."],
    ["How should system access be handled?", "Start with the minimum access required, use individual accounts where possible, enable multi-factor authentication, document approval boundaries, and remove access promptly when the engagement ends."],
    ["Are client job descriptions and SOPs public?", "No. Documents attached to a hiring request are stored privately and opened through short-lived links available only to authorized recruiting staff."]
  ]],
  ["For virtual assistants", [
    ["Can I apply to client jobs immediately?", "Client applications unlock after the required vetting stages are complete and the profile is approved."],
    ["What if I do not pass the category test?", "The vetting screen shows the passing threshold and a retake path when a retake is allowed. The UI distinguishes a failed/retake-needed state from a recruiter review state."],
    ["Is my contact information public?", "No. Public profiles do not expose private contact details, test answers, recruiter notes, or resume files."]
  ]]
] as const;

export default function FaqPage(){return <><SiteHeader/><main id="main-content">
  <MarketingHero
    eyebrow="Hiring questions, answered"
    title={<h1 className="public-page-title">Questions before you hire or apply.</h1>}
    intro={<p className="public-lede">These answers cover our current hiring, vetting, privacy, pricing, and application process.</p>}
    trust={<><span><CheckCircle2 size={15}/>Private role brief</span><span><CheckCircle2 size={15}/>No account required</span><span><CheckCircle2 size={15}/>Recruiter follow-up</span></>}
    form={<DiscoveryCallCard />}
  />
  <section className="section"><div className="container" style={{maxWidth:920}}>{groups.map(([title,items])=><section className="faq-group" key={title}><h2>{title}</h2><div className="faq-list">{items.map(([q,a])=><details className="faq-item" key={q}><summary>{q}</summary><p>{a}</p></details>)}</div></section>)}</div></section>
</main><SiteFooter/></>}
