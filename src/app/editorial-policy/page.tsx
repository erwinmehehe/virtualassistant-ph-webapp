import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, BookOpenCheck, RefreshCw, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { canonicalPath } from "@/lib/seo-url";

export const metadata: Metadata = {
  title: "Editorial Policy | VirtualAssistant.com.ph",
  description:
    "How VirtualAssistant.com.ph writes, reviews, updates, sources, and corrects hiring, pricing, compliance, and virtual assistant content.",
  alternates: { canonical: canonicalPath("/editorial-policy") }
};

export default function EditorialPolicyPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <section className="public-hero-small">
          <div className="container">
            <div className="public-page-head">
              
              <h1 className="public-page-title">How we create and maintain our guides.</h1>
              <p className="public-lede">
                Our goal is useful, specific guidance that helps a reader make a better hiring or management decision without presenting marketing claims as facts or general information as professional advice.
              </p>
            </div>
          </div>
        </section>

        <section className="section section-white">
          <div className="container editorial-policy-grid">
            <article className="card">
              <BookOpenCheck size={23} />
              <h2>Practical first</h2>
              <p>
                Articles are built around a real reader decision such as defining a VA role, setting a budget, preparing an interview, or designing an access workflow. Service-linked guides point to the relevant service page rather than pretending the blog itself is the hiring transaction.
              </p>
            </article>

            <article className="card">
              <BadgeCheck size={23} />
              <h2>Named authorship</h2>
              <p>
                Every article names its author and links to an author page. Editorial-team content is attributed to the VirtualAssistant.com.ph Editorial Team rather than to an invented individual expert.
              </p>
            </article>

            <article className="card">
              <ShieldCheck size={23} />
              <h2>High-stakes topics</h2>
              <p>
                Legal, employment, healthcare, tax, financial, and compliance articles include source and scope notes. We use primary or official sources where practical and explicitly recommend qualified professional advice when the answer depends on jurisdiction or individual facts.
              </p>
            </article>

            <article className="card">
              <RefreshCw size={23} />
              <h2>Updates and corrections</h2>
              <p>
                Material updates change the visible updated date. When an earlier version used an overly broad or unsupported claim, we correct the substance rather than silently preserving it for SEO. Readers can report an issue through our <Link href="/contact">contact page</Link>.
              </p>
            </article>

            <article className="card span-2">
              <h2>Commercial independence</h2>
              <p>
                VirtualAssistant.com.ph sells VA hiring and placement services, so our articles can contain calls to browse talent or request a shortlist. Those calls to action do not change our standard for factual claims. Comparisons explain operating-model differences and direct readers to verify competitors&apos; current fees, features, and policies instead of presenting changeable product details as permanent facts.
              </p>
            </article>

            <article className="card span-2">
              <h2>What editorial review means</h2>
              <p>
                &quot;Reviewed by the VirtualAssistant.com.ph Editorial Team&quot; means the article was checked for clarity, internal consistency, source use, product-policy alignment, and unsupported claims. It does not imply legal, medical, accounting, tax, or other professional review unless a separately named qualified reviewer is shown.
              </p>
            </article>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
