import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CompactPageHeader } from "@/components/compact-page-header";
import { Band, SectionHead } from "@/components/hiring-page-sections";
import { candidateSeoResources, SEO_RESOURCE_PAGES, SEO_RESOURCE_ROLE_COUNT } from "@/lib/seo-resource-pages";
import { canonicalPath } from "@/lib/seo-url";
import "../homepage-sections.css";
import "../hiring-pages.css";
import "../info-pages.css";

export const metadata: Metadata = {
  title: "Virtual Assistant Hiring & Career Resources",
  description: "Browse Virtual Assistant hiring, task, interview, cost, role, application, resume, portfolio, skills, requirements, and career resources.",
  alternates: { canonical: canonicalPath("/resources") }
};

export default function ResourcesPage() {
  const client = SEO_RESOURCE_PAGES.filter((page) => page.audience === "client");
  const candidate = candidateSeoResources();
  return <><SiteHeader/><main id="main-content">
    <CompactPageHeader
      eyebrow="Virtual Assistant resource library"
      title={<h1>Hiring and career resources organized by search intent.</h1>}
      description={<p>{SEO_RESOURCE_ROLE_COUNT} underdeveloped commercial role clusters now have dedicated definition, task, hiring, interview, and cost guidance. Candidate resources stay in a separate path so job-seeker intent does not compete with client money pages.</p>}
      actions={<><Link className="btn btn-primary" href="/services">Browse VA services <ArrowRight size={16}/></Link><Link className="btn" href="/jobs">Browse VA jobs</Link></>}
    />
    <div className="hs-root sp-root">
      <Band>
        <SectionHead kicker="For businesses" title="Role-specific hiring resources" lede="Each cluster supports one canonical service page instead of creating duplicate commercial money pages."/>
        <div className="premium-service-grid">
          {client.map((page) => <Link className="premium-service-card" href={"/resources/" + page.slug} key={page.slug}><div><h3>{page.title}</h3><p>{page.metaDescription}</p></div><span className="premium-service-link">Read guide <ArrowRight size={14}/></span></Link>)}
        </div>
      </Band>
      <Band tone="soft">
        <SectionHead kicker="For Virtual Assistants" title="Candidate search resources" lede="Application, resume, portfolio, skills, requirements, interview, part-time, and work-from-home guidance points job seekers toward the candidate funnel rather than the client hiring funnel."/>
        <div className="premium-service-grid">
          {candidate.map((page) => <Link className="premium-service-card" href={"/resources/" + page.slug} key={page.slug}><div><h3>{page.title}</h3><p>{page.metaDescription}</p></div><span className="premium-service-link">Read guide <ArrowRight size={14}/></span></Link>)}
        </div>
      </Band>
    </div>
  </main><SiteFooter/></>;
}
