import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MarketingHero } from "@/components/marketing-hero";
import { RoleBriefForm } from "@/components/role-brief-form";
import { BLOG_POSTS, BLOG_TOPICS, blogHref, topicPosts, type BlogTopic } from "@/lib/blog";
import { canonicalPath } from "@/lib/seo-url";

export function generateStaticParams() { return Object.keys(BLOG_TOPICS).map((slug) => ({ slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (!(slug in BLOG_TOPICS)) return {};
  const topic = BLOG_TOPICS[slug as BlogTopic];
  return { title: `${topic.label} Virtual Assistant Guides`, description: topic.description, alternates: { canonical: canonicalPath(`/blog/topic/${slug}`) } };
}

export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!(slug in BLOG_TOPICS)) notFound();
  const topicKey = slug as BlogTopic;
  const topic = BLOG_TOPICS[topicKey];
  const posts = topicPosts(topicKey);
  return <><SiteHeader/><main id="main-content">
    <MarketingHero
      eyebrow={<nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/blog">Blog</Link><span>/</span><span>{topic.label}</span></nav>}
      title={<h1 className="public-page-title">{topic.label}</h1>}
      intro={<p className="public-lede">{topic.description}</p>}
      actions={<><Link className="btn btn-primary btn-lg" href="/hire">Start a hiring request <ArrowRight size={16}/></Link><Link className="btn btn-lg" href="/services">Browse VA services</Link></>}
      trust={<><span><CheckCircle2 size={15}/>Private role brief</span><span><CheckCircle2 size={15}/>Recruiter-reviewed matching</span><span><CheckCircle2 size={15}/>No account required</span></>}
      form={<RoleBriefForm sourcePath={`/blog/topic/${slug}`} heading="Turn the research into a shortlist" subheading="Share the workload, hours, budget, and schedule. We will use the context to narrow the role and candidate fit." />}
    />
    <section className="section section-white"><div className="container"><div className="blog-topic-list">{posts.map((post) => <Link className="blog-topic-list-card" href={blogHref(post)} key={post.slug} data-track="blog_related_click"><div><span>{post.clusterLabel}</span><h2>{post.title}</h2><p>{post.excerpt}</p></div><ArrowRight size={20}/></Link>)}</div></div></section>
  </main><SiteFooter/></>;
}
