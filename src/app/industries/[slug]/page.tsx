import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, Search, ShieldCheck, Wrench } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { IndustryMatchForm } from "@/components/industry-match-form";
import { INDUSTRIES, industryBySlug } from "@/lib/industries";
import { servicePageBySlug } from "@/lib/service-pages";
import { canonicalPath } from "@/lib/seo-url";

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
    { q: `What tools should the VA know?`, a: `Your actual stack matters more than a generic software list. Common tools in this workflow include ${page.tools.slice(0, 6).join(", ")}. Ask candidates to explain how they used the tools and how they checked their work.` },
    { q: `How should I write the job description?`, a: `List the recurring responsibilities, weekly hours, timezone overlap, tools, quality standards, reporting cadence, and which decisions the VA can make independently. Add compliance or access boundaries when the workflow handles sensitive information.` },
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

    <section className="section public-hero-small specialty-seo-hero"><div className="container">
      <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><Link href="/industries">Industries</Link>{hub ? <><span aria-hidden="true">/</span><Link href={`/industries/${hub.slug}`}>{hub.label}</Link></> : null}<span aria-hidden="true">/</span><span aria-current="page">{page.label}</span></nav>
      <div className="specialty-hero-grid industry-conversion-hero-grid"><div className="public-page-head industry-hero-copy">{hub ? <p className="small muted industry-hero-note" style={{marginBottom:6}}>A specialization within <Link href={`/industries/${hub.slug}`}>{hub.label}</Link></p> : null}<h1 className="public-page-title">{page.h1}</h1><p className="public-lede">{page.intro}</p><div className="industry-hero-actions"><Link className="btn btn-lg" href={talentHref}>Browse VAs <ArrowRight size={16}/></Link><a className="text-link" href="#industry-workflows">See common workflows</a></div><p className="small muted industry-hero-note">Private match request · No account required to start · Define access and supervision before onboarding</p></div>
      <IndustryMatchForm slug={page.slug} industryLabel={page.label} example={matchExample} talentHref={talentHref} workflows={page.workflows} sourcePath={`/industries/${page.slug}`} /></div>
    </div></section>

    <section className="section section-white" id="industry-workflows"><div className="container"><div className="section-head specialty-section-head"><h2>Delegate repeatable execution without blurring decision ownership.</h2><p>Industry knowledge matters most when it helps the VA understand terminology, systems, customer expectations, handoffs, and what should be escalated.</p></div><div className="grid-4">{page.workflows.map((item,index)=><article className="card" key={`${String(item)}-${index}`}><CheckCircle2 size={19}/><h3>{titleCase(item)}</h3><p className="muted">Document the inputs, expected output, turnaround, and escalation rule for this workflow before handing it over.</p></article>)}</div></div></section>

    {spokes.length ? <section className="section"><div className="container"><div className="section-head specialty-section-head"><h2>More specialized roles within {page.label.toLowerCase()}</h2><p>If your need is narrower than general {page.label.toLowerCase()} support, one of these dedicated guides is likely a closer fit.</p></div><div className="grid-3">{spokes.map((spoke)=><Link className="card card-hover" href={`/industries/${spoke.slug}`} key={spoke.slug}><h3>{spoke.label}</h3><p className="muted small">{spoke.metaDescription}</p><span className="text-link">View guide <ArrowRight size={13}/></span></Link>)}</div></div></section> : null}

    <section className="section"><div className="container"><div className="section-head specialty-section-head"><h2>Roles that commonly support {page.audience}</h2><p>Choose the service page closest to the work you need, or combine compatible responsibilities into one clearly scoped role.</p></div><div className="grid-4">{services.map((service)=>service?<Link className="card card-hover related-service-card" href={`/service/${service.slug}`} key={service.slug}><Search size={18}/><h3>{service.name}</h3><p className="muted small">{service.focus}</p><span className="text-link">View service guide <ArrowRight size={13}/></span></Link>:null)}</div></div></section>

    <section className="section section-white"><div className="container public-content-grid"><div><div className="section-head"><h2>Match the hire to the systems your team already uses.</h2><p>A candidate does not need every tool on this list. Prioritize the software that is central to the first 30 days, then test practical familiarity rather than relying on profile keywords.</p></div><div className="tool-cloud">{page.tools.map((tool,index)=><span className="tool-chip" key={`${String(tool)}-${index}`}><Wrench size={14}/>{tool}</span>)}</div></div><aside className="card stack"><div><h3>Define the operating rules.</h3></div>{page.hiringNotes.map((item,index)=><div className="review-answer" key={`${String(item)}-${index}`}>{item}</div>)}<div className="review-answer"><ShieldCheck size={16}/> Access, compliance, licensing, and supervision remain the client organization's responsibility.</div></aside></div></section>

    <section className="section"><div className="container"><div className="section-head specialty-section-head"><h2>How to structure a VA role for {page.audience}</h2><p>Start narrow enough that success can be measured. Expand the role only after the initial workflows are stable.</p></div><div className="grid-4"><article className="card"><h3>1. Pick recurring workflows</h3><p className="muted">Choose the tasks that happen every day or week and currently consume owner, manager, or specialist time.</p></article><article className="card"><h3>2. Define access</h3><p className="muted">List the systems, records, permissions, customer data, and approval boundaries the role needs.</p></article><article className="card"><h3>3. Define coverage</h3><p className="muted">Set weekly hours, timezone overlap, response expectations, and whether live phone or customer coverage is required.</p></article><article className="card"><h3>4. Define escalation</h3><p className="muted">Write down which exceptions, decisions, regulated actions, or high-risk situations must move to an internal owner.</p></article></div></div></section>

    <section className="section section-white"><div className="container public-content-grid"><div><div className="section-head"><h2>Use real workflow scenarios in the interview.</h2><p>Generic interview questions are easy to rehearse. Ask candidates to explain how they would handle the same work, systems, and exceptions they will face after hiring.</p></div><div className="stack">{interviewScenarios.map((scenario, index)=><article className="card interview-scenario" key={scenario}><span className="process-number">0{index + 1}</span><p>{scenario}</p></article>)}</div></div><aside className="card stack"><h3>Common hiring mistakes to avoid</h3><div className="review-answer">Combining every workflow into one vague role before the first responsibilities are stable.</div><div className="review-answer">Granting broad system access before permissions, review rules, and escalation paths are documented.</div><div className="review-answer">Hiring for general availability without confirming the live coverage your team or customers actually need.</div></aside></div></section>

    <section className="section"><div className="container"><div className="section-head specialty-section-head"><h2>How to hire a virtual assistant for {page.label.toLowerCase()}</h2><p>Use the workflow to drive the interview and candidate comparison.</p></div><div className="process-grid four-step-process"><div className="process-step"><div className="process-number">01</div><h3>Document the role</h3><p className="muted">Tasks, tools, hours, budget, coverage, quality standards, and decision boundaries.</p></div><div className="process-step"><div className="process-number">02</div><h3>Review relevant talent</h3><p className="muted">Compare industry familiarity, role skills, communication, tools, and schedule.</p></div><div className="process-step"><div className="process-number">03</div><h3>Use real scenarios</h3><p className="muted">Ask how the candidate would handle the same exceptions and handoffs they will face after hiring.</p></div><div className="process-step"><div className="process-number">04</div><h3>Confirm onboarding</h3><p className="muted">Agree on rate, start date, responsibilities, access, reporting, and escalation before work starts.</p></div></div><div className="centered-actions"><Link className="btn btn-primary btn-lg" href={hireHref}>Get a managed VA <ArrowRight size={16}/></Link></div></div></section>

    <section className="section"><div className="container faq-narrow"><div className="section-head specialty-section-head"><h2>Virtual assistants for {page.label.toLowerCase()}</h2><p>Questions to resolve before you shortlist and interview.</p></div><div className="faq-list">{faqs.map((faq)=><details className="faq-item" key={faq.q}><summary>{faq.q}</summary><p>{faq.a}</p></details>)}</div></div></section>

  </main><SiteFooter/></>;
}
