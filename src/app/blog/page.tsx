import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Calculator, CheckCircle2, Search } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MarketingHero } from "@/components/marketing-hero";
import { RoleBriefForm } from "@/components/role-brief-form";
import { BlogFeaturedVisual } from "@/components/blog-featured-visual";
import { BLOG_POSTS, BLOG_TOPICS, blogHref } from "@/lib/blog";
import { canonicalPath } from "@/lib/seo-url";

export const metadata: Metadata = {
  title: "Virtual Assistant Hiring & Management Blog",
  description: "Practical guides for hiring, pricing, onboarding, and managing virtual assistants from the Philippines, plus role-specific advice for SEO, medical, legal, ecommerce, real estate, and more.",
  keywords: ["virtual assistant blog", "how to hire a virtual assistant", "virtual assistant philippines guide", "managing remote virtual assistants"],
  alternates: { canonical: canonicalPath("/blog") }
};

const featuredSlugs = [
  "hire-virtual-assistant-philippines",
  "how-much-virtual-assistant-philippines",
  "what-does-an-seo-virtual-assistant-do",
  "what-is-a-virtual-medical-assistant",
  "what-does-a-law-firm-virtual-assistant-do"
];

export default function BlogPage() {
  const featured = featuredSlugs.map((slug) => BLOG_POSTS.find((p) => p.slug === slug)).filter(Boolean) as typeof BLOG_POSTS;
  const recent = BLOG_POSTS.slice(0, 12);
  return <><SiteHeader/><main id="main-content">
    <MarketingHero
      className="blog-index-hero"
      eyebrow="Virtual Assistant hiring resources"
      title={<h1>Build a better remote team, one clear workflow at a time.</h1>}
      intro={<p>Practical hiring, pricing, delegation, and role-specific guides for businesses working with Filipino virtual assistants. Every article is connected to the service page, tool, or next action it supports.</p>}
      actions={<><Link className="btn btn-primary btn-lg" href="/hire" data-track="blog_cta_match">Get a managed VA <ArrowRight size={16}/></Link><Link className="btn btn-lg" href="/tools/virtual-assistant-cost-calculator" data-track="blog_tool_click"><Calculator size={16}/>VA cost calculator</Link></>}
      trust={<><span><CheckCircle2 size={15}/>Private role brief</span><span><CheckCircle2 size={15}/>Recruiter-reviewed matching</span><span><CheckCircle2 size={15}/>No account required</span></>}
      form={<RoleBriefForm sourcePath="/blog" heading="Turn the research into a shortlist" subheading="Share the workload, schedule, and budget while the hiring context is fresh." />}
    />

    <section className="section section-white"><div className="container"><div className="section-head"><div className="kicker">Browse by topic</div><h2>Start with the decision you are trying to make.</h2></div><div className="blog-topic-grid">{Object.entries(BLOG_TOPICS).map(([slug, topic]) => {
      const count = BLOG_POSTS.filter((p) => p.topic === slug).length;
      return <Link className="blog-topic-card" href={`/blog/topic/${slug}`} key={slug}><span>{String(count).padStart(2,"0")} guides</span><h3>{topic.label}</h3><p>{topic.description}</p><strong>Explore topic <ArrowRight size={14}/></strong></Link>;
    })}</div></div></section>

    <section className="section section-soft"><div className="container"><div className="section-head"><div className="kicker">Start here</div><h2>High-value guides for buyers.</h2><p>These pages answer the questions that usually come before a role brief, shortlist, or interview.</p></div><div className="blog-featured-grid">{featured.map((post, i) => <Link href={blogHref(post)} className={`blog-featured-card ${i===0?"blog-featured-primary":""}`} key={post.slug} data-track="blog_related_click"><BlogFeaturedVisual topic={post.topic} title={post.title} label={BLOG_TOPICS[post.topic].label} detail={post.clusterLabel}/><div className="blog-card-copy"><span>{BLOG_TOPICS[post.topic].label}</span><h3>{post.title}</h3><p>{post.excerpt}</p><strong>Read guide <ArrowRight size={14}/></strong></div></Link>)}</div></div></section>

    <section className="section section-white"><div className="container"><div className="section-head row-between wrap"><div><div className="kicker">Latest resources</div><h2>New and refreshed guides</h2></div><Link className="btn" href="/services">Browse service guides</Link></div><div className="blog-list-grid">{recent.map((post) => <Link className="blog-list-card blog-list-card-visual" href={blogHref(post)} key={post.slug} data-track="blog_related_click"><BlogFeaturedVisual topic={post.topic} title={post.title} label={BLOG_TOPICS[post.topic].label} detail={post.clusterLabel}/><div><span>{BLOG_TOPICS[post.topic].label} · {post.clusterLabel}</span><h3>{post.title}</h3><p>{post.excerpt}</p></div></Link>)}</div></div></section>

  </main><SiteFooter/></>;
}
