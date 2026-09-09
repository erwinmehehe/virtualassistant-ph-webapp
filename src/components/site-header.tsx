import Link from "next/link";
import { ChevronDown, Menu } from "lucide-react";
import { SERVICE_PAGES } from "@/lib/service-pages";
import { INDUSTRIES } from "@/lib/industries";

const serviceGroups = Array.from(
  SERVICE_PAGES.reduce((groups, page) => {
    const list = groups.get(page.group) || [];
    list.push(page);
    groups.set(page.group, list);
    return groups;
  }, new Map<string, typeof SERVICE_PAGES>())
).sort((a, b) => b[1].length - a[1].length).slice(0, 6);

const industryLinks = INDUSTRIES.slice(0, 12);

const resourceLinks = [
  ["How vetting works", "/how-vetting-works"],
  ["Software guides", "/software"],
  ["Blog", "/blog"],
  ["Free tools", "/tools"]
] as const;

const forVaLinks = [
  ["Browse Virtual Assistant jobs", "/jobs"],
  ["Apply as a Virtual Assistant", "/auth/join/va"]
] as const;

const mobilePublicLinks = [
  ["Find Virtual Assistants", "/find-talent"],
  ["Services", "/services"],
  ["Industries", "/industries"],
  ["Pricing", "/pricing"],
  ...resourceLinks
] as const;

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container site-nav">
        <Link className="brand" href="/" aria-label="VirtualAssistant.com.ph home">
          VirtualAssistant<span className="ph">.com.ph</span>
        </Link>

        <nav className="nav-links" aria-label="Primary navigation">
          <Link href="/find-talent">Find Virtual Assistants</Link>

          <div className="nav-mega-menu">
            <Link href="/services" className="nav-mega-trigger">
              Services <ChevronDown size={14} aria-hidden="true" />
            </Link>
            <div className="nav-mega-panel nav-mega-wide">
              <div className="nav-mega-columns">
                {serviceGroups.map(([group, pages]) => (
                  <div key={group}>
                    <span className="nav-mega-heading">{group}</span>
                    {pages.slice(0, 6).map((page) => (
                      <Link href={`/service/${page.slug}`} key={page.slug}>{page.name}</Link>
                    ))}
                  </div>
                ))}
              </div>
              <Link href="/services" className="nav-mega-all">View all {SERVICE_PAGES.length} services →</Link>
            </div>
          </div>

          <div className="nav-mega-menu">
            <Link href="/industries" className="nav-mega-trigger">
              Industries <ChevronDown size={14} aria-hidden="true" />
            </Link>
            <div className="nav-mega-panel">
              <div className="nav-mega-columns nav-mega-columns-flat">
                {industryLinks.map((industry) => (
                  <Link href={`/industries/${industry.slug}`} key={industry.slug}>{industry.label}</Link>
                ))}
              </div>
              <Link href="/industries" className="nav-mega-all">View all {INDUSTRIES.length} industries →</Link>
            </div>
          </div>

          <Link href="/pricing">Pricing</Link>

          <details className="nav-resource-menu">
            <summary>
              Resources <ChevronDown size={14} aria-hidden="true" />
            </summary>
            <div className="nav-resource-panel">
              {resourceLinks.map(([label, href]) => (
                <Link href={href} key={href}>{label}</Link>
              ))}
            </div>
          </details>
        </nav>

        <div className="nav-actions">
          <Link className="header-va-link" href="/jobs">For Virtual Assistants</Link>
          <Link className="btn btn-ghost login-text" href="/auth/login?next=%2Fworkspace%2Fclient">Client Portal</Link>
          <Link className="btn btn-primary desktop-hire-cta header-hire-cta" href="/hire" data-track="header_hire_virtual_assistant">Hire a Virtual Assistant</Link>
          <details className="mobile-menu">
            <summary className="btn" aria-label="Open navigation menu"><Menu size={18}/><span>Menu</span></summary>
            <nav className="mobile-menu-panel" aria-label="Mobile navigation">
              <Link className="mobile-menu-primary" href="/hire">Hire a Virtual Assistant</Link>
              {mobilePublicLinks.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}
              <div className="mobile-menu-divider" />
              <span className="mobile-menu-section-label">For Virtual Assistants</span>
              {forVaLinks.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}
              <div className="mobile-menu-divider" />
              <Link href="/auth/login?next=%2Fworkspace%2Fclient">Client Portal</Link>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
