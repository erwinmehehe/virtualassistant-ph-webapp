import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, ClipboardList, Clock3, KeyRound, MessageSquareText, Search, Split, TriangleAlert, Wrench } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HiringBriefForm } from "@/components/hiring-brief-form";
import { HiringHero } from "@/components/hiring-hero";
import { Band, CheckList, CtaBand, FaqBlock, LinkTiles, SectionHead, Steps } from "@/components/hiring-page-sections";
import { INDUSTRIES, industryBySlug } from "@/lib/industries";
import {
  industryFirst30Days,
  industryHeroIntro,
  industryMetaDescription,
  industryMetrics,
  industrySeoTitle,
  industryToolDescription,
  industryWorkflowDescription
} from "@/lib/industry-seo-content";
import { servicePageBySlug } from "@/lib/service-pages";
import { blogHref, serviceBlogPosts } from "@/lib/blog";
import "../../homepage-sections.css";
import "../../hiring-pages.css";
import { organizationRef } from "@/lib/organization";
import { localizeContent, localizeEnglish, titleCaseWithAcronyms } from "@/lib/content-language";
import { industryTalentFilters } from "@/lib/industry-talent-mappings";

export function generateStaticParams() { return INDUSTRIES.map((industry) => ({ slug: industry.slug })); }

export async function generateMetadata({ params }: { params: Promise<{slug:string}> }): Promise<Metadata> {
  const { slug } = await params;
  const industry = industryBySlug(slug);
  if (!industry) return {};
  const canonical = `/industries/${industry.slug}`;
  const title = localizeEnglish(industrySeoTitle(industry), industry.locale);
  const description = localizeEnglish(industryMetaDescription(industry), industry.locale);
  return {
    title: { absolute: title },
    description,
    keywords: [industry.primaryKeyword, title.toLowerCase(), `virtual assistant services for ${industry.label.toLowerCase()}`],
    alternates: { canonical },
    openGraph: { type: "website", url: canonical, title, description, locale: industry.locale === "en-AU" ? "en_AU" : undefined },
    twitter: { card: "summary_large_image", title, description }
  };
}

function safeJson(value: unknown) { return JSON.stringify(value).replace(/</g, "\\u003c"); }
function titleCase(value: string) { return titleCaseWithAcronyms(value); }

