import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, ClipboardList, Clock3, KeyRound, MessageSquareText, Search, Split, TriangleAlert, Wrench } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HiringBriefForm } from "@/components/hiring-brief-form";
import { HiringHero } from "@/components/hiring-hero";
import { Band, CheckList, CtaBand, FaqBlock, LinkTiles, SectionHead, Steps } from "@/components/hiring-page-sections";
import { INDUSTRIES, industryBySlug } from "@/lib/industries";
import { servicePageBySlug } from "@/lib/service-pages";
import "../../homepage-sections.css";
import "../../hiring-pages.css";

export function generateStaticParams() { return INDUSTRIES.map((industry) => ({ slug: industry.slug })); }

export async function generateMetadata({ params }: { params: Promise<{slug:string}> }): Promise<Metadata> {
  const { slug } = await params;
  const industry = industryBySlug(slug);
  if (!industry) return {};
  const canonical = `/industries/${industry.slug}`;
  return {
    title: { absolute: industry.metaTitle },
    description: industry.metaDescription,
    keywords: [industry.primaryKeyword, `philippines ${industry.primaryKeyword}`, `filipino virtual assistant ${industry.label.toLowerCase()}`],
    alternates: { canonical },
    openGraph: { type: "website", url: canonical, title: industry.metaTitle, description: industry.metaDescription }
  };
}

function safeJson(value: unknown) { return JSON.stringify(value).replace(/</g, "\\u003c"); }
function titleCase(value: string) { return value.replace(/\b\w/g, (m) => m.toUpperCase()); }

