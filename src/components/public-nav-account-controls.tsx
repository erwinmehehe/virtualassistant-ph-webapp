"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { trainingJoinHref, trainingLoginHref } from "@/lib/training-intent";

type Role = "client" | "va" | "recruiter" | "admin";
type NavIdentity = { signedIn: boolean; role: Role | null };

const SIGNED_OUT: NavIdentity = { signedIn: false, role: null };

function isRole(value: unknown): value is Role {
  return value === "client" || value === "va" || value === "recruiter" || value === "admin";
}

function workspaceHref(role: Role | null) {
  if (role === "client") return "/workspace/client";
  if (role === "va") return "/workspace/va";
  if (role === "recruiter") return "/workspace/recruiter/today";
  if (role === "admin") return "/workspace/admin/today";
  return "/workspace";
}

/**
 * A small browser-only account island. Public pages must never call cookies(),
 * auth.getUser(), or read a profile while producing shared HTML/ISR responses.
 * Only signed-in visitors make a browser-to-Supabase request after hydration.
 *
 * This is for NAVIGATION DISPLAY ONLY. All private routes and actions must
 * continue to verify the session/role on the server and enforce Supabase RLS.
 */
export function PublicNavAccountControls({
  isTrainingContext,
}: {
  isTrainingContext: boolean;
}) {
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [identity, setIdentity] = useState<NavIdentity>(SIGNED_OUT);

  useEffect(() => {
    const supabase = createClient();
    // The callback must stay synchronous; querying Supabase from inside it can
    // deadlock the client's auth state lock. INITIAL_SESSION covers page load.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionUserId(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let cancelled = false;
    setIdentity(SIGNED_OUT);
    if (!sessionUserId) return;

    async function resolveNavigation() {
      const supabase = createClient();
      // Verify the current session before displaying a signed-in account link.
      const { data: { user }, error } = await supabase.auth.getUser();
      if (cancelled || error || !user || user.id !== sessionUserId) return;

      // This is an ordinary RLS-governed client query, never service_role.
      const { data: profile } = await supabase
        .from("profiles")
        .select("role,account_status")
        .eq("id", user.id)
        .maybeSingle();

      if (cancelled || profile?.account_status === "banned") return;
      setIdentity({
        signedIn: true,
        role: isRole(profile?.role) ? profile.role : null,
      });
    }

    void resolveNavigation();
    return () => { cancelled = true; };
  }, [sessionUserId]);

  const { signedIn, role } = identity;
  const isClient = signedIn && role === "client";
  const isVa = signedIn && role === "va";
  const accountHref = isTrainingContext
    ? (signedIn ? "/workspace/training" : trainingLoginHref())
    : (signedIn ? workspaceHref(role) : "/auth/login");
  const accountLabel = isTrainingContext
    ? (signedIn ? "My learning" : "Training login")
    : (signedIn ? "My workspace" : "Log in");
  const primaryHref = isTrainingContext
    ? (signedIn ? "/workspace/training" : trainingJoinHref())
    : (isClient ? "/workspace/client/jobs/new" : isVa ? "/jobs" : "/hire");
  const primaryLabel = isTrainingContext
    ? (signedIn ? "Continue training" : "Start free training")
    : (isClient ? "Post a job" : isVa ? "Browse VA jobs" : "Hire a Virtual Assistant");

  return (
    <>
      <Link
        className="va-nav-account-login"
        href={accountHref}
        {...(isTrainingContext ? { "data-track": "training_login_click" } : {})}
      >
        {accountLabel}
      </Link>

      <Link
        className={isTrainingContext
          ? "btn btn-primary desktop-hire-cta training-header-cta"
          : "btn btn-primary desktop-hire-cta header-hire-cta"}
        href={primaryHref}
        {...(isTrainingContext
          ? { "data-track": "training_account_click", "data-cta-position": "header" }
          : !isClient && !isVa
            ? { "data-track": "header_hire_virtual_assistant" }
            : {})}
      >
        {primaryLabel} {isTrainingContext ? <ArrowRight size={14} aria-hidden="true" /> : null}
      </Link>

      <details className="va-mobile-drawer">
        <summary className="btn" aria-label="Navigation menu">
          <Menu size={18} aria-hidden="true" /><span>Menu</span>
        </summary>
        <nav className="va-mobile-panel" aria-label="Mobile navigation">
          <Link
            className="mobile-menu-primary"
            href={primaryHref}
            {...(isTrainingContext
              ? { "data-track": "training_account_click", "data-cta-position": "mobile_menu" }
              : {})}
          >
            {primaryLabel}
          </Link>
          <Link href="/find-talent">Find a VA</Link>
          <Link href="/services">Services</Link>
          <Link href="/industries">Industries</Link>
          <Link href="/software">Software</Link>
          <Link className="va-mobile-jobs-link" href="/jobs">Jobs</Link>
          <span className="va-mobile-panel-label">Virtual Assistants</span>
          <Link href="/training">Free VA Training</Link>
          <Link href="/for-virtual-assistants">For Virtual Assistants</Link>
          {!isTrainingContext && !signedIn ? (
            <Link href="/auth/join/va">Apply as a Virtual Assistant</Link>
          ) : null}
          <span className="va-mobile-panel-label">Account</span>
          <Link
            href={accountHref}
            {...(isTrainingContext ? { "data-track": "training_login_click" } : {})}
          >
            {accountLabel}
          </Link>
        </nav>
      </details>
    </>
  );
}
