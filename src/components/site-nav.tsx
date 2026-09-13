import Link from "next/link";
import { CalendarDays, ChevronDown, Menu } from "lucide-react";
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

export function SiteNav() {
  return (
    <header className="site-header va-site-nav">
      <div className="container site-nav">
        <Link className="brand" href="/" aria-label="VirtualAssistant.com.ph home">
          VirtualAssistant<span className="ph">.com.ph</span>
        </Link>

        <nav className="nav-links" aria-label="Primary navigation">
          <Link href="/find-talent">Find Virtual Assistants</Link>

          <details className="va-nav-menu">
            <summary>Services <ChevronDown size={14} aria-hidden="true" /></summary>
            <div className="va-nav-panel va-nav-panel-wide">
              <div className="va-nav-columns">
                {serviceGroups.map(([group, pages]) => (
                  <div className="va-nav-column" key={group}>
                    <span>{group}</span>
                    {pages.slice(0, 5).map((page) => <Link href={`/service/${page.slug}`} key={page.slug}>{page.name}</Link>)}
                  </div>
                ))}
              </div>
              <Link className="va-nav-all" href="/services">View all {SERVICE_PAGES.length} services</Link>
            </div>
          </details>

          <details className="va-nav-menu">
            <summary>Industries <ChevronDown size={14} aria-hidden="true" /></summary>
            <div className="va-nav-panel va-nav-panel-wide">
              <div className="va-nav-columns va-nav-industries">
                {industryLinks.map((industry) => <Link href={`/industries/${industry.slug}`} key={industry.slug}>{industry.label}</Link>)}
              </div>
              <Link className="va-nav-all" href="/industries">View all {INDUSTRIES.length} industries</Link>
            </div>
          </details>

          <Link href="/pricing">Pricing</Link>

          <details className="va-nav-menu">
            <summary>Resources <ChevronDown size={14} aria-hidden="true" /></summary>
            <div className="va-nav-panel va-nav-panel-small">
              {resourceLinks.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}
            </div>
          </details>
        </nav>

        <div className="nav-actions">
          <Link className="header-va-link" href="/for-virtual-assistants">For Virtual Assistants</Link>
          <Link className="va-book-link" href="/book-client-call" data-track="booking_click"><CalendarDays size={14}/> Book a call</Link>
          <Link className="btn btn-ghost login-text" href="/auth/login?next=%2Fworkspace%2Fclient">Client Portal</Link>
          <Link className="btn btn-primary desktop-hire-cta header-hire-cta" href="/hire" data-track="header_hire_virtual_assistant">Hire a Virtual Assistant</Link>

          <details className="va-mobile-drawer">
            <summary className="btn" aria-label="Open navigation menu"><Menu size={18}/><span>Menu</span></summary>
            <nav className="va-mobile-panel" aria-label="Mobile navigation">
              <Link className="mobile-menu-primary" href="/hire">Hire a Virtual Assistant</Link>
              <Link href="/find-talent">Find Virtual Assistants</Link>
              <Link href="/services">Services</Link>
              <Link href="/industries">Industries</Link>
              <Link href="/pricing">Pricing</Link>
              <span className="va-mobile-panel-label">Resources</span>
              {resourceLinks.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}
              <span className="va-mobile-panel-label">Virtual Assistants</span>
              <Link href="/jobs">Browse Virtual Assistant jobs</Link>
              <Link href="/auth/join/va">Apply as a Virtual Assistant</Link>
              <span className="va-mobile-panel-label">Account</span>
              <Link href="/auth/login?next=%2Fworkspace%2Fclient">Client Portal</Link>
              <Link href="/book-client-call" data-track="booking_click">Book a client discovery call</Link>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
