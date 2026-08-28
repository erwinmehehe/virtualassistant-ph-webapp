import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BLOG_POSTS, BLOG_TOPICS, blogHref } from "@/lib/blog";
import { canonicalPath } from "@/lib/seo-url";

const authors = {
  "christ-hemsworthy": {
    name: "Christ Hemsworthy",
    title: "Contributor",
    bio: "Christ Hemsworthy writes about remote hiring, virtual assistant operations, delegation, and the Philippines talent market for VirtualAssistant.com.ph."
  },
  "editorial-team": {
    name: "VirtualAssistant.com.ph Editorial Team",
    title: "Editorial team",
    bio: "The VirtualAssistant.com.ph Editorial Team creates practical guides from the platform's hiring, vetting, matching, and remote-work workflows. High-stakes topics include explicit source and review notes rather than unsupported professional claims."
  }
} as const;

export function generateStaticParams() { return Object.keys(authors).map((slug) => ({ slug })); }

export async function generateMetadata({params}:{params:Promise<{slug:string}>}): Promise<Metadata> {
  const {slug}=await params; const author=authors[slug as keyof typeof authors];
  if(!author) return {};
  return { title: `${author.name} | Author`, description: author.bio, alternates:{canonical:canonicalPath(`/authors/${slug}`)} };
}

export default async function AuthorPage({params}:{params:Promise<{slug:string}>}) {
  const {slug}=await params; const author=authors[slug as keyof typeof authors];
  if(!author) notFound();
  const posts=BLOG_POSTS.filter((p)=>p.author===author.name).slice(0,24);
  return <><SiteHeader/><main id="main-content"><section className="public-hero-small"><div className="container"><div className="author-page-head"><div className="blog-author-avatar blog-author-avatar-large" aria-hidden="true">{slug==="christ-hemsworthy"?"CH":"VA"}</div><div><h1 className="public-page-title">{author.name}</h1><p className="public-lede">{author.bio}</p></div></div></div></section><section className="section section-white"><div className="container"><div className="section-head"><div className="kicker">Articles</div><h2>Recent guides by {author.name}</h2></div><div className="blog-topic-list">{posts.map((post)=><Link href={blogHref(post)} className="blog-topic-list-card" key={post.slug}><div><span>{BLOG_TOPICS[post.topic].label}</span><h2>{post.title}</h2><p>{post.excerpt}</p></div><ArrowRight size={20}/></Link>)}</div></div></section></main><SiteFooter/></>;
}
