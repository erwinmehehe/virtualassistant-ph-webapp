import Link from "next/link";
import { ArrowRight, BadgeCheck, BookOpen, Calculator, CalendarDays, CheckCircle2, ClipboardList, ExternalLink, ListChecks, ShieldCheck, UserRound } from "lucide-react";
import { ServiceMatchForm } from "@/components/service-match-form";
import { type BlogPost, BLOG_TOPICS, blogHref, relatedBlogPosts } from "@/lib/blog";
import { servicePageBySlug } from "@/lib/service-pages";


function articleFor(value: string) {
  return /^[aeiou]/i.test(value) || /^(SEO|IT|HR|HVAC)\b/i.test(value) ? "an" : "a";
}

function idFor(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function readTime(post: BlogPost) {
  const words = [
    post.title,
    post.excerpt,
    ...post.keyTakeaways,
    ...post.sections.flatMap((section) => [
      section.heading,
      ...(section.paragraphs || []),
      ...(section.bullets || []),
      ...(section.numbered || []),
      ...(section.table?.rows.flat() || [])
    ]),
    ...post.faqs.flatMap((faq) => [faq.question, faq.answer])
  ].join(" ").split(/\s+/).filter(Boolean).length;
  return Math.max(4, Math.ceil(words / 210));
}

function ContextLinks({ post, start, count = 2 }: { post: BlogPost; start: number; count?: number }) {
  const links = post.internalLinks.slice(start, start + count);
  if (!links.length) return null;
  return <aside className="blog-context-links" aria-label="Related next steps">
    <div className="blog-context-label">Useful next steps</div>
    <div className="blog-context-grid">
      {links.map((link) => <Link href={link.href} key={link.href} data-track="blog_context_link">
        <strong>{link.label}</strong>
        <span>{link.description}</span>
        <em>Open <ArrowRight size={13}/></em>
      </Link>)}
    </div>
  </aside>;
}

export function BlogArticle({ post }: { post: BlogPost }) {
  const related = relatedBlogPosts(post, 4);
  const topic = BLOG_TOPICS[post.topic];
  const service = post.serviceSlug ? servicePageBySlug(post.serviceSlug) : undefined;
  const serviceHref = service ? `/service/${service.slug}/` : "/services";
  const sourceHireHref = `/hire?source=${encodeURIComponent(blogHref(post))}`;
  const matchHref = service ? `${serviceHref}#match-request` : sourceHireHref;
  const roleLabel = service?.name.replace(/ Virtual Assistant$/i, "") || "virtual assistant";
  const matchExample = service ? `Own ${service.tasks.slice(0, 3).join(", ")} and keep our team updated on progress, blockers, and next steps.` : "Tell us the recurring work you want to delegate, the hours you need, and what a good outcome looks like.";
  const headings = [
    ...post.sections.map((section) => ({ id: idFor(section.heading), label: section.heading })),
    { id: "frequently-asked-questions", label: "Frequently asked questions" }
  ];
  const updated = new Date(`${post.updatedAt}T00:00:00Z`);
  const showPlanningTools = ["hiring", "pricing", "managing"].includes(post.topic);

  return <>
    <section className="blog-hero">
      <div className="container blog-hero-grid">
        <div className="blog-hero-copy">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link><span aria-hidden="true">/</span><Link href="/blog">Blog</Link><span aria-hidden="true">/</span><Link href={`/blog/topic/${post.topic}`}>{topic.label}</Link>
          </nav>
          <div className="blog-topic-pill">{topic.label}</div>
          <h1>{post.title}</h1>
          <p className="blog-deck">{post.excerpt}</p>
          <div className="blog-byline" aria-label="Article details">
            <span><UserRound size={15}/><Link href={post.author === "Christ Hemsworthy" ? "/authors/christ-hemsworthy/" : "/authors/editorial-team/"}>{post.author}</Link></span>
            <span><CalendarDays size={15}/>Updated {updated.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })}</span>
            <span><BookOpen size={15}/>{readTime(post)} min read</span>
          </div>
          {post.reviewedBy ? <div className="blog-reviewed"><BadgeCheck size={17}/><span>Reviewed by <strong>{post.reviewedBy}</strong></span></div> : null}
        </div>
        <aside className="blog-hero-aside">
          <div className="blog-hero-card">
            <div className="kicker">Turn the research into a hire</div>
            <h2>{service ? `Need ${articleFor(roleLabel)} ${roleLabel} VA?` : "Ready to delegate the work?"}</h2>
            <p>{service ? `Compare approved ${roleLabel.toLowerCase()} talent or send a private match request. No account is required to start.` : "Tell us what is taking time every week and we will help you narrow the role."}</p>
            <div className="stack">
              <Link className="btn btn-primary btn-lg" href={matchHref} data-track="blog_cta_match">Get a managed VA <ArrowRight size={16}/></Link>
              <Link className="btn btn-lg" href={serviceHref} data-track="blog_service_click">{service ? `View ${roleLabel} service` : "Explore VA services"}</Link>
            </div>
            <div className="blog-card-trust"><ShieldCheck size={15}/>Private request. No obligation.</div>
          </div>
        </aside>
      </div>
    </section>

    <section className="blog-body-section">
      <div className="container blog-layout">
        <aside className="blog-toc" aria-label="On this page">
          <strong>On this page</strong>
          <nav>{headings.map((item) => <a href={`#${item.id}`} key={item.id}>{item.label}</a>)}</nav>
          {service ? <Link href={serviceHref} className="blog-toc-service" data-track="blog_service_click">Hire a {roleLabel} VA <ArrowRight size={14}/></Link> : null}
        </aside>

        <article className="blog-article">
          {post.reviewNote ? <div className="blog-review-note" role="note"><ShieldCheck size={20}/><div><strong>Editorial note</strong><p>{post.reviewNote}</p></div></div> : null}

          <p className="blog-lead">{post.description}</p>

          <section className="blog-takeaways" aria-labelledby="key-takeaways-heading">
            <div className="kicker">Key takeaways</div>
            <h2 id="key-takeaways-heading">What matters most</h2>
            <ul>{post.keyTakeaways.map((item, index) => <li key={`${String(item)}-${index}`}><CheckCircle2 size={18}/><span>{item}</span></li>)}</ul>
          </section>

          {post.sections.map((section, index) => <div className="blog-section" id={idFor(section.heading)} key={`${section.heading}-${index}`}>
            <h2>{section.heading}</h2>
            {(section.paragraphs || []).map((paragraph, paragraphIndex) => <p key={`${section.heading}-p-${paragraphIndex}`}>{paragraph}</p>)}
            {section.bullets?.length ? <ul>{section.bullets.map((item, itemIndex) => <li key={`${item}-${itemIndex}`}><CheckCircle2 size={17}/><span>{item}</span></li>)}</ul> : null}
            {section.numbered?.length ? <ol>{section.numbered.map((item, itemIndex) => <li key={`${item}-${itemIndex}`}>{item}</li>)}</ol> : null}
            {section.table ? <div className="blog-table-wrap"><table><thead><tr>{section.table.headers.map((heading) => <th key={heading}>{heading}</th>)}</tr></thead><tbody>{section.table.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={`${rowIndex}-${cellIndex}`}>{cell}</td>)}</tr>)}</tbody></table></div> : null}

            {index === 1 ? <div className="blog-inline-cta">
              <div><div className="kicker">Need someone to own this?</div><h3>{service ? `Get matched with approved ${roleLabel.toLowerCase()} talent.` : "Turn the workload into a clear VA brief."}</h3><p>{service ? "Share the workload and weekly hours. We will use your brief to identify relevant candidates." : "Tell us what you want to delegate, your weekly hours, budget, and schedule. We will help you turn the research into a practical hiring request."}</p></div>
              <Link className="btn btn-primary" href={matchHref} data-track="blog_cta_match">Get a managed VA <ArrowRight size={16}/></Link>
            </div> : null}

            {index === 2 ? <ContextLinks post={post} start={0} count={2}/> : null}
            {index === 5 ? <ContextLinks post={post} start={2} count={2}/> : null}
          </div>)}

          <section className="blog-faqs" id="frequently-asked-questions" aria-labelledby="faq-heading">
            <div className="kicker">FAQ</div>
            <h2 id="faq-heading">Frequently asked questions</h2>
            <div className="blog-faq-list">
              {post.faqs.map((faq) => <details key={faq.question}>
                <summary>{faq.question}</summary>
                <p>{faq.answer}</p>
              </details>)}
            </div>
          </section>

          <section className="blog-internal-reading" aria-labelledby="internal-reading-heading">
            <div className="kicker">Continue from here</div>
            <h2 id="internal-reading-heading">Related pages worth opening next</h2>
            <div className="blog-internal-reading-grid">
              {post.internalLinks.map((link) => <Link href={link.href} key={link.href} data-track="blog_context_link">
                <strong>{link.label}</strong>
                <span>{link.description}</span>
                <em>Read next <ArrowRight size={13}/></em>
              </Link>)}
            </div>
          </section>

          {post.sources?.length ? <section className="blog-sources" aria-labelledby="sources-heading"><h2 id="sources-heading">Sources and further reading</h2><p>For legal, compliance, tax, health, and employment questions, check the current official guidance that applies to your situation.</p><ul>{post.sources.map((source) => <li key={source.href}><a href={source.href} target="_blank" rel="noreferrer">{source.label} <ExternalLink size={13}/></a></li>)}</ul><Link className="text-link" href="/editorial-policy/">How we review high-stakes content <ArrowRight size={13}/></Link></section> : null}

          {showPlanningTools ? <section className="blog-planning-tools" aria-labelledby="planning-tools-heading"><div className="kicker">Free planning tools</div><h2 id="planning-tools-heading">Turn the guide into a clearer hiring plan.</h2><div className="blog-planning-tool-grid"><Link href="/tools/virtual-assistant-cost-calculator/" data-track="blog_tool_click"><Calculator size={20}/><div><strong>VA cost calculator</strong><span>Model weekly hours, a VA rate, and a local comparison.</span></div></Link><Link href="/tools/virtual-assistant-job-description-generator/" data-track="blog_tool_click"><ClipboardList size={20}/><div><strong>Job description generator</strong><span>Turn the workload into a usable first-draft role brief.</span></div></Link><Link href="/tools/what-type-of-va-do-i-need/" data-track="blog_tool_click"><ListChecks size={20}/><div><strong>VA role finder</strong><span>Start with the workload when the job title is still unclear.</span></div></Link></div></section> : null}

          <div className="blog-author-card">
            <div className="blog-author-avatar" aria-hidden="true">{post.author === "Christ Hemsworthy" ? "CH" : "VA"}</div>
            <div><div className="small muted">Written by</div><h3><Link href={post.author === "Christ Hemsworthy" ? "/authors/christ-hemsworthy/" : "/authors/editorial-team/"}>{post.author}</Link></h3><p>{post.author === "Christ Hemsworthy" ? "Christ Hemsworthy writes about remote hiring, VA operations, delegation, and the Philippines talent market for VirtualAssistant.com.ph." : "The VirtualAssistant.com.ph Editorial Team creates practical hiring and operations guidance from the workflows used across the platform."}</p></div>
          </div>

          <div className="blog-bottom-conversion">
            <div className="blog-bottom-copy"><div className="kicker">Ready to hire</div><h2>{service ? "Stop researching and start comparing relevant talent." : "Turn the research into a role you can actually hire for."}</h2><p>{service ? "Use the service page connected to this guide to browse approved profiles or send a short private brief." : "Share the workload, schedule, and budget. You can send a private role brief without creating an account or publishing a job."}</p><div className="row wrap"><Link className="btn btn-primary btn-lg" href={matchHref} data-track="blog_cta_match">Get a managed VA <ArrowRight size={16}/></Link><Link className="btn btn-lg" href={serviceHref} data-track="blog_service_click">{service ? `View ${roleLabel} VAs` : "Explore VA services"}</Link></div></div>
          </div>
        </article>
      </div>
    </section>

    {service ? <section className="section section-soft blog-match-section"><div className="container blog-match-grid"><div><div className="kicker">Free match request</div><h2>Tell us what you need handled.</h2><p>Keep the first step short. The service is already selected from the article you were reading.</p></div><ServiceMatchForm slug={service.slug} category={service.directoryCategory} roleLabel={roleLabel} example={matchExample} talentHref={`/find-talent?category=${encodeURIComponent(service.directoryCategory)}`} sourcePath={blogHref(post)} /></div></section> : null}

    {related.length ? <section className="section section-white"><div className="container"><div className="section-head"><div className="kicker">Keep reading</div><h2>Related guides</h2></div><div className="blog-related-grid">{related.map((item) => <Link className="blog-related-card" href={blogHref(item)} key={item.slug} data-track="blog_related_click"><span>{BLOG_TOPICS[item.topic].label}</span><h3>{item.title}</h3><p>{item.excerpt}</p><strong>Read guide <ArrowRight size={14}/></strong></Link>)}</div></div></section> : null}
  </>;
}
