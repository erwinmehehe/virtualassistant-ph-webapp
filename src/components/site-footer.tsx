import Link from "next/link";
import styles from "./site-footer.module.css";
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
      <footer className="footer va-site-footer">
        <div className="container footer-grid">
          <div className="footer-brand-block">
            <Link prefetch={false} className="brand" href="/" style={{ gap: 0 }}><span style={{ marginLeft: 9, display: "inline-flex", gap: 0 }}>VirtualAssistant<span className="ph" style={{ marginLeft: 0, paddingLeft: 0 }}>.com.ph</span></span></Link>
            <p>Vetted Filipino virtual assistants for businesses that want a clearer path from workload to shortlist to hire.</p>
            <div className={styles.socialLinks}>
              <a
                className={styles.facebookLink}
                href="https://www.facebook.com/profile.php?id=61595768241097"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Visit Virtual Assistant Philippines on Facebook (opens in a new tab)"
              >
                <svg className={styles.facebookIcon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.23.2 2.23.2v2.45h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z" />
                </svg>
                <span>Facebook</span>
              </a>
            </div>
          </div>
          <div className="footer-links"><strong>Hire</strong><Link prefetch={false} href="/hire">Hire a Virtual Assistant</Link><Link prefetch={false} href="/find-talent">Browse Virtual Assistants</Link><Link prefetch={false} href="/services">Services</Link><Link prefetch={false} href="/pricing">Pricing</Link><Link prefetch={false} href="/managed-vs-direct-hire">Managed vs. Direct Hire</Link></div>
          <div className="footer-links"><strong>Resources</strong><Link prefetch={false} href="/industries">Industries</Link><Link prefetch={false} href="/software">Software guides</Link><Link prefetch={false} href="/how-vetting-works">How vetting works</Link><Link prefetch={false} href="/blog">Blog</Link><Link prefetch={false} href="/research/virtual-assistant-rates-philippines-2026">2026 Rate &amp; Skills Report</Link><Link prefetch={false} href="/tools">Free tools</Link></div>
          <div className="footer-links"><strong>Company</strong><Link prefetch={false} href="/about">About</Link><Link prefetch={false} href="/faq">FAQ</Link><Link prefetch={false} href="/contact">Contact</Link><Link prefetch={false} href="/editorial-policy">Editorial policy</Link></div>
          <div className="footer-links"><strong>For Virtual Assistants</strong><Link prefetch={false} href="/jobs">Browse Virtual Assistant jobs</Link><Link prefetch={false} href="/auth/join/va">Apply as a Virtual Assistant</Link><Link prefetch={false} href="/auth/login">Log in</Link></div>
        </div>

        <div className="container">
          <details className="footer-seo-directory">
            <summary>Browse all Virtual Assistant roles, industries, and software guides</summary>
            <div className="footer-directory">
              {footerRoleGroups.map(([group, pages]) => <div key={group}><strong>{group}</strong><div className="footer-directory-links">{pages.slice(0, 5).map((page) => <Link prefetch={false} href={`/service/${page.slug}`} key={page.slug}>{page.name}</Link>)}</div></div>)}
              <div><strong>All services</strong><div className="footer-directory-links">{SERVICE_PAGES.slice(0, 5).map((page) => <Link prefetch={false} href={`/service/${page.slug}`} key={page.slug}>{page.name}</Link>)}</div><Link prefetch={false} className="footer-directory-all" href="/services">All {SERVICE_PAGES.length} services</Link></div>
              <div><strong>By industry</strong><div className="footer-directory-links">{INDUSTRIES.slice(0, 12).map((industry) => <Link prefetch={false} href={`/industries/${industry.slug}`} key={industry.slug}>{industry.label}</Link>)}</div><Link prefetch={false} className="footer-directory-all" href="/industries">All {INDUSTRIES.length} industries</Link></div>
              <div><strong>By software</strong><div className="footer-directory-links">{softwarePages.slice(0, 12).map((page) => <Link prefetch={false} href={`/software/${page.slug}`} key={page.slug}>{page.name}</Link>)}</div><Link prefetch={false} className="footer-directory-all" href="/software">All {softwarePages.length} software guides</Link></div>
            </div>
          </details>
        </div>

        <div className="container footer-bottom"><span>© {new Date().getFullYear()} VirtualAssistant.com.ph</span><span>Founded by <a href="https://www.linkedin.com/in/seo-expert-ph/" target="_blank" rel="noopener noreferrer">Erwin Valles</a> · SEO, Web Design &amp; Development</span><span className="footer-legal"><Link prefetch={false} href="/privacy">Privacy</Link><Link prefetch={false} href="/terms">Terms</Link></span></div>
      </footer>
    </>
  );
}
