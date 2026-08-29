import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FloatingCta } from "@/components/floating-cta";
import { SERVICE_PAGES } from "@/lib/service-pages";
import { INDUSTRIES } from "@/lib/industries";
import { softwarePages } from "@/lib/software-pages";

export function SiteFooter() {
  return (
    <><FloatingCta/>
    <footer className="footer">
      <div className="container footer-cta">
        <div><h2>Tell us the work you need covered. We will help you narrow the shortlist.</h2></div>
        <div className="row wrap"><Link className="btn btn-white" href="/auth/join/client?next=%2Fworkspace%2Fclient%2Fjobs%2Fnew">Post a Job <ArrowRight size={15}/></Link><Link className="btn footer-outline-btn" href="/find-talent">Hire a VA</Link><Link className="btn footer-outline-btn" href="/hire">Managed hiring</Link></div>
      </div>
      <div className="container footer-grid">
        <div className="footer-brand-block">
          <Link className="brand" href="/">VirtualAssistant<span className="ph">.com.ph</span></Link>
          <p>Vetted Filipino virtual assistants for businesses that want a clearer path from workload to shortlist to hire.</p>
        </div>
        <div className="footer-links"><strong>Hire</strong><Link href="/hire">Get a managed VA</Link><Link href="/find-talent">Browse VAs</Link><Link href="/services">Services</Link><Link href="/pricing">Pricing</Link><Link href="/managed-vs-direct-hire">Managed vs. Direct Hire</Link></div>
        <div className="footer-links"><strong>Explore</strong><Link href="/industries">Industries</Link><Link href="/how-vetting-works">Vetting</Link><Link href="/how-vetting-works">How vetting works</Link><Link href="/blog">Blog</Link><Link href="/tools">Free tools</Link></div>
        <div className="footer-links"><strong>Company</strong><Link href="/about">About</Link><Link href="/faq">FAQ</Link><Link href="/contact">Contact</Link><Link href="/editorial-policy">Editorial policy</Link></div>
        <div className="footer-links"><strong>Account</strong><Link href="/auth/login">Log in</Link><Link href="/auth/join/va">Apply as a VA</Link><Link href="/jobs">VA jobs</Link></div>
      </div>
      <div className="container footer-directory">
        <div>
          <strong>Virtual assistant services</strong>
          <div className="footer-directory-links">{SERVICE_PAGES.slice(0, 12).map((page) => <Link href={`/service/${page.slug}`} key={page.slug}>{page.name}</Link>)}</div>
          <Link className="footer-directory-all" href="/services">All {SERVICE_PAGES.length} services →</Link>
        </div>
        <div>
          <strong>By industry</strong>
          <div className="footer-directory-links">{INDUSTRIES.slice(0, 12).map((industry) => <Link href={`/industries/${industry.slug}`} key={industry.slug}>{industry.label}</Link>)}</div>
          <Link className="footer-directory-all" href="/industries">All {INDUSTRIES.length} industries →</Link>
        </div>
        <div>
          <strong>By software</strong>
          <div className="footer-directory-links">{softwarePages.slice(0, 12).map((page) => <Link href={`/software/${page.slug}`} key={page.slug}>{page.name}</Link>)}</div>
          <Link className="footer-directory-all" href="/software">All {softwarePages.length} software guides →</Link>
        </div>
      </div>

      <div className="container footer-bottom"><span>© {new Date().getFullYear()} VirtualAssistant.com.ph</span><span className="footer-legal"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></span></div>
    </footer></>
  );
}
