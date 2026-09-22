import Link from "next/link";
import { ArrowRight, BadgeCheck, CalendarDays } from "lucide-react";
import { BlogFeaturedVisual } from "@/components/blog-featured-visual";
import type { ArchivePost } from "@/lib/archive-types";
import { SeoPriorityLinks } from "@/components/seo-priority-links";
import { seoPriorityLinksForArchive } from "@/lib/seo-priority-links";

/**
 * Renders a retained article recovered from the previous site.
 *
 * The nine remaining archive articles have distinct search intent and have
 * been substantively re-reviewed. Their sanitized HTML stays portable while
 * the wrapper provides current editorial signals and the right conversion
 * path for employers versus Virtual Assistant applicants.
 */
export function ArchiveArticle({ post }: { post: ArchivePost }) {
  const label = post.tag || "Editorial guide";
  const candidate = post.audience === "candidate";
  const priorityLinks = seoPriorityLinksForArchive(post.slug);

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
            <div className="blog-byline archive-byline">
              {post.date ? <span><CalendarDays size={14} aria-hidden="true"/>Published {post.date}</span> : null}
              {post.updatedDate ? <span><CalendarDays size={14} aria-hidden="true"/>Updated {post.updatedDate}</span> : null}
            </div>
          </div>

          <BlogFeaturedVisual
            title={post.title}
            label={label}
            detail={post.updatedDate ? "Reviewed and updated by the VirtualAssistant.com.ph editorial team." : "From the VirtualAssistant.com.ph editorial archive."}
          />
        </div>
      </div>
    </header>

    <section className="blog-editorial-body archive-editorial-body">
      <div className="container archive-editorial-layout">
        <article className="archive-body">
          {post.fieldNotes?.length ? <aside className="blog-field-notes" aria-label={candidate ? "Applicant readiness notes" : "Recruiter field notes"}>
            <div className="kicker">{candidate ? "Applicant readiness" : "Recruiter field notes"}</div>
            <h2>{candidate ? "What makes the next step easier" : "What we would verify before shortlisting"}</h2>
            <ul>{post.fieldNotes.map((item, index) => <li key={`${item}-${index}`}><BadgeCheck size={17} aria-hidden="true"/><span>{item}</span></li>)}</ul>
          </aside> : null}
          <SeoPriorityLinks links={priorityLinks} title={candidate ? "Useful career and payment guides" : "Related Philippines VA research"} />
          <div dangerouslySetInnerHTML={{ __html: post.html }} />
        </article>

        <aside className="blog-bottom-conversion archive-bottom-conversion">
          <div className="blog-bottom-copy">
            <span className="blog-bottom-label">{candidate ? "Build your VA career" : "Ready when you are"}</span>
            <h2>{candidate ? "Apply for roles that match the work you can prove." : "Start by comparing vetted talent."}</h2>
            <p>{candidate
              ? "Review current Virtual Assistant jobs, then create a profile that shows your skills, tools, availability and work setup clearly."
              : "Compare vetted Filipino Virtual Assistants first. If you want help shaping the role, book a discovery call with our team."}</p>
            <div className="blog-bottom-actions">
              <Link className="btn btn-primary btn-lg" href={candidate ? "/jobs" : "/find-talent"}>
                {candidate ? "Browse VA jobs" : "Browse vetted talent"} <ArrowRight size={16}/>
              </Link>
              <Link className="btn btn-lg" href={candidate ? "/auth/join/va" : "/book-client-call"}>
                {candidate ? "Create VA profile" : "Book a discovery call"}
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </section>
  </div>;
}
