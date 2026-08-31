import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
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
      <div className="archive-cta">
        <div>
          <h2>Looking for a virtual assistant?</h2>
          <p>Browse vetted Filipino VAs, or tell us the role and we will shortlist against it.</p>
        </div>
        <div className="row wrap">
          <Link className="btn btn-primary btn-lg" href="/find-talent">Browse VAs <ArrowRight size={16}/></Link>
          <Link className="btn btn-lg" href="/hire">Get a managed VA</Link>
        </div>
      </div>
    </div></section>
  </>;
}
