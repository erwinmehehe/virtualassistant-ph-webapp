import Link from "next/link";
import { ArrowRight, Menu } from "lucide-react";
import {
  trainingJoinHref,
  trainingLoginHref,
} from "@/lib/training-intent";

export function TrainingSiteHeader({ courseSlug }: { courseSlug?: string | null }) {
  const joinHref = trainingJoinHref(courseSlug);
  const loginHref = trainingLoginHref(courseSlug);

  return (
    <header className="site-header va-site-nav training-site-header">
      <div className="container site-nav">
        <Link className="brand" href="/" aria-label="VirtualAssistant.com.ph home">
          VirtualAssistant<span className="ph">.com.ph</span>
        </Link>

        <nav className="nav-links" aria-label="Training navigation">
          <Link href="/training#course-library">Courses</Link>
          <Link href="/for-virtual-assistants">For VAs</Link>
          <Link href="/jobs">VA jobs</Link>
        </nav>

        <div className="nav-actions">
          <Link className="va-nav-account-login" href={loginHref} data-track="training_login_click">
            Training login
          </Link>
          <Link
            className="btn btn-primary desktop-hire-cta training-header-cta"
            href={joinHref}
            data-track="training_account_click"
            data-cta-position="header"
          >
            Start free training <ArrowRight size={14} aria-hidden="true"/>
          </Link>

          <details className="va-mobile-drawer">
            <summary className="btn" aria-label="Training navigation menu">
              <Menu size={18} aria-hidden="true"/><span>Menu</span>
            </summary>
            <nav className="va-mobile-panel" aria-label="Mobile training navigation">
              <Link
                className="mobile-menu-primary"
                href={joinHref}
                data-track="training_account_click"
                data-cta-position="mobile_menu"
              >
                Start free training
              </Link>
              <Link href="/training#course-library">Browse courses</Link>
              <Link href="/for-virtual-assistants">For Virtual Assistants</Link>
              <Link href="/jobs">Browse VA jobs</Link>
              <span className="va-mobile-panel-label">Account</span>
              <Link href={loginHref} data-track="training_login_click">Training login</Link>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
