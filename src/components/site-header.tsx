import Link from "next/link";
import { ChevronDown, Menu } from "lucide-react";
import { getSessionProfile } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";

// Employer-facing track only -- candidate/jobseeker links (Jobs, Apply as a
// VA) live in forVaLinks below, kept structurally separate so a business
// owner and a jobseeker never see the same nav items mixed together.
const primaryPublicLinks = [
  ["Find VAs", "/find-talent"],
  ["Services", "/services"],
  ["Industries", "/industries"],
  ["Software", "/software"],
  ["Pricing", "/pricing"]
] as const;

const resourceLinks = [
  ["How vetting works", "/how-vetting-works"],
  ["Blog", "/blog"],
  ["Free tools", "/tools"]
] as const;

const forVaLinks = [
  ["Browse VA jobs", "/jobs"],
  ["Apply as a VA", "/auth/join/va"]
] as const;

const mobilePublicLinks = [...primaryPublicLinks, ...resourceLinks] as const;

export async function SiteHeader() {
  const { user, profile } = await getSessionProfile();

  return (
    <header className="site-header">
      <div className="container site-nav">
        <Link className="brand" href="/" aria-label="VirtualAssistant.com.ph home">
          VirtualAssistant<span className="ph">.com.ph</span>
        </Link>

        <nav className="nav-links" aria-label="Primary navigation">
          {primaryPublicLinks.map(([label, href]) => (
            <Link href={href} key={href}>{label}</Link>
          ))}
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

        <nav className="nav-forva" aria-label="For virtual assistants">
          <details className="nav-resource-menu nav-forva-menu">
            <summary>
              For VAs <ChevronDown size={14} aria-hidden="true" />
            </summary>
            <div className="nav-resource-panel">
              {forVaLinks.map(([label, href]) => (
                <Link href={href} key={href}>{label}</Link>
              ))}
            </div>
          </details>
        </nav>

        <div className="nav-actions">
          {!user || !profile ? (
            <>
              <Link className="btn btn-ghost login-text" href="/auth/login?next=%2Fworkspace%2Fclient%2Fjobs%2Fnew">Log in</Link>
              <Link className="btn btn-primary desktop-hire-cta" href="/auth/join/client?next=%2Fworkspace%2Fclient%2Fjobs%2Fnew" data-track="header_post_job">Post a Job</Link>
              <details className="mobile-menu">
                <summary className="btn" aria-label="Open navigation menu"><Menu size={18}/><span>Menu</span></summary>
                <nav className="mobile-menu-panel" aria-label="Mobile navigation">
                  <Link className="mobile-menu-primary" href="/auth/join/client?next=%2Fworkspace%2Fclient%2Fjobs%2Fnew">Post a Job</Link>
                  <Link href="/hire">Managed hiring</Link>
                  {mobilePublicLinks.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}
                  <div className="mobile-menu-divider" />
                  <span className="mobile-menu-section-label">For VAs</span>
                  {forVaLinks.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}
                  <div className="mobile-menu-divider" />
                  <Link href="/auth/login">Log in</Link>
                </nav>
              </details>
            </>
          ) : (
            <>
              {profile.role === "client" ? <Link className="btn btn-primary desktop-hire-cta" href="/workspace/client/jobs/new">Post a Job</Link> : profile.role === "va" ? <Link className="btn btn-primary desktop-hire-cta" href="/workspace/va/jobs">Browse jobs</Link> : profile.role === "recruiter" ? <Link className="btn btn-primary desktop-hire-cta" href="/workspace/recruiter">Recruiter Dashboard</Link> : <Link className="btn btn-primary desktop-hire-cta" href="/workspace/admin">Admin Dashboard</Link>}
              {profile.role === "client" || profile.role === "va" ? <Link className="btn btn-ghost" href={`/workspace/${profile.role}`}>Open workspace</Link> : null}
              <form action={logoutAction} className="desktop-logout"><button className="btn btn-ghost" type="submit">Log out</button></form>
              <details className="mobile-menu">
                <summary className="btn" aria-label="Open account menu"><Menu size={18}/><span>Menu</span></summary>
                <nav className="mobile-menu-panel" aria-label="Account navigation">
                  {profile.role === "client" ? <Link className="mobile-menu-primary" href="/workspace/client/jobs/new">Post a Job</Link> : profile.role === "va" ? <Link className="mobile-menu-primary" href="/workspace/va/jobs">Browse jobs</Link> : profile.role === "recruiter" ? <Link className="mobile-menu-primary" href="/workspace/recruiter">Recruiter Dashboard</Link> : <Link className="mobile-menu-primary" href="/workspace/admin">Admin Dashboard</Link>}
                  {(profile.role === "client" || profile.role === "va") ? <Link href={`/workspace/${profile.role}`}>Open workspace</Link> : null}
                  {mobilePublicLinks.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}
                  <div className="mobile-menu-divider" />
                  <span className="mobile-menu-section-label">For VAs</span>
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
