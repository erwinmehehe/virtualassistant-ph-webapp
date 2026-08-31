import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import type { ArchivePost } from "@/lib/archive-types";
import { RoleBriefForm } from "@/components/role-brief-form";

/**
 * Renders a post recovered from the previous WordPress site.
 *
 * These predate the current editorial schema, so their original HTML is
 * rendered directly rather than being reshaped into sections, FAQs and
 * internal links. The HTML was sanitized at import: script, style, iframe,
 * object and embed elements and inline event handlers were removed.
 */
export function ArchiveArticle({ post, sourcePath, error, sent }: { post: ArchivePost; sourcePath: string; error?: string; sent?: boolean }) {
  return <>
    <article className="section blog-article-shell"><div className="container blog-article-column">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link><span aria-hidden="true">/</span>
        <Link href="/blog">Blog</Link><span aria-hidden="true">/</span>
        <span aria-current="page">{post.title}</span>
      </nav>

      <header className="blog-article-head">
        {post.tag ? <span className="badge">{post.tag}</span> : null}
        <h1>{post.title}</h1>
        {post.date ? <p className="small muted archive-byline"><CalendarDays size={14}/> Published {post.date}</p> : null}
      </header>

      <div className="archive-body" dangerouslySetInnerHTML={{ __html: post.html }} />
    </div></article>

    <section className="section section-white"><div className="container">
      <div className="home-lead-grid">
        <div className="home-lead-copy">
          <div className="kicker">Ready to hire</div>
          <h2>Tell us the role and we will shortlist against it.</h2>
          <p>Describe the work, the hours and the overlap you need. Every candidate you see has already passed a skills test, a video introduction and a recruiter review.</p>
          <ul className="home-lead-points">
            <li>No account required, and nothing is published</li>
            <li>VA pay and our service fee shown separately</li>
            <li>Prefer to look first? <Link className="text-link" href="/find-talent">Browse approved VAs <ArrowRight size={13}/></Link></li>
          </ul>
        </div>
        <RoleBriefForm sourcePath={sourcePath} error={error} sent={sent} heading="Get matched" subheading="About 60 seconds. Required fields are marked." />
      </div>
    </div></section>
  </>;
}
