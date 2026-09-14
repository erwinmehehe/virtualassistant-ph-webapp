import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { BlogFeaturedVisual } from "@/components/blog-featured-visual";
import type { ArchivePost } from "@/lib/archive-types";

/**
 * Renders a post recovered from the previous WordPress site.
 *
 * These predate the current editorial schema, so their original HTML is
 * rendered directly rather than being reshaped into sections, FAQs and
 * internal links. The HTML was sanitized at import: script, style, iframe,
 * object and embed elements and inline event handlers were removed.
 */
export function ArchiveArticle({ post }: { post: ArchivePost }) {
  const label = post.tag || "Editorial guide";

  return <div className="blog-editorial-page archive-editorial-page">
    <header className="blog-editorial-hero archive-editorial-hero">
      <div className="container blog-editorial-hero-inner">
        <nav className="breadcrumbs blog-editorial-breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link><span aria-hidden="true">/</span>
          <Link href="/blog">Blog</Link><span aria-hidden="true">/</span>
          <span aria-current="page">Article</span>
        </nav>

        <div className="blog-editorial-hero-grid">
          <div className="blog-editorial-hero-copy">
            {post.tag ? <span className="blog-topic-pill">{post.tag}</span> : null}
            <h1>{post.title}</h1>
            {post.excerpt ? <p className="blog-deck">{post.excerpt}</p> : null}
            {post.date ? <div className="blog-byline archive-byline"><span><CalendarDays size={14} aria-hidden="true"/>Published {post.date}</span></div> : null}
          </div>

          <BlogFeaturedVisual title={post.title} label={label} detail="Recovered from the VirtualAssistant.com.ph editorial archive." />
        </div>
      </div>
    </header>

    <section className="blog-editorial-body archive-editorial-body">
      <div className="container archive-editorial-layout">
        <article className="archive-body" dangerouslySetInnerHTML={{ __html: post.html }} />

        <aside className="blog-bottom-conversion archive-bottom-conversion">
          <div className="blog-bottom-copy">
            <span className="blog-bottom-label">Ready when you are</span>
            <h2>Start by comparing vetted talent.</h2>
            <p>Compare vetted Filipino Virtual Assistants first. If you want help shaping the role, book a discovery call with our team.</p>
            <div className="blog-bottom-actions">
              <Link className="btn btn-primary btn-lg" href="/find-talent">Browse vetted talent <ArrowRight size={16}/></Link>
              <Link className="btn btn-lg" href="/book-client-call">Book a discovery call</Link>
            </div>
          </div>
        </aside>
      </div>
    </section>
  </div>;
}
