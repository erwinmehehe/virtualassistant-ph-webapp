import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Calculator,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  ListChecks,
  ShieldCheck
} from "lucide-react";
import { BlogFeaturedVisual } from "@/components/blog-featured-visual";
import { type BlogPost, BLOG_TOPICS, blogHref, relatedBlogPosts } from "@/lib/blog";
import { servicePageBySlug } from "@/lib/service-pages";
import { canonicalPath } from "@/lib/seo-url";

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
      {links.map((link) => <Link href={canonicalPath(link.href)} key={link.href} data-track="blog_context_link">
        <span><strong>{link.label}</strong><small>{link.description}</small></span>
        <ArrowRight size={15} aria-hidden="true"/>
      </Link>)}
    </div>
  </aside>;
}

export function BlogArticle({ post }: { post: BlogPost }) {
  const related = relatedBlogPosts(post, 4);
  const topic = BLOG_TOPICS[post.topic];
  const service = post.serviceSlug ? servicePageBySlug(post.serviceSlug) : undefined;
  const serviceHref = service ? `/service/${service.slug}` : "/services";
  const roleLabel = service?.name.replace(/ Virtual Assistant$/i, "") || "Virtual Assistant";
  const talentHref = service
    ? `/find-talent?category=${encodeURIComponent(service.directoryCategory)}`
    : "/find-talent";
  const headings = [
    { id: "key-takeaways-heading", label: "Key takeaways" },
    ...post.sections.map((section) => ({ id: idFor(section.heading), label: section.heading })),
    { id: "frequently-asked-questions", label: "Frequently asked questions" }
  ];
  const hasMeaningfulUpdate = post.updatedAt !== post.publishedAt;
  const articleDate = new Date(`${hasMeaningfulUpdate ? post.updatedAt : post.publishedAt}T00:00:00Z`);
  const articleDateLabel = hasMeaningfulUpdate ? "Updated" : "Published";
  const showPlanningTools = ["hiring", "pricing", "managing"].includes(post.topic);
  const authorHref = post.author === "Christ Hemsworthy" ? "/authors/christ-hemsworthy" : "/authors/editorial-team";
  const authorInitials = post.author === "Christ Hemsworthy" ? "CH" : "VA";

  return <div className="blog-editorial-page">
    <header className="blog-editorial-hero">
      <div className="container blog-editorial-hero-inner">
        <nav className="breadcrumbs blog-editorial-breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link><span aria-hidden="true">/</span><Link href="/blog">Blog</Link><span aria-hidden="true">/</span><Link href={`/blog/topic/${post.topic}`}>{topic.label}</Link>
        </nav>

        <div className="blog-editorial-hero-grid">
          <div className="blog-editorial-hero-copy">
            <Link className="blog-topic-pill" href={`/blog/topic/${post.topic}`}>{topic.label}</Link>
            <h1>{post.title}</h1>
            <p className="blog-deck">{post.excerpt}</p>

            <div className="blog-editorial-author-row">
              <div className="blog-editorial-author-avatar" aria-hidden="true">{authorInitials}</div>
              <div className="blog-editorial-author-copy">
                <div><Link href={authorHref}>{post.author}</Link>{post.reviewedBy ? <span className="blog-reviewed-inline"><BadgeCheck size={15} aria-hidden="true"/> Reviewed by {post.reviewedBy}</span> : null}</div>
                <div className="blog-byline" aria-label="Article details">
                  <span><CalendarDays size={14} aria-hidden="true"/>{articleDateLabel} {articleDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })}</span>
                  <span><BookOpen size={14} aria-hidden="true"/>{readTime(post)} min read</span>
                </div>
              </div>
            </div>
          </div>

          <BlogFeaturedVisual topic={post.topic} title={post.title} label={topic.label} detail={post.clusterLabel} />
        </div>
      </div>
    </header>

    <section className="blog-editorial-body">
      <div className="container blog-editorial-layout">
        <aside className="blog-toc" aria-label="On this page">
          <div className="blog-toc-inner">
            <span className="blog-toc-eyebrow">In this guide</span>
            <nav>{headings.map((item) => <a href={`#${item.id}`} key={item.id}>{item.label}</a>)}</nav>
            {service ? <Link href={serviceHref} className="blog-toc-service" data-track="blog_service_click">Explore {roleLabel} hiring <ArrowRight size={14}/></Link> : null}
          </div>
        </aside>

        <article className="blog-article">
          <details className="blog-mobile-toc">
            <summary>In this guide</summary>
            <nav>{headings.map((item) => <a href={`#${item.id}`} key={item.id}>{item.label}</a>)}</nav>
          </details>

          {post.reviewNote ? <div className="blog-review-note" role="note"><ShieldCheck size={19} aria-hidden="true"/><div><strong>Editorial note</strong><p>{post.reviewNote}</p></div></div> : null}

          <p className="blog-lead">{post.description}</p>

          <section className="blog-takeaways" aria-labelledby="key-takeaways-heading">
            <div className="kicker">Key takeaways</div>
            <h2 id="key-takeaways-heading">What matters most</h2>
            <ul>{post.keyTakeaways.map((item, index) => <li key={`${String(item)}-${index}`}><CheckCircle2 size={18} aria-hidden="true"/><span>{item}</span></li>)}</ul>
          </section>

          {post.sections.map((section, index) => <section className="blog-section" id={idFor(section.heading)} key={`${section.heading}-${index}`}>
            <h2>{section.heading}</h2>
            {(section.paragraphs || []).map((paragraph, paragraphIndex) => <p key={`${section.heading}-p-${paragraphIndex}`}>{paragraph}</p>)}
            {section.bullets?.length ? <ul>{section.bullets.map((item, itemIndex) => <li key={`${item}-${itemIndex}`}><CheckCircle2 size={17} aria-hidden="true"/><span>{item}</span></li>)}</ul> : null}
            {section.numbered?.length ? <ol>{section.numbered.map((item, itemIndex) => <li key={`${item}-${itemIndex}`}>{item}</li>)}</ol> : null}
            {section.table ? <div className="blog-table-wrap"><table><thead><tr>{section.table.headers.map((heading) => <th key={heading}>{heading}</th>)}</tr></thead><tbody>{section.table.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={`${rowIndex}-${cellIndex}`}>{cell}</td>)}</tr>)}</tbody></table></div> : null}

            {index === 1 ? <aside className="blog-inline-cta">
              <div><span className="blog-inline-label">Hiring shortcut</span><h3>{service ? `Need a ${roleLabel} Virtual Assistant?` : "Ready to delegate the work?"}</h3><p>Browse screened talent first, or talk through the role with our team.</p></div>
              <div className="blog-inline-actions"><Link className="btn btn-primary" href={talentHref} data-track="blog_cta_talent">Browse talent <ArrowRight size={16}/></Link><Link className="blog-inline-secondary" href="/book-client-call">Book a call</Link></div>
            </aside> : null}

            {index === 2 ? <ContextLinks post={post} start={0} count={2}/> : null}
            {index === 5 ? <ContextLinks post={post} start={2} count={2}/> : null}
          </section>)}

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
            <h2 id="internal-reading-heading">Useful next reads</h2>
            <div className="blog-internal-reading-grid">
              {post.internalLinks.map((link) => <Link href={canonicalPath(link.href)} key={link.href} data-track="blog_context_link">
                <span><strong>{link.label}</strong><small>{link.description}</small></span><ArrowRight size={15} aria-hidden="true"/>
              </Link>)}
            </div>
          </section>

          {post.sources?.length ? <section className="blog-sources" aria-labelledby="sources-heading">
            <h2 id="sources-heading">Sources and further reading</h2>
            <p>For legal, compliance, tax, health, and employment questions, check the current official guidance that applies to your situation.</p>
            <ul>{post.sources.map((source) => <li key={source.href}><a href={source.href} target="_blank" rel="noreferrer">{source.label} <ExternalLink size={13} aria-hidden="true"/></a></li>)}</ul>
            <Link className="text-link" href="/editorial-policy">How we review high-stakes content <ArrowRight size={13}/></Link>
          </section> : null}

          {showPlanningTools ? <section className="blog-planning-tools" aria-labelledby="planning-tools-heading">
            <div className="kicker">Free planning tools</div>
            <h2 id="planning-tools-heading">Turn the guide into a clearer hiring plan</h2>
            <div className="blog-planning-tool-grid">
              <Link href="/tools/virtual-assistant-cost-calculator" data-track="blog_tool_click"><Calculator size={20}/><div><strong>VA cost calculator</strong><span>Model weekly hours, a VA rate, and a local comparison.</span></div><ArrowRight size={15}/></Link>
              <Link href="/tools/virtual-assistant-job-description-generator" data-track="blog_tool_click"><ClipboardList size={20}/><div><strong>Job description generator</strong><span>Turn the workload into a usable first-draft role brief.</span></div><ArrowRight size={15}/></Link>
              <Link href="/tools/what-type-of-va-do-i-need" data-track="blog_tool_click"><ListChecks size={20}/><div><strong>VA role finder</strong><span>Start with the workload when the job title is still unclear.</span></div><ArrowRight size={15}/></Link>
            </div>
          </section> : null}

          <div className="blog-author-card">
            <div className="blog-author-avatar" aria-hidden="true">{authorInitials}</div>
            <div><div className="small muted">Written by</div><h3><Link href={authorHref}>{post.author}</Link></h3><p>{post.author === "Christ Hemsworthy" ? "Christ Hemsworthy writes about remote hiring, Virtual Assistant operations, delegation, and the Philippines talent market for VirtualAssistant.com.ph." : "The VirtualAssistant.com.ph Editorial Team creates practical hiring and operations guidance from our recruiting, vetting, matching, and placement workflows."}</p></div>
          </div>

          <aside className="blog-bottom-conversion">
            <div className="blog-bottom-copy">
              <span className="blog-bottom-label">Ready when you are</span>
              <h2>{service ? `Find a ${roleLabel} Virtual Assistant with a clearer next step.` : "Turn the guide into a real shortlist."}</h2>
              <p>Browse vetted Filipino Virtual Assistants, compare relevant profiles, or book a quick call if you want help defining the role.</p>
              <div className="blog-bottom-actions">
                <Link className="btn btn-primary btn-lg" href={talentHref} data-track="blog_cta_talent">Browse vetted talent <ArrowRight size={16}/></Link>
                <Link className="btn btn-lg" href="/book-client-call" data-track="blog_cta_booking">Book a discovery call</Link>
              </div>
            </div>
          </aside>
        </article>
      </div>
    </section>

    {related.length ? <section className="blog-related-section"><div className="container"><div className="blog-related-heading"><div><span className="kicker">Keep reading</span><h2>Related guides</h2></div><Link href="/blog">View all articles <ArrowRight size={15}/></Link></div><div className="blog-related-grid">{related.map((item) => <Link className="blog-related-card" href={blogHref(item)} key={item.slug} data-track="blog_related_click"><span>{BLOG_TOPICS[item.topic].label}</span><h3>{item.title}</h3><p>{item.excerpt}</p><strong>Read guide <ArrowRight size={14}/></strong></Link>)}</div></div></section> : null}
  </div>;
}