export default async function IndustryPage({ params }: { params: Promise<{slug:string}> }) {
  const { slug } = await params;
  const industry = industryBySlug(slug);
  if (!industry) notFound();
  const page = industry!;
  const isAu = page.locale === "en-AU";
  const loc = (value: string) => localizeEnglish(value, page.locale);
  const services = page.serviceSlugs.map(servicePageBySlug).filter(Boolean);
  const guides = Array.from(
    new Map(
      page.serviceSlugs
        .flatMap((serviceSlug) => serviceBlogPosts(serviceSlug, 2))
        .map((post) => [post.slug, post] as const)
    ).values()
  ).slice(0, 6);
  const hub = page.clusterSlug ? industryBySlug(page.clusterSlug) : undefined;
  const spokes = INDUSTRIES.filter((i) => i.clusterSlug === page.slug);
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph";
  const pageUrl = `${base}/industries/${page.slug}`;
  const talentFilters = industryTalentFilters(page.slug);
  const talentParams = new URLSearchParams();
  talentParams.set("category", talentFilters.category);
  talentParams.set("q", talentFilters.query);
  const hireHref = `/hire?category=${encodeURIComponent(talentFilters.category)}`;
  const talentHref = `/find-talent?${talentParams.toString()}`;
  const seoTitle = loc(industrySeoTitle(page));
  const seoDescription = loc(industryMetaDescription(page));
  // SEO title and visible H1 have different jobs. Keep the SERP title concise,
  // while the H1 uses the reviewed, natural-language industry heading.
  const titleParts = [page.h1, "", ""];
  const first30Days = localizeContent(industryFirst30Days(page), page.locale);
  const metrics = localizeContent(industryMetrics(page), page.locale);
  const matchExample = loc(`We need help with ${page.workflows.slice(0, 3).join(", ")} for about 20 hours per week. Our team uses ${page.tools.slice(0, 2).join(" and ")}.`);
  const interviewScenarios = localizeContent([
    `Walk me through how you would handle ${page.workflows[0]} from intake to completion. What would you document and when would you escalate?`,
    `If ${page.workflows[1] || page.workflows[0]} and ${page.workflows[2] || page.workflows[0]} both became urgent, how would you prioritize the work and communicate the tradeoff?`,
    `Show how you would use ${page.tools[0]} for a typical ${page.workflows[3] || page.workflows[0]} task. What checks would you complete before marking it done?`
  ], page.locale);

  const faqs = localizeContent([
    { q: `What can a Virtual Assistant do for ${page.audience}?`, a: `Common support includes ${page.workflows.slice(0, 6).join(", ")}. The final scope should match your systems, customer or client expectations, risk level, and the candidate's actual experience.` },
    { q: `Can I hire a Virtual Assistant for ${page.audience}?`, a: `Yes. Define the workflow first, then compare candidates on relevant experience, tools, communication, availability, schedule overlap, and the evidence required for the role.` },
    { q: `Which Virtual Assistant roles fit ${page.audience}?`, a: `Relevant roles often include ${services.map((service) => service?.name).filter(Boolean).slice(0, 4).join(", ")}. One person may cover several compatible workflows, but avoid combining unrelated responsibilities into an unmanageable role.` },
    { q: `What tools should the Virtual Assistant know?`, a: `Your actual stack matters more than a generic software list. Common tools in this workflow include ${page.tools.slice(0, 6).join(", ")}. Ask candidates to explain how they used the tools, what they owned, and how they checked their work.` },
    { q: `How should I write the job description?`, a: `List the recurring responsibilities, weekly hours, timezone overlap, tools, quality standards, reporting cadence, and which decisions the Virtual Assistant can make independently. Add compliance or access boundaries when the workflow handles sensitive information.` },
    { q: `How much does an industry-specific Virtual Assistant cost?`, a: `Rates vary with experience, specialization, live coverage, technical depth, and decision ownership. Compare candidates against the responsibility level you need rather than choosing only by the lowest hourly rate.` }
  ], page.locale);

  const schema = [
    { "@context": "https://schema.org", "@type": "Service", "@id": `${pageUrl}#service`, name: seoTitle, url: pageUrl, description: seoDescription, provider: organizationRef(base), areaServed: isAu ? "Australia" : "Worldwide" },
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
      eyebrow={hub ? `Part of ${hub.label}` : "Industry-specific Virtual Assistant services"}
      titleLead={titleParts[0]}
      titleAccent={titleParts[1]}
      titleTail={titleParts[2]}
      lede={loc(industryHeroIntro(page))}
      tasks={page.workflows.slice(0, 6).map(titleCase)}
      tools={page.tools}
      primary={{ href: talentHref, label: "Browse Virtual Assistants" }}
      secondary={{ href: "#industry-workflows", label: "See common workflows" }}
      form={<HiringBriefForm variant="industry" slug={page.slug} industryLabel={page.label} example={matchExample} talentHref={talentHref} sourcePath={`/industries/${page.slug}`} />}
    />

    <div className="hs-root sp-root">
      <Band id="industry-workflows">
        <SectionHead kicker="Common workflows" title={`What a Virtual Assistant can handle for ${page.audience}`} lede={`For ${page.audience}, start with recurring work that is easy to document and review. Give each workflow a clear source of truth, expected output, review rule, and escalation path.`}/>
        <div className="sp-cards-4">
          {page.workflows.map((item, index) => <article className="sp-card" key={`${String(item)}-${index}`}>
            <span className="sp-card-icon" aria-hidden="true"><CheckCircle2 size={18}/></span>
            <h3>{titleCase(item)}</h3>
            <p>{loc(industryWorkflowDescription(page, item))}</p>
          </article>)}
        </div>
      </Band>

      {spokes.length ? <Band tone="soft">
        <SectionHead kicker={loc("Specializations")} title={loc(`More specialized support for ${page.audience}`)} lede={loc(`If your need is narrower than general support for ${page.audience}, one of these dedicated industry guides is likely a closer fit.`)}/>
        <LinkTiles items={spokes.map((spoke) => ({ href: `/industries/${spoke.slug}`, label: spoke.h1, sub: localizeEnglish(industryMetaDescription(spoke), spoke.locale) }))}/>
      </Band> : null}

      <Band tone={spokes.length ? "white" : "soft"}>
        <div className="sp-related">
          <div>
            <SectionHead kicker="Roles that fit" title={`Which Virtual Assistant roles fit ${page.audience}?`} lede={`Use the role pages below when ${page.audience} need a specific specialist. Stay with this industry guide when the problem starts with the workflow rather than a job title.`}/>
            <LinkTiles items={services.filter(Boolean).map((service) => ({ href: `/service/${service!.slug}`, label: `Hire ${service!.name}`, sub: `Role focus: ${service!.focus}. See responsibilities, tools, interview guidance and approved talent.`, icon: <Search size={16}/> }))}/>
          </div>
          {guides.length ? <div>
            <SectionHead kicker="Hiring guides" title="Go deeper on the roles behind this workflow." lede={`These guides go deeper on screening, cost, responsibilities, tools, and hiring decisions for roles commonly used by ${page.audience}.`}/>
            <LinkTiles items={guides.map((post) => ({ href: blogHref(post), label: post.title, sub: post.excerpt }))}/>
          </div> : null}
        </div>
      </Band>

      <Band tone={spokes.length ? "soft" : "white"}>
        <SectionHead kicker="Tools" title="Hire for workflow fluency, not a software checklist." lede={loc(`A candidate does not need every tool used by ${page.audience}. Prioritize the systems that matter in the first 30 days and ask what the candidate actually changed, checked, or owned inside them.`)}/>
        <div className="sp-cards-4">
          {page.tools.map((tool, index) => <article className="sp-card" key={`${String(tool)}-${index}`}>
            <span className="sp-card-icon" aria-hidden="true"><Wrench size={18}/></span>
            <h3>{tool}</h3>
            <p>{loc(industryToolDescription(page, tool))}</p>
          </article>)}
        </div>
      </Band>

      <Band tone={spokes.length ? "white" : "soft"}>
        <div className="sp-split">
          <div>
            <SectionHead kicker="Operating boundaries" title="Decide what the Virtual Assistant owns and what stays internal." lede={`Give ${page.workflows[0]} and ${page.workflows[1]} a clear owner, then document what the Virtual Assistant may finish independently and what must be reviewed or escalated.`}/>
            <CheckList items={page.hiringNotes}/>
          </div>
          <aside className="sp-panel">
            <span className="sp-panel-label">Access and supervision</span>
            <h3>Give the minimum access needed for the workflow.</h3>
            <p>{loc("Use role-based access where possible. Compliance, licensing, sensitive approvals and professional judgment remain the client organization’s responsibility.")}</p>
          </aside>
        </div>
      </Band>

      <Band tone={spokes.length ? "soft" : "white"}>
        <SectionHead kicker="Structure the role" title={`How to structure Virtual Assistant services for ${page.audience}`} lede={`Start with ${page.workflows[0]} and ${page.workflows[1]} so success is easy to measure. Add more scope only after those workflows are stable and the handoffs are working.`}/>
        <div className="sp-cards-4">
          <article className="sp-card"><span className="sp-card-icon" aria-hidden="true"><ClipboardList size={18}/></span><h3>Pick recurring workflows</h3><p>Choose the tasks that happen every day or week and currently consume owner, manager, or specialist time.</p></article>
          <article className="sp-card"><span className="sp-card-icon" aria-hidden="true"><KeyRound size={18}/></span><h3>Define access</h3><p>List the systems, records, permissions, customer data, and approval boundaries the role needs.</p></article>
          <article className="sp-card"><span className="sp-card-icon" aria-hidden="true"><Clock3 size={18}/></span><h3>Define coverage</h3><p>Set weekly hours, timezone overlap, response expectations, and whether live phone or customer coverage is required.</p></article>
          <article className="sp-card"><span className="sp-card-icon" aria-hidden="true"><Split size={18}/></span><h3>Define escalation</h3><p>Write down which exceptions, decisions, regulated actions, or high-risk situations must move to an internal owner.</p></article>
        </div>
      </Band>

      <Band tone={spokes.length ? "white" : "soft"}>
        <div className="sp-split">
          <div>
            <SectionHead kicker="First 30 days" title="Start with supervised ownership, then expand." lede={`Use the first month to prove that ${page.workflows[0]} can be completed accurately, documented clearly, and escalated at the right time before the role gets broader.`}/>
            <div className="sp-qa">
              {first30Days.map((step) => <article className="sp-qa-item" key={step}>
                <span className="sp-qa-icon" aria-hidden="true"><CheckCircle2 size={17}/></span>
                <div><p className="sp-qa-text">{step}</p></div>
              </article>)}
            </div>
          </div>
          <aside className="sp-panel sp-panel-dark">
            <span className="sp-panel-label">Metrics worth tracking</span>
            <h3>Measure whether the workflow is actually getting better.</h3>
            <ul className="sp-warn-list">
              {metrics.map((metric) => <li key={metric}><CheckCircle2 size={16} aria-hidden="true"/>{metric}</li>)}
            </ul>
          </aside>
        </div>
      </Band>

      <Band tone={spokes.length ? "soft" : "white"}>
        <div className="sp-split">
          <div>
            <SectionHead kicker="Interview scenarios" title="Use real workflow scenarios in the interview." lede={`Generic questions are easy to rehearse. Ask candidates to work through ${page.workflows[0]}, ${page.workflows[1]}, and the exceptions they are likely to face after hiring.`}/>
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
        <SectionHead center kicker="Hiring process" title={`How to hire a Virtual Assistant for ${page.audience}`} lede={`Build the interview around the workflows, tools, and escalation rules ${page.audience} actually use.`}/>
        <Steps items={[
          { title: "Document the role", copy: "Tasks, tools, hours, budget, coverage, quality standards, and decision boundaries." },
          { title: "Review relevant talent", copy: "Compare industry familiarity, role skills, communication, tools, and schedule." },
          { title: "Use real scenarios", copy: "Ask how the candidate would handle the same exceptions and handoffs they will face after hiring." },
          { title: "Confirm onboarding", copy: "Agree on rate, start date, responsibilities, access, reporting, and escalation before work starts." }
        ]}/>
        <div className="sp-center"><a className="hs-btn hs-btn-primary" href="#hiring-brief">Start with a quick brief <ArrowRight size={16}/></a></div>
      </Band>

      <Band tone={spokes.length ? "soft" : "white"}>
        <FaqBlock kicker="Frequently asked questions" title={`Virtual Assistant services for ${page.audience}`} lede={`Use these questions to clarify scope, systems, coverage, and decision boundaries before you shortlist candidates for ${page.audience}.`} faqs={faqs}/>
      </Band>

      <CtaBand
        title={`Build Virtual Assistant support around the workflows that matter to ${page.audience}.`}
        body={`Tell us how your team handles ${page.workflows.slice(0, 3).join(", ")}, which tools matter, the hours you need covered, and what must stay internal. Our recruiters use that brief to find approved Virtual Assistants whose experience fits the workflow.`}
        primary={{ href: "#hiring-brief", label: "Send a quick brief", track: `industry_${page.slug.replaceAll("-", "_")}_final_cta` }}
        secondary={{ href: hireHref, label: "Get a managed Virtual Assistant" }}
      />
    </div>
  </main><SiteFooter/></>;
}
