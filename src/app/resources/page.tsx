import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CompactPageHeader } from "@/components/compact-page-header";
import { Band, SectionHead } from "@/components/hiring-page-sections";
import { candidateSeoResources, SEO_RESOURCE_PAGES, SEO_RESOURCE_ROLE_COUNT } from "@/lib/seo-resource-pages";
import { canonicalPath } from "@/lib/seo-url";
import { EDITORIAL_RESOURCE_SLUGS, EXISTING_BLOG_RESOURCE_REDIRECTS } from "@/lib/editorial-seo-guides";
import "../homepage-sections.css";
import "../hiring-pages.css";
import "../info-pages.css";

export const metadata: Metadata = {
  title: "Virtual Assistant Hiring & Career Resources",
  description: "Browse role-specific Virtual Assistant hiring, task, interview, cost, and tools resources. Career and informational guides now live in the editorial blog.",
  alternates: { canonical: canonicalPath("/resources") }
};

export default function ResourcesPage() {
  const client = SEO_RESOURCE_PAGES.filter((page) => page.audience === "client" && page.intent === "definition");
  const candidate = candidateSeoResources().filter((page) => !EDITORIAL_RESOURCE_SLUGS.includes(page.slug as typeof EDITORIAL_RESOURCE_SLUGS[number]) && !EXISTING_BLOG_RESOURCE_REDIRECTS[page.slug]);
  return <><SiteHeader/><main id="main-content">
    <CompactPageHeader
      eyebrow="Virtual Assistant resource library"
      title={<h1>Virtual Assistant hiring and career resources.</h1>}
      description={<p>Practical role resources for businesses hiring Filipino Virtual Assistants. Career, application, resume, portfolio, and other informational guides are published in the editorial blog.</p>}
      actions={<><Link className="btn btn-primary" href="/services">Browse VA services <ArrowRight size={16}/></Link><Link className="btn" href="/jobs">Browse VA jobs</Link></>}
    />
    <div className="hs-root sp-root">
      <Band>
        <SectionHead kicker="For businesses" title="Virtual Assistant hiring guides" lede={"Start with one guide for each of " + SEO_RESOURCE_ROLE_COUNT + " Virtual Assistant role families, then continue into tasks, interview questions, costs, tools, and hiring guidance."}/>
        <div className="premium-service-grid">
          {client.map((page) => <Link className="premium-service-card" href={"/resources/" + page.slug} key={page.slug}><div><h3>{page.title}</h3><p>{page.metaDescription}</p></div><span className="premium-service-link">Read guide <ArrowRight size={14}/></span></Link>)}
        </div>
      </Band>
      <Band tone="soft">
        <SectionHead kicker="For Virtual Assistants" title="Career guidance now lives in the blog" lede="Application, resume, portfolio, skills, training, certification, equipment, freelance-platform, and career guides are editorial topics, so they now live with the rest of our blog content."/>
        <div className="row wrap"><Link className="btn btn-primary" href="/blog">Browse the VA blog <ArrowRight size={16}/></Link><Link className="btn" href="/for-virtual-assistants">VA career hub</Link></div>
        {candidate.length ? <div className="premium-service-grid">{candidate.map((page) => <Link className="premium-service-card" href={"/resources/" + page.slug} key={page.slug}><div><h3>{page.title}</h3><p>{page.metaDescription}</p></div><span className="premium-service-link">Read guide <ArrowRight size={14}/></span></Link>)}</div> : null}
      </Band>
    </div>
  </main><SiteFooter/></>;
}
