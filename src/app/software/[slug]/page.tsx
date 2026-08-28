import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { softwarePages, getSoftwarePage } from "@/lib/software-pages";
import { servicePageBySlug } from "@/lib/service-pages";
import { industryBySlug } from "@/lib/industries";
import { canonicalPath } from "@/lib/seo-url";

export function generateStaticParams() { return softwarePages.map((page) => ({ slug: page.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = getSoftwarePage(slug);
  if (!page) return {};
  const canonical = canonicalPath(`/software/${page.slug}`);
  return {
    title: { absolute: page.metaTitle },
    description: page.metaDescription,
    keywords: [page.primaryKeyword, `hire ${page.software.toLowerCase()} virtual assistant`, `${page.software.toLowerCase()} outsourcing philippines`],
    alternates: { canonical },
    openGraph: { type: "website", url: canonical, title: page.metaTitle, description: page.metaDescription }
  };
}

function safeJson(value: unknown) { return JSON.stringify(value).replace(/</g, "\\u003c"); }
function titleCase(value: string) { return value.replace(/\b\w/g, (m) => m.toUpperCase()); }


function softwareLongFormCopy(page: (typeof softwarePages)[number]) {
  const taskA = page.tasks[0] || "recurring administration";
  const taskB = page.tasks[1] || "record updates";
  const taskC = page.tasks[2] || "workflow follow-up";
  const workflowA = page.workflows[0] || "receive the work";
  const workflowB = page.workflows[1] || "check the required inputs";
  const workflowC = page.workflows[2] || "update the system";
  const workflowD = page.workflows[page.workflows.length - 1] || "close the administration";

  return {
    overview: `A ${page.software} virtual assistant is most useful when the software is already central to the way your team works and the administrative load inside it keeps growing. The role is not simply “someone who knows ${page.software}.” The better brief is a defined operating responsibility: keep ${taskA}, ${taskB}, ${taskC}, and related records moving according to your process. That means the VA needs to understand where work enters the system, which fields or documents matter, what a complete record looks like, and which exceptions must be escalated instead of guessed.`,
    specialist: `Software familiarity can shorten onboarding, but process discipline is what makes the hire valuable. A strong ${page.software} VA should be able to explain the sequence behind the work, not just point to buttons or menus. Ask how they would move from “${workflowA}” to “${workflowB},” how they would check that “${workflowC}” is complete, and what they would do before “${workflowD}.” That conversation reveals whether the candidate can operate inside a repeatable workflow, maintain clean records, communicate blockers, and protect your team from silent administrative errors.`,
    delegation: `Before delegating live work, write down the source of truth for each task. Identify who can create or change records, which approvals are required, what naming conventions to use, where supporting documents belong, and how the VA should record a handoff. For ${page.software}, this is especially important because one incomplete update can affect scheduling, billing, reporting, customer communication, or another team member’s next action. A simple checklist is often enough: inputs received, required fields checked, supporting information attached, status updated, exception noted, and next owner identified.`,
    weekOne: `In the first week, keep the scope narrow. Give the VA a guided tour of your ${page.software} setup, your terminology, user permissions, and the handful of workflows that happen most often. Use redacted or low-risk examples where possible. Have the VA shadow several completed cases, then repeat the same process with supervision. The goal is not speed yet. It is consistency: the candidate should understand what “done” means in your business, where information comes from, and when they must stop and ask rather than making an assumption.`,
    weekTwo: `During the second week, move the VA onto a controlled production queue. Assign a predictable group of tasks such as ${page.tasks.slice(0, 4).join(", ")}. Review a sample of completed work daily and correct process gaps while they are still small. At this stage, managers should look for record accuracy, complete notes, timely follow-up, and whether the VA is using the agreed escalation rules. If the same mistake happens twice, improve the checklist or training material instead of relying on memory and verbal reminders.`,
    weekThree: `By the third week, the role should begin reducing manager follow-up rather than creating more of it. Expand ownership only after the VA has shown reliable execution on the first queue. Add adjacent work, allow more independent prioritization within defined limits, and introduce a simple daily or weekly summary. A useful summary does not need to be long: work completed, items waiting on someone else, exceptions that need a decision, and anything likely to affect a customer, technician, broker, property manager, finance team, or other downstream owner.`,
    weekFour: `At the end of the first month, review the role as an operating system rather than a list of tasks. Which ${page.software} activities are now consistently owned? Which still depend on a manager? Where are delays coming from? Are permissions appropriate? Are records easier to trust? This is the right time to adjust the job description, add or remove responsibilities, refine response-time expectations, and decide whether the role should remain part-time or expand. The best outcome is not “the VA is busy”; it is that the workflow is more visible, more current, and easier for the local team to manage.`,
    quality: `Measure quality with evidence that comes from the workflow itself. Useful indicators can include turnaround time, percentage of records completed without correction, number of overdue follow-ups, missing-document rate, reopened tasks, billing-ready jobs, unresolved exceptions, or the age of items sitting in a queue. Pick only a few measures that reflect the result you care about. Avoid measuring activity for its own sake. A VA who makes fewer updates but keeps the right records accurate and closes the right administrative loops can be more valuable than someone who simply generates a high volume of clicks.`,
    security: `Treat ${page.software} access the same way you would treat access for any remote team member. Create an individual account where the platform supports it, use the minimum permissions needed for the assigned work, enable multi-factor authentication, and avoid sharing owner or administrator credentials. Document which customer, financial, health, legal, employment, or technical information the VA may view or change. Review access when responsibilities change and remove it promptly when the engagement ends. Your organization remains responsible for its own privacy, security, licensing, and compliance obligations.`,
    communication: `Remote administration works better when communication rules are explicit. Define the channel for routine questions, the channel for urgent exceptions, the expected response window, and the information that must be included in an escalation. For example, instead of “this job has a problem,” require the VA to identify the record, current status, missing input, what has already been checked, and the decision needed from the manager. This makes ${page.software} support easier to supervise and reduces the back-and-forth that often makes outsourced administration feel slower than keeping the work in-house.`,
    capacity: `The right weekly hours depend on transaction volume, seasonality, live coverage requirements, and how many adjacent tasks sit around ${page.software}. A small team may start with a focused part-time queue, while a busier operation may need a full-time VA who also owns inbox follow-up, document preparation, CRM hygiene, scheduling, reporting, or customer updates. Estimate capacity from real work: count the number of recurring records or cases, sample the average handling time, add time for follow-up and exceptions, then leave room for training and quality checks.`,
    fit: `This role is a strong fit when your team already has a repeatable process but managers or specialists are still spending too much time maintaining the system. It is also useful when records fall behind during busy periods, follow-up depends on individual memory, or field and office teams do not have a consistent administrative handoff. The role is a weaker fit when the process itself is still undefined, when nearly every item requires senior judgment, or when the VA would be expected to make regulated, technical, financial, or commercial decisions that belong with an appropriately authorised person.`,
    interview: `During interviews, ask candidates to describe comparable work in detail. What information arrived first? What did they enter or update? How did they verify it? What happened when something was missing? Who approved exceptions? Which reports or queues did they monitor? A candidate who has genuinely supported a similar ${page.software} workflow can usually explain the sequence, quality checks, and boundaries without relying on vague claims. If exact ${page.software} experience is unavailable, look for strong evidence in a comparable platform and test how quickly the candidate can map an unfamiliar interface to a documented process.`
  };
}

export default async function SoftwarePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = getSoftwarePage(slug);
  if (!page) notFound();

  const relatedServices = page.relatedServiceSlugs.map(servicePageBySlug).filter(Boolean);
  const relatedIndustries = page.relatedIndustrySlugs.map(industryBySlug).filter(Boolean);
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph";
  const pageUrl = `${base}/software/${page.slug}`;
  const hireHref = `/hire?category=${encodeURIComponent(page.directoryCategory)}`;
  const talentHref = `/find-talent?category=${encodeURIComponent(page.directoryCategory)}`;
  const longForm = softwareLongFormCopy(page);

  const faqs = [
    { q: `Can a virtual assistant actually run ${page.software}?`, a: `Yes, once trained on your specific workflow. Common ${page.software} tasks include ${page.tasks.slice(0, 5).join(", ")}. Scope the role around what you actually need before hiring.` },
    { q: `What should stay with my local team instead of the VA?`, a: page.hiringNotes[page.hiringNotes.length - 1] || "Regulated advice, final approvals, and compliance decisions should stay with the appropriately licensed or authorised local professional." },
    { q: `Who is this best for?`, a: `${titleCase(page.bestFor.join(", "))} typically get the most value from a ${page.software} VA.` },
    { q: `How is this different from a generic virtual assistant?`, a: `A ${page.software} VA is trained on this specific platform from day one, so onboarding is faster and the role can start on real production work sooner instead of learning the system from scratch.` }
  ];

  const schema = [
    { "@context": "https://schema.org", "@type": "Service", "@id": `${pageUrl}#service`, name: page.h1, url: pageUrl, description: page.metaDescription, provider: { "@type": "Organization", name: "VirtualAssistant.com.ph", url: base }, areaServed: "Worldwide" },
    { "@context": "https://schema.org", "@type": "FAQPage", "@id": `${pageUrl}#faq`, mainEntity: faqs.map((faq) => ({ "@type": "Question", name: faq.q, acceptedAnswer: { "@type": "Answer", text: faq.a } })) },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", "@id": `${pageUrl}#breadcrumb`, itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: base },
      { "@type": "ListItem", position: 2, name: "Software", item: `${base}/software` },
      { "@type": "ListItem", position: 3, name: page.software, item: pageUrl }
    ] }
  ];

  return <><SiteHeader/><main id="main-content">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(schema) }} />

    <section className="section public-hero-small specialty-seo-hero"><div className="container">
      <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><Link href="/software">Software</Link><span aria-hidden="true">/</span><span aria-current="page">{page.software}</span></nav>
      <div className="public-page-head"><span className="badge">{page.category}</span><h1 className="public-page-title" style={{ marginTop: 12 }}>{page.h1}</h1><p className="public-lede">{page.intro}</p>
        <div className="hero-actions" style={{ marginTop: 20 }}><Link className="btn btn-primary btn-lg" href={hireHref}>Get a managed VA <ArrowRight size={16}/></Link><Link className="btn btn-lg" href={talentHref}>Browse VAs</Link></div>
      </div>
    </div></section>

    <section className="section section-white"><div className="container"><div className="section-head"><h2>How the workflow actually runs.</h2><p>Document the inputs, expected output, and escalation rule for each step before handing it over.</p></div>
      <div className="grid-4">{page.workflows.map((item, index) => <article className="card" key={`${item}-${index}`}><CheckCircle2 size={19}/><h3>{titleCase(item)}</h3></article>)}</div>
    </div></section>

    <section className="section"><div className="container public-content-grid">
      <div><div className="section-head"><h2>What the role covers.</h2><p>Typical {page.software} tasks handled once the role is trained on your setup.</p></div>
        <div className="pill-list">{page.tasks.map((task, index) => <span className="badge" key={`${task}-${index}`}>{task}</span>)}</div>
      </div>
      <aside className="card stack">
        <div><h3>Define the operating rules.</h3></div>
        {page.hiringNotes.map((item, index) => <div className="review-answer" key={`${item}-${index}`}>{item}</div>)}
        <div className="review-answer"><ShieldCheck size={16}/> Access, compliance, licensing, and supervision remain the client organization's responsibility.</div>
      </aside>
    </div></section>

    <section className="section section-white"><div className="container"><div className="section-head"><h2>Best for.</h2></div>
      <div className="pill-list">{page.bestFor.map((item, index) => <span className="badge" key={`${item}-${index}`}>{item}</span>)}</div>
      <div className="section-head" style={{ marginTop: 32 }}><h2>What changes once the role is running.</h2></div>
      <div className="grid-3">{page.outcomes.map((item, index) => <article className="card" key={index}><p className="muted">{item}</p></article>)}</div>
    </div></section>

    <section className="section software-depth-section"><div className="container software-reading-width">
      <div className="section-head"><div className="kicker">Role design</div><h2>What a {page.software} virtual assistant should actually own.</h2></div>
      <p>{longForm.overview}</p>
      <p>{longForm.specialist}</p>
      <div className="software-callout"><strong>Start with ownership, not a software keyword.</strong><p>{longForm.delegation}</p></div>
    </div></section>

    <section className="section section-white"><div className="container">
      <div className="section-head"><div className="kicker">First 30 days</div><h2>A practical onboarding plan for {page.software} support.</h2><p>Increase access and independence only after the VA demonstrates accuracy on the previous stage.</p></div>
      <div className="software-onboarding-grid">
        <article><span>Week 1</span><h3>Learn the process</h3><p>{longForm.weekOne}</p></article>
        <article><span>Week 2</span><h3>Run a controlled queue</h3><p>{longForm.weekTwo}</p></article>
        <article><span>Week 3</span><h3>Own recurring work</h3><p>{longForm.weekThree}</p></article>
        <article><span>Week 4</span><h3>Review and expand</h3><p>{longForm.weekFour}</p></article>
      </div>
    </div></section>

    <section className="section"><div className="container public-content-grid software-operating-grid">
      <div>
        <div className="section-head"><div className="kicker">Quality control</div><h2>How to know whether the role is working.</h2></div>
        <p>{longForm.quality}</p>
        <p>{longForm.communication}</p>
      </div>
      <aside className="card software-security-card"><ShieldCheck size={22}/><div className="kicker">Access and security</div><h3>Give the minimum access needed.</h3><p>{longForm.security}</p></aside>
    </div></section>

    <section className="section section-white"><div className="container software-reading-width">
      <div className="section-head"><div className="kicker">Staffing model</div><h2>Part-time or full-time {page.software} VA?</h2></div>
      <p>{longForm.capacity}</p>
      <div className="software-fit-grid">
        <article><h3>When this role is a good fit</h3><p>{longForm.fit}</p></article>
        <article><h3>What to test in the interview</h3><p>{longForm.interview}</p></article>
      </div>
      <div className="software-final-cta"><div><div className="kicker">Ready to hire?</div><h2>Build the {page.software} role around your real workflow.</h2><p>Share the tasks, weekly volume, hours, software access, and decisions that must stay with your team. We can use that scope to help you compare relevant Philippines-based virtual assistants.</p></div><div className="row wrap"><Link className="btn btn-primary btn-lg" href={hireHref}>Hire a {page.software} VA <ArrowRight size={16}/></Link><Link className="btn btn-lg" href={talentHref}>Browse approved VAs</Link></div></div>
    </div></section>

    {relatedServices.length ? <section className="section"><div className="container"><div className="section-head"><h2>Related roles.</h2></div>
      <div className="grid-4">{relatedServices.map((service) => service ? <Link className="card card-hover related-service-card" href={`/service/${service.slug}`} key={service.slug}><h3>{service.name}</h3><p className="muted small">{service.focus}</p><span className="text-link">View service guide <ArrowRight size={13}/></span></Link> : null)}</div>
    </div></section> : null}

    {relatedIndustries.length ? <section className="section section-white"><div className="container"><div className="section-head"><h2>Related industries.</h2></div>
      <div className="grid-3">{relatedIndustries.map((industry) => industry ? <Link className="card card-hover" href={`/industries/${industry.slug}`} key={industry.slug}><h3>{industry.label}</h3><p className="muted small">{industry.metaDescription}</p></Link> : null)}</div>
    </div></section> : null}

    <section className="section"><div className="container faq-narrow"><div className="section-head specialty-section-head"><h2>{page.software} virtual assistant questions.</h2></div>
      <div className="faq-list">{faqs.map((faq) => <details className="faq-item" key={faq.q}><summary>{faq.q}</summary><p>{faq.a}</p></details>)}</div>
    </div></section>
  </main><SiteFooter/></>;
}