export default async function IndustryPage({ params }: { params: Promise<{slug:string}> }) {
  const { slug } = await params;
  const industry = industryBySlug(slug);
  if (!industry) notFound();
  const page = industry!;
  const services = page.serviceSlugs.map(servicePageBySlug).filter(Boolean);
  const hub = page.clusterSlug ? industryBySlug(page.clusterSlug) : undefined;
  const spokes = INDUSTRIES.filter((i) => i.clusterSlug === page.slug);
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph";
  const pageUrl = `${base}/industries/${page.slug}`;
  const category = services[0]?.directoryCategory || "Administrative Support";
  const hireHref = `/hire?category=${encodeURIComponent(category)}`;
  const talentHref = `/find-talent?category=${encodeURIComponent(category)}`;
  const titleAt = page.h1.indexOf(page.label);
  const titleParts = titleAt >= 0 ? [page.h1.slice(0, titleAt).trim(), page.label, page.h1.slice(titleAt + page.label.length).trim()] : [page.h1, "", ""];
  const matchExample = `We need help with ${page.workflows.slice(0, 3).join(", ")} for about 20 hours per week. Our team uses ${page.tools.slice(0, 2).join(" and ")}.`;
  const interviewScenarios = [
    `Walk me through how you would handle ${page.workflows[0]} from intake to completion. What would you document and when would you escalate?`,
    `If ${page.workflows[1] || page.workflows[0]} and ${page.workflows[2] || page.workflows[0]} both became urgent, how would you prioritize the work and communicate the tradeoff?`,
    `Show how you would use ${page.tools[0]} for a typical ${page.workflows[3] || page.workflows[0]} task. What checks would you complete before marking it done?`
  ];

  const faqs = [
    { q: `What can a virtual assistant do for ${page.audience}?`, a: `Common support includes ${page.workflows.slice(0, 6).join(", ")}. The final scope should match your systems, customer or client expectations, risk level, and the candidate's actual experience.` },
    { q: `Can I hire a Philippines-based virtual assistant for ${page.label.toLowerCase()} work?`, a: `Yes. Define the workflow first, then compare Philippines-based candidates on relevant experience, tools, communication, availability, schedule overlap, and the evidence required for the role.` },
    { q: `Which virtual assistant roles fit ${page.audience}?`, a: `Relevant roles often include ${services.map((service) => service?.name).filter(Boolean).slice(0, 4).join(", ")}. One person may cover several workflows, but avoid combining unrelated responsibilities into an unmanageable role.` },
    { q: `What tools should the Virtual Assistant know?`, a: `Your actual stack matters more than a generic software list. Common tools in this workflow include ${page.tools.slice(0, 6).join(", ")}. Ask candidates to explain how they used the tools and how they checked their work.` },
    { q: `How should I write the job description?`, a: `List the recurring responsibilities, weekly hours, timezone overlap, tools, quality standards, reporting cadence, and which decisions the Virtual Assistant can make independently. Add compliance or access boundaries when the workflow handles sensitive information.` },
    { q: `How much does an industry-specific virtual assistant cost?`, a: `Rates vary with experience, specialization, live coverage, technical depth, and decision ownership. Compare candidates against the responsibility level you need rather than choosing only by the lowest hourly rate.` }
  ];

  const schema = [
    { "@context": "https://schema.org", "@type": "Service", "@id": `${pageUrl}#service`, name: page.h1, url: pageUrl, description: page.metaDescription, provider: { "@type": "Organization", name: "VirtualAssistant.com.ph", url: base }, areaServed: "Worldwide" },
    { "@context": "https://schema.org", "@type": "FAQPage", "@id": `${pageUrl}#faq`, mainEntity: faqs.map((faq) => ({ "@type": "Question", name: faq.q, acceptedAnswer: { "@type": "Answer", text: faq.a } })) },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", "@id": `${pageUrl}#breadcrumb`, itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: base },
      { "@type": "ListItem", position: 2, name: "Industries", item: `${base}/industries` },
      ...(hub ? [{ "@type": "ListItem", position: 3, name: hub.label, item: `${base}/industries/${hub.slug}` }] : []),
      { "@type": "ListItem", position: hub ? 4 : 3, name: page.label, item: pageUrl }
    ] }
  ];

  return <><SiteHeader/><main id="main-content">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(schema) }} />

    <HiringHero
      crumbs={[{ href: "/", label: "Home" }, { href: "/industries", label: "Industries" }, ...(hub ? [{ href: `/industries/${hub.slug}`, label: hub.label }] : []), { label: page.label }]}
      eyebrow={hub ? `Part of ${hub.label}` : `Filipino VAs for ${page.label}`}
      titleLead={titleParts[0]}
      titleAccent={titleParts[1]}
      titleTail={titleParts[2]}
      lede={page.intro}
      tasks={page.workflows.slice(0, 6).map(titleCase)}
      tools={page.tools}
      primary={{ href: talentHref, label: "Browse Virtual Assistants" }}
      secondary={{ href: "#industry-workflows", label: "See common workflows" }}
      form={<HiringBriefForm variant="industry" slug={page.slug} industryLabel={page.label} example={matchExample} talentHref={talentHref} sourcePath={`/industries/${page.slug}`} />}
    />

    <div className="hs-root sp-root">
      <Band id="industry-workflows">
        <SectionHead kicker="Common workflows" title="Delegate repeatable execution without blurring decision ownership." lede="Industry knowledge matters most when it helps the Virtual Assistant understand terminology, systems, customer expectations, handoffs, and what should be escalated."/>
        <div className="sp-cards-4">
          {page.workflows.map((item, index) => <article className="sp-card" key={`${String(item)}-${index}`}>
            <span className="sp-card-icon" aria-hidden="true"><CheckCircle2 size={18}/></span>
            <h3>{titleCase(item)}</h3>
            <p>Document the inputs, expected output, turnaround, and escalation rule for this workflow before handing it over.</p>
          </article>)}
        </div>
      </Band>

      {spokes.length ? <Band tone="soft">
        <SectionHead kicker="Specializations" title={`More specialized roles within ${page.label.toLowerCase()}`} lede={`If your need is narrower than general ${page.label.toLowerCase()} support, one of these dedicated guides is likely a closer fit.`}/>
        <LinkTiles items={spokes.map((spoke) => ({ href: `/industries/${spoke.slug}`, label: spoke.label, sub: spoke.metaDescription }))}/>
      </Band> : null}

      <Band tone={spokes.length ? "white" : "soft"}>
        <SectionHead kicker="Roles that fit" title={`Roles that commonly support ${page.audience}`} lede="Choose the service page closest to the work you need, or combine compatible responsibilities into one clearly scoped role."/>
        <LinkTiles items={services.filter(Boolean).map((service) => ({ href: `/service/${service!.slug}`, label: service!.name, sub: service!.focus, icon: <Search size={16}/> }))}/>
      </Band>

      <Band tone={spokes.length ? "soft" : "white"}>
        <div className="sp-split">
          <div>
            <SectionHead kicker="Tools" title="Match the hire to the systems your team already uses." lede="A candidate does not need every tool on this list. Prioritize the software that is central to the first 30 days, then test practical familiarity rather than relying on profile keywords."/>
            <div className="sp-pills">{page.tools.map((tool, index) => <span key={`${String(tool)}-${index}`}><Wrench size={13} aria-hidden="true"/>{tool}</span>)}</div>
          </div>
          <aside className="sp-panel">
            <span className="sp-panel-label">Operating rules</span>
            <h3>Define the operating rules.</h3>
            <CheckList items={[...page.hiringNotes, "Access, compliance, licensing, and supervision remain the client organization's responsibility."]}/>
          </aside>
        </div>
      </Band>

      <Band tone={spokes.length ? "white" : "soft"}>
        <SectionHead kicker="Structure the role" title={`How to structure a Virtual Assistant role for ${page.audience}`} lede="Start narrow enough that success can be measured. Expand the role only after the initial workflows are stable."/>
        <div className="sp-cards-4">
          <article className="sp-card"><span className="sp-card-icon" aria-hidden="true"><ClipboardList size={18}/></span><h3>Pick recurring workflows</h3><p>Choose the tasks that happen every day or week and currently consume owner, manager, or specialist time.</p></article>
          <article className="sp-card"><span className="sp-card-icon" aria-hidden="true"><KeyRound size={18}/></span><h3>Define access</h3><p>List the systems, records, permissions, customer data, and approval boundaries the role needs.</p></article>
          <article className="sp-card"><span className="sp-card-icon" aria-hidden="true"><Clock3 size={18}/></span><h3>Define coverage</h3><p>Set weekly hours, timezone overlap, response expectations, and whether live phone or customer coverage is required.</p></article>
          <article className="sp-card"><span className="sp-card-icon" aria-hidden="true"><Split size={18}/></span><h3>Define escalation</h3><p>Write down which exceptions, decisions, regulated actions, or high-risk situations must move to an internal owner.</p></article>
        </div>
      </Band>

      <Band tone={spokes.length ? "soft" : "white"}>
        <div className="sp-split">
          <div>
            <SectionHead kicker="Interview scenarios" title="Use real workflow scenarios in the interview." lede="Generic interview questions are easy to rehearse. Ask candidates to explain how they would handle the same work, systems, and exceptions they will face after hiring."/>
            <div className="sp-qa">
              {interviewScenarios.map((scenario) => <article className="sp-qa-item" key={scenario}>
                <span className="sp-qa-icon" aria-hidden="true"><MessageSquareText size={17}/></span>
                <div><p className="sp-qa-text">{scenario}</p></div>
              </article>)}
            </div>
          </div>
          <aside className="sp-panel sp-panel-dark">
            <span className="sp-panel-label">Common hiring mistakes to avoid</span>
            <h3>Keep the first version of the role narrow.</h3>
            <ul className="sp-warn-list">
              <li><TriangleAlert size={16} aria-hidden="true"/>Combining every workflow into one vague role before the first responsibilities are stable.</li>
              <li><TriangleAlert size={16} aria-hidden="true"/>Granting broad system access before permissions, review rules, and escalation paths are documented.</li>
              <li><TriangleAlert size={16} aria-hidden="true"/>Hiring for general availability without confirming the live coverage your team or customers actually need.</li>
            </ul>
          </aside>
        </div>
      </Band>

      <Band tone={spokes.length ? "white" : "soft"}>
        <SectionHead center kicker="Hiring process" title={`How to hire a virtual assistant for ${page.label.toLowerCase()}`} lede="Use the workflow to drive the interview and candidate comparison."/>
        <Steps items={[
          { title: "Document the role", copy: "Tasks, tools, hours, budget, coverage, quality standards, and decision boundaries." },
          { title: "Review relevant talent", copy: "Compare industry familiarity, role skills, communication, tools, and schedule." },
          { title: "Use real scenarios", copy: "Ask how the candidate would handle the same exceptions and handoffs they will face after hiring." },
          { title: "Confirm onboarding", copy: "Agree on rate, start date, responsibilities, access, reporting, and escalation before work starts." }
        ]}/>
        <div className="sp-center"><a className="hs-btn hs-btn-primary" href="#hiring-brief">Start with a quick brief <ArrowRight size={16}/></a></div>
      </Band>

      <Band tone={spokes.length ? "soft" : "white"}>
        <FaqBlock kicker="Frequently asked questions" title={`Virtual assistants for ${page.label.toLowerCase()}`} lede="Questions to resolve before you shortlist and interview." faqs={faqs}/>
      </Band>

      <CtaBand
        title={`Build your ${page.label.toLowerCase()} support role.`}
        body="Tell us the workflows, tools, hours, and access rules. Our recruiters use the brief to find approved Filipino Virtual Assistants who fit how your team already works."
        primary={{ href: "#hiring-brief", label: "Send a quick brief", track: `industry_${page.slug.replaceAll("-", "_")}_final_cta` }}
        secondary={{ href: hireHref, label: "Get a managed Virtual Assistant" }}
      />
    </div>
  </main><SiteFooter/></>;
}
