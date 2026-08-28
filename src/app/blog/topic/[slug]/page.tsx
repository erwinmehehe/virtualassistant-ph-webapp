import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BLOG_POSTS, BLOG_TOPICS, blogHref, topicPosts, type BlogTopic } from "@/lib/blog";

export function generateStaticParams() { return Object.keys(BLOG_TOPICS).map((slug) => ({ slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (!(slug in BLOG_TOPICS)) return {};
  const topic = BLOG_TOPICS[slug as BlogTopic];
  return { title: `${topic.label} Virtual Assistant Guides`, description: topic.description, alternates: { canonical: `/blog/topic/${slug}/` } };
}

export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!(slug in BLOG_TOPICS)) notFound();
  const topicKey = slug as BlogTopic;
  const topic = BLOG_TOPICS[topicKey];
  const posts = topicPosts(topicKey);
  return <><SiteHeader/><main id="main-content"><section className="public-hero-small"><div className="container"><nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/blog">Blog</Link><span>/</span><span>{topic.label}</span></nav><div className="public-page-head"><h1 className="public-page-title">{topic.label}</h1><p className="public-lede">{topic.description}</p></div></div></section><section className="section section-white"><div className="container"><div className="blog-topic-list">{posts.map((post) => <Link className="blog-topic-list-card" href={blogHref(post)} key={post.slug} data-track="blog_related_click"><div><span>{post.clusterLabel}</span><h2>{post.title}</h2><p>{post.excerpt}</p></div><ArrowRight size={20}/></Link>)}</div></div></section></main><SiteFooter/></>;
}
