import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, LockKeyhole, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MarketingHero } from "@/components/marketing-hero";
import { DiscoveryCallCard } from "@/components/hiring-brief-form";
import { Band, CheckList, CtaBand, SectionHead, Steps } from "@/components/hiring-page-sections";
import { canonicalPath } from "@/lib/seo-url";
import "../homepage-sections.css";
import "../hiring-pages.css";
import "../info-pages.css";

export const metadata: Metadata = { title: "How Virtual Assistant Vetting Works", description: "See the screening steps required before a virtual assistant can appear in the VirtualAssistant.com.ph public talent directory.", keywords: ["virtual assistant vetting process", "how are virtual assistants screened", "vetted filipino virtual assistants"] , alternates: { canonical: canonicalPath("/how-vetting-works") }};

const STEPS = [
  { label: "Stage 1", title: "Structured profile", copy: "Experience, specialty, skills, tools, industries, languages, availability, and resume completeness." },
  { label: "Stage 2", title: "Category skills test", copy: "A practical screening tied to the Virtual Assistant’s primary specialty, with a defined passing threshold." },
  { label: "Stage 3", title: "Video introduction", copy: "A short private introduction used to assess communication and client-facing readiness." },
  { label: "Stage 4", title: "Recruiter review", copy: "A five-part scorecard covering role skills, communication, judgment, reliability, and client readiness." },
  { label: "Stage 5", title: "Final approval", copy: "An admin reviews the recruiter evidence before the Virtual Assistant is approved for public discovery." },
  { label: "Stage 6", title: "Availability gate", copy: "Only approved Virtual Assistants marked available and opted into the directory can appear publicly." },
];

const PRIVATE_ITEMS = ["Raw test answers", "Recruiter notes", "Video URLs", "Uploaded resumes", "Contact information", "Internal review comments"];
const VERIFIABLE_ITEMS = ["Approved status and category", "Experience, skills, and tools", "Industries and languages", "Availability and schedule preferences", "Screening milestones completed"];

export default function VettingPage() {
  return <><SiteHeader/><main id="main-content">
    <MarketingHero
      className="mh-tight"
      eyebrow="Evidence before introduction"
      title={<h1 className="public-page-title">“Vetted” should mean more than a profile badge.</h1>}
      intro={<p className="public-lede">VirtualAssistant.com.ph uses a staged screening workflow before a Virtual Assistant can appear in the public directory. The goal is to reduce weak-fit filtering for clients while keeping private candidate evidence protected.</p>}
      actions={<><Link className="btn btn-primary" href="/find-talent">Browse Virtual Assistants</Link><Link className="btn" href="/hire">Start a Hiring Request</Link></>}
      trust={<><span><ShieldCheck size={15}/>Structured screening</span><span><CheckCircle2 size={15}/>Human recruiter review</span><span><LockKeyhole size={15}/>Private evidence stays private</span></>}
      form={<DiscoveryCallCard />}
    />

    <div className="hs-root sp-root">
      <Band>
        <SectionHead center kicker="The screening workflow" title="Six stages before anyone reaches a client." lede="Each stage is completed in order. A Virtual Assistant who has not cleared every stage stays out of the public directory."/>
        <Steps columns={3} items={STEPS}/>
      </Band>

      <Band tone="soft">
        <SectionHead center kicker="Privacy" title="What stays private, and what you can verify." lede="Clients see enough to compare candidates. The evidence recruiters use to screen them stays inside recruiting operations."/>
        <div className="ip-pair">
          <aside className="sp-panel sp-panel-dark">
            <span className="sp-panel-label"><LockKeyhole size={14} aria-hidden="true"/> What stays private</span>
            <h3>Never published in the talent directory.</h3>
            <ul className="sp-warn-list ip-lock-list">{PRIVATE_ITEMS.map((item) => <li key={item}><LockKeyhole size={15} aria-hidden="true"/>{item}</li>)}</ul>
          </aside>
          <aside className="sp-panel">
            <span className="sp-panel-label"><CheckCircle2 size={14} aria-hidden="true"/> What clients can verify</span>
            <h3>Shown on approved public profiles.</h3>
            <CheckList tone="green" items={VERIFIABLE_ITEMS}/>
          </aside>
        </div>
      </Band>

      <CtaBand
        title="Get a shortlist that has already been screened."
        body="Tell us the role, hours, and tools. Recruiters bring you Virtual Assistants who have cleared every stage above."
        primary={{ href: "/hire", label: "Start a hiring brief", track: "vetting_final_cta" }}
        secondary={{ href: "/find-talent", label: "Browse Virtual Assistants" }}
      />
    </div>
  </main><SiteFooter/></>;
}
