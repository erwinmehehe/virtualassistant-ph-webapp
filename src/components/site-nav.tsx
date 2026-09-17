import Link from "next/link";
import { ArrowRight, CalendarCheck, ChevronDown, Menu } from "lucide-react";
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

const industryLinks = INDUSTRIES.slice(0, 8);

const CLIENT_LOGIN = "/auth/login?next=%2Fworkspace%2Fclient";
const VA_LOGIN = "/auth/login?next=%2Fworkspace%2Fva";

function CallCard({ title, body }: { title: string; body: string }) {
  return (
    <aside className="va-nav-callcard">
      <CalendarCheck size={20} aria-hidden="true" />
      <strong>{title}</strong>
      <p>{body}</p>
      <Link href="/hire" data-track="nav_hiring_brief_click">Start a hiring brief <ArrowRight size={14} aria-hidden="true" /></Link>
    </aside>
  );
}

export function SiteNav() {
  return (
    <header className="site-header va-site-nav">
      <div className="container site-nav">
        <Link className="brand" href="/" aria-label="VirtualAssistant.com.ph home">VirtualAssistant<span className="ph">.com.ph</span></Link>

        <nav className="nav-links" aria-label="Primary navigation">
          <Link href="/find-talent">Find a VA</Link>

          <details className="va-nav-menu">
            <summary>Services <ChevronDown size={14} aria-hidden="true" /></summary>
            <div className="va-nav-panel va-nav-panel-wide va-nav-mega">
              <div>
                <div className="va-nav-columns">
                  {serviceGroups.map(([group, pages]) => (
                    <div className="va-nav-column" key={group}>
                      <span>{group}</span>
                      {pages.slice(0, 3).map((page) => <Link href={`/service/${page.slug}`} key={page.slug}>{page.name.replace(/ Virtual Assistant$/, "")}</Link>)}
                    </div>
                  ))}
                </div>
                <Link className="va-nav-all" href="/services">View all {SERVICE_PAGES.length} services</Link>
              </div>
              <CallCard title="Not sure which role?" body="Describe the work and our recruiters will scope the right VA with you." />
            </div>
          </details>

          <details className="va-nav-menu">
            <summary>Industries <ChevronDown size={14} aria-hidden="true" /></summary>
            <div className="va-nav-panel va-nav-panel-industries va-nav-mega">
              <div>
                <div className="va-nav-industries-grid">
                  {industryLinks.map((industry) => <Link href={`/industries/${industry.slug}`} key={industry.slug}>{industry.label}</Link>)}
                </div>
                <Link className="va-nav-all" href="/industries">View all industries</Link>
              </div>
              <CallCard title="Hiring for your industry?" body="We screen for the tools and workflows your team already uses." />
            </div>
          </details>

          <Link href="/how-vetting-works">How it works</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/for-virtual-assistants">For VAs</Link>
        </nav>

        <div className="nav-actions">
          <details className="va-nav-menu va-nav-login">
            <summary>Log in <ChevronDown size={14} aria-hidden="true" /></summary>
            <div className="va-nav-panel va-nav-panel-login">
              <span>Clients</span>
              <Link href={CLIENT_LOGIN}>Client Portal</Link>
              <span>Virtual Assistants</span>
              <Link href={VA_LOGIN}>VA log in</Link>
              <Link href="/for-virtual-assistants">For Virtual Assistants</Link>
              <Link href="/auth/join/va">Apply as a VA</Link>
            </div>
          </details>
          <Link className="btn btn-primary desktop-hire-cta header-hire-cta" href="/hire" data-track="header_hire_virtual_assistant">Hire a Virtual Assistant</Link>

          <details className="va-mobile-drawer">
            <summary className="btn" aria-label="Navigation menu"><Menu size={18} aria-hidden="true" /><span>Menu</span></summary>
            <nav className="va-mobile-panel" aria-label="Mobile navigation">
              <Link className="mobile-menu-primary" href="/hire">Hire a Virtual Assistant</Link>
              <Link href="/find-talent">Find a VA</Link>
              <Link href="/services">Services</Link>
              <Link href="/industries">Industries</Link>
              <Link href="/how-vetting-works">How it works</Link>
              <Link href="/pricing">Pricing</Link>
              <span className="va-mobile-panel-label">Virtual Assistants</span>
              <Link href="/for-virtual-assistants">For Virtual Assistants</Link>
              <Link href="/jobs">Browse Virtual Assistant jobs</Link>
              <Link href="/auth/join/va">Apply as a Virtual Assistant</Link>
              <Link href={VA_LOGIN}>VA log in</Link>
              <span className="va-mobile-panel-label">Account</span>
              <Link href={CLIENT_LOGIN}>Client Portal</Link>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
