import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FloatingCta } from "@/components/floating-cta";
import { SERVICE_PAGES } from "@/lib/service-pages";
import { INDUSTRIES } from "@/lib/industries";
import { softwarePages } from "@/lib/software-pages";

const footerRoleGroups = Array.from(
  SERVICE_PAGES.reduce((groups, page) => {
    const list = groups.get(page.group) || [];
    list.push(page);
    groups.set(page.group, list);
    return groups;
  }, new Map<string, typeof SERVICE_PAGES>())
).sort((a, b) => b[1].length - a[1].length).slice(0, 6);

export function SiteFooter() {
  return (
    <>
      <FloatingCta />
      <footer className="footer">
        <div className="container footer-cta">
          <div>
            <div className="kicker">Ready to hire?</div>
            <h2>Tell us what needs to get off your plate. We will help you find the right Filipino Virtual Assistant.</h2>
          </div>
          <div className="row wrap">
            <Link className="btn btn-white" href="/hire">Get matched <ArrowRight size={15}/></Link>
            <Link className="btn footer-outline-btn" href="/find-talent">Browse Virtual Assistants</Link>
          </div>
        </div>

        <div className="container footer-grid">
          <div className="footer-brand-block">
            <Link className="brand" href="/">VirtualAssistant<span className="ph">.com.ph</span></Link>
            <p>Vetted Filipino virtual assistants for businesses that want a clearer path from workload to shortlist to hire.</p>
          </div>
          <div className="footer-links">
            <strong>Hire</strong>
            <Link href="/hire">Hire a Virtual Assistant</Link>
            <Link href="/find-talent">Browse Virtual Assistants</Link>
            <Link href="/services">Services</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/managed-vs-direct-hire">Managed vs. Direct Hire</Link>
          </div>
          <div className="footer-links">
            <strong>Resources</strong>
            <Link href="/industries">Industries</Link>
            <Link href="/software">Software guides</Link>
            <Link href="/how-vetting-works">How vetting works</Link>
            <Link href="/blog">Blog</Link>
            <Link href="/tools">Free tools</Link>
          </div>
          <div className="footer-links">
            <strong>Company</strong>
            <Link href="/about">About</Link>
            <Link href="/faq">FAQ</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/editorial-policy">Editorial policy</Link>
          </div>
          <div className="footer-links">
            <strong>For Virtual Assistants</strong>
            <Link href="/for-virtual-assistants">Virtual Assistant overview</Link>
            <Link href="/jobs">Browse Virtual Assistant jobs</Link>
            <Link href="/auth/join/va">Apply as a Virtual Assistant</Link>
            <Link href="/auth/login">Log in</Link>
          </div>
        </div>

        <div className="container">
          <details className="footer-seo-directory">
            <summary>Browse all Virtual Assistant roles, industries, and software guides</summary>
            <div className="footer-directory">
              {footerRoleGroups.map(([group, pages]) => (
                <div key={group}>
                  <strong>{group}</strong>
                  <div className="footer-directory-links">
                    {pages.slice(0, 5).map((page) => (
                      <Link href={`/service/${page.slug}`} key={page.slug}>{page.name}</Link>
                    ))}
                  </div>
                </div>
              ))}
              <div>
                <strong>All services</strong>
                <div className="footer-directory-links">
                  {SERVICE_PAGES.slice(0, 5).map((page) => (
                    <Link href={`/service/${page.slug}`} key={page.slug}>{page.name}</Link>
                  ))}
                </div>
                <Link className="footer-directory-all" href="/services">All {SERVICE_PAGES.length} services →</Link>
              </div>
              <div>
                <strong>By industry</strong>
                <div className="footer-directory-links">
                  {INDUSTRIES.slice(0, 12).map((industry) => (
                    <Link href={`/industries/${industry.slug}`} key={industry.slug}>{industry.label}</Link>
                  ))}
                </div>
                <Link className="footer-directory-all" href="/industries">All {INDUSTRIES.length} industries →</Link>
              </div>
              <div>
                <strong>By software</strong>
                <div className="footer-directory-links">
                  {softwarePages.slice(0, 12).map((page) => (
                    <Link href={`/software/${page.slug}`} key={page.slug}>{page.name}</Link>
                  ))}
                </div>
                <Link className="footer-directory-all" href="/software">All {softwarePages.length} software guides →</Link>
              </div>
            </div>
          </details>
        </div>

        <div className="container footer-bottom">
          <span>© {new Date().getFullYear()} VirtualAssistant.com.ph</span>
          <span className="footer-legal"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></span>
        </div>
      </footer>
    </>
  );
}
