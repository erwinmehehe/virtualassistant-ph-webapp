import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { softwarePages } from "@/lib/software-pages";

export const metadata: Metadata = {
  title: "Virtual Assistants by Software & Platform",
  description: "Hire a Filipino virtual assistant already trained on your software -- ApplyOnline, PropertyMe, ServiceM8, Cliniko, Xero, Revit, and more.",
  keywords: ["virtual assistant by software", "software-specific virtual assistant philippines", "hire virtual assistant for my platform"],
  alternates: { canonical: "/software" }
};

export default function SoftwareIndexPage() {
  return <><SiteHeader/><main id="main-content">
    <section className="section public-hero-small"><div className="container"><div className="public-page-head">
      <h1 className="public-page-title">Hire a virtual assistant who already knows your software.</h1>
      <p className="public-lede">Platform familiarity shortens onboarding. Use the guide closest to the systems your team actually runs to decide what to delegate, which decisions stay local, and what to test in an interview.</p>
      <div className="hero-actions" style={{ marginTop: 24 }}><Link className="btn btn-primary btn-lg" href="/hire">Get a managed VA <ArrowRight size={16}/></Link><Link className="btn btn-lg" href="/services">Browse VA services</Link></div>
    </div></div></section>
    <section className="section"><div className="container">
      <div className="section-head"><h2>Choose the platform your team runs on.</h2><p>Each guide covers realistic workflows, related roles, and where the licensed or regulated local professional keeps final decision authority.</p></div>
      <div className="grid-3">{softwarePages.map((page) => <article className="card card-hover stack" key={page.slug}>
        <div><span className="badge">{page.category}</span><h2 style={{ marginTop: 10 }}>{page.software}</h2><p className="muted">{page.metaDescription}</p></div>
        <Link className="btn btn-primary" href={`/software/${page.slug}/`}>View {page.software} guide <ArrowRight size={16}/></Link>
      </article>)}</div>
    </div></section>
  </main><SiteFooter/></>;
}
