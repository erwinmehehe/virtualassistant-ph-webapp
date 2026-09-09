import Link from "next/link";
import { ChevronDown, Menu } from "lucide-react";
import { getSessionProfile } from "@/lib/auth";
import { SERVICE_PAGES } from "@/lib/service-pages";
import { INDUSTRIES } from "@/lib/industries";
import { logoutAction } from "@/app/actions/auth";

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
  ["Browse VA jobs", "/jobs"],
  ["Apply as a VA", "/auth/join/va"]
] as const;

const mobilePublicLinks = [
  ["Find VAs", "/find-talent"],
  ["Services", "/services"],
  ["Industries", "/industries"],
  ["Pricing", "/pricing"],
  ...resourceLinks
] as const;

export async function SiteHeader() {
  const { user, profile } = await getSessionProfile();

  return (
    <header className="site-header">
      <div className="container site-nav">
        <Link className="brand" href="/" aria-label="VirtualAssistant.com.ph home">
          VirtualAssistant<span className="ph">.com.ph</span>
        </Link>

        <nav className="nav-links" aria-label="Primary navigation">
          <Link href="/find-talent">Find VAs</Link>

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
          {!user || !profile ? (
            <>
              <Link className="header-va-link" href="/jobs">For VAs</Link>
              <Link className="btn btn-ghost login-text" href="/auth/login?next=%2Fworkspace%2Fclient%2Fjobs%2Fnew">Log in</Link>
              <Link className="btn btn-primary desktop-hire-cta header-hire-cta" href="/hire" data-track="header_hire_va">Hire a VA</Link>
              <details className="mobile-menu">
                <summary className="btn" aria-label="Open navigation menu"><Menu size={18}/><span>Menu</span></summary>
                <nav className="mobile-menu-panel" aria-label="Mobile navigation">
                  <Link className="mobile-menu-primary" href="/hire">Hire a VA</Link>
                  {mobilePublicLinks.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}
                  <div className="mobile-menu-divider" />
                  <span className="mobile-menu-section-label">For virtual assistants</span>
                  {forVaLinks.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}
                  <div className="mobile-menu-divider" />
                  <Link href="/auth/login">Log in</Link>
                </nav>
              </details>
            </>
          ) : (
            <>
              {profile.role === "client" ? (
                <Link className="btn btn-primary desktop-hire-cta header-hire-cta" href="/workspace/client/jobs/new">Post a Job</Link>
              ) : profile.role === "va" ? (
                <Link className="btn btn-primary desktop-hire-cta header-hire-cta" href="/workspace/va/jobs">Browse jobs</Link>
              ) : profile.role === "recruiter" ? (
                <Link className="btn btn-primary desktop-hire-cta header-hire-cta" href="/workspace/recruiter">Recruiter Dashboard</Link>
              ) : (
                <Link className="btn btn-primary desktop-hire-cta header-hire-cta" href="/workspace/admin">Admin Dashboard</Link>
              )}
              {profile.role === "client" || profile.role === "va" ? (
                <Link className="btn btn-ghost" href={`/workspace/${profile.role}`}>Open workspace</Link>
              ) : null}
              <form action={logoutAction} className="desktop-logout">
                <button className="btn btn-ghost" type="submit">Log out</button>
              </form>
              <details className="mobile-menu">
                <summary className="btn" aria-label="Open account menu"><Menu size={18}/><span>Menu</span></summary>
                <nav className="mobile-menu-panel" aria-label="Account navigation">
                  {profile.role === "client" ? (
                    <Link className="mobile-menu-primary" href="/workspace/client/jobs/new">Post a Job</Link>
                  ) : profile.role === "va" ? (
                    <Link className="mobile-menu-primary" href="/workspace/va/jobs">Browse jobs</Link>
                  ) : profile.role === "recruiter" ? (
                    <Link className="mobile-menu-primary" href="/workspace/recruiter">Recruiter Dashboard</Link>
                  ) : (
                    <Link className="mobile-menu-primary" href="/workspace/admin">Admin Dashboard</Link>
                  )}
                  {(profile.role === "client" || profile.role === "va") ? (
                    <Link href={`/workspace/${profile.role}`}>Open workspace</Link>
                  ) : null}
                  {mobilePublicLinks.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}
                  <div className="mobile-menu-divider" />
                  <span className="mobile-menu-section-label">For virtual assistants</span>
                  {forVaLinks.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}
                  <div className="mobile-menu-divider" />
                  <form action={logoutAction}><button className="mobile-menu-button" type="submit">Log out</button></form>
                </nav>
              </details>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
