import Link from "next/link";
import { ArrowRight, Menu } from "lucide-react";
import {
  trainingJoinHref,
  trainingLoginHref,
} from "@/lib/training-intent";

export function TrainingSiteHeader({
  courseSlug,
  current = "landing",
}: {
  courseSlug?: string | null;
  current?: "landing" | "join";
}) {
  const joinHref = trainingJoinHref(courseSlug);
  const loginHref = trainingLoginHref(courseSlug);
  const isJoin = current === "join";

  return (
    <header className={`site-header va-site-nav training-site-header ${isJoin ? "is-join" : ""}`}>
      <div className="container site-nav">
        <Link className="brand" href="/" aria-label="VirtualAssistant.com.ph home">
          VirtualAssistant<span className="ph">.com.ph</span>
        </Link>

        <nav className="nav-links" aria-label="Training navigation">
          <Link href={isJoin ? "/training" : "/training#course-library"}>
            {isJoin ? "Training home" : "Courses"}
          </Link>
          <Link href="/for-virtual-assistants">For VAs</Link>
          <Link href="/jobs">VA jobs</Link>
        </nav>

        <div className="nav-actions">
          {isJoin ? (
            <Link className="btn training-header-login" href={loginHref} data-track="training_login_click">
              Training login
            </Link>
          ) : (
            <>
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
            </>
          )}

          <details className="va-mobile-drawer">
            <summary className="btn" aria-label="Training navigation menu">
              <Menu size={18} aria-hidden="true"/><span>Menu</span>
            </summary>
            <nav className="va-mobile-panel" aria-label="Mobile training navigation">
              {isJoin ? (
                <Link
                  className="mobile-menu-primary"
                  href={loginHref}
                  data-track="training_login_click"
                >
                  Training login
                </Link>
              ) : (
                <Link
                  className="mobile-menu-primary"
                  href={joinHref}
                  data-track="training_account_click"
                  data-cta-position="mobile_menu"
                >
                  Start free training
                </Link>
              )}
              <Link href={isJoin ? "/training" : "/training#course-library"}>
                {isJoin ? "Training home" : "Browse courses"}
              </Link>
              <Link href="/for-virtual-assistants">For Virtual Assistants</Link>
              <Link href="/jobs">Browse VA jobs</Link>
              {!isJoin ? (
                <>
                  <span className="va-mobile-panel-label">Account</span>
                  <Link href={loginHref} data-track="training_login_click">Training login</Link>
                </>
              ) : null}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
